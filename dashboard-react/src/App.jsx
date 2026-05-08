import { useState, useEffect, useRef, useCallback } from 'react';
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

/* ── Animated counter hook ── */
function useCountUp(target, duration = 600) {
  const [display, setDisplay] = useState(target);
  const rafRef = useRef(null);
  const prevRef = useRef(target);

  useEffect(() => {
    if (target === '—' || target == null) { setDisplay(target); return; }
    const from = parseFloat(String(prevRef.current)) || 0;
    const to = parseFloat(String(target)) || 0;
    const suffix = String(target).replace(/[\d.-]/g, '');
    const start = performance.now();
    const animate = (now) => {
      const pct = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - pct, 3);
      setDisplay((from + (to - from) * ease).toFixed(suffix.includes('.') ? 1 : 0) + suffix);
      if (pct < 1) rafRef.current = requestAnimationFrame(animate);
      else { prevRef.current = target; setDisplay(target); }
    };
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return display;
}

/* ── Sparkline component ── */
function Sparkline({ values, color }) {
  if (!values || values.filter(Boolean).length < 2) return null;
  const w = 64, h = 20;
  const min = Math.min(...values.filter(Boolean));
  const max = Math.max(...values.filter(Boolean));
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((( v ?? min) - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} style={{ display: 'block', marginTop: 4, opacity: 0.7 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function App() {
  const [D, setD] = useState(null);
  const [year, setYear] = useState(2018);
  const [tab, setTab] = useState('beach');
  const [layers, setLayers] = useState({ hazard: true, curr: true });
  const [isPlaying, setIsPlaying] = useState(false);
  const [splashFading, setSplashFading] = useState(false);
  const [appStarted, setAppStarted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDark, setIsDark] = useState(true);

  // Apply theme class to root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    fetch('/dashboard_data.json').then(r => r.json()).then(data => {
      setD(data);
      setTimeout(() => {
        setSplashFading(true);
        setTimeout(() => setAppStarted(true), 700);
      }, 5000);
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

  // ── Derived stats ──
  const getTrend = (current, previous, isReverseGood = false) => {
    if (current == null || previous == null || isNaN(current) || isNaN(previous) || previous === 0) return null;
    const diff = current - previous;
    if (diff === 0) return { sym: '-', pct: '0%', col: 'var(--muted)' };
    const pct = ((diff / previous) * 100).toFixed(0) + '%';
    const isUp = diff > 0;
    const isGood = isReverseGood ? !isUp : isUp;
    return { sym: isUp ? '↑' : '↓', pct: (isUp ? '+' : '') + pct, col: isGood ? 'var(--green)' : 'var(--red)' };
  };

  const getRawMaxLitter = useCallback(y => {
    if (!D) return null;
    const items = D.beach_annual.filter(d => +d.year === y).map(d => d.items_per_100m);
    return items.length > 0 ? Math.max(...items) : null;
  }, [D]);

  const getRawCurr = useCallback(y => {
    if (!D) return null;
    const r = D.current_monthly.filter(r => +r.year === y);
    return r.length ? (r.reduce((a, b) => a + b.mean_speed_ms, 0) / r.length * 100) : null;
  }, [D]);

  const getRawPlastic = useCallback(y => {
    const m = D?.mat_by_year?.[String(y)];
    if (!m) return null;
    const t = Object.values(m).reduce((a, b) => a + b, 0);
    return t > 0 ? (m['Artificial polymer'] / t * 100) : null;
  }, [D]);

  const currLitter = getRawMaxLitter(year);
  const litterTrend = getTrend(currLitter, getRawMaxLitter(year - 1), true);
  const maxLitterStr = (currLitter !== null && currLitter >= 0) ? currLitter.toFixed(0) : '—';

  const currCms = getRawCurr(year);
  const cmsTrend = getTrend(currCms, getRawCurr(year - 1), false);
  const currentCmsStr = currCms ? currCms.toFixed(1) : '—';

  const currPlast = getRawPlastic(year);
  const plastTrend = getTrend(currPlast, getRawPlastic(year - 1), true);
  const plasticPctStr = currPlast ? currPlast.toFixed(0) + '%' : '—';

  // ── Sparkline data (all years) ──
  const litterSpark = YEARS.map(y => getRawMaxLitter(y));
  const currSpark = YEARS.map(y => getRawCurr(y));
  const plastSpark = YEARS.map(y => getRawPlastic(y));

  // ── Best / Worst year ──
  const getBestWorst = (vals, reverseGood) => {
    const pairs = YEARS.map((y, i) => ({ y, v: vals[i] })).filter(x => x.v != null);
    if (!pairs.length) return {};
    const best = reverseGood ? pairs.reduce((a, b) => b.v < a.v ? b : a) : pairs.reduce((a, b) => b.v > a.v ? b : a);
    const worst = reverseGood ? pairs.reduce((a, b) => b.v > a.v ? b : a) : pairs.reduce((a, b) => b.v < a.v ? b : a);
    return { best: best.y, worst: worst.y };
  };
  const litterBW = getBestWorst(litterSpark, true);
  const currBW = getBestWorst(currSpark, false);
  const plastBW = getBestWorst(plastSpark, true);

  // ── Auto insights ──
  const insights = D ? (() => {
    const lines = [];
    const lworst = litterBW.worst, lbest = litterBW.best;
    if (lworst) lines.push(`🔴 Picco litter nel <b>${lworst}</b>, minimo nel <b>${lbest}</b>.`);
    const pw = plastBW.worst;
    if (pw) { const pv = getRawPlastic(pw); lines.push(`🧴 Plastica massima nel <b>${pw}</b>: ${pv?.toFixed(0)}%.`); }
    const cw = currBW.worst;
    if (cw) { const cv = getRawCurr(cw); lines.push(`🌊 Correnti più intense nel <b>${cw}</b>: ${cv?.toFixed(1)} cm/s.`); }
    const l18 = getRawMaxLitter(2018), l23 = getRawMaxLitter(2023);
    if (l18 && l23) {
      const delta = ((l23 - l18) / l18 * 100).toFixed(0);
      lines.push(`📈 Litter 2018→2023: <b>${delta > 0 ? '+' : ''}${delta}%</b>.`);
    }
    return lines;
  })() : [];

  // ── Animated displays ──
  const animLitter = useCountUp(maxLitterStr);
  const animCms = useCountUp(currentCmsStr);
  const animPlast = useCountUp(plasticPctStr);

  const period = PERIOD_MAP[year];
  const periodColor = PERIOD_COLORS[period];

  return (
    <div className="app">
      {/* SPLASH */}
      {!appStarted && (
        <div className={`splash-screen${splashFading ? ' fading' : ''}`}>
          <div className="splash-logo">🌊</div>
          <div className="splash-title">HHE LAB SARDINIA</div>
          <div className="splash-loader">Caricamento dati in corso...</div>
        </div>
      )}

      {/* MODAL */}
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
            {insights.length > 0 && (
              <div className="insights-box" style={{marginTop:14}}>
                <div className="insights-title">📊 Auto-Insights</div>
                {insights.map((s, i) => (
                  <p key={i} dangerouslySetInnerHTML={{ __html: s }} style={{marginTop:6, fontSize:11, lineHeight:1.5, color:'var(--text)'}} />
                ))}
              </div>
            )}
            <button className="modal-close" onClick={() => setIsModalOpen(false)}>Chiudi</button>
          </div>
        </div>
      )}

      {/* MAP */}
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
          {/* Litter chip */}
          <div className="chip red">
            <span className="cv">{animLitter}</span>
            <span className="cl">Max items/100m</span>
            {litterTrend && <span className="trend" style={{color:litterTrend.col}}>{litterTrend.sym} {litterTrend.pct}</span>}
            <Sparkline values={litterSpark} color="var(--red)" />
            <div className="bw-row">
              {litterBW.best && <span className="bw-badge best">↓{litterBW.best}</span>}
              {litterBW.worst && <span className="bw-badge worst">↑{litterBW.worst}</span>}
            </div>
          </div>
          {/* Current chip */}
          <div className="chip grn">
            <span className="cv">{animCms}</span>
            <span className="cl">Current cm/s</span>
            {cmsTrend && <span className="trend" style={{color:cmsTrend.col}}>{cmsTrend.sym} {cmsTrend.pct}</span>}
            <Sparkline values={currSpark} color="var(--green)" />
            <div className="bw-row">
              {currBW.best && <span className="bw-badge best">↑{currBW.best}</span>}
              {currBW.worst && <span className="bw-badge worst">↓{currBW.worst}</span>}
            </div>
          </div>
          {/* Plastic chip */}
          <div className="chip pur">
            <span className="cv">{animPlast}</span>
            <span className="cl">% Plastic</span>
            {plastTrend && <span className="trend" style={{color:plastTrend.col}}>{plastTrend.sym} {plastTrend.pct}</span>}
            <Sparkline values={plastSpark} color="var(--purple)" />
            <div className="bw-row">
              {plastBW.best && <span className="bw-badge best">↓{plastBW.best}</span>}
              {plastBW.worst && <span className="bw-badge worst">↑{plastBW.worst}</span>}
            </div>
          </div>
        </div>

        <div className="topbar-right">
          {/* Dark/Light toggle */}
          <button className={`layer-pill${isDark ? ' on' : ''}`} onClick={() => setIsDark(!isDark)} title="Tema">
            {isDark ? '☀️' : '🌙'}
          </button>
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

        {/* AUTO-INSIGHTS BOTTOM OF PANEL */}
        {D && insights.length > 0 && (
          <div className="insights-panel">
            <div className="insights-title">📊 Insights</div>
            {insights.map((s, i) => (
              <p key={i} dangerouslySetInnerHTML={{ __html: s }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
