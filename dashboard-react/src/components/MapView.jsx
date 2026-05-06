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

  // Beach markers (once data loads)
  useEffect(() => {
    if (!mapRef.current || !D) return;
    if (beachRef.current) beachRef.current.remove();
    const markers = D.beach_stations.map(st => {
      if (!st.lat || !st.lon) return null;
      const col = D.beach_colors[st.beach_id] || '#f39c12';
      const name = D.beach_names[st.beach_id] || st.beach_id;
      return L.circleMarker([st.lat, st.lon], {
        radius: 8, fillColor: col, color: '#fff', weight: 2, fillOpacity: 0.9,
      }).bindTooltip(`<b style="color:${col}">${name}</b>`, { sticky: true });
    }).filter(Boolean);
    beachRef.current = L.layerGroup(markers).addTo(mapRef.current);
  }, [D]);

  // Floating stations
  useEffect(() => {
    if (!mapRef.current || !D) return;
    if (floatRef.current) floatRef.current.remove();
    const markers = D.float_stations.map(st => {
      if (!st.lat || !st.lon) return null;
      return L.circleMarker([st.lat, st.lon], {
        radius: 5, fillColor: '#8e44ad', color: '#fff', weight: 1, fillOpacity: 0.8,
      }).bindTooltip(`▲ ${st.station_id} · ${st.n_obs} obs`, { sticky: true });
    }).filter(Boolean);
    floatRef.current = L.layerGroup(markers);
    if (layers.float) floatRef.current.addTo(mapRef.current);
  }, [D]);

  // Hazard grid per year
  useEffect(() => {
    if (!mapRef.current || !D) return;
    if (hazardRef.current) hazardRef.current.remove();
    const cells = D.hazard_by_year?.[String(year)] || [];
    const cell = 0.06;
    const rects = cells.map(([lat, lon, h]) =>
      L.rectangle([[lat-cell,lon-cell],[lat+cell,lon+cell]], {
        color: null, fillColor: hcolor(h), fillOpacity: 0.45, weight: 0,
      }).bindTooltip(`<b>${year}</b> · Hazard ${h.toFixed(2)} (${hclass(h)})`, { sticky: true })
    );
    hazardRef.current = L.layerGroup(rects);
    if (layers.hazard) hazardRef.current.addTo(mapRef.current);
  }, [D, year]);

  // Current arrows per year
  useEffect(() => {
    if (!mapRef.current || !D) return;
    if (arrowRef.current) arrowRef.current.remove();
    const arrows = D.annual_arrows?.[String(year)] || [];
    const lines = arrows.map(([lat, lon, uo, vo]) => {
      const scale = 2.5;
      const dLat = vo * scale * 0.009;
      const dLon = uo * scale * 0.009 / Math.cos(lat * Math.PI/180);
      return L.polyline([[lat, lon],[lat+dLat, lon+dLon]], {
        color: '#1c7ab8', weight: 1.2, opacity: 0.6,
      });
    });
    arrowRef.current = L.layerGroup(lines);
    if (layers.curr) arrowRef.current.addTo(mapRef.current);
  }, [D, year]);

  // Toggle layers
  useEffect(() => {
    if (!mapRef.current) return;
    if (!hazardRef.current || !floatRef.current || !arrowRef.current) return;
    layers.hazard ? hazardRef.current.addTo(mapRef.current) : hazardRef.current.remove();
    layers.float  ? floatRef.current.addTo(mapRef.current)  : floatRef.current.remove();
    layers.curr   ? arrowRef.current.addTo(mapRef.current)  : arrowRef.current.remove();
  }, [layers]);

  return <div ref={containerRef} className="map-container" />;
}
