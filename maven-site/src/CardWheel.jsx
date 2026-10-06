import React, { useEffect, useRef, useState } from "react";
import { ChevronUp, ChevronDown, Pause, Play, X } from "lucide-react";
import { orderedCertificates } from "./data";
import { depositById } from "./deposits";
import "./card-wheel.css";

const cards = orderedCertificates;
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
  const inspect = () => { setSelected(current); modal.current.showModal(); };
  return <div className="wheel-shell">
    <div className="wheel-stage" aria-label="Payout card wheel" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <div className="wheel-orbit" aria-hidden="true" />
      <div className="wheel-cards" onPointerDown={e => { if(e.button !== 0) return; drag.current={y:e.clientY,moved:false}; setDragging(true); e.currentTarget.setPointerCapture(e.pointerId); }}
        onPointerMove={e => { if(!drag.current) return; const delta=e.clientY-drag.current.y; if(Math.abs(delta)>45){setPosition(p=>p+(delta<0?1:-1));drag.current.y=e.clientY;drag.current.moved=true;} }}
        onPointerUp={() => {const moved=drag.current?.moved;drag.current=null;setDragging(false);if(!moved) inspect();}}
        onPointerCancel={() => {drag.current=null;setDragging(false);}}>
        {cards.map((c,i) => { const offset = wrap(i-wrap(position)+cards.length/2)-cards.length/2; const visible=Math.abs(offset)<=2; return <div key={c.id} aria-hidden="true" className={`wheel-card ${offset===0?'is-front':''}`} style={{ transform:`translate(calc(-50% + ${Math.abs(offset)*Math.abs(offset)*48}px), calc(-50% + ${offset*142}px)) rotate(${offset*-11}deg) scale(${1-Math.min(Math.abs(offset),4)*.09})`,opacity:visible?1-Math.abs(offset)*.28:0,zIndex:10-Math.abs(offset),visibility:visible?'visible':'hidden' }}><img src={c.url} alt="" draggable="false" loading="eager" /></div>; })}
      </div>
      <button className="wheel-inspect" onClick={inspect} aria-label="Inspect Maven payout">Inspect payout ↗</button>
    </div>
    <div className="wheel-bottom"><div aria-live="polite"><span>Maven</span><small>{String(wrap(position)+1).padStart(2,'0')} / {cards.length} · Drag to explore</small></div><div className="wheel-controls"><button onClick={()=>setPosition(p=>p-1)} aria-label="Previous payout"><ChevronUp size={16}/></button><button onClick={()=>setPaused(p=>!p)} aria-label={paused?'Play card wheel':'Pause card wheel'}>{paused?<Play size={14}/>:<Pause size={14}/>}</button><button onClick={()=>setPosition(p=>p+1)} aria-label="Next payout"><ChevronDown size={16}/></button></div></div>
    <dialog ref={modal} aria-label="Payout certificate and deposit" onClose={()=>setSelected(null)} className="wheel-dialog"><button autoFocus onClick={()=>modal.current.close()} aria-label="Close certificate"><X size={20}/></button>{selected&&<><div className="wheel-proof-pair"><img className="wheel-pair-cert" src={selected.url} alt={`${selected.firm} payout ${selected.amount}`}/>{depositById[selected.id]?<img className="wheel-pair-deposit" src={depositById[selected.id]} alt="Matching USDC deposit"/>:<div className="wheel-pair-missing">Certificate only · matching deposit image unavailable</div>}</div><p>Maven · {selected.date}</p></>}</dialog>
  </div>;
}
