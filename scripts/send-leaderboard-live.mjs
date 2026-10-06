import {renderEmailRankCard} from './render-email-rank-card.mjs';
import {emailHtml,emailText} from '../src/lib/leaderboard-email.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonicalTraderWallet } from '../src/lib/trader-wallets.js';
import { weeklySources, rankWeekly } from '../src/lib/weekly-leaderboard.js';
import { seasonBoard, seasonKey, seasonNumber, seasonStart } from '../src/lib/season-leaderboard.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const DATA_ROOT = 'https://raw.githubusercontent.com/deciphe/thepayoutlab/vestflow-data/';
const SITE = 'https://massiveprop.xyz/';

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];
    if (!value.startsWith('--')) continue;
    const [rawKey, inline] = value.slice(2).split('=', 2);
    if (inline !== undefined) out[rawKey] = inline;
    else if (argv[i + 1] && !argv[i + 1].startsWith('--')) out[rawKey] = argv[++i];
    else out[rawKey] = true;
  }
  return out;
}

function xAvatarUrl(username) {
  return `https://unavatar.io/x/${encodeURIComponent(username)}?fallback=false`;
}

async function verifyRemoteImage(url) {
  const response = await fetch(url, { redirect: 'follow', headers: { 'user-agent': 'massiveprop-leaderboard-mailer/1.0' } });
  if (!response.ok) throw new Error(`Could not resolve X profile image (${response.status}). Check the X handle or pass --image with a direct image URL.`);
  const type = response.headers.get('content-type') || '';
  if (!type.startsWith('image/')) throw new Error('X profile image lookup did not return an image.');
  return url;
}

