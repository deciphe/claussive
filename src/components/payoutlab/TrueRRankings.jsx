import "./handbook.css";
import React, { useState, useRef, useEffect } from "react";
import { motion, useInView, animate } from "framer-motion";
import { ArrowUpRight, Copy, Check } from "lucide-react";
import { firms, unscoredFirms, certificates } from "./data";
import { firmProfiles } from "./firmProfiles";
import { track } from "../../lib/analytics";

function ScoreMeter({ value }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, { duration: 1.4, ease: [0.16, 1, 0.3, 1], onUpdate: setDisplay });
    return () => controls.stop();
  }, [inView, value]);
  return <div ref={ref} className="flex items-center gap-3"><div className="relative h-2 w-28 overflow-hidden rounded-full bg-prism"><motion.div initial={{ width: 0 }} animate={inView ? { width: `${(value / 10) * 100}%` } : {}} transition={{ duration: 1.4 }} className="absolute inset-y-0 left-0 rounded-full bg-lucid" /></div><span className="font-mono-lab text-sm font-semibold text-lucid tabular-nums">{display.toFixed(1)}</span></div>;
}

const reviewLens = {
  "Maven": "My deepest payout history and the firm I trust most from direct experience.",
  "Lucid Trading": "I care about the full path to cash: drawdown, payout rules, and how quickly the account becomes usable.",
  "FundedNext": "Low target and funded-stage simplicity matter more to me than the headline account size.",
  "Tradeify": "The Flex path removes the exact friction I care about most: DLLs, funded consistency, and payout buffers.",
  "Breakout": "The fee is the real risk. Static drawdown and on-demand payouts make the tight Turbo structure interesting to me.",
  "Topstep": "Proven payout history, but I have not chosen a single favorite plan for this page yet."
};

const mavenFirm = { rank: 1, name: "Maven", logoText: "M", trueR: 9.9, avgTime: "Proven over time" };
const rankedFirms = [mavenFirm, ...firms.filter(f => f.name !== "Maven").map((firm, index) => ({ ...firm, rank: index + 2 }))];
const watchlistFirms = [...unscoredFirms, { name: "MyFundedPerps", url: "https://myfundedperpetuals.com/" }];
const liveNames = new Set(["Maven", "FundedNext", "Propr", "Hypernova"]);
const liveRankedFirms = ["Maven", "FundedNext"].map((name, index) => {
  const firm = rankedFirms.find(f => f.name === name);
  return firm ? { ...firm, rank: index + 1 } : null;
}).filter(Boolean);
const livePartnerFirms = watchlistFirms.filter(f => liveNames.has(f.name));
const comingSoonFirms = [
  ...rankedFirms.filter(f => !liveNames.has(f.name)),
  ...watchlistFirms.filter(f => !liveNames.has(f.name)),
];

function BrandMark({ firm, compact = false }) {
  const profile = firmProfiles[firm.name] || {};
  const icon = profile.icon;
  return <div className="flex min-w-0 items-center gap-3">
    {icon ? <div className={`${compact ? "h-8 w-8" : "h-10 w-10"} flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/[0.04] p-1.5`}><img src={icon} alt="" className="h-full w-full object-contain" onError={e => { e.currentTarget.parentElement.style.display = "none"; }} /></div> : firm.logo ? <img src={firm.logo} alt="" className={`${compact ? "h-6 w-28" : "h-7 w-36"} shrink-0 object-contain object-left`} /> : null}
    <div className={`${compact ? "text-base" : "text-xl"} truncate font-display font-semibold text-spectral`}>{firm.name}</div>
  </div>;
}

function CodeStatus({ onCopy, copied }) {
  return <button onClick={onCopy} className="inline-flex items-center gap-1.5 font-mono-lab text-[9px] uppercase tracking-[0.2em] text-lucid transition-colors hover:text-white">{copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}CODE GIGA · {copied ? "COPIED" : "LIVE"}</button>;
}

