import { useState, useEffect } from 'react';
import './App.css';
import MapView     from './components/MapView';
import BeachTab    from './components/tabs/BeachTab';
import FloatTab    from './components/tabs/FloatTab';
import TourismTab  from './components/tabs/TourismTab';
import CurrentsTab from './components/tabs/CurrentsTab';
import { PERIOD_MAP, PERIOD_COLORS, YEARS } from './constants';

const TABS = [
  { id: 'beach',    label: '🏖 Beach'    },
  { id: 'float',    label: '🌊 Float'    },
  { id: 'tourism',  label: '🧳 Tourism'  },
  { id: 'currents', label: '🌀 Currents' },
];

const LAYERS = [
  { key: 'hazard', label: '⬛ Hazard'   },
  { key: 'float',  label: '● Floating'  },
  { key: 'curr',   label: '〜 Currents' },
];

export default function App() {
  const [D, setD]           = useState(null);
  const [year, setYear]     = useState(2018);
  const [tab, setTab]       = useState('beach');
  const [layers, setLayers] = useState({ hazard: true, float: true, curr: true });

  useEffect(() => {
    fetch('/dashboard_data.json').then(r => r.json()).then(setD);
  }, []);

  const toggleLayer = k => setLayers(p => ({ ...p, [k]: !p[k] }));

  // Derived stats
  const maxLitter = D
    ? (() => { const r = D.beach_annual.filter(d => +d.year === year); return r.length ? Math.max(...r.map(d => d.items_per_100m)).toFixed(0) : '—'; })()
    : '—';
  const floatObs = D
    ? D.float_monthly.filter(r => +r.year === year).reduce((a, b) => a + b.n_obs, 0) || '—'
    : '—';
  const currentCms = D
    ? (() => { const r = D.current_monthly.filter(r => +r.year === year); return r.length ? (r.reduce((a,b)=>a+b.mean_speed_ms,0)/r.length*100).toFixed(1) : '—'; })()
    : '—';
  const plasticPct = D
    ? (() => { const m = D.mat_by_year?.[String(year)]; if (!m) return '—'; const t = Object.values(m).reduce((a,b)=>a+b,0); return t>0 ? (m['Artificial polymer']/t*100).toFixed(0)+'%' : '—'; })()
    : '—';

  const period      = PERIOD_MAP[year];
  const periodColor = PERIOD_COLORS[period];

  return (
    <div className="app">
      {/* FULLSCREEN MAP */}
      <div className="map-bg">
        <MapView D={D} year={year} layers={layers} />
      </div>

      {/* TOP BAR */}
      <div className="topbar">
        <div className="brand">
          <div className="sub">HHE LAB SARDINIA · MSFD D10 · ISPRA 2018–2023</div>
          <h1>🌊 Marine Litter Hazard</h1>
        </div>

        <div className="topbar-chips">
          <div className="chip red"><span className="cv">{maxLitter}</span><span className="cl">Max items/100m</span></div>
          <div className="chip pur"><span className="cv">{floatObs}</span><span className="cl">Floating obs</span></div>
          <div className="chip grn"><span className="cv">{currentCms}</span><span className="cl">Current cm/s</span></div>
          <div className="chip red"><span className="cv">{plasticPct}</span><span className="cl">% Plastic</span></div>
        </div>

        <div className="topbar-right">
          {LAYERS.map(({ key, label }) => (
            <button key={key} className={`layer-pill${layers[key] ? ' on' : ''}`} onClick={() => toggleLayer(key)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* BOTTOM YEAR SLIDER */}
      <div className="year-bar">
        <div className="year-row">
          <span className="year-num">{year}</span>
          <span className="period-badge" style={{ background: periodColor+'1a', color: periodColor, border:`1px solid ${periodColor}44` }}>
            {period}
          </span>
        </div>
        <div className="year-slider-wrap">
          <input type="range" min="2018" max="2023" step="1" value={year}
            onChange={e => setYear(+e.target.value)} />
          <div className="year-ticks">{YEARS.map(y => <span key={y}>{y}</span>)}</div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="side-panel">
        <div className="tab-bar">
          {TABS.map(t => (
            <button key={t.id} className={`tab-btn${tab===t.id?' active':''}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="tab-content">
          {tab === 'beach'    && <BeachTab    D={D} year={year} />}
          {tab === 'float'    && <FloatTab    D={D} year={year} />}
          {tab === 'tourism'  && <TourismTab  D={D} />}
          {tab === 'currents' && <CurrentsTab D={D} year={year} />}
        </div>
      </div>
    </div>
  );
}
