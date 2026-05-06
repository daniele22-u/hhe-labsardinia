import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

function degToCompass(d) {
  return ['N','NE','E','SE','S','SW','W','NW'][Math.round(d/45)%8];
}

function Compass({ deg }) {
  const r2 = (deg - 90) * Math.PI / 180;
  const cx=30,cy=30,rv=20;
  return (
    <svg width="60" height="60">
      <circle cx={cx} cy={cy} r={28} fill="rgba(255,255,255,.04)" stroke="rgba(255,255,255,.1)" strokeWidth={1}/>
      {['N','E','S','W'].map((d,i) => {
        const a = i*90*Math.PI/180 - Math.PI/2;
        return <text key={d} x={cx+19*Math.cos(a)} y={cy+19*Math.sin(a)} textAnchor="middle" dominantBaseline="middle" fontSize="8" fill="var(--muted)" fontFamily="Inter">{d}</text>;
      })}
      <line x1={cx} y1={cy} x2={cx+rv*Math.cos(r2)} y2={cy+rv*Math.sin(r2)} stroke="var(--accent)" strokeWidth={2.5} strokeLinecap="round"/>
      <circle cx={cx} cy={cy} r={3} fill="var(--accent2)"/>
    </svg>
  );
}

export default function CurrentsTab({ D, year }) {
  if (!D) return null;
  const yr = D.current_monthly.filter(r => +r.year === year);
  const meanCms = yr.length ? (yr.reduce((a,b)=>a+b.mean_speed_ms,0)/yr.length*100).toFixed(1) : '—';
  const dirDeg  = yr.length ? yr[Math.floor(yr.length/2)].direction_deg : 0;

  const allData = D.current_monthly.map(r => ({
    label: `${r.year}-${String(r.month).padStart(2,'0')}`,
    speed: +(r.mean_speed_ms*100).toFixed(2),
    yr: +r.year,
  }));

  const yrStart = allData.find(d => d.yr === year)?.label;

  return (
    <div className="tab-pane">
      <div className="section-title">Surface Currents (CMEMS)</div>
      <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:16}}>
        <Compass deg={dirDeg}/>
        <div>
          <div style={{fontSize:38,fontWeight:800,color:'var(--accent)',lineHeight:1,letterSpacing:'-.02em'}}>{meanCms}</div>
          <div style={{fontSize:10,color:'var(--muted)',marginTop:2}}>cm/s · {year} mean</div>
          <div style={{fontSize:11,color:'var(--text)',marginTop:4}}>{degToCompass(dirDeg)} direction</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={allData} margin={{top:2,right:6,bottom:0,left:-14}}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)"/>
          <XAxis dataKey="label" tick={false}/>
          <YAxis tick={{fill:'var(--muted)',fontSize:8}}/>
          <Tooltip contentStyle={{background:'rgba(8,18,38,.9)',border:'1px solid rgba(255,255,255,.12)',color:'var(--text)',borderRadius:8,fontSize:10}} formatter={v=>[`${v} cm/s`,'Speed']}/>
          {yrStart && <ReferenceLine x={yrStart} stroke="var(--accent2)" strokeWidth={1} strokeDasharray="3 2"/>}
          <Line dataKey="speed" stroke="var(--accent)" strokeWidth={1.5} dot={false} type="monotone"/>
        </LineChart>
      </ResponsiveContainer>
      <div className="note">
        Spearman r = <strong>−0.66</strong> (floating vs current speed)<br/>
        <span style={{fontSize:9}}>Faster currents disperse items from fixed transects</span>
      </div>
    </div>
  );
}
