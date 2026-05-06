import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { YEARS, EU_THRESHOLD } from '../../constants';

export default function TourismTab({ D }) {
  if (!D) return null;

  const data = YEARS.map(y => {
    const beachRows = D.beach_annual.filter(d => +d.year === y);
    const litter = beachRows.length
      ? beachRows.reduce((a,b) => a + b.items_per_100m, 0) / beachRows.length
      : null;
    const tRow = D.tourism_annual.find(d => +d.year === y);
    const tourists = tRow ? tRow.tourists / 1e6 : null;
    return { year: String(y), litter: litter ? +litter.toFixed(1) : null, tourists };
  });

  return (
    <div className="tab-pane">
      <h3>Tourism vs Litter Trend</h3>
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={data} margin={{ top: 4, right: 10, bottom: 0, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f55" />
          <XAxis dataKey="year" tick={{ fill: 'var(--muted)', fontSize: 10 }} />
          <YAxis yAxisId="left"  tick={{ fill: '#e74c3c', fontSize: 9 }} label={{ value:'items/100m', angle:-90, position:'insideLeft', fill:'#e74c3c', fontSize:8, dx:12 }} />
          <YAxis yAxisId="right" orientation="right" tick={{ fill: 'var(--accent2)', fontSize: 9 }} label={{ value:'tourists M', angle:90, position:'insideRight', fill:'var(--accent2)', fontSize:8, dx:-6 }} />
          <Tooltip contentStyle={{ background:'var(--panel2)', border:'1px solid var(--border)', color:'var(--text)', borderRadius:6, fontSize:11 }} />
          <Legend iconSize={8} wrapperStyle={{ fontSize: 9, color: 'var(--muted)' }} />
          <ReferenceLine yAxisId="left" y={EU_THRESHOLD} stroke="rgba(255,255,255,0.25)" strokeDasharray="4 3" label={{ value:'EU 150', position:'insideTopRight', fill:'rgba(255,255,255,.4)', fontSize:8 }} />
          <Bar  yAxisId="left"  dataKey="litter"   name="Beach litter (mean)" fill="#e74c3c88" radius={[2,2,0,0]} />
          <Line yAxisId="right" dataKey="tourists" name="Tourists (M)" stroke="var(--accent2)" strokeWidth={2} dot={{ r:3, fill:'var(--accent2)' }} type="monotone" />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="note">
        Sardinia presenze regionali · Pearson r = <strong style={{color:'var(--accent2)'}}>−0.44</strong><br/>
        <span style={{fontSize:9}}>Confounding: urban beaches get more cleaning → lower measured litter</span>
      </div>
    </div>
  );
}
