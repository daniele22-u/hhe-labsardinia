"""
Phase 9 — Ingestion events (MSFD D10 Standard RIF-ING, 2018–2023).

DATA SOURCE: Labenv/Standard_D10_RIF-ING_ISPRA_2018-2023/ (5 Sardinia files)

Sheet Esemplare: one row per stranded animal with plastic in digestive tract.
  Columns: ID_Esemplare, Specie, Year, Month, Day, Latitude, Longitude,
           Status_Salute, Causa_Morte, Ingestion, etc.
Sheet Ingested: per-animal plastic material type (ID_Esemplare, ID_categoria,
  Organo/Feci, Num_totale).

Processing:
  1. Load all 5 files, concat Esemplare sheets (+ Ingested where available)
  2. Filter to Sardinia bbox
  3. Deduplicate on ID_Esemplare
  4. Annual count + species breakdown (+ top material category if Ingested present)
  5. Save CSV + scatter map figure + update dashboard_data.json
  6. Compute biological_impact_by_year (entanglement + ingestion combined, normalised)
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
LABENV = ROOT / 'Labenv' / 'Standard_D10_RIF-ING_ISPRA_2018-2023'
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
# Also pick up any typo-named file (e.g. tandard_*)
all_files += sorted(LABENV.glob('*.xls'))
all_files = sorted(set(all_files))
print(f"Found {len(all_files)} ING files in {LABENV.name}")

esemplare_frames = []
ingested_frames  = []

for fp in all_files:
    print(f"  Loading {fp.name} …")
    engine = 'openpyxl' if fp.suffix == '.xlsx' else 'xlrd'
    try:
        df_es = pd.read_excel(fp, sheet_name='Esemplare', engine=engine)
        df_es['source_file'] = fp.name
        esemplare_frames.append(df_es)

        # Try to load Ingested sheet for material-type info
        try:
            df_ing = pd.read_excel(fp, sheet_name='Ingested', engine=engine)
            df_ing['source_file'] = fp.name
            ingested_frames.append(df_ing)
        except Exception:
            pass  # Ingested sheet may be absent in some files

        print(f"    Esemplare: {len(df_es)} rows")
    except Exception as e:
        print(f"    WARNING: {e}")

if not esemplare_frames:
    raise RuntimeError("No ING files loaded — check path.")

df_all = pd.concat(esemplare_frames, ignore_index=True)
print(f"\nTotal rows before dedup: {len(df_all)}")

# ── Clean & filter ────────────────────────────────────────────────────────────
df_all.columns = df_all.columns.str.strip()

# Some files use 'Weigth' (typo) — rename to Weight for consistency
if 'Weigth' in df_all.columns and 'Weight' not in df_all.columns:
    df_all = df_all.rename(columns={'Weigth': 'Weight'})

# Coerce coordinates and year
for col in ('Latitude', 'Longitude', 'Year'):
    if col in df_all.columns:
        df_all[col] = pd.to_numeric(df_all[col], errors='coerce')

# Deduplicate on ID_Esemplare
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

# ── Ingested material type (optional) ────────────────────────────────────────
material_by_animal = {}
if ingested_frames:
    df_ing_all = pd.concat(ingested_frames, ignore_index=True)
    df_ing_all.columns = df_ing_all.columns.str.strip()
    if 'ID_Esemplare' in df_ing_all.columns and 'ID_categoria' in df_ing_all.columns:
        # Top material per animal (by Num_totale if available, else first category)
        if 'Num_totale' in df_ing_all.columns:
            df_ing_all['Num_totale'] = pd.to_numeric(df_ing_all['Num_totale'], errors='coerce').fillna(0)
            top_mat = (
                df_ing_all.sort_values('Num_totale', ascending=False)
                .drop_duplicates('ID_Esemplare', keep='first')
                [['ID_Esemplare', 'ID_categoria']]
            )
        else:
            top_mat = (
                df_ing_all.drop_duplicates('ID_Esemplare', keep='first')
                [['ID_Esemplare', 'ID_categoria']]
            )
        material_by_animal = dict(zip(
            top_mat['ID_Esemplare'].astype(str),
            top_mat['ID_categoria'].astype(str)
        ))
    print(f"Material types loaded for {len(material_by_animal)} animals")

# Add material type to main dataframe
if material_by_animal and 'ID_Esemplare' in df_sar.columns:
    df_sar['material_type'] = df_sar['ID_Esemplare'].astype(str).map(material_by_animal)

# ── Compute annual summaries ───────────────────────────────────────────────────
ingestion_annual = {}

for yr, grp in df_sar.groupby('year'):
    total = len(grp)

    species_counts = {}
    if 'Specie' in grp.columns:
        species_counts = {
            str(k): int(v)
            for k, v in grp['Specie'].fillna('Unknown').value_counts().items()
        }

    material_counts = {}
    if 'material_type' in grp.columns:
        material_counts = {
            str(k): int(v)
            for k, v in grp['material_type'].dropna().value_counts().items()
        }

    ingestion_annual[str(yr)] = {
        'total': int(total),
        'species': species_counts,
        'by_material': material_counts,
    }

print("\nIngestion annual summary:")
for yr, v in sorted(ingestion_annual.items()):
    print(f"  {yr}: total={v['total']}, species={v['species']}")

# ── Save CSV ──────────────────────────────────────────────────────────────────
csv_cols = [c for c in ['ID_Esemplare', 'year', 'Latitude', 'Longitude',
                         'Specie', 'Status_Salute', 'Causa_Morte',
                         'material_type', 'source_file']
            if c in df_sar.columns]
df_out = df_sar[csv_cols].copy()
out_csv = OUT / 'ingestion_sardinia.csv'
df_out.to_csv(out_csv, index=False)
print(f"\nSaved CSV: {out_csv}")

# ── Figure: scatter map by species, coloured by year ─────────────────────────
fig, ax = plt.subplots(figsize=(8, 10), facecolor='#0a1628')
ax.set_facecolor('#050e1f')

years_present = sorted(df_sar['year'].unique())
species_list  = df_sar['Specie'].fillna('Unknown').unique()
markers = ['o', 's', '^', 'D', 'v', 'P', '*', 'X']
marker_map = {sp: markers[i % len(markers)] for i, sp in enumerate(species_list)}

year_cmap  = cm.get_cmap('autumn', len(years_present))
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

sm = plt.cm.ScalarMappable(cmap='autumn',
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

ax.set_title('Ingestion Events — Sardinia 2018–2023', color='white', fontsize=13)
fig.tight_layout()
fig_path = FIGS / 'ingestion_map.png'
plt.savefig(fig_path, dpi=150, bbox_inches='tight', facecolor='#0a1628')
plt.close()
print(f"Figure: {fig_path}")

# ── Update dashboard_data.json ────────────────────────────────────────────────
print("\nUpdating dashboard_data.json …")
with open(DASH) as f:
    dash = json.load(f)

dash['ingestion_annual'] = ingestion_annual

# ── Biological impact: combined entanglement + ingestion, normalised ──────────
ent_annual = dash.get('entanglement_annual', {})

all_years = sorted(set(list(ent_annual.keys()) + list(ingestion_annual.keys())))
combined_counts = {}
for yr in all_years:
    ent_n  = ent_annual.get(yr, {}).get('total', 0)
    ing_n  = ingestion_annual.get(yr, {}).get('total', 0)
    combined_counts[yr] = ent_n + ing_n

max_count = max(combined_counts.values()) if combined_counts else 1
min_count = min(combined_counts.values()) if combined_counts else 0
denom = max_count - min_count if max_count > min_count else 1.0

biological_impact_by_year = {
    yr: {
        'entanglement': ent_annual.get(yr, {}).get('total', 0),
        'ingestion': ingestion_annual.get(yr, {}).get('total', 0),
        'combined': combined_counts[yr],
        'score': round((combined_counts[yr] - min_count) / denom, 4),
    }
    for yr in all_years
}

print("\nBiological impact by year:")
for yr, v in sorted(biological_impact_by_year.items()):
    print(f"  {yr}: ent={v['entanglement']}, ing={v['ingestion']}, "
          f"combined={v['combined']}, score={v['score']:.3f}")

dash['biological_impact_by_year'] = biological_impact_by_year

for dest in (DASH, DASH2):
    with open(dest, 'w') as f:
        json.dump(dash, f, separators=(',', ':'))
    print(f"  Written: {dest}")

print("\nDone — 'ingestion_annual' and 'biological_impact_by_year' added to dashboard_data.json")
