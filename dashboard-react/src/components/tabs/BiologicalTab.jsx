import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, CartesianGrid, Legend,
} from 'recharts';
import { YEARS } from '../../constants';

const STATUS_COLORS = { Good: '#34d399', Fair: '#facc15', Poor: '#f87171' };
const STATUS_DESC = {
  Good: 'animale in buone condizioni',
  Fair: 'condizioni discrete, ferite lievi',
  Poor: 'animale in cattive condizioni o deceduto',
};
const MATERIAL_LABELS = {
  SHE: 'Fogli/Pellicole',
  FOO: 'Attrezzi da pesca',
  FRA: 'Frammenti',
  NFO: 'Reti/Corde',
  FOA: 'Schiuma EPS',
  PEL: 'Pellet',
  THR: 'Filo/Spago',
  OTH: 'Altro',
};
const MATERIAL_COLORS = {
  SHE: '#3b9eff', FOO: '#a78bfa', FRA: '#f87171',
  NFO: '#34d399', FOA: '#f59e0b', PEL: '#ec4899', THR: '#22d3ee', OTH: '#64748b',
};

function ScoreGauge({ score }) {
  // Correct SVG speedometer arc: opens upward like a tachometer
  // SVG coords: y increases downward. Angles CW from right.
  // Arc from SVG 210° (upper-left) → SVG 330° (upper-right) through top (SVG 270°)
  // Going CCW (sweep=0), large-arc (1) = 240° total
  const R = 36, cx = 50, cy = 52;
  const START_SVG = 210; // upper-left
  const TOTAL_DEG = 240; // sweep CCW

  const pct = Math.max(0, Math.min(1, score));

  const svgPt = (deg) => {
    const rad = (deg * Math.PI) / 180;
    return [+(cx + R * Math.cos(rad)).toFixed(2), +(cy + R * Math.sin(rad)).toFixed(2)];
  };

  const [sx, sy] = svgPt(START_SVG);
  const [ex, ey] = svgPt(START_SVG - TOTAL_DEG); // = 330° → upper-right

  // Background track: full 240° CCW, large-arc=1, sweep=0
  const bgPath = `M ${sx} ${sy} A ${R} ${R} 0 1 0 ${ex} ${ey}`;

  // Filled arc: 0..pct of 240° CCW
  const filledDeg = pct * TOTAL_DEG;
  const valSVG = START_SVG - filledDeg;
  const [vx, vy] = svgPt(valSVG);
  const large = filledDeg > 180 ? 1 : 0;
  const valuePath = pct > 0.005
    ? `M ${sx} ${sy} A ${R} ${R} 0 ${large} 0 ${vx} ${vy}`
    : null;

  // Needle tip
  const needleRad = (valSVG * Math.PI) / 180;
  const NL = 26;
  const nx = +(cx + NL * Math.cos(needleRad)).toFixed(2);
  const ny = +(cy + NL * Math.sin(needleRad)).toFixed(2);

  // Calibrated thresholds for actual score range (0.02 – 0.15)
  const color = score < 0.03 ? '#34d399'
    : score < 0.06 ? '#facc15'
    : score < 0.10 ? '#f59e0b'
    : score < 0.14 ? '#f87171'
    : '#ef4444';
  const label = score < 0.03 ? 'Very Low'
    : score < 0.06 ? 'Low'
    : score < 0.10 ? 'Moderate'
    : score < 0.14 ? 'High'
    : 'Critical';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 6 }}>
      <svg width={110} height={68} viewBox="0 0 100 68">
        {/* tick marks */}
        {[0, 0.25, 0.5, 0.75, 1].map(t => {
          const tickSVG = START_SVG - t * TOTAL_DEG;
          const tickRad = (tickSVG * Math.PI) / 180;
          const inner = R - 5, outer = R + 1;
          return (
            <line key={t}
              x1={+(cx + inner * Math.cos(tickRad)).toFixed(2)}
              y1={+(cy + inner * Math.sin(tickRad)).toFixed(2)}
              x2={+(cx + outer * Math.cos(tickRad)).toFixed(2)}
              y2={+(cy + outer * Math.sin(tickRad)).toFixed(2)}
              stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} strokeLinecap="round"
            />
          );
        })}
        {/* background track */}
        <path d={bgPath} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={7} strokeLinecap="round" />
        {/* filled arc */}
        {valuePath && (
          <path d={valuePath} fill="none" stroke={color} strokeWidth={7} strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 4px ${color}88)`, transition: 'stroke 0.4s' }} />
        )}
        {/* needle */}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={color} strokeWidth={2} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={4} fill={color} />
        {/* label text labels (Low | High) */}
        <text x={sx + 6} y={sy + 6} fontSize={6} fill="rgba(255,255,255,0.35)" textAnchor="middle">0</text>
        <text x={ex - 6} y={ey + 6} fontSize={6} fill="rgba(255,255,255,0.35)" textAnchor="middle">max</text>
        {/* score value */}
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize={10} fontWeight={700} fill={color}
          style={{ transition: 'fill 0.4s' }}>
          {(score * 100).toFixed(1)}%
        </text>
      </svg>
      <span style={{ fontSize: 8, color, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: -2 }}>
        {label}
      </span>
    </div>
  );
}


export default function BiologicalTab({ D, year }) {
  if (!D) return null;

  // ── Entanglement data ──
  const entData = YEARS
    .filter(y => D.entanglement_annual?.[String(y)])
    .map(y => {
      const v = D.entanglement_annual[String(y)];
      return {
        year: y,
        total: v.total,
        Good: v.by_status?.Good || 0,
        Fair: v.by_status?.Fair || 0,
        Poor: v.by_status?.Poor || 0,
      };
    });

  // ── Ingestion data ──
  const ingData = YEARS
    .filter(y => D.ingestion_annual?.[String(y)])
    .map(y => {
      const v = D.ingestion_annual[String(y)];
      return { year: y, total: v.total, ...v.by_material };
    });

  // All material codes across all years
  const allMats = [...new Set(
    Object.values(D.ingestion_annual || {}).flatMap(v => Object.keys(v.by_material || {}))
  )];

  // ── Bio score trend ──
  const bioScoreData = YEARS
    .filter(y => D.biological_impact_by_year?.[String(y)])
    .map(y => {
      const v = D.biological_impact_by_year[String(y)];
      return { year: y, score: +(v.score * 100).toFixed(2) };
    });

  // ── Microplastics mean per year ──
  const microData = YEARS
    .filter(y => D.microplastics_by_year?.[String(y)])
    .map(y => {
      const rows = D.microplastics_by_year[String(y)];
      const vals = rows.map(r => r[2]);
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      return { year: y, mean: +mean.toFixed(3) };
    });

  // ── Current year stats ──
  const entYear = D.entanglement_annual?.[String(year)] || null;
  const ingYear = D.ingestion_annual?.[String(year)] || null;
  const bioYear = D.biological_impact_by_year?.[String(year)] || null;
  const microYear = D.microplastics_by_year?.[String(year)] || null;
  const microMean = microYear
    ? (microYear.reduce((a, r) => a + r[2], 0) / microYear.length).toFixed(3)
    : '—';

  const TOOLTIP_STYLE = {
    background: 'var(--glass2)', border: '1px solid var(--border2)',
    color: 'var(--text)', borderRadius: 8, fontSize: 10,
    backdropFilter: 'blur(12px)',
  };

  return (
    <div className="tab-pane">

      {/* ── Metodologia card ── */}
      <div className="bio-info-card">
        <div className="bio-info-title">ℹ️ Come leggere questo tab</div>
        <div className="bio-info-body">
          Dati CNR-IAS (Oristano) su tartarughe marine (<em>Caretta caretta</em>) spiaggiati 2018–2023.
          Il <strong>Bio Score</strong> = eventi totali / massimo storico, normalizzato 0→1.
          Più alto = maggiore pressione biologica rilevata da marine litter.
        </div>
      </div>

      {/* ── Score gauge ── */}
      <div className="section-title" style={{ marginTop: 10 }}>🦎 Indice Impatto Biologico — {year}</div>
      {bioYear && <ScoreGauge score={bioYear.score} />}

      {/* Bio score stat cards */}
      <div className="stat-cards" style={{ marginBottom: 4 }}>
        <div className="stat-card">
          <div className="sv" style={{ color: 'var(--red)', fontSize: 16 }}>
            {entYear ? entYear.total : '—'}
          </div>
          <div className="sl">Entanglements</div>
        </div>
        <div className="stat-card">
          <div className="sv" style={{ color: 'var(--purple)', fontSize: 16 }}>
            {ingYear ? ingYear.total : '—'}
          </div>
          <div className="sl">Ingestioni</div>
        </div>
        <div className="stat-card">
          <div className="sv" style={{ color: 'var(--accent)', fontSize: 16 }}>
            {microYear ? microYear.length : '—'}
          </div>
          <div className="sl">Punti campionamento micro</div>
        </div>
      </div>
      <div className="bio-sub">Ingarbugliamento in reti/attrezzi · ingestione di plastica · punti griglia usati per mappare la densità di microplastiche in mare (336 = griglia 21×16, ~11km per cella)</div>

      {/* ── Entanglement status bars ── */}
      <div className="section-title" style={{ marginTop: 12 }}>🐢 Entanglement per anno</div>
      <div className="bio-sub" style={{ marginBottom: 6 }}>
        N° tartarughe con corpo intrappolato in reti, lenze o plastica. Colore = condizioni cliniche.
      </div>
      <ResponsiveContainer width="100%" height={90}>
        <BarChart data={entData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
          <XAxis dataKey="year" tick={{ fontSize: 9, fill: 'var(--muted)' }} tickLine={false} />
          <YAxis tick={{ fontSize: 9, fill: 'var(--muted)' }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(v, name) => [v + ' animali', `${name} — ${STATUS_DESC[name] || ''}`]}
          />
          {Object.keys(STATUS_COLORS).map(st => (
            <Bar key={st} dataKey={st} stackId="a" fill={STATUS_COLORS[st]} radius={st === 'Poor' ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
        {Object.entries(STATUS_COLORS).map(([st, c]) => (
          <span key={st} style={{ fontSize: 8, color: c, fontWeight: 700 }}>■ {st}</span>
        ))}
        <span style={{ fontSize: 8, color: 'var(--muted)', marginLeft: 'auto' }}>~99% <em>Caretta caretta</em></span>
      </div>

      {/* ── Ingestion material stacked bar ── */}
      <div className="section-title" style={{ marginTop: 10 }}>🪼 Ingestione plastica per materiale</div>
      <div className="bio-sub" style={{ marginBottom: 6 }}>
        Tipo di materiale plastico ritrovato nell'apparato digerente o rigurgitato. Hover per dettaglio.
      </div>
      <ResponsiveContainer width="100%" height={90}>
        <BarChart data={ingData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
          <XAxis dataKey="year" tick={{ fontSize: 9, fill: 'var(--muted)' }} tickLine={false} />
          <YAxis tick={{ fontSize: 9, fill: 'var(--muted)' }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(v, name) => [v + ' animali', MATERIAL_LABELS[name] || name]}
          />
          {allMats.map(m => (
            <Bar key={m} dataKey={m} stackId="b" fill={MATERIAL_COLORS[m] || '#888'}
              name={MATERIAL_LABELS[m] || m}
              radius={m === allMats[allMats.length - 1] ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
        {allMats.map(m => (
          <span key={m} style={{ fontSize: 7.5, color: MATERIAL_COLORS[m] || '#888', fontWeight: 700 }}>
            ■ {MATERIAL_LABELS[m] || m}
          </span>
        ))}
      </div>

      {/* ── Bio impact score trend ── */}
      <div className="section-title">📈 Andamento Bio Score (% del max)</div>
      <div className="bio-sub" style={{ marginBottom: 4 }}>Picco nel 2021 (23 entanglements). Scala 0–100 = min/max storico.</div>
      <ResponsiveContainer width="100%" height={75}>
        <LineChart data={bioScoreData} margin={{ top: 2, right: 2, bottom: 0, left: -22 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis dataKey="year" tick={{ fontSize: 9, fill: 'var(--muted)' }} tickLine={false} />
          <YAxis tick={{ fontSize: 9, fill: 'var(--muted)' }} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [v.toFixed(1) + '%', 'Bio Score']} />
          <Line type="monotone" dataKey="score" stroke="#f87171" strokeWidth={2} dot={{ fill: '#f87171', r: 3 }}
            activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>

      {/* ── Microplastics mean density ── */}
      {microData.length > 0 && (
        <>
          <div className="section-title" style={{ marginTop: 10 }}>🔬 Microplastiche — densità IDW media/anno</div>
          <div className="bio-sub" style={{ marginBottom: 4 }}>
            Griglia 336 celle (0.12°×0.12°) interpolata da {'>'}7.900 campionamenti trawl superficiali. Scala 0–1 normalizzata.
            {!microData.find(d => d.year === year) && <span style={{ color: 'var(--red)' }}> · {year}: dati non disponibili</span>}
          </div>
          <ResponsiveContainer width="100%" height={75}>
            <BarChart data={microData} margin={{ top: 2, right: 2, bottom: 0, left: -22 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 9, fill: 'var(--muted)' }} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: 'var(--muted)' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [v.toFixed(3), 'Densità media IDW']} />
              <Bar dataKey="mean" radius={[3, 3, 0, 0]} name="mean">
                {microData.map((_, i) => <Cell key={i} fill={`hsl(${260 - i * 8},70%,65%)`} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {microYear && (
            <div className="note" style={{ marginTop: 6 }}>
              <strong>{year}</strong> · celle: <span className="pos">{microYear.length}</span> · media IDW: <span className="pos">{microMean}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
