"""
Update dashboard_data.json with:
  - comuni_hazard: per-coastal-comune hazard by year (simplified GeoJSON)
  - seafloor_by_year: already added by analysis_06_seafloor.py
  - composite_hazard_by_year: mean of all available compartments per cell

Run after analysis_05 and analysis_06.
"""
import json, math
import numpy as np
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DASH = ROOT / 'data' / 'dashboard_data.json'
COMUNI_GEOJSON = ROOT / 'data' / 'processed' / 'comuni_hazard.geojson'

print("Loading dashboard_data.json…")
with open(DASH) as f:
    dash = json.load(f)

# ── 1. Add comuni hazard (simplified for dashboard) ──────────────────────────
if COMUNI_GEOJSON.exists():
    print("Loading comuni GeoJSON…")
    with open(COMUNI_GEOJSON) as f:
        comuni_gj = json.load(f)

    # Simplify geometry: reduce coordinates precision, keep only needed props
    simplified_features = []
    for ft in comuni_gj['features']:
        props = {
            'name': ft['properties']['name'],
            'prov': ft['properties']['prov'],
            'hazard_by_year': ft['properties']['hazard_by_year'],
        }
        # Round coordinates to 4 decimal places to reduce size
        def round_coords(obj):
            if isinstance(obj, list):
                if obj and isinstance(obj[0], (int, float)):
                    return [round(x, 4) for x in obj]
                return [round_coords(x) for x in obj]
            return obj
        geom = {'type': ft['geometry']['type'],
                'coordinates': round_coords(ft['geometry']['coordinates'])}
        simplified_features.append({'type':'Feature','properties':props,'geometry':geom})

    dash['comuni_hazard_geojson'] = {
        'type': 'FeatureCollection',
        'features': simplified_features
    }
    print(f"  Added {len(simplified_features)} comuni features")
else:
    print("  comuni_hazard.geojson not found — run analysis_05 first")

# ── 2. Update composite hazard: mean(beach, floating, seafloor) ──────────────
print("Updating composite hazard…")
if 'seafloor_by_year' in dash and 'hazard_by_year' in dash:
    # hazard_by_year already contains beach+float composite
    # Add seafloor as 3rd compartment where available (2020-2023)
    beach_float = dash['hazard_by_year']
    seafloor    = dash['seafloor_by_year']

    composite3 = {}
    for yr in beach_float:
        if yr not in seafloor:
            composite3[yr] = beach_float[yr]
            continue
        # Build lookup for seafloor
        sf_map = {(round(lat,2), round(lon,2)): h for lat, lon, h in seafloor[yr]}
        cells = []
        for lat, lon, h_bf in beach_float[yr]:
            sf_key = (round(lat,2), round(lon,2))
            h_sf = sf_map.get(sf_key)
            if h_sf is not None:
                h_composite = round((h_bf + h_sf) / 2, 4)
            else:
                h_composite = h_bf
            cells.append([lat, lon, h_composite])
        composite3[yr] = cells

    dash['hazard_by_year_3comp'] = composite3
    print(f"  3-compartment composite: {list(composite3.keys())}")

# ── 3. Save ──────────────────────────────────────────────────────────────────
with open(DASH, 'w') as f:
    json.dump(dash, f, separators=(',',':'))
sz = DASH.stat().st_size / 1024
print(f"Saved: {DASH} ({sz:.0f}KB)")
print("Done.")