function PickCard({ firm, copied, onCopy }) {
  const profile = firmProfiles[firm.name] || {};
  const pick = profile.pick;
  const isFundedNext = firm.name === "FundedNext";
  const isMaven = firm.name === "Maven";
  const outbound = () => track("firm_outbound_click", { firm: firm.name, plan: pick?.name || "none", market: profile.market });

  if (!pick) return null;

  return <div className={`rounded-xl border p-4 transition-colors ${isFundedNext ? "border-lucid/25 bg-lucid/[0.035]" : "border-white/[0.07] bg-white/[0.018] group-hover:border-white/[0.12]"}`}>
    <div className="flex items-start justify-between gap-3"><div><div className="font-mono-lab text-[9px] uppercase tracking-[0.22em] text-muted-foreground">MY PICK</div><div className="mt-1.5 font-display text-xl font-semibold tracking-tight text-spectral">{pick.name}</div></div>{isFundedNext ? <CodeStatus onCopy={onCopy} copied={copied} /> : isMaven ? <span className="rounded-full border border-lucid/20 bg-lucid/[0.05] px-2.5 py-1 font-mono-lab text-[9px] uppercase tracking-[0.18em] text-lucid">LIVE</span> : null}</div>
    <div className="mt-4 grid grid-cols-4 gap-2">{pick.stats.map(([label, value]) => <div key={label} className="min-w-0"><div className="font-mono-lab text-[8px] uppercase tracking-wider text-muted-foreground">{label}</div><div className="mt-1 truncate font-mono-lab text-[11px] text-spectral">{value}</div></div>)}</div>
    <p className="mt-4 font-mono-lab text-[10px] leading-relaxed text-muted-foreground">{pick.why}</p>
    <a onClick={outbound} href={profile.url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1 font-mono-lab text-[10px] uppercase tracking-widest text-lucid hover:text-white">View this plan <ArrowUpRight className="h-3 w-3" /></a>
  </div>;
}

function BonusPickCard({ firm, copied, onCopy }) {
  const profile = firmProfiles[firm.name] || {};
  const pick = profile.bonusPick;
  if (!pick) return null;
  return <div className="mt-3 rounded-xl border border-violetglow/25 bg-violetglow/[0.035] p-4">
    <div className="flex items-start justify-between gap-3"><div><div className="font-mono-lab text-[9px] font-semibold uppercase tracking-[0.22em] text-violetglow">{pick.label}</div><div className="mt-1.5 font-display text-xl font-semibold tracking-tight text-spectral">{pick.name}</div></div><CodeStatus onCopy={onCopy} copied={copied} /></div>
    <div className="mt-4 grid grid-cols-4 gap-2">{pick.stats.map(([label, value]) => <div key={label} className="min-w-0"><div className="font-mono-lab text-[8px] uppercase tracking-wider text-muted-foreground">{label}</div><div className="mt-1 truncate font-mono-lab text-[11px] text-spectral">{value}</div></div>)}</div>
    <p className="mt-4 font-mono-lab text-[10px] leading-relaxed text-muted-foreground">{pick.why}</p>
    <a onClick={() => track("firm_outbound_click", { firm: firm.name, plan: pick.name, market: "Futures", source: "bonus_pick" })} href={pick.url} target="_blank" rel="sponsored noopener noreferrer" className="mt-4 inline-flex items-center gap-1 font-mono-lab text-[10px] uppercase tracking-widest text-violetglow hover:text-white">Open my Futures link <ArrowUpRight className="h-3 w-3" /></a>
  </div>;
}

function FirmPlate({ firm }) {
  const profile = firmProfiles[firm.name] || {};
  const records = certificates.filter(c => c.firm === firm.name);
  const total = records.reduce((sum,c) => sum + c.amountNum,0);
  const largest = records.length ? Math.max(...records.map(c => c.amountNum)) : 0;
  const isMaven = firm.name === "Maven";
  const [copied, setCopied] = useState(false);
  const copyGiga = async () => {
    try { await navigator.clipboard.writeText("GIGA"); setCopied(true); track("code_copy", { firm: firm.name, code: "GIGA" }); setTimeout(() => setCopied(false), 1800); } catch { setCopied(false); }
  };

  return <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.5 }} className={`group relative grid grid-cols-1 gap-6 border-t border-border p-6 transition-colors hover:bg-prism/30 md:grid-cols-12 md:items-center md:gap-4 md:p-8 ${isMaven ? "bg-lucid/[0.025]" : ""}`}>
    <div className="md:col-span-1"><div className="font-display font-bold leading-none text-transparent" style={{fontSize:"clamp(2.5rem, 5vw, 4rem)",WebkitTextStroke:isMaven ? "1px rgba(255,255,255,0.9)" : "1px rgba(247,247,247,0.45)"}}>{String(firm.rank).padStart(2,"0")}</div></div>
    <div className="md:col-span-3"><BrandMark firm={firm} /><div className="mt-3 font-mono-lab text-[10px] uppercase tracking-wider text-muted-foreground">{profile.market} · {records.length} payouts · {firm.avgTime}</div>{isMaven && <div className="mt-2 font-mono-lab text-[9px] uppercase tracking-[0.2em] text-lucid">gigaprop #1</div>}</div>
    <div className="md:col-span-3"><div className="font-mono-lab text-[9px] uppercase tracking-[0.22em] text-muted-foreground">True R</div><div className="mt-2"><ScoreMeter value={firm.trueR} /></div><div className="mt-5"><div className="font-display text-3xl font-semibold tracking-[-0.045em] text-lucid md:text-4xl">${total.toLocaleString("en-US",{maximumFractionDigits:2})}</div><div className="mt-1 font-mono-lab text-[8px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Recorded payouts · largest ${largest.toLocaleString("en-US",{maximumFractionDigits:2})}</div></div><details className="firm-review"><summary>Details</summary><p>{reviewLens[firm.name]}</p><p>True R: {firm.trueR}/10 · {records.length} payout records.</p>{isMaven ? <a href={`${import.meta.env.BASE_URL}maven/`}>Maven proof ↗</a> : <a href="#vault">See payouts ↗</a>}</details></div>
    <div className="md:col-span-5"><PickCard firm={firm} copied={copied} onCopy={copyGiga} /><BonusPickCard firm={firm} copied={copied} onCopy={copyGiga} /></div>
  </motion.div>;
}

