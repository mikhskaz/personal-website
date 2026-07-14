"""
Build the static data assets the React app consumes.

Outputs (to toronto-app/public/data/):
  neighbourhoods.geojson  geometry + metrics + yearly calls/LST + monthly calls + age/sex
  seasonal.json           city-wide seasonal index by call type (Fig 5)
  meta.json               headline totals, correlations, rankings (scrolly copy + Fig 4)
"""
import json
import os
from pathlib import Path
import numpy as np
import pandas as pd

ROOT = Path(".")
OUT = ROOT / "toronto-app" / "public" / "data"
OUT.mkdir(parents=True, exist_ok=True)

PIC = ROOT / "Persons_in_Crisis_Calls_for_Service_Attended_Open_Data_3801289854217715978.csv"
MHA = ROOT / "Mental_Health_Act_Apprehensions_Open_Data_8371563523426242708.csv"
NB = ROOT / "Neighbourhoods - 4326.geojson"
MASTER = ROOT / "neighbourhood_master.csv"
AIR_TEMP = ROOT / "neighbourhood_air_temperature_2014_2024.csv"
START, END = 2014, 2024
MONTHS = ["January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December"]
CALL_TYPES = ["Person in Crisis", "Suicide-related", "Overdose"]


# -------------------------------------------------- Open-Meteo summer air temperature
air_yearly_by_name = {}
air_yearly_full_by_name = {}
air_monthly_by_name = {}
air_monthly_city = {}
air_years = []
if AIR_TEMP.exists():
    air = pd.read_csv(
        AIR_TEMP,
        usecols=["neighbourhood", "date", "temperature_2m_mean_c"],
        parse_dates=["date"],
    )
    air = air[air["date"].dt.year.between(START, END)].copy()
    air["year"] = air["date"].dt.year
    air["month"] = air["date"].dt.month
    summer_air = air[air["month"].isin([6, 7, 8])]
    annual_air = summer_air.groupby(["neighbourhood", "year"])["temperature_2m_mean_c"].mean()
    annual_air_full = air.groupby(["neighbourhood", "year"])["temperature_2m_mean_c"].mean()
    for (name, year), value in annual_air.items():
        air_yearly_by_name.setdefault(str(name).strip(), {})[int(year)] = float(value)
    for (name, year), value in annual_air_full.items():
        air_yearly_full_by_name.setdefault(str(name).strip(), {})[int(year)] = float(value)
    monthly_air = air.groupby(
        ["neighbourhood", "year", "month"]
    )["temperature_2m_mean_c"].mean()
    for (name, year, month), value in monthly_air.items():
        air_monthly_by_name.setdefault(str(name).strip(), {}).setdefault(
            int(year), {}
        )[int(month)] = float(value)
    city_monthly = air.groupby(["year", "month"])["temperature_2m_mean_c"].mean()
    for (year, month), value in city_monthly.items():
        air_monthly_city.setdefault(int(year), {})[int(month)] = float(value)
    air_years = sorted(int(year) for year in air["year"].unique())
    print(
        f"  Open-Meteo summer air temperature: {len(annual_air)} neighbourhood-years "
        f"({min(air_years)}-{max(air_years)})"
    )
else:
    print(f"  {AIR_TEMP.name} not found; skipping annual air temperature")


def round_coords(obj, nd=5):
    if isinstance(obj, float):
        return round(obj, nd)
    if isinstance(obj, list):
        return [round_coords(x, nd) for x in obj]
    return obj


# -------------------------------------------------- crosswalk + master metrics
gj = json.load(open(NB, encoding="utf-8"))
master = pd.read_csv(MASTER).set_index("neighbourh")
code_to_name = {int(f["properties"]["AREA_SHORT_CODE"]): f["properties"]["AREA_NAME"].strip()
                for f in gj["features"]}

# -------------------------------------------------- PIC per-neighbourhood detail
pic = pd.read_csv(PIC)
pic = pic[(pic["EVENT_YEAR"] >= START) & (pic["EVENT_YEAR"] <= END)]
pic = pic[pic["HOOD_158"].astype(str).str.isdigit()].copy()
pic["nb"] = pic["HOOD_158"].astype(int).map(code_to_name)
pic = pic.dropna(subset=["nb"])

