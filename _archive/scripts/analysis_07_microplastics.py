"""
Phase 7 — Microplastics (MSFD Modulo 2, Manta Trawl surveys).

DATA SOURCE: Labenv/Modulo_2_Med_Occ_2018-2023/ (12 Sardinia files, 2018–2023)

Sheet MicroplasticheRet: survey metadata including Superficie (m²) or
  LunghezzaPercorso + Larghezza_boccamanta to compute it.
Sheet MicroplasticheCamp: particle counts per SampleID (Num_oggetti).
Sheet Stazioni: station coordinates.

Processing:
  1. Load all 12 files, join Camp → Ret on SampleID
  2. density = sum(Num_oggetti) / Superficie per survey
  3. Aggregate mean density per station per year
  4. IDW interpolation on 10 km Sardinia grid
  5. Global min-max normalise → score 0–1
  6. Save JSON + figure + update dashboard_data.json
"""

import warnings
warnings.filterwarnings('ignore')

import pandas as pd
import numpy as np
import json
import math
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from pathlib import Path

ROOT  = Path(__file__).resolve().parents[1]
LABENV = ROOT / 'Labenv' / 'Modulo_2_Med_Occ_2018-2023'
OUT   = ROOT / 'data' / 'processed'
FIGS  = ROOT / 'data' / 'figures'
DASH  = ROOT / 'data' / 'dashboard_data.json'
DASH2 = ROOT / 'dashboard-react' / 'public' / 'dashboard_data.json'

OUT.mkdir(parents=True, exist_ok=True)
FIGS.mkdir(parents=True, exist_ok=True)

# ── Sardinia grid ─────────────────────────────────────────────────────────────
LAT_MIN, LAT_MAX = 38.8, 41.3
LON_MIN, LON_MAX = 8.1,  9.9
CELL = 0.12

lats = np.arange(LAT_MIN, LAT_MAX, CELL)
lons = np.arange(LON_MIN, LON_MAX, CELL)
grid_pts = [(round(float(la), 3), round(float(lo), 3)) for la in lats for lo in lons]


# ── Loaders ───────────────────────────────────────────────────────────────────
def read_file(fp: Path):
    """Return (df_stazioni, df_ret, df_camp) for one Modulo_2 file."""
    engine = 'openpyxl' if fp.suffix == '.xlsx' else 'xlrd'
    try:
        df_st   = pd.read_excel(fp, sheet_name='Stazioni',         engine=engine)
        df_ret  = pd.read_excel(fp, sheet_name='MicroplasticheRet', engine=engine)
        df_camp = pd.read_excel(fp, sheet_name='MicroplasticheCamp', engine=engine)
        return df_st, df_ret, df_camp
    except Exception as e:
        print(f"  WARNING: could not read {fp.name}: {e}")
        return None, None, None


def compute_superficie(df_ret: pd.DataFrame) -> pd.DataFrame:
    """Ensure a Superficie column exists in the ret dataframe."""
    if 'Superficie' in df_ret.columns:
        return df_ret
    # Derive from LunghezzaPercorso * Larghezza_boccamanta (or default 0.5 m)
    if 'Larghezza_boccamanta' in df_ret.columns:
        df_ret = df_ret.copy()
        df_ret['Superficie'] = df_ret['LunghezzaPercorso'] * df_ret['Larghezza_boccamanta']
    elif 'LunghezzaPercorso' in df_ret.columns:
        # Standard manta trawl mouth width = 0.5 m
        df_ret = df_ret.copy()
        df_ret['Superficie'] = df_ret['LunghezzaPercorso'] * 0.5
    else:
        df_ret = df_ret.copy()
        df_ret['Superficie'] = np.nan
    return df_ret


# ── Load all files ────────────────────────────────────────────────────────────
all_files = sorted(LABENV.glob('*.xls*'))
print(f"Found {len(all_files)} Modulo_2 files in {LABENV.name}")

station_frames = []
ret_frames     = []
camp_frames    = []

for fp in all_files:
    print(f"  Loading {fp.name} …")
    df_st, df_ret, df_camp = read_file(fp)
    if df_st is None:
        continue
    station_frames.append(df_st[['NationalStationID', 'Latitude', 'Longitude']].dropna())
    df_ret = compute_superficie(df_ret)
    ret_frames.append(df_ret)
    camp_frames.append(df_camp)

df_stations = pd.concat(station_frames, ignore_index=True).drop_duplicates('NationalStationID')
df_ret_all  = pd.concat(ret_frames,     ignore_index=True)
df_camp_all = pd.concat(camp_frames,    ignore_index=True)

print(f"\nTotal records — Ret: {len(df_ret_all)}, Camp: {len(df_camp_all)}, Stations: {len(df_stations)}")

# ── Join Camp → Ret on SampleID ───────────────────────────────────────────────
# Camp has one row per particle type per sample; sum Num_oggetti per SampleID
df_camp_agg = (
    df_camp_all
    .groupby('SampleID', as_index=False)['Num_oggetti']
    .sum()
    .rename(columns={'Num_oggetti': 'total_particles'})
)

# Ret: one row per sample (some files repeat across depths); deduplicate on SampleID
df_ret_key = (
    df_ret_all[['SampleID', 'NationalStationID', 'Year', 'Superficie']]
    .dropna(subset=['Superficie'])
    .drop_duplicates('SampleID')
)

df = df_ret_key.merge(df_camp_agg, on='SampleID', how='inner')
df['density'] = df['total_particles'] / df['Superficie'].clip(lower=1e-3)

