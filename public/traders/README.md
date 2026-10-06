# Add a trader to MASSIVE

1. Upload their image into **public/traders/**. PNG, JPG or WebP; square images at least 400×400 work best. Use a simple filename such as `newtrader.png` (no spaces).
2. Edit **src/data/traders.json** and add a new object inside the existing array. Separate objects with commas; no comma after the last object.

```json
{
  "wallet": "0xTHEIR_PAYOUT_WALLET_ADDRESS",
  "twitter": "theirhandle",
  "name": "Their display name",
  "image": "newtrader.png",
  "tag": ""
}
```

Use the exact payout-recipient wallet, their X username (not a full URL), and the exact uploaded image filename including extension. `name` is the display name; `tag` is optional (for example `#8020GANG`). Keep `tag` empty if not needed. The wallet must be a real 42-character 0x address; the example above is a placeholder.

3. Commit to **main**. GitHub Actions deploys the update automatically.

The same entry appears in the season leaderboard, firm leaderboards, profile panel, and downloadable rank artwork. Portrait fades and styling are automatic. It only appears where that wallet qualifies by actual payouts; this does not force a rank or create a verified-wallet badge.

To replace a photo, upload over the existing filename and commit. To update a handle, edit the `twitter` field. To remove an editorial profile, remove its object from the JSON array.