function LivePartnerCard({ firm }) {
  const profile = firmProfiles[firm.name] || {};
  return <div className="grid gap-5 border-t border-border px-6 py-6 transition-colors hover:bg-prism/30 md:grid-cols-12 md:items-center md:px-8">
    <div className="md:col-span-4"><BrandMark firm={firm} /><div className="mt-3 font-mono-lab text-[9px] font-semibold uppercase tracking-[0.18em] text-lucid">{profile.market} · REFERRAL LIVE</div></div>
    <div className="md:col-span-8"><PickCard firm={firm} /></div>
  </div>;
}

function ComingSoonRow({ firm }) {
  const profile = firmProfiles[firm.name] || {};
  const records = certificates.filter(c => c.firm === firm.name);
  return <div className="grid gap-4 border-t border-white/[0.05] px-6 py-5 opacity-55 md:grid-cols-12 md:items-center md:px-8">
    <div className="md:col-span-5"><BrandMark firm={firm} compact /></div>
    <div className="font-mono-lab text-[9px] uppercase tracking-[0.18em] text-muted-foreground md:col-span-4">{profile.market || "—"}{records.length ? ` · ${records.length} payouts on file` : ""}</div>
    <div className="md:col-span-3 md:text-right"><span className="font-mono-lab text-[9px] uppercase tracking-[0.22em] text-muted-foreground">COMING SOON</span></div>
  </div>;
}

export default function TrueRRankings() {
  return <section id="rankings" className="relative w-full bg-void py-24 md:py-32"><div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-lucid/40 to-transparent" /><div className="mx-auto max-w-[1500px] px-6 md:px-12">
    <h2 className="font-display text-4xl font-bold tracking-tight text-spectral md:text-6xl">True R.</h2>
    <p className="mt-2 font-mono-lab text-[10px] tracking-wide text-muted-foreground">What survives the trip to cash. <a href="?lesson=true-r" onClick={() => track("methodology_open", { source: "rankings" })} className="text-spectral transition-colors hover:text-lucid">How I score it ↗</a></p>

    <div className="mt-8 flex items-center justify-between gap-4"><div><div className="font-mono-lab text-[10px] uppercase tracking-[0.24em] text-lucid">LIVE NOW</div><div className="mt-1 font-display text-xl font-semibold text-spectral">The firms I can actually send you to.</div></div><div className="hidden rounded-full border border-lucid/15 bg-lucid/[0.04] px-3 py-1.5 font-mono-lab text-[9px] uppercase tracking-[0.18em] text-lucid sm:block">4 LIVE</div></div>

    <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-prism/20"><div className="hidden grid-cols-12 gap-4 border-b border-border px-8 py-4 font-mono-lab text-[10px] uppercase tracking-[0.25em] text-muted-foreground md:grid"><div className="col-span-1">Rank</div><div className="col-span-3">Firm</div><div className="col-span-3">True R</div><div className="col-span-5">My pick</div></div>{liveRankedFirms.map(f => <FirmPlate key={f.name} firm={f} />)}
      <div className="border-t border-border px-6 py-4 md:px-8"><div className="font-mono-lab text-[9px] uppercase tracking-[0.2em] text-muted-foreground">MY LIVE PERPS PICKS</div></div>{livePartnerFirms.map(f => <LivePartnerCard key={f.name} firm={f} />)}
    </div>

    <div className="mt-12 flex items-end justify-between gap-4"><div><div className="font-mono-lab text-[10px] uppercase tracking-[0.24em] text-muted-foreground">COMING SOON</div><div className="mt-1 font-display text-xl font-semibold text-spectral">Proof stays. Links wait.</div></div></div>
    <div className="mt-5 overflow-hidden rounded-2xl border border-white/[0.05] bg-white/[0.01]">{comingSoonFirms.map(f => <ComingSoonRow key={f.name} firm={f} />)}</div>

    <p className="mt-5 font-mono-lab text-[9px] leading-relaxed text-muted-foreground">FundedNext, Hypernova and Propr links are referral links. I may earn a commission if you use them. Rankings are not for sale.</p>
    <p className="mt-2 font-mono-lab text-[9px] leading-relaxed text-muted-foreground">Plan terms change. Stats are a compact current snapshot, not a substitute for the firm’s rules.</p>
  </div></section>;
}
