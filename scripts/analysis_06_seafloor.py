"""
Phase 6 — Seafloor Litter Compartment (MSFD Module 3 / MEDITS trawl surveys).

DATA SOURCE (manual download required):
  ISPRA Portal: https://www.isprambiente.gov.it/it/banche-dati/banche-dati-ita
  Dataset: "Rifiuti Marini — Fondo (Modulo 3)" or MEDITS trawl data
  Alternative (open): MSFD Article 17 reporting portal
    https://water.europa.eu/marine/msfd-data-access
  Select: Country=Italy, Descriptor=D10, Feature=Litter on seafloor
  Export as CSV → place in: data/raw/seafloor_raw.csv

Expected CSV columns (MSFD Modulo 3 standard):
  Campagna, CodiceCampionamento, StazioneMonitoraggio,
  Data, Latitudine, Longitudine, PesoTotale_kg, NumeroPezzi,
  LungArteHauled_km, JointListCategory (optional)

If MEDITS trawl:
  HAUL_ID, STRATUM, LAT_SHOOT, LON_SHOOT, SWEPT_AREA,
  LITTER_WEIGHT_KG, LITTER_ITEMS
"""
import pandas as pd
import numpy as np
import json
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from pathlib import Path
from scipy.interpolate import griddata

ROOT = Path(__file__).resolve().parents[1]
RAW  = ROOT / 'data' / 'raw'
OUT  = ROOT / 'data' / 'processed'
FIGS = ROOT / 'data' / 'figures'
DASH = ROOT / 'data' / 'dashboard_data.json'

# ── Sardinia grid (same as hazard grid) ──────────────────────────────────────
LAT_MIN, LAT_MAX = 38.8, 41.3
LON_MIN, LON_MAX = 8.1,  9.9
CELL = 0.12  # ~12km (coarser for seafloor — sparse sampling)

lats = np.arange(LAT_MIN, LAT_MAX, CELL)
lons = np.arange(LON_MIN, LON_MAX, CELL)
grid_pts = [(round(lat,3), round(lon,3)) for lat in lats for lon in lons]

def load_seafloor(path: Path) -> pd.DataFrame:
    """Load and harmonize seafloor CSV (MSFD Mod3 or MEDITS format)."""
    df = pd.read_csv(path, sep=None, engine='python')
    print(f"  Columns: {df.columns.tolist()}")

    # Detect format
    if 'LAT_SHOOT' in df.columns:
        # MEDITS format
        df = df.rename(columns={
            'LAT_SHOOT': 'lat', 'LON_SHOOT': 'lon',
            'LITTER_ITEMS': 'n_items', 'LITTER_WEIGHT_KG': 'weight_kg',
            'SWEPT_AREA': 'swept_area_km2', 'HAUL_ID': 'survey_id',
        })
        df['year'] = pd.to_datetime(df.get('DATE', '2021')).dt.year
    else:
        # MSFD Mod3 format
        df = df.rename(columns={
            'Latitudine': 'lat', 'Longitudine': 'lon',
            'NumeroPezzi': 'n_items', 'PesoTotale_kg': 'weight_kg',
            'LungArteHauled_km': 'haul_km', 'Data': 'date',
            'CodiceCampionamento': 'survey_id',
        })
        df['year'] = pd.to_datetime(df['date'], dayfirst=True).dt.year
        if 'haul_km' in df.columns:
            df['swept_area_km2'] = df['haul_km'] * 0.025  # ~25m net width
        else:
            df['swept_area_km2'] = 1.0  # default

    df = df.dropna(subset=['lat', 'lon', 'n_items'])
    df['density'] = df['n_items'] / df['swept_area_km2'].clip(lower=0.001)
    return df

