# Leaderboard “You’re live” email

This repo includes a private local sender for the GIGAPROP leaderboard confirmation email.

It does **not** store claimant email addresses in the public repository. You pass the email only when you send.

## One-time setup

1. Create a Resend account.
2. Add and verify `gigaprop.xyz` as a sending domain. Keep the existing IONOS mail records intact; only add the DNS records Resend specifically asks for.
3. Create a Resend API key.
4. Copy `.env.example` to `.env` and paste the key there. `.env` is already gitignored.

```
RESEND_API_KEY=re_...
GIGAPROP_FROM="GIGAPROP <gp@gigaprop.xyz>"
```

## Preview before sending

The trader must already be approved in `src/data/traders.json`.

```bash
npm install
npx playwright install chromium
npm run leaderboard:email -- --to trader@example.com --wallet 0xTHEIRWALLET --preview
```

That resolves the trader’s current **Vest season rank from the same live payout snapshots used by the site** and writes a local HTML preview into `output/`.

## Send

```bash
npm run leaderboard:email -- --to trader@example.com --wallet 0xTHEIRWALLET
```

The email contains:
- “YOU’RE LIVE.”
- the trader’s current Vest season rank
- their profile image, display name, X handle and optional tag
- eligible USDC received and payout count
- a direct button to their leaderboard profile

The exact leaderboard rank-card component is rendered to a 2400px JPG and embedded inline with CID. The test studio previews that same component.

## Workflow after approving a claim

1. Review the claimant email from the existing leaderboard form.
2. Add the approved trader/profile image to the repo as usual.
3. Let the site deploy.
4. Run the sender with the claimant’s contact email and payout wallet.

The contact email exists only in your inbox/terminal command and is never added to `traders.json`.


## Safe test send

You can test the exact email without adding yourself to `traders.json` or changing any leaderboard data.

```bash
npm run leaderboard:email -- --test --to YOUR_EMAIL --twitter YOUR_X_HANDLE --rank 20
```

Optional fake values:

```bash
npm run leaderboard:email -- --test --to YOUR_EMAIL --twitter YOUR_X_HANDLE --name "Your Name" --rank 20 --total 12480 --payouts 12 --tag "#GIGAPROP"
```

Add `--preview` to render the email locally instead of sending it.

Test mode never writes to the leaderboard and the button simply opens `gigaprop.xyz/#leaderboard`.


### X profile photo in test mode

When `--test` is used, the mailer now resolves the profile photo from the supplied `--twitter` handle automatically. No `--image` argument is needed.

For a real send, the portrait is baked into the rank-card JPG, which is embedded inline in the email with CID. You can still override it with `--image https://...` if needed.


## Browser test studio

Open `https://gigaprop.xyz/#gigaprop`. Edit the sample profile and copy its JSON.
The draft stays on that browser; it is never added to the real leaderboard.
The preview uses the exact same HTML renderer as the Resend sender.

1. Add the repository Actions secret `RESEND_API_KEY` in GitHub Settings → Secrets and variables → Actions.
2. Click **Run email test in GitHub** on the studio page.
3. Choose **Run workflow** on the main branch, paste the copied JSON in **Profile JSON**, and run.
4. The test goes only to `gp@gigaprop.xyz`, with `[TEST]` in the subject. An empty JSON input uses `src/data/email-test-profile.json`.

The result log reports Resend acceptance and the email ID, not guaranteed inbox delivery.
Each workflow run uses a Resend idempotency key. For a fresh intentional test, start a new run.
The test email links back to its sample profile on `#gigaprop`.

## Next: automatic welcome emails

Keep recipient addresses out of public `traders.json`. The intended production setup is a private
handle-to-email map, an explicit welcome revision on each approved profile, and a durable sent ledger.
After a successful deployment, send only approved, unsent revisions, using live leaderboard values.
Ordinary edits and unrelated deployments must not re-email existing profiles. This production batch
sender is not enabled by the test workflow. Test your own email before supplying other recipients.
