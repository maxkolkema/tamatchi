# Tamatchi Web App

This is the PC-friendly, installable PWA version of Tamatchi. It is isolated
from both `floof/` firmware and `ios-app/` native experiments.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL in a browser. For iPhone installation, deploy it to an
HTTPS URL, open it in Safari, tap Share, then **Add to Home Screen**.

## Deploy on Vercel

Import the repository in Vercel and set the project root to `web-app`. Vercel
detects Next.js automatically. The free Hobby plan is sufficient for this
static personal PWA. Use a separate subdomain or project URL rather than
replacing the existing Supply IQ/Atlas deployment.
