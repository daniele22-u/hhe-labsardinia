import { useState, useEffect, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import './App.css';
import MapView from './components/MapView';
import BeachTab from './components/tabs/BeachTab';
import FloatTab from './components/tabs/FloatTab';
import TourismTab from './components/tabs/TourismTab';
import CurrentsTab from './components/tabs/CurrentsTab';
import BiologicalTab from './components/tabs/BiologicalTab';
import { PERIOD_MAP, PERIOD_COLORS, YEARS } from './constants';

const TABS = [
  { id: 'beach', label: '🏖 Beach' },
  { id: 'float', label: '🌊 Float' },
  { id: 'tourism', label: '🧳 Tourism' },
  { id: 'currents', label: '🌀 Currents' },
  { id: 'biological', label: '🦎 Bio' },
];

const LAYERS = [
  { key: 'curr', label: '〜 Currents' },
  { key: 'comuni', label: '🗺 Segments' },
  { key: 'micro', label: '🔬 Micro' },
  { key: 'lisa', label: '🔴 LISA' },
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
    const y = h - (((v ?? min) - min) / range) * h;
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
  const [layers, setLayers] = useState({ hazard: false, curr: false, seafloor: false, comuni: true, micro: false, lisa: false }); // seafloor kept in state for MapView compat but no pill
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
      document.documentElement.requestFullscreen().catch(() => { });
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

  // ── Bio score ──
  const getRawBioScore = useCallback(y => {
    return D?.biological_impact_by_year?.[String(y)]?.score ?? null;
  }, [D]);

  // ── Microplastics mean ──
  const getRawMicroMean = useCallback(y => {
    const rows = D?.microplastics_by_year?.[String(y)];
    if (!rows || !rows.length) return null;
    return rows.reduce((a, r) => a + r[2], 0) / rows.length;
  }, [D]);

  // ── Sparkline data (all years) ──
  const litterSpark = YEARS.map(y => getRawMaxLitter(y));
  const currSpark = YEARS.map(y => getRawCurr(y));
  const plastSpark = YEARS.map(y => getRawPlastic(y));
  const bioSpark = YEARS.map(y => getRawBioScore(y));
  const microSpark = YEARS.map(y => getRawMicroMean(y));

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
  const bioBW = getBestWorst(bioSpark, true);
  const microBW = getBestWorst(microSpark, true);

  // ── Bio impact chip values ──
  const currBio = getRawBioScore(year);
  const bioTrend = getTrend(currBio, getRawBioScore(year - 1), true);
  const bioScoreStr = currBio != null ? (currBio * 100).toFixed(1) + '‱' : '—';

  // ── Combined Hazard Score (4-component) ──
  // Normalise each component to [0,1] then weight-average
  const getCompositeHazard = useCallback(y => {
    const litter = getRawMaxLitter(y);  // items/100m, max ~4000
    const curr_ = getRawCurr(y);       // cm/s ~0-200
    const plast = getRawPlastic(y);    // %
    const bio = getRawBioScore(y);   // 0-1
    if (litter == null && curr_ == null && plast == null && bio == null) return null;
    const normL = litter != null ? Math.min(litter / 4000, 1) : 0.5;
    const normC = curr_ != null ? Math.min(curr_ / 200, 1) : 0.5;
    const normP = plast != null ? Math.min(plast / 100, 1) : 0.5;
    const normB = bio != null ? Math.min(bio / 0.2, 1) : 0.5; // score max ~0.2 in data
    // Weights: litter 35%, plastic 25%, currents 20%, bio 20%
    return (normL * 0.35 + normP * 0.25 + normC * 0.20 + normB * 0.20);
  }, [getRawMaxLitter, getRawCurr, getRawPlastic, getRawBioScore]);

  const currComposite = getCompositeHazard(year);
  const compositeStr = currComposite != null ? (currComposite * 100).toFixed(0) + '%' : '—';
  const compositeTrend = getTrend(currComposite, getCompositeHazard(year - 1), true);
  const compositeSpark = YEARS.map(y => getCompositeHazard(y));
  const compositeBW = getBestWorst(compositeSpark, true);

  // ── Auto insights ──
  const insights = D ? (() => {
    const lines = [];
    const lworst = litterBW.worst, lbest = litterBW.best;
    if (lworst) lines.push(`🔴 Picco litter nel <b>${lworst}</b>, minimo nel <b>${lbest}</b>.`);
    const pw = plastBW.worst;
    if (pw) { const pv = getRawPlastic(pw); lines.push(`🧴 Plastica massima nel <b>${pw}</b>: ${pv?.toFixed(0)}%.`); }
    const cw = currBW.worst;
    if (cw) { const cv = getRawCurr(cw); lines.push(`🌊 Correnti più intense nel <b>${cw}</b>: ${cv?.toFixed(1)} cm/s.`); }
    const bw = bioBW.worst;
    if (bw) { const bv = getRawBioScore(bw); lines.push(`🦎 Impatto biologico max nel <b>${bw}</b>: score ${(bv * 100).toFixed(1)}‱.`); }
    const mw = microBW.worst;
    if (mw) { const mv = getRawMicroMean(mw); lines.push(`🔬 Microplastiche più dense nel <b>${mw}</b>: media ${mv?.toFixed(3)}.`); }
    const l20 = getRawMaxLitter(2020), l23 = getRawMaxLitter(2023);
    if (l20 && l23) {
      const delta = ((l23 - l20) / l20 * 100).toFixed(0);
      lines.push(`📈 Litter 2020→2023: <b>${delta > 0 ? '+' : ''}${delta}%</b>.`);
    }
    return lines;
  })() : [];

  // ── Animated displays ──
  const animLitter = useCountUp(maxLitterStr);
  const animCms = useCountUp(currentCmsStr);
  const animPlast = useCountUp(plasticPctStr);
  const animBio = useCountUp(bioScoreStr);
  const animComposite = useCountUp(compositeStr);

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
            <p style={{ marginTop: 10, lineHeight: 1.5, color: 'var(--muted)' }}>
              Questa dashboard analizza l'<b>Hazard da Marine Litter</b> sulle coste della Sardegna (2018–2023), in accordo con la <b>MSFD D10</b>.
            </p>

            <div className="modal-section-title">📊 Componenti dello Scoring</div>
            <div className="modal-scoring-grid">
              <div className="modal-score-row">
                <span className="modal-score-label">🏖 Beach Litter</span>
                <span className="modal-score-weight">35%</span>
              </div>
              <div className="modal-score-row">
                <span className="modal-score-label">🧴 % Plastica</span>
                <span className="modal-score-weight">25%</span>
              </div>
              <div className="modal-score-row">
                <span className="modal-score-label">🌀 Correnti</span>
                <span className="modal-score-weight">20%</span>
              </div>
              <div className="modal-score-row">
                <span className="modal-score-label">🦎 Bio Score</span>
                <span className="modal-score-weight">20%</span>
              </div>
            </div>

            <div className="modal-section-title" style={{ marginTop: 12 }}>🦎 Impatto Biologico</div>
            <p style={{ marginTop: 6, lineHeight: 1.6, color: 'var(--muted)', fontSize: 11 }}>
              Il <b>Bio Score</b> è un proxy di impatto biologico calcolato come:
            </p>
            <p style={{ marginTop: 4, lineHeight: 1.6, color: 'var(--muted)', fontSize: 11 }}>
              <b>Score = (ENT + ING) / N_max</b> · combina eventi di <b>entanglement</b> (ingarbugliamento) e <b>ingestione</b> di plastica rilevati su tartarughe marine (<i>Caretta caretta</i>, ~99%) dai dati <b>CNR-IAS/Oristano</b> (2018–2023, 83+82 eventi).
            </p>
            <p style={{ marginTop: 4, lineHeight: 1.6, color: 'var(--muted)', fontSize: 11 }}>
              Il picco è nel <b>2021</b>. Il layer <b>🔬 Micro</b> mostra la griglia IDW di microplastiche derivata da 7.913 campionamenti trawl (336 celle/anno).
            </p>

            {insights.length > 0 && (
              <div className="insights-box" style={{ marginTop: 12 }}>
                <div className="insights-title">📈 Auto-Insights</div>
                {insights.map((s, i) => (
                  <p key={i} dangerouslySetInnerHTML={{ __html: s }} style={{ marginTop: 6, fontSize: 11, lineHeight: 1.5, color: 'var(--text)' }} />
                ))}
              </div>
            )}
            <button className="modal-close" onClick={() => setIsModalOpen(false)}>Chiudi</button>
          </div>
        </div>
      )}

      {/* MAP */}
      <div className="map-bg">
        <MapView D={D} year={year} layers={layers} compositeFactors={D ? {
          normP: currPlast != null ? Math.min(currPlast / 100, 1) : 0.5,
          normC: currCms  != null ? Math.min(currCms  / 200, 1) : 0.5,
          normB: currBio  != null ? Math.min(currBio  / 0.2, 1) : 0.5,
        } : null} />
      </div>

      {/* HAZARD LEGEND */}
      <div className="hazard-legend">
        <div className="leg-title">Hazard Level</div>
        <div className="leg-grad"></div>
        <div className="leg-labels"><span>Basso</span><span>Alto</span></div>
      </div>

      {/* TOP BAR */}
      <div className="topbar">
        <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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
            {litterTrend && <span className="trend" style={{ color: litterTrend.col }}>{litterTrend.sym} {litterTrend.pct}</span>}
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
            {cmsTrend && <span className="trend" style={{ color: cmsTrend.col }}>{cmsTrend.sym} {cmsTrend.pct}</span>}
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
            {plastTrend && <span className="trend" style={{ color: plastTrend.col }}>{plastTrend.sym} {plastTrend.pct}</span>}
            <Sparkline values={plastSpark} color="var(--purple)" />
            <div className="bw-row">
              {plastBW.best && <span className="bw-badge best">↓{plastBW.best}</span>}
              {plastBW.worst && <span className="bw-badge worst">↑{plastBW.worst}</span>}
            </div>
          </div>
          {/* Bio impact chip */}
          <div className="chip org">
            <span className="cv">{animBio}</span>
            <span className="cl">Bio Score</span>
            {bioTrend && <span className="trend" style={{ color: bioTrend.col }}>{bioTrend.sym} {bioTrend.pct}</span>}
            <Sparkline values={bioSpark} color="#f97316" />
            <div className="bw-row">
              {bioBW.best && <span className="bw-badge best">↓{bioBW.best}</span>}
              {bioBW.worst && <span className="bw-badge worst">↑{bioBW.worst}</span>}
            </div>
          </div>
          {/* Composite Hazard chip */}
          <div className="chip comp">
            <span className="cv">{animComposite}</span>
            <span className="cl">Composite</span>
            {compositeTrend && <span className="trend" style={{ color: compositeTrend.col }}>{compositeTrend.sym} {compositeTrend.pct}</span>}
            <Sparkline values={compositeSpark} color="#06b6d4" />
            <div className="bw-row">
              {compositeBW.best && <span className="bw-badge best">↓{compositeBW.best}</span>}
              {compositeBW.worst && <span className="bw-badge worst">↑{compositeBW.worst}</span>}
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
          <button className="layer-pill" onClick={toggleFullscreen} title="A Tutto Schermo" style={{ fontSize: 12, padding: '2px 8px' }}>
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
              {tab === 'biological' && <BiologicalTab D={D} year={year} />}
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
