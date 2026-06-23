# Crisis & Canopy — interactive Toronto atlas

A scrollytelling React app that maps Toronto's 158 neighbourhoods to explore how
mental-health crisis calls line up with summer heat, tree canopy, and poverty.
It implements the **STORYBOARD.md** design as working software.

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

This joins the Toronto Police PIC/MHA CSVs → neighbourhood boundaries (on
`HOOD_158`) → Tree Equity Score (on neighbourhood **name** — see DATA.md for why
name, not id), pulls Toronto's monthly mean air temperature from **Open-Meteo**
(ERA5, no API key; cached to `openmeteo_toronto_daily.json`), and writes:

| file | contents |
|---|---|
| `neighbourhoods.geojson` | geometry + every metric, per-type / yearly / monthly crisis, MHA age & sex (+ `lst_c` if satellite LST present) |
| `seasonal.json` | city-wide seasonal index by call type + `temp_monthly` (real °C) |
| `meta.json` | headline totals, correlations, rankings |

### Optional: real satellite surface temperature (upgrades the Heat layer)

The Heat layer ships using the TESA `temp_diff` proxy. To replace it with real
30 m **Landsat** summer land-surface temperature per neighbourhood, run (after a
one-time free Google Earth Engine signup + `earthengine authenticate`):

```bash
cd ..
./venv/Scripts/python -m pip install earthengine-api
./venv/Scripts/python gee_landsat_lst.py --project YOUR_GEE_PROJECT_ID   # -> neighbourhood_lst.csv
./venv/Scripts/python build_app_data.py                                  # auto-merges it
cd toronto-app && npm run build
```

`build_app_data.py` detects `neighbourhood_lst.csv` and folds the satellite LST
into the Heat layer automatically — no frontend changes needed. (`zoom.earth`-style
air temperature ≠ satellite surface temperature; this is the latter, which shows
the urban heat island. See the project notes for the distinction.)

## How the code maps to the storyboard

| Storyboard figure | Component |
|---|---|
| Fig 1 — Landing hook | `components/Hero.jsx` |
| Fig 6 — Canopy Paradox (guided story) | `components/ScrollyStory.jsx` + `hooks/useScrollSteps.js` |
| Fig 2 — Map Explorer | `components/MapExplorer.jsx` |
| Fig 3 — Neighbourhood drill-down | `components/NeighbourhoodPanel.jsx` |
| Fig 4 — Correlation Studio | `components/CorrelationStudio.jsx` |
| Fig 5 — Seasonal Pulse | `components/SeasonalPulse.jsx` |
| shared map / legend | `components/ChoroplethMap.jsx`, `components/Legend.jsx` |
| layer colour scales & field config | `lib/colors.js` |

The map is a dependency-light **D3-projected SVG choropleth** (no map tiles, no API
keys, works offline). Selection state is lifted to `App.jsx` so clicking a
neighbourhood anywhere opens the same drill-down panel.

## Stack

React 18 + Vite + D3 (geo projection, scales, interpolators). Fonts: Fraunces /
Hanken Grotesk / JetBrains Mono. No backend — all data is static and pre-joined.