pic_type = pic.groupby(["nb", "EVENT_TYPE"]).size().unstack(fill_value=0)
pic_year = pic.groupby(["nb", "EVENT_YEAR"]).size().unstack(fill_value=0)
pic_type_year = pic.groupby(["nb", "EVENT_TYPE", "EVENT_YEAR"]).size()
pic_summer = pic[pic["EVENT_MONTH"].isin(["June", "July", "August"])]
pic_summer_year = pic_summer.groupby(["nb", "EVENT_YEAR"]).size()
pic_summer_type_year = pic_summer.groupby(
    ["nb", "EVENT_TYPE", "EVENT_YEAR"]
).size()
pic_month = pic.groupby(["nb", "EVENT_MONTH"]).size().unstack(fill_value=0).reindex(columns=MONTHS, fill_value=0)
pic_month_year = pic.groupby(["nb", "EVENT_YEAR", "EVENT_MONTH"]).size()

# -------------------------------------------------- MHA per-neighbourhood WHO
mha = pd.read_csv(MHA)
mha = mha[(mha["OCC_YEAR"] >= START) & (mha["OCC_YEAR"] <= END)]
mha = mha[mha["HOOD_158"].astype(str).str.isdigit()].copy()
mha["nb"] = mha["HOOD_158"].astype(int).map(code_to_name)
mha = mha.dropna(subset=["nb"])
mha_age = mha.groupby(["nb", "AGE_COHORT"]).size().unstack(fill_value=0)
mha_sex = mha.groupby(["nb", "SEX"]).size().unstack(fill_value=0)

# -------------------------------------------------- optional satellite LST
# The current exporter writes one row per neighbourhood/year. Legacy aggregate
# files (name,lst_c) remain supported so old local workflows do not break.
lst_by_name = {}
lst_diff_by_name = {}
lst_yearly_by_name = {}
lst_diff_yearly_by_name = {}
lst_years = []
lst_observations = 0
lst_mode = None
lst_csv = ROOT / "neighbourhood_lst.csv"
if lst_csv.exists():
    lst_df = pd.read_csv(lst_csv)
    name_col = "name" if "name" in lst_df.columns else lst_df.columns[0]
    val_col = next((c for c in ["lst_c", "lst", "mean"] if c in lst_df.columns), lst_df.columns[-1])
    lst_df["_name"] = lst_df[name_col].astype(str).str.strip()
    lst_df["_lst"] = pd.to_numeric(lst_df[val_col], errors="coerce")

    if "year" in lst_df.columns:
        lst_df["_year"] = pd.to_numeric(lst_df["year"], errors="coerce")
        lst_df = lst_df[
            lst_df["_year"].between(START, END)
            & lst_df["_lst"].notna()
            & lst_df["_name"].ne("")
        ].copy()
        lst_df["_year"] = lst_df["_year"].astype(int)

        # Prefer the citywide pixel mean exported by Earth Engine. The fallback
        # is an unweighted neighbourhood mean for hand-authored annual CSVs.
        fallback_diff = lst_df["_lst"] - lst_df.groupby("_year")["_lst"].transform("mean")
        if "temp_diff_c" in lst_df.columns:
            lst_df["_diff"] = pd.to_numeric(
                lst_df["temp_diff_c"], errors="coerce"
            ).fillna(fallback_diff)
        elif "city_lst_c" in lst_df.columns:
            lst_df["_diff"] = (
                lst_df["_lst"] - pd.to_numeric(lst_df["city_lst_c"], errors="coerce")
            ).fillna(fallback_diff)
        else:
            lst_df["_diff"] = fallback_diff

        annual = lst_df.groupby(["_name", "_year"], sort=True)["_lst"].mean()
        annual_diff = lst_df.groupby(["_name", "_year"], sort=True)["_diff"].mean()
        for (name, year), value in annual.items():
            lst_yearly_by_name.setdefault(name, {})[int(year)] = float(value)
        for (name, year), value in annual_diff.dropna().items():
            lst_diff_yearly_by_name.setdefault(name, {})[int(year)] = float(value)

        lst_by_name = {
            name: float(np.mean(list(values.values())))
            for name, values in lst_yearly_by_name.items()
            if values
        }
        lst_diff_by_name = {
            name: float(np.mean(list(values.values())))
            for name, values in lst_diff_yearly_by_name.items()
            if values
        }
        lst_years = sorted(int(year) for year in lst_df["_year"].unique())
        lst_observations = int(annual.shape[0])
        if lst_years:
            lst_mode = "annual"
            print(
                f"  Annual satellite LST found: {lst_observations} neighbourhood-years "
                f"across {len(lst_by_name)} neighbourhoods "
                f"({min(lst_years)}–{max(lst_years)})"
            )
        else:
            print(f"  {lst_csv.name} contains no usable rows for {START}–{END}")
    else:
        lst_by_name = {
            str(name).strip(): float(value)
            for name, value in zip(lst_df[name_col], lst_df["_lst"])
            if pd.notna(value)
        }
        lst_mean = np.mean(list(lst_by_name.values())) if lst_by_name else None
        lst_diff_by_name = {
            name: float(value - lst_mean) for name, value in lst_by_name.items()
        } if lst_mean is not None else {}
        lst_observations = len(lst_by_name)
        lst_mode = "aggregate"
        print(
            f"  Legacy aggregate satellite LST found: merging {len(lst_by_name)} "
            f"neighbourhoods from {lst_csv.name}"
        )

