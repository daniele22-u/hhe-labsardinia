import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CORR, CORR_LABELS } from '../../constants';

const PIE_COLORS = ['#e74c3c','#95a5a6','#27ae60','#8B4513','#f39c12','#3498db','#9b59b6'];

function corrColor(v, isLabel) {
  if (isLabel) return { background: 'transparent', color: 'var(--muted)', fontWeight: 600 };
  if (v === 1) return { background: '#1e3a5f', color: 'var(--text)' };
  const a = Math.abs(v);
  if (v > 0) return { background: `rgba(28,122,184,${a*0.8+0.1})`, color: '#fff' };
  return { background: `rgba(231,76,60,${a*0.8+0.1})`, color: '#fff' };
}

export default function FloatTab({ D, year }) {
  if (!D) return null;

  const mats = D.mat_by_year?.[String(year)] || {};
  const total = Object.values(mats).reduce((a,b)=>a+b,0);
  const pieData = Object.entries(mats).map(([name, value]) => ({ name, value }));
  const plastic = mats['Artificial polymer'] || 0;
  const pctPlastic = total > 0 ? (plastic/total*100).toFixed(0) : '—';

  // 5×5 corr matrix with labels
  const labels = CORR_LABELS;
  const cells = [];
  // header row
  cells.push(<div key="h0" className="corr-cell" style={{background:'transparent'}}></div>);
  labels.forEach(l => cells.push(<div key={`h${l}`} className="corr-cell" style={corrColor(null,true)}>{l}</div>));
  labels.forEach((rl, i) => {
    cells.push(<div key={`rl${i}`} className="corr-cell" style={corrColor(null,true)}>{rl}</div>);
    labels.forEach((_, j) => {
      const v = CORR[i][j];
      cells.push(<div key={`${i}-${j}`} className="corr-cell" style={corrColor(v,false)}>{v === 1 ? '—' : v.toFixed(2)}</div>);
    });
  });

  return (
    <div className="tab-pane">
      <h3>Floating Litter — Material Mix ({year})</h3>
      <ResponsiveContainer width="100%" height={150}>
        <PieChart>
          <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={55} innerRadius={30}>
            {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={(v) => [`${v} obs`, '']} contentStyle={{ background:'var(--panel2)', border:'1px solid var(--border)', color:'var(--text)', borderRadius:6 }} />
          <Legend iconSize={8} wrapperStyle={{ fontSize: 9, color: 'var(--muted)' }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="note" style={{marginBottom:12}}>
        Plastic: <strong>{pctPlastic}%</strong> of {total} obs &nbsp;·&nbsp;
        Corr vs current: <strong style={{color:'#e74c3c'}}>r = −0.66</strong>
      </div>
      <h3>Spearman Correlation Matrix</h3>
      <div className="corr-grid" style={{gridTemplateColumns:`repeat(5,1fr)`}}>{cells}</div>
      <div style={{fontSize:9,color:'var(--muted)'}}>BL=Beach Litter · T=Tourism · CS=Current Speed · FL=Floating</div>
    </div>
  );
}
