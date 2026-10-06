import { writeFile, mkdir } from 'node:fs/promises';
import { certificates } from '../src/components/payoutlab/data.js';

const WALLET = String(process.env.ONCHAIN_WALLET || '').trim().toLowerCase();
const USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const IDS = String(process.env.ONCHAIN_CERT_IDS || '')
  .split(',')
  .map(v => v.trim())
  .filter(Boolean);
const OUT_DIR = new URL('../artifacts/', import.meta.url);
const OUT = new URL('../artifacts/onchainMatches.local.json', import.meta.url);

if (!/^0x[a-f0-9]{40}$/.test(WALLET)) {
  console.error('[onchain] Set ONCHAIN_WALLET locally. No wallet is stored in the public repo.');
  process.exit(1);
}

const targets = (IDS.length ? IDS : certificates.map(c => c.id))
  .map(id => certificates.find(c => c.id === id))
  .filter(Boolean);

const api = `https://eth.blockscout.com/api/v2/addresses/${WALLET}/token-transfers`;

function day(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function amountOf(item) {
  const decimals = Number(item?.token?.decimals ?? item?.total?.decimals ?? 6);
  return Number(item?.total?.value ?? 0) / (10 ** decimals);
}

function expectedAmounts(cert) {
  if (cert.firm === 'Maven') return [cert.amountNum * 0.8, cert.amountNum];
  if (cert.firm === 'Lucid Trading') return [cert.amountNum * 0.9, cert.amountNum];
  return [cert.amountNum];
}

async function fetchTransfers() {
  const all = [];
  let next = null;
  for (let page = 0; page < 30; page += 1) {
    const url = new URL(api);
    url.searchParams.set('type', 'ERC-20');
    url.searchParams.set('filter', 'to');
    url.searchParams.set('token', USDC);
    if (next) Object.entries(next).forEach(([k, v]) => v != null && url.searchParams.set(k, String(v)));
    const response = await fetch(url, { headers: { accept: 'application/json', 'user-agent': 'gigaprop-local-audit/1.0' } });
    if (!response.ok) throw new Error(`Blockscout ${response.status}`);
    const data = await response.json();
    const items = Array.isArray(data.items) ? data.items : [];
    all.push(...items);
    next = data.next_page_params || null;
    if (!next || items.length === 0) break;
  }
  return all.filter(item => {
    const symbol = String(item?.token?.symbol || '').toUpperCase();
    const token = String(item?.token?.address_hash || '').toLowerCase();
    const to = String(item?.to?.hash || '').toLowerCase();
    return symbol === 'USDC' && token === USDC && to === WALLET;
  });
}

function score(cert, tx) {
  const certDay = day(cert.date);
  const txDay = day(tx.timestamp);
  if (certDay == null || txDay == null) return null;
  const days = Math.abs(certDay - txDay) / 86400000;
  if (days > 5) return null;

  const got = amountOf(tx);
  let best = null;
  for (const expected of expectedAmounts(cert)) {
    const delta = Math.abs(got - expected);
    const tolerance = Math.max(12, expected * 0.035);
    if (delta > tolerance) continue;
    const candidate = { expected, delta, days, score: days * 10 + (delta / Math.max(expected, 1)) * 100 };
    if (!best || candidate.score < best.score) best = candidate;
  }
  return best;
}

const transfers = await fetchTransfers();
const candidates = [];
for (const cert of targets) {
  for (const tx of transfers) {
    const match = score(cert, tx);
    if (match) candidates.push({ cert, tx, match });
  }
}

candidates.sort((a, b) => a.match.score - b.match.score);
const used = new Set();
const matches = {};
for (const { cert, tx, match } of candidates) {
  const hash = String(tx.transaction_hash || '').toLowerCase();
  if (!hash || used.has(hash) || matches[cert.id]) continue;
  used.add(hash);
  matches[cert.id] = {
    txHash: tx.transaction_hash,
    txUrl: `https://etherscan.io/tx/${tx.transaction_hash}`,
    receivedAmount: Math.round(amountOf(tx) * 1e6) / 1e6,
    timestamp: tx.timestamp,
    expectedAmount: Math.round(match.expected * 100) / 100,
    dayDelta: match.days,
  };
}

await mkdir(OUT_DIR, { recursive: true });
await writeFile(OUT, JSON.stringify(matches, null, 2) + '\n', 'utf8');
console.log(`[onchain] wrote ${Object.keys(matches).length} local matches to artifacts/onchainMatches.local.json`);
