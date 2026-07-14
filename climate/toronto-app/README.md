# Crisis & Canopy — interactive Toronto atlas

A scrollytelling React app that maps Toronto's 158 neighbourhoods to explore how
mental-health crisis calls line up with summer heat, tree canopy, and poverty.
It evolves the original **STORYBOARD.md** design into the evidence-led flow documented below.

## Run it

```bash
cd toronto-app
npm install
npm run dev        # http://localhost:5173
```

Build a static bundle: `npm run build` → `dist/` (deployable to GitHub Pages,
Netlify, any static host; `base: './'` keeps paths relative).

## Regenerating the data

The app reads three pre-built static files from `public/data/`. They are produced
by a Python script in the project root (uses the project `venv`):

```bash
cd ..
./venv/Scripts/python build_app_data.py
```

This reads the Toronto Police PIC calls and MHA apprehension records separately,
then joins each to neighbourhood boundaries (`HOOD_158`) and Tree Equity Score
(neighbourhood name; see `DATA.md`). MHA records are not added to the crisis-call
total. The build also pulls Toronto monthly mean air temperature from **Open-Meteo**
(ERA5, no API key; cached to `openmeteo_toronto_daily.json`). When
`neighbourhood_air_temperature_2014_2024.csv` is present, it also compacts the
daily ERA5-Land observations into monthly neighbourhood means for each full
calendar year in Section 3. The pipeline writes:

The mapped layers intentionally display their source years: crisis calls cover
**2014–2024** (rates use **2021 Census** population), tree canopy is **2018**,
demographic measures are **2021 Census**, summer surface heat is **2022**, and
Tree Equity Score is the **2024 snapshot**. The environmental and equity layers
are mixed-vintage snapshots, not annual series covering the crisis-call period.

| file | contents |
|---|---|
| `neighbourhoods.geojson` | geometry + every metric, full-year and JJA counts by year/call type, monthly crisis calls and Open-Meteo air temperature by year, MHA age & sex, and annual LST |
| `seasonal.json` | city-wide seasonal index by call type + `temp_monthly` (real °C) |
| `meta.json` | headline totals, correlations, rankings |

### Optional: annual satellite surface temperature (2014–2024)

The Heat layer ships using the TESA `temp_diff` proxy. To replace it with real
30 m **Landsat** summer land-surface temperature for every neighbourhood and
year, run (after a one-time free Google Earth Engine signup +
`earthengine authenticate`):

```bash
cd ..
./venv/Scripts/python -m pip install earthengine-api
./venv/Scripts/python gee_landsat_lst.py --project YOUR_GEE_PROJECT_ID   # -> neighbourhood_lst.csv
./venv/Scripts/python build_app_data.py                                  # auto-merges it
cd toronto-app && npm run build
```

`gee_landsat_lst.py` creates one row per neighbourhood/year with absolute JJA
LST, the citywide pixel mean, the neighbourhood anomaly, valid-pixel count, and
scene count. `build_app_data.py` then writes `yearly_lst_c` and
`yearly_temp_diff` arrays alongside the existing annual call-count array in
`neighbourhoods.geojson`. All three arrays align with `meta.json.years`.

In the Correlation Studio, choosing 2014–2024 now pairs that year's calls with
that same summer's LST. “All years” uses the mean of the annual heat anomalies.
Air temperature is not satellite surface temperature; this layer is the latter,
which captures neighbourhood-scale urban heat.

## How the code maps to the storyboard

| Story chapter | Component |
|---|---|
| Optional audio hook | `components/PhoneIntro.jsx` |
| Landing question and scale | `components/Hero.jsx` |
| 01 - What the map counts | `components/CrisisPrimer.jsx` |
| 02 - Guided geographic argument | `components/ScrollyStory.jsx` + `hooks/useScrollSteps.js` |
| 03 - Seasonal context | `components/SeasonalPulse.jsx` |
| 04 - Local case studies | `components/BoroughProfiles.jsx` |
| 05 - Correlation and interpretation | `components/CorrelationStudio.jsx` |
| 06 - Open exploration | `components/MapExplorer.jsx` |
| Neighbourhood drill-down | `components/NeighbourhoodPanel.jsx` |
| Shared map and legend | `components/ChoroplethMap.jsx`, `components/Legend.jsx` |

The map is a dependency-light **D3-projected SVG choropleth** (no map tiles, no API
keys, works offline). Selection state is lifted to `App.jsx` so clicking a
neighbourhood anywhere opens the same drill-down panel.

## Stack

React 18 + Vite + D3 (geo projection, scales, interpolators). Fonts: Fraunces /
Hanken Grotesk / JetBrains Mono. No backend — all data is static and pre-joined.