# -------------------------------------------------- merge into geojson features
keep = ["population", "tes", "treecanopy", "temp_diff", "pctpov", "pctpoc",
        "seniorperc", "unemplrate", "pic_total", "mha_total", "crisis_total",
        "pic_per1k", "crisis_per1k", "pic_apprehension_rate"]

for f in gj["features"]:
    name = f["properties"]["AREA_NAME"].strip()
    code = int(f["properties"]["AREA_SHORT_CODE"])
    f["geometry"]["coordinates"] = round_coords(f["geometry"]["coordinates"])
    p = {"name": name, "code": code}
    if name in master.index:
        row = master.loc[name]
        for k in keep:
            v = row[k]
            p[k] = None if pd.isna(v) else round(float(v), 4)
    p["by_type"] = {t: int(pic_type.loc[name, t]) for t in pic_type.columns} if name in pic_type.index else {}
    p["yearly"] = [int(pic_year.loc[name, y]) if (name in pic_year.index) else 0 for y in range(START, END + 1)]
    p["yearly_by_type"] = {
        call_type: [
            int(pic_type_year.get((name, call_type, year), 0))
            for year in range(START, END + 1)
        ]
        for call_type in CALL_TYPES
    }
    p["yearly_summer"] = [
        int(pic_summer_year.get((name, year), 0))
        for year in range(START, END + 1)
    ]
    p["yearly_summer_by_type"] = {
        call_type: [
            int(pic_summer_type_year.get((name, call_type, year), 0))
            for year in range(START, END + 1)
        ]
        for call_type in CALL_TYPES
    }
    if air_years:
        p["yearly_air_temp_c"] = [
            round(air_yearly_by_name.get(name, {}).get(year), 2)
            if year in air_yearly_by_name.get(name, {})
            else None
            for year in range(START, END + 1)
        ]
        p["yearly_air_temp_full_c"] = [
            round(air_yearly_full_by_name.get(name, {}).get(year), 2)
            if year in air_yearly_full_by_name.get(name, {})
            else None
            for year in range(START, END + 1)
        ]
        p["monthly_air_temp_c"] = [
            [
                round(air_monthly_by_name.get(name, {}).get(year, {}).get(month), 2)
                if month in air_monthly_by_name.get(name, {}).get(year, {})
                else None
                for month in range(1, 13)
            ]
            for year in range(START, END + 1)
        ]
    p["monthly"] = [int(pic_month.loc[name, m]) if name in pic_month.index else 0 for m in MONTHS]
    p["monthly_by_year"] = [
        [int(pic_month_year.get((name, year, month), 0)) for month in MONTHS]
        for year in range(START, END + 1)
    ]
    p["age"] = {a: int(mha_age.loc[name, a]) for a in mha_age.columns if not pd.isna(mha_age.loc[name, a])} if name in mha_age.index else {}
    p["sex"] = {s: int(mha_sex.loc[name, s]) for s in mha_sex.columns} if name in mha_sex.index else {}
    if name in lst_by_name:
        p["lst_c"] = round(lst_by_name[name], 2)
        # Upgrade the aggregate Heat layer in place while retaining absolute LST.
        p["temp_diff"] = round(lst_diff_by_name[name], 2)
    if lst_mode == "annual":
        # Arrays align exactly with p["yearly"] and meta["years"] (2014–2024).
        p["yearly_lst_c"] = [
            round(lst_yearly_by_name.get(name, {}).get(year), 2)
            if year in lst_yearly_by_name.get(name, {})
            else None
            for year in range(START, END + 1)
        ]
        p["yearly_temp_diff"] = [
            round(lst_diff_yearly_by_name.get(name, {}).get(year), 2)
            if year in lst_diff_yearly_by_name.get(name, {})
            else None
            for year in range(START, END + 1)
        ]
    f["properties"] = p

