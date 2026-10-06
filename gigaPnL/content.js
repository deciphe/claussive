(() => {
  if (window.__GIGAPNL_CONTENT__) return;
  window.__GIGAPNL_CONTENT__ = true;

  let currentSnapshot = { positions: [], totalPnl: 0, accountCount: 0, positionCount: 0 };
  let compact = false;
  let collectorEnabled = false;
  let sessionCaptured = false;
  let hudRefs = null;
  let pipWindow = null;
  let pipRoot = null;
  let copierOpen = false;
  let copierEditing = false;
  let copierAccounts = [];
  let copierLinks = [];
  let currentAccountId = null;
  let copierConfig = { masterId: null, followerIds: [], multiplier: 1, armed: false };
  let copyEvent = { status: "idle", message: "COPIER OFF" };
  let panicState = { mode: "idle", message: "", until: 0 };
  let panicTimer = null;
  let copyHealth = { total: 0, ok: 0, failed: 0, status: "idle", detail: "" };
  let pipSize = { width: 290, height: 220 };

  const FONT_HREF = "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap";

  const ensureManrope = (doc = document) => {
    try {
      if (!doc?.head || doc.querySelector('link[data-gigapnl-font="manrope"]')) return;
      const link = doc.createElement("link");
      link.rel = "stylesheet";
      link.href = FONT_HREF;
      link.dataset.gigapnlFont = "manrope";
      doc.head.appendChild(link);
    } catch (_) {}
  };

  const esc = (v) => String(v ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");

  const money = (value) => {
    const n = Number(value) || 0;
    const sign = n > 0 ? "+" : n < 0 ? "−" : "";
    return `${sign}$${Math.abs(n).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const cleanSymbol = (symbol) => {
    if (!symbol) return "POSITION";
    return String(symbol)
      .replace(/-USD-PERP$/i, "")
      .replace(/-PERP$/i, "")
      .replace(/^NDX$/i, "NQ")
      .toUpperCase();
  };

  const shortAccount = (p) => {
    const label = String(p.accountLabel || "");
    if (label && label !== "VEST ACCOUNT") return label;
    if (Number(p.accountSize) > 0) return `${Math.round(Number(p.accountSize) / 1000)}K ACCOUNT`;
    const id = String(p.accountId || "");
    return id ? `ACCT · ${id.slice(-5)}` : "VEST ACCOUNT";
  };

  const pnlClass = (value) => Number(value) > 0 ? "pos" : Number(value) < 0 ? "neg" : "";

  const normalizeCopierConfig = (value = {}) => {
    const masterId = value.masterId ? String(value.masterId) : null;
    const followerIds = Array.isArray(value.followerIds)
      ? [...new Set(value.followerIds.filter(Boolean).map(String))].filter((id) => id !== masterId)
      : [];
    return {
      masterId,
      followerIds,
      multiplier: Math.max(0.01, Math.min(100, Number(value.multiplier) || 1)),
      armed: Boolean(value.armed)
    };
  };

  const accountTitle = (account) => {
    if (!account) return "VEST ACCOUNT";
    const label = String(account.label || "VEST ACCOUNT");
    const suffix = String(account.id || "").slice(-5);
    const size = Number(account.size);
    const sizeText = Number.isFinite(size) && size > 0 ? ` · ${Math.round(size / 1000)}K` : "";
    return `${label}${sizeText}${suffix ? ` · ${suffix}` : ""}`;
  };

  const sendCopierControl = () => {
    window.postMessage({
      __gigaPnLControl: true,
      type: "SET_COPIER",
      config: copierConfig,
      links: copierLinks
    }, "*");
  };

  const saveCopierConfig = async (next) => {
    copierConfig = normalizeCopierConfig(next);
    await chrome.storage.local.set({ gigapnlCopierConfig: copierConfig }).catch(() => {});
    sendCopierControl();
    render();
  };

  const saveCopierLinks = async (links) => {
    copierLinks = Array.isArray(links) ? links : [];
    await chrome.storage.local.set({ gigapnlCopierLinks: copierLinks }).catch(() => {});
  };

  const STYLE = `
    *{box-sizing:border-box}
    :host{font-family:'Manrope',Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}

    .gp-hud{
      --paper:#f1ede5;
      --paper2:#d9d4cc;
      --metal:#c9b894;
      --metal2:#8b7d65;
      --line:rgba(241,237,229,.085);
      --ink:#08090b;
      width:264px;
      position:relative;
      overflow:hidden;
      color:var(--paper);
      border:1px solid rgba(220,205,174,.22);
      border-radius:3px;
      background:
        radial-gradient(100% 72% at 72% 18%,rgba(211,188,142,.075),transparent 44%),
        radial-gradient(95% 52% at 30% 108%,rgba(255,255,255,.03),transparent 60%),
        linear-gradient(135deg,#151619 0%,#0d0e10 52%,#08090b 100%);
      box-shadow:0 24px 80px rgba(0,0,0,.62),inset 0 1px rgba(255,255,255,.025);
      font-family:'Manrope',Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
      user-select:none;
      -webkit-font-smoothing:antialiased;
      text-rendering:optimizeLegibility
    }
    .gp-hud:before{
      content:"";
      position:absolute;inset:-40% 20% -40% 50%;
      pointer-events:none;
      transform:rotate(13deg);
      background:linear-gradient(90deg,transparent,rgba(224,207,171,.028),rgba(255,255,255,.018),transparent);
      filter:blur(12px)
    }
    .gp-hud:after{
      content:"";
      position:absolute;
      right:-13px;bottom:-30px;
      pointer-events:none;
      color:rgba(241,237,229,.018);
      font-size:126px;
      line-height:1;
      font-weight:900;
      letter-spacing:-10px
    }

    .gp-head{
      position:relative;z-index:2;
      height:36px;
      display:flex;align-items:center;gap:6px;
      padding:0 8px 0 10px;
      border-bottom:1px solid var(--line);
      cursor:grab
    }
    .gp-head:active{cursor:grabbing}
    .gp-mark{font-size:16px;font-weight:900;letter-spacing:-1.15px;line-height:1;color:var(--paper)}
    .gp-brand{
      display:flex;align-items:center;gap:7px;
      color:rgba(241,237,229,.38);
      font-size:6.5px;font-weight:700;letter-spacing:.9px;text-transform:uppercase
    }
    .gp-brand:before{content:"";display:block;width:12px;height:1px;background:rgba(201,184,148,.42)}
    .gp-status{
      margin-left:auto;display:flex;align-items:center;justify-content:center;
      width:10px;color:rgba(241,237,229,.45)
    }
    .gp-dot{width:5px;height:5px;border-radius:50%;background:rgba(241,237,229,.15)}
    .gp-dot.live{background:#d1b77e;box-shadow:0 0 12px rgba(209,183,126,.42)}

    .gp-pop,.gp-copy-toggle,.gp-panic{
      height:24px;
      border:1px solid rgba(241,237,229,.09);
      border-radius:2px;
      background:rgba(255,255,255,.018);
      color:rgba(241,237,229,.5);
      transition:110ms ease
    }
    .gp-pop{min-width:38px;display:flex;align-items:center;justify-content:center;gap:5px;padding:0 7px;cursor:pointer;font:800 6.5px 'Manrope',Inter,sans-serif;letter-spacing:.6px}
    .gp-pop svg{width:10px;height:10px;fill:none;stroke:currentColor;stroke-width:1.35}
    .gp-pop:hover,.gp-copy-toggle:hover,.gp-copy-toggle.open,.gp-panic:hover{
      color:var(--paper);border-color:rgba(201,184,148,.35);background:rgba(201,184,148,.04)
    }
    .gp-copy-toggle{
      padding:0 7px;cursor:pointer;
      font:800 6.8px 'Manrope',Inter,sans-serif;
      letter-spacing:1px
    }
    .gp-copy-toggle.armed{color:#e5d1a7;border-color:rgba(201,184,148,.38);background:rgba(201,184,148,.06)}
    .gp-panic{
      padding:0 7px;cursor:pointer;
      font:800 6.3px 'Manrope',Inter,sans-serif;
      letter-spacing:.55px
    }
    .gp-panic.confirm{
      color:#f1d7d8;border-color:rgba(211,126,130,.5);
      background:rgba(211,126,130,.08)
    }
    .gp-panic.working{color:#e6d4ad;border-color:rgba(201,184,148,.38);pointer-events:none}
    .gp-panic.done{color:#ddd8ce;border-color:rgba(241,237,229,.18)}
    .gp-panic.error,.gp-panic.partial{color:#efb0b2;border-color:rgba(211,126,130,.45)}

    .gp-body{position:relative;z-index:1;padding:10px 10px 8px}
    .gp-topline{display:flex;align-items:center;justify-content:space-between;gap:12px}
    .gp-eyebrow{
      color:rgba(241,237,229,.42);
      font:700 6.5px 'Manrope',Inter,sans-serif;
      letter-spacing:.95px;text-transform:uppercase
    }
    .gp-feed{
      color:rgba(201,184,148,.52);
      font:700 6px 'Manrope',Inter,sans-serif;
      letter-spacing:.7px;text-transform:uppercase
    }

    .gp-total{
      margin-top:4px;
      font-size:36px;line-height:.94;
      font-weight:600;
      letter-spacing:-2px;
      font-variant-numeric:tabular-nums;
      color:var(--paper);
      text-shadow:0 7px 28px rgba(0,0,0,.34);
      transition:color 80ms linear
    }
    .gp-total.neg{color:#dca0a3}.gp-total.pos{color:#f1ede5}

    .gp-metrics{
      display:flex;align-items:center;
      margin-top:6px;
      color:rgba(241,237,229,.31);
      font:700 6.4px 'Manrope',Inter,sans-serif;
      letter-spacing:.55px;text-transform:uppercase
    }
    .gp-metrics span{display:flex;align-items:center}
    .gp-metrics span+span:before{
      content:"";width:1px;height:10px;background:rgba(241,237,229,.1);margin:0 8px
    }
    .gp-metrics b{
      margin-right:5px;color:rgba(241,237,229,.88);
      font-size:9px;font-weight:800;letter-spacing:-.15px
    }

    .gp-rows{
      max-height:112px;overflow:auto;
      margin-top:8px;
      border-top:1px solid var(--line);
      scrollbar-width:thin;scrollbar-color:rgba(201,184,148,.14) transparent
    }
    .gp-rows::-webkit-scrollbar{width:3px}
    .gp-rows::-webkit-scrollbar-thumb{background:rgba(201,184,148,.14)}
    .gp-row{
      display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:center;
      min-height:34px;padding:5px 0;
      border-bottom:1px solid rgba(241,237,229,.052)
    }
    .gp-trade{min-width:0}
    .gp-account{
      overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
      margin-bottom:1px;
      color:rgba(241,237,229,.31);
      font:700 6.2px 'Manrope',Inter,sans-serif;
      letter-spacing:.55px;text-transform:uppercase
    }
    .gp-instrument{display:flex;align-items:baseline;gap:8px;min-width:0}
    .gp-instrument strong{
      color:var(--paper);font-size:11px;font-weight:800;letter-spacing:-.3px
    }
    .gp-instrument span{
      color:rgba(241,237,229,.43);
      font:700 6.2px 'Manrope',Inter,sans-serif;
      letter-spacing:.45px;white-space:nowrap
    }
    .gp-instrument i{font-style:normal;color:rgba(201,184,148,.58)}
    .gp-pnl{
      color:rgba(241,237,229,.9);
      font-size:11px;font-weight:700;letter-spacing:-.35px;
      font-variant-numeric:tabular-nums;white-space:nowrap
    }
    .gp-pnl.neg{color:#d89b9e}.gp-pnl.pos{color:#eee9e0}

    .gp-empty{
      min-height:34px;
      display:flex;align-items:center;justify-content:space-between;
      color:rgba(241,237,229,.26);
      font:700 7px 'Manrope',Inter,sans-serif;
      letter-spacing:1px;text-transform:uppercase
    }
    .gp-empty:before{content:"";display:block;width:20px;height:1px;background:rgba(201,184,148,.3)}
    .gp-empty:after{content:"FLAT";color:rgba(201,184,148,.45);letter-spacing:1.1px}

    .gp-foot{
      display:flex;align-items:center;justify-content:space-between;
      padding-top:6px;
      color:rgba(241,237,229,.2);
      font:700 6px 'Manrope',Inter,sans-serif;
      letter-spacing:.6px;text-transform:uppercase
    }
    .gp-foot .gold{color:rgba(201,184,148,.55)}

    .gp-account-strip{
      display:flex;gap:5px;overflow:hidden;
      margin-top:6px;padding-top:6px;
      border-top:1px solid rgba(241,237,229,.055)
    }
    .gp-account-strip span{
      min-width:0;display:flex;align-items:center;gap:4px;
      padding-right:6px;border-right:1px solid rgba(241,237,229,.055);
      white-space:nowrap
    }
    .gp-account-strip span:last-child{border-right:0}
    .gp-account-strip i{
      max-width:52px;overflow:hidden;text-overflow:ellipsis;
      color:rgba(241,237,229,.24);font-style:normal;
      font:700 5.8px 'Manrope',Inter,sans-serif;letter-spacing:.35px
    }
    .gp-account-strip b{
      color:rgba(241,237,229,.72);
      font:700 6.5px 'Manrope',Inter,sans-serif;
      font-variant-numeric:tabular-nums
    }
    .gp-account-strip b.neg{color:#ce9295}.gp-account-strip b.pos{color:#e6e1d8}
    .gp-micro-meta{display:none}
    .tick-up{animation:gpUp 160ms ease-out}.tick-down{animation:gpDown 160ms ease-out}
    @keyframes gpUp{0%{text-shadow:0 0 0 rgba(201,184,148,0)}45%{text-shadow:0 0 10px rgba(201,184,148,.36)}100%{text-shadow:none}}
    @keyframes gpDown{0%{text-shadow:0 0 0 rgba(208,126,130,0)}45%{text-shadow:0 0 10px rgba(208,126,130,.32)}100%{text-shadow:none}}

    .gp-copy-panel{
      margin-top:16px;padding:11px 11px 10px;
      border:1px solid rgba(201,184,148,.16);border-radius:2px;
      background:linear-gradient(135deg,rgba(201,184,148,.035),rgba(255,255,255,.008))
    }
    .gp-copy-head{
      display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;
      color:rgba(241,237,229,.52);
      font:800 7px 'Manrope',Inter,sans-serif;letter-spacing:.85px
    }
    .gp-arm{
      height:23px;padding:0 10px;
      border-radius:2px;border:1px solid rgba(241,237,229,.1);
      background:transparent;color:rgba(241,237,229,.48);cursor:pointer;
      font:800 7px 'Manrope',Inter,sans-serif;letter-spacing:1px
    }
    .gp-arm.armed{border-color:rgba(201,184,148,.4);color:#e5d1a7;background:rgba(201,184,148,.055)}
    .gp-copy-field{display:grid;grid-template-columns:54px 1fr;align-items:center;gap:8px;margin-bottom:9px}
    .gp-copy-field>span,.gp-follow-head>span,.gp-mult>span{
      color:rgba(241,237,229,.28);
      font:700 7px 'Manrope',Inter,sans-serif;
      letter-spacing:1px;text-transform:uppercase
    }
    .gp-copy-select{
      width:100%;height:29px;padding:0 7px;
      color:rgba(241,237,229,.8);outline:none;
      border:1px solid rgba(241,237,229,.08);border-radius:2px;background:#111214;
      font:700 7.1px 'Manrope',Inter,sans-serif
    }
    .gp-follow-head{display:flex;align-items:center;margin:4px 0 5px}.gp-follow-head>span{margin-right:auto}
    .gp-mini{
      border:0;background:transparent;color:rgba(201,184,148,.6);cursor:pointer;padding:2px 4px;
      font:800 6.3px 'Manrope',Inter,sans-serif;letter-spacing:.75px
    }
    .gp-followers{
      max-height:112px;overflow:auto;
      border-top:1px solid rgba(241,237,229,.045);border-bottom:1px solid rgba(241,237,229,.045)
    }
    .gp-follow{
      display:flex;align-items:center;gap:8px;min-height:28px;padding:4px 1px;
      color:rgba(241,237,229,.54);
      border-bottom:1px solid rgba(241,237,229,.035);
      font:700 7px 'Manrope',Inter,sans-serif
    }
    .gp-follow:last-child{border-bottom:0}.gp-follow.disabled{opacity:.28}
    .gp-follow input{width:12px;height:12px;margin:0;accent-color:#c5ae7e}
    .gp-follow em{margin-left:auto;font-style:normal;color:rgba(241,237,229,.18);font-size:7px;font-weight:800}
    .gp-noaccounts{padding:10px 0;color:rgba(241,237,229,.25);font:700 7px 'Manrope',Inter,sans-serif;letter-spacing:.6px}
    .gp-mult{display:grid;grid-template-columns:1fr 54px 10px;align-items:center;gap:5px;margin-top:8px}
    .gp-mult input{
      height:25px;width:54px;padding:0 6px;text-align:right;
      color:rgba(241,237,229,.8);outline:none;
      border:1px solid rgba(241,237,229,.08);border-radius:2px;background:#111214;
      font:700 7.1px 'Manrope',Inter,sans-serif
    }
    .gp-mult b{color:rgba(201,184,148,.52);font-size:9px;font-weight:700}
    .gp-copy-status{
      margin-top:8px;padding-top:7px;border-top:1px solid rgba(241,237,229,.05);
      white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
      color:rgba(241,237,229,.32);
      font:700 7px 'Manrope',Inter,sans-serif;letter-spacing:.75px;text-transform:uppercase
    }
    .gp-copy-status.success,.gp-copy-status.done,.gp-copy-status.ready{color:rgba(201,184,148,.75)}
    .gp-copy-status.error,.gp-copy-status.partial{color:#d18c8f}

    .gp-hud.compact{width:176px}
    .gp-hud.compact .gp-head{height:30px;border-bottom:0}
    .gp-hud.compact .gp-pop,.gp-hud.compact .gp-status,.gp-hud.compact .gp-copy-toggle,.gp-hud.compact .gp-brand{display:none}
    .gp-hud.compact .gp-body{padding:5px 9px 7px}
    .gp-hud.compact .gp-topline,.gp-hud.compact .gp-metrics,.gp-hud.compact .gp-rows,.gp-hud.compact .gp-foot,.gp-hud.compact .gp-account-strip{display:none}
    .gp-hud.compact .gp-total{margin:0;font-size:23px;letter-spacing:-1.2px}
    .gp-hud.compact .gp-micro-meta{
      display:block;margin-top:2px;color:rgba(241,237,229,.3);
      font:700 6px 'Manrope',Inter,sans-serif;letter-spacing:.65px
    }

    .gp-pip{
      width:100%;min-height:100%;
      border:0;border-radius:0;box-shadow:none;
      background:
        radial-gradient(105% 70% at 68% 18%,rgba(211,188,142,.065),transparent 46%),
        linear-gradient(135deg,#121316 0%,#0b0c0e 58%,#07080a 100%)
    }
    .gp-pip:after{right:-12px;bottom:-36px;font-size:136px}
    .gp-pip .gp-head{cursor:default;height:32px;padding:0 9px}
    .gp-pip .gp-mark{font-size:15px}
    .gp-pip .gp-brand{font-size:6px;letter-spacing:.8px}
    .gp-pip .gp-pop{display:none}
    .gp-pip .gp-body{padding:8px 9px 7px}
    .gp-pip .gp-total{font-size:35px;margin-top:3px}
    .gp-pip .gp-metrics{margin-top:5px}
    .gp-pip .gp-account-strip{margin-top:5px;padding-top:5px}
    .gp-pip .gp-rows{max-height:104px;margin-top:7px}
    .gp-pip .gp-row{min-height:33px;padding:4px 0}
    .gp-pip .gp-foot{display:none}
  `;

  const positionKey = (p, index = 0) => {
    const account = p?.accountId || p?.accountLabel || "account";
    const position = p?.positionId || p?.symbol || index;
    return `${account}::${position}::${p?.side || ""}`;
  };

  const accountGroups = () => {
    const groups = new Map();
    for (const p of currentSnapshot.positions || []) {
      const id = String(p.accountId || p.accountLabel || "account");
      const existing = groups.get(id) || { id, label: shortAccount(p), pnl: 0 };
      existing.pnl += Number(p.pnl) || 0;
      groups.set(id, existing);
    }
    return [...groups.values()].slice(0, 5);
  };

  const accountStripMarkup = () => {
    const groups = accountGroups();
    if (!groups.length) return "";
    return `<div class="gp-account-strip">${groups.map((g) =>
      `<span data-gp-account="${esc(g.id)}" title="${esc(g.label)}"><i>${esc(g.label.replace(/ ACCOUNT$/i,""))}</i><b class="${pnlClass(g.pnl)}">${money(g.pnl)}</b></span>`
    ).join("")}</div>`;
  };

  const rowsMarkup = () => {
    const positions = currentSnapshot.positions || [];
    if (!positions.length) {
      const text = sessionCaptured || currentSnapshot.accountCount ? "NO OPEN POSITIONS" : "SYNCING VEST";
      return `<div class="gp-empty">${text}</div>`;
    }
    return positions.map((p, index) => {
      const pnl = Number(p.pnl) || 0;
      const qty = Number.isFinite(Number(p.size)) && Number(p.size) !== 0
        ? `<i>· ${esc(Math.abs(Number(p.size)))}</i>` : "";
      return `
        <div class="gp-row" data-gp-key="${esc(positionKey(p, index))}">
          <div class="gp-trade">
            <div class="gp-instrument"><strong>${esc(cleanSymbol(p.symbol))}</strong><span>${esc(String(p.side || "").toUpperCase())} ${qty}</span></div>
            <div class="gp-account">${esc(shortAccount(p))}</div>
          </div>
          <div class="gp-pnl ${pnlClass(pnl)}">${money(pnl)}</div>
        </div>`;
    }).join("");
  };

  const copierPanelMarkup = () => {
    if (!copierOpen) return "";
    const master = copierConfig.masterId || "";
    const options = [
      `<option value="">SELECT MASTER</option>`,
      ...copierAccounts.map((account) => {
        const disabled = account.canTrade === false ? " disabled" : "";
        const selected = String(account.id) === String(master) ? " selected" : "";
        return `<option value="${esc(account.id)}"${selected}${disabled}>${esc(accountTitle(account))}</option>`;
      })
    ].join("");

    const followers = copierAccounts.length ? copierAccounts.map((account) => {
      const id = String(account.id || "");
      const isMaster = id === String(master);
      const disabled = isMaster || account.canTrade === false;
      const checked = copierConfig.followerIds.includes(id) && !disabled;
      return `<label class="gp-follow ${disabled ? "disabled" : ""}">
        <input type="checkbox" data-follower="${esc(id)}" ${checked ? "checked" : ""} ${disabled ? "disabled" : ""}>
        <span>${esc(accountTitle(account))}</span>
        <em>${isMaster ? "MASTER" : account.canTrade === false ? "LOCKED" : ""}</em>
      </label>`;
    }).join("") : `<div class="gp-noaccounts">SYNCING ACTIVE ACCOUNT ROSTER</div>`;

    const status = esc(copyEvent.message || (copierConfig.armed ? "COPIER ARMED" : "COPIER OFF"));
    return `
      <div class="gp-copy-panel">
        <div class="gp-copy-head"><span>VEST MULTI COPIER</span><button class="gp-arm ${copierConfig.armed ? "armed" : ""}" type="button">${copierConfig.armed ? "ARMED" : "ARM"}</button></div>
        <label class="gp-copy-field"><span>MASTER</span><select class="gp-copy-select">${options}</select></label>
        <div class="gp-follow-head"><span>FOLLOWERS</span><button class="gp-mini" type="button" data-copy-all>ALL</button><button class="gp-mini" type="button" data-copy-none>NONE</button></div>
        <div class="gp-followers">${followers}</div>
        <label class="gp-mult"><span>SIZE MULTIPLIER</span><input class="gp-mult-input" type="number" min="0.01" max="100" step="0.05" value="${esc(copierConfig.multiplier)}"><b>×</b></label>
        <div class="gp-copy-status ${esc(copyEvent.status || "idle")}">${status}</div>
      </div>`;
  };

  const panicLabel = () => {
    if (panicState.mode === "confirm" && Date.now() < panicState.until) return "CONFIRM";
    if (panicState.mode === "working") return panicState.message || "CLOSING";
    if (panicState.mode === "partial") return panicState.message || "PARTIAL";
    if (panicState.mode === "error" || panicState.mode === "needs-template") return panicState.message || "ERROR";
    if (panicState.mode === "done") return panicState.message || "FLAT";
    return "CLOSE ALL";
  };

  const copyButtonLabel = () => {
    if (!copierConfig.armed) return "COPY";
    const total = copyHealth.total || copierConfig.followerIds.length;
    const ok = copyHealth.status === "idle" ? total : Math.max(0, total - (copyHealth.failed || 0));
    return total ? `COPY ${ok}/${total}` : "COPY";
  };

  const panelMarkup = (isPip = false) => {
    const total = Number(currentSnapshot.totalPnl) || 0;
    const accounts = Number(currentSnapshot.accountCount) || 0;
    const positions = Number(currentSnapshot.positionCount) || (currentSnapshot.positions || []).length;
    return `
      <div class="gp-hud ${compact && !isPip ? "compact" : ""} ${isPip ? "gp-pip" : ""}">
        <div class="gp-head">
          <div class="gp-mark">GP.</div>
          <div class="gp-brand">gigaPnL</div>
          <div class="gp-status" title="${sessionCaptured ? "Vest live" : "Waiting for Vest"}"><span class="gp-dot ${sessionCaptured ? "live" : ""}"></span></div>
          <button class="gp-panic ${esc(panicState.mode)}" title="${esc(panicState.detail || "Emergency close all demo positions")}">${esc(panicLabel())}</button>
          ${isPip ? "" : `<button class="gp-copy-toggle ${copierOpen ? "open" : ""} ${copierConfig.armed ? "armed" : ""}" title="${esc(copyHealth.detail || "Vest multi-account copier")}">${esc(copyButtonLabel())}</button>
          <button class="gp-pop" title="Pop out over all tabs and Windows">
            <span>POP</span>
            <svg viewBox="0 0 16 16"><path d="M5.5 2.5h8v8M13.5 2.5l-7 7M10.5 13.5h-8v-8"/></svg>
          </button>`}
        </div>
        <div class="gp-body">
          <div class="gp-topline"><div class="gp-eyebrow">LIVE PNL</div><div class="gp-feed">${collectorEnabled ? "MASTER" : "MIRROR"}</div></div>
          <div class="gp-total ${pnlClass(total)}" data-gp-total>${money(total)}</div>
          <div class="gp-metrics"><span><b data-gp-accounts>${accounts}</b> ACCOUNTS</span><span><b data-gp-positions>${positions}</b> OPEN</span></div>
          <div class="gp-micro-meta"><span data-gp-micro-open>${positions}</span> OPEN</div>
          ${accountStripMarkup()}
          ${isPip ? "" : copierPanelMarkup()}
          <div class="gp-rows">${rowsMarkup()}</div>
          <div class="gp-foot"><span>VEST</span><span class="gold">GP.</span></div>
        </div>
      </div>`;
  };

  const fastUpdateRoot = (root) => {
    if (!root) return false;
    const totalEl = root.querySelector("[data-gp-total]");
    const accountEl = root.querySelector("[data-gp-accounts]");
    const positionEl = root.querySelector("[data-gp-positions]");
    const microOpenEl = root.querySelector("[data-gp-micro-open]");
    const rowEls = [...root.querySelectorAll("[data-gp-key]")];
    const positions = currentSnapshot.positions || [];
    if (!totalEl || !accountEl || !positionEl || rowEls.length !== positions.length) return false;

    for (let i = 0; i < positions.length; i++) {
      const p = positions[i];
      const row = rowEls[i];
      if (row.dataset.gpKey !== positionKey(p, i)) return false;
      const pnlEl = row.querySelector(".gp-pnl");
      if (!pnlEl) return false;
      const pnl = Number(p.pnl) || 0;
      const prev = Number(pnlEl.dataset.gpValue);
      pnlEl.textContent = money(pnl);
      pnlEl.className = `gp-pnl ${pnlClass(pnl)}`;
      pnlEl.dataset.gpValue = String(pnl);
      if (Number.isFinite(prev) && prev !== pnl) {
        pnlEl.classList.add(pnl > prev ? "tick-up" : "tick-down");
        setTimeout(() => pnlEl.classList.remove("tick-up", "tick-down"), 160);
      }
    }

    const total = Number(currentSnapshot.totalPnl) || 0;
    const prevTotal = Number(totalEl.dataset.gpValue);
    totalEl.textContent = money(total);
    totalEl.className = `gp-total ${pnlClass(total)}`;
    totalEl.dataset.gpValue = String(total);
    if (Number.isFinite(prevTotal) && prevTotal !== total) {
      totalEl.classList.add(total > prevTotal ? "tick-up" : "tick-down");
      setTimeout(() => totalEl.classList.remove("tick-up", "tick-down"), 160);
    }
    accountEl.textContent = String(Number(currentSnapshot.accountCount) || 0);
    const openCount = String(Number(currentSnapshot.positionCount) || positions.length);
    positionEl.textContent = openCount;
    if (microOpenEl) microOpenEl.textContent = openCount;

    const groupEls = [...root.querySelectorAll("[data-gp-account]")];
    const groups = accountGroups();
    if (groupEls.length === groups.length) {
      for (let i = 0; i < groups.length; i++) {
        const el = groupEls[i];
        const group = groups[i];
        if (el.dataset.gpAccount !== group.id) break;
        const b = el.querySelector("b");
        if (b) {
          b.textContent = money(group.pnl);
          b.className = pnlClass(group.pnl);
        }
      }
    }
    return true;
  };

  const refreshLive = () => {
    const mainOk = copierEditing ? true : fastUpdateRoot(hudRefs?.root);
    const pipOk = fastUpdateRoot(pipRoot);
    if (!mainOk && !copierEditing) {
      render();
      return;
    }
    if (!pipOk && pipRoot) renderPip();
  };

  const resetPanicSoon = (ms = 2200) => {
    clearTimeout(panicTimer);
    panicTimer = setTimeout(() => {
      panicState = { mode: "idle", message: "", until: 0 };
      render();
    }, ms);
  };

  const triggerPanic = () => {
    const now = Date.now();

    if (panicState.mode === "working") return;

    if (panicState.mode === "confirm" && now < panicState.until) {
      panicState = { mode: "working", message: "CLOSING", until: 0 };
      if (copierConfig.armed) {
        copierConfig = normalizeCopierConfig({ ...copierConfig, armed: false });
        chrome.storage.local.set({ gigapnlCopierConfig: copierConfig }).catch(() => {});
        sendCopierControl();
      }
      window.postMessage({ __gigaPnLControl: true, type: "CLOSE_ALL_DEMO" }, "*");
      render();
      return;
    }

    panicState = { mode: "confirm", message: "CONFIRM", until: now + 2400 };
    clearTimeout(panicTimer);
    panicTimer = setTimeout(() => {
      if (panicState.mode === "confirm" && Date.now() >= panicState.until) {
        panicState = { mode: "idle", message: "", until: 0 };
        render();
      }
    }, 2450);
    render();
  };

  const wirePanic = (root) => {
    if (!root) return;
    const button = root.querySelector(".gp-panic");
    if (button) button.addEventListener("click", (event) => {
      event.stopPropagation();
      triggerPanic();
    });
  };

  const renderPip = () => {
    if (!pipRoot || !pipWindow || pipWindow.closed) return;
    pipRoot.innerHTML = panelMarkup(true);
    wirePanic(pipRoot);
  };

  const wireCopier = () => {
    if (!hudRefs?.root) return;
    const root = hudRefs.root;
    const toggle = root.querySelector(".gp-copy-toggle");
    const panel = root.querySelector(".gp-copy-panel");
    const masterSelect = root.querySelector(".gp-copy-select");
    const arm = root.querySelector(".gp-arm");
    const all = root.querySelector("[data-copy-all]");
    const none = root.querySelector("[data-copy-none]");
    const multiplier = root.querySelector(".gp-mult-input");

    if (toggle) toggle.addEventListener("click", (event) => {
      event.stopPropagation();
      copierOpen = !copierOpen;
      chrome.storage.local.set({ gigapnlCopierOpen: copierOpen }).catch(() => {});
      render();
    });

    if (panel) {
      panel.addEventListener("focusin", () => { copierEditing = true; });
      panel.addEventListener("focusout", () => {
        setTimeout(() => {
          const active = hudRefs?.root?.getRootNode()?.activeElement || null;
          if (!active || !panel.contains(active)) {
            copierEditing = false;
            render();
          }
        }, 0);
      });
    }

    if (masterSelect) masterSelect.addEventListener("change", () => {
      const masterId = masterSelect.value || null;
      saveCopierConfig({
        ...copierConfig,
        masterId,
        followerIds: copierConfig.followerIds.filter((id) => id !== masterId)
      });
    });

    root.querySelectorAll("[data-follower]").forEach((input) => {
      input.addEventListener("change", () => {
        const id = String(input.dataset.follower || "");
        const followers = new Set(copierConfig.followerIds);
        if (input.checked) followers.add(id); else followers.delete(id);
        saveCopierConfig({ ...copierConfig, followerIds: [...followers] });
      });
    });

    if (all) all.addEventListener("click", () => {
      const masterId = copierConfig.masterId;
      const followerIds = copierAccounts
        .filter((account) => String(account.id) !== String(masterId || "") && account.canTrade !== false)
        .map((account) => String(account.id));
      saveCopierConfig({ ...copierConfig, followerIds });
    });

    if (none) none.addEventListener("click", () => saveCopierConfig({ ...copierConfig, followerIds: [] }));

    if (multiplier) multiplier.addEventListener("change", () => {
      saveCopierConfig({ ...copierConfig, multiplier: Number(multiplier.value) || 1 });
    });

    if (arm) arm.addEventListener("click", () => {
      let masterId = copierConfig.masterId;
      if (!masterId && currentAccountId) masterId = currentAccountId;
      const followerIds = copierConfig.followerIds.filter((id) => id !== masterId);
      if (!copierConfig.armed && (!masterId || !followerIds.length)) {
        copyEvent = { status: "error", message: "SELECT MASTER + FOLLOWER" };
        render();
        return;
      }
      saveCopierConfig({ ...copierConfig, masterId, followerIds, armed: !copierConfig.armed });
    });
  };

  const render = () => {
    if (!hudRefs) return;
    hudRefs.root.innerHTML = panelMarkup(false);
    const head = hudRefs.root.querySelector(".gp-head");
    const pop = hudRefs.root.querySelector(".gp-pop");
    wireDrag(head);
    wireCopier();
    wirePanic(hudRefs.root);
    if (pop) pop.addEventListener("click", (e) => { e.stopPropagation(); openPip(); });
    if (head) head.addEventListener("dblclick", toggleCompact);
    renderPip();
  };

  const toggleCompact = async () => {
    compact = !compact;
    await chrome.storage.local.set({ gigapnlCompact: compact }).catch(() => {});
    render();
  };

  let dragState = null;
  const wireDrag = (head) => {
    if (!head || !hudRefs?.host) return;
    head.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || event.target.closest(".gp-pop,.gp-copy-toggle,.gp-panic")) return;
      const host = hudRefs.host;
      dragState = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        left: parseFloat(host.style.left) || 0,
        top: parseFloat(host.style.top) || 0
      };
      head.setPointerCapture(event.pointerId);
    });
    head.addEventListener("pointermove", (event) => {
      if (!dragState || dragState.id !== event.pointerId) return;
      const host = hudRefs.host;
      const rect = host.getBoundingClientRect();
      const x = Math.max(0, Math.min(window.innerWidth - rect.width, dragState.left + event.clientX - dragState.x));
      const y = Math.max(0, Math.min(window.innerHeight - rect.height, dragState.top + event.clientY - dragState.y));
      host.style.left = x + "px";
      host.style.top = y + "px";
    });
    head.addEventListener("pointerup", async (event) => {
      if (!dragState || dragState.id !== event.pointerId) return;
      const host = hudRefs.host;
      dragState = null;
      try { head.releasePointerCapture(event.pointerId); } catch (_) {}
      await chrome.storage.local.set({
        gigapnlPosition: { x: parseFloat(host.style.left) || 0, y: parseFloat(host.style.top) || 0 }
      }).catch(() => {});
    });
  };

  const openPip = async () => {
    try {
      if (pipWindow && !pipWindow.closed) {
        pipWindow.focus();
        return;
      }
      if (!window.documentPictureInPicture?.requestWindow) return;

      pipWindow = await window.documentPictureInPicture.requestWindow({
        width: Math.max(220, Math.min(520, Number(pipSize.width) || 290)),
        height: Math.max(150, Math.min(420, Number(pipSize.height) || 220))
      });
      pipWindow.document.title = "gigaPnL";
      ensureManrope(pipWindow.document);
      pipWindow.document.documentElement.style.background = "#09090b";
      pipWindow.document.body.style.cssText = "margin:0;background:#09090b;overflow:hidden";
      const style = pipWindow.document.createElement("style");
      style.textContent = STYLE;
      pipWindow.document.head.appendChild(style);
      pipRoot = pipWindow.document.createElement("div");
      pipWindow.document.body.appendChild(pipRoot);
      renderPip();
      pipWindow.document.fonts?.ready?.then(() => renderPip()).catch(() => {});
      const rememberPipSize = () => {
        pipSize = {
          width: Math.round(pipWindow?.innerWidth || pipSize.width),
          height: Math.round(pipWindow?.innerHeight || pipSize.height)
        };
        chrome.storage.local.set({ gigapnlPipSize: pipSize }).catch(() => {});
      };
      pipWindow.addEventListener("resize", rememberPipSize);
      pipWindow.addEventListener("pagehide", () => {
        rememberPipSize();
        pipWindow = null;
        pipRoot = null;
      });
    } catch (_) {}
  };

  const setCollector = (enabled) => {
    collectorEnabled = Boolean(enabled);
    window.postMessage({ __gigaPnLControl: true, type: "SET_COLLECTOR", enabled: collectorEnabled }, "*");
    render();
  };

  const setupHud = async () => {
    if (!document.documentElement || document.getElementById("gigapnl-root")) return;
    ensureManrope(document);
    const host = document.createElement("div");
    host.id = "gigapnl-root";
    host.style.cssText = "all:initial;position:fixed;z-index:2147483647;left:18px;top:88px;";
    const shadow = host.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = STYLE;
    shadow.appendChild(style);
    const root = document.createElement("div");
    shadow.appendChild(root);
    document.documentElement.appendChild(host);
    hudRefs = { host, root };

    const saved = await chrome.storage.local.get([
      "gigapnlPosition",
      "gigapnlCompact",
      "gigapnlCopierConfig",
      "gigapnlCopierLinks",
      "gigapnlAccountUniverse",
      "gigapnlDemoCloseTemplate",
      "gigapnlPipSize",
      "gigapnlCopierOpen"
    ]).catch(() => ({}));
    if (saved.gigapnlPosition) {
      host.style.left = saved.gigapnlPosition.x + "px";
      host.style.top = saved.gigapnlPosition.y + "px";
    }
    compact = Boolean(saved.gigapnlCompact);
    copierOpen = Boolean(saved.gigapnlCopierOpen);
    copierConfig = normalizeCopierConfig(saved.gigapnlCopierConfig || copierConfig);
    copierLinks = Array.isArray(saved.gigapnlCopierLinks) ? saved.gigapnlCopierLinks : [];
    copierAccounts = Array.isArray(saved.gigapnlAccountUniverse) ? saved.gigapnlAccountUniverse : [];
    if (saved.gigapnlPipSize) {
      pipSize = {
        width: Number(saved.gigapnlPipSize.width) || 290,
        height: Number(saved.gigapnlPipSize.height) || 220
      };
    }
    if (saved.gigapnlDemoCloseTemplate) {
      window.postMessage({
        __gigaPnLControl: true,
        type: "SET_DEMO_CLOSE_TEMPLATE",
        template: saved.gigapnlDemoCloseTemplate
      }, "*");
    }

    chrome.runtime.onMessage.addListener((message) => {
      if (message?.type === "GIGAPNL_SNAPSHOT") {
        currentSnapshot = message.data || currentSnapshot;
        refreshLive();
      }
      if (message?.type === "GIGAPNL_COLLECTOR_STATUS") setCollector(message.enabled);
    });

    chrome.runtime.sendMessage({ type: "GIGAPNL_REGISTER_TAB" }, (reply) => {
      if (chrome.runtime.lastError) return;
      if (reply?.snapshot) currentSnapshot = reply.snapshot;
      setCollector(Boolean(reply?.collector));
      sendCopierControl();
    });

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      let needsRender = false;
      if (changes.gigapnlCopierConfig) {
        copierConfig = normalizeCopierConfig(changes.gigapnlCopierConfig.newValue || {});
        sendCopierControl();
        needsRender = true;
      }
      if (changes.gigapnlCopierLinks) {
        copierLinks = Array.isArray(changes.gigapnlCopierLinks.newValue) ? changes.gigapnlCopierLinks.newValue : [];
        window.postMessage({ __gigaPnLControl: true, type: "SET_COPIER_LINKS", links: copierLinks }, "*");
      }
      if (changes.gigapnlAccountUniverse) {
        copierAccounts = Array.isArray(changes.gigapnlAccountUniverse.newValue) ? changes.gigapnlAccountUniverse.newValue : [];
        needsRender = true;
      }
      if (needsRender && !copierEditing) render();
    });

    sendCopierControl();
    render();
  };

  window.addEventListener("message", (event) => {
    if (event.source !== window || !event.data?.__gigaPnL) return;

    if (event.data.type === "VEST_HOOK_READY") {
      sendCopierControl();
      chrome.storage.local.get(["gigapnlDemoCloseTemplate"]).then((saved) => {
        if (saved.gigapnlDemoCloseTemplate) {
          window.postMessage({
            __gigaPnLControl: true,
            type: "SET_DEMO_CLOSE_TEMPLATE",
            template: saved.gigapnlDemoCloseTemplate
          }, "*");
        }
      }).catch(() => {});
      return;
    }

    if (event.data.type === "VEST_SESSION_CAPTURED") {
      sessionCaptured = true;
      chrome.runtime.sendMessage({ type: "GIGAPNL_SESSION_READY" });
      render();
      return;
    }

    if (event.data.type === "VEST_ACCOUNT_CAPTURED") {
      sessionCaptured = true;
      currentAccountId = event.data.accountId ? String(event.data.accountId) : currentAccountId;
      if (!copierConfig.masterId && currentAccountId) {
        saveCopierConfig({ ...copierConfig, masterId: currentAccountId });
      } else if (!copierEditing) {
        render();
      }
      return;
    }

    if (event.data.type === "VEST_UNIVERSE") {
      sessionCaptured = true;
      currentSnapshot = { ...currentSnapshot, accountCount: Number(event.data.accountCount) || 0 };
      if (Array.isArray(event.data.accounts)) {
        copierAccounts = event.data.accounts;
        chrome.storage.local.set({ gigapnlAccountUniverse: copierAccounts }).catch(() => {});
      }
      if (!copierEditing) render();
      return;
    }

    if (event.data.type === "VEST_COPIER_LINKS") {
      saveCopierLinks(event.data.links);
      return;
    }

    if (event.data.type === "VEST_COPY_EVENT") {
      copyEvent = {
        status: String(event.data.status || "idle"),
        message: String(event.data.message || "COPIER")
      };
      const total = Number(event.data.followers);
      const failed = Number(event.data.failed);
      if (Number.isFinite(total) && total >= 0) copyHealth.total = total;
      if (["ready", "idle"].includes(copyEvent.status)) copyHealth.failed = 0;
      if (Number.isFinite(failed) && failed >= 0) copyHealth.failed = failed;
      copyHealth.ok = Math.max(0, (copyHealth.total || copierConfig.followerIds.length) - (copyHealth.failed || 0));
      copyHealth.status = copyEvent.status;
      copyHealth.detail = copyEvent.message;
      if (!copierEditing) render();
      return;
    }

    if (event.data.type === "VEST_DEMO_CLOSE_TEMPLATE") {
      if (event.data.template) {
        chrome.storage.local.set({ gigapnlDemoCloseTemplate: event.data.template }).catch(() => {});
      }
      return;
    }

    if (event.data.type === "VEST_DEMO_CLOSE_READY") {
      if (panicState.mode === "needs-template") {
        panicState = { mode: "idle", message: "", until: 0 };
        render();
      }
      return;
    }

    if (event.data.type === "VEST_CLOSE_ALL_EVENT") {
      panicState = {
        mode: String(event.data.status || "idle"),
        message: String(event.data.message || ""),
        detail: String(event.data.detail || ""),
        remaining: Number(event.data.remaining) || 0,
        verifiedFlat: Boolean(event.data.verifiedFlat),
        until: 0
      };
      render();
      if (["done", "partial", "error", "needs-template"].includes(panicState.mode)) {
        resetPanicSoon(panicState.mode === "needs-template" ? 4200 : 2600);
      }
      return;
    }

    if (event.data.type === "VEST_POSITIONS") {
      sessionCaptured = true;
      if (!collectorEnabled) return;
      chrome.runtime.sendMessage({
        type: "GIGAPNL_POSITIONS_UPDATE",
        positions: Array.isArray(event.data.positions) ? event.data.positions : [],
        accountCount: Number(event.data.accountCount) || 0
      });
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.shiftKey && event.code === "Period") {
      event.preventDefault();
      if (pipWindow && !pipWindow.closed) {
        pipWindow.focus();
        return;
      }
      toggleCompact();
      return;
    }

    if (event.ctrlKey && event.shiftKey && event.code === "Backspace") {
      event.preventDefault();
      panicState = { mode: "confirm", message: "CONFIRM", until: Date.now() + 2400 };
      clearTimeout(panicTimer);
      panicTimer = setTimeout(() => {
        if (panicState.mode === "confirm" && Date.now() >= panicState.until) {
          panicState = { mode: "idle", message: "", until: 0 };
          render();
        }
      }, 2450);
      if (pipWindow && !pipWindow.closed) pipWindow.focus();
      render();
    }
  });

  const boot = () => setupHud();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();

  window.addEventListener("pagehide", () => {
    try { chrome.runtime.sendMessage({ type: "GIGAPNL_CLEAR_TAB" }); } catch (_) {}
  });
})();