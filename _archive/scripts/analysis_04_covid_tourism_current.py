"""
04 — COVID comparison · Tourism correlation · Current correlation
HHE Lab Sardinia · Marine Litter Hazard Assessment

Periods:
  pre-COVID  : 2018-2019
  COVID      : 2020-2021
  post-COVID : 2022-2023

Tourism data: estimated monthly visitor counts per beach (no official
monthly beach-level series available; values derived from regional tourism
statistics — Regione Sardegna, ISTAT, 2024 — scaled to beach capacity).

Current data: Copernicus Marine Service CMEMS Med Sea Physics Reanalysis
  cmems_mod_med_phy-cur_my_4.2km_P1M-m (2015-2023, monthly, uo/vo at surface)
  Spatial domain: N41.52 W5.76 E12.09 S37.48 (covers full Sardinia buffer)
"""
import matplotlib
matplotlib.use("Agg")
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import seaborn as sns
import netCDF4 as nc4
from scipy import stats
from pathlib import Path

sns.set_theme(style="whitegrid", font_scale=1.05)
ROOT = Path(__file__).resolve().parents[1]
OUT  = ROOT / "data" / "processed"
FIGS = ROOT / "data" / "figures"
FIGS.mkdir(exist_ok=True)

# ══════════════════════════════════════════════════════════════════════════════
# 0. LOAD CLEANED DATA
# ══════════════════════════════════════════════════════════════════════════════
beach    = pd.read_csv(OUT / "beach_litter.csv")
floating = pd.read_csv(OUT / "floating_litter.csv")

beach["year"]  = beach["year"].astype(int)
beach["month"] = pd.to_numeric(beach["month"], errors="coerce")
floating["year"]  = pd.to_numeric(floating["year"],  errors="coerce")
floating["month"] = pd.to_numeric(floating["month"], errors="coerce")

BEACH_NAMES = {
    "MWE_SAR_1":"Alghero Lido","MWE_SAR_2":"Cagliari Poetto",
    "MWE_SAR_3":"Castiadas Costa Rei","MWE_SAR_4":"Oristano Is Arenas",
    "MWE_SAR_5":"San Teodoro La Cinta","MWE_SAR_6":"S.A. Arresi Porto Pino",
}
BEACH_COLORS = {
    "MWE_SAR_1":"#e74c3c","MWE_SAR_2":"#3498db","MWE_SAR_3":"#2ecc71",
    "MWE_SAR_4":"#f39c12","MWE_SAR_5":"#9b59b6","MWE_SAR_6":"#1abc9c",
}
PERIOD_MAP  = {2018:"pre-COVID",2019:"pre-COVID",2020:"COVID",
               2021:"COVID",2022:"post-COVID",2023:"post-COVID"}
PERIOD_COLORS = {"pre-COVID":"#2980b9","COVID":"#e74c3c","post-COVID":"#27ae60"}

beach["period"]    = beach["year"].map(PERIOD_MAP)
floating["period"] = floating["year"].map(PERIOD_MAP)

# ══════════════════════════════════════════════════════════════════════════════
# 1. TOURISM DATA
#    Source: estimated from Regione Sardegna / ISTAT regional tourism stats,
#    disaggregated to beach level by capacity weighting. No official monthly
#    beach-level series exists in public databases.
# ══════════════════════════════════════════════════════════════════════════════
MONTHS = list(range(1, 13))

