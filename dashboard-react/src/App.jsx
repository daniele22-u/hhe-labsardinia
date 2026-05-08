import { useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import './App.css';
import MapView from './components/MapView';
import BeachTab from './components/tabs/BeachTab';
import FloatTab from './components/tabs/FloatTab';
import TourismTab from './components/tabs/TourismTab';
import CurrentsTab from './components/tabs/CurrentsTab';
import { PERIOD_MAP, PERIOD_COLORS, YEARS } from './constants';

const TABS = [
  { id: 'beach', label: '🏖 Beach' },
  { id: 'float', label: '🌊 Float' },
  { id: 'tourism', label: '🧳 Tourism' },
  { id: 'currents', label: '🌀 Currents' },
];

const LAYERS = [
  { key: 'hazard', label: '⬛ Hazard' },
  { key: 'curr', label: '〜 Currents' },
];

export default function App() {
  const [D, setD] = useState(null);
  const [year, setYear] = useState(2018);
  const [tab, setTab] = useState('beach');
  const [layers, setLayers] = useState({ hazard: true, curr: true });
  const [isPlaying, setIsPlaying] = useState(false);
  const [appStarted, setAppStarted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    fetch('/dashboard_data.json').then(r => r.json()).then(data => {
      setD(data);
      setTimeout(() => setAppStarted(true), 1200);
    });
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setYear(y => (y >= 2023 ? 2018 : y + 1));
    }, 1500);
    return () => clearInterval(timer);
  }, [isPlaying]);

  const takeScreenshot = () => {
    const appEl = document.querySelector('.app');
    if (!appEl) return;
    html2canvas(appEl, { useCORS: true }).then(canvas => {
      const link = document.createElement('a');
      link.download = `Sardinia-Dashboard-${year}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFs);
    return () => document.removeEventListener('fullscreenchange', handleFs);
  }, []);

  const toggleLayer = k => setLayers(p => ({ ...p, [k]: !p[k] }));

  // Derived stats with Trends
  const getTrend = (current, previous, isReverseGood = false) => {
    if (current == null || previous == null || isNaN(current) || isNaN(previous) || previous === 0) return null;
    const diff = current - previous;
    if (diff === 0) return { sym: '-', pct: '0%', col: 'var(--muted)' };
    const pct = ((diff / previous) * 100).toFixed(0) + '%';
    const isUp = diff > 0;
    const isGood = isReverseGood ? !isUp : isUp; 
    return { sym: isUp ? '↑' : '↓', pct: (isUp ? '+' : '') + pct, col: isGood ? 'var(--green)' : 'var(--red)' };
  };

  const getRawMaxLitter = y => {
    if (!D) return null;
    const items = D.beach_annual.filter(d => +d.year === y).map(d => d.items_per_100m);
    return items.length > 0 ? Math.max(...items) : null;
  };
  const currLitter = getRawMaxLitter(year);
  const litterTrend = getTrend(currLitter, getRawMaxLitter(year - 1), true);
  const maxLitterStr = (currLitter !== null && currLitter >= 0) ? currLitter.toFixed(0) : '—';

  const getRawCurr = y => {
    if (!D) return null;
    const r = D.current_monthly.filter(r => +r.year === y);
    return r.length ? (r.reduce((a, b) => a + b.mean_speed_ms, 0) / r.length * 100) : null;
  };
  const currCms = getRawCurr(year);
  const cmsTrend = getTrend(currCms, getRawCurr(year - 1), false);
  const currentCmsStr = currCms ? currCms.toFixed(1) : '—';

  const getRawPlastic = y => {
    const m = D?.mat_by_year?.[String(y)]; 
    if (!m) return null;
    const t = Object.values(m).reduce((a, b) => a + b, 0); 
    return t > 0 ? (m['Artificial polymer'] / t * 100) : null;
  };
  const currPlast = getRawPlastic(year);
  const plastTrend = getTrend(currPlast, getRawPlastic(year - 1), true);
  const plasticPctStr = currPlast ? currPlast.toFixed(0) + '%' : '—';

  const period = PERIOD_MAP[year];
  const periodColor = PERIOD_COLORS[period];

  return (
    <div className="app">
      {!appStarted && (
        <div className="splash-screen">
          <div className="splash-logo">🌊</div>
          <div className="splash-title">HHE LAB SARDINIA</div>
          <div className="splash-loader">Caricamento dati in corso...</div>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>🌊 Sardinia HHE Lab</h2>
            <p style={{marginTop:10, lineHeight:1.5, color:'var(--muted)'}}>
              Questa dashboard analizza l'Hazard da Marine Litter sulle coste della Sardegna (2018-2023), in accordo con la <b>MSFD D10</b>.
            </p>
            <p style={{marginTop:10, lineHeight:1.5, color:'var(--muted)'}}>
              I dati mostrano l'interazione tra le correnti marine, l'accumulo di rifiuti sulle spiagge e la pressione turistica.
            </p>
            <button className="modal-close" onClick={() => setIsModalOpen(false)}>Chiudi</button>
          </div>
        </div>
      )}

      {/* FULLSCREEN MAP */}
      <div className="map-bg">
        <MapView D={D} year={year} layers={layers} />
      </div>

      {/* HAZARD LEGEND */}
      <div className="hazard-legend">
        <div className="leg-title">Hazard Level</div>
        <div className="leg-grad"></div>
        <div className="leg-labels"><span>Basso</span><span>Alto</span></div>
      </div>

      {/* TOP BAR */}
      <div className="topbar">
        <div className="brand" style={{display:'flex', alignItems:'center', gap: 6}}>
          <div>
            <div className="sub">HHE LAB SARDINIA · MSFD D10</div>
            <h1>🌊 Marine Litter Hazard</h1>
          </div>
          <button className="info-btn" onClick={() => setIsModalOpen(true)}>i</button>
        </div>

        <div className="topbar-chips">
          <div className="chip red">
            <span className="cv">{maxLitterStr}</span>
            <span className="cl">Max items/100m</span>
            {litterTrend && <span className="trend" style={{color:litterTrend.col}}>{litterTrend.sym} {litterTrend.pct}</span>}
          </div>
          <div className="chip grn">
            <span className="cv">{currentCmsStr}</span>
            <span className="cl">Current cm/s</span>
            {cmsTrend && <span className="trend" style={{color:cmsTrend.col}}>{cmsTrend.sym} {cmsTrend.pct}</span>}
          </div>
          <div className="chip pur">
            <span className="cv">{plasticPctStr}</span>
            <span className="cl">% Plastic</span>
            {plastTrend && <span className="trend" style={{color:plastTrend.col}}>{plastTrend.sym} {plastTrend.pct}</span>}
          </div>
        </div>

        <div className="topbar-right">
          {LAYERS.map(({ key, label }) => (
            <button key={key} className={`layer-pill${layers[key] ? ' on' : ''}`} onClick={() => toggleLayer(key)}>
              {label}
            </button>
          ))}
          <button className="layer-pill" onClick={toggleFullscreen} title="A Tutto Schermo" style={{fontSize:12, padding:'2px 8px'}}>
            {isFullscreen ? '↙' : '⛶'}
          </button>
          <button className="layer-pill" onClick={takeScreenshot} title="Download Screenshot">
            📸
          </button>
        </div>
      </div>

      {/* BOTTOM YEAR SLIDER */}
      <div className="year-bar">
        <div className="year-row" style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span className="year-num">{year}</span>
            <span className="period-badge" style={{ background: periodColor + '1a', color: periodColor, border: `1px solid ${periodColor}44` }}>
              {period}
            </span>
          </div>
          <button className={`play-btn ${isPlaying ? 'playing' : ''}`} onClick={() => setIsPlaying(!isPlaying)}>
            {isPlaying ? '⏸' : '▶'}
          </button>
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
            <button key={t.id} className={`tab-btn${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="tab-content">
          {!D ? (
            <div className="skeleton-wrap">
              <div className="skel-pulse" style={{ width: '60%', height: 12, marginBottom: 20 }}></div>
              <div className="skel-pulse" style={{ width: '100%', height: 60, marginBottom: 10 }}></div>
              <div className="skel-pulse" style={{ width: '100%', height: 60, marginBottom: 10 }}></div>
              <div className="skel-pulse" style={{ width: '100%', height: 60 }}></div>
            </div>
          ) : (
            <>
              {tab === 'beach' && <BeachTab D={D} year={year} />}
              {tab === 'float' && <FloatTab D={D} year={year} />}
              {tab === 'tourism' && <TourismTab D={D} />}
              {tab === 'currents' && <CurrentsTab D={D} year={year} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
