"""
Phase 5 — Spatial Refinement: per-coastal-comune hazard index.
Replaces 10km IDW grid cells with Sardinia coastal administrative segments.

Output:
  data/processed/comuni_hazard.json   — per-comune hazard by year
  data/figures/comuni_hazard_map.png  — static map

Requires:
  /tmp/italy_comuni.geojson  — download once via:
    curl -L https://raw.githubusercontent.com/openpolis/geojson-italy/master/geojson/limits_IT_municipalities.geojson -o /tmp/italy_comuni.geojson
"""
import json, math
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.colors import Normalize
from matplotlib.cm import ScalarMappable
from pathlib import Path
from shapely.geometry import shape, Point
from shapely.ops import unary_union

ROOT   = Path(__file__).resolve().parents[1]
GEOJSON = Path('/tmp/italy_comuni.geojson')
DASH   = ROOT / 'data' / 'dashboard_data.json'
OUT    = ROOT / 'data' / 'processed'
FIGS   = ROOT / 'data' / 'figures'
OUT.mkdir(parents=True, exist_ok=True)
FIGS.mkdir(parents=True, exist_ok=True)

# ── 1. Load comuni ───────────────────────────────────────────────────────────
print("Loading comuni…")
with open(GEOJSON) as f:
    gj = json.load(f)

sardegna = [ft for ft in gj['features'] if str(ft['properties'].get('reg_istat_code','')) == '20']
print(f"  Total Sardinia comuni: {len(sardegna)}")

# Build shapely objects
for ft in sardegna:
    ft['_geom'] = shape(ft['geometry'])

# Coastal comuni: those not fully inside ~8km inland buffer
sardinia_union = unary_union([ft['_geom'] for ft in sardegna])
inner = sardinia_union.buffer(-0.08)
coastal_comuni = [ft for ft in sardegna if not inner.contains(ft['_geom'])]
print(f"  Coastal comuni: {len(coastal_comuni)}")

# Precompute centroids
for ft in coastal_comuni:
    c = ft['_geom'].centroid
    ft['_cx'] = c.x
    ft['_cy'] = c.y

# ── 2. Load dashboard data ────────────────────────────────────────────────────
with open(DASH) as f:
    dash = json.load(f)

hazard_by_year = dash['hazard_by_year']  # {year: [[lat, lon, h], ...]}

# ── 3. Assign IDW grid cells → comuni ────────────────────────────────────────
def point_to_comune(lat, lon):
    """Return comune feature containing (lat,lon), or nearest centroid."""
    pt = Point(lon, lat)
    for ft in coastal_comuni:
        if ft['_geom'].contains(pt):
            return ft
    # fallback: nearest centroid
    best, bdist = None, 1e9
    for ft in coastal_comuni:
        d = (ft['_cx']-lon)**2 + (ft['_cy']-lat)**2
        if d < bdist:
            bdist, best = d, ft
    return best

print("Assigning grid cells to comuni…")
# For speed, build cell→comune mapping once using 2023 cells (same grid every year)
sample_year = sorted(hazard_by_year.keys())[0]
cells = hazard_by_year[sample_year]

cell_comune = {}
for i, (lat, lon, _) in enumerate(cells):
    ft = point_to_comune(lat, lon)
    if ft:
        cell_comune[(lat, lon)] = ft['properties']['name']

# ── 4. Aggregate hazard per comune per year ──────────────────────────────────
print("Aggregating hazard per comune…")
comuni_hazard = {}  # {year: {nome: mean_hazard}}

for yr, cells in hazard_by_year.items():
    agg = {}
    for lat, lon, h in cells:
        nome = cell_comune.get((lat, lon))
        if nome:
            agg.setdefault(nome, []).append(h)
    comuni_hazard[yr] = {k: float(np.mean(v)) for k, v in agg.items()}

# ── 5. Build GeoJSON output for dashboard ─────────────────────────────────────
print("Building output GeoJSON…")
output_features = []
for ft in coastal_comuni:
    nome = ft['properties']['name']
    hazard_ts = {yr: comuni_hazard[yr].get(nome, None) for yr in sorted(hazard_by_year.keys())}
    output_features.append({
        'type': 'Feature',
        'properties': {
            'name': nome,
            'prov': ft['properties']['prov_name'],
            'hazard_by_year': hazard_ts,
        },
        'geometry': ft['geometry'],
    })

output_geojson = {'type': 'FeatureCollection', 'features': output_features}
out_path = OUT / 'comuni_hazard.geojson'
with open(out_path, 'w') as f:
    json.dump(output_geojson, f, separators=(',',':'))
print(f"  Saved: {out_path} ({out_path.stat().st_size//1024}KB)")

# ── 6. Static map figure ─────────────────────────────────────────────────────
print("Generating figure…")
YEARS = sorted(hazard_by_year.keys())
ncols = min(3, len(YEARS))
nrows = math.ceil(len(YEARS) / ncols)

fig, axes = plt.subplots(nrows, ncols, figsize=(5*ncols, 5*nrows),
                         facecolor='#0a1628')
axes_flat = axes.flat if hasattr(axes, 'flat') else [axes]

cmap = plt.cm.RdYlGn_r
norm = Normalize(0, 1)

for ax, yr in zip(axes_flat, YEARS):
    ax.set_facecolor('#0a1628')
    ax.set_aspect('equal')
    hmap = comuni_hazard.get(yr, {})
    for ft in coastal_comuni:
        geom = ft['_geom']
        nome = ft['properties']['name']
        h = hmap.get(nome)
        color = cmap(norm(h)) if h is not None else '#1a2a3a'
        if geom.geom_type == 'Polygon':
            xs, ys = geom.exterior.xy
            ax.fill(xs, ys, color=color, linewidth=0.3, edgecolor='#0a1628')
        elif geom.geom_type == 'MultiPolygon':
            for part in geom.geoms:
                xs, ys = part.exterior.xy
                ax.fill(xs, ys, color=color, linewidth=0.3, edgecolor='#0a1628')
    ax.set_title(yr, color='white', fontsize=11, pad=4)
    ax.set_xlim(8.0, 10.0); ax.set_ylim(38.7, 41.4)
    ax.tick_params(colors='#444', labelsize=6)
    for spine in ax.spines.values():
        spine.set_edgecolor('#333')

# Hide empty axes
for ax in list(axes_flat)[len(YEARS):]:
    ax.set_visible(False)

sm = ScalarMappable(cmap=cmap, norm=norm)
sm.set_array([])
used_axes = [ax for ax in axes.flat] if hasattr(axes, 'flat') else [axes]
used_axes = used_axes[:len(YEARS)]
cbar = fig.colorbar(sm, ax=used_axes, orientation='vertical',
                    fraction=0.015, pad=0.02)
cbar.set_label('Hazard Index', color='white', fontsize=9)
cbar.ax.yaxis.set_tick_params(color='white', labelsize=7)
plt.setp(cbar.ax.yaxis.get_ticklabels(), color='white')

fig.suptitle('Hazard Index per Coastal Comune — Sardinia', color='white',
             fontsize=14, y=1.01)
plt.tight_layout()
fig_path = FIGS / 'comuni_hazard_map.png'
plt.savefig(fig_path, dpi=150, bbox_inches='tight', facecolor='#0a1628')
print(f"  Figure: {fig_path}")

print("\nDone. Add 'comuni_hazard_geojson' to dashboard_data.json to enable segment layer.")
print("Run: python scripts/update_dashboard_data.py to append to dashboard_data.json")
