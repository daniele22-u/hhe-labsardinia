"""
Phase 10 — Spatial Autocorrelation & LISA.

Implements (from scratch, no pysal required):
  1. Spatial weights matrix W — Queen contiguity on 0.12° regular grid
  2. Global Moran's I  per year (z-score, p-value via permutation)
  3. Local  Moran's I  per cell (Anselin 1995) → HH / LL / HL / LH cluster type
  4. Getis-Ord GI*     per cell → hotspot z-score (Ord & Getis 1995)

Output → dashboard_data.json:
  'moran_global'  : {year: {I, EI, z, p, interpretation}}
  'lisa_by_year'  : {year: [[lat, lon, local_I, cluster, gi_star], ...]}

Figures → data/figures/lisa_cluster_map.png
           data/figures/moran_scatter_*.png
"""
import json, math, itertools
import numpy as np
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Patch

ROOT = Path(__file__).resolve().parents[1]
DASH = ROOT / 'data' / 'dashboard_data.json'
FIGS = ROOT / 'data' / 'figures'
FIGS.mkdir(parents=True, exist_ok=True)

CELL  = 0.12   # grid resolution in degrees
EPS   = 1e-9
N_PERM = 999   # permutation draws for p-value

# ── 1. Load grid ──────────────────────────────────────────────────────────────
print("Loading dashboard_data.json…")
with open(DASH) as f:
    dash = json.load(f)

hazard_raw = dash['hazard_by_year']   # {year: [[lat, lon, h], ...]}
YEARS = sorted(hazard_raw.keys())
print(f"  Years: {YEARS}")

# Build canonical grid index from all cells seen across years
all_pts = set()
for yr in YEARS:
    for lat, lon, _ in hazard_raw[yr]:
        all_pts.add((round(lat, 3), round(lon, 3)))

pts = sorted(all_pts)          # list of (lat, lon)
idx = {p: i for i, p in enumerate(pts)}
n   = len(pts)
print(f"  Grid cells: {n}")

# ── 2. Spatial weights: Queen contiguity (0.12° step → neighbours ±1 cell) ───
print("Building Queen contiguity weights matrix…")
W_rows, W_cols = [], []  # COO format
for i, (lat, lon) in enumerate(pts):
    for dlat, dlon in itertools.product([-CELL, 0, CELL], repeat=2):
        if dlat == 0 and dlon == 0:
            continue
        nb = (round(lat + dlat, 3), round(lon + dlon, 3))
        if nb in idx:
            W_rows.append(i)
            W_cols.append(idx[nb])

# Row-standardise: w_ij = 1/ki  where ki = number of neighbours
W = np.zeros((n, n), dtype=np.float32)
for i, j in zip(W_rows, W_cols):
    W[i, j] = 1.0
ki = W.sum(axis=1, keepdims=True)
ki_safe = np.where(ki == 0, 1, ki)
W_std = W / ki_safe      # row-standardised
W_raw = W.copy()         # binary, used for GI*
print(f"  Non-zero weights: {(W_raw > 0).sum()}")

# ── 3. Helper: Global Moran's I ───────────────────────────────────────────────
def global_morans_I(x, W, n_perm=N_PERM):
    """
    Compute Global Moran's I.
    x      : array length n (raw values, may contain NaN → masked)
    W      : row-standardised weight matrix (n×n)
    Returns: dict {I, EI, z, p, interpretation}
    """
    mask  = ~np.isnan(x)
    xm    = x.copy()
    xm[~mask] = 0.0       # zero-fill missing
    xbar  = xm[mask].mean() if mask.any() else 0.0
    z     = xm - xbar
    z[~mask] = 0.0

    # Moran's I numerator / denominator
    Wz     = W @ z
    numer  = float(n * (z * Wz).sum())
    denom  = float((z ** 2).sum())
    W_sum  = float(W.sum())
    I      = numer / (W_sum * denom + EPS)

    # Expected value (analytical)
    n_obs = int(mask.sum())
    EI    = -1.0 / (n_obs - 1) if n_obs > 1 else 0.0

    # Permutation p-value
    rng   = np.random.default_rng(42)
    perm_I = np.empty(n_perm)
    vals_obs = xm[mask]
    for k in range(n_perm):
        shuffled = np.zeros(n)
        perm_vals = rng.permutation(vals_obs)
        shuffled[mask] = perm_vals - xbar
        Ws = W @ shuffled
        num_p = float(n * (shuffled * Ws).sum())
        den_p = float((shuffled ** 2).sum())
        perm_I[k] = num_p / (W_sum * den_p + EPS)

    sigma = perm_I.std() + EPS
    z_score = (I - EI) / sigma
    p_val   = float((np.abs(perm_I - EI) >= abs(I - EI)).mean())

    if p_val < 0.05:
        interpretation = "clustered" if I > EI else "dispersed"
    else:
        interpretation = "random"
    return {"I": round(I, 4), "EI": round(EI, 4),
            "z": round(z_score, 3), "p": round(p_val, 3),
            "interpretation": interpretation}