json.dump(gj, open(OUT / "neighbourhoods.geojson", "w"), separators=(",", ":"))

# -------------------------------------------------- seasonal index (city-wide)
picm = pic.copy()
picm["EVENT_MONTH"] = pd.Categorical(picm["EVENT_MONTH"], MONTHS, ordered=True)
nyears = picm["EVENT_YEAR"].nunique()
mon = picm.groupby(["EVENT_MONTH", "EVENT_TYPE"], observed=True).size().unstack(fill_value=0) / nyears
idx = (mon / mon.mean() * 100)
seasonal = {
    "months": [m[:3] for m in MONTHS],
    "types": list(idx.columns),
    "index": {t: [round(float(v), 1) for v in idx[t].values] for t in idx.columns},
    "monthly_counts": {t: [int(round(v * nyears)) for v in mon[t].values] for t in mon.columns},
}

seasonal["by_year"] = {}
for year in range(START, END + 1):
    year_calls = picm[picm["EVENT_YEAR"] == year]
    year_monthly = year_calls.groupby(
        ["EVENT_MONTH", "EVENT_TYPE"], observed=True
    ).size().unstack(fill_value=0).reindex(index=MONTHS, fill_value=0)
    year_index = year_monthly / year_monthly.mean() * 100
    seasonal["by_year"][str(year)] = {
        "index": {
            call_type: [round(float(value), 1) for value in year_index[call_type].values]
            for call_type in year_index.columns
        },
        "monthly_counts": {
            call_type: [int(value) for value in year_monthly[call_type].values]
            for call_type in year_monthly.columns
        },
    }

if air_monthly_city:
    seasonal["temp_monthly_by_year"] = {
        str(year): [
            round(air_monthly_city[year][month], 1) for month in range(1, 13)
        ]
        for year in air_years
    }
    seasonal["temp_monthly"] = [
        round(float(np.mean([
            air_monthly_city[year][month] for year in air_years
        ])), 1)
        for month in range(1, 13)
    ]

# Open-Meteo: real Toronto monthly mean air temperature climatology (ERA5, °C).
# Cached locally so offline rebuilds still work. Powers the Fig-5 seasonal overlay.
def toronto_monthly_temp():
    import urllib.request
    cache = ROOT / "openmeteo_toronto_daily.json"
    try:
        url = (
            "https://archive-api.open-meteo.com/v1/archive?latitude=43.70&longitude=-79.40"
            f"&start_date={START}-01-01&end_date={END}-12-31"
            "&daily=temperature_2m_mean&timezone=America%2FToronto"
        )
        with urllib.request.urlopen(url, timeout=30) as r:
            d = json.load(r)
        cache.write_text(json.dumps(d))
    except Exception as e:  # offline: fall back to cache if we have it
        if not cache.exists():
            print("  Open-Meteo unavailable and no cache; skipping temp overlay:", e)
            return None
        d = json.loads(cache.read_text())
    s = pd.Series(d["daily"]["temperature_2m_mean"], index=pd.to_datetime(d["daily"]["time"]))
    return [round(float(v), 1) for v in s.groupby(s.index.month).mean().reindex(range(1, 13)).values]

temp_monthly = seasonal.get("temp_monthly") or toronto_monthly_temp()
if temp_monthly and "temp_monthly" not in seasonal:
    seasonal["temp_monthly"] = temp_monthly
if temp_monthly:
    print("  Toronto monthly mean °C:", temp_monthly)

json.dump(seasonal, open(OUT / "seasonal.json", "w"), indent=0)

# -------------------------------------------------- meta (totals, correlations, rankings)
m = master.replace([np.inf, -np.inf], np.nan)