print(f"Joined surveys: {len(df)}")
print(f"Years present: {sorted(df['Year'].dropna().unique())}")

# ── Merge station coordinates ──────────────────────────────────────────────────
# Normalise station ID format (some files use comma, some period in depth suffix)
df['station_norm'] = df['NationalStationID'].str.replace(',', '.', regex=False).str.strip()
df_stations['station_norm'] = df_stations['NationalStationID'].str.replace(',', '.', regex=False).str.strip()

df = df.merge(df_stations[['station_norm', 'Latitude', 'Longitude']],
              on='station_norm', how='left')

missing_coords = df['Latitude'].isna().sum()
print(f"Surveys missing coordinates: {missing_coords} / {len(df)}")
df = df.dropna(subset=['Latitude', 'Longitude', 'Year'])

# Sardinia bbox filter
df = df[
    (df['Latitude']  >= 38.5) & (df['Latitude']  <= 41.6) &
    (df['Longitude'] >= 7.8)  & (df['Longitude'] <= 10.2)
]
df['year'] = df['Year'].astype(int)

# ── Aggregate: mean density per station per year ──────────────────────────────
df_agg = (
    df.groupby(['year', 'station_norm', 'Latitude', 'Longitude'], as_index=False)
    ['density'].mean()
)
print(f"\nStation-year obs: {len(df_agg)}")
print(df_agg.groupby('year').size().to_string())


# ── IDW interpolation ─────────────────────────────────────────────────────────
def idw(pts_lat, pts_lon, vals, grid_pts, power=2, radius=1.5):
    pts = np.column_stack([pts_lat, pts_lon])
    scores = []
    for glat, glon in grid_pts:
        dists = np.sqrt((pts[:, 0] - glat) ** 2 + (pts[:, 1] - glon) ** 2)
        mask = dists < radius
        if not mask.any():
            scores.append(None)
            continue
        w = 1.0 / (dists[mask] ** power + 1e-9)
        scores.append(float(np.sum(w * vals[mask]) / np.sum(w)))
    return scores


YEARS = sorted(df_agg['year'].unique())
raw_by_year = {}
for yr in YEARS:
    sub = df_agg[df_agg['year'] == yr]
    print(f"  IDW {yr}: {len(sub)} stations")
    raw_by_year[str(yr)] = idw(
        sub['Latitude'].values,
        sub['Longitude'].values,
        sub['density'].values,
        grid_pts
    )

# ── Global min-max normalise ──────────────────────────────────────────────────
all_vals = [v for scores in raw_by_year.values() for v in scores if v is not None]
gmin, gmax = min(all_vals), max(all_vals)
denom = gmax - gmin if gmax > gmin else 1.0
print(f"\nGlobal density range: {gmin:.4f} – {gmax:.4f} particles/m²")

microplastics_by_year = {}
for yr in YEARS:
    cells = []
    for (glat, glon), s in zip(grid_pts, raw_by_year[str(yr)]):
        if s is not None:
            cells.append([glat, glon, round((s - gmin) / denom, 4)])
    microplastics_by_year[str(yr)] = cells
    print(f"  {yr}: {len(cells)} grid cells")

# ── Save JSON ─────────────────────────────────────────────────────────────────
out_json = OUT / 'microplastics_by_year.json'
with open(out_json, 'w') as f:
    json.dump(microplastics_by_year, f, separators=(',', ':'))
print(f"\nSaved: {out_json}")

# ── Figure ────────────────────────────────────────────────────────────────────
ncols = min(3, len(YEARS))
nrows = math.ceil(len(YEARS) / ncols)
fig, axes = plt.subplots(nrows, ncols, figsize=(6 * ncols, 5 * nrows), facecolor='#0a1628')
ax_flat = list(axes.flat) if hasattr(axes, 'flat') else [axes]

cmap = plt.cm.plasma
for ax, yr in zip(ax_flat, YEARS):
    ax.set_facecolor('#050e1f')
    cells = microplastics_by_year[str(yr)]
    if cells:
        lts, lns, hs = zip(*cells)
        ax.scatter(lns, lts, c=hs, cmap=cmap, vmin=0, vmax=1,
                   s=20, alpha=0.85, linewidths=0)
    ax.set_title(str(yr), color='white', fontsize=11)
    ax.set_xlim(7.9, 10.1)
    ax.set_ylim(38.4, 41.7)
    ax.tick_params(colors='#555', labelsize=6)
    for sp in ax.spines.values():
        sp.set_edgecolor('#333')

for ax in ax_flat[len(YEARS):]:
    ax.set_visible(False)

fig.suptitle('Microplastics Density (normalised) — Sardinia', color='white',
             fontsize=13, y=1.01)
plt.tight_layout()
fig_path = FIGS / 'microplastics_map.png'
plt.savefig(fig_path, dpi=150, bbox_inches='tight', facecolor='#0a1628')
plt.close()
print(f"Figure: {fig_path}")

# ── Update dashboard_data.json ────────────────────────────────────────────────
print("\nUpdating dashboard_data.json …")
with open(DASH) as f:
    dash = json.load(f)

dash['microplastics_by_year'] = microplastics_by_year

for dest in (DASH, DASH2):
    with open(dest, 'w') as f:
        json.dump(dash, f, separators=(',', ':'))
    print(f"  Written: {dest}")

print("\nDone — 'microplastics_by_year' added to dashboard_data.json")