# ── 4. Local Moran's I (LISA) ─────────────────────────────────────────────────
def local_morans_I(x, W_std, n_perm=N_PERM):
    """
    Returns arrays (length n):
      local_I : local Moran statistic
      cluster : 'HH','LL','HL','LH','NS' (not significant at p<0.05)
      p_local : permutation pseudo-p per location
    """
    mask = ~np.isnan(x)
    xm   = x.copy(); xm[~mask] = 0.0
    xbar = xm[mask].mean() if mask.any() else 0.0
    z    = xm - xbar; z[~mask] = 0.0
    m2   = float((z ** 2).sum() / n + EPS)

    Wz      = W_std @ z
    local_I = (z / m2) * Wz

    # Pseudo-p via row-wise permutation
    rng    = np.random.default_rng(42)
    count_extreme = np.zeros(n, dtype=int)
    vals_obs = xm[mask]

    for _ in range(n_perm):
        perm = np.zeros(n)
        perm[mask] = rng.permutation(vals_obs) - xbar
        Wp  = W_std @ perm
        lI_p = (z / m2) * Wp
        count_extreme += (np.abs(lI_p) >= np.abs(local_I)).astype(int)

    p_local = count_extreme / n_perm

    # Classify cluster type (p < 0.05 threshold)
    cluster = np.full(n, 'NS', dtype=object)
    sig     = (p_local < 0.05) & mask
    Wz_std  = Wz                          # already W_std @ z

    cluster[sig & (z > 0) & (Wz_std > 0)] = 'HH'
    cluster[sig & (z < 0) & (Wz_std < 0)] = 'LL'
    cluster[sig & (z > 0) & (Wz_std < 0)] = 'HL'
    cluster[sig & (z < 0) & (Wz_std > 0)] = 'LH'

    return local_I, cluster, p_local

# ── 5. Getis-Ord GI* ──────────────────────────────────────────────────────────
def getis_ord_gi_star(x, W_raw):
    """
    GI* including self (diagonal = 1 → uses W_raw + identity).
    Returns z-score array length n.
    Reference: Ord & Getis 1995 eq. (7)
    """
    mask = ~np.isnan(x)
    xm   = x.copy(); xm[~mask] = 0.0

    # Include self-weight
    W_star = W_raw + np.eye(n, dtype=np.float32)
    wi     = W_star.sum(axis=1)             # sum of weights per row (incl. self)
    xbar   = xm[mask].mean() if mask.any() else 0.0
    s      = xm[mask].std() + EPS

    num  = (W_star @ xm) - wi * xbar
    n_obs = float(mask.sum())
    denom = s * np.sqrt((n_obs * wi - wi**2) / (n_obs - 1) + EPS)
    gi_z  = num / denom

    # Zero-out cells with no data
    gi_z[~mask] = 0.0
    return gi_z

# ── 6. Compute per year ───────────────────────────────────────────────────────
moran_global   = {}
lisa_by_year   = {}