# Keep the headline heat correlation synchronized with the heat values actually
# written to GeoJSON. build_app_data_new.py fixed this one issue but regressed
# other metadata, so the correction lives in the canonical builder instead.
if lst_diff_by_name:
    m["temp_diff"] = pd.Series(lst_diff_by_name)


def corr(a, b="pic_per1k"):
    d = m[[a, b]].dropna()
    return round(float(d[a].corr(d[b])), 3)


top = m.sort_values("pic_per1k", ascending=False).head(8)
meta = {
    "period": f"{START}–{END}",
    "years": list(range(START, END + 1)),
    "vintages": {
        "crisis_calls": f"{START}–{END}",
        "population_denominator": "2021 Census",
        "tree_canopy": "2018",
        "demographics": "2021 Census",
        "summer_heat": (
            f"annual summers {min(lst_years)}–{max(lst_years)}"
            if lst_mode == "annual"
            else "summers 2014–2024 composite"
            if lst_mode == "aggregate"
            else "summer 2022"
        ),
        "tree_equity_score": "2024 snapshot",
        "neighbourhood_boundaries": "2022",
    },
    "pic_total": int(pic.shape[0]),
    "mha_total": int(mha.shape[0]),
    # MHA records are outcomes, not an additional class of crisis call.
    "crisis_total": int(pic.shape[0]),
    "per_day": round((pic.shape[0]) / nyears / 365, 0),
    "type_split": {t: int(v) for t, v in pic["EVENT_TYPE"].value_counts().items()},
    "correlations": {
        "Low-income %": corr("pctpov"),
        "Senior %": corr("seniorperc"),
        "Tree canopy %": corr("treecanopy"),
        "Heat extremity": corr("temp_diff"),
        "People of colour %": corr("pctpoc"),
        "Unemployment": corr("unemplrate"),
        "Tree Equity Score": corr("tes"),
    },
    "top_crisis": [{"name": n, "pic_per1k": round(float(r["pic_per1k"]), 1),
                    "tes": round(float(r["tes"]), 0), "canopy": round(float(r["treecanopy"]) * 100, 1)}
                   for n, r in top.iterrows()],
    "n_neighbourhoods": int(m.shape[0]),
    "lst": {
        "mode": lst_mode or "tesa_proxy",
        "source": (
            "Landsat 8/9 Collection 2 Level-2"
            if lst_mode
            else "Tree Equity Score Analyzer heat extremity"
        ),
        "years": lst_years,
        "neighbourhood_year_observations": lst_observations,
        "expected_neighbourhood_year_observations": (
            len(gj["features"]) * (END - START + 1) if lst_mode == "annual" else None
        ),
    },
    "openmeteo": {
        "source": "Open-Meteo Historical Weather API / ERA5-Land",
        "measure": "June-August mean 2 m air temperature",
        "years": air_years,
        "neighbourhood_year_observations": sum(
            len(values) for values in air_yearly_by_name.values()
        ),
    },
}

# How attended calls closed out. The PIC file carries three Yes/No outcome
# flags per call (they overlap; one call can be all three), and the MHA file
# records the legal basis and premises of each apprehension.
def yes_rate(s):
    return round(float((s == "Yes").mean()), 3)


meta["resolutions"] = {
    "occurrence_created": yes_rate(pic["OCCURRENCE_CREATED"]),
    "apprehension_made": yes_rate(pic["APPREHENSION_MADE"]),
    "mcit_attended": yes_rate(pic["MCIT_ATTEND"]),
    "apprehension_by_type": {t: yes_rate(g) for t, g in pic.groupby("EVENT_TYPE")["APPREHENSION_MADE"]},
    "mcit_by_year": [yes_rate(pic.loc[pic["EVENT_YEAR"] == y, "MCIT_ATTEND"]) for y in range(START, END + 1)],
    "mha_by_section": {t: int(v) for t, v in mha["APPREHENSION_TYPE"].value_counts().items()},
    "mha_premises": {t: int(v) for t, v in mha["PREMISES_TYPE"].value_counts().items()},
}
json.dump(meta, open(OUT / "meta.json", "w"), indent=2)

sz = (OUT / "neighbourhoods.geojson").stat().st_size / 1e6
print(f"Wrote {OUT}/  (geojson {sz:.2f} MB, {len(gj['features'])} features)")
print("Correlations:", meta["correlations"])
print("Headline calls:", meta["crisis_total"], "| separate MHA records:", meta["mha_total"])
