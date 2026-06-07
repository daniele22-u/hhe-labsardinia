import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { YEARS } from '../constants';
import { useLang } from '../LangContext';
import { useT } from '../i18n';

export default function MicroplasticsPanel({ D, year }) {
  const t = useT(useLang());
  if (!D) return null;

  const microData = YEARS
    .filter(y => D.microplastics_by_year?.[String(y)])
    .map(y => {
      const rows = D.microplastics_by_year[String(y)];
      const vals = rows.map(r => r[2]);
      return { year: y, mean: +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(3) };
    });

  const microYear = D.microplastics_by_year?.[String(year)] || null;
  const microMean = microYear
    ? (microYear.reduce((a, r) => a + r[2], 0) / microYear.length).toFixed(3)
    : '—';

  const TT = {
    background: 'var(--glass2)', border: '1px solid var(--border2)',
    color: 'var(--text)', borderRadius: 8, fontSize: 10, backdropFilter: 'blur(12px)',
  };

  return (
    <div style={{ padding: '12px 14px', height: '100%', overflowY: 'auto', boxSizing: 'border-box' }}>
      <div className="section-title" style={{ marginBottom: 4 }}>{t.bioMicroTitle}</div>
      <div className="bio-sub" style={{ marginBottom: 8 }}>
        {t.bioMicroSub(year, !!microData.find(d => d.year === year))}
      </div>

      {microData.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={microData} margin={{ top: 2, right: 2, bottom: 0, left: -22 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 9, fill: 'var(--muted)' }} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: 'var(--muted)' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={TT} formatter={(v) => [v.toFixed(3), t.bioMicroDensity]} />
              <Bar dataKey="mean" radius={[3, 3, 0, 0]}>
                {microData.map((_, i) => (
                  <Cell key={i} fill={`hsl(${260 - i * 8},70%,65%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {microYear && (
            <div
              className="note"
              style={{ marginTop: 8 }}
              dangerouslySetInnerHTML={{ __html: t.bioMicroNote(year, microYear.length, microMean) }}
            />
          )}
        </>
      ) : (
        <div style={{ color: 'var(--muted)', fontSize: 11, marginTop: 20, textAlign: 'center' }}>
          No microplastics data
        </div>
      )}

      <div style={{ marginTop: 14, padding: '8px 10px', background: 'rgba(255,255,255,.04)', borderRadius: 8, fontSize: 9, color: 'var(--muted)', lineHeight: 1.5 }}>
        ℹ️ This compartment is shown as an <strong>extensibility demo</strong>. Any dataset with spatial
        sampling can be plugged in as a new panel using the same IDW pipeline.
      </div>
    </div>
  );
}
