# MassivePnL

An ultra-clean **live Vest portfolio PnL HUD** styled after the massiveprop leaderboard.

## v0.4

MassivePnL now treats one Vest login as one portfolio:

- Discovers **every active Vest account** from `/v3/capital/accounts/active`.
- Uses short-lived per-account tokens only in the Vest page context.
- Reads open positions from every active account.
- Keeps one shared Vest ticker WebSocket for tick-by-tick mark prices.
- Calculates and combines the live PnL of **all open trades on all active accounts**.
- Elects one Vest browser tab as the collector so multiple Vest tabs do not multiply API traffic.
- Immediately refreshes affected accounts after Vest order requests.
- Displays account count, open-trade count, individual position PnL and total portfolio PnL.
- Deduplicates positions across Vest tabs.
- Adds a **Vest multi-account copier** directly inside the MassivePnL HUD.
- Pick one master account and any number of followers.
- Copy Vest position open / append / reduce / close / cancel / stop-loss / take-profit requests.
- Apply a follower size multiplier from **0.01× to 100×**.
- Rebuild master→follower position mappings from live open positions so closes/reductions survive refreshes.
- Persist copier account selections, multiplier, arm state and position links in local extension storage.
- Refuse copy writes to accounts whose Vest account token reports `canTrade: false`.

## HUD

The widget now uses the same visual language as `massiveprop.xyz/#leaderboard`:

- graphite / black field
- cream-white typography
- muted platinum
- very restrained champagne-gold
- compact mono metadata
- no bright green/red dashboard styling

Drag the header anywhere. Double-click it to collapse.

Press **COPY** in the header to open the copier controls. The current Vest account is selected as master automatically on first capture. Select followers (or press **ALL**), choose a size multiplier, then press **ARM**. The status line reports each copy and any follower that was skipped.

The top-right pop-out button opens **Document Picture-in-Picture**, giving MassivePnL its own small always-on-top window that can remain visible over other Chrome tabs and other Windows applications.

## Install / update

1. Download or pull the latest `main`.
2. Open `chrome://extensions`.
3. Find MassivePnL and press **Reload**. If it is not installed yet, enable Developer mode → **Load unpacked** → select the `MassivePnL` folder.
4. Refresh `https://next.vestmarkets.com`.

For the first sync after a reload, leave a Vest tab open so the extension can capture the logged-in Vest session and discover the active-account roster.

## Vest interfaces used

- `/v3/capital/accounts/active`
- `/v3/auth/account-token`
- `/v3/positions/opened`
- `/v3/ticker/latest`
- `wss://ws.hz.vestmarkets.com/ws?version=1.0`
- `<symbol>@ticker`
- Vest position order endpoints under `/v3/positions/*` when the copier is armed

No Vest username, password, wallet key, cookie, or auth token is persisted by the extension.


## Copier safety model

- MassivePnL never stores Vest usernames, passwords, cookies, wallet keys or auth tokens.
- Per-account tokens remain only in the Vest page context and are short-lived.
- Copier writes are generated only after the master Vest request succeeds.
- Copier-generated follower requests use the original Vest endpoint through the page's native `fetch`, so they are not re-intercepted and cannot recursively copy themselves.
- Position-specific follower requests fail closed when a safe master→follower position mapping is unavailable.
