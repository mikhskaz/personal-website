"""
Cross-dataset analysis to ground the storyboard in real numbers.

Joins:
  TPS crisis calls (PIC + MHA)  --HOOD_158-->  Neighbourhood (158)  --name-->  TESA (tree equity / canopy / heat / equity)

Outputs a findings text block: per-capita crisis rates by neighbourhood,
tree-equity / canopy / heat correlations with crisis, seasonal pattern,
and the top / bottom neighbourhoods that anchor the narrative.
"""

import json
import re
from pathlib import Path
import numpy as np
import pandas as pd

ROOT = Path(".")
PIC = ROOT / "Persons_in_Crisis_Calls_for_Service_Attended_Open_Data_3801289854217715978.csv"
MHA = ROOT / "Mental_Health_Act_Apprehensions_Open_Data_8371563523426242708.csv"
NB = ROOT / "Neighbourhoods - 4326.geojson"
TESA = ROOT / "tesa_toronto_geojson" / "tesa_toronto_tes.geojson"

START, END = 2014, 2024  # full years only


def load_geojson_props(path):
    feats = json.load(open(path, encoding="utf-8"))["features"]
    return pd.DataFrame([f["properties"] for f in feats])


# ---------------------------------------------------------------- crosswalk
nb = load_geojson_props(NB)
nb["code"] = nb["AREA_SHORT_CODE"].astype(int)
code_to_name = dict(zip(nb["code"], nb["AREA_NAME"].str.strip()))
print(f"Neighbourhoods: {len(nb)} (codes {nb['code'].min()}–{nb['code'].max()})")

# ---------------------------------------------------------------- TPS: PIC
pic = pd.read_csv(PIC)
pic = pic[(pic["EVENT_YEAR"] >= START) & (pic["EVENT_YEAR"] <= END)]
pic = pic[pic["HOOD_158"].astype(str).str.isdigit()]
pic["code"] = pic["HOOD_158"].astype(int)
pic["nbname"] = pic["code"].map(code_to_name)
pic_unmatched = pic["nbname"].isna().sum()
pic = pic.dropna(subset=["nbname"])

pic_by_nb = pic.groupby("nbname").size().rename("pic_total")
pic_by_type = pic.groupby(["nbname", "EVENT_TYPE"]).size().unstack(fill_value=0)
pic_app_rate = pic.groupby("nbname")["APPREHENSION_MADE"].apply(
    lambda s: (s == "Yes").mean()
).rename("pic_apprehension_rate")

# ---------------------------------------------------------------- TPS: MHA
mha = pd.read_csv(MHA)
mha = mha[(mha["OCC_YEAR"] >= START) & (mha["OCC_YEAR"] <= END)]
mha = mha[mha["HOOD_158"].astype(str).str.isdigit()]
mha["code"] = mha["HOOD_158"].astype(int)
mha["nbname"] = mha["code"].map(code_to_name)
mha = mha.dropna(subset=["nbname"])
mha_by_nb = mha.groupby("nbname").size().rename("mha_total")

print(f"PIC rows {START}-{END}: {len(pic):,} (unmatched hood -> {pic_unmatched})")
print(f"MHA rows {START}-{END}: {len(mha):,}")

# ---------------------------------------------------------------- TESA -> nbhd
tesa = load_geojson_props(TESA)
for c in ["population", "treecanopy", "tes", "temp_diff", "temp_norm",
          "pctpov", "pctpoc", "seniorperc", "child_perc", "unemplrate",
          "nghb_score", "land_area"]:
    tesa[c] = pd.to_numeric(tesa[c], errors="coerce")
tesa["neighbourh"] = tesa["neighbourh"].str.strip()


def wmean(df, val, w="population"):
    d = df[[val, w]].dropna()
    return np.average(d[val], weights=d[w]) if d[w].sum() > 0 else np.nan


agg = tesa.groupby("neighbourh").apply(lambda d: pd.Series({
    "population": d["population"].sum(),
    "land_area_km2": d["land_area"].sum(),
    "tes": wmean(d, "tes"),                 # population-weighted Tree Equity Score
    "treecanopy": wmean(d, "treecanopy"),   # pop-weighted canopy fraction
    "temp_diff": wmean(d, "temp_diff"),     # heat extremity vs urban avg (°C)
    "pctpov": wmean(d, "pctpov"),
    "pctpoc": wmean(d, "pctpoc"),
    "seniorperc": wmean(d, "seniorperc"),
    "unemplrate": wmean(d, "unemplrate"),
}), include_groups=False)

