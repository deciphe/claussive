import React from "react";

export default function SiteFooter() {
  return (
    <footer className="relative w-full border-t border-border bg-void px-6 py-10 md:px-12">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="font-display text-2xl font-semibold tracking-tight text-spectral">gigaprop<span className="text-lucid">.</span></div>
        <div className="flex items-center gap-5 font-mono-lab text-[10px] uppercase tracking-widest text-muted-foreground">
          <a href="#vault" className="transition-colors hover:text-lucid">Vault</a>
          <a href="#access" className="transition-colors hover:text-lucid">1:1 access</a>
          <a href="#hero" className="transition-colors hover:text-lucid">Top</a>
        </div>
        <div className="font-mono-lab text-[9px] uppercase tracking-widest text-white/20">© {new Date().getFullYear()} gigaprop</div>
      </div>
    </footer>
  );
}
