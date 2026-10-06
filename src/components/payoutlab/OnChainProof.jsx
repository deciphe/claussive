import React, { useMemo, useState } from "react";
import { ArrowUpRight, Check, ChevronRight, Copy, ExternalLink } from "lucide-react";
import { certificates } from "./data";
import onchainMatches from "./onchainMatches.json";
import { track } from "../../lib/analytics";

const mavenIds = ["maven-011", "maven-002", "maven-017", "maven-013", "maven-014"];
const lucidIds = ["lucid-trading-004", "lucid-trading-001", "lucid-trading-002", "lucid-trading-005", "lucid-trading-003"];
const proofIds = [...mavenIds, ...lucidIds];

const money = (value, decimals = 2) => Number(value || 0).toLocaleString("en-US", {
  minimumFractionDigits: decimals,
  maximumFractionDigits: decimals,
});
const shortHash = hash => `${hash.slice(0, 8)}…${hash.slice(-6)}`;

function buildRows() {
  const byId = Object.fromEntries(certificates.map(cert => [cert.id, cert]));
  return proofIds.map((id, index) => {
    const cert = byId[id];
    const match = onchainMatches[id];
    return {
      ...cert,
      rank: index + 1,
      txHash: match?.txHash || "",
      txUrl: match?.txUrl || "",
      receivedAmount: match?.receivedAmount ?? null,
      matchedAt: match?.timestamp || "",
      verified: Boolean(match?.txHash),
    };
  });
}

function RailRow({ row, active, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(row)}
      className={`group grid w-full grid-cols-[34px_84px_1fr_auto] items-center gap-3 border-b border-white/[0.055] px-4 py-[15px] text-left transition-all md:grid-cols-[40px_100px_1fr_155px_108px] md:px-5 ${active ? "bg-[linear-gradient(90deg,rgba(139,92,246,.92),rgba(139,92,246,.44),rgba(255,255,255,.02))] shadow-[inset_2px_0_0_rgba(205,176,255,.95)]" : "bg-white/[0.008] hover:bg-white/[0.032]"}`}
    >
      <span className="font-display text-xs text-white/32">{String(row.rank).padStart(2, "0")}</span>
      <div>
        <div className="font-display text-xs font-semibold uppercase tracking-[0.08em] text-spectral">{row.firm === "Lucid Trading" ? "Lucid" : "Maven"}</div>
        <div className="mt-1 font-display text-[10px] text-white/28">{row.date}</div>
      </div>
      <div className={`font-display text-base font-semibold tracking-tight md:text-lg ${active ? "text-white" : "text-lucid"}`}>
        +{money(row.receivedAmount)} <span className="text-[0.58em] font-medium text-white/35">USDC</span>
      </div>
      <span className="hidden truncate font-display text-[11px] text-white/36 md:block">{row.txHash ? shortHash(row.txHash) : "—"}</span>
      <div className="flex items-center justify-end gap-2">
        <span className="hidden items-center gap-1.5 rounded-full border border-lucid/20 bg-lucid/[0.045] px-2.5 py-1 font-display text-[9px] font-semibold uppercase tracking-[0.11em] text-lucid sm:inline-flex"><span className="h-1.5 w-1.5 rounded-full bg-lucid shadow-[0_0_12px_rgba(182,255,74,.7)]" />verified</span>
        <ChevronRight className="h-3.5 w-3.5 text-white/20 transition-transform group-hover:translate-x-0.5 group-hover:text-white/60" />
      </div>
    </button>
  );
}

function ProofCard({ row, total }) {
  const copyHash = async () => {
    try { await navigator.clipboard.writeText(row.txHash); } catch {}
    track("onchain_hash_copy", { firm: row.firm, id: row.id });
  };
  const openTx = () => track("onchain_tx_open", { firm: row.firm, id: row.id, tx: row.txHash });

  return (
    <div className="relative h-full overflow-hidden rounded-2xl border border-white/[0.075] bg-[#080808] p-6 md:p-8">
      <div aria-hidden="true" className="absolute inset-0" style={{ background: "radial-gradient(circle at 94% 0%, rgba(139,92,246,.16), transparent 34%), radial-gradient(circle at 0% 100%, rgba(182,255,74,.045), transparent 30%)" }} />
      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between gap-5">
          <div>
            <div className="font-display text-[11px] font-medium text-violetglow">{String(row.rank).padStart(2, "0")} / {String(total).padStart(2, "0")}</div>
            <div className="mt-6 font-display text-2xl font-semibold tracking-[-0.04em] text-spectral">{row.firm === "Lucid Trading" ? "Lucid" : "Maven"}</div>
            <div className="mt-1 font-display text-xs text-white/35">{row.date}</div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-lucid/20 bg-lucid/[0.045] px-3 py-1.5 font-display text-[9px] font-semibold uppercase tracking-[0.11em] text-lucid"><Check className="h-3 w-3" />verified on-chain</div>
        </div>

        <div className="mt-12 font-display text-5xl font-semibold leading-none tracking-[-0.07em] text-spectral md:text-6xl">
          +{money(row.receivedAmount)}<span className="ml-2 text-[0.25em] font-medium tracking-normal text-white/34">USDC</span>
        </div>

        <div className="mt-12">
          <div className="font-display text-[9px] font-semibold uppercase tracking-[0.16em] text-white/28">Transaction hash</div>
          <div className="mt-3 overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.018]">
            <a href={row.txUrl} target="_blank" rel="noreferrer" onClick={openTx} className="group flex items-center gap-3 px-4 py-4 transition-colors hover:bg-violetglow/[0.055]">
              <span className="min-w-0 flex-1 break-all font-display text-[11px] leading-relaxed text-white/68">{row.txHash}</span>
              <ExternalLink className="h-4 w-4 shrink-0 text-white/25 transition-colors group-hover:text-violetglow" />
            </a>
            <div className="flex items-center justify-between border-t border-white/[0.055] px-4 py-2.5">
              <a href={row.txUrl} target="_blank" rel="noreferrer" onClick={openTx} className="font-display text-[9px] font-semibold uppercase tracking-[0.12em] text-violetglow/80 transition-colors hover:text-violetglow">Etherscan ↗</a>
              <button onClick={copyHash} className="inline-flex items-center gap-1.5 font-display text-[9px] font-semibold uppercase tracking-[0.12em] text-white/38 transition-colors hover:text-white"><Copy className="h-3 w-3" />Copy</button>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/[0.065] bg-white/[0.014] p-4"><div className="font-display text-[9px] font-semibold uppercase tracking-[0.13em] text-white/25">Payout</div><div className="mt-2 font-display text-xl font-semibold tracking-tight text-spectral">{row.amount}</div></div>
          <div className="rounded-xl border border-white/[0.065] bg-white/[0.014] p-4"><div className="font-display text-[9px] font-semibold uppercase tracking-[0.13em] text-white/25">Received</div><div className="mt-2 font-display text-xl font-semibold tracking-tight text-spectral">{money(row.receivedAmount)} <span className="text-[.55em] text-white/35">USDC</span></div></div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-lucid/15 bg-lucid/[0.022] px-4 py-4">
          <div className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-lucid shadow-[0_0_16px_rgba(182,255,74,.65)]" /><span className="font-display text-[10px] font-medium uppercase tracking-[0.11em] text-white/45">incoming transfer matched</span></div>
          <a href={row.txUrl} target="_blank" rel="noreferrer" onClick={openTx} aria-label="Open transaction on Etherscan" className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.08] text-white/35 transition-colors hover:border-violetglow/40 hover:text-violetglow"><ArrowUpRight className="h-3.5 w-3.5" /></a>
        </div>
      </div>
    </div>
  );
}