# ---------------------------------------------------------------- master join
m = agg.join([pic_by_nb, mha_by_nb, pic_app_rate]).copy()
m["pic_total"] = m["pic_total"].fillna(0)
m["mha_total"] = m["mha_total"].fillna(0)
m["crisis_total"] = m["pic_total"] + m["mha_total"]
# per-capita: total events over 11 yrs per 1,000 residents
m["pic_per1k"] = m["pic_total"] / m["population"] * 1000
m["crisis_per1k"] = m["crisis_total"] / m["population"] * 1000
m = m[m["population"] > 0]

print(f"\nNeighbourhoods in master join: {len(m)}")
print(f"Total PIC calls mapped: {int(m['pic_total'].sum()):,} | "
      f"MHA: {int(m['mha_total'].sum()):,}")

# ---------------------------------------------------------------- correlations
def corr(a, b):
    d = m[[a, b]].replace([np.inf, -np.inf], np.nan).dropna()
    return d[a].corr(d[b]), len(d)


print("\n=== CORRELATIONS (Pearson r) vs PIC calls per 1,000 residents ===")
for var, label in [("tes", "Tree Equity Score"),
                   ("treecanopy", "Tree canopy %"),
                   ("temp_diff", "Heat extremity (temp_diff)"),
                   ("pctpov", "Low-income %"),
                   ("pctpoc", "People of colour %"),
                   ("unemplrate", "Unemployment rate"),
                   ("seniorperc", "Senior %")]:
    r, n = corr(var, "pic_per1k")
    print(f"  {label:<32} r = {r:+.3f}  (n={n})")

# ---------------------------------------------------------------- rankings
print("\n=== TOP 10 neighbourhoods by PIC calls per 1,000 residents ===")
top = m.sort_values("pic_per1k", ascending=False).head(10)
for nm, row in top.iterrows():
    print(f"  {nm[:34]:<34} {row['pic_per1k']:6.1f}/1k  TES={row['tes']:4.0f}  "
          f"canopy={row['treecanopy']*100:4.1f}%  pov={row['pctpov']*100:4.1f}%")

print("\n=== BOTTOM 10 (lowest Tree Equity Score) ===")
low_tes = m.sort_values("tes").head(10)
for nm, row in low_tes.iterrows():
    print(f"  {nm[:34]:<34} TES={row['tes']:4.0f}  canopy={row['treecanopy']*100:4.1f}%  "
          f"PIC={row['pic_per1k']:6.1f}/1k  heat={row['temp_diff']:+.2f}")

print("\n=== HIGHEST tree equity (TES) for contrast ===")
hi_tes = m.sort_values("tes", ascending=False).head(5)
for nm, row in hi_tes.iterrows():
    print(f"  {nm[:34]:<34} TES={row['tes']:4.0f}  canopy={row['treecanopy']*100:4.1f}%  "
          f"PIC={row['pic_per1k']:6.1f}/1k")

# quartile contrast: low-TES vs high-TES crisis burden
m["tes_q"] = pd.qcut(m["tes"], 4, labels=["Q1 low", "Q2", "Q3", "Q4 high"])
print("\n=== Mean PIC per 1k by Tree-Equity quartile ===")
print(m.groupby("tes_q", observed=True)["pic_per1k"].mean().round(1).to_string())

# ---------------------------------------------------------------- seasonal
print("\n=== Seasonal index (100 = annual avg), PIC by type ===")
month_order = ["January", "February", "March", "April", "May", "June",
               "July", "August", "September", "October", "November", "December"]
picm = pic.copy()
picm["EVENT_MONTH"] = pd.Categorical(picm["EVENT_MONTH"], month_order, ordered=True)
nyears = picm["EVENT_YEAR"].nunique()
mon = picm.groupby(["EVENT_MONTH", "EVENT_TYPE"], observed=True).size().unstack(fill_value=0) / nyears
idx = (mon / mon.mean() * 100).round(0)
print(idx.to_string())
for t in idx.columns:
    pk = idx[t].idxmax()
    print(f"  {t}: peaks {pk} ({idx[t].max():.0f})")

# city-wide totals for headline
print("\n=== HEADLINES ===")
print(f"  City-wide PIC {START}-{END}: {len(pic):,} calls "
      f"({len(pic)/nyears:,.0f}/yr, ~{len(pic)/nyears/365:.0f}/day)")
print(f"  PIC type split: " +
      ", ".join(f"{t} {v:,}" for t, v in pic['EVENT_TYPE'].value_counts().items()))
r_tes, _ = corr("tes", "pic_per1k")
r_can, _ = corr("treecanopy", "pic_per1k")
q = m.groupby("tes_q", observed=True)["pic_per1k"].mean()
print(f"  Low-tree-equity (Q1) neighbourhoods average "
      f"{q['Q1 low']/q['Q4 high']:.1f}x the PIC rate of high-equity (Q4).")

# save the master table for reuse
m.round(3).to_csv("neighbourhood_master.csv")
print("\nSaved neighbourhood_master.csv")
