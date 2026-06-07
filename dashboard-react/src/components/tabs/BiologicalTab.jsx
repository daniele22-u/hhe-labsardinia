import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from 'recharts';
import { YEARS } from '../../constants';
import { useLang } from '../../LangContext';
import { useT } from '../../i18n';

const STATUS_COLORS = { Good: '#34d399', Fair: '#facc15', Poor: '#f87171' };
const MATERIAL_COLORS = {
  SHE: '#3b9eff', FOO: '#a78bfa', FRA: '#f87171',
  NFO: '#34d399', FOA: '#f59e0b', PEL: '#ec4899', THR: '#22d3ee', OTH: '#64748b',
};

function ScoreGauge({ score }) {
  const R = 36, cx = 50, cy = 52;
  const START_SVG = 210, TOTAL_DEG = 240;
  const pct = Math.max(0, Math.min(1, score));
  const svgPt = (deg) => {
    const rad = (deg * Math.PI) / 180;
    return [+(cx + R * Math.cos(rad)).toFixed(2), +(cy + R * Math.sin(rad)).toFixed(2)];
  };
  const [sx, sy] = svgPt(START_SVG);
  const [ex, ey] = svgPt(START_SVG - TOTAL_DEG);
  const bgPath = `M ${sx} ${sy} A ${R} ${R} 0 1 0 ${ex} ${ey}`;
  const filledDeg = pct * TOTAL_DEG;
  const valSVG = START_SVG - filledDeg;
  const [vx, vy] = svgPt(valSVG);
  const large = filledDeg > 180 ? 1 : 0;
  const valuePath = pct > 0.005 ? `M ${sx} ${sy} A ${R} ${R} 0 ${large} 0 ${vx} ${vy}` : null;
  const needleRad = (valSVG * Math.PI) / 180;
  const NL = 26;
  const nx = +(cx + NL * Math.cos(needleRad)).toFixed(2);
  const ny = +(cy + NL * Math.sin(needleRad)).toFixed(2);
  const color = score < 0.03 ? '#34d399' : score < 0.06 ? '#facc15' : score < 0.10 ? '#f59e0b' : score < 0.14 ? '#f87171' : '#ef4444';
  const label = score < 0.03 ? 'Very Low' : score < 0.06 ? 'Low' : score < 0.10 ? 'Moderate' : score < 0.14 ? 'High' : 'Critical';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 6 }}>
      <svg width={110} height={68} viewBox="0 0 100 68">
        {[0, 0.25, 0.5, 0.75, 1].map(t => {
          const tSVG = START_SVG - t * TOTAL_DEG;
          const tRad = (tSVG * Math.PI) / 180;
          const inner = R - 5, outer = R + 1;
          return <line key={t} x1={+(cx+inner*Math.cos(tRad)).toFixed(2)} y1={+(cy+inner*Math.sin(tRad)).toFixed(2)} x2={+(cx+outer*Math.cos(tRad)).toFixed(2)} y2={+(cy+outer*Math.sin(tRad)).toFixed(2)} stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} strokeLinecap="round"/>;
        })}
        <path d={bgPath} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={7} strokeLinecap="round" />
        {valuePath && <path d={valuePath} fill="none" stroke={color} strokeWidth={7} strokeLinecap="round" style={{ filter:`drop-shadow(0 0 4px ${color}88)`, transition:'stroke 0.4s' }} />}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={color} strokeWidth={2} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={4} fill={color} />
        <text x={sx+6} y={sy+6} fontSize={6} fill="rgba(255,255,255,0.35)" textAnchor="middle">0</text>
        <text x={ex-6} y={ey+6} fontSize={6} fill="rgba(255,255,255,0.35)" textAnchor="middle">max</text>
        <text x={cx} y={cy+14} textAnchor="middle" fontSize={10} fontWeight={700} fill={color} style={{ transition:'fill 0.4s' }}>{(score * 100).toFixed(1)}%</text>
      </svg>
      <span style={{ fontSize:8, color, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', marginTop:-2 }}>{label}</span>
    </div>
  );
}

