# Dashboard — Marine Litter Hazard, Sardinia

Interactive dashboard built with React 19, Vite, Leaflet and Recharts.

**Live:** https://daniele22-u.github.io/hhe-labsardinia/

```bash
npm install
npm run dev       # development server → http://localhost:5173
npm run build     # production build → dist/ (served under /hhe-labsardinia/)
```

All data comes from `public/dashboard_data.json`, produced by the analysis pipeline in `../notebooks/`.
The basemap uses Esri's free World Dark Gray tiles: no API key needed, attribution shown on the map.
Deployment to GitHub Pages is automatic on push to `main` (see `../.github/workflows/deploy-dashboard.yml`).