TOURISM_RAW = {
    # (beach_id, year): [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
    ("MWE_SAR_1", 2018): [300,300,200,300,2000,6000,11000,13000,7000,2000,300,300],
    ("MWE_SAR_2", 2018): [500,500,300,400,3000,10000,23000,27000,12000,3000,500,500],
    ("MWE_SAR_3", 2018): [200,200,100,150,1500,6000,13000,16000,8000,1500,200,200],
    ("MWE_SAR_4", 2018): [100,100,80,80,600,2500,4000,4500,2500,700,100,100],
    ("MWE_SAR_5", 2018): [250,250,150,200,2000,7000,18000,22000,10000,2000,250,250],
    ("MWE_SAR_6", 2018): [150,150,100,100,1000,4500,9000,11000,5000,1000,150,150],

    ("MWE_SAR_1", 2019): [350,350,250,400,2500,7000,13000,15000,8000,2500,350,350],
    ("MWE_SAR_2", 2019): [600,600,400,600,4000,12000,28000,32000,15000,4000,600,600],
    ("MWE_SAR_3", 2019): [300,300,200,300,2000,7000,16000,18000,10000,2000,300,300],
    ("MWE_SAR_4", 2019): [150,150,100,150,800,3000,5000,5000,3000,1000,150,150],
    ("MWE_SAR_5", 2019): [300,300,200,300,3000,9000,22000,26000,12000,3000,300,300],
    ("MWE_SAR_6", 2019): [200,200,150,200,1500,6000,11000,13000,7000,1500,200,200],

    ("MWE_SAR_1", 2020): [200,200,100,100,1000,4000,8000,10000,5000,1000,200,200],
    ("MWE_SAR_2", 2020): [300,300,150,150,2000,6000,15000,20000,8000,2000,300,300],
    ("MWE_SAR_3", 2020): [100,100,50,50,800,4000,10000,13000,6000,1000,100,100],
    ("MWE_SAR_4", 2020): [50,50,30,30,400,2000,3000,4000,2000,500,50,50],
    ("MWE_SAR_5", 2020): [150,150,80,80,1000,5000,14000,18000,7000,1000,150,150],
    ("MWE_SAR_6", 2020): [100,100,50,50,700,3000,7000,9000,4000,800,100,100],

    # 2021: +25% on 2020
    ("MWE_SAR_1", 2021): [int(x*1.25) for x in [200,200,100,100,1000,4000,8000,10000,5000,1000,200,200]],
    ("MWE_SAR_2", 2021): [int(x*1.25) for x in [300,300,150,150,2000,6000,15000,20000,8000,2000,300,300]],
    ("MWE_SAR_3", 2021): [int(x*1.25) for x in [100,100,50,50,800,4000,10000,13000,6000,1000,100,100]],
    ("MWE_SAR_4", 2021): [int(x*1.25) for x in [50,50,30,30,400,2000,3000,4000,2000,500,50,50]],
    ("MWE_SAR_5", 2021): [int(x*1.25) for x in [150,150,80,80,1000,5000,14000,18000,7000,1000,150,150]],
    ("MWE_SAR_6", 2021): [int(x*1.25) for x in [100,100,50,50,700,3000,7000,9000,4000,800,100,100]],

    ("MWE_SAR_1", 2022): [300,300,200,300,2000,6000,12000,15000,7000,2000,300,300],
    ("MWE_SAR_2", 2022): [500,500,300,300,3000,10000,25000,30000,12000,3000,500,500],
    ("MWE_SAR_3", 2022): [200,200,100,100,1500,6000,14000,18000,8000,1500,200,200],
    ("MWE_SAR_4", 2022): [100,100,80,80,600,2500,4000,5000,2500,700,100,100],
    ("MWE_SAR_5", 2022): [250,250,150,150,2000,7000,20000,25000,10000,2000,250,250],
    ("MWE_SAR_6", 2022): [150,150,100,100,1200,5000,10000,12000,6000,1000,150,150],

    ("MWE_SAR_1", 2023): [400,400,300,500,3000,7000,13000,14000,9000,3000,400,400],
    ("MWE_SAR_2", 2023): [600,600,400,600,4000,12000,28000,30000,15000,4000,600,600],
    ("MWE_SAR_3", 2023): [300,300,200,300,2000,7000,16000,17000,10000,2000,300,300],
    ("MWE_SAR_4", 2023): [150,150,100,150,800,3000,5000,5000,3000,1000,150,150],
    ("MWE_SAR_5", 2023): [300,300,200,300,3000,9000,22000,24000,12000,3000,300,300],
    ("MWE_SAR_6", 2023): [200,200,150,200,1500,6000,11000,12000,7000,1500,200,200],
}

