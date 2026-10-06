# On-chain proof experiment

Status: **archived from the public site** on 2026-09-16.

The original experiment matched payout certificates to incoming USDC transfers and rendered the result as a clickable proof rail. It was useful technically, but publishing a personal settlement wallet creates an unnecessary privacy link between the site and the wallet.

## What remains

- `src/components/payoutlab/OnChainProof.jsx` preserves the UI experiment for reference.
- `scripts/match-onchain.mjs` preserves the matching logic in a privacy-safe form.
- The public build no longer runs the matcher and `onchainMatches.json` remains empty.
- No personal wallet or transaction hashes are stored in the current matcher.

## Local audit

Run the matcher only when needed:

```bash
ONCHAIN_WALLET=0x... ONCHAIN_CERT_IDS=maven-011,lucid-trading-001 npm run audit:onchain
```

It writes the local result to:

```text
artifacts/onchainMatches.local.json
```

Do not commit that output or expose the wallet in the public build.

## Matching model

The helper compares:

- certificate date vs. incoming USDC settlement date;
- certificate amount vs. expected settlement amount;
- Maven historical settlement as either 80% of the certificate or the full amount;
- Lucid historical settlement as either 90% of the certificate or the full amount;
- a tight date and amount tolerance, then one transaction per certificate.

This is retained as an internal verification tool, not as public-facing proof.
