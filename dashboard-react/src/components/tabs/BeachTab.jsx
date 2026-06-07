import { EU_THRESHOLD } from '../../constants';
import { useLang } from '../../LangContext';
import { useT } from '../../i18n';

export default function BeachTab({ D, year }) {
  const t = useT(useLang());
  if (!D) return <div className="tab-pane" style={{color:'var(--muted)',fontSize:12}}>Loading…</div>;
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
      <div className="section-title">{t.beachTitle(year)}</div>
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
              <div className="bar-track">
                <div className="bar-fill" style={{ width:`${pct}%`, background:`linear-gradient(90deg, ${color}99, ${color})` }} />
                <div className="bar-eu" style={{ left:`${euPct}%` }} />
              </div>
              <span className="bar-val" style={{ color: over ? 'var(--red)' : 'var(--muted)' }}>
                {val !== null ? val.toFixed(0) : 'N/A'}
              </span>
            </div>
          );
        })}
      </div>
      <div className="stat-cards">
        <div className="stat-card"><div className="sv" style={{color:'var(--accent)'}}>{defined.length*2}</div><div className="sl">{t.surveysEst}</div></div>
        <div className="stat-card"><div className="sv" style={{color:'var(--red)'}}>{aboveEU}/6</div><div className="sl">{t.aboveEU}</div></div>
        <div className="stat-card"><div className="sv" style={{color:'var(--accent2)'}}>{mean}</div><div className="sl">{t.meanI100m}</div></div>
      </div>
    </div>
  );
}