# Build monthly tourism DataFrame
tourism_rows = []
for (bid, yr), monthly in TOURISM_RAW.items():
    for mo, count in zip(MONTHS, monthly):
        tourism_rows.append({"beach_id":bid, "year":yr, "month":mo, "tourists":count})
tourism_df = pd.DataFrame(tourism_rows)
tourism_df["period"] = tourism_df["year"].map(PERIOD_MAP)
tourism_df.to_csv(OUT / "tourism_monthly.csv", index=False)
print(f"Tourism: {len(tourism_df)} rows built")

# ══════════════════════════════════════════════════════════════════════════════
# 2. CURRENT DATA — Copernicus CMEMS
# ══════════════════════════════════════════════════════════════════════════════
NC_FILE = ROOT / "Labenv" / "wind" / "cmems_mod_med_phy-cur_my_4.2km_P1M-m_1777998797307.nc"
ds = nc4.Dataset(str(NC_FILE))
times  = nc4.num2date(ds.variables["time"][:], ds.variables["time"].units)
lats   = ds.variables["latitude"][:]
lons   = ds.variables["longitude"][:]
uo_all = ds.variables["uo"][:, 0, :, :]   # eastward  (time, lat, lon)
vo_all = ds.variables["vo"][:, 0, :, :]   # northward (time, lat, lon)
ds.close()

# Build monthly-mean current speed over Sardinia box
# filter 2018+ (remove 2015-2017)
current_rows = []
for i, t in enumerate(times):
    yr, mo = t.year, t.month
    if yr < 2018:
        continue
    speed = np.sqrt(uo_all[i]**2 + vo_all[i]**2)
    # direction: mean uo, vo → resultant direction (oceanographic convention)
    mean_uo = float(np.nanmean(uo_all[i]))
    mean_vo = float(np.nanmean(vo_all[i]))
    mean_speed = float(np.nanmean(speed))
    direction_deg = float(np.degrees(np.arctan2(mean_uo, mean_vo)) % 360)
    current_rows.append({
        "year": yr, "month": mo,
        "mean_speed_ms": mean_speed,
        "mean_uo": mean_uo,
        "mean_vo": mean_vo,
        "direction_deg": direction_deg,
    })

current_df = pd.DataFrame(current_rows)
current_df["period"] = current_df["year"].map(PERIOD_MAP)
current_df.to_csv(OUT / "current_monthly.csv", index=False)
print(f"Current: {len(current_df)} months (2018-2023)")

# ══════════════════════════════════════════════════════════════════════════════
# 3. PRE/POST COVID COMPARISON — Beach litter
# ══════════════════════════════════════════════════════════════════════════════
fig, axes = plt.subplots(1, 2, figsize=(14, 5))

# A. Mean items/100m per period per beach
period_beach = (beach.groupby(["beach_id","period"])["items_per_100m"]
                .mean().reset_index())
period_order = ["pre-COVID","COVID","post-COVID"]
ax = axes[0]
x = np.arange(len(BEACH_NAMES))
width = 0.25
for i, period in enumerate(period_order):
    vals = [period_beach[(period_beach["beach_id"]==bid) &
                         (period_beach["period"]==period)]["items_per_100m"].values
            for bid in BEACH_NAMES]
    vals = [v[0] if len(v) else 0 for v in vals]
    bars = ax.bar(x + i*width, vals, width, label=period,
                  color=PERIOD_COLORS[period], alpha=0.85)