export default function OnChainProof() {
  const rows = useMemo(buildRows, []);
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(rows[0]);
  const visibleRows = filter === "All" ? rows : rows.filter(row => row.firm === filter);

  const choose = row => { setSelected(row); track("proof_rail_select", { firm: row.firm, id: row.id }); };
  const switchFilter = next => {
    setFilter(next);
    const nextRows = next === "All" ? rows : rows.filter(row => row.firm === next);
    if (nextRows.length) setSelected(nextRows[0]);
    track("proof_rail_filter", { firm: next });
  };

  return (
    <section id="onchain" className="relative overflow-hidden border-y border-white/[0.055] bg-[#050505] py-24 md:py-32">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle at 18% 22%, rgba(139,92,246,.12), transparent 28%), radial-gradient(circle at 82% 68%, rgba(182,255,74,.04), transparent 28%)" }} />
      <div className="relative mx-auto max-w-[1500px] px-6 md:px-12">
        <div className="grid gap-10 border-b border-white/[0.055] pb-12 lg:grid-cols-[1.35fr_.65fr] lg:items-end">
          <div>
            <div className="font-display text-[10px] font-semibold uppercase tracking-[0.18em] text-violetglow">USDC settlements</div>
            <h2 className="mt-5 font-display text-5xl font-semibold leading-[0.92] tracking-[-0.06em] text-spectral md:text-7xl">Verified on-chain.</h2>
            <div className="mt-4 font-display text-lg text-white/42 md:text-2xl">Real payouts. Real settlement.</div>
          </div>
          <div className="lg:text-right"><div className="font-display text-[10px] font-medium uppercase leading-6 tracking-[0.13em] text-white/28">5 Maven<br />5 Lucid<br />10 verified</div><div className="mt-5 h-px w-14 bg-violetglow/70 lg:ml-auto" /></div>
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">{[["All","All"],["Maven","Maven"],["Lucid Trading","Lucid"]].map(([value,label]) => <button key={value} onClick={() => switchFilter(value)} className={`rounded-lg border px-5 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors ${filter === value ? "border-violetglow/70 bg-violetglow text-white shadow-[0_0_28px_rgba(139,92,246,.18)]" : "border-white/[0.075] bg-white/[0.012] text-white/38 hover:text-white/72"}`}>{label}</button>)}</div>
          <div className="flex items-center gap-2 font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-white/30"><span className="h-1.5 w-1.5 rounded-full bg-lucid shadow-[0_0_14px_rgba(182,255,74,.7)]" /><span className="text-lucid">10 verified</span><span>/</span><span>10 shown</span></div>
        </div>

        <div className="mt-6 grid overflow-hidden rounded-2xl border border-white/[0.07] bg-[#080808]/92 shadow-2xl shadow-black/30 lg:grid-cols-[1.1fr_.9fr]">
          <div className="border-b border-white/[0.07] lg:border-b-0 lg:border-r">
            <div className="grid grid-cols-[34px_84px_1fr_auto] gap-3 border-b border-white/[0.055] px-4 py-3 font-display text-[8px] font-semibold uppercase tracking-[0.14em] text-white/22 md:grid-cols-[40px_100px_1fr_155px_108px] md:px-5"><span>#</span><span>Firm</span><span>Received</span><span className="hidden md:block">Transaction</span><span className="text-right">Status</span></div>
            <div>{visibleRows.map(row => <RailRow key={row.id} row={row} active={selected?.id === row.id} onSelect={choose} />)}</div>
          </div>
          <div className="min-h-[560px] p-4 md:p-6">{selected && <ProofCard row={selected} total={rows.length} />}</div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 font-display text-[9px] uppercase tracking-[0.13em] text-white/24"><span>gigaprop.xyz</span><span>real payouts · real proof</span></div>
      </div>
    </section>
  );
}
