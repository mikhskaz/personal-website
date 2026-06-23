# DATA.md — Data Inventory & Reference

> Consolidated reference for all datasets in this project (CSC495 Climate / Toronto heat & crisis vulnerability).
> Built so future sessions don't have to re-review raw data. Verify file existence before relying on a path; do not re-derive what's here unless something looks stale.

**Project goal (from README):** Use shapefiles to build an explorable map of Toronto integrating all data sources below. Spectral/heat equations reference: <https://storymaps.arcgis.com/stories/e3f84768c41e44d7b756611eabebf073>.

---

## Quick index

| Dataset | Location | Format | Geographic unit | Join key |
|---|---|---|---|---|
| Persons in Crisis (PIC) calls | `Persons_in_Crisis_..._3801289854217715978.csv` | CSV | Neighbourhood (158 & 140) | `HOOD_158` / `HOOD_140` |
| Mental Health Act (MHA) apprehensions | `Mental_Health_Act_..._8371563523426242708.csv` | CSV | Neighbourhood (158 & 140) | `HOOD_158` / `HOOD_140` |
| Neighbourhood boundaries (158) | `Neighbourhoods - 4326.geojson` (web) / `Neighbourhoods - 4326/` (shp) | GeoJSON + Shapefile (WGS84) | Neighbourhood | `AREA_SHORT_CODE` ↔ `HOOD_158`; **name** ↔ TESA |
| Tree Equity Score (TESA) + canopy | `tesa_toronto_geojson/` (web) / `tesa_toronto_shp/` (shp) | GeoJSON + Shapefile (WGS84) | Census tract | `DGUID`; to nbhd by **`neighbourh` name** |
| Heat Vulnerability inputs | `Toronto_Heat_Vulnerability-main/input_data/` | Shapefiles + dbf | Dissemination Area (DA) | `DAUID` |
| Heat Vulnerability results | `Toronto_Heat_Vulnerability-main/Results/` | Shapefiles (zipped) + PNG/MXD | Dissemination Area | `DAUID` |
| Seasonal crisis charts | `charts/` + `seasonal_charts.py` | PNG + Python | — | — |

**CRS note:** Neighbourhoods and TESA shapefiles are geographic **WGS84 (EPSG:4326)**. The Heat Vulnerability DA boundary (`Clean_DA`) is projected **WGS84 / UTM Zone 17N (meters)** — reproject before overlaying with the 4326 layers.

---

## 1. Toronto Police Service open data (CSV)

Both cover **2014 → 2026** (years present run 2014–2026). Neighbourhood codes use both the 158-neighbourhood (2022) and 140-neighbourhood (legacy) systems. `NSA` = "Not Specified/Available".

### 1a. Persons in Crisis — `Persons_in_Crisis_Calls_for_Service_Attended_Open_Data_3801289854217715978.csv`
- **357,697 rows** (1 header).
- Columns: `OBJECTID, EVENT_ID, EVENT_DATE, EVENT_YEAR, EVENT_MONTH, EVENT_DOW, EVENT_HOUR, EVENT_TYPE, DIVISION, OCCURRENCE_CREATED, APPREHENSION_MADE, MCIT_ATTEND, HOOD_158, NEIGHBOURHOOD_158, HOOD_140, NEIGHBOURHOOD_140`
- `EVENT_TYPE` distribution: **Person in Crisis** 202,150 · **Suicide-related** 114,495 · **Overdose** 41,052.
- `APPREHENSION_MADE`, `MCIT_ATTEND` (Mobile Crisis Intervention Team) are Yes/No flags.

### 1b. Mental Health Act Apprehensions — `Mental_Health_Act_Apprehensions_Open_Data_8371563523426242708.csv`
- **134,457 rows** (1 header).
- Columns: `OBJECTID, EVENT_UNIQUE_ID, REPORT_DATE, REPORT_YEAR, REPORT_MONTH, REPORT_DOW, REPORT_DOY, REPORT_DAY, REPORT_HOUR, OCC_DATE, OCC_YEAR, OCC_MONTH, OCC_DOY, OCC_DAY, OCC_DOW, OCC_HOUR, DIVISION, PREMISES_TYPE, APPREHENSION_TYPE, SEX, AGE_COHORT, HOOD_158, NEIGHBOURHOOD_158, HOOD_140, NEIGHBOURHOOD_140`
- `APPREHENSION_TYPE` distribution: Sec 17 Power of App 106,778 · Sec 15 Form 1 10,887 · Sec 16 Form 2 9,239 · Sec 33.4 Form 47 CTO 5,926 · Sec 28(1) Form 9 Elopee 1,627.
- Has both `REPORT_*` and `OCC_*` (occurrence) date fields, plus `SEX` and `AGE_COHORT`.

