"""Reliably pull 2014-2024 Open-Meteo air temperature for 158 neighbourhoods.

Requests are made one location at a time to stay within the public API's
request-size and per-minute limits. Every successful location is cached, so a
stopped run resumes without downloading it again.
"""

from __future__ import annotations

import csv
import json
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

from fetch_openmeteo_neighbourhoods import DAILY_FIELDS, API_URL, load_neighbourhoods, response_rows


ROOT = Path(__file__).resolve().parent
START_DATE = "2014-01-01"
END_DATE = "2024-12-31"
CACHE = ROOT / "openmeteo_neighbourhood_cache"
OUTPUT = ROOT / "neighbourhood_air_temperature_2014_2024.csv"


def existing_responses():
    """Load both earlier grouped caches and canonical one-location caches."""
    found = {}
    prefix = f"{START_DATE}_{END_DATE}_"
    if not CACHE.exists():
        return found
    for path in CACHE.glob(f"{prefix}*.json"):
        id_text = path.stem.removeprefix(prefix)
        try:
            ids = [int(value) for value in id_text.split("-")]
            payload = json.loads(path.read_text(encoding="utf-8"))
            responses = payload if isinstance(payload, list) else [payload]
            if len(ids) == len(responses):
                found.update(zip(ids, responses))
        except (ValueError, json.JSONDecodeError):
            continue
    return found


def request_location(neighbourhood):
    params = {
        "latitude": neighbourhood["latitude"],
        "longitude": neighbourhood["longitude"],
        "start_date": START_DATE,
        "end_date": END_DATE,
        "daily": ",".join(DAILY_FIELDS),
        "timezone": "America/Toronto",
        "models": "era5_land",
        "temperature_unit": "celsius",
    }
    request = urllib.request.Request(
        f"{API_URL}?{urllib.parse.urlencode(params)}",
        headers={"User-Agent": "Crisis-and-Canopy-data-pipeline/1.0"},
    )
    while True:
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                return json.load(response)
        except urllib.error.HTTPError as error:
            if error.code != 429:
                raise
            print("  Rate limited; cooling down for 60 seconds...", flush=True)
            time.sleep(60)
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as error:
            print(f"  Transient request failure ({error}); retrying in 15 seconds...", flush=True)
            time.sleep(15)


def main():
    neighbourhoods = load_neighbourhoods(ROOT / "Neighbourhoods - 4326.geojson")
    CACHE.mkdir(parents=True, exist_ok=True)
    responses = existing_responses()
    print(f"Resuming with {len(responses)}/{len(neighbourhoods)} locations cached.", flush=True)

    for index, neighbourhood in enumerate(neighbourhoods, 1):
        code = neighbourhood["neighbourhood_id"]
        if code in responses:
            continue
        print(f"Fetching {index}/{len(neighbourhoods)}: {neighbourhood['neighbourhood']}", flush=True)
        payload = request_location(neighbourhood)
        responses[code] = payload
        cache = CACHE / f"{START_DATE}_{END_DATE}_{code}.json"
        part = cache.with_suffix(".json.part")
        part.write_text(json.dumps(payload), encoding="utf-8")
        part.replace(cache)
        time.sleep(5)

    fields = [
        "neighbourhood_id", "neighbourhood", "latitude", "longitude", "date",
        "temperature_2m_mean_c", "temperature_2m_min_c", "temperature_2m_max_c", "model",
    ]
    part = OUTPUT.with_suffix(".csv.part")
    written = 0
    with part.open("w", newline="", encoding="utf-8") as output:
        writer = csv.DictWriter(output, fieldnames=fields)
        writer.writeheader()
        for neighbourhood in neighbourhoods:
            for row in response_rows(neighbourhood, responses[neighbourhood["neighbourhood_id"]]):
                writer.writerow(row)
                written += 1
    part.replace(OUTPUT)
    print(f"Wrote {written:,} rows to {OUTPUT}", flush=True)


if __name__ == "__main__":
    main()
