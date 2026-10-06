import React, { useEffect, useRef, useState } from "react";
import "./payout-waterfall.css";

// Pixel speed is independent of the number of records in a column.
const PIXELS_PER_SECOND = 12;
function Column({ records, reverse, paused, onOpen }) {
  const loopRecords = records.length ? Array.from({ length: Math.max(records.length, 5) }, (_, i) => records[i % records.length]) : [];
  const group = useRef(null);
  const [distance, setDistance] = useState(0);
  useEffect(() => {
    const measure = () => setDistance(group.current?.getBoundingClientRect().height || 0);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(group.current);
    return () => observer.disconnect();
  }, [records]);
  return <div className="pw-column">
    <div className="pw-track" style={{ "--pw-distance": `${distance}px`, animationDuration: `${distance / PIXELS_PER_SECOND || 1}s`, animationDirection: reverse ? "reverse" : "normal", animationPlayState: paused || !distance ? "paused" : "running" }}>
      {[0, 1].map(copy => <div className="pw-group" key={copy} ref={copy === 0 ? group : undefined} aria-hidden={copy === 1 ? true : undefined}>
        {loopRecords.map((c, index) => <button key={c.id + "-" + index} type="button" className="pw-card" tabIndex={copy === 1 ? -1 : 0} onClick={() => onOpen(c)} aria-label={`Enlarge ${c.firm}, ${c.amount}, ${c.date}`}>
          <img src={c.url} alt={copy === 0 ? `${c.firm} payout record for ${c.amount}` : ""} loading="lazy" decoding="async" />
          <span><span>{c.firm}</span><strong>{c.amount}</strong></span>
        </button>)}
      </div>)}
    </div>
  </div>;
}

export default function PayoutWaterfall({ records, compact = false }) {
  const [paused, setPaused] = useState(false);
  const [active, setActive] = useState(null);
  const dialog = useRef(null);
  useEffect(() => {
    if (!active) return;
    const element = dialog.current;
    element.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { element.close(); document.body.style.overflow = previous; };
  }, [active]);
  const left = records.filter((_, i) => i % 2 === 0);
  const right = records.filter((_, i) => i % 2 === 1);
  return <div className={`pw ${compact ? "pw-compact" : ""}`}>
    <div className="pw-controls"><span>EXPLORE THE PAYOUTS</span><button type="button" aria-pressed={paused} onClick={() => setPaused(p => !p)}>{paused ? "Resume motion" : "Pause motion"}</button></div>
    <div className="pw-window" aria-label="Two-column payout waterfall">
      <Column records={left} paused={paused || !!active} onOpen={setActive} />
      <Column records={right} reverse paused={paused || !!active} onOpen={setActive} />
    </div>
    <p className="pw-hint">Hover to pause · Tap a card to enlarge</p>
    <dialog ref={dialog} className="pw-dialog" aria-label="Payout record" onClose={() => setActive(null)}>
      {active && <><header><div><strong>{active.firm} · {active.amount}</strong><span>{active.date}</span></div><button type="button" autoFocus onClick={() => dialog.current.close()}>Close ×</button></header>
        <img src={active.url} alt={`${active.firm} payout record for ${active.amount}`} />
        {active.firm === "Topstep" && <p>Personal payout record recreated from transfer evidence.</p>}
      </>}
    </dialog>
  </div>;
}
