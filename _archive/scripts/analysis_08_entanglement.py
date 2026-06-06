"""
Phase 8 — Entanglement events (MSFD D10 Standard RIF-ENT, 2018–2023).

DATA SOURCE: Labenv/Standard_D10_RIF-ENT_ISPRA_2018-2023/ (5 Sardinia files)

Sheet Esemplare: one row per stranded/entangled animal with Year, Lat, Lon,
  Specie, Status_Salute, Causa_Morte, Lesioni, ID_Esemplare.

Processing:
  1. Load all 5 files, concat Esemplare sheets
  2. Filter to Sardinia bbox (lat 38.5–41.6, lon 7.8–10.2)
  3. Deduplicate on ID_Esemplare
  4. Annual count + species breakdown + status breakdown
  5. Save CSV + scatter map figure + update dashboard_data.json
"""

import warnings
warnings.filterwarnings('ignore')

import pandas as pd
import numpy as np
import json
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.cm as cm
from pathlib import Path

ROOT   = Path(__file__).resolve().parents[1]
LABENV = ROOT / 'Labenv' / 'Standard_D10_RIF-ENT_ISPRA_2018-2023'
OUT    = ROOT / 'data' / 'processed'
FIGS   = ROOT / 'data' / 'figures'
DASH   = ROOT / 'data' / 'dashboard_data.json'
DASH2  = ROOT / 'dashboard-react' / 'public' / 'dashboard_data.json'

OUT.mkdir(parents=True, exist_ok=True)
FIGS.mkdir(parents=True, exist_ok=True)

# Sardinia bounding box
LAT_MIN, LAT_MAX = 38.5, 41.6
LON_MIN, LON_MAX = 7.8, 10.2


# ── Load files ────────────────────────────────────────────────────────────────
all_files = sorted(LABENV.glob('*.xlsx'))
print(f"Found {len(all_files)} ENT files in {LABENV.name}")

frames = []
for fp in all_files:
    print(f"  Loading {fp.name} …")
    try:
        df = pd.read_excel(fp, sheet_name='Esemplare', engine='openpyxl')
        df['source_file'] = fp.name
        frames.append(df)
        print(f"    {len(df)} rows, cols: {list(df.columns)}")
    except Exception as e:
        print(f"    WARNING: {e}")

if not frames:
    raise RuntimeError("No ENT files loaded — check path.")

df_all = pd.concat(frames, ignore_index=True)
print(f"\nTotal rows before dedup: {len(df_all)}")

# ── Clean & filter ────────────────────────────────────────────────────────────
# Standardise column names (some files may have slight variations)
df_all.columns = df_all.columns.str.strip()

# Coerce coordinates to numeric
for col in ('Latitude', 'Longitude'):
    if col in df_all.columns:
        df_all[col] = pd.to_numeric(df_all[col], errors='coerce')

# Coerce Year
df_all['Year'] = pd.to_numeric(df_all.get('Year', np.nan), errors='coerce')

# Deduplicate on ID_Esemplare (keep first occurrence)
if 'ID_Esemplare' in df_all.columns:
    df_all = df_all.drop_duplicates(subset='ID_Esemplare', keep='first')
    print(f"After dedup on ID_Esemplare: {len(df_all)}")

# Filter to Sardinia bbox
df_sar = df_all[
    df_all['Latitude'].between(LAT_MIN, LAT_MAX) &
    df_all['Longitude'].between(LON_MIN, LON_MAX) &
    df_all['Year'].notna()
].copy()
df_sar['year'] = df_sar['Year'].astype(int)

print(f"After Sardinia bbox filter: {len(df_sar)} records")
print(f"Years: {sorted(df_sar['year'].unique())}")
print(f"Species: {df_sar['Specie'].value_counts().to_dict()}")

# ── Compute annual summaries ───────────────────────────────────────────────────
entanglement_annual = {}

