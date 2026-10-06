import React, { useEffect, useRef, useState } from "react";
import { ChevronUp, ChevronDown, Pause, Play, X } from "lucide-react";
import { certificates } from "./data";
import { heroHighlights } from "./heroHighlights";
import { track } from "../../lib/analytics";
import "./card-wheel.css";

const topByFirm = name => certificates
  .filter(c => c.firm === name)
  .sort((a,b) => b.amountNum-a.amountNum);

const privateFundedNextIds = new Set(["fundednext-004", "fundednext-005"]);
const mavenTop = topByFirm("Maven").slice(0,10);
const fundedNextTop = topByFirm("FundedNext").filter(c => !privateFundedNextIds.has(c.id)).slice(0,2);
const lucidTop = topByFirm("Lucid Trading").slice(0,2);
const topstepTop = topByFirm("Topstep").slice(0,2);
const breakoutTop = topByFirm("Breakout").slice(0,2);
const tradeifyLifetime = heroHighlights.find(c => c.id === "hero-tradeify-lifetime");
const tradeifyTop = [tradeifyLifetime, ...topByFirm("Tradeify").slice(0,1)].filter(Boolean);

const supporting = [
  fundedNextTop[0], tradeifyTop[0], lucidTop[0], topstepTop[0], breakoutTop[0],
  fundedNextTop[1], tradeifyTop[1], lucidTop[1], topstepTop[1], breakoutTop[1],
].filter(Boolean);

// Keep Maven's biggest payouts as the visual backbone without turning the wheel into a Maven-only feed.
// Sequence reads like: FundedNext → Maven → Tradeify → Maven → Lucid → Maven ...
const cards = mavenTop.flatMap((maven,i) => [supporting[i], maven]).filter(Boolean);
const wrap = n => ((n % cards.length) + cards.length) % cards.length;

export default function CardWheel() {
  const [position, setPosition] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hover, setHover] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [selected, setSelected] = useState(null);
  const drag = useRef(null);
  const modal = useRef(null);
  useEffect(() => {
    if (paused || hover || dragging || selected) return;
    const timer = setInterval(() => setPosition(p => p + 1), 3800);
    return () => clearInterval(timer);
  }, [paused, hover, dragging, selected]);
  const current = cards[wrap(position)];
  const inspect = () => { setSelected(current); track("hero_payout_inspect", { firm: current.firm, id: current.id }); modal.current.showModal(); };
  return <div className="wheel-shell">
    <div className="wheel-stage" aria-label="Payout card wheel" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <div className="wheel-orbit" aria-hidden="true" />
      <div className="wheel-cards" onPointerDown={e => { if(e.button !== 0) return; drag.current={y:e.clientY,moved:false}; setDragging(true); e.currentTarget.setPointerCapture(e.pointerId); }}
        onPointerMove={e => { if(!drag.current) return; const delta=e.clientY-drag.current.y; if(Math.abs(delta)>45){setPosition(p=>p+(delta<0?1:-1));drag.current.y=e.clientY;drag.current.moved=true;} }}
        onPointerUp={() => {const moved=drag.current?.moved;drag.current=null;setDragging(false);if(!moved) inspect();}}
        onPointerCancel={() => {drag.current=null;setDragging(false);}}>
        {cards.map((c,i) => { const offset = wrap(i-wrap(position)+cards.length/2)-cards.length/2; const visible=Math.abs(offset)<=2; return <div key={c.id} aria-hidden="true" className={`wheel-card ${offset===0?'is-front':''}`} style={{ transform:`translate(calc(-50% + ${Math.abs(offset)*Math.abs(offset)*48}px), calc(-50% + ${offset*142}px)) rotate(${offset*-11}deg) scale(${1-Math.min(Math.abs(offset),4)*.09})`,opacity:visible?1-Math.abs(offset)*.28:0,zIndex:10-Math.abs(offset),visibility:visible?'visible':'hidden' }}><img src={c.url} alt="" draggable="false" loading="eager" /></div>; })}
      </div>
      <button className="wheel-inspect" onClick={inspect} aria-label={`Inspect ${current.firm} payout`}>{current.kind === "lifetime" ? "Inspect lifetime total ↗" : "Inspect payout ↗"}</button>
    </div>
    <div className="wheel-bottom"><div aria-live="polite"><span>{current.firm}{current.kind === "lifetime" ? " · Lifetime total" : ""}</span><small>{String(wrap(position)+1).padStart(2,'0')} / {cards.length} · Drag to explore</small></div><div className="wheel-controls"><button onClick={()=>setPosition(p=>p-1)} aria-label="Previous payout"><ChevronUp size={16}/></button><button onClick={()=>setPaused(p=>!p)} aria-label={paused?'Play card wheel':'Pause card wheel'}>{paused?<Play size={14}/>:<Pause size={14}/>}</button><button onClick={()=>setPosition(p=>p+1)} aria-label="Next payout"><ChevronDown size={16}/></button></div></div>
    <dialog ref={modal} aria-label="Payout certificate" onClose={()=>setSelected(null)} className="wheel-dialog"><button autoFocus onClick={()=>modal.current.close()} aria-label="Close certificate"><X size={20}/></button>{selected&&<><img src={selected.url} alt={`${selected.firm} payout ${selected.amount}`}/><p>{selected.firm} · {selected.kind === "lifetime" ? "Lifetime total" : selected.date}</p></>}</dialog>
  </div>;
}