async function loadLocalEnv() {
  try {
    const raw = await fs.readFile(path.join(projectRoot, '.env'), 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const index = trimmed.indexOf('=');
      if (index < 1) continue;
      const key = trimmed.slice(0, index).trim();
      let value = trimmed.slice(index + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {}
}

async function readJson(url) {
  const response = await fetch(url, { headers: { 'user-agent': 'massiveprop-leaderboard-mailer/1.0' } });
  if (!response.ok) throw new Error(`Could not read ${url} (${response.status})`);
  return response.json();
}

async function currentVestSeason() {
  const start = seasonStart();
  const key = seasonKey(start);
  const sources = weeklySources('vest');
  const snapshots = Object.fromEntries(await Promise.all(
    sources.map(async source => [source.slug, await readJson(`${DATA_ROOT}${source.slug}.json`)])
  ));
  let prior = null;
  try { prior = await readJson(`${DATA_ROOT}seasons/${key}.json`); } catch {}
  const board = seasonBoard(snapshots, start, Date.now(), prior, 'vest');
  if (!board?.available) throw new Error(`Vest season board is unavailable: ${(board?.missing || ['unknown reason']).join(', ')}`);
  return { key, asOf:board.asOf, number: seasonNumber(start), ranked: rankWeekly(board, 'vest') };
}

async function traderForWallet(wallet) {
  const raw = await fs.readFile(path.join(projectRoot, 'src/data/traders.json'), 'utf8');
  const traders = JSON.parse(raw);
  const canonical = canonicalTraderWallet(wallet);
  const trader = traders.find(item => canonicalTraderWallet(item.wallet) === canonical);
  if (!trader) throw new Error('That wallet is not in src/data/traders.json yet. Add/approve the trader first, then send the confirmation.');
  return { ...trader, wallet: canonical };
}

async function main() {
  await loadLocalEnv();
  const args = parseArgs(process.argv.slice(2));
  if(args['test-profile']){
    const config=JSON.parse(process.env.MASSIVE_TEST_PROFILE||await fs.readFile(path.resolve(projectRoot,String(args['test-profile'])),'utf8'));
    for(const key of ['twitter','name','tag','image','rank','total','payouts'])if(config[key]!==undefined)args[key]=config[key];
    args.test=true;
    args.to=process.env.MASSIVE_TEST_EMAIL||'gp@gigaprop.xyz';
  }

  if (!args.to) {
    console.error('Live: npm run leaderboard:email -- --to trader@example.com --wallet 0x...');
    console.error('Test: npm run leaderboard:email -- --test --to you@example.com --twitter yourhandle --rank 20');
    process.exit(1);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(args.to)) throw new Error('Invalid recipient email address.');

  let trader, row, key, number, asOf;
  const isTest = Boolean(args.test);

  if (isTest) {
    if (!args.twitter) throw new Error('Test mode needs --twitter yourhandle.');
    const rank = Number.parseInt(args.rank || '20', 10);
    const total = Number(args.total || 12480.00);
    const count = Number.parseInt(args.payouts || '12', 10);
    if (!Number.isInteger(rank) || rank < 1 || rank > 999) throw new Error('Test rank must be a whole number between 1 and 999.');
    if (!Number.isFinite(total) || total < 0) throw new Error('Test total must be a non-negative number.');
    if (!Number.isInteger(count) || count < 0) throw new Error('Test payouts must be a non-negative whole number.');

    const start = seasonStart();
    key = seasonKey(start);
    number = seasonNumber(start);
    const username = String(args.twitter).replace(/^@/, '');
    if(!/^[A-Za-z0-9_]{1,15}$/.test(username))throw Error('Invalid X handle.');
    if(args.image&&!/^https:\/\//i.test(args.image))throw Error('Use an HTTPS image URL.');
    const avatarSource = args.image || xAvatarUrl(username);
    if (!args.image) {
      process.stdout.write(`Resolving @${username} X profile photo… `);
      await verifyRemoteImage(avatarSource);
      console.log('found');
    }
    trader = {
      twitter: username,
      name: args.name || username,
      tag: args.tag || '',
      avatar: avatarSource,
      avatarSource,
      wallet: '',
    };
    row = { rank, total, count };
    console.log('TEST MODE — no leaderboard data or profile records are being changed.');
  } else {
    if (!args.wallet) throw new Error('Live mode needs --wallet 0x...');
    if (!/^0x[a-fA-F0-9]{40}$/.test(args.wallet)) throw new Error('Invalid 0x wallet address.');
    trader = await traderForWallet(args.wallet);
    const live = await currentVestSeason();
    key = live.key;
    asOf=live.asOf;
    number = live.number;
    row = live.ranked.find(item => item.address === trader.wallet);
    if (!row) throw new Error('Approved trader is not currently ranked on the Vest season board.');
  }

  const apiKey = process.env.RESEND_API_KEY;
  if(!args.preview&&!apiKey)throw Error('RESEND_API_KEY is not set. Add it to GitHub Actions secrets or local .env; never commit it.');
  const rankCard=await renderEmailRankCard({trader,row,season:key,asOf});
  const rankCardSrc=args.preview?'data:image/jpeg;base64,'+rankCard.toString('base64'):'cid:massiveprop-rank-card';
  const html = emailHtml({ trader, row, season: key, seasonNumber: number, test: isTest,rankCardSrc });
  const text = emailText({ trader, row, season: key, test: isTest });

  if (args.preview) {
    const outDir = path.join(projectRoot, 'output');
    await fs.mkdir(outDir, { recursive: true });
    const file = path.join(outDir, `leaderboard-live-${trader.twitter.replace(/^@/, '')}.html`);
    await fs.writeFile(file, html);
    console.log(`Preview written to ${path.relative(projectRoot, file)}`);
    console.log(`${isTest ? 'Test rank' : 'Rank resolved'}: #${row.rank} · ${row.total} USDC · ${row.count} payouts`);
    return;
  }

  const from = process.env.MASSIVE_FROM || 'Massive <gp@gigaprop.xyz>';
  const subject = args.subject || `${isTest?'[TEST] ':''}Your MASSIVE leaderboard profile is live — #${row.rank}`;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
      ...(process.env.MASSIVE_SEND_KEY?{'Idempotency-Key':process.env.MASSIVE_SEND_KEY}:{}),
    },
    body: JSON.stringify({
      from,
      to: [args.to],
      subject,
      reply_to: ['gp@gigaprop.xyz'],
      html,
      text,
      attachments:[{content:rankCard.toString('base64'),filename:'massiveprop-rank-card.jpg',content_type:'image/jpeg',content_id:'massiveprop-rank-card'}],
    }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Resend rejected the email (${response.status}): ${body.message || JSON.stringify(body)}`);
  console.log(`${isTest ? 'TEST ACCEPTED' : 'Accepted'} by Resend · #${row.rank} · email ${body.id || 'accepted'}`);
}

main().catch(error => {
  console.error(`Leaderboard email failed: ${error.message}`);
  process.exit(1);
});