for yr in YEARS:
    print(f"\n  ── {yr} ──")
    cells = hazard_raw[yr]
    x_arr = np.full(n, np.nan)
    for lat, lon, h in cells:
        k = idx.get((round(lat, 3), round(lon, 3)))
        if k is not None:
            x_arr[k] = h

    # Global Moran's I
    gI = global_morans_I(x_arr, W_std)
    moran_global[yr] = gI
    print(f"    Global Moran's I = {gI['I']}  z={gI['z']}  p={gI['p']}  → {gI['interpretation']}")

    # Local Moran's I
    loc_I, cluster, p_loc = local_morans_I(x_arr, W_std)
    n_sig = int((cluster != 'NS').sum())
    print(f"    LISA: {n_sig} significant cells — "
          + ", ".join(f"{t}:{int((cluster==t).sum())}"
                      for t in ['HH','LL','HL','LH']))

    # GI*
    gi_z = getis_ord_gi_star(x_arr, W_raw)
    n_hot  = int((gi_z >  1.96).sum())
    n_cold = int((gi_z < -1.96).sum())
    print(f"    GI*: {n_hot} hotspot cells (z>1.96), {n_cold} coldspot cells (z<-1.96)")

    # Assemble output: only cells that had data
    rows = []
    for i, (lat, lon) in enumerate(pts):
        if np.isnan(x_arr[i]):
            continue
        rows.append([lat, lon,
                     round(float(loc_I[i]), 4),
                     str(cluster[i]),
                     round(float(gi_z[i]), 3)])
    lisa_by_year[yr] = rows

# ── 7. Figures ────────────────────────────────────────────────────────────────
print("\nGenerating figures…")

CLUSTER_COLORS = {
    'HH': '#d7191c',   # High-High  → red
    'LL': '#2c7bb6',   # Low-Low    → blue
    'HL': '#fdae61',   # High-Low   → orange
    'LH': '#abd9e9',   # Low-High   → light blue
    'NS': '#2a2a3a',   # Not sig    → dark grey
}

ncols = min(3, len(YEARS))
nrows = math.ceil(len(YEARS) / ncols)
fig, axes = plt.subplots(nrows, ncols,
                          figsize=(6 * ncols, 5 * nrows),
                          facecolor='#0a1628')
axes_flat = axes.flat if hasattr(axes, 'flat') else [axes]

for ax, yr in zip(axes_flat, YEARS):
    ax.set_facecolor('#050e1f')
    rows = lisa_by_year[yr]
    if rows:
        lats   = [r[0] for r in rows]
        lons   = [r[1] for r in rows]
        colors = [CLUSTER_COLORS[r[3]] for r in rows]
        ax.scatter(lons, lats, c=colors, s=14, linewidths=0, alpha=0.9)
    ax.set_title(yr, color='white', fontsize=10)
    ax.set_xlim(7.9, 10.1); ax.set_ylim(38.6, 41.5)
    ax.tick_params(colors='#555', labelsize=6)
    for sp in ax.spines.values(): sp.set_edgecolor('#333')

for ax in list(axes_flat)[len(YEARS):]:
    ax.set_visible(False)

legend_patches = [Patch(color=c, label=k) for k, c in CLUSTER_COLORS.items()]
fig.legend(handles=legend_patches, loc='lower center', ncol=5,
           frameon=False, fontsize=9,
           labelcolor='white', facecolor='#0a1628')
fig.suptitle('LISA Cluster Map (Local Moran\'s I) — Sardinia Marine Hazard',
             color='white', fontsize=13)
plt.tight_layout(rect=[0, 0.04, 1, 0.98])
p = FIGS / 'lisa_cluster_map.png'
plt.savefig(p, dpi=150, bbox_inches='tight', facecolor='#0a1628')
plt.close()
print(f"  Saved: {p}")

# Moran scatterplot (all years, grid of subplots)
fig2, axes2 = plt.subplots(nrows, ncols,
                            figsize=(5 * ncols, 4 * nrows),
                            facecolor='#0a1628')
axes2_flat = axes2.flat if hasattr(axes2, 'flat') else [axes2]

for ax, yr in zip(axes2_flat, YEARS):
    ax.set_facecolor('#0d1b2e')
    cells = hazard_raw[yr]
    x_arr = np.full(n, np.nan)
    for lat, lon, h in cells:
        k = idx.get((round(lat, 3), round(lon, 3)))
        if k is not None: x_arr[k] = h

    mask  = ~np.isnan(x_arr)
    xm    = x_arr.copy(); xm[~mask] = 0.0
    xbar  = xm[mask].mean()
    z     = xm - xbar; z[~mask] = np.nan
    Wz    = W_std @ np.nan_to_num(z)
    Wz[~mask] = np.nan

    zi    = z[mask]; Wzi = Wz[mask]
    ax.scatter(zi, Wzi, s=6, alpha=0.6, c='#1C7293')
    lims = max(abs(zi).max(), abs(Wzi).max()) * 1.05
    ax.axhline(0, color='#555', lw=0.5); ax.axvline(0, color='#555', lw=0.5)
    ax.set_xlim(-lims, lims); ax.set_ylim(-lims, lims)
    # Moran slope
    slope = float(np.polyfit(zi, Wzi, 1)[0])
    ax.plot([-lims, lims], [-lims * slope, lims * slope], 'r--', lw=1, alpha=0.7)
    gI = moran_global[yr]
    ax.set_title(f"{yr}  I={gI['I']}  p={gI['p']}", color='white', fontsize=9)
    ax.set_xlabel('z(x)', color='#888', fontsize=7)
    ax.set_ylabel('W·z(x)', color='#888', fontsize=7)
    ax.tick_params(colors='#555', labelsize=6)
    for sp in ax.spines.values(): sp.set_edgecolor('#333')