> Both files are UTF-8 with a BOM on the first column header. Dates look like `1/1/2014 5:00:00 AM`.

---

## 2. Neighbourhood boundaries — `Neighbourhoods - 4326.geojson` (+ `Neighbourhoods - 4326/` shp)
- **GeoJSON** `Neighbourhoods - 4326.geojson` (~2.1 MB) is the **web-map canonical layer**: FeatureCollection, **158 features**, MultiPolygon, CRS = OGC:CRS84 (= WGS84 lon/lat). Shapefile set (`.shp/.shx/.dbf/.prj/.cpg`) is the same geography for desktop GIS.
- This is the **158-neighbourhood (2022)** boundary set used to map the TPS CSVs.
- Attribute fields (11): `_id, AREA_ID, AREA_ATTR_ID, PARENT_AREA_ID, AREA_SHORT_CODE, AREA_LONG_CODE, AREA_NAME, AREA_DESC, CLASSIFICATION, CLASSIFICATION_CODE, OBJECTID`. (`AREA_SHORT_CODE` e.g. `174`; `AREA_NAME` e.g. `South Eglinton-Davisville`.)
- **Join to TPS:** `AREA_SHORT_CODE` ↔ TPS `HOOD_158`; `AREA_NAME` ↔ `NEIGHBOURHOOD_158`.
- **Join to TESA — use NAME, not id.** Verified: `AREA_NAME` ↔ TESA `neighbourh` matches **158/158**. The numeric `AREA_SHORT_CODE` ↔ TESA `nghbrhd_id` only matches **69/158** (TESA used its own numbering for ~89 neighbourhoods even though names are identical). Always crosswalk TESA→neighbourhood on the name string.

---

## 3. Tree Equity Score / canopy — `tesa_toronto_geojson/` (+ `tesa_toronto_shp/`)
- **GeoJSON** `tesa_toronto_geojson/tesa_toronto_tes.geojson` (~1.7 MB) is web-map canonical: FeatureCollection, **585 features** (census tracts), Polygon, CRS = OGC:CRS84 (WGS84). Shapefile set is the same for desktop GIS. Full field docs in `*/data_dictionary.txt`. Source/methodology: <https://www.treeequityscore.org/analyzer/toronto>.
- **GeoJSON field names differ slightly from the shapefile data_dictionary** (the geojson names are authoritative for the map): adds `county`; uses `dep_perc` (no `dep_ratio`), `depratnorm`, and `health_nor` (vs `healthnorm` in the dict). 29 properties total.
- Key fields:
  - `DGUID` — Canada census tract id (primary key).
  - `population` (2021 Census), `land_area` (km²).
  - `treecanopy` (0–1), `tc_goal`, `tc_gap` (goal − canopy), `priority_i`.
  - `tes` — **Tree Equity Score 0–100** (tract); `tesctyscor` — locality composite; `nghb_score` — neighbourhood TES.
  - Equity/demographic (all normalized variants `*norm` exist): `pctpoc` (people of colour), `pctpov` (low income LIM-AT), `unemplrate`, `dep_ratio`/`dep_perc` (dependency: children+seniors / 15–64), `child_perc`, `seniorperc`, `linguistic` (neither EN nor FR), `healthnorm`.
  - `temp_diff` / `temp_norm` — tract heat extremity vs urban average.
  - `neighbourh`, `nghbrhd_id` — name/id of the **2022 158-neighbourhood** the tract sits in (links to §2 and TPS `HOOD_158`); `nghb_score` neighbourhood TES.

---

## 4. Toronto Heat Vulnerability project — `Toronto_Heat_Vulnerability-main/`

A heat-vulnerability index (HVI) study at **Dissemination Area (DA)** level. Folder structure (see its own `README.md`):

- `process_Modis/` — scripts to process MODIS MOD11A1 land-surface-temperature imagery into heat degree days. Files: `pre_process_modis.py`, `process.py`, `calculate_degree_day.py`, `generate_10year_degree_day.ipynb`.
- `principal_component_analysis/` — Jupyter notebooks building the HVI: `Census_preprocess.ipynb`, `PCA_process.ipynb`, `PCA_HVI_process.ipynb`, `Equal_weight_index.ipynb`, `Quertile_comparsion.ipynb`, `Compare_tower_communities.ipynb`, `Appendix_FigureA1.ipynb`.
- `input_data/` — pre-processed model inputs (see §4a).
- `Results/` — derived HVI shapefiles (zipped) + map PNG/MXD (see §4b).

