(() => {
  if (window.__GIGAPNL_HOOKED__) return;
  window.__GIGAPNL_HOOKED__ = true;

  const API = "https://api-gateway.hz.vestmarkets.com";
  const WS_URL = "wss://ws.hz.vestmarkets.com/ws?version=1.0";
  const ACTIVE_REFRESH_MS = 45000;
  const TOKEN_REFRESH_MARGIN_MS = 30000;
  const ORDER_RE = /\/v3\/positions\/(open|append|reduce|close|cancel-order|stop-loss|take-profit)(\?|$)/;
  const COPYABLE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
  const POSITION_ID_KEYS = new Set(["positionId", "position_id"]);
  const QUANTITY_KEYS = new Set(["quantity", "qty", "size"]);

  const nativeFetch = window.fetch.bind(window);
  const nativeXhrOpen = XMLHttpRequest.prototype.open;
  const nativeXhrSend = XMLHttpRequest.prototype.send;
  const nativeXhrSetHeader = XMLHttpRequest.prototype.setRequestHeader;

  let collectorEnabled = false;
  let userToken = null;
  let userTokenExp = 0;
  let activeTimer = null;
  let pollTimer = null;
  let pollCursor = 0;
  let bootstrapBusy = false;
  let copierPrimeBusy = false;
  let demoCloseAllBusy = false;
  let learnedCloseRequest = null;
  let copierConfig = { masterId: null, followerIds: [], multiplier: 1, armed: false };

  const accounts = new Map();
  const accountTokens = new Map();
  const positionsByAccount = new Map();
  const marks = new Map();
  const subscribed = new Set();
  const positionLinks = new Map();

  let socket = null;
  let socketRetry = null;
  let socketBackoff = 1000;

  const post = (type, data = {}) => {
    window.postMessage({ __MassivePnL: true, type, ...data }, "*");
  };

  const copyEvent = (status, data = {}) => {
    post("VEST_COPY_EVENT", { status, at: Date.now(), ...data });
  };

  const linkKey = (masterPositionId, followerId) => `${String(masterPositionId)}::${String(followerId)}`;

  const exportLinks = () => [...positionLinks.entries()].map(([key, followerPositionId]) => {
    const split = key.lastIndexOf("::");
    return {
      masterPositionId: key.slice(0, split),
      followerId: key.slice(split + 2),
      followerPositionId
    };
  });

  const emitLinks = () => post("VEST_COPIER_LINKS", { links: exportLinks() });

  const setLink = (masterPositionId, followerId, followerPositionId, emit = true) => {
    if (!masterPositionId || !followerId || !followerPositionId) return false;
    const key = linkKey(masterPositionId, followerId);
    const next = String(followerPositionId);
    if (positionLinks.get(key) === next) return false;
    positionLinks.set(key, next);
    if (emit) emitLinks();
    return true;
  };

  const importLinks = (links) => {
    positionLinks.clear();
    for (const link of Array.isArray(links) ? links : []) {
      if (!link?.masterPositionId || !link?.followerId || !link?.followerPositionId) continue;
      positionLinks.set(linkKey(link.masterPositionId, link.followerId), String(link.followerPositionId));
    }
  };

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const decodeJwt = (token) => {
    try {
      let payload = String(token).split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      payload += "=".repeat((4 - (payload.length % 4)) % 4);
      return JSON.parse(atob(payload));
    } catch (_) {
      return {};
    }
  };

  const bearer = (auth) => String(auth || "").replace(/^Bearer\s+/i, "").trim();

  const tokenInfo = (auth) => {
    if (!auth || !/^Bearer\s+/i.test(String(auth))) return null;
    const token = bearer(auth);
    const claims = decodeJwt(token);
    if (!token || !claims.exp) return null;
    return { token, claims, exp: Number(claims.exp) * 1000 };
  };

  const captureAuth = (auth) => {
    const info = tokenInfo(auth);
    if (!info) return null;

    const { token, claims, exp } = info;
    if (claims.userId && !claims.accountId) {
      const changed = token !== userToken;
      userToken = token;
      userTokenExp = exp;
      if (changed) post("VEST_SESSION_CAPTURED");
      if (collectorEnabled) startUniverse(changed);
      if (copierConfig.armed && collectorEnabled) primeCopier();
      return { kind: "user", token, claims };
    }

    if (claims.accountId) {
      const id = String(claims.accountId);
      const canTrade = typeof claims.canTrade === "boolean" ? claims.canTrade : null;
      accountTokens.set(id, { token, exp, canTrade });
      const previous = accounts.get(id);
      accounts.set(id, {
        id,
        label: previous?.label || "CURRENT ACCOUNT",
        size: previous?.size ?? null,
        canTrade: canTrade ?? previous?.canTrade ?? null
      });
      post("VEST_ACCOUNT_CAPTURED", { accountId: id, canTrade });
      if (collectorEnabled) emitUniverse();
      if (collectorEnabled && !userToken) {
        startScheduler();
        priorityPoll(id);
      }
      return { kind: "account", token, claims, accountId: id };
    }

    return null;
  };

  const extractFetchAuth = (input, init) => {
    try {
      return new Headers((init && init.headers) || (input && input.headers) || {}).get("authorization");
    } catch (_) {
      return null;
    }
  };

  const fetchUrl = (input) => {
    try {
      return typeof input === "string" ? input : (input && input.url) || "";
    } catch (_) {
      return "";
    }
  };

  const scheduleAfterOrder = (accountId) => {
    if (!collectorEnabled || !accountId) return;
    setTimeout(() => priorityPoll(accountId), 220);
    setTimeout(() => priorityPoll(accountId), 1050);
    setTimeout(() => priorityPoll(accountId), 2400);
  };

  window.fetch = function(input, init) {
    let captured = null;
    try { captured = captureAuth(extractFetchAuth(input, init)); } catch (_) {}

    const url = fetchUrl(input);
    const method = String((init && init.method) || (input && input.method) || "GET").toUpperCase();
    const copyable = isCopyableOrder(method, url);
    const bodyPromise = copyable ? readFetchBody(input, init) : null;
    const request = nativeFetch(input, init);

    if (copyable) {
      const accountId = captured && captured.accountId;
      request.then(async (response) => {
        const meta = orderUrl(url);
        if (response.ok && meta?.action === "close") {
          try {
            const learnedBody = await bodyPromise;
            if (learnedBody != null) {
              learnedCloseRequest = {
                path: meta.path,
                method,
                body: learnedBody
              };
              post("VEST_DEMO_CLOSE_TEMPLATE", { template: learnedCloseRequest });
              post("VEST_DEMO_CLOSE_TEMPLATE", { template: learnedCloseRequest });
          post("VEST_DEMO_CLOSE_READY", { ready: true });
            }
          } catch (_) {}
        }
        scheduleAfterOrder(accountId);
        if (!response.ok) return;
        let responseData = null;
        try { responseData = await response.clone().json(); } catch (_) {}
        const body = await bodyPromise;
        copyMasterOrder({ accountId, url, method, body, responseData });
      }, () => scheduleAfterOrder(accountId));
    }

    return request;
  };

  XMLHttpRequest.prototype.open = function(method, url) {
    this.__MassivePnLMeta = { method: String(method || "GET").toUpperCase(), url: String(url || ""), accountId: null };
    return nativeXhrOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.setRequestHeader = function(key, value) {
    if (/^authorization$/i.test(String(key))) {
      try {
        const captured = captureAuth(value);
        if (this.__MassivePnLMeta && captured && captured.accountId) {
          this.__MassivePnLMeta.accountId = captured.accountId;
        }
      } catch (_) {}
    }
    return nativeXhrSetHeader.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function(body) {
    const meta = this.__MassivePnLMeta;
    if (meta && isCopyableOrder(meta.method, meta.url)) {
      meta.body = typeof body === "string" ? body : (body == null ? null : String(body));
      this.addEventListener("loadend", () => {
        scheduleAfterOrder(meta.accountId);
        if (this.status < 200 || this.status >= 300) return;
        const closeMeta = orderUrl(meta.url);
        if (closeMeta?.action === "close" && meta.body != null) {
          learnedCloseRequest = {
            path: closeMeta.path,
            method: meta.method,
            body: meta.body
          };
          post("VEST_DEMO_CLOSE_READY", { ready: true });
        }
        let responseData = null;
        try { responseData = JSON.parse(this.responseText || "null"); } catch (_) {}
        copyMasterOrder({ ...meta, responseData });
      }, { once: true });
    }
    return nativeXhrSend.apply(this, arguments);
  };

  const api = async (path, token, opts = {}) => {
    if (!token) throw new Error("missing Vest token");
    const response = await nativeFetch(API + path, {
      ...opts,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
        ...(opts.headers || {})
      }
    });
    if (!response.ok) throw new Error(path + " -> " + response.status);
    return response.json();
  };

  const n = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const positionIdOf = (p) => p.positionId || p.position_id || p.id || null;
  const openPriceOf = (p) => n(
    p.openPrice ?? p.open_price ?? p.entryPrice ?? p.entry_price ?? p.avgOpenPrice ?? p.averageOpenPrice
  );

  const directPnlOf = (p) => {
    const values = [
      p.unrealizedPnl,
      p.unrealized_pnl,
      p.totalUnrealizedPnl,
      p.total_unrealized_pnl,
      p.openPnl,
      p.open_pnl
    ];
    for (const value of values) {
      const parsed = n(value);
      if (parsed !== null) return parsed;
    }
    return null;
  };

  const normalizeSide = (side, quantity) => {
    const raw = String(side || "").toLowerCase();
    if (raw.includes("long") || raw === "buy") return "LONG";
    if (raw.includes("short") || raw === "sell") return "SHORT";
    const q = n(quantity);
    if (q !== null && q < 0) return "SHORT";
    if (q !== null && q > 0) return "LONG";
    return "";
  };

  const calcPnl = (p) => {
    const openPrice = openPriceOf(p);
    const mark = marks.get(String(p.symbol || ""));
    const qtyRaw = n(p.quantity ?? p.qty ?? p.size);

    if (openPrice !== null && mark != null && qtyRaw !== null) {
      const qty = Math.abs(qtyRaw);
      const side = normalizeSide(p.side, qtyRaw);
      if (side === "LONG") return (mark - openPrice) * qty;
      if (side === "SHORT") return (openPrice - mark) * qty;
    }

    return directPnlOf(p);
  };

  const accountLabel = (a) => {
    if (a && a.name) return String(a.name);
    const index = Number(a && a.attempt_index);
    return Number.isFinite(index) ? "ACCOUNT " + String(index + 1).padStart(2, "0") : "VEST ACCOUNT";
  };

  const emitUniverse = () => {
    post("VEST_UNIVERSE", {
      accountCount: accounts.size,
      accounts: [...accounts.values()].map((account) => ({
        id: account.id,
        label: account.label || "VEST ACCOUNT",
        size: account.size ?? null,
        canTrade: account.canTrade ?? null
      }))
    });
  };

  const emitPositions = () => {
    if (!collectorEnabled) return;

    const normalized = [];
    for (const [id, rawPositions] of positionsByAccount.entries()) {
      const account = accounts.get(id) || { id, label: "VEST ACCOUNT", size: null };
      for (const p of rawPositions || []) {
        const quantity = n(p.quantity ?? p.qty ?? p.size);
        const pnl = calcPnl(p);
        if (!Number.isFinite(pnl)) continue;

        normalized.push({
          accountId: id,
          accountLabel: account.label,
          accountSize: account.size,
          positionId: positionIdOf(p),
          symbol: p.symbol || null,
          side: normalizeSide(p.side, quantity),
          size: quantity === null ? null : Math.abs(quantity),
          openPrice: openPriceOf(p),
          markPrice: marks.get(String(p.symbol || "")) ?? null,
          pnl,
          active: true,
          source: marks.has(String(p.symbol || "")) ? "vest-ticker" : "vest-position"
        });
      }
    }

    post("VEST_POSITIONS", {
      positions: normalized,
      accountCount: accounts.size,
      activePositionCount: normalized.length
    });
  };

  const sendSubscriptions = () => {
    if (!socket || socket.readyState !== WebSocket.OPEN || !subscribed.size) return;
    try {
      socket.send(JSON.stringify({
        method: "SUBSCRIBE",
        params: [...subscribed].map((symbol) => symbol + "@ticker"),
        id: Date.now()
      }));
    } catch (_) {}
  };

  const scheduleSocketReconnect = () => {
    if (!collectorEnabled || !subscribed.size || socketRetry) return;
    socketRetry = setTimeout(() => {
      socketRetry = null;
      ensureSocket();
    }, socketBackoff);
    socketBackoff = Math.min(socketBackoff * 2, 15000);
  };

  const ensureSocket = () => {
    if (!collectorEnabled || !subscribed.size) return;
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;

    try {
      socket = new WebSocket(WS_URL);
    } catch (_) {
      scheduleSocketReconnect();
      return;
    }

    socket.addEventListener("open", () => {
      socketBackoff = 1000;
      sendSubscriptions();
    });

    socket.addEventListener("message", (event) => {
      try {
        const message = JSON.parse(event.data);
        if (!message || typeof message.channel !== "string" || !message.channel.endsWith("@ticker")) return;
        const symbol = (message.data && message.data.symbol) || message.channel.split("@")[0];
        const px = n(message.data && message.data.markPrice);
        if (px === null || px <= 0) return;
        marks.set(symbol, px);
        emitPositions();
      } catch (_) {}
    });

    socket.addEventListener("close", () => {
      socket = null;
      scheduleSocketReconnect();
    });

    socket.addEventListener("error", () => {
      try { socket.close(); } catch (_) {}
    });
  };

  const subscribeSymbols = async (symbols) => {
    let changed = false;

    for (const symbol of symbols) {
      if (!symbol || subscribed.has(symbol)) continue;
      subscribed.add(symbol);
      changed = true;

      try {
        const response = await nativeFetch(
          API + "/v3/ticker/latest?symbols=" + encodeURIComponent(symbol)
        );
        if (response.ok) {
          const data = await response.json();
          const ticker = (data.tickers || []).find((t) => t.symbol === symbol);
          const px = n(ticker && ticker.markPrice);
          if (px !== null && px > 0) marks.set(symbol, px);
        }
      } catch (_) {}
    }

    if (subscribed.size) ensureSocket();
    if (changed && socket && socket.readyState === WebSocket.OPEN) sendSubscriptions();
  };

  const mintAccountToken = async (id) => {
    const cached = accountTokens.get(id);
    if (cached && cached.exp - TOKEN_REFRESH_MARGIN_MS > Date.now()) return cached.token;

    if (!userToken || (userTokenExp && userTokenExp <= Date.now())) {
      throw new Error("no live Vest user session");
    }

    const result = await api("/v3/auth/account-token", userToken, {
      method: "POST",
      body: JSON.stringify({ accountId: id })
    });

    const token = result.apiKey || result.accessToken;
    if (!token) throw new Error("Vest account token missing");
    const claims = decodeJwt(token);
    const exp = Number(result.accessExpiresAtMs) || (Number(claims.exp) * 1000) || (Date.now() + 10 * 60 * 1000);
    const canTrade = typeof claims.canTrade === "boolean" ? claims.canTrade : null;
    accountTokens.set(id, { token, exp, canTrade });

    const account = accounts.get(id);
    if (account && canTrade !== null && account.canTrade !== canTrade) {
      accounts.set(id, { ...account, canTrade });
      if (collectorEnabled) emitUniverse();
    }
    return token;
  };

  const pollAccount = async (id, force = false) => {
    if ((!collectorEnabled && !force) || !id) return;

    try {
      const token = await mintAccountToken(id);
      const result = await api("/v3/positions/opened", token);
      const next = Array.isArray(result.positions) ? result.positions : [];
      positionsByAccount.set(id, next);
      await subscribeSymbols([...new Set(next.map((p) => p.symbol).filter(Boolean))]);
      emitPositions();
    } catch (_) {
      const cached = accountTokens.get(id);
      if (cached && cached.exp <= Date.now()) accountTokens.delete(id);
    }
  };

  const priorityPoll = (id) => {
    if (!collectorEnabled || !id) return;
    pollAccount(id);
  };

  const schedulerDelay = () => {
    const count = Math.max(1, accounts.size);
    if (count <= 4) return 650;
    if (count <= 10) return 800;
    if (count <= 20) return 900;
    return 1050;
  };

  const scheduleNextPoll = () => {
    clearTimeout(pollTimer);
    if (!collectorEnabled) return;

    pollTimer = setTimeout(async () => {
      const ids = [...accounts.keys()];
      if (ids.length) {
        const id = ids[pollCursor % ids.length];
        pollCursor = (pollCursor + 1) % Math.max(1, ids.length);
        await pollAccount(id);
      }
      scheduleNextPoll();
    }, schedulerDelay());
  };

  const startScheduler = () => {
    if (!collectorEnabled) return;
    scheduleNextPoll();
  };

  const bootstrapSweep = async () => {
    if (!collectorEnabled || bootstrapBusy) return;
    bootstrapBusy = true;
    try {
      for (const id of [...accounts.keys()]) {
        if (!collectorEnabled) break;
        await pollAccount(id);
        await sleep(90);
      }
    } finally {
      bootstrapBusy = false;
    }
  };

  const refreshAccounts = async (bootstrap = false) => {
    if (!collectorEnabled || !userToken) return;

    try {
      const result = await api("/v3/capital/accounts/active", userToken);
      const active = Array.isArray(result.accounts) ? result.accounts : [];
      const nextIds = new Set();

      for (const a of active) {
        const id = String(a.id);
        nextIds.add(id);
        const previous = accounts.get(id);
        accounts.set(id, {
          id,
          label: accountLabel(a),
          size: n(a.initial_capital),
          canTrade: previous?.canTrade ?? null
        });
      }

      for (const id of [...accounts.keys()]) {
        if (!nextIds.has(id)) {
          accounts.delete(id);
          positionsByAccount.delete(id);
          accountTokens.delete(id);
        }
      }

      emitUniverse();
      emitPositions();
      startScheduler();

      if (bootstrap) bootstrapSweep();
    } catch (_) {}
  };

  const scaleValue = (value, multiplier) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return value;
    const scaled = Number((parsed * multiplier).toPrecision(12));
    return typeof value === "string" ? String(scaled) : scaled;
  };

  const parseJsonBody = (body) => {
    if (body == null || body === "") return { value: null, json: false };
    if (typeof body === "string") {
      try { return { value: JSON.parse(body), json: true }; }
      catch (_) { return { value: body, json: false }; }
    }
    if (typeof body === "object") return { value: body, json: true };
    return { value: body, json: false };
  };

  const findPositionId = (value, depth = 0) => {
    if (!value || depth > 5 || typeof value !== "object") return null;
    for (const key of POSITION_ID_KEYS) {
      if (value[key] != null && value[key] !== "") return String(value[key]);
    }
    if (value.position && typeof value.position === "object" && value.position.id != null) {
      return String(value.position.id);
    }
    for (const child of Object.values(value)) {
      const found = findPositionId(child, depth + 1);
      if (found) return found;
    }
    return null;
  };

  const resolveFollowerPosition = (masterPositionId, followerId) => {
    if (!masterPositionId || !followerId) return null;
    const direct = positionLinks.get(linkKey(masterPositionId, followerId));
    if (direct) return direct;

    const masterPositions = positionsByAccount.get(String(copierConfig.masterId)) || [];
    const master = masterPositions.find((position) => String(positionIdOf(position) || "") === String(masterPositionId));
    if (!master) return null;

    const side = normalizeSide(master.side, master.quantity ?? master.qty ?? master.size);
    const matches = (positionsByAccount.get(String(followerId)) || []).filter((position) =>
      String(position.symbol || "") === String(master.symbol || "") &&
      normalizeSide(position.side, position.quantity ?? position.qty ?? position.size) === side
    );
    if (matches.length !== 1) return null;

    const followerPositionId = positionIdOf(matches[0]);
    if (!followerPositionId) return null;
    setLink(masterPositionId, followerId, followerPositionId);
    return String(followerPositionId);
  };

  const rewriteOrderBody = (body, followerId) => {
    const parsed = parseJsonBody(body);
    if (!parsed.json) return { body, unresolved: false };

    let unresolved = false;
    const walk = (node, key = "") => {
      if (Array.isArray(node)) return node.map((item) => walk(item));
      if (!node || typeof node !== "object") {
        if (QUANTITY_KEYS.has(key)) return scaleValue(node, copierConfig.multiplier);
        return node;
      }

      const out = {};
      for (const [childKey, childValue] of Object.entries(node)) {
        if (childKey === "accountId" || childKey === "account_id") {
          out[childKey] = followerId;
          continue;
        }
        if (POSITION_ID_KEYS.has(childKey) && childValue != null) {
          const mapped = resolveFollowerPosition(String(childValue), followerId);
          if (!mapped) {
            unresolved = true;
            out[childKey] = childValue;
          } else {
            out[childKey] = mapped;
          }
          continue;
        }
        out[childKey] = walk(childValue, childKey);
      }
      return out;
    };

    const next = walk(parsed.value);
    return { body: JSON.stringify(next), unresolved };
  };

  const orderUrl = (url) => {
    try {
      const parsed = new URL(String(url || ""), location.href);
      if (!ORDER_RE.test(parsed.pathname + parsed.search)) return null;
      return { path: parsed.pathname + parsed.search, action: (parsed.pathname.match(ORDER_RE) || [])[1] || "order" };
    } catch (_) {
      return null;
    }
  };

  const isCopyableOrder = (method, url) => COPYABLE_METHODS.has(String(method || "").toUpperCase()) && Boolean(orderUrl(url));

  const readFetchBody = (input, init) => {
    if (init && Object.prototype.hasOwnProperty.call(init, "body")) {
      const body = init.body;
      if (body == null || typeof body === "string") return Promise.resolve(body);
      if (body instanceof URLSearchParams) return Promise.resolve(body.toString());
      try { return Promise.resolve(JSON.stringify(body)); } catch (_) { return Promise.resolve(null); }
    }
    try {
      if (typeof Request !== "undefined" && input instanceof Request) {
        return input.clone().text().catch(() => null);
      }
    } catch (_) {}
    return Promise.resolve(null);
  };

  const rebuildPositionLinks = () => {
    const masterId = String(copierConfig.masterId || "");
    if (!masterId) return;
    const masterPositions = positionsByAccount.get(masterId) || [];
    let changed = false;

    for (const master of masterPositions) {
      const masterPositionId = positionIdOf(master);
      if (!masterPositionId) continue;
      const side = normalizeSide(master.side, master.quantity ?? master.qty ?? master.size);

      for (const followerId of copierConfig.followerIds) {
        if (!followerId || String(followerId) === masterId) continue;
        const matches = (positionsByAccount.get(String(followerId)) || []).filter((position) =>
          String(position.symbol || "") === String(master.symbol || "") &&
          normalizeSide(position.side, position.quantity ?? position.qty ?? position.size) === side
        );
        if (matches.length !== 1) continue;
        const followerPositionId = positionIdOf(matches[0]);
        if (followerPositionId) changed = setLink(masterPositionId, followerId, followerPositionId, false) || changed;
      }
    }
    if (changed) emitLinks();
  };

  const refreshCopierMappings = async () => {
    if (!copierConfig.masterId) return;
    const ids = [...new Set([copierConfig.masterId, ...copierConfig.followerIds].filter(Boolean).map(String))];
    for (const id of ids) {
      await pollAccount(id, true);
      await sleep(40);
    }
    rebuildPositionLinks();
  };

  const primeCopier = async () => {
    if (!collectorEnabled || !copierConfig.armed || copierPrimeBusy || !userToken) return;
    copierPrimeBusy = true;
    try {
      await refreshCopierMappings();
      copyEvent("ready", {
        masterId: copierConfig.masterId,
        followers: copierConfig.followerIds.length,
        message: "COPIER ARMED"
      });
    } finally {
      copierPrimeBusy = false;
    }
  };

  const copyMasterOrder = async ({ accountId, url, method, body, responseData }) => {
    const masterId = String(copierConfig.masterId || "");
    if (!copierConfig.armed || !masterId || String(accountId || "") !== masterId) return;

    const target = orderUrl(url);
    if (!target) return;

    const followers = [...new Set(copierConfig.followerIds.map(String))]
      .filter((id) => id && id !== masterId);
    if (!followers.length) return;

    const masterPositionId = findPositionId(responseData) || findPositionId(parseJsonBody(body).value);
    copyEvent("copying", {
      action: target.action,
      masterId,
      followers: followers.length,
      message: `COPYING ${target.action.toUpperCase()} → ${followers.length}`
    });

    const results = await Promise.allSettled(followers.map(async (followerId) => {
      const known = accounts.get(followerId);
      if (known?.canTrade === false) throw new Error("account cannot trade");

      const token = await mintAccountToken(followerId);
      const tokenRecord = accountTokens.get(followerId);
      if (tokenRecord?.canTrade === false) throw new Error("account cannot trade");

      const rewritten = rewriteOrderBody(body, followerId);
      if (rewritten.unresolved) throw new Error("position mapping unavailable");

      const response = await nativeFetch(API + target.path, {
        method,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        },
        body: method === "GET" || method === "HEAD" ? undefined : rewritten.body
      });

      let followerData = null;
      try { followerData = await response.clone().json(); } catch (_) {}
      if (!response.ok) {
        const detail = followerData?.message || followerData?.error || `HTTP ${response.status}`;
        throw new Error(String(detail));
      }

      const followerPositionId = findPositionId(followerData);
      if (masterPositionId && followerPositionId) {
        setLink(masterPositionId, followerId, followerPositionId);
      }

      copyEvent("success", {
        action: target.action,
        followerId,
        message: `${target.action.toUpperCase()} COPIED · ${followerId.slice(-5)}`
      });
      return followerId;
    }));

    const failed = [];
    results.forEach((result, index) => {
      if (result.status !== "rejected") return;
      const followerId = followers[index];
      failed.push(followerId);
      copyEvent("error", {
        action: target.action,
        followerId,
        message: `SKIPPED · ${followerId.slice(-5)} · ${String(result.reason?.message || result.reason || "copy failed")}`
      });
    });

    setTimeout(() => refreshCopierMappings(), 350);
    setTimeout(() => refreshCopierMappings(), 1200);

    copyEvent(failed.length ? "partial" : "done", {
      action: target.action,
      followers: followers.length,
      failed: failed.length,
      message: failed.length ? `COPIED ${followers.length - failed.length}/${followers.length}` : `COPIED ${followers.length}/${followers.length}`
    });
  };

  const rewriteDemoCloseBody = (templateBody, accountId, position) => {
    const parsed = parseJsonBody(templateBody);
    if (!parsed.json || !parsed.value || typeof parsed.value !== "object") {
      return { ok: false, body: null };
    }

    const positionId = positionIdOf(position);
    const qtyRaw = n(position.quantity ?? position.qty ?? position.size);
    const quantity = qtyRaw === null ? null : Math.abs(qtyRaw);
    let sawPosition = false;

    const walk = (node, key = "") => {
      if (Array.isArray(node)) return node.map((item) => walk(item));
      if (!node || typeof node !== "object") {
        if (POSITION_ID_KEYS.has(key)) {
          sawPosition = true;
          return positionId;
        }
        if (QUANTITY_KEYS.has(key) && quantity !== null) return quantity;
        if ((key === "accountId" || key === "account_id") && accountId) return accountId;
        if ((key === "symbol" || key === "instrument" || key === "market") && position.symbol) return position.symbol;
        if (key === "side" || key === "positionSide" || key === "position_side") {
          const side = normalizeSide(position.side, qtyRaw);
          if (side) {
            const raw = String(node || "");
            if (/buy|sell/i.test(raw)) return side === "LONG" ? "BUY" : "SELL";
            if (/long|short/i.test(raw)) return side;
          }
        }
        return node;
      }

      const out = {};
      for (const [childKey, childValue] of Object.entries(node)) {
        if (POSITION_ID_KEYS.has(childKey)) {
          sawPosition = true;
          out[childKey] = positionId;
        } else if (QUANTITY_KEYS.has(childKey) && quantity !== null) {
          out[childKey] = quantity;
        } else if (childKey === "accountId" || childKey === "account_id") {
          out[childKey] = accountId;
        } else if ((childKey === "symbol" || childKey === "instrument" || childKey === "market") && position.symbol) {
          out[childKey] = position.symbol;
        } else if (childKey === "side" || childKey === "positionSide" || childKey === "position_side") {
          const side = normalizeSide(position.side, qtyRaw);
          if (side) {
            const raw = String(childValue || "");
            out[childKey] = /buy|sell/i.test(raw) ? (side === "LONG" ? "BUY" : "SELL") : side;
          } else {
            out[childKey] = childValue;
          }
        } else {
          out[childKey] = walk(childValue, childKey);
        }
      }
      return out;
    };

    const next = walk(parsed.value);
    if (!sawPosition || !positionId) return { ok: false, body: null };
    return { ok: true, body: JSON.stringify(next) };
  };

  const closeAllDemoPositions = async () => {
    if (demoCloseAllBusy) return;
    demoCloseAllBusy = true;

    try {
      if (!learnedCloseRequest) {
        post("VEST_CLOSE_ALL_EVENT", {
          status: "needs-template",
          message: "MAKE 1 MANUAL CLOSE FIRST"
        });
        return;
      }

      const ids = [...accounts.keys()];
      post("VEST_CLOSE_ALL_EVENT", { status: "working", message: "REFRESHING" });

      for (const id of ids) await pollAccount(id, true);

      const jobs = [];
      for (const [accountId, rawPositions] of positionsByAccount.entries()) {
        for (const position of rawPositions || []) {
          if (positionIdOf(position)) jobs.push({ accountId: String(accountId), position });
        }
      }

      if (!jobs.length) {
        post("VEST_CLOSE_ALL_EVENT", {
          status: "done", total: 0, closed: 0, failed: 0, message: "ALL FLAT"
        });
        return;
      }

      let closed = 0;
      let failed = 0;
      post("VEST_CLOSE_ALL_EVENT", {
        status: "working", total: jobs.length, closed, failed,
        message: `CLOSING ${jobs.length}`
      });

      let firstError = "";

      for (const job of jobs) {
        const accountId = job.accountId;
        const position = job.position;

        try {
          const token = await mintAccountToken(accountId);
          if (accountTokens.get(accountId)?.canTrade === false) throw new Error("account cannot trade");

          const rewritten = rewriteDemoCloseBody(learnedCloseRequest.body, accountId, position);
          if (!rewritten.ok) throw new Error("could not rewrite close payload");

          const response = await nativeFetch(API + learnedCloseRequest.path, {
            method: learnedCloseRequest.method || "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: "Bearer " + token
            },
            body: rewritten.body
          });

          let detail = null;
          try { detail = await response.clone().json(); } catch (_) {
            try { detail = await response.clone().text(); } catch (_) {}
          }

          if (!response.ok) {
            const message =
              detail?.message ||
              detail?.error ||
              detail?.detail ||
              (typeof detail === "string" ? detail : "") ||
              `HTTP ${response.status}`;
            throw new Error(String(message));
          }

          closed += 1;
        } catch (error) {
          failed += 1;
          if (!firstError) firstError = String(error?.message || error || "close failed");
        }

        post("VEST_CLOSE_ALL_EVENT", {
          status: "working",
          total: jobs.length,
          closed,
          failed,
          message: failed
            ? `${closed}/${jobs.length} CLOSED · ${failed} FAILED`
            : `${closed}/${jobs.length} CLOSED`,
          detail: firstError
        });

        await sleep(90);
      }

      // Verify from Vest, not from request success. A request is only considered
      // fully flattened when a fresh opened-positions sweep returns zero.
      let remaining = 0;
      for (let pass = 0; pass < 3; pass += 1) {
        for (const id of ids) await pollAccount(id, true);
        remaining = [...positionsByAccount.values()]
          .reduce((sum, list) => sum + (Array.isArray(list) ? list.length : 0), 0);
        if (!remaining) break;
        await sleep(220 + pass * 180);
      }

      const verifiedFlat = remaining === 0;
      post("VEST_CLOSE_ALL_EVENT", {
        status: verifiedFlat ? "done" : "partial",
        total: jobs.length,
        closed,
        failed,
        remaining,
        verifiedFlat,
        message: verifiedFlat
          ? `FLAT · ${closed}/${jobs.length}`
          : `${remaining} STILL OPEN`,
        detail: firstError
      });
      emitPositions();
    } catch (_) {
      post("VEST_CLOSE_ALL_EVENT", { status: "error", message: "CLOSE ALL FAILED" });
    } finally {
      demoCloseAllBusy = false;
    }
  };

  const startUniverse = (bootstrap = false) => {
    if (!collectorEnabled) return;
    clearInterval(activeTimer);
    refreshAccounts(bootstrap);
    activeTimer = setInterval(() => refreshAccounts(false), ACTIVE_REFRESH_MS);
    startScheduler();
  };

  const stopUniverse = () => {
    clearInterval(activeTimer);
    clearTimeout(pollTimer);
    activeTimer = null;
    pollTimer = null;

    if (socketRetry) clearTimeout(socketRetry);
    socketRetry = null;

    if (socket) {
      try { socket.close(); } catch (_) {}
      socket = null;
    }
  };

  window.addEventListener("message", (event) => {
    if (event.source !== window || !event.data || !event.data.__MassivePnLControl) return;

    if (event.data.type === "CLOSE_ALL_DEMO") {
      closeAllDemoPositions();
      return;
    }

    if (event.data.type === "SET_DEMO_CLOSE_TEMPLATE") {
      const template = event.data.template;
      if (template && template.path && template.method && template.body != null) {
        learnedCloseRequest = {
          path: String(template.path),
          method: String(template.method).toUpperCase(),
          body: template.body
        };
        post("VEST_DEMO_CLOSE_READY", { ready: true });
      }
      return;
    }

    if (event.data.type === "SET_COPIER") {
      const incoming = event.data.config || {};
      copierConfig = {
        masterId: incoming.masterId ? String(incoming.masterId) : null,
        followerIds: Array.isArray(incoming.followerIds) ? [...new Set(incoming.followerIds.filter(Boolean).map(String))] : [],
        multiplier: Math.max(0.01, Math.min(100, Number(incoming.multiplier) || 1)),
        armed: Boolean(incoming.armed)
      };
      importLinks(event.data.links);
      if (copierConfig.armed) {
        copyEvent("ready", {
          masterId: copierConfig.masterId,
          followers: copierConfig.followerIds.length,
          message: "COPIER ARMED"
        });
        primeCopier();
      } else {
        copyEvent("idle", { message: "COPIER OFF" });
      }
      return;
    }

    if (event.data.type === "SET_COPIER_LINKS") {
      importLinks(event.data.links);
      return;
    }

    if (event.data.type !== "SET_COLLECTOR") return;

    const enabled = Boolean(event.data.enabled);
    if (enabled === collectorEnabled) return;
    collectorEnabled = enabled;

    if (collectorEnabled) {
      post("VEST_COLLECTOR", { enabled: true });
      if (userToken) startUniverse(true);
      else if (accounts.size) {
        startScheduler();
        bootstrapSweep();
      }
      primeCopier();
    } else {
      post("VEST_COLLECTOR", { enabled: false });
      stopUniverse();
    }
  });

  post("VEST_HOOK_READY");
})();