import React, { useState } from "react";
import { motion } from "framer-motion";
import { Layers, Mail, Send, ArrowUp } from "lucide-react";

const links = [
  { label: "Payouts", href: "#vault", icon: Layers },
  { label: "Lessons", href: "#drops", icon: Mail },
  { label: "1:1", href: "#access", icon: Send },
];

export default function FloatingDock() {
  const [hovered, setHovered] = useState(null);
  return (
    <div className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2">
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.6 }} className="max-w-[95vw]">
        <div className="flex items-center gap-1 rounded-full border border-border bg-prism/80 p-1.5 backdrop-blur-xl">
          {links.map((l) => {
            const Icon = l.icon;
            const active = hovered === l.label;
            return <a key={l.label} href={l.href} aria-label={l.label} onMouseEnter={() => setHovered(l.label)} onMouseLeave={() => setHovered(null)} className="relative flex items-center gap-2 rounded-full px-4 py-2 font-mono-lab text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-spectral"><Icon className={`h-4 w-4 ${active ? "text-lucid" : ""}`} /><span>{l.label}</span></a>;
          })}
          <a href="#hero" className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-lucid text-void transition-transform hover:scale-105" aria-label="Back to top"><ArrowUp className="h-4 w-4" /></a>
        </div>
      </motion.div>
    </div>
  );
}
