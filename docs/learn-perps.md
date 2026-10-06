# THE BOOK

Route: `#thebook`. Independent browser-only execution and order-book training page. No funds, wallet requests, exchange orders or backend account storage.

## Reference checks (2026-10-01)
- User-provided learn.JPG and live https://next.vestmarkets.com/trade/NDX-USD-PERP: NQ, 50x, USD sizing, market IOC/FOK, TP/SL, reduce only, 0.0025% fee.
- https://docs.vestmarkets.com/trading/markets: ES/NQ market fee 0.0025%, cross margin, USDC. Selected leverage alone does not change P&L at fixed position size.
- https://docs.vestmarkets.com/trading/order-types: price priority, partial IOC, all-or-none FOK, reduce only, stop triggers not guaranteed fills.
- Public https://server-prod.hz.vestmarkets.com/v2/exchangeInfo?symbols=NDX-USD-PERP: sizeDecimals 4, initial/funded margin .02, maintenance .01, not isolated. Legacy `takerFee` field returned zero; fee uses current UI and Markets docs instead.
- CME Micro E-mini FAQ: MNQ $2/point, NQ $20/point. Equivalence is exposure only, never a claim the perp is a CME contract.

## Model
One signed net position. USD is converted to quantity at current reference mid, rounded down to .0001. Orders sweep finite synthetic levels within a selectable mid-relative protection limit. Fees use actual fill notional. Fills deplete depth until the next tick; IOC drops remainder, FOK is atomic. Adds use weighted entry; reductions realize only closed units; flips reopen excess at fill. Increasing exposure requires post-fee equity >= initial margin. Reduce only cannot flip. All P&L and fees settle into cash; mark P&L contributes to equity. Fixed positive funding is paid by longs and received by shorts, prorated per elapsed simulated second.

1 real second at 1x = 1 simulated second. Ticks aggregate into one-minute OHLC candles; 5x/20x/60x accelerate simulated time. The seeded Gaussian walk has 16-point per-minute standard deviation (~500-point expected high-low over 390 minutes). No forced range/reversal at bounds. All depth/spread presets are illustrative. Simulated mid, mark and index coincide. Full training liquidation replaces the real partial liquidation procedure. Stops/targets use mark then market fill and can slip/partially fill. Funded-account fail limits, market-hour locks, multi-asset risk and live funding are deliberately not emulated; limitations appear in-page.

Tests: `node scripts/test-perps.mjs`; build: `npm run build`.