def idw_seafloor(df_year, grid_pts, radius=1.5):
    """IDW interpolation for seafloor density."""
    pts = df_year[['lat','lon']].values
    vals = df_year['density'].values
    scores = []
    for glat, glon in grid_pts:
        dists = np.sqrt((pts[:,0]-glat)**2 + (pts[:,1]-glon)**2)
        mask = dists < radius
        if not mask.any():
            scores.append(None)
            continue
        w = 1 / (dists[mask]**2 + 1e-9)
        scores.append(float(np.sum(w * vals[mask]) / np.sum(w)))
    return scores

def normalize_global(scores_by_year):
    """Global min-max across all years."""
    all_vals = [v for yr_scores in scores_by_year.values()
                for v in yr_scores if v is not None]
    if not all_vals:
        return scores_by_year
    gmin, gmax = min(all_vals), max(all_vals)
    denom = gmax - gmin if gmax > gmin else 1
    return {
        yr: [None if v is None else (v - gmin) / denom for v in vals]
        for yr, vals in scores_by_year.items()
    }

# ── MAIN ──────────────────────────────────────────────────────────────────────
seafloor_csv = RAW / 'seafloor_raw.csv'

if not seafloor_csv.exists():
    print("=" * 60)
    print("SEAFLOOR DATA NOT FOUND")
    print(f"Expected: {seafloor_csv}")
    print()
    print("Download instructions:")
    print("  1. Go to: https://water.europa.eu/marine/msfd-data-access")
    print("     Country=Italy, Descriptor=D10, Feature=SeafloorLitter")
    print("  OR")
    print("  2. ISPRA portal: https://www.isprambiente.gov.it")
    print("     Search: 'Modulo 3 rifiuti fondo marino Sardegna'")
    print("  OR")
    print("  3. MEDITS trawl: https://www.fao.org/gfcm/data/medits")
    print()
    print("Place the downloaded CSV at:")
    print(f"  {seafloor_csv}")
    print()
    print("Generating SYNTHETIC placeholder data for development…")
    print("=" * 60)

    # Use REAL D8 station coordinates as proxy locations for synthetic litter data
    # (D8 sediment monitoring uses same offshore sampling network as D10 seafloor)
    d8_dir = ROOT / 'Labenv' / 'Modulo_D8_sedimenti_Med_Occ_2018-2023'
    d8_stations = []
    for f in sorted(d8_dir.glob('*.xlsx')):
        try:
            df_s = pd.ExcelFile(f).parse('Stazioni')
            df_s['source_file'] = f.name
            d8_stations.append(df_s[['NationalStationID','Latitude','Longitude','SeaDepth']].dropna(subset=['Latitude','Longitude']))
        except Exception as e:
            print(f"  Warning: {f.name}: {e}")

    if d8_stations:
        all_stations = pd.concat(d8_stations).drop_duplicates('NationalStationID').reset_index(drop=True)
        print(f"  Real D8 stations loaded: {len(all_stations)}")
    else:
        all_stations = None

    rng = np.random.default_rng(42)
    rows = []
    for yr in range(2020, 2024):
        if all_stations is not None:
            base_pts = all_stations
        else:
            # Fallback: random grid
            base_pts = pd.DataFrame({'Latitude': rng.uniform(38.9, 41.2, 24),
                                     'Longitude': rng.uniform(8.2, 9.8, 24),
                                     'SeaDepth': rng.uniform(20, 100, 24)})
        for _, row_s in base_pts.iterrows():
            lat, lon = row_s['Latitude'], row_s['Longitude']
            depth = row_s.get('SeaDepth', 50) or 50
            # Ecology-based heuristic:
            # Higher litter near west coast (upwelling), near Cagliari/Oristano gulfs
            # Deeper = less (>200m very low; canyon transport)
            coast_effect  = max(0, (9.4 - lon)) * 30   # west coast bias
            gulf_effect   = max(0, (39.6 - abs(lat - 39.2))) * 20  # Gulf of Cagliari
            depth_penalty = max(0, (depth - 50) * 0.3)
            density_base  = 60 + coast_effect + gulf_effect - depth_penalty
            density = max(0, density_base + rng.normal(0, 15))
            rows.append({'lat': lat, 'lon': lon,
                         'n_items': int(density * 0.5),
                         'weight_kg': density * 0.15,
                         'swept_area_km2': 0.5,
                         'density': density,
                         'year': yr,
                         'survey_id': f'SYN_{yr}_{row_s.get("NationalStationID","S")}'})
    df = pd.DataFrame(rows)
    print(f"  Synthetic records using real coords: {len(df)}")
