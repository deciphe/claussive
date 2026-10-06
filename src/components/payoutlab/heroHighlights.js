// Hero-only highlights. Lifetime records never enter the individual payout ledger.
import { certificates } from "./data";
const assetUrl = path => `${import.meta.env?.BASE_URL || "/"}${path}`;
const lifetimeCards = {
  Tradeify: { id: "hero-tradeify-lifetime", firm: "Tradeify", amount: "$10,507", amountNum: 10507, kind: "lifetime", url: assetUrl("payouts/highlights/tradeify-lifetime.jpg") },
  Breakout: { id: "hero-breakout-lifetime", firm: "Breakout", amount: "$920.63", amountNum: 920.63, kind: "lifetime", url: assetUrl("payouts/highlights/breakout-lifetime.png") },
};
const ranked = [...certificates].sort((a, b) => b.amountNum - a.amountNum || a.id.localeCompare(b.id));
const firms = [...new Set(certificates.map(c => c.firm))];
const representatives = firms.map(firm => lifetimeCards[firm] || ranked.find(c => c.firm === firm));
const selected = new Set(representatives.map(c => c.id));
// Fill the remaining hero slots with Lucid first; Maven appears only once.
const remaining = ranked.filter(c => !selected.has(c.id) && c.firm !== "Maven")
  .sort((a, b) => Number(b.firm === "Lucid Trading") - Number(a.firm === "Lucid Trading") || b.amountNum - a.amountNum);
export const heroHighlights = [...representatives, ...remaining.slice(0, Math.max(0, 10 - representatives.length))]
  .sort((a, b) => b.amountNum - a.amountNum || a.id.localeCompare(b.id)).slice(0, 10);
