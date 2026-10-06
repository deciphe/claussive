import Handbook from "./Handbook";
import WispMark from "./WispMark";
import React from "react";
import Wisp from "./Wisp";
import FrictionSketch from "./FrictionSketch";
import { ArrowLeft, ArrowUpRight, Check, Clock3 } from "lucide-react";
import "./true-r-guide.css";

export default function TrueRGuide() {
  return <main className="tr-guide">
    <header className="tr-nav"><a href="./#rankings"><ArrowLeft size={15} />Back to gigaprop</a><span><WispMark size={16} /> gigaprop.</span></header>
    <article>
      <div className="tr-intro"><Wisp className="wisp-intro" />
        <div className="tr-eyebrow">GIGAPROP / TRUE R</div>
        <h1>The trade is only<br /> <span>half the equation.</span></h1>
        <p>A winning trade starts the story. True R asks what you actually keep after execution, fees, rules, and the wait to get paid.</p>
        <div className="tr-intro-foot"><span>01 / WHAT YOU KEEP</span><span>02 / WHAT IT COSTS</span><span>03 / HOW LONG IT TAKES</span><a href="#handbook">THE HANDBOOK ↗</a></div>
      </div>

      <section className="tr-section tr-journey">
        <div><div className="tr-eyebrow">01 / FOLLOW THE MONEY</div><h2>On the chart.<br />In your wallet.</h2><p>They are different numbers. Follow the return through every layer before you call it yours.</p></div>
        <div className="tr-flow" role="img" aria-label="Four stages: advertised R, execution R, payout R, and True R. Each stage accounts for additional friction. Bar widths are conceptual, not measured losses.">
          {[["01","ADVERTISED R","The setup before costs.","100%"],["02","EXECUTION R","After spread, slippage, and commissions.","85%"],["03","PAYOUT R","After the split and withdrawal conditions.","69%"],["04","TRUE R","Cash received, net of account costs.","56%"]].map(([n,title,note,width],i) => <div key={n} className={i === 3 ? "tr-flow-row final" : "tr-flow-row"}><span className="tr-number">{n}</span><div><div className="tr-flow-label"><strong>{title}</strong><small>{note}</small></div><div className="tr-track"><div style={{width}} /></div></div></div>)}
          <div className="tr-caption">Conceptual stages · bar widths are illustrative</div>
        </div>
      </section>

      <div className="tr-equation"><span>THE CASH CHECK</span><p>Cash received <b>−</b> challenge, activation & reset costs <b>=</b> <strong>What you kept</strong></p><small>Use one complete account journey. Include failed attempts. Don’t subtract trading costs or the profit split again if the payout already reflects them.</small></div>

      <section className="tr-section">
        <div className="tr-section-head"><div><div className="tr-eyebrow">02 / THE CHEAP ACCOUNT TRAP</div><h2>Price is visible.<br />Friction is expensive.</h2></div><p>The entry fee is only the first cost. Minimum days, withdrawal caps, resets, and approval delays can change the economics of an otherwise good trade.</p></div>
        <FrictionSketch />
        <div className="tr-compare"><div className="tr-compare-title"><span className="tr-eyebrow">THE BREAKOUT PARADOX / THE PRINCIPLE</span><h3>A higher fee can still<br />be the better deal.</h3><p>When less waiting and fewer barriers outweigh the extra cost. Test the full journey, not the discount.</p></div><div className="tr-comparison"><div className="tr-table-row tr-table-head"><span>ILLUSTRATIVE</span><span>LOWER FEE</span><span>LESS FRICTION</span></div>{[["Entry price","Lower","Higher"],["Qualification","More gates","Fewer gates"],["Withdrawal","More restrictions","Fewer restrictions"],["Time to cash","Longer","Shorter"]].map(row => <div className="tr-table-row" key={row[0]}>{row.map((v,i) => <span key={v} className={i===2 ? "tr-accent" : ""}>{v}</span>)}</div>)}</div></div>
        <p className="tr-caption">A comparison framework, not current firm terms. Lower friction does not guarantee profits or a payout.</p>
      </section>

      <section className="tr-section tr-velocity"><div><div className="tr-eyebrow">03 / TRUE R VELOCITY</div><h2>The same payout.<br /><span className="tr-accent">A different wait.</span></h2><p>Track time from account purchase to cash received—not just the time after a withdrawal request. Qualification, onboarding, and payout processing all count.</p></div><div className="tr-timeline"><div className="tr-timeline-top"><Clock3 size={16} /><span>SAME NET CASH / ILLUSTRATIVE TIMELINES</span></div><div className="tr-lane"><span>Route A</span><div className="tr-line slow"><i /><i /><i /><i /><i /><i /><i /><i /></div><b>28 days</b></div><div className="tr-lane"><span>Route B</span><div className="tr-line fast"><i /><i /></div><b>7 days</b></div><div className="tr-timeline-result"><strong>21 days</strong><span>less time waiting for the same cash</span></div><p>Earlier access gives you more choice. It does not imply you can repeat the payout or multiply your returns.</p></div></section>

      <Handbook />
      <section className="tr-verdict"><div><div className="tr-eyebrow">BEFORE YOU BUY</div><h2>Would I buy it again?</h2><Wisp className="wisp-finish" note="Follow the money all the way home." /><p>Judge the full journey. Then look for receipts.</p></div><div>{["What did I spend across every attempt?","What can I actually withdraw—and when?","Do the rules fit how I trade?","What reached my wallet, and how long did it take?"].map(t => <p key={t}><Check size={15} />{t}</p>)}</div></section>
      <footer className="tr-end"><p>True R is gigaprop’s evaluation framework.<br /><span>A score is a judgment; the payout is evidence.</span></p><a href="./#rankings">See the True R index <ArrowUpRight size={17} /></a></footer>
    </article>
  </main>;
}
