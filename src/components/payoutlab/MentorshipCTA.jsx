import React, { useState } from "react";
import { motion } from "framer-motion";
import { UserRound, ArrowUpRight, Copy, Check } from "lucide-react";

const CONTACT = "gp@gigaprop.xyz";

export default function MentorshipCTA() {
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      window.location.href = `mailto:${CONTACT}`;
    }
  };

  return (
    <section id="mentorship" className="relative w-full overflow-hidden bg-void py-24 md:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-lucid/10 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1500px] px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="refractive-border rounded-2xl p-8 text-center md:p-14"
        >
          <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-lucid/40 bg-lucid/10">
            <UserRound className="h-5 w-5 text-lucid" />
          </div>
          <div className="font-mono-lab text-xs uppercase tracking-[0.3em] text-lucid">05 / 1:1 Mentorship</div>
          <h2 className="mx-auto mt-4 max-w-2xl font-display text-3xl font-bold tracking-tight text-spectral md:text-5xl">
            Want me in your corner?
          </h2>
          <p className="mx-auto mt-5 max-w-lg font-mono-lab text-sm leading-relaxed text-muted-foreground">
            Limited 1:1 mentorship for traders chasing their first real payout. No courses, no fluff — just the playbook behind the proof.
          </p>

          <div className="mx-auto mt-9 flex max-w-md flex-col gap-3 sm:flex-row">
            <a
              href={`mailto:${CONTACT}?subject=${encodeURIComponent("gigaprop — 1:1 Mentorship")}`}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-lucid px-7 py-4 font-mono-lab text-sm font-semibold uppercase tracking-wider text-void transition-all hover:glow-lucid"
            >
              Request 1:1 Mentorship <ArrowUpRight className="h-4 w-4" />
            </a>
            <button
              type="button"
              onClick={copyEmail}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-5 py-4 font-mono-lab text-xs uppercase tracking-wider text-spectral transition-colors hover:border-lucid/60 hover:text-lucid"
            >
              {copied ? <Check className="h-4 w-4 text-lucid" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Email"}
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
