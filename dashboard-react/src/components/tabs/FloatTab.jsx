import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CORR, CORR_LABELS } from '../../constants';

const COLORS = ['#3b9eff','#a78bfa','#34d399','#f5a623','#f87171','#64748b'];

function corrStyle(v, isLabel) {
  if (isLabel) return { background: 'transparent', color: 'var(--muted)', fontWeight: 600 };
  if (v === 1) return { background: 'rgba(255,255,255,.05)', color: 'var(--muted)' };
  const a = Math.abs(v);
  if (v > 0) return { background: `rgba(59,158,255,${a*.7+.08})`, color: '#fff' };
  return { background: `rgba(248,113,113,${a*.7+.08})`, color: '#fff' };
}

export default function FloatTab({ D, year }) {
  if (!D) return null;
  const mats = D.mat_by_year?.[String(year)] || {};
  const total = Object.values(mats).reduce((a,b)=>a+b,0);
  const pieData = Object.entries(mats).map(([name,value]) => ({ name, value }));
  const plastic = mats['Artificial polymer'] || 0;
  const pctPlastic = total > 0 ? (plastic/total*100).toFixed(0) : '—';

  const L = CORR_LABELS;
  const cells = [];
  cells.push(<div key="c0" className="corr-cell" style={{background:'transparent'}}/>);
  L.forEach(l => cells.push(<div key={`h${l}`} className="corr-cell" style={corrStyle(null,true)}>{l}</div>));
  L.forEach((rl,i) => {
    cells.push(<div key={`rl${i}`} className="corr-cell" style={corrStyle(null,true)}>{rl}</div>);
    L.forEach((_,j) => {
      const v = CORR[i][j];
      cells.push(<div key={`${i}${j}`} className="corr-cell" style={corrStyle(v,false)}>{v===1?'—':v.toFixed(2)}</div>);
    });
  });

  return (
    <div className="tab-pane">
      <div className="section-title">Floating Litter — {year}</div>
      <ResponsiveContainer width="100%" height={145}>
        <PieChart>
          <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={52} innerRadius={28}>
            {pieData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={(v)=>[`${v} obs`,'']} contentStyle={{background:'var(--glass2)',border:'1px solid var(--border2)',color:'var(--text)',borderRadius:8,fontSize:11}} />
          <Legend iconSize={7} wrapperStyle={{fontSize:9,color:'var(--muted)', paddingTop:'10px'}}/>
        </PieChart>
      </ResponsiveContainer>
      <div className="note">
        <strong>{pctPlastic}%</strong> plastic of {total} obs · corr vs current speed: <strong>r = −0.66</strong>
      </div>
      <div className="corr-wrap">
        <div className="section-title" style={{marginTop:14}}>Spearman Correlation</div>
        <div className="corr-grid" style={{gridTemplateColumns:'repeat(5,1fr)'}}>{cells}</div>
        <div style={{fontSize:8,color:'var(--muted)',marginTop:4}}>BL=Beach Litter · T=Tourism · CS=Current · FL=Floating</div>
      </div>
    </div>
  );
}
