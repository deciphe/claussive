const ATTRIBUTION_KEY = "gigaprop_attribution";

export function captureAttribution() {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const incoming = {};
  ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "ref"].forEach(key => {
    const value = params.get(key);
    if (value) incoming[key] = value;
  });
  if (document.referrer) incoming.referrer = document.referrer;
  if (!Object.keys(incoming).length) return;
  try {
    const existing = JSON.parse(localStorage.getItem(ATTRIBUTION_KEY) || "{}");
    localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify({ ...existing, ...incoming }));
  } catch {}
}

export function getAttribution() {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(ATTRIBUTION_KEY) || "{}"); } catch { return {}; }
}

export function track(event, props = {}) {
  if (typeof window === "undefined") return;
  const payload = { ...getAttribution(), ...props };

  if (typeof window.plausible === "function") window.plausible(event, { props: payload });
  if (typeof window.gtag === "function") window.gtag("event", event, payload);
  if (Array.isArray(window.dataLayer)) window.dataLayer.push({ event, ...payload });

  window.dispatchEvent(new CustomEvent("gigaprop:track", { detail: { event, props: payload } }));
}
