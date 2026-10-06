import React from "react";
import { ArrowUpRight, BadgeCheck } from "lucide-react";

const TWEET_URL = "https://x.com/traderjon/status/1887921772009255296";

export default function FounderProof() {
  return (
    <section className="border-y border-white/[0.05] bg-[#050505] py-5">
      <div className="mx-auto flex max-w-[780px] items-center justify-between gap-5 px-6 md:px-10">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-violetglow/20 bg-violetglow/[0.05] text-violetglow">
            <BadgeCheck className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="font-display text-[15px] font-semibold tracking-[-0.025em] text-spectral">Maven CEO receipt</div>
            <div className="mt-0.5 truncate font-mono-lab text-[8px] uppercase tracking-[0.13em] text-white/28">@traderjon · public payout mention</div>
          </div>
        </div>
        <a href={TWEET_URL} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2 font-mono-lab text-[8px] font-semibold uppercase tracking-[0.12em] text-white/50 transition-colors hover:border-lucid/20 hover:text-lucid">
          View on X <ArrowUpRight className="h-3 w-3" />
        </a>
      </div>
    </section>
  );
}
