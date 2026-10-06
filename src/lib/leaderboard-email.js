const usd=value=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2}).format(value);
const SITE='https://massiveprop.xyz/';
function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

export function emailHtml({ trader, row, season, seasonNumber: seasonNo, test = false, rankCardHtml = '', rankCardSrc = 'cid:massiveprop-rank-card' }) {
  const username = trader.twitter.replace(/^@/, '');
  const displayName = trader.name || username;
  const profileUrl = test
    ? `${SITE}#massiveprop?profile=${encodeURIComponent(JSON.stringify({twitter:trader.twitter,name:trader.name,tag:trader.tag||'',image:trader.avatarSource||trader.avatar||'',rank:row.rank,total:row.total,payouts:row.count}))}`
    : `${SITE}#leaderboard?season=${encodeURIComponent(season)}&firm=vest&wallet=${encodeURIComponent(trader.wallet)}`;
  const card = rankCardHtml || `<img src="${escapeHtml(rankCardSrc)}" width="620" alt="${escapeHtml(displayName)} — MASSIVE rank ${row.rank}" style="display:block;width:100%;height:auto;border:0;outline:none;text-decoration:none;">`;
  return `<!doctype html>
<html>
<head><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"></head>
<body style="margin:0;padding:0;background:#070807;color:#f2f2ef;font-family:Arial,Helvetica,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Your MASSIVE leaderboard profile is live at rank #${row.rank}.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;background:#070807;margin:0;padding:0;">
<tr><td align="center" style="font-family:Arial,Helvetica,sans-serif;padding:34px 14px 44px;">
<table role="presentation" width="620" cellpadding="0" cellspacing="0" style="width:100%;max-width:620px;border-collapse:separate;">
<tr><td style="font-family:Arial,Helvetica,sans-serif;padding:0 2px 24px;font-size:13px;font-weight:700;letter-spacing:.24em;color:#d7d9d6;">MASSIVE.</td></tr>
<tr><td style="font-family:Arial,Helvetica,sans-serif;padding:0 2px 8px;font-size:12px;letter-spacing:.18em;color:#7c817d;">MASSIVE / TRADER LEAGUE</td></tr>
<tr><td style="font-family:Arial,Helvetica,sans-serif;padding:0 2px 8px;font-size:46px;line-height:1.05;font-weight:500;letter-spacing:-.05em;color:#f3f4f1;">YOU’RE LIVE.</td></tr>
<tr><td style="font-family:Arial,Helvetica,sans-serif;padding:0 2px 30px;font-size:16px;line-height:1.65;color:#9fa39f;">Your profile is now live on <strong style="color:#eef0ed;font-weight:600;">massiveprop.xyz/#leaderboard</strong>.</td></tr>
<tr><td style="font-family:Arial,Helvetica,sans-serif;padding:0;background:#09090b;"><a href="${escapeHtml(profileUrl)}" style="display:block;border:0;text-decoration:none;color:inherit;">${card}</a></td></tr>
<tr><td align="center" style="font-family:Arial,Helvetica,sans-serif;padding:30px 0 16px;">
<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="font-family:Arial,Helvetica,sans-serif;border-radius:999px;background:#eff1ed;">
<a href="${escapeHtml(profileUrl)}" style="font-family:Arial,Helvetica,sans-serif;display:inline-block;padding:15px 25px;color:#080908;text-decoration:none;font-size:11px;font-weight:700;letter-spacing:.13em;">VIEW YOUR RANK →</a>
</td></tr></table>
</td></tr>
<tr><td align="center" style="font-family:Arial,Helvetica,sans-serif;padding:3px 15px 0;font-size:11px;line-height:1.7;color:#5e635f;">Public payouts. Independently ranked.<br>Rankings move as new eligible payouts are recorded.<br><span style="color:#4f5450;">You received this because you submitted a MASSIVE leaderboard profile.</span></td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

export function emailText({ trader, row, season, test = false }) {
  const username = trader.twitter.replace(/^@/, '');
  const profileUrl = test
    ? `${SITE}#massiveprop?profile=${encodeURIComponent(JSON.stringify({twitter:trader.twitter,name:trader.name,tag:trader.tag||'',image:trader.avatarSource||trader.avatar||'',rank:row.rank,total:row.total,payouts:row.count}))}`
    : `${SITE}#leaderboard?season=${encodeURIComponent(season)}&firm=vest&wallet=${encodeURIComponent(trader.wallet)}`;
  return `YOU'RE LIVE.\n\n@${username} is now live on the MASSIVE Trader League.\nVest season rank: #${row.rank}\nEligible USDC received: ${usd(row.total)}\nPayouts: ${row.count}\n\nView your rank: ${profileUrl}\n\nYou received this because you submitted a MASSIVE leaderboard profile.\n\nMASSIVE`;
}
