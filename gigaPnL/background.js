const STALE_MS = 30000;
const positionsByTab = new Map();
const vestTabs = new Set();
const sessionReadyTabs = new Set();
let collectorTabId = null;

const normalizeKey = (position, tabId, index = 0) => {
  const account = position.accountId || `tab-${tabId}`;
  const positionKey = position.positionId || position.symbol || `position-${index}`;
  const side = position.side || "";
  return `${account}::${positionKey}::${side}`;
};

const electCollector = () => {
  if (collectorTabId != null && vestTabs.has(collectorTabId) && sessionReadyTabs.has(collectorTabId)) {
    return collectorTabId;
  }
  collectorTabId = [...sessionReadyTabs].find((id) => vestTabs.has(id)) ?? [...vestTabs][0] ?? null;
  return collectorTabId;
};

const sendCollectorStatus = async () => {
  const collector = electCollector();
  await Promise.allSettled(
    [...vestTabs].map((tabId) =>
      chrome.tabs.sendMessage(tabId, {
        type: "GIGAPNL_COLLECTOR_STATUS",
        enabled: tabId === collector
      })
    )
  );
};

const snapshot = () => {
  const now = Date.now();
  const deduped = new Map();
  let accountCount = 0;

  for (const [tabId, entry] of positionsByTab.entries()) {
    if (!entry || now - entry.updatedAt > STALE_MS) continue;
    accountCount = Math.max(accountCount, Number(entry.accountCount) || 0);

    entry.positions.forEach((position, index) => {
      if (!position || position.active === false || !Number.isFinite(position.pnl)) return;
      const key = normalizeKey(position, tabId, index);
      const existing = deduped.get(key);

      if (!existing || entry.updatedAt > existing.updatedAt) {
        deduped.set(key, { ...position, tabId, updatedAt: entry.updatedAt });
      }
    });
  }

  const positions = [...deduped.values()].sort((a, b) => {
    const aa = String(a.accountLabel || a.accountId || "");
    const bb = String(b.accountLabel || b.accountId || "");
    return aa.localeCompare(bb) || String(a.symbol || "").localeCompare(String(b.symbol || ""));
  });

  return {
    positions,
    accountCount,
    positionCount: positions.length,
    totalPnl: positions.reduce((sum, p) => sum + p.pnl, 0),
    updatedAt: now
  };
};

const broadcast = async () => {
  const data = snapshot();
  await Promise.allSettled(
    [...vestTabs].map((tabId) =>
      chrome.tabs.sendMessage(tabId, { type: "GIGAPNL_SNAPSHOT", data })
    )
  );
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const tabId = sender.tab?.id;

  if (message?.type === "GIGAPNL_REGISTER_TAB" && tabId != null) {
    vestTabs.add(tabId);
    electCollector();
    sendCollectorStatus();
    sendResponse({ collector: tabId === collectorTabId, snapshot: snapshot() });
    return;
  }

  if (message?.type === "GIGAPNL_SESSION_READY" && tabId != null) {
    vestTabs.add(tabId);
    sessionReadyTabs.add(tabId);
    const currentIsReady = collectorTabId != null && vestTabs.has(collectorTabId) && sessionReadyTabs.has(collectorTabId);
    if (!currentIsReady) {
      const previous = collectorTabId;
      collectorTabId = tabId;
      if (previous != null && previous !== collectorTabId) positionsByTab.delete(previous);
    }
    sendCollectorStatus();
    sendResponse({ collector: tabId === collectorTabId });
    return;
  }

  if (message?.type === "GIGAPNL_POSITIONS_UPDATE" && tabId != null) {
    vestTabs.add(tabId);
    positionsByTab.set(tabId, {
      positions: Array.isArray(message.positions) ? message.positions : [],
      accountCount: Number(message.accountCount) || 0,
      updatedAt: Date.now()
    });
    broadcast();
    sendResponse({ ok: true });
    return;
  }

  if (message?.type === "GIGAPNL_GET_SNAPSHOT") {
    sendResponse(snapshot());
    return;
  }

  if (message?.type === "GIGAPNL_CLEAR_TAB" && tabId != null) {
    vestTabs.delete(tabId);
    sessionReadyTabs.delete(tabId);
    positionsByTab.delete(tabId);
    if (collectorTabId === tabId) collectorTabId = null;
    sendCollectorStatus();
    broadcast();
    sendResponse({ ok: true });
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  const wasCollector = collectorTabId === tabId;
  vestTabs.delete(tabId);
  sessionReadyTabs.delete(tabId);
  positionsByTab.delete(tabId);
  if (wasCollector) collectorTabId = null;
  sendCollectorStatus();
  broadcast();
});

setInterval(() => {
  const now = Date.now();
  let changed = false;
  for (const [tabId, entry] of positionsByTab.entries()) {
    if (now - entry.updatedAt > STALE_MS * 2) {
      positionsByTab.delete(tabId);
      changed = true;
    }
  }
  if (changed) broadcast();
}, 10000);
