# MASSIVE Weekly

Public route: https://massiveprop.xyz/#leaderboard

Rankings use src/lib/weekly-leaderboard.js. Four firms only: Vest, Breakout, Hypernova, Propr. Rank recipient addresses by eligible raw USDC, Monday 00:00 through next Monday 00:00 UTC (end-exclusive). Use the oldest complete source cutoff across every firm, including when applying a firm filter. Never fabricate missing history or silently omit a firm. Ties are ordered by address. An address is not a person; contract addresses across networks and custodial recipients require special care. Known treasury addresses across all four firms, bridges and dust are excluded. Non-trader payment classification remains incomplete and is disclosed.

The existing flow updater runs scripts/archive-weekly.mjs. It retains closed editions unchanged on vestflow-data under weekly/YYYY-MM-DD.json. weekly-index.json lists editions. Current editions continue updating. Bundled public/data/weekly is the launch fallback. Historical launch editions were reconstructed from complete source history, not observed live at those dates. Corrections should be explicit new revision records with reasons, not silent rewrites.

Profiles are served by a separate Sites application:
- project_id: appgprj_6abe1875a4ac819180aae4900f45dd63
- public origin: https://massiveprop-profiles.johnhuska1260335.chatgpt.site
- source managed through that Site's source repository, not this GitHub repository
- GET /api/profiles?addresses=... (100 addresses/request)
- POST /api/challenge {address, username, chainId}
- POST /api/claim {nonce, signature}

Claims use server-issued domain-bound messages with single-use nonces, 5-minute expiry, explicit public-link consent, EOA / ERC-1271-compatible signature checks, D1 profile persistence and unique normalized usernames. No financial transaction, token approval or private key is requested. CORS write origins are massiveprop.xyz and www.massiveprop.xyz. Verification demonstrates control on the selected chain at the recorded time, not identity, social account ownership, firm endorsement or trading-account ownership. A username is self-selected. Multi-address person-level aggregation is not implemented. Exchange custody claims are not accepted through this flow.

Tests: node scripts/test-weekly.mjs; existing flow suite remains required. Auth rejection/replay tests live in the profile service source (tests/claims.mjs), against local disposable accounts only. Never create fake public trader profiles for testing.
