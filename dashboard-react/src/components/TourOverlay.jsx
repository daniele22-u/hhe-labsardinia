import { useEffect, useRef, useState } from 'react';

export default function TourOverlay({ steps, step, onNext, onPrev, onExit }) {
  const [rect, setRect]           = useState(null);
  const [tipPos, setTipPos]       = useState({ top: '50%', left: '50%' });
  const [tipReady, setTipReady]   = useState(false);
  const tipRef = useRef(null);

  // Measure target element after step side-effects settle
  useEffect(() => {
    setTipReady(false);
    const current = steps[step];
    if (!current?.target) { setRect(null); setTipReady(true); return; }

    const measure = () => {
      const el = document.querySelector(current.target);
      if (!el) { setRect(null); setTipReady(true); return; }
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      setTipReady(true);
    };

    // Two RAF ticks: first lets React re-render, second lets layout stabilise
    requestAnimationFrame(() => requestAnimationFrame(measure));
  }, [step, steps]);

  // Position tooltip around spotlight
  useEffect(() => {
    if (!rect || !tipRef.current || !tipReady) return;
    const TW = tipRef.current.offsetWidth  || 290;
    const TH = tipRef.current.offsetHeight || 160;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const PAD = 18;

    let top, left;

    const elCenterX = rect.left + rect.width / 2;
    const inRightHalf = elCenterX > vw / 2;

    if (inRightHalf) {
      // Anchor immediately left of the side panel (right:16px, width:300px)
      const panelLeft = vw - 16 - 300;
      left = panelLeft - TW - 12;
      top  = Math.max(PAD + 80, Math.min(rect.top + rect.height / 2 - TH / 2, vh - TH - PAD));
    } else {
      // Default: below element
      top  = rect.top + rect.height + 14;
      left = rect.left + rect.width / 2 - TW / 2;
      left = Math.max(PAD, Math.min(left, vw - TW - PAD));
      // If below viewport → above
      if (top + TH > vh - PAD) top = rect.top - TH - 14;
      // If above viewport → to the right
      if (top < PAD) {
        top  = Math.max(PAD, rect.top + rect.height / 2 - TH / 2);
        left = Math.min(rect.left + rect.width + 14, vw - TW - PAD);
      }
    }

    setTipPos({ top, left });
  }, [rect, tipReady]);

  const current = steps[step];
  if (!current) return null;

  const isFirst = step === 0;
  const isLast  = step === steps.length - 1;
  const PAD = 8;

  const spotlightStyle = rect ? {
    position: 'fixed',
    top:    rect.top  - PAD,
    left:   rect.left - PAD,
    width:  rect.width  + PAD * 2,
    height: rect.height + PAD * 2,
    borderRadius: 12,
    boxShadow: '0 0 0 3px rgba(59,158,255,.9), 0 0 0 9999px rgba(0,0,0,.68)',
    zIndex: 9998,
    pointerEvents: 'none',
    transition: 'top .35s cubic-bezier(.4,0,.2,1), left .35s cubic-bezier(.4,0,.2,1), width .35s, height .35s',
  } : null;

  const tooltipStyle = {
    position: 'fixed',
    zIndex: 9999,
    width: 290,
    ...(rect
      ? { top: tipPos.top, left: tipPos.left }
      : { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }
    ),
  };

  return (
    <>
      {/* Full dim when no target */}
      {!rect && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,.68)',
          zIndex: 9997, pointerEvents: 'none',
        }} />
      )}

      {/* Spotlight ring */}
      {rect && <div style={spotlightStyle} />}

      {/* Tooltip card */}
      <div
        ref={tipRef}
        key={step}
        className="tour-tooltip"
        style={tooltipStyle}
        onClick={e => e.stopPropagation()}
      >
        {/* Step counter */}
        <div className="tour-counter">{step + 1} / {steps.length}</div>

        <div className="tour-title">{current.title}</div>
        <div className="tour-body">{current.body}</div>

        {/* Progress bar */}
        <div className="tour-progress-wrap">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`tour-dot${i === step ? ' active' : i < step ? ' done' : ''}`}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="tour-controls">
          <button className="tour-exit" onClick={onExit}>✕ Exit</button>
          <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
            {!isFirst && (
              <button className="tour-btn" onClick={onPrev}>← Prev</button>
            )}
            <button
              className="tour-btn tour-btn-primary"
              onClick={isLast ? onExit : onNext}
            >
              {isLast ? '✓ Done' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