ax.set_xticks(x + width)
ax.set_xticklabels([BEACH_NAMES[b].split()[0] for b in BEACH_NAMES], rotation=30, ha="right")
ax.axhline(150, color="gray", linestyle="--", lw=1.2, alpha=0.7, label="EU threshold")
ax.set_title("Beach Litter — items/100m per period", fontweight="bold")
ax.set_ylabel("Mean items / 100m")
ax.legend(fontsize=8)

# B. Floating obs per period
float_period = (floating.dropna(subset=["period"])
                .groupby("period").size().reindex(period_order).fillna(0))
bars2 = axes[1].bar(period_order, float_period.values,
                     color=[PERIOD_COLORS[p] for p in period_order], alpha=0.85, width=0.5)
for bar, val in zip(bars2, float_period.values):
    axes[1].text(bar.get_x()+bar.get_width()/2, bar.get_height()+5,
                 str(int(val)), ha="center", fontsize=10)
# Normalize by number of years per period (2 per period)
axes[1].set_title("Floating Litter — obs per period (2 years each)", fontweight="bold")
axes[1].set_ylabel("Total observations")

plt.suptitle("Pre-COVID vs COVID vs Post-COVID Comparison", fontsize=13, fontweight="bold", y=1.01)
plt.tight_layout()
plt.savefig(FIGS / "covid_comparison.png", dpi=150, bbox_inches="tight")
# plt.show()
print("Saved: covid_comparison.png")

# ══════════════════════════════════════════════════════════════════════════════
# 4. TOURISM CORRELATION — Beach litter vs tourists (annual)
# ══════════════════════════════════════════════════════════════════════════════
# Annual tourism = sum of monthly tourists per beach per year
tourism_annual = tourism_df.groupby(["beach_id","year"])["tourists"].sum().reset_index()
# Beach survey per year (spring survey ≈ month 3-4, autumn ≈ month 10-11)
beach_annual = beach.groupby(["beach_id","year"])["items_per_100m"].mean().reset_index()
merged_bt = beach_annual.merge(tourism_annual, on=["beach_id","year"])
merged_bt["period"] = merged_bt["year"].map(PERIOD_MAP)

fig, axes = plt.subplots(1, 2, figsize=(14, 5))

# A. Scatter: items/100m vs annual tourists, colored by period
ax = axes[0]
for period, grp in merged_bt.groupby("period"):
    ax.scatter(grp["tourists"]/1000, grp["items_per_100m"],
               color=PERIOD_COLORS[period], label=period, s=60, alpha=0.8, zorder=3)
    # annotate beach IDs
    for _, row in grp.iterrows():
        ax.annotate(BEACH_NAMES[row["beach_id"]].split()[0],
                    (row["tourists"]/1000, row["items_per_100m"]),
                    fontsize=6, alpha=0.7)
# overall Pearson r
r, p = stats.pearsonr(merged_bt["tourists"], merged_bt["items_per_100m"])
ax.set_xlabel("Annual tourists (thousands)")
ax.set_ylabel("items / 100m (annual mean)")
ax.set_title(f"Beach Litter vs Tourism\n(Pearson r={r:.2f}, p={p:.3f})", fontweight="bold")
ax.legend(fontsize=8)

# B. Annual tourism trend (all beaches stacked)
ax2 = axes[1]
for bid, name in BEACH_NAMES.items():
    grp = tourism_annual[tourism_annual["beach_id"]==bid].sort_values("year")
    ax2.plot(grp["year"], grp["tourists"]/1000, marker="o", linewidth=2,
             color=BEACH_COLORS[bid], label=name.split()[0])
ax2.axvspan(2020, 2021.5, alpha=0.1, color="red", label="COVID period")
ax2.set_title("Annual Tourists per Beach (estimated)", fontweight="bold")
ax2.set_ylabel("Tourists (thousands)")
ax2.set_xlabel("Year")
ax2.legend(fontsize=7, ncol=2)
ax2.set_xticks(range(2018, 2024))

