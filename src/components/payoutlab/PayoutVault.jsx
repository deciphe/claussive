import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { certificates } from "./data";

const privateNameIds = new Set(["fundednext-004", "fundednext-005"]);

const proofCountLabel = (firm, count) => {
  if (firm === "Maven") return "30+ certificates";
  if (firm === "Topstep") return "20+ certificates";
  return `${String(count).padStart(2, "0")} certificates`;
};

const proofCountShort = (firm, count) => {
  if (firm === "Maven") return "30+";
  if (firm === "Topstep") return "20+";
  return String(count).padStart(2, "0");
};

const grouped = [...new Set(certificates.map(c => c.firm))]
  .map(firm => ({
    firm,
    all: certificates
      .filter(c => c.firm === firm)
      .sort((a, b) => b.amountNum - a.amountNum || a.id.localeCompare(b.id)),
  }))
  .map(group => ({
    ...group,
    total: group.all.reduce((sum, certificate) => sum + certificate.amountNum, 0),
  }))
  .sort((a, b) => b.all.length - a.all.length || a.firm.localeCompare(b.firm));

const formatMoney = value => value.toLocaleString("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: value % 1 ? 2 : 0,
  maximumFractionDigits: 2,
});

function ProofImage({ certificate, preview = false }) {
  const privateName = privateNameIds.has(certificate.id);
  return (
    <div className={`relative overflow-hidden border border-white/[0.07] bg-white/[0.02] ${preview ? "h-10 w-16 rounded-md sm:h-11 sm:w-20" : "rounded-xl"}`}>
      <img
        src={certificate.url}
        alt={`${certificate.firm} payout ${certificate.amount}`}
        loading="lazy"
        className={`block w-full object-contain ${preview ? "h-full" : "h-auto"}`}
      />
      {privateName && !preview && (
        <div
          aria-label="Last name censored"
          className="pointer-events-none absolute left-[51.5%] top-[31.7%] h-[8.7%] w-[45%] bg-[#1a1a1b]/92 backdrop-blur-md"
          style={{ maskImage: "linear-gradient(to right, transparent 0%, black 9%, black 100%)" }}
        />
      )}
    </div>
  );
}

export default function PayoutVault() {
  const [openFirm, setOpenFirm] = useState(null);

  return (
    <section id="vault" className="relative overflow-hidden bg-void px-6 py-12 md:px-12 md:py-16">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle at 8% 8%, rgba(155,135,245,.065), transparent 24%), radial-gradient(circle at 90% 34%, rgba(182,255,74,.045), transparent 22%)" }} />

      <div className="relative mx-auto max-w-[1180px]">
        <div className="mb-5">
          <div className="font-mono-lab text-[8px] font-semibold uppercase tracking-[0.22em] text-violetglow">Proof</div>
          <h2 className="mt-1 font-display text-3xl font-semibold tracking-[-0.05em] text-spectral md:text-4xl">Payout vault.</h2>
        </div>

        <div className="space-y-2">
          {grouped.map(({ firm, all, total }) => {
            const shown = all.slice(0, 5);
            const isOpen = openFirm === firm;
            const opacity = [1, .72, .5, .32, .18];

            return (
              <div key={firm} className="overflow-hidden rounded-xl border border-white/[0.065] bg-white/[0.012]">
                <button
                  type="button"
                  onClick={() => setOpenFirm(isOpen ? null : firm)}
                  aria-expanded={isOpen}
                  className="group flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-white/[0.02] md:px-5"
                >
                  <div className="w-[104px] shrink-0 md:w-[142px]">
                    <div className="font-display text-lg font-semibold tracking-[-0.035em] text-spectral md:text-xl">{firm}</div>
                  </div>

                  <div className="relative flex min-w-0 flex-1 items-center overflow-hidden">
                    <div className="flex items-center gap-1.5">
                      {shown.map((c, index) => (
                        <div key={c.id} style={{ opacity: opacity[index] ?? .18 }} className="shrink-0">
                          <ProofImage certificate={c} preview />
                        </div>
                      ))}
                    </div>
                    <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#070707] via-[#070707]/85 to-transparent" />
                  </div>

                  <div className="flex min-w-[92px] shrink-0 items-center justify-end gap-3 sm:min-w-[168px] md:min-w-[210px]">
                    <div className="text-right">
                      <div className="font-display text-lg font-semibold tracking-[-0.04em] text-lucid sm:text-2xl md:text-3xl">{formatMoney(total)}</div>
                      <div className="mt-0.5 font-mono-lab text-[7px] font-semibold uppercase tracking-[0.13em] text-white/32 sm:hidden">{proofCountShort(firm, all.length)} payouts</div>
                      <div className="mt-1 hidden font-mono-lab text-[8px] font-semibold uppercase tracking-[0.14em] text-white/32 sm:block">{proofCountLabel(firm, all.length)} on file</div>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-white/28 transition-transform duration-200 group-hover:text-lucid ${isOpen ? "rotate-180 text-lucid" : ""}`} />
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-white/[0.055] px-3 pb-3 pt-3 md:px-4 md:pb-4">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                      {shown.map(c => (
                        <ProofImage key={c.id} certificate={c} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