### 4a. `input_data/` (full provenance in `input_data/ReadMe.md`)
All DA-level, joined on **`DAUID`**.

| Item | Contents | Source |
|---|---|---|
| `Toronto_DA_boundary/` (`Clean_DA.shp`) | DA boundaries clipped to Toronto. **CRS = UTM Zone 17N (meters).** | StatCan 92-169-X, clipped to City of Toronto |
| `access_cool_centers/` (`access_cool`) | Avg Euclidean distance per DA to nearest cooling centre | Toronto Open Data: heat-relief network |
| `access_hospital/` | Avg distance per DA to nearest hospital | geo2.scholarsportal.info |
| `canopy_cover/` | % tree canopy per DA | Toronto Open Data: forest & land cover |
| `impervious_percentage/` | % impervious surface per DA | Toronto Open Data: impermeable surface |
| `exposure(degree_day_20)/` | Heat exposure = degree-days above 20 °C, JJA 2010–2019 | MODIS MOD11A1 via NASA LAADS, processed in `process_Modis/` |
| `Toronto_census.dbf` + `census_header.txt` | **2016 Census** profile per DA (cols COL0–COL32) | CHASS Census Analyser (UofT) |

`census_header.txt` maps COL0 (GEO UID/DAUID) → COL32. Includes population & density, age groups (0–14, 65+, 15–64), low-income (LIM-AT), education, dwelling period of construction (incl. "1960 or before"), housing suitability, unemployment, citizenship, Aboriginal identity, visible minority, official-language knowledge, persons not in census families.

### 4b. `Results/` (see `Results/Readme.md`)
Zipped derived shapefiles, each an index/cluster layer at DA level:
- `sensitivity_equal_weight.zip`, `sensitivity_pca.zip` — Sensitivity indices (census + landcover), two methods.
- `adaptive_equal_weight.zip`, `adaptive_capacity_pca.zip` — Adaptive capacity (census + accessibility).
- `equal_vuln_index.zip`, `pca_vuln_index.zip` — Final Heat Vulnerability Index (sensitivity + adaptive + exposure).
- `equal_weight_cluster.zip`, `pca_cluster.zip` — Cluster/outlier analysis (Anselin Local Moran's I, ArcGIS).
- `Maps/` — rendered PNGs + ArcGIS `.mxd` projects (`Heat_vuln_equalweight.png`, `Heat_vuln_pca.mxd`, `equalweight_adaptive.png`, `equalweight_sensitivity.png`, `equalweight_vuln_cluster.png`, `pca_adaptive.png`, `pca_sensitivity.png`, `pca_vuln_cluster.mxd`).

**Two HVI methodologies throughout:** *equal-weight* vs *PCA-derived*.

---

## 5. Analysis already built — `seasonal_charts.py` + `charts/`
- `seasonal_charts.py` computes a **seasonal index** (100 = each call type's annual average) for PIC calls, full years **2014–2024** only, and renders three figures into `charts/`:
  - `seasonal_small_multiples.png` — one panel per event type (peak month annotated).
  - `seasonal_combined.png` — all three lines overlaid (timing comparison).
  - `seasonal_heatmap.png` — month × type grid, diverging scale centered at 100.
- Run with the project `venv` (pandas/matplotlib/numpy). Reads the PIC CSV by relative path.
- Finding it surfaces: Person in Crisis & Suicide-related peak ~May; Overdose peaks ~August.

---

## 6. External APIs / references (not yet integrated)
- **Environment Canada climate stations:** `https://api.weather.gc.ca/collections/climate-stations/items?limit=100&offset=0&STATION_NAME=TORONTO` — OGC API Features (GeoJSON), filter by `STATION_NAME`. README TODO: figure out how to use for Toronto station climate data.
- **Spectral/heat equations:** <https://storymaps.arcgis.com/stories/e3f84768c41e44d7b756611eabebf073>.

---

## Notes / gotchas
- `venv/` is the Python virtual environment — ignore its bundled test CSVs (numpy/matplotlib sample data) when searching for project data.
- Mixed CRS: reproject the UTM Zone 17N DA boundary (and anything joined to it) to EPSG:4326 to combine with neighbourhood/TESA layers for a unified Toronto map.
- Three nesting geographies in play: **Dissemination Area** (`DAUID`, heat study) ⊂ **Census tract** (`DGUID`, TESA) and **Neighbourhood-158** (`HOOD_158`/`AREA_SHORT_CODE`/`nghbrhd_id`, TPS + TESA crosswalk). TESA's `nghbrhd_id` is the bridge from tract-level data to the 158-neighbourhood TPS data.
