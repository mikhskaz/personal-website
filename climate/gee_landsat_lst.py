"""
Real summer land-surface temperature per Toronto neighbourhood, from Landsat
Collection 2 Level-2 (30 m), via Google Earth Engine.

Output: neighbourhood_lst.csv  (columns: name, lst_c)
        -> build_app_data.py auto-merges it and the app's Heat layer upgrades
           from the TESA temp_diff proxy to real satellite LST.

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

YEARS = (2014, 2024)
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
    # QA_PIXEL bits: 1 dilated cloud, 2 cirrus, 3 cloud, 4 cloud shadow
    mask = qa.bitwiseAnd((1 << 1) | (1 << 2) | (1 << 3) | (1 << 4)).eq(0)
    # ST_B10 -> Kelvin: DN*0.00341802 + 149.0 ; then -273.15 -> Celsius
    lst = img.select("ST_B10").multiply(0.00341802).add(149.0).subtract(273.15).rename("lst_c")
    return lst.updateMask(mask)


def summer_collection(cid, nb):
    return (
        ee.ImageCollection(cid)
        .filterBounds(nb)
        .filter(ee.Filter.calendarRange(YEARS[0], YEARS[1], "year"))
        .filter(ee.Filter.calendarRange(SUMMER[0], SUMMER[1], "month"))
        .filter(ee.Filter.lt("CLOUD_COVER", MAX_CLOUD))
        .map(prep)
    )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", default=os.environ.get("GEE_PROJECT"))
    args = ap.parse_args()

    try:
        ee.Initialize(project=args.project) if args.project else ee.Initialize()
    except Exception as e:
        print("Earth Engine init failed.", e)
        print("Run `earthengine authenticate` first, and pass --project YOUR_PROJECT_ID.")
        sys.exit(1)

    nb = build_neighbourhoods()
    # Landsat 8 (2013–) + Landsat 9 (2021–) for the densest summer record.
    col = summer_collection("LANDSAT/LC08/C02/T1_L2", nb).merge(
        summer_collection("LANDSAT/LC09/C02/T1_L2", nb)
    )
    mean_lst = col.mean()  # mean summer surface temperature, all years

    reduced = mean_lst.reduceRegions(
        collection=nb, reducer=ee.Reducer.mean(), scale=100, tileScale=4
    )

    print("Computing on Earth Engine servers… (this can take 30–90s)")
    features = reduced.getInfo()["features"]

    rows = []
    for f in features:
        props = f["properties"]
        val = props.get("mean")
        if val is not None:
            rows.append((props["name"], round(float(val), 2)))
    rows.sort()

    with open(OUT_CSV, "w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["name", "lst_c"])
        w.writerows(rows)

    vals = [v for _, v in rows]
    print(f"Wrote {OUT_CSV.name}: {len(rows)} neighbourhoods")
    if vals:
        print(f"  summer LST °C  min {min(vals):.1f}  max {max(vals):.1f}  range {max(vals)-min(vals):.1f}")
    print("Next: ./venv/Scripts/python build_app_data.py  &&  (cd toronto-app && npm run build)")


if __name__ == "__main__":
    main()
