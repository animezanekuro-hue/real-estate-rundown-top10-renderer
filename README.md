# Real Estate Rundown Top 10 Renderer — V4 Patch

This patch uses the same working Render pattern as the user's old renderer:

- `puppeteer-core`
- `@sparticuz/chromium`
- `await chromium.executablePath()`

Important Render settings:
- Build Command: `npm install`
- Start Command: `npm start`
- Manual Deploy: `Clear build cache & deploy`

Health check:
`https://real-estate-rundown-top10-renderer.onrender.com/health`

Expected health response includes:
`"patch":"v4-working-style-sparticuz-pinned"`
