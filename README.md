# Marine Litter Hazard Assessment — Sardinia

MSFD Descriptor 10 analysis of marine litter hazard along the Sardinian coast, 2018–2023.

---

## Repo structure

```
hhe-labsardinia/
├── Labenv/                          # raw input data (ISPRA/CNR-IAS Excel files)
│   ├── Modulo_4_*/                  # beach litter surveys
│   ├── Modulo_2bis_*/               # floating litter transects
│   ├── Modulo_2_*/                  # microplastics
│   ├── Modulo_D8_*/                 # seafloor sediments
│   └── Standard_D10_*/              # ingestion & entanglement
├── data/
│   ├── processed/                   # cleaned CSVs + GeoJSONs
│   ├── figures/                     # output plots (PNG)
│   ├── dashboard_data.json          # aggregated dashboard data
│   ├── sardinia_hazard_index.html   # interactive Folium hazard map
│   └── top10_categorie_per_anno.xlsx
├── notebooks/
│   └── 00_analysis.ipynb            # full pipeline: cleaning → EDA → hazard
├── dashboard-react/                 # interactive web dashboard
│   ├── src/                         # React source
│   ├── dist/                        # production build (ready to deploy)
│   └── package.json
├── report/
│   ├── report.pdf                   # full LaTeX report
│   └── report.tex
└── _archive/                        # superseded scripts and assets
```

---

## Quickstart

### 1. Run the analysis notebook

```bash
cd notebooks
jupyter lab 00_analysis.ipynb
```

Runs end-to-end: data cleaning → EDA → spatial hazard index → coastal comune refinement.
Requires kernel with: `pandas`, `numpy`, `matplotlib`, `seaborn`, `geopandas`, `folium`, `scipy`, `shapely`, `geodatasets`, `xlrd`, `openpyxl`.

### 2. Open the interactive map

```
data/sardinia_hazard_index.html
```

Open directly in browser — no server needed.

### 3. Run the web dashboard

```bash
cd dashboard-react
npm install       # first time only
npm run dev       # dev server → http://localhost:5173
npm run build     # production build → dist/
npm run preview   # preview built version
```

---

## Data sources

| Module | Content | Years |
|--------|---------|-------|
| Modulo 4 | Beach litter surveys (MSFD JRC protocol) | 2018–2023 |
| Modulo 2bis | Floating litter aerial/boat transects | 2018–2023 |
| Modulo 2 | Microplastics (net trawls) | 2021–2023 |
| Modulo D8 | Seafloor sediment microplastics | 2021–2023 |
| Standard D10 RIF-ING | Ingestion (seabirds, turtles) | 2018–2023 |
| Standard D10 RIF-ENT | Entanglement | 2018–2023 |

Category codes follow the EU MSFD Joint List (G-prefix = pre-2022, J-prefix = 2022+; same items, different encoding).

---

## Key outputs

| File | Description |
|------|-------------|
| `data/sardinia_hazard_index.html` | Interactive choropleth: composite hazard index, 10km IDW grid |
| `data/figures/comuni_hazard_map.png` | Per-coastal-comune hazard, 2018–2023 |
| `data/figures/beach_top_categories_by_year.png` | Top 10 litter categories per year |
| `data/figures/hazard_index_map.png` | Static 3-panel map (beach / floating / composite) |
| `data/top10_categorie_per_anno.xlsx` | Top 10 litter categories per year (wide format) |
| `report/report.pdf` | Full scientific report |
