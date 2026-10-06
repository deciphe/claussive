import React, { useState } from "react";
import { ArrowUpRight, Mail, Sparkles } from "lucide-react";
import { track } from "../../lib/analytics";

const ENDPOINT = "https://formsubmit.co/ajax/gp@gigaprop.xyz";

export default function EmailCapture() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");

  const submit = async (event) => {
    event.preventDefault();
    if (!email || status === "loading") return;

    setStatus("loading");
    track("email_capture_submit", { source: "free_lesson_waitlist" });

    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          email,
          _subject: "gigaprop. — free lessons waitlist",
          source: "gigaprop.xyz",
          interest: "free lessons",
          _honey: "",
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success === false) throw new Error(data.message || "capture failed");

      setStatus("success");
      setEmail("");
      track("email_capture_success", { source: "free_lesson_waitlist" });
    } catch {
      setStatus("error");
    }
  };

  return (
    <section id="drops" className="relative overflow-hidden border-t border-white/[0.06] bg-[#050505] px-6 py-14 md:px-12 md:py-16">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle at 18% 50%, rgba(182,255,74,.07), transparent 28%), radial-gradient(circle at 82% 50%, rgba(155,135,245,.09), transparent 30%)" }} />

      <div className="relative mx-auto max-w-[1050px] overflow-hidden rounded-2xl border border-white/[0.075] bg-white/[0.018] p-5 md:p-7">
        <div className="grid items-center gap-6 md:grid-cols-[1fr_.9fr]">
          <div>
            <div className="inline-flex items-center gap-2 font-mono-lab text-[9px] font-semibold uppercase tracking-[0.22em] text-lucid">
              <Sparkles className="h-3.5 w-3.5" /> free lessons waitlist
            </div>
            <h2 className="mt-3 font-display text-4xl font-semibold leading-[.95] tracking-[-0.055em] text-spectral md:text-5xl">
              GET A TASTE OF<br /><span className="text-lucid">GIGAPROP.</span>
            </h2>
            <p className="mt-4 max-w-xl font-display text-base leading-6 text-white/52 md:text-lg">
              Free lessons and proprietary gigaprop knowledge built to open your eyes and make you see prop trading differently.
            </p>
            <div className="mt-3 font-mono-lab text-[8px] font-semibold uppercase tracking-[0.16em] text-violetglow">Only what actually matters.</div>
          </div>

          <div>
            <form onSubmit={submit} className="rounded-xl border border-white/[0.07] bg-black/25 p-2">
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3.5">
                  <Mail className="h-4 w-4 shrink-0 text-white/25" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (status !== "idle") setStatus("idle"); }}
                    placeholder="you@email.com"
                    aria-label="Email address"
                    className="min-w-0 flex-1 bg-transparent font-display text-base text-spectral outline-none placeholder:text-white/18"
                  />
                </label>
                <button type="submit" disabled={status === "loading"} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-lucid px-5 py-3.5 font-mono-lab text-[10px] font-semibold uppercase tracking-[0.14em] text-void transition-all hover:glow-lucid disabled:cursor-wait disabled:opacity-60">
                  {status === "loading" ? "Joining..." : "Join the waitlist"} <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>
            </form>

            <div className="mt-3 min-h-[16px] font-mono-lab text-[8px] uppercase tracking-[0.12em]">
              {status === "success" && <span className="text-lucid">You&apos;re in. Free lessons coming.</span>}
              {status === "error" && <span className="text-violetglow">Couldn&apos;t add you yet. Try again in a minute.</span>}
              {status === "idle" && <span className="text-white/22">Free lessons. No spam.</span>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
