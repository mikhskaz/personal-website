"""
Annual summer land-surface temperature per Toronto neighbourhood, from Landsat
Collection 2 Level-2 (30 m), via Google Earth Engine.

Output: neighbourhood_lst.csv
        (name, year, lst_c, city_lst_c, temp_diff_c, pixel_count, scene_count)
        -> build_app_data.py writes yearly_lst_c and yearly_temp_diff arrays to
           every GeoJSON feature, aligned with annual call counts for 2014–2024.

ONE-TIME SETUP
--------------
1. Create a free Earth Engine account (non-commercial / research):
       https://earthengine.google.com/  ->  "Get Started" (sign in, register a
       Cloud project; the default no-cost project is fine).
2. Install the client into the project venv:
       ./venv/Scripts/python -m pip install earthengine-api
3. Authenticate once (opens a browser):
       ./venv/Scripts/earthengine authenticate
4. Run:
       ./venv/Scripts/python gee_landsat_lst.py --project YOUR_GEE_PROJECT_ID
   (or set the env var GEE_PROJECT; if you registered a default project you can
    omit it and ee will pick it up.)

Why Landsat: at 30 m it actually resolves the within-city heat-island contrast
across the 158 neighbourhoods (MODIS at 1 km blurs the small downtown ones).
"""
import argparse
import csv
import json
import os
import sys
from pathlib import Path

import ee

ROOT = Path(__file__).resolve().parent
NB_GEOJSON = ROOT / "Neighbourhoods - 4326.geojson"
OUT_CSV = ROOT / "neighbourhood_lst.csv"

SUMMER = (6, 8)          # June–August (JJA)
MAX_CLOUD = 60           # per-scene % cloud cover filter


def build_neighbourhoods():
    gj = json.load(open(NB_GEOJSON, encoding="utf-8"))
    feats = [
        ee.Feature(ee.Geometry(f["geometry"]), {"name": f["properties"]["AREA_NAME"].strip()})
        for f in gj["features"]
    ]
    return ee.FeatureCollection(feats)


def prep(img):
    """Cloud/shadow-mask a Landsat C2 L2 scene and return LST in °C."""
    qa = img.select("QA_PIXEL")
    # QA_PIXEL bits: 0 fill, 1 dilated cloud, 2 cirrus, 3 cloud,
    # 4 cloud shadow, 5 snow. QA_RADSAT removes saturated observations.
    # Do not hard-threshold ST_QA uncertainty: a 2 K cutoff removed most of
    # Toronto in several years. The annual multi-scene mean plus the official
    # cloud masks provides much better spatial/temporal coverage.
    mask = qa.bitwiseAnd(sum(1 << bit for bit in range(6))).eq(0)
    mask = mask.And(img.select("QA_RADSAT").eq(0))
    # ST_B10 -> Kelvin: DN*0.00341802 + 149.0 ; then -273.15 -> Celsius
    lst = img.select("ST_B10").multiply(0.00341802).add(149.0).subtract(273.15).rename("lst_c")
    return lst.updateMask(mask)


def summer_collection(cid, nb, year):
    return (
        ee.ImageCollection(cid)
        .filterBounds(nb)
        .filterDate(f"{year}-{SUMMER[0]:02d}-01", f"{year}-{SUMMER[1] + 1:02d}-01")
        .filter(ee.Filter.eq("PROCESSING_LEVEL", "L2SP"))
        .filter(ee.Filter.lt("CLOUD_COVER", MAX_CLOUD))
        .map(prep)
    )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", default=os.environ.get("GEE_PROJECT"))
    ap.add_argument("--start-year", type=int, default=2014)
    ap.add_argument("--end-year", type=int, default=2024)
    ap.add_argument(
        "--scale",
        type=int,
        default=30,
        help="Reduction scale in metres (default: Landsat's native 30 m)",
    )
    args = ap.parse_args()
    if args.start_year > args.end_year:
        ap.error("--start-year must be <= --end-year")

    try:
        ee.Initialize(project=args.project) if args.project else ee.Initialize()
    except Exception as e:
        print("Earth Engine init failed.", e)
        print("Run `earthengine authenticate` first, and pass --project YOUR_PROJECT_ID.")
        sys.exit(1)

    nb = build_neighbourhoods()
    city_geometry = nb.geometry()
    rows = []
    neighbourhood_count = len(
        json.load(open(NB_GEOJSON, encoding="utf-8"))["features"]
    )
    expected = neighbourhood_count * (args.end_year - args.start_year + 1)

    print(
        f"Computing {args.start_year}–{args.end_year} annual JJA composites "
        f"at {args.scale} m on Earth Engine…"
    )
    for year in range(args.start_year, args.end_year + 1):
        # Landsat 8 (2013–) + Landsat 9 (late 2021–) increase observation
        # density while preserving the same sensor family and overpass timing.
        col = summer_collection("LANDSAT/LC08/C02/T1_L2", nb, year).merge(
            summer_collection("LANDSAT/LC09/C02/T1_L2", nb, year)
        )
        scene_count = int(col.size().getInfo())
        if scene_count == 0:
            print(f"  {year}: no qualifying scenes; leaving this year empty")
            continue

        annual_lst = col.mean().select("lst_c")
        reducer = ee.Reducer.mean().combine(
            reducer2=ee.Reducer.count(), sharedInputs=True
        )
        reduced = annual_lst.reduceRegions(
            collection=nb,
            reducer=reducer,
            scale=args.scale,
            tileScale=4,
        )
        city_stats = annual_lst.reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=city_geometry,
            scale=args.scale,
            maxPixels=1_000_000_000,
            tileScale=4,
        ).getInfo()
        city_value = city_stats.get("lst_c")
        if city_value is None:
            print(f"  {year}: city mean unavailable; leaving this year empty")
            continue
        city_value = float(city_value)

        features = reduced.getInfo()["features"]
        year_rows = 0
        for feature in features:
            props = feature["properties"]
            value = props.get("mean")
            if value is None:
                continue
            value = float(value)
            rows.append(
                {
                    "name": props["name"],
                    "year": year,
                    "lst_c": round(value, 2),
                    "city_lst_c": round(city_value, 2),
                    "temp_diff_c": round(value - city_value, 2),
                    "pixel_count": int(props.get("count") or 0),
                    "scene_count": scene_count,
                }
            )
            year_rows += 1
        print(
            f"  {year}: {year_rows}/{len(features)} neighbourhoods, "
            f"{scene_count} scenes, city mean {city_value:.2f} °C"
        )

    rows.sort(key=lambda row: (row["name"], row["year"]))

    with open(OUT_CSV, "w", newline="", encoding="utf-8") as fh:
        fields = [
            "name",
            "year",
            "lst_c",
            "city_lst_c",
            "temp_diff_c",
            "pixel_count",
            "scene_count",
        ]
        writer = csv.DictWriter(fh, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)

    values = [row["lst_c"] for row in rows]
    print(
        f"Wrote {OUT_CSV.name}: {len(rows)}/{expected} available "
        "neighbourhood-year observations"
    )
    if values:
        print(
            f"  annual summer LST °C  min {min(values):.1f}  "
            f"max {max(values):.1f}  range {max(values)-min(values):.1f}"
        )
    print("Next: ./venv/Scripts/python build_app_data.py  &&  (cd toronto-app && npm run build)")


if __name__ == "__main__":
    main()