for ax in list(axes2_flat)[len(YEARS):]:
    ax.set_visible(False)

fig2.suptitle("Moran Scatterplot — Marine Hazard per Year", color='white', fontsize=12)
plt.tight_layout(rect=[0, 0, 1, 0.97])
p2 = FIGS / 'moran_scatter.png'
plt.savefig(p2, dpi=150, bbox_inches='tight', facecolor='#0a1628')
plt.close()
print(f"  Saved: {p2}")

# GI* hotspot maps
fig3, axes3 = plt.subplots(nrows, ncols,
                            figsize=(6 * ncols, 5 * nrows),
                            facecolor='#0a1628')
axes3_flat = axes3.flat if hasattr(axes3, 'flat') else [axes3]

for ax, yr in zip(axes3_flat, YEARS):
    ax.set_facecolor('#050e1f')
    rows = lisa_by_year[yr]
    if rows:
        lats = [r[0] for r in rows]
        lons = [r[1] for r in rows]
        gi_vals = [r[4] for r in rows]
        sc = ax.scatter(lons, lats, c=gi_vals,
                        cmap='RdBu_r', vmin=-3, vmax=3,
                        s=14, linewidths=0, alpha=0.9)
    ax.set_title(yr, color='white', fontsize=10)
    ax.set_xlim(7.9, 10.1); ax.set_ylim(38.6, 41.5)
    ax.tick_params(colors='#555', labelsize=6)
    for sp in ax.spines.values(): sp.set_edgecolor('#333')

for ax in list(axes3_flat)[len(YEARS):]:
    ax.set_visible(False)

fig3.suptitle("Getis-Ord GI* Hotspot Z-scores — Sardinia Marine Hazard",
              color='white', fontsize=12)
plt.tight_layout(rect=[0, 0.02, 1, 0.97])
cbar_ax = fig3.add_axes([0.2, 0.01, 0.6, 0.018])
sm = plt.cm.ScalarMappable(cmap='RdBu_r',
                            norm=plt.Normalize(vmin=-3, vmax=3))
sm.set_array([])
cb = fig3.colorbar(sm, cax=cbar_ax, orientation='horizontal')
cb.set_label('GI* z-score (>1.96 = hotspot, <-1.96 = coldspot)',
             color='white', fontsize=8)
cb.ax.tick_params(labelsize=7, colors='white')
p3 = FIGS / 'gi_star_map.png'
plt.savefig(p3, dpi=150, bbox_inches='tight', facecolor='#0a1628')
plt.close()
print(f"  Saved: {p3}")

# ── 8. Save to dashboard_data.json ───────────────────────────────────────────
print("\nUpdating dashboard_data.json…")
dash['moran_global']  = moran_global
dash['lisa_by_year']  = lisa_by_year

with open(DASH, 'w') as f:
    json.dump(dash, f, separators=(',', ':'))
sz = DASH.stat().st_size / 1024
print(f"Saved: {DASH} ({sz:.0f} KB)")
print("Done.")
print()
print("Global Moran's I summary:")
print(f"  {'Year':>6}  {'I':>7}  {'z':>7}  {'p':>6}  interpretation")
print(f"  {'----':>6}  {'-------':>7}  {'-------':>7}  {'------':>6}  ---------------")
for yr in YEARS:
    g = moran_global[yr]
    print(f"  {yr:>6}  {g['I']:>7.4f}  {g['z']:>7.3f}  {g['p']:>6.3f}  {g['interpretation']}")
