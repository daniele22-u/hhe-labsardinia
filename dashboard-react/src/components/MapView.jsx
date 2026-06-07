import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { hcolor, hclass } from '../constants';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function sfcolor(h) {
  if (h < 0.2) return '#ffffb2';
  if (h < 0.4) return '#fecc5c';
  if (h < 0.6) return '#fd8d3c';
  if (h < 0.8) return '#f03b20';
  return '#bd0026';
}

const LISA_COLORS = {
  HH: '#d7191c',   // High-High  → red
  LL: '#2c7bb6',   // Low-Low    → blue
  HL: '#fdae61',   // High-Low   → orange (spatial outlier)
  LH: '#abd9e9',   // Low-High   → light blue (spatial outlier)
  NS: 'transparent',
};

export default function MapView({ D, year, layers, compositeFactors }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const hazardRef    = useRef(null);
  const floatRef     = useRef(null);
  const arrowRef     = useRef(null);
  const beachRef     = useRef(null);
  const seafloorRef  = useRef(null);
  const comuniRef    = useRef(null);
  const microRef     = useRef(null);
  const lisaRef      = useRef(null);

  // Init map once
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;
    const map = L.map(containerRef.current, { center: [40.0, 9.1], zoom: 7, zoomControl: true });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© CartoDB', subdomains: 'abcd', maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Beach markers — once
  useEffect(() => {
    if (!mapRef.current || !D) return;
    if (beachRef.current) beachRef.current.remove();
    const markers = D.beach_stations.map(st => {
      if (!st.lat || !st.lon) return null;
      const col  = D.beach_colors[st.beach_id] || '#f39c12';
      const name = D.beach_names[st.beach_id]  || st.beach_id;
      const history = D.beach_annual
        .filter(d => d.beach_id === st.beach_id)
        .sort((a, b) => a.year - b.year)
        .map(d => `<div style="display:flex;justify-content:space-between;"><span>${d.year}:</span> <b>${d.items_per_100m}</b></div>`)
        .join('');
      const tooltipHTML = `
        <div style="font-family:Inter,sans-serif;font-size:11px;min-width:100px;">
          <b style="color:${col};font-size:12px;display:block;border-bottom:1px solid var(--border2);padding-bottom:4px;margin-bottom:4px;">${name}</b>
          ${history || 'No data'}
        </div>
      `;
      return L.circleMarker([st.lat, st.lon], {
        radius: 8, fillColor: col, color: '#fff', weight: 2, fillOpacity: 0.9,
      }).bindTooltip(tooltipHTML, { sticky: true });
    }).filter(Boolean);
    beachRef.current = L.layerGroup(markers).addTo(mapRef.current);
  }, [D]);

  // Hazard grid — rebuild on D + year, show/hide on layers.hazard
  // Now computes the spatial Composite Score per cell:
  // Cell Litter (35%) + Annual Plastic (25%) + Annual Currents (20%) + Annual Bio (20%)
  useEffect(() => {
    if (!mapRef.current || !D) return;
    if (hazardRef.current) hazardRef.current.remove();
    const cells = D.hazard_by_year?.[String(year)] || [];
    const cell  = 0.06;
    
    // Fallback scalar factors if compositeFactors missing
    const fP = compositeFactors?.normP ?? 0.5;
    const fC = compositeFactors?.normC ?? 0.5;
    const fB = compositeFactors?.normB ?? 0.5;

    const rects = cells.map(([lat, lon, h]) => {
      // h is the normalized spatial litter (0-1) for this specific cell
      const compScore = (h * 0.35) + (fP * 0.25) + (fC * 0.20) + (fB * 0.20);
      
      return L.rectangle([[lat - cell, lon - cell], [lat + cell, lon + cell]], {
        color: null, fillColor: hcolor(compScore), fillOpacity: 0.45, weight: 0,
      }).bindTooltip(`
        <div style="font-family:Inter,sans-serif;font-size:11px;">
          <b>${year}</b> · Composite Hazard: <b>${(compScore*100).toFixed(1)}%</b> (${hclass(compScore)})<br>
          <span style="color:var(--muted);font-size:9px;">Cell Litter Factor: ${h.toFixed(2)}</span>
        </div>
      `, { sticky: true })
    });
    
    hazardRef.current = L.layerGroup(rects);
    if (layers.hazard) hazardRef.current.addTo(mapRef.current);
  }, [D, year, layers.hazard, compositeFactors]);

  // Current arrows — animated flow, color+weight by speed, triangular arrowheads
  useEffect(() => {
    if (!mapRef.current || !D) return;
    if (arrowRef.current) arrowRef.current.remove();

    // Inject flow animation CSS once
    if (!document.getElementById('current-flow-css')) {
      const s = document.createElement('style');
      s.id = 'current-flow-css';
      s.textContent = `
        .current-flow {
          stroke-dasharray: 6 5;
          animation: currentFlow 2s linear infinite;
        }
        @keyframes currentFlow {
          from { stroke-dashoffset: 22; }
          to   { stroke-dashoffset: 0; }
        }
      `;
      document.head.appendChild(s);
    }

    const arrows  = D.annual_arrows?.[String(year)] || [];
    const mags    = arrows.map(([,,uo,vo]) => Math.sqrt(uo*uo + vo*vo));
    const maxMag  = Math.max(...mags, 1e-9);
    const ALEN    = 0.07;  // base arrow length in degrees
    const elements = [];

    arrows.forEach(([lat, lon, uo, vo]) => {
      const mag = Math.sqrt(uo*uo + vo*vo) || 1e-9;
      const t   = Math.min(mag / maxMag, 1); // relative speed 0→1

      // Color: dark cyan (slow) → electric cyan-white (fast)
      const hue  = 195;
      const sat  = Math.round(60 + t * 40);          // 60→100%
      const lit  = Math.round(45 + t * 42);          // 45→87%
      const color = `hsl(${hue},${sat}%,${lit}%)`;
      const wt    = 1 + t * 2;                       // 1→3 px
      const opa   = 0.45 + t * 0.5;                  // 0.45→0.95

      // Arrow tip coordinates (normalized direction × fixed length)
      const cosLat = Math.cos(lat * Math.PI / 180);
      const dLat   = (vo / mag) * ALEN;
      const dLon   = (uo / mag) * ALEN / cosLat;
      const lat2   = lat + dLat;
      const lon2   = lon + dLon;

      // Animated body
      elements.push(
        L.polyline([[lat, lon], [lat2, lon2]], {
          color, weight: wt, opacity: opa,
          className: 'current-flow',
          lineCap: 'round',
        })
      );

      // Triangular arrowhead at tip
      const len  = Math.sqrt(dLat*dLat + dLon*dLon) || 1e-9;
      const ux   = dLon / len;   // unit vector lon component
      const uy   = dLat / len;   // unit vector lat component
      const hL   = ALEN * 0.32;  // head length
      const hW   = ALEN * 0.16;  // head half-width
      // base centre (back from tip)
      const bLat = lat2 - uy * hL;
      const bLon = lon2 - ux * hL;
      // perpendicular
      const p1   = [bLat + ux * hW, bLon - uy * hW];
      const p2   = [bLat - ux * hW, bLon + uy * hW];

      elements.push(
        L.polygon([[lat2, lon2], p1, p2], {
          fillColor: color, fillOpacity: opa,
          weight: 0, stroke: false,
        })
      );
    });

    arrowRef.current = L.layerGroup(elements);
    if (layers.curr) arrowRef.current.addTo(mapRef.current);
  }, [D, year, layers.curr]);


  // Seafloor grid — rebuild on D + year, show/hide on layers.seafloor
  useEffect(() => {
    if (!mapRef.current || !D) return;
    if (seafloorRef.current) seafloorRef.current.remove();
    const cells = D.seafloor_by_year?.[String(year)] || [];
    const cell  = 0.06;
    const rects = cells.map(([lat, lon, h]) =>
      L.rectangle([[lat - cell, lon - cell], [lat + cell, lon + cell]], {
        color: null, fillColor: sfcolor(h), fillOpacity: 0.5, weight: 0,
      }).bindTooltip(`<b>${year}</b> · Seafloor density ${h.toFixed(2)}`, { sticky: true })
    );
    seafloorRef.current = L.layerGroup(rects);
    if (layers.seafloor) seafloorRef.current.addTo(mapRef.current);
  }, [D, year, layers.seafloor]);

  // Comuni segments — rebuild on D + year, show/hide on layers.comuni
  useEffect(() => {
    if (!mapRef.current || !D) return;
    if (comuniRef.current) comuniRef.current.remove();
    const gj = D.comuni_hazard_geojson;
    if (!gj) return;

    // Fallback scalar factors if compositeFactors missing
    const fP = compositeFactors?.normP ?? 0.5;
    const fC = compositeFactors?.normC ?? 0.5;
    const fB = compositeFactors?.normB ?? 0.5;

    const polygons = [];
    gj.features.forEach(ft => {
      const h = ft.properties.hazard_by_year?.[String(year)];
      let color = '#1a2a3a';
      let tooltipContent = `<b>${ft.properties.name}</b><br>Dati non disponibili`;

      if (h != null) {
        // Compute composite score for the segment
        const compScore = (h * 0.35) + (fP * 0.25) + (fC * 0.20) + (fB * 0.20);
        color = hcolor(compScore);
        tooltipContent = `
          <div style="font-family:Inter,sans-serif;font-size:11px;">
            <b style="color:${color};font-size:12px;display:block;border-bottom:1px solid var(--border2);padding-bottom:4px;margin-bottom:4px;">${ft.properties.name}</b>
            <b>${year}</b> · Composite Hazard: <b>${(compScore*100).toFixed(1)}%</b> (${hclass(compScore)})<br>
            <span style="color:var(--muted);font-size:9px;">Segment Litter Factor: ${h.toFixed(2)}</span>
          </div>
        `;
      }

      const poly = L.geoJSON(ft, {
        style: { color: '#ffffff22', weight: 0.5, fillColor: color, fillOpacity: 0.65 },
      }).bindTooltip(tooltipContent, { sticky: true });
      polygons.push(poly);
    });
    comuniRef.current = L.layerGroup(polygons);
    if (layers.comuni) comuniRef.current.addTo(mapRef.current);
  }, [D, year, layers.comuni, compositeFactors]);

  // Microplastics IDW grid — rebuild on D + year, show/hide on layers.micro
  useEffect(() => {
    if (!mapRef.current || !D) return;
    if (microRef.current) microRef.current.remove();
    const cells = D.microplastics_by_year?.[String(year)] || [];
    const cell  = 0.06;
    const microColor = v => {
      const t = Math.min(v / 0.8, 1);
      return `rgb(${Math.round(100 + t * 155)},${Math.round(20 + t * 10)},${Math.round(200 - t * 100)})`;
    };
    const rects = cells.map(([lat, lon, v]) =>
      L.rectangle([[lat - cell, lon - cell], [lat + cell, lon + cell]], {
        color: null, fillColor: microColor(v), fillOpacity: 0.55, weight: 0,
      }).bindTooltip(`<b>${year}</b> · Microplastics IDW: ${v.toFixed(3)}`, { sticky: true })
    );
    microRef.current = L.layerGroup(rects);
    if (layers.micro) microRef.current.addTo(mapRef.current);
  }, [D, year, layers.micro]);

  // LISA cluster layer — rebuild on D + year, show/hide on layers.lisa
  useEffect(() => {
    if (!mapRef.current || !D) return;
    if (lisaRef.current) lisaRef.current.remove();
    const cells = D.lisa_by_year?.[String(year)] || [];
    const moran = D.moran_global?.[String(year)];
    const cell  = 0.06;

    const rects = cells
      .filter(([,, , cluster]) => cluster !== 'NS')
      .map(([lat, lon, localI, cluster, giStar]) => {
        const col = LISA_COLORS[cluster] || 'transparent';
        const tooltip = `
          <div style="font-family:Inter,sans-serif;font-size:11px;">
            <b style="color:${col};font-size:12px;display:block;border-bottom:1px solid var(--border2);padding-bottom:4px;margin-bottom:4px;">${cluster} cluster</b>
            <b>${year}</b> · Local I: <b>${localI.toFixed(3)}</b><br>
            GI* z-score: <b>${giStar.toFixed(2)}</b><br>
            <span style="color:var(--muted);font-size:9px;">
              ${cluster === 'HH' ? 'Hotspot: high surrounded by high' :
                cluster === 'LL' ? 'Coldspot: low surrounded by low' :
                cluster === 'HL' ? 'Outlier: high surrounded by low' :
                                   'Outlier: low surrounded by high'}
            </span>
          </div>
        `;
        return L.rectangle(
          [[lat - cell, lon - cell], [lat + cell, lon + cell]],
          { color: col, fillColor: col, fillOpacity: 0.42, weight: 0.3 }
        ).bindTooltip(tooltip, { sticky: true });
      });

    lisaRef.current = L.layerGroup(rects);
    if (layers.lisa) lisaRef.current.addTo(mapRef.current);
  }, [D, year, layers.lisa]);

  return <div ref={containerRef} className="map-container" />;
}
