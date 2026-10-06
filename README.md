# gigaprop — GitHub Pages edition

A clean React/Vite site built around personal prop-firm payout proof, True R rankings, and a dedicated Maven proof edition.

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

The deployable static site is generated in `dist/`.

## GitHub Pages

The included GitHub Actions workflow builds the main gigaprop site and the Maven edition on every push to `main`, then deploys the combined artifact to GitHub Pages.

## Content updates

Payout certificates, firm rankings, and ticker copy live in:

`src/components/payoutlab/data.js`

The main site components live under:

`src/components/payoutlab/`

The Maven edition lives under:

`maven-site/`

Legacy lesson and mentorship components remain in source for possible future reuse but are intentionally not part of the streamlined launch page.
