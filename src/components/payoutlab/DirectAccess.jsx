import React, { useState } from "react";
import { ArrowUpRight, Send, Zap, Eye, Gauge, MessageCircle, TicketCheck } from "lucide-react";
import { track } from "../../lib/analytics";

const ENDPOINT = "https://formsubmit.co/ajax/gp@gigaprop.xyz";

const lessons = [
  { icon: Zap, number: "01", title: "M1 METHOD", note: "my core lesson" },
  { icon: Eye, number: "02", title: "INTUITION", note: "speedlearn the read" },
  { icon: Gauge, number: "03", title: "CYCLIC PROP MANAGEMENT", note: "the hidden gem" },
];

export default function DirectAccess() {
  const [handle, setHandle] = useState("");
  const [discord, setDiscord] = useState("");
  const [stage, setStage] = useState("Never funded");
  const [focus, setFocus] = useState("");
  const [status, setStatus] = useState("idle");

  const submit = async (event) => {
    event.preventDefault();
    if (!handle || !discord || !focus || status === "loading") return;

    setStatus("loading");
    track("direct_access_apply", { stage, offer: "intuition_speedrun" });

    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          telegram: handle,
          discord,
          stage,
          why: focus,
          source: "gigaprop.xyz",
          application: "intuition speedrun / 1:1",
          _subject: `GIGAPROP APPLICATION — ${stage} — ${handle}`,
          _honey: "",
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success === false) throw new Error(data.message || "application failed");

      setStatus("success");
      setHandle("");
      setDiscord("");
      setStage("Never funded");
      setFocus("");
      track("direct_access_apply_success", { stage, offer: "intuition_speedrun" });
    } catch {
      setStatus("error");
    }
  };

  return (
    <section id="access" className="relative overflow-hidden border-t border-white/[0.06] bg-[#050505] px-6 py-16 md:px-12 md:py-20">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle at 45% 44%, rgba(155,135,245,.11), transparent 29%), radial-gradient(circle at 62% 58%, rgba(182,255,74,.055), transparent 24%)" }} />

      <div className="relative mx-auto max-w-[860px]">
        <div className="text-center">
          <div className="font-mono-lab text-[9px] font-semibold uppercase tracking-[0.24em] text-violetglow">1:1 training · by application</div>
          <h2 className="mt-3 font-display text-5xl font-semibold leading-[0.92] tracking-[-0.06em] text-spectral md:text-6xl">
            INTUITION<br /><span className="text-lucid">SPEEDRUN.</span>
          </h2>
          <div className="mt-5 font-mono-lab text-[9px] uppercase tracking-[0.2em] text-white/34">Start with the 3-part lesson pack.</div>
          <p className="mx-auto mt-4 max-w-2xl font-display text-base leading-6 text-white/48 md:text-lg">
            You don&apos;t need thousands of chart hours. I already did them—and condensed what matters into the few things you actually need to see, understand, and execute.
          </p>
          <div className="mt-3 font-mono-lab text-[8px] font-semibold uppercase tracking-[0.16em] text-lucid">Don&apos;t make it complicated.</div>
        </div>

        <div className="mt-7 grid gap-2 sm:grid-cols-3">
          {lessons.map(({ icon: Icon, number, title, note }) => (
            <div key={title} className="relative overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.018] px-4 py-4">
              <div className="flex items-center justify-between">
                <Icon className="h-4 w-4 text-lucid" />
                <span className="font-mono-lab text-[8px] tracking-[0.18em] text-white/20">{number}</span>
              </div>
              <div className="mt-5 font-display text-xl font-semibold tracking-[-0.035em] text-spectral">{title}</div>
              <div className="mt-1 font-mono-lab text-[8px] uppercase tracking-[0.14em] text-white/28">{note}</div>
            </div>
          ))}
        </div>

        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-xl border border-violetglow/15 bg-violetglow/[0.025] px-4 py-3">
            <MessageCircle className="h-4 w-4 text-violetglow" />
            <div><div className="font-display text-sm font-semibold text-spectral">Unlimited DM access</div><div className="font-mono-lab text-[8px] uppercase tracking-[0.12em] text-white/24">direct line</div></div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-lucid/15 bg-lucid/[0.025] px-4 py-3">
            <TicketCheck className="h-4 w-4 text-lucid" />
            <div><div className="font-display text-sm font-semibold text-spectral">First eval on me</div><div className="font-mono-lab text-[8px] uppercase tracking-[0.12em] text-white/24">after acceptance</div></div>
          </div>
        </div>

        <form onSubmit={submit} className="mt-4 rounded-2xl border border-white/[0.07] bg-white/[0.018] p-4 md:p-5">
          <div className="grid gap-3 md:grid-cols-3">
            <label className="block rounded-xl border border-white/[0.06] bg-black/25 px-4 py-3">
              <span className="font-mono-lab text-[8px] uppercase tracking-[0.15em] text-white/30">Telegram @</span>
              <input required value={handle} onChange={(e) => { setHandle(e.target.value); if (status !== "idle") setStatus("idle"); }} placeholder="@handle" className="mt-1.5 w-full bg-transparent font-display text-base text-spectral outline-none placeholder:text-white/18" />
            </label>

            <label className="block rounded-xl border border-white/[0.06] bg-black/25 px-4 py-3">
              <span className="font-mono-lab text-[8px] uppercase tracking-[0.15em] text-white/30">Discord username</span>
              <input required value={discord} onChange={(e) => { setDiscord(e.target.value.toLowerCase()); if (status !== "idle") setStatus("idle"); }} minLength={2} maxLength={32} pattern="[a-z0-9._]+" title="2–32 lowercase letters, numbers, periods or underscores" placeholder="username" autoCapitalize="none" autoCorrect="off" spellCheck="false" className="mt-1.5 w-full bg-transparent font-display text-base text-spectral outline-none placeholder:text-white/18" />
            </label>

            <label className="block rounded-xl border border-white/[0.06] bg-black/25 px-4 py-3">
              <span className="font-mono-lab text-[8px] uppercase tracking-[0.15em] text-white/30">Stage</span>
              <select value={stage} onChange={(e) => { setStage(e.target.value); if (status !== "idle") setStatus("idle"); }} className="mt-1.5 w-full bg-transparent font-display text-base text-spectral outline-none">
                <option className="bg-[#0a0a0a]">Never funded</option>
                <option className="bg-[#0a0a0a]">Passing evals, no payouts</option>
                <option className="bg-[#0a0a0a]">Already getting payouts</option>
              </select>
            </label>
          </div>

          <label className="mt-3 block rounded-xl border border-white/[0.06] bg-black/25 px-4 py-3">
            <span className="font-mono-lab text-[8px] uppercase tracking-[0.15em] text-lucid">Are you ready?</span>
            <textarea required value={focus} onChange={(e) => { setFocus(e.target.value); if (status !== "idle") setStatus("idle"); }} rows={3} placeholder="Tell me why." className="mt-1.5 w-full resize-none bg-transparent font-display text-base leading-6 text-spectral outline-none placeholder:text-white/20" />
          </label>

          <button type="submit" disabled={status === "loading"} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-lucid px-5 py-4 font-mono-lab text-[11px] font-semibold uppercase tracking-[0.14em] text-void transition-all hover:glow-lucid disabled:cursor-wait disabled:opacity-60">
            <Send className="h-4 w-4" /> {status === "loading" ? "Sending..." : "Apply for 1:1"} <ArrowUpRight className="h-4 w-4" />
          </button>

          <div className="mt-3 min-h-[16px] text-center font-mono-lab text-[8px] uppercase tracking-[0.13em]">
            {status === "success" && <span className="text-lucid">Application received. I&apos;ll contact accepted applicants directly.</span>}
            {status === "error" && <span className="text-violetglow">Couldn&apos;t send your application. Try again in a minute.</span>}
            {status === "idle" && <span className="text-white/22">Accepted applicants only.</span>}
          </div>
        </form>
      </div>
    </section>
  );
}