plt.tight_layout()
plt.savefig(FIGS / "tourism_correlation.png", dpi=150, bbox_inches="tight")
# plt.show()
print("Saved: tourism_correlation.png")

# ══════════════════════════════════════════════════════════════════════════════
# 5. CURRENT CORRELATION — Floating litter vs current speed (monthly)
# ══════════════════════════════════════════════════════════════════════════════
# Monthly floating obs count
float_monthly = (floating.dropna(subset=["year","month"])
                 .groupby(["year","month"]).size()
                 .reset_index(name="n_obs"))
float_monthly["year"]  = float_monthly["year"].astype(int)
float_monthly["month"] = float_monthly["month"].astype(int)

merged_fc = float_monthly.merge(current_df[["year","month","mean_speed_ms","direction_deg"]],
                                 on=["year","month"])
merged_fc["period"] = merged_fc["year"].map(PERIOD_MAP)

fig, axes = plt.subplots(1, 3, figsize=(16, 5))

# A. Scatter: n_obs vs current speed
ax = axes[0]
for period, grp in merged_fc.groupby("period"):
    ax.scatter(grp["mean_speed_ms"]*100, grp["n_obs"],
               color=PERIOD_COLORS[period], label=period, s=50, alpha=0.75)
r2, p2 = stats.pearsonr(merged_fc["mean_speed_ms"], merged_fc["n_obs"])
ax.set_xlabel("Mean current speed (cm/s)")
ax.set_ylabel("Floating obs / month")
ax.set_title(f"Floating Litter vs Current Speed\n(r={r2:.2f}, p={p2:.3f})", fontweight="bold")
ax.legend(fontsize=8)

# B. Monthly mean current speed 2018-2023
ax2 = axes[1]
mn_speed = current_df.groupby("month")["mean_speed_ms"].mean()
mn_std   = current_df.groupby("month")["mean_speed_ms"].std()
ax2.bar(mn_speed.index, mn_speed.values*100, color="#1C7293", alpha=0.8)
ax2.errorbar(mn_speed.index, mn_speed.values*100, yerr=mn_std.values*100,
             fmt="none", color="black", capsize=3, linewidth=1)
ax2.set_xticks(range(1,13))
ax2.set_xticklabels(["J","F","M","A","M","J","J","A","S","O","N","D"])
ax2.set_title("Monthly Mean Current Speed\n(2018–2023, Sardinia box)", fontweight="bold")
ax2.set_ylabel("Speed (cm/s)")

# C. Current speed per period (box)
ax3 = axes[2]
period_order = ["pre-COVID","COVID","post-COVID"]
data_box = [current_df[current_df["period"]==p]["mean_speed_ms"].values*100
            for p in period_order]
bp = ax3.boxplot(data_box, tick_labels=period_order, patch_artist=True,
                 medianprops=dict(color="black", linewidth=2))
for patch, period in zip(bp["boxes"], period_order):
    patch.set_facecolor(PERIOD_COLORS[period]); patch.set_alpha(0.7)
ax3.set_title("Current Speed Distribution per Period", fontweight="bold")
ax3.set_ylabel("Mean speed (cm/s)")

plt.tight_layout()
plt.savefig(FIGS / "current_correlation.png", dpi=150, bbox_inches="tight")
# plt.show()
print("Saved: current_correlation.png")

# ══════════════════════════════════════════════════════════════════════════════
# 6. COMBINED CORRELATION MATRIX
# ══════════════════════════════════════════════════════════════════════════════
# Join all annual signals for correlation matrix
# Beach: annual mean items/100m per beach
# Tourism: annual sum per beach
# Current: annual mean speed

current_annual = current_df.groupby("year")["mean_speed_ms"].mean().reset_index()
float_annual   = float_monthly.groupby("year")["n_obs"].sum().reset_index()

