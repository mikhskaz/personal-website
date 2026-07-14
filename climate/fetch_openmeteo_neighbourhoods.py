"""Download daily historical air temperature for Toronto neighbourhoods.

The output is a tidy CSV with one row per neighbourhood and date. Coordinates
are area-weighted centroids calculated from the 158-neighbourhood GeoJSON.
Open-Meteo's ERA5-Land model is selected explicitly so the 2014-2024 time
series uses one consistent reanalysis dataset.
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path


API_URL = "https://archive-api.open-meteo.com/v1/archive"
DAILY_FIELDS = (
    "temperature_2m_mean",
    "temperature_2m_min",
    "temperature_2m_max",
)


def ring_centroid(ring):
    """Return (longitude, latitude, unsigned area) for a linear ring."""
    twice_area = cx = cy = 0.0
    for (x1, y1), (x2, y2) in zip(ring, ring[1:]):
        cross = x1 * y2 - x2 * y1
        twice_area += cross
        cx += (x1 + x2) * cross
        cy += (y1 + y2) * cross
    if abs(twice_area) < 1e-12:
        return ring[0][0], ring[0][1], 0.0
    return cx / (3 * twice_area), cy / (3 * twice_area), abs(twice_area) / 2


def geometry_centroid(geometry):
    """Area-weight the exterior-ring centroids of a Polygon/MultiPolygon."""
    polygons = (
        [geometry["coordinates"]]
        if geometry["type"] == "Polygon"
        else geometry["coordinates"]
    )
    weighted_x = weighted_y = total_area = 0.0
    for polygon in polygons:
        x, y, area = ring_centroid(polygon[0])
        weighted_x += x * area
        weighted_y += y * area
        total_area += area
    if total_area == 0:
        raise ValueError("Cannot calculate centroid for zero-area geometry")
    return weighted_y / total_area, weighted_x / total_area


def load_neighbourhoods(path):
    data = json.loads(path.read_text(encoding="utf-8"))
    neighbourhoods = []
    for feature in data["features"]:
        props = feature["properties"]
        latitude, longitude = geometry_centroid(feature["geometry"])
        neighbourhoods.append(
            {
                "neighbourhood_id": int(props["AREA_SHORT_CODE"]),
                "neighbourhood": props["AREA_NAME"].strip(),
                "latitude": round(latitude, 6),
                "longitude": round(longitude, 6),
            }
        )
    return sorted(neighbourhoods, key=lambda row: row["neighbourhood_id"])


def fetch_batch(batch, start_date, end_date, retries=5):
    params = {
        "latitude": ",".join(str(row["latitude"]) for row in batch),
        "longitude": ",".join(str(row["longitude"]) for row in batch),
        "start_date": start_date,
        "end_date": end_date,
        "daily": ",".join(DAILY_FIELDS),
        "timezone": "America/Toronto",
        "models": "era5_land",
        "temperature_unit": "celsius",
    }
    request = urllib.request.Request(
        f"{API_URL}?{urllib.parse.urlencode(params)}",
        headers={"User-Agent": "Crisis-and-Canopy-data-pipeline/1.0"},
    )
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(request, timeout=120) as response:
                payload = json.load(response)
            return payload if isinstance(payload, list) else [payload]
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError):
            if attempt == retries - 1:
                raise
            time.sleep(2 ** attempt)


def response_rows(neighbourhood, response):
    daily = response["daily"]
    lengths = {len(daily["time"]), *(len(daily[field]) for field in DAILY_FIELDS)}
    if len(lengths) != 1:
        raise ValueError(f"Mismatched daily arrays for {neighbourhood['neighbourhood']}")
    for values in zip(daily["time"], *(daily[field] for field in DAILY_FIELDS)):
        yield {
            **neighbourhood,
            "date": values[0],
            "temperature_2m_mean_c": values[1],
            "temperature_2m_min_c": values[2],
            "temperature_2m_max_c": values[3],
            "model": "ERA5-Land",
        }


def parse_args():
    here = Path(__file__).resolve().parent
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--boundaries",
        type=Path,
        default=here / "Neighbourhoods - 4326.geojson",
    )
    parser.add_argument("--start-date", default="2014-01-01")
    parser.add_argument("--end-date", default="2024-12-31")
    parser.add_argument(
        "--output",
        type=Path,
        default=here / "neighbourhood_air_temperature_2014_2024.csv",
    )
    parser.add_argument("--batch-size", type=int, default=20)
    parser.add_argument("--limit", type=int, help="Fetch only the first N neighbourhoods")
    return parser.parse_args()


def main():
    args = parse_args()
    if args.batch_size < 1:
        raise SystemExit("--batch-size must be at least 1")
    neighbourhoods = load_neighbourhoods(args.boundaries)
    if args.limit is not None:
        neighbourhoods = neighbourhoods[: args.limit]
    if not neighbourhoods:
        raise SystemExit("No neighbourhoods found")

    args.output.parent.mkdir(parents=True, exist_ok=True)
    temporary = args.output.with_suffix(args.output.suffix + ".part")
    fieldnames = [
        "neighbourhood_id",
        "neighbourhood",
        "latitude",
        "longitude",
        "date",
        "temperature_2m_mean_c",
        "temperature_2m_min_c",
        "temperature_2m_max_c",
        "model",
    ]
    written = 0
    try:
        with temporary.open("w", newline="", encoding="utf-8") as output:
            writer = csv.DictWriter(output, fieldnames=fieldnames)
            writer.writeheader()
            batches = math.ceil(len(neighbourhoods) / args.batch_size)
            for offset in range(0, len(neighbourhoods), args.batch_size):
                batch = neighbourhoods[offset : offset + args.batch_size]
                number = offset // args.batch_size + 1
                print(f"Fetching batch {number}/{batches} ({len(batch)} neighbourhoods)...")
                responses = fetch_batch(batch, args.start_date, args.end_date)
                if len(responses) != len(batch):
                    raise ValueError(
                        f"Open-Meteo returned {len(responses)} locations for a batch of {len(batch)}"
                    )
                for neighbourhood, response in zip(batch, responses):
                    rows = list(response_rows(neighbourhood, response))
                    writer.writerows(rows)
                    written += len(rows)
                output.flush()
    except Exception:
        temporary.unlink(missing_ok=True)
        raise

    temporary.replace(args.output)
    print(f"Wrote {written:,} rows for {len(neighbourhoods)} neighbourhoods to {args.output}")


if __name__ == "__main__":
    main()
