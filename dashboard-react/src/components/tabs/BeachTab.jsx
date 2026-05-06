import { EU_THRESHOLD, PERIOD_COLORS, PERIOD_MAP } from '../../constants';

export default function BeachTab({ D, year }) {
  if (!D) return null;
  const bids = Object.keys(D.beach_names);
  const maxVal = 4000;

  const rows = bids.map(bid => {
    const r = D.beach_annual.find(d => d.beach_id === bid && +d.year === year);
    return { bid, val: r ? r.items_per_100m : null, color: D.beach_colors[bid] };
  });

  const defined = rows.filter(r => r.val !== null).map(r => r.val);
  const mean = defined.length ? (defined.reduce((a,b)=>a+b,0)/defined.length).toFixed(0) : '—';
  const aboveEU = defined.filter(v => v > EU_THRESHOLD).length;

  return (
    <div className="tab-pane">
      <h3>Beach Litter — items/100m</h3>
      <div className="beach-bars">
        {rows.map(({ bid, val, color }) => {
          const pct = val !== null ? Math.min(100, val / maxVal * 100) : 0;
          const euPct = EU_THRESHOLD / maxVal * 100;
          const over = val !== null && val > EU_THRESHOLD;
          return (
            <div key={bid} className="bar-row">
              <span className="bar-label" title={D.beach_names[bid]}>
                {D.beach_names[bid].split(' ')[0]}
              </span>
              <div className="bar-outer">
                <div className="bar-inner" style={{ width: `${pct}%`, background: `${color}88`, borderLeft: `2px solid ${color}` }} />
                <div className="bar-eu" style={{ left: `${euPct}%` }} />
              </div>
              <span className="bar-val" style={{ color: over ? 'var(--red)' : 'var(--muted)' }}>
                {val !== null ? val.toFixed(0) : 'N/A'}
              </span>
            </div>
          );
        })}
      </div>
      <div className="stats-row">
        <div className="mini-stat"><div className="v" style={{color:'var(--accent)'}}>{defined.length * 2} est</div><div className="l">Surveys</div></div>
        <div className="mini-stat"><div className="v" style={{color:'var(--red)'}}>{aboveEU}/6</div><div className="l">Above EU 150</div></div>
        <div className="mini-stat"><div className="v" style={{color:'var(--accent2)'}}>{mean}</div><div className="l">Mean</div></div>
      </div>
    </div>
  );
}