export default function BiologicalTab({ D, year }) {
  const t = useT(useLang());
  if (!D) return null;

  const ML = t.materialLabels;
  const SD = t.statusDesc;

  const entData = YEARS.filter(y => D.entanglement_annual?.[String(y)]).map(y => {
    const v = D.entanglement_annual[String(y)];
    return { year: y, total: v.total, Good: v.by_status?.Good||0, Fair: v.by_status?.Fair||0, Poor: v.by_status?.Poor||0 };
  });
  const ingData = YEARS.filter(y => D.ingestion_annual?.[String(y)]).map(y => {
    const v = D.ingestion_annual[String(y)];
    return { year: y, total: v.total, ...v.by_material };
  });
  const allMats = [...new Set(Object.values(D.ingestion_annual||{}).flatMap(v => Object.keys(v.by_material||{})))];
  const bioScoreData = YEARS.filter(y => D.biological_impact_by_year?.[String(y)]).map(y => {
    const v = D.biological_impact_by_year[String(y)];
    return { year: y, score: +(v.score*100).toFixed(2) };
  });

  const entYear = D.entanglement_annual?.[String(year)] || null;
  const ingYear = D.ingestion_annual?.[String(year)] || null;
  const bioYear = D.biological_impact_by_year?.[String(year)] || null;

  const TT = { background:'var(--glass2)', border:'1px solid var(--border2)', color:'var(--text)', borderRadius:8, fontSize:10, backdropFilter:'blur(12px)' };

  return (
    <div className="tab-pane">
      <div className="bio-info-card">
        <div className="bio-info-title">{t.bioHowToTitle}</div>
        <div className="bio-info-body" dangerouslySetInnerHTML={{ __html: t.bioHowToBody }} />
      </div>

      <div className="section-title" style={{ marginTop:10 }}>{t.bioIndexTitle(year)}</div>
      {bioYear && <ScoreGauge score={bioYear.score} />}

      <div className="stat-cards" style={{ marginBottom:4 }}>
        <div className="stat-card"><div className="sv" style={{color:'var(--red)',fontSize:16}}>{entYear?entYear.total:'—'}</div><div className="sl">{t.bioEntanglements}</div></div>
        <div className="stat-card"><div className="sv" style={{color:'var(--purple)',fontSize:16}}>{ingYear?ingYear.total:'—'}</div><div className="sl">{t.bioIngestions}</div></div>
      </div>

      <div className="section-title" style={{ marginTop:12 }}>{t.bioEntTitle}</div>
      <div className="bio-sub" style={{ marginBottom:6 }}>{t.bioEntSub}</div>
      <ResponsiveContainer width="100%" height={90}>
        <BarChart data={entData} margin={{top:0,right:0,bottom:0,left:-20}}>
          <XAxis dataKey="year" tick={{fontSize:9,fill:'var(--muted)'}} tickLine={false} />
          <YAxis tick={{fontSize:9,fill:'var(--muted)'}} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={TT} formatter={(v,name) => [t.bioAnimals(v), `${name} — ${SD[name]||''}`]} />
          {Object.keys(STATUS_COLORS).map(st => <Bar key={st} dataKey={st} stackId="a" fill={STATUS_COLORS[st]} radius={st==='Poor'?[3,3,0,0]:[0,0,0,0]} />)}
        </BarChart>
      </ResponsiveContainer>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:4 }}>
        {Object.entries(STATUS_COLORS).map(([st,c]) => <span key={st} style={{fontSize:8,color:c,fontWeight:700}}>■ {st}</span>)}
        <span style={{fontSize:8,color:'var(--muted)',marginLeft:'auto'}}>~99% <em>Caretta caretta</em></span>
      </div>

      <div className="section-title" style={{ marginTop:10 }}>{t.bioIngTitle}</div>
      <div className="bio-sub" style={{ marginBottom:6 }}>{t.bioIngSub}</div>
      <ResponsiveContainer width="100%" height={90}>
        <BarChart data={ingData} margin={{top:0,right:0,bottom:0,left:-20}}>
          <XAxis dataKey="year" tick={{fontSize:9,fill:'var(--muted)'}} tickLine={false} />
          <YAxis tick={{fontSize:9,fill:'var(--muted)'}} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={TT} formatter={(v,name) => [t.bioAnimals(v), ML[name]||name]} />
          {allMats.map(m => <Bar key={m} dataKey={m} stackId="b" fill={MATERIAL_COLORS[m]||'#888'} name={ML[m]||m} radius={m===allMats[allMats.length-1]?[3,3,0,0]:[0,0,0,0]} />)}
        </BarChart>
      </ResponsiveContainer>
      <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:10 }}>
        {allMats.map(m => <span key={m} style={{fontSize:7.5,color:MATERIAL_COLORS[m]||'#888',fontWeight:700}}>■ {ML[m]||m}</span>)}
      </div>

      <div className="section-title">{t.bioTrendTitle}</div>
      <div className="bio-sub" style={{ marginBottom:4 }}>{t.bioTrendSub}</div>
      <ResponsiveContainer width="100%" height={75}>
        <LineChart data={bioScoreData} margin={{top:2,right:2,bottom:0,left:-22}}>
          <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis dataKey="year" tick={{fontSize:9,fill:'var(--muted)'}} tickLine={false} />
          <YAxis tick={{fontSize:9,fill:'var(--muted)'}} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={TT} formatter={v=>[v.toFixed(1)+'%','Bio Score']} />
          <Line type="monotone" dataKey="score" stroke="#f87171" strokeWidth={2} dot={{fill:'#f87171',r:3}} activeDot={{r:5}} />
        </LineChart>
      </ResponsiveContainer>

    </div>
  );
}
