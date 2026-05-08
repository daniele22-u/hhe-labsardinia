import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { hcolor, hclass } from '../constants';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function MapView({ D, year, layers }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const hazardRef    = useRef(null);
  const floatRef     = useRef(null);
  const arrowRef     = useRef(null);
  const beachRef     = useRef(null);

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
      const col = D.beach_colors[st.beach_id] || '#f39c12';
      const name = D.beach_names[st.beach_id] || st.beach_id;
      const history = D.beach_annual.filter(d => d.beach_id === st.beach_id).sort((a,b)=>a.year-b.year).map(d => `<div style="display:flex;justify-content:space-between;"><span>${d.year}:</span> <b>${d.items_per_100m}</b></div>`).join('');
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
  useEffect(() => {
    if (!mapRef.current || !D) return;
    if (hazardRef.current) hazardRef.current.remove();
    const cells = D.hazard_by_year?.[String(year)] || [];
    const cell = 0.06;
    const rects = cells.map(([lat, lon, h]) =>
      L.rectangle([[lat - cell, lon - cell], [lat + cell, lon + cell]], {
        color: null, fillColor: hcolor(h), fillOpacity: 0.45, weight: 0,
      }).bindTooltip(`<b>${year}</b> · Hazard ${h.toFixed(2)} (${hclass(h)})`, { sticky: true })
    );
    hazardRef.current = L.layerGroup(rects);
    if (layers.hazard) hazardRef.current.addTo(mapRef.current);
  }, [D, year, layers.hazard]);

  // Current arrows — rebuild on D + year, show/hide on layers.curr
  useEffect(() => {
    if (!mapRef.current || !D) return;
    if (arrowRef.current) arrowRef.current.remove();
    const arrows = D.annual_arrows?.[String(year)] || [];
    // Normalize to fixed display length (0.05°) keeping direction
    const ARROW_LEN = 0.05;
    const lines = arrows.map(([lat, lon, uo, vo]) => {
      const mag = Math.sqrt(uo*uo + vo*vo) || 1e-9;
      const dLat = (vo / mag) * ARROW_LEN;
      const dLon = (uo / mag) * ARROW_LEN / Math.cos(lat * Math.PI / 180);
      return L.polyline([[lat, lon], [lat + dLat, lon + dLon]], {
        color: '#3b9eff', weight: 1.8, opacity: 0.7,
      });
    });
    arrowRef.current = L.layerGroup(lines);
    if (layers.curr) arrowRef.current.addTo(mapRef.current);
  }, [D, year, layers.curr]);

  return <div ref={containerRef} className="map-container" />;
}
