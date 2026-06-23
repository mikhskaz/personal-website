"""
Build the static data assets the React app consumes.

Outputs (to toronto-app/public/data/):
  neighbourhoods.geojson  geometry + every metric + per-type / yearly / monthly crisis + age/sex
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
START, END = 2014, 2024
MONTHS = ["January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December"]


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
pic_month = pic.groupby(["nb", "EVENT_MONTH"]).size().unstack(fill_value=0).reindex(columns=MONTHS, fill_value=0)

# -------------------------------------------------- MHA per-neighbourhood WHO
mha = pd.read_csv(MHA)
mha = mha[(mha["OCC_YEAR"] >= START) & (mha["OCC_YEAR"] <= END)]
mha = mha[mha["HOOD_158"].astype(str).str.isdigit()].copy()
mha["nb"] = mha["HOOD_158"].astype(int).map(code_to_name)
mha = mha.dropna(subset=["nb"])
mha_age = mha.groupby(["nb", "AGE_COHORT"]).size().unstack(fill_value=0)
mha_sex = mha.groupby(["nb", "SEX"]).size().unstack(fill_value=0)

# -------------------------------------------------- optional satellite LST
# If gee_landsat_lst.py has been run, fold its real summer surface temperature
# (°C per neighbourhood) into the features so the app's Heat layer auto-upgrades
# from the TESA temp_diff proxy. Keyed on neighbourhood name.
lst_by_name = {}
lst_csv = ROOT / "neighbourhood_lst.csv"
if lst_csv.exists():
    lst_df = pd.read_csv(lst_csv)
    name_col = "name" if "name" in lst_df.columns else lst_df.columns[0]
    val_col = next((c for c in ["lst_c", "lst", "mean"] if c in lst_df.columns), lst_df.columns[-1])
    lst_by_name = {str(n).strip(): float(v) for n, v in zip(lst_df[name_col], lst_df[val_col]) if pd.notna(v)}
    print(f"  Satellite LST found: merging {len(lst_by_name)} neighbourhoods from {lst_csv.name}")
lst_mean = (sum(lst_by_name.values()) / len(lst_by_name)) if lst_by_name else None

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
    p["monthly"] = [int(pic_month.loc[name, m]) if name in pic_month.index else 0 for m in MONTHS]
    p["age"] = {a: int(mha_age.loc[name, a]) for a in mha_age.columns if not pd.isna(mha_age.loc[name, a])} if name in mha_age.index else {}
    p["sex"] = {s: int(mha_sex.loc[name, s]) for s in mha_sex.columns} if name in mha_sex.index else {}
    if name in lst_by_name:
        p["lst_c"] = round(lst_by_name[name], 2)
        # Upgrade the Heat layer in place: temp_diff becomes real Landsat summer
        # LST relative to the city mean (°C), replacing the TESA proxy.
        p["temp_diff"] = round(lst_by_name[name] - lst_mean, 2)
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

temp_monthly = toronto_monthly_temp()
if temp_monthly:
    seasonal["temp_monthly"] = temp_monthly
    print("  Toronto monthly mean °C:", temp_monthly)

json.dump(seasonal, open(OUT / "seasonal.json", "w"), indent=0)

# -------------------------------------------------- meta (totals, correlations, rankings)
m = master.replace([np.inf, -np.inf], np.nan)


def corr(a, b="pic_per1k"):
    d = m[[a, b]].dropna()
    return round(float(d[a].corr(d[b])), 3)


top = m.sort_values("pic_per1k", ascending=False).head(8)
meta = {
    "period": f"{START}–{END}",
    "pic_total": int(pic.shape[0]),
    "mha_total": int(mha.shape[0]),
    "crisis_total": int(pic.shape[0] + mha.shape[0]),
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
}
json.dump(meta, open(OUT / "meta.json", "w"), indent=2)

sz = (OUT / "neighbourhoods.geojson").stat().st_size / 1e6
print(f"Wrote {OUT}/  (geojson {sz:.2f} MB, {len(gj['features'])} features)")
print("Correlations:", meta["correlations"])
print("Headline:", meta["pic_total"], "PIC +", meta["mha_total"], "MHA =", meta["crisis_total"])
