import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

export default function CurrentsTab({ D, year }) {
  if (!D) return null;

  const yearRow = D.current_monthly.filter(r => +r.year === year);
  const annualMean = yearRow.length
    ? yearRow.reduce((a,b) => a + b.mean_speed_ms, 0) / yearRow.length
    : null;
  const meanCm = annualMean ? (annualMean * 100).toFixed(1) : '—';

  const dirRow = yearRow[Math.floor(yearRow.length/2)];
  const dirDeg = dirRow ? dirRow.direction_deg.toFixed(0) : null;
  const dirLabel = dirDeg ? degToCompass(+dirDeg) : '—';

  const allData = D.current_monthly.map(r => ({
    label: `${r.year}-${String(r.month).padStart(2,'0')}`,
    speed: +(r.mean_speed_ms * 100).toFixed(2),
    yr: +r.year,
  }));

  return (
    <div className="tab-pane">
      <h3>Surface Currents (CMEMS)</h3>
      <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:14 }}>
        <div>
          <div style={{ fontSize:38, fontWeight:700, color:'var(--accent)', lineHeight:1 }}>{meanCm}</div>
          <div style={{ fontSize:10, color:'var(--muted)' }}>cm/s annual mean · {year}</div>
          <div style={{ fontSize:11, color:'var(--text)', marginTop:4 }}>Direction: {dirLabel}</div>
        </div>
        <Compass deg={dirDeg ? +dirDeg : 0} />
      </div>
      <h3 style={{marginBottom:8}}>Monthly Speed 2018–2023</h3>
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={allData} margin={{ top:4, right:6, bottom:0, left:-10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f55" />
          <XAxis dataKey="label" tick={false} />
          <YAxis tick={{ fill:'var(--muted)', fontSize:9 }} />
          <Tooltip
            contentStyle={{ background:'var(--panel2)', border:'1px solid var(--border)', color:'var(--text)', borderRadius:6, fontSize:10 }}
            formatter={v => [`${v} cm/s`, 'Speed']}
          />
          {allData.filter((d,i,a) => i===0 || d.yr !== a[i-1].yr).map(d => (
            <ReferenceLine key={d.yr} x={d.label} stroke="#1e3a5f" strokeDasharray="2 2" />
          ))}
          <Line dataKey="speed" stroke={`var(--accent)`} strokeWidth={1.5} dot={false} type="monotone"
            stroke={`#1c7ab8`}
          />
          {/* Highlight current year */}
          {yearRow.map(r => null)}
        </LineChart>
      </ResponsiveContainer>
      <div className="note" style={{marginTop:8}}>
        Floating litter vs current: <strong style={{color:'#e74c3c'}}>Spearman r = −0.66</strong><br/>
        <span style={{fontSize:9}}>Faster currents disperse items away from fixed transects</span>
      </div>
    </div>
  );
}

function Compass({ deg }) {
  const rad = (deg - 90) * Math.PI / 180;
  const cx = 30, cy = 30, r = 22;
  const x = cx + r * Math.cos(rad);
  const y = cy + r * Math.sin(rad);
  return (
    <svg width="60" height="60" style={{ flexShrink:0 }}>
      <circle cx={cx} cy={cy} r={28} fill="#0d1a2e" stroke="#1e3a5f" strokeWidth={1} />
      {['N','E','S','W'].map((d,i) => {
        const a = i * 90 * Math.PI/180;
        return <text key={d} x={cx + 20*Math.cos(a-Math.PI/2)} y={cy + 20*Math.sin(a-Math.PI/2)} textAnchor="middle" dominantBaseline="middle" fontSize="8" fill="#5a7fa0">{d}</text>;
      })}
      <line x1={cx} y1={cy} x2={x} y2={y} stroke="#1c7ab8" strokeWidth={2.5} strokeLinecap="round"/>
      <circle cx={cx} cy={cy} r={3} fill="#f39c12"/>
    </svg>
  );
}

function degToCompass(d) {
  const dirs = ['N','NE','E','SE','S','SW','W','NW'];
  return dirs[Math.round(d/45) % 8];
}
