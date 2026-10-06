import React from "react";
import { ArrowUpRight, Star } from "lucide-react";
import { track } from "../../lib/analytics";

const ACCOUNT = 25000;
const MARGIN = 0.97;
const LEVERAGE = 5;
const NOTIONAL = ACCOUNT * MARGIN * LEVERAGE;
const MOVE_RISK = ACCOUNT * 0.02;

const firms = [
  {
    name: "Hypernova",
    plan: "Low Risk",
    rules: "10 / 6 / 3",
    price: "$275–280",
    maker: 0,
    taker: 0.005,
    exact: true,
    gold: true,
    url: "https://hn.xyz/r/4sjg1b",
  },
  {
    name: "Vanta",
    plan: "Tier II",
    rules: "10 / 5 / 5",
    price: "$169",
    maker: 0,
    taker: 0,
    exact: false,
    url: "https://www.vantatrading.io/",
  },
  {
    name: "Propr",
    plan: "Classic 1-Step",
    rules: "10 / 6 / 3",
    price: "$275",
    maker: 0.003,
    taker: 0.009,
    exact: true,
    url: "https://app.propr.xyz/r/7gJmpEjv",
  },
  {
    name: "Doji",
    plan: "1-Step",
    rules: "10 / 6 / 3",
    price: "$198",
    maker: 0.007,
    taker: 0.007,
    exact: true,
    url: "https://www.dojifunded.com/",
  },
  {
    name: "Vest",
    plan: "10% Eval",
    rules: "10 / 6 / 3",
    price: "$198",
    maker: 0.0025,
    taker: 0.0025,
    exact: true,
    url: "https://next.vestmarkets.com/r/isgigaprop",
    offer: "5% off with this link",
  },
  {
    name: "HyperPNL",
    plan: "Flex",
    rules: "10 / 5 / 3",
    price: "$215",
    maker: 0.015,
    taker: 0.03,
    exact: false,
    url: "https://hyperpnl.com/",
  },
  {
    name: "Breakout",
    plan: "Classic",
    rules: "10 / 6 / 3",
    price: "$85",
    maker: 0.04,
    taker: 0.04,
    exact: true,
    url: "https://www.breakoutprop.com/pricing/",
  },
];

function roundTrip(rate) {
  return NOTIONAL * 2 * (rate / 100);
}

function trueRisk(rate) {
  return ((MOVE_RISK + roundTrip(rate)) / ACCOUNT) * 100;
}

function money(value) {
  if (value < 0.005) return "$0";
  return `$${value.toFixed(value >= 100 ? 0 : 2)}`;
}

function FirmCard({ firm }) {
  const limitFee = roundTrip(firm.maker);
  const marketFee = roundTrip(firm.taker);
  const outbound = () => track("firm_outbound_click", { firm: firm.name, plan: firm.plan, market: "Perps", source: "web3_25k" });

  return (
    <a
      href={firm.url}
      target="_blank"
      rel={firm.name === "Hypernova" || firm.name === "Propr" || firm.name === "Vest" ? "sponsored noopener noreferrer" : "noopener noreferrer"}
      onClick={outbound}
      className={`group relative block overflow-hidden rounded-2xl border p-5 transition-colors ${firm.gold ? "border-lucid/30 bg-lucid/[0.04] md:col-span-2" : "border-white/[0.065] bg-white/[0.015] hover:border-white/[0.12]"}`}
    >
      {firm.gold && <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(182,255,74,.10),transparent_36%)]" />}
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="font-display text-xl font-semibold tracking-[-0.035em] text-spectral">{firm.name}</div>
              {firm.gold && <span className="inline-flex items-center gap-1 rounded-full border border-lucid/25 bg-lucid/[0.07] px-2 py-1 font-mono-lab text-[7px] font-semibold uppercase tracking-[0.13em] text-lucid"><Star className="h-2.5 w-2.5" /> Gold standard</span>}
            </div>
            <div className="mt-1 font-mono-lab text-[8px] uppercase tracking-[0.13em] text-white/28">{firm.plan}</div>
            {firm.offer && <div className="mt-1 font-mono-lab text-[10px] font-semibold text-lucid">{firm.offer}</div>}
          </div>
          <ArrowUpRight className="mt-1 h-4 w-4 text-white/18 transition-colors group-hover:text-lucid" />
        </div>

        <div className="mt-5 flex items-end justify-between gap-4">
          <div>
            <div className="font-mono-lab text-[7px] uppercase tracking-[0.14em] text-white/24">25K price</div>
            <div className="mt-1 font-display text-3xl font-semibold tracking-[-0.05em] text-spectral">{firm.price}</div>
          </div>
          <div className="text-right">
            <div className="font-mono-lab text-[7px] uppercase tracking-[0.14em] text-white/24">{firm.exact ? "My choice" : "Closest"}</div>
            <div className={`mt-1 font-display text-2xl font-semibold tracking-[-0.04em] ${firm.exact ? "text-lucid" : "text-white/70"}`}>{firm.rules}</div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <FeeBox label="Limit" fee={limitFee} risk={trueRisk(firm.maker)} />
          <FeeBox label="Market" fee={marketFee} risk={trueRisk(firm.taker)} />
        </div>
      </div>
    </a>
  );
}

function FeeBox({ label, fee, risk }) {
  return (
    <div className="rounded-xl border border-white/[0.055] bg-black/20 px-3.5 py-3">
      <div className="font-mono-lab text-[7px] uppercase tracking-[0.14em] text-white/25">{label}</div>
      <div className="mt-1.5 flex items-baseline justify-between gap-2">
        <div className="font-display text-lg font-semibold text-spectral">+{money(fee)}</div>
        <div className="font-mono-lab text-[9px] font-semibold text-white/42">{risk.toFixed(2)}%</div>
      </div>
    </div>
  );
}

export default function ProprPick() {
  return (
    <section className="relative bg-void py-16 md:py-20">
      <div className="mx-auto max-w-[1180px] px-6 md:px-12">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="font-mono-lab text-[9px] font-semibold uppercase tracking-[0.2em] text-violetglow">WEB3 · 25K</div>
            <h2 className="mt-2 font-display text-4xl font-semibold tracking-[-0.055em] text-spectral md:text-5xl">Fees become risk.</h2>
          </div>
          <div className="font-mono-lab text-[8px] uppercase leading-5 tracking-[0.12em] text-white/26 sm:text-right">indices benchmark<br />97% margin · 5×</div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2">
          <SetupBox label="Position" value="$121,250" />
          <SetupBox label="2% move" value="$500" />
          <SetupBox label="Rule" value="move + fees" />
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {firms.map(firm => <FirmCard key={firm.name} firm={firm} />)}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 font-mono-lab text-[7px] uppercase tracking-[0.11em] text-white/18">
          <span>Limit = maker · Market = taker · round trip</span>
          <span>Fee schedule · 15 Sep 2026 · prices checked 16 Sep</span>
        </div>
        <p className="mt-2 font-mono-lab text-[10px] text-white/45">Vest, Hypernova and Propr links are referrals. I may earn a commission.</p>
      </div>
    </section>
  );
}

function SetupBox({ label, value }) {
  return <div className="rounded-xl border border-white/[0.06] bg-white/[0.012] px-3 py-3 md:px-4"><div className="font-mono-lab text-[7px] uppercase tracking-[0.14em] text-white/22">{label}</div><div className="mt-1 font-display text-base font-semibold tracking-[-0.025em] text-spectral md:text-xl">{value}</div></div>;
}