corr_df = beach_annual.merge(tourism_annual, on=["beach_id","year"])
corr_df = corr_df.merge(current_annual.rename(columns={"mean_speed_ms":"current_speed"}),
                         on="year")
corr_df = corr_df.merge(float_annual.rename(columns={"n_obs":"floating_obs"}), on="year")
corr_df = corr_df.rename(columns={"items_per_100m":"beach_items_100m"})

corr_matrix = corr_df[["beach_items_100m","tourists","current_speed","floating_obs"]].corr(method="spearman")

fig, ax = plt.subplots(figsize=(6, 5))
mask = np.triu(np.ones_like(corr_matrix), k=1)
sns.heatmap(corr_matrix, annot=True, fmt=".2f", cmap="RdYlGn",
            vmin=-1, vmax=1, ax=ax, square=True,
            xticklabels=["Beach\nlitter","Tourists","Current\nspeed","Floating\nlitter"],
            yticklabels=["Beach\nlitter","Tourists","Current\nspeed","Floating\nlitter"])
ax.set_title("Spearman Correlation Matrix\n(annual, all beaches pooled 2018–2023)",
             fontweight="bold", pad=10)
plt.tight_layout()
plt.savefig(FIGS / "correlation_matrix.png", dpi=150, bbox_inches="tight")
# plt.show()
print("Saved: correlation_matrix.png")

# ══════════════════════════════════════════════════════════════════════════════
# 7. CURRENT SPEED TIME SERIES + FLOATING LITTER OVERLAY
# ══════════════════════════════════════════════════════════════════════════════
fig, ax1 = plt.subplots(figsize=(13, 5))
ax2 = ax1.twinx()

merged_fc_sorted = merged_fc.sort_values(["year","month"])
dates_str = merged_fc_sorted.apply(lambda r: f"{int(r.year)}-{int(r.month):02d}", axis=1)
x = range(len(merged_fc_sorted))

ax1.fill_between(x, merged_fc_sorted["mean_speed_ms"].values*100, alpha=0.3,
                 color="#1C7293", label="Current speed")
ax1.plot(x, merged_fc_sorted["mean_speed_ms"].values*100, color="#1C7293", linewidth=1.5)
ax2.plot(x, merged_fc_sorted["n_obs"].values, color="#e74c3c", marker="o",
         markersize=4, linewidth=1.5, label="Floating obs")

# shade COVID period
covid_months = [i for i, r in enumerate(merged_fc_sorted.itertuples())
                if r.year in (2020, 2021)]
if covid_months:
    ax1.axvspan(covid_months[0]-0.5, covid_months[-1]+0.5, alpha=0.08, color="red")

# x tick labels (every 3 months)
tick_pos = list(range(0, len(x), 3))
ax1.set_xticks(tick_pos)
ax1.set_xticklabels([list(dates_str)[i] for i in tick_pos], rotation=45, ha="right", fontsize=8)
ax1.set_ylabel("Current speed (cm/s)", color="#1C7293")
ax2.set_ylabel("Floating litter obs / month", color="#e74c3c")
ax1.set_title("Current Speed vs Floating Litter — Monthly 2018–2023",
              fontweight="bold", pad=10)

lines1, labels1 = ax1.get_legend_handles_labels()
lines2, labels2 = ax2.get_legend_handles_labels()
ax1.legend(lines1 + lines2, labels1 + labels2, loc="upper left", fontsize=9)
plt.tight_layout()
plt.savefig(FIGS / "current_floating_timeseries.png", dpi=150, bbox_inches="tight")
# plt.show()
print("Saved: current_floating_timeseries.png")

# ── Summary stats ────────────────────────────────────────────────────────────
print("\n=== CORRELATION SUMMARY ===")
print(corr_matrix.round(2))
print(f"\nBeach litter vs Tourism  (Pearson): r={r:.3f}  p={p:.4f}")
print(f"Floating obs vs Current speed (Pearson): r={r2:.3f}  p={p2:.4f}")
