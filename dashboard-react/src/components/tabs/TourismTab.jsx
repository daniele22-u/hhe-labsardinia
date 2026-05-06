import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { YEARS, EU_THRESHOLD } from '../../constants';

export default function TourismTab({ D }) {
  if (!D) return null;
  const data = YEARS.map(y => {
    const br = D.beach_annual.filter(d => +d.year === y);
    const litter = br.length ? +(br.reduce((a,b)=>a+b.items_per_100m,0)/br.length).toFixed(1) : null;
    const tr = D.tourism_annual.find(d => +d.year === y);
    return { year: String(y), litter, tourists: tr ? +(tr.tourists/1e6).toFixed(2) : null };
  });

  return (
    <div className="tab-pane">
      <div className="section-title">Tourism vs Litter Trend</div>
      <ResponsiveContainer width="100%" height={190}>
        <ComposedChart data={data} margin={{top:4,right:8,bottom:0,left:-14}}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
          <XAxis dataKey="year" tick={{fill:'var(--muted)',fontSize:9}} />
          <YAxis yAxisId="l" tick={{fill:'var(--red)',fontSize:8}} />
          <YAxis yAxisId="r" orientation="right" tick={{fill:'var(--accent2)',fontSize:8}} />
          <Tooltip contentStyle={{background:'rgba(8,18,38,.9)',border:'1px solid rgba(255,255,255,.12)',color:'var(--text)',borderRadius:8,fontSize:11,backdropFilter:'blur(12px)'}}/>
          <Legend iconSize={8} wrapperStyle={{fontSize:9,color:'var(--muted)'}}/>
          <ReferenceLine yAxisId="l" y={EU_THRESHOLD} stroke="rgba(255,255,255,.2)" strokeDasharray="4 3"/>
          <Bar  yAxisId="l" dataKey="litter"   name="Beach litter" fill="rgba(248,113,113,.6)"  radius={[3,3,0,0]}/>
          <Line yAxisId="r" dataKey="tourists" name="Tourists M"   stroke="var(--accent2)" strokeWidth={2} dot={{r:3,fill:'var(--accent2)'}} type="monotone"/>
        </ComposedChart>
      </ResponsiveContainer>
      <div className="note">
        Pearson r = <span className="pos">−0.44</span> · Sardinia presenze regionali<br/>
        <span style={{fontSize:9}}>Urban beaches have more cleaning → lower litter counts</span>
      </div>
    </div>
  );
}