for yr, grp in df_sar.groupby('year'):
    total = len(grp)

    # Species breakdown
    species_counts = {}
    if 'Specie' in grp.columns:
        species_counts = (
            grp['Specie'].fillna('Unknown')
            .value_counts()
            .to_dict()
        )
        # Convert keys to str for JSON serialisation
        species_counts = {str(k): int(v) for k, v in species_counts.items()}

    # Status_Salute breakdown
    status_counts = {}
    if 'Status_Salute' in grp.columns:
        status_counts = (
            grp['Status_Salute'].fillna('Unknown')
            .value_counts()
            .to_dict()
        )
        status_counts = {str(k): int(v) for k, v in status_counts.items()}

    entanglement_annual[str(yr)] = {
        'total': int(total),
        'species': species_counts,
        'by_status': status_counts,
    }

print("\nEntanglement annual summary:")
for yr, v in sorted(entanglement_annual.items()):
    print(f"  {yr}: total={v['total']}, species={v['species']}")

# ── Save CSV ──────────────────────────────────────────────────────────────────
csv_cols = [c for c in ['ID_Esemplare', 'year', 'Latitude', 'Longitude',
                         'Specie', 'Status_Salute', 'Causa_Morte', 'Lesioni',
                         'source_file']
            if c in df_sar.columns]
df_out = df_sar[csv_cols].copy()
out_csv = OUT / 'entanglement_sardinia.csv'
df_out.to_csv(out_csv, index=False)
print(f"\nSaved CSV: {out_csv}")

# ── Figure: scatter map by species, coloured by year ─────────────────────────
fig, ax = plt.subplots(figsize=(8, 10), facecolor='#0a1628')
ax.set_facecolor('#050e1f')

years_present = sorted(df_sar['year'].unique())
species_list  = df_sar['Specie'].fillna('Unknown').unique()
markers = ['o', 's', '^', 'D', 'v', 'P', '*', 'X']
marker_map = {sp: markers[i % len(markers)] for i, sp in enumerate(species_list)}

year_cmap = cm.get_cmap('cool', len(years_present))
year_color = {yr: year_cmap(i) for i, yr in enumerate(years_present)}

for sp in species_list:
    sub = df_sar[df_sar['Specie'].fillna('Unknown') == sp]
    colors = [year_color[yr] for yr in sub['year']]
    ax.scatter(
        sub['Longitude'], sub['Latitude'],
        c=colors,
        marker=marker_map[sp],
        s=60, alpha=0.85, linewidths=0.4, edgecolors='white',
        label=str(sp)
    )

# Colourbar for years
sm = plt.cm.ScalarMappable(cmap='cool',
                            norm=plt.Normalize(min(years_present), max(years_present)))
sm.set_array([])
cbar = plt.colorbar(sm, ax=ax, fraction=0.03, pad=0.04)
cbar.set_label('Year', color='white')
cbar.ax.yaxis.set_tick_params(color='white')
plt.setp(cbar.ax.yaxis.get_ticklabels(), color='white')

ax.set_xlim(7.7, 10.3)
ax.set_ylim(38.3, 41.8)
ax.set_xlabel('Longitude', color='white')
ax.set_ylabel('Latitude', color='white')
ax.tick_params(colors='#aaa', labelsize=8)
for sp in ax.spines.values():
    sp.set_edgecolor('#333')

legend = ax.legend(title='Species', loc='lower right',
                   facecolor='#0a1628', edgecolor='#555',
                   labelcolor='white', fontsize=7, title_fontsize=8)
legend.get_title().set_color('white')

ax.set_title('Entanglement Events — Sardinia 2018–2023', color='white', fontsize=13)
fig.tight_layout()
fig_path = FIGS / 'entanglement_map.png'
plt.savefig(fig_path, dpi=150, bbox_inches='tight', facecolor='#0a1628')
plt.close()
print(f"Figure: {fig_path}")

# ── Update dashboard_data.json ────────────────────────────────────────────────
print("\nUpdating dashboard_data.json …")
with open(DASH) as f:
    dash = json.load(f)

dash['entanglement_annual'] = entanglement_annual

for dest in (DASH, DASH2):
    with open(dest, 'w') as f:
        json.dump(dash, f, separators=(',', ':'))
    print(f"  Written: {dest}")

print("\nDone — 'entanglement_annual' added to dashboard_data.json")