else:
    df = load_seafloor(seafloor_csv)
    print(f"  Loaded {len(df)} seafloor records")

# Per-year IDW
YEARS = sorted(df['year'].unique())
print(f"  Years: {YEARS}")

raw_scores_by_year = {}
for yr in YEARS:
    sub = df[df['year'] == yr]
    print(f"  IDW {yr}: {len(sub)} obs")
    raw_scores_by_year[str(yr)] = idw_seafloor(sub, grid_pts)

norm_scores = normalize_global(raw_scores_by_year)

# Build seafloor_by_year: [[lat, lon, score], ...]
seafloor_by_year = {}
for yr in YEARS:
    cells = []
    for (glat, glon), s in zip(grid_pts, norm_scores[str(yr)]):
        if s is not None:
            cells.append([glat, glon, round(s, 4)])
    seafloor_by_year[str(yr)] = cells
    print(f"  {yr}: {len(cells)} grid cells with data")

# ── Save processed ────────────────────────────────────────────────────────────
out_json = OUT / 'seafloor_by_year.json'
with open(out_json, 'w') as f:
    json.dump(seafloor_by_year, f, separators=(',',':'))
print(f"Saved: {out_json}")

# ── Figure ────────────────────────────────────────────────────────────────────
import math
ncols = min(2, len(YEARS))
nrows = math.ceil(len(YEARS) / ncols)
fig, axes = plt.subplots(nrows, ncols, figsize=(6*ncols, 5*nrows), facecolor='#0a1628')
ax_flat = axes.flat if hasattr(axes, 'flat') else [axes]

cmap = plt.cm.YlOrRd
for ax, yr in zip(ax_flat, YEARS):
    ax.set_facecolor('#050e1f')
    cells = seafloor_by_year[str(yr)]
    if cells:
        lts, lns, hs = zip(*cells)
        sc = ax.scatter(lns, lts, c=hs, cmap=cmap, vmin=0, vmax=1,
                        s=18, alpha=0.8, linewidths=0)
    ax.set_title(str(yr), color='white', fontsize=10)
    ax.set_xlim(8.0, 10.0); ax.set_ylim(38.7, 41.4)
    ax.tick_params(colors='#555', labelsize=6)
    for sp in ax.spines.values(): sp.set_edgecolor('#333')

for ax in list(ax_flat)[len(YEARS):]:
    ax.set_visible(False)

fig.suptitle('Seafloor Litter Density (normalised) — Sardinia', color='white',
             fontsize=13, y=1.01)
plt.tight_layout()
fig_path = FIGS / 'seafloor_hazard_map.png'
plt.savefig(fig_path, dpi=150, bbox_inches='tight', facecolor='#0a1628')
print(f"Figure: {fig_path}")

# ── Append to dashboard_data.json ─────────────────────────────────────────────
print("\nUpdating dashboard_data.json…")
with open(DASH) as f:
    dash = json.load(f)

dash['seafloor_by_year'] = seafloor_by_year
# Update composite hazard: mean(beach, floating, seafloor) where all 3 available
# For now just add seafloor as new layer; composite update in update_dashboard_data.py

with open(DASH, 'w') as f:
    json.dump(dash, f, separators=(',',':'))
print(f"Updated: {DASH}")
print("Done — 'seafloor_by_year' added to dashboard_data.json")
print("NOTE: Using synthetic data. Replace data/raw/seafloor_raw.csv with real MEDITS data.")
