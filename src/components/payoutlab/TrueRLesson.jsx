import React from "react";
import Wisp from "./Wisp";
import { unscoredFirms } from "./data";
import { motion } from "framer-motion";
import { Gauge, Zap, Clock, Receipt, TrendingUp, Sparkles } from "lucide-react";

const factors = [
  { icon: Zap, label: "Payout Speed", weight: 95, note: "The heaviest weight. Slow rails kill your edge faster than bad trades.", tone: "lucid" },
  { icon: Gauge, label: "Passing Speed", weight: 85, note: "Instant evals mean you're trading real money sooner.", tone: "lucid" },
  { icon: Clock, label: "Onboarding Speed", weight: 70, note: "Friction here costs you days of screen time you never get back.", tone: "spectral" },
  { icon: TrendingUp, label: "Execution Costs", weight: 55, note: "Slippage and spread eat into every winner silently.", tone: "spectral" },
  { icon: Receipt, label: "Trading Fees", weight: 45, note: "Real, but often outweighed by speed when the math is honest.", tone: "muted" },
];

export default function TrueRLesson() {
  return (
    <section id="lesson" className="relative w-full bg-void py-24 md:py-32">
      <div className="mx-auto max-w-[1500px] px-6 md:px-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="font-mono-lab text-xs uppercase tracking-[0.3em] text-lucid">03 / The True R Lesson</div>
            <h2 className="mt-3 max-w-2xl font-display text-4xl font-bold tracking-tight text-spectral md:text-6xl">
              Performance isn't the whole equation.
            </h2>
          </div>
          <p className="max-w-sm font-mono-lab text-sm leading-relaxed text-muted-foreground">
            True R is my honest score. It weighs what actually moves your
            account — and some factors outweigh others by a lot.
          </p>
        </div>

        <div className="wisp-lesson-link"><Wisp className="wisp-home" /><a href="?lesson=true-r" className="mt-6 inline-flex items-center gap-3 rounded-lg border border-lucid/30 bg-lucid/5 px-5 py-3 font-mono-lab text-xs text-lucid transition-colors hover:bg-lucid/10">Read the True R lesson <span aria-hidden="true">↗</span></a>

        </div>

        {/* the equation */}
        <div className="mt-12 overflow-x-auto no-scrollbar">
          <div className="flex w-max items-center gap-3 rounded-lg border border-border bg-prism/40 px-5 py-4 font-mono-lab text-xs uppercase tracking-wider md:text-sm">
            <span className="text-muted-foreground">True R =</span>
            <span className="rounded bg-lucid/15 px-2 py-1 text-lucid">Performance</span>
            <span className="text-lucid">+</span>
            <span className="rounded bg-lucid/15 px-2 py-1 text-lucid">Payout Speed</span>
            <span className="text-lucid">+</span>
            <span className="rounded bg-lucid/15 px-2 py-1 text-lucid">Passing Speed</span>
            <span className="text-lucid">+</span>
            <span className="rounded bg-prism px-2 py-1 text-spectral">Onboarding</span>
            <span className="text-muted-foreground">−</span>
            <span className="rounded bg-prism px-2 py-1 text-muted-foreground">Fees</span>
            <span className="text-muted-foreground">−</span>
            <span className="rounded bg-prism px-2 py-1 text-muted-foreground">Execution</span>
          </div>
        </div>

        {/* factor cards */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {factors.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="rounded-lg border border-border bg-prism/30 p-5"
              >
                <Icon className={`h-5 w-5 ${f.tone === "lucid" ? "text-lucid" : f.tone === "spectral" ? "text-spectral" : "text-muted-foreground"}`} />
                <div className="mt-4 font-mono-lab text-[10px] uppercase tracking-widest text-muted-foreground">Weight</div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-prism">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${f.weight}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.1 }}
                      className={`h-full rounded-full ${f.tone === "lucid" ? "bg-lucid" : "bg-spectral/60"}`}
                    />
                  </div>
                  <span className={`font-mono-lab text-xs font-semibold ${f.tone === "lucid" ? "text-lucid" : "text-spectral"}`}>{f.weight}</span>
                </div>
                <div className="mt-4 font-display text-lg font-semibold text-spectral">{f.label}</div>
                <p className="mt-2 font-mono-lab text-xs leading-relaxed text-muted-foreground">{f.note}</p>
              </motion.div>
            );
          })}
        </div>

        {/* the Breakout paradox callout */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mt-8 grid grid-cols-1 gap-0 overflow-hidden rounded-2xl border border-lucid/30 bg-lucid/5 md:grid-cols-12"
        >
          <div className="flex items-start gap-3 p-7 md:col-span-4 md:p-9">
            <Sparkles className="mt-1 h-5 w-5 shrink-0 text-lucid" />
            <div>
              <div className="font-mono-lab text-[10px] uppercase tracking-[0.25em] text-lucid">Case Study</div>
              <h3 className="mt-2 font-display text-2xl font-bold text-spectral">The Breakout Paradox</h3>
              <p className="mt-3 font-mono-lab text-xs leading-relaxed text-muted-foreground">
                High fees on paper. But instant onboarding, instant passing,
                instant payouts — and that speed stack outweighs the cost.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-px bg-border md:col-span-8 md:grid-cols-4">
            {[
              { k: "Trading Fees", v: "High", neg: true },
              { k: "Onboarding", v: "Instant", neg: false },
              { k: "Passing", v: "Instant", neg: false },
              { k: "Payouts", v: "Instant", neg: false },
            ].map((x) => (
              <div key={x.k} className="bg-void p-6">
                <div className="font-mono-lab text-[10px] uppercase tracking-widest text-muted-foreground">{x.k}</div>
                <div className={`mt-2 font-display text-xl font-bold ${x.neg ? "text-muted-foreground line-through" : "text-lucid"}`}>{x.v}</div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-border bg-void p-6 md:col-span-12">
            <span className="font-mono-lab text-xs uppercase tracking-widest text-muted-foreground">Net result</span>
            <div className="flex items-center gap-3">
              <span className="font-mono-lab text-sm text-muted-foreground">True R</span>
              <span className="font-display text-3xl font-bold text-lucid">8.4</span>
            </div>
          </div>
        </motion.div>
        <div className="mt-5 border-t border-border pt-5">
          <div className="mb-4 font-mono-lab text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Web3 watch / the next payout test</div>
          <div className="grid gap-5 sm:grid-cols-2">
            {unscoredFirms.map(f => <a key={f.name} href={f.url} target="_blank" rel="sponsored noopener noreferrer" className="group flex items-start gap-5 rounded-lg border border-border bg-prism/10 p-5 transition-colors hover:border-lucid/30">
              <img src={f.logo} alt={f.name} className="mt-1 h-5 w-24 shrink-0 object-contain object-left" />
              <div><p className="font-display text-sm text-spectral">{f.name === "Hypernova" ? "Fast rails. A lower-fee possibility." : "Fewer gates. Onchain payouts."}</p>
              <p className="mt-2 font-mono-lab text-[10px] leading-relaxed text-muted-foreground">{f.name === "Hypernova" ? "My next True R test: can low fees and fast access deliver together? First personal payout still to come. Access currently invite-only." : "No minimum trading days advertised; qualification and verification still apply. Personal payout review to come."}</p>
              <span className="mt-3 block font-mono-lab text-[9px] uppercase tracking-wider text-lucid">Explore {f.name} ↗ · Unscored</span></div>
            </a>)}
          </div>
        </div>
      </div>
    </section>
  );
}
