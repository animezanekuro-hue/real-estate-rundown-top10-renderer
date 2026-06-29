const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function normalizePayload(body = {}) {
  const defaultItems = [
    { name: 'Austin, TX', sub: 'Inventory is giving buyers more leverage', val: '+22% listings' },
    { name: 'Phoenix, AZ', sub: 'Price cuts are becoming more common', val: 'More cuts' },
    { name: 'Boise, ID', sub: 'Homes are sitting longer than before', val: 'Longer DOM' },
    { name: 'Tampa, FL', sub: 'New supply is changing the market', val: 'Supply rising' },
    { name: 'Raleigh, NC', sub: 'Competition is cooling from peak levels', val: 'Less bidding' },
    { name: 'Sacramento, CA', sub: 'Buyers have more room to negotiate', val: 'More leverage' },
    { name: 'Denver, CO', sub: 'Sellers are adjusting expectations', val: 'Resetting' },
    { name: 'Jacksonville, FL', sub: 'More listings are hitting the market', val: 'More options' },
    { name: 'Nashville, TN', sub: 'The market is moving slower than before', val: 'Slower pace' },
    { name: 'Las Vegas, NV', sub: 'Demand is more sensitive to rates', val: 'Rate pressure' }
  ];

  const items = Array.isArray(body.items) ? body.items.slice(0, 10) : [];

  while (items.length < 10) {
    items.push(defaultItems[items.length]);
  }

  return {
    title: body.title || '10 Housing Markets Where Buyers Have More Power',
    subtitle: body.subtitle || 'More inventory, slower sales, and price cuts are shifting leverage.',
    pill: body.pill || 'TOP 10',
    source: body.source || 'Market signals: inventory, price cuts, days on market',
    handle: body.handle || '@real_estate_rundown',
    items: items.map((item, idx) => ({
      name: item.name || item.city || item.market || item.location || `Market ${idx + 1}`,
      sub: item.sub || item.reason || item.description || item.subtitle || 'Market conditions are shifting.',
      val: item.val || item.value || item.metric || item.stat || ''
    }))
  };
}

function buildHtml(rawPayload) {
  const p = normalizePayload(rawPayload);

  const rows = p.items.map((item, i) => `
    <div class="row">
      <div class="rank">${i + 1}</div>
      <div class="main">
        <div class="market">${escapeHtml(item.name)}</div>
        <div class="reason">${escapeHtml(item.sub)}</div>
      </div>
      <div class="metric">${escapeHtml(item.val)}</div>
    </div>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Real Estate Rundown Top 10</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html, body {
      width: 1080px;
      height: 1080px;
      overflow: hidden;
      background: #07111f;
      font-family: 'Inter', Arial, sans-serif;
    }

    .post {
      width: 1080px;
      height: 1080px;
      background:
        linear-gradient(180deg, rgba(16, 31, 52, 0.98), rgba(7, 17, 31, 1)),
        radial-gradient(circle at top right, rgba(203, 161, 63, 0.16), transparent 38%);
      color: white;
      padding: 34px 42px 30px;
      position: relative;
      overflow: hidden;
    }

    .grid {
      position: absolute;
      inset: 0;
      opacity: 0.28;
      background-image:
        linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px);
      background-size: 58px 58px;
      pointer-events: none;
    }

    .topbar {
      position: relative;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 34px;
      z-index: 2;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 14px;
      border: 2px solid #caa13f;
      border-radius: 999px;
      padding: 9px 20px 9px 10px;
      background: rgba(5, 14, 26, 0.78);
    }

    .logo {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #caa13f;
      color: #07111f;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Oswald', Arial, sans-serif;
      font-weight: 700;
      font-size: 21px;
    }

    .brandText {
      line-height: 1.05;
    }

    .brandText .one {
      font-family: 'Oswald', Arial, sans-serif;
      font-size: 22px;
      letter-spacing: 2px;
      font-weight: 700;
    }

    .brandText .two {
      color: #caa13f;
      font-size: 15px;
      letter-spacing: 4px;
      font-weight: 700;
    }

    .pill {
      background: #caa13f;
      color: #07111f;
      border-radius: 10px;
      padding: 12px 24px;
      font-family: 'Oswald', Arial, sans-serif;
      font-size: 22px;
      letter-spacing: 3px;
      font-weight: 700;
    }

    .headline {
      position: relative;
      z-index: 2;
      margin-bottom: 26px;
    }

    .handle {
      color: #caa13f;
      font-size: 19px;
      letter-spacing: 3px;
      text-transform: uppercase;
      margin-bottom: 14px;
      font-weight: 700;
    }

    .title {
      font-family: 'Oswald', Arial, sans-serif;
      font-size: 57px;
      line-height: 0.98;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      max-width: 980px;
    }

    .subtitle {
      margin-top: 14px;
      color: rgba(255,255,255,0.62);
      font-size: 22px;
      line-height: 1.25;
      max-width: 880px;
      font-weight: 500;
    }

    .list {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 18px;
    }

    .row {
      height: 62px;
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 8px 16px;
      border-radius: 13px;
      background: rgba(17, 39, 66, 0.94);
      border: 1.5px solid rgba(202, 161, 63, 0.18);
    }

    .rank {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      background: #caa13f;
      color: #07111f;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Oswald', Arial, sans-serif;
      font-size: 23px;
      font-weight: 700;
      flex-shrink: 0;
    }

    .main {
      flex: 1;
      min-width: 0;
    }

    .market {
      font-family: 'Oswald', Arial, sans-serif;
      font-size: 26px;
      line-height: 1;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .reason {
      margin-top: 5px;
      color: rgba(255,255,255,0.48);
      font-size: 16px;
      line-height: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      letter-spacing: 0.3px;
    }

    .metric {
      color: #caa13f;
      font-family: 'Oswald', Arial, sans-serif;
      font-size: 22px;
      font-weight: 700;
      text-align: right;
      white-space: nowrap;
      max-width: 210px;
      overflow: hidden;
      text-overflow: ellipsis;
      flex-shrink: 0;
    }

    .footer {
      position: absolute;
      left: 42px;
      right: 42px;
      bottom: 24px;
      display: flex;
      justify-content: space-between;
      color: rgba(255,255,255,0.32);
      font-size: 16px;
      letter-spacing: 0.5px;
      z-index: 2;
      border-top: 1px solid rgba(202, 161, 63, 0.16);
      padding-top: 16px;
    }

    .source {
      text-align: right;
      max-width: 620px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  </style>
</head>

<body>
  <div class="post">
    <div class="grid"></div>

    <div class="topbar">
      <div class="brand">
        <div class="logo">RE</div>
        <div class="brandText">
          <div class="one">REAL ESTATE</div>
          <div class="two">RUNDOWN</div>
        </div>
      </div>

      <div class="pill">${escapeHtml(p.pill)}</div>
    </div>

    <div class="headline">
      <div class="handle">${escapeHtml(p.handle)}</div>
      <div class="title">${escapeHtml(p.title)}</div>
      <div class="subtitle">${escapeHtml(p.subtitle)}</div>
    </div>

    <div class="list">
      ${rows}
    </div>

    <div class="footer">
      <div>${escapeHtml(p.handle)}</div>
      <div class="source">${escapeHtml(p.source)}</div>
    </div>
  </div>
</body>
</html>
`;
}

async function getBrowser() {
  const chrome = chromium.default || chromium;

  const executablePath =
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    await chrome.executablePath();

  return puppeteer.launch({
    args: [
      ...chrome.args,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ],
    defaultViewport: {
      width: 1080,
      height: 1080,
      deviceScaleFactor: 1
    },
    executablePath,
    headless: chrome.headless ?? true
  });
}

app.get('/', (req, res) => {
  res.send('Real Estate Rundown Top 10 renderer is running.');
});

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'real-estate-rundown-top10-renderer',
    patch: 'v6-all-10-fit-better-copy'
  });
});

app.post('/render/top10/html', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(buildHtml(req.body));
});

app.post('/render/top10', async (req, res) => {
  let browser;

  try {
    const html = buildHtml(req.body);

    browser = await getBrowser();

    const page = await browser.newPage();

    await page.setViewport({
      width: 1080,
      height: 1080,
      deviceScaleFactor: 1
    });

    await page.setContent(html, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    await page.evaluate(async () => {
      if (document.fonts && document.fonts.ready) {
        await Promise.race([
          document.fonts.ready,
          new Promise(resolve => setTimeout(resolve, 4000))
        ]);
      }
    });

    await page.waitForTimeout(700);

    const buffer = await page.screenshot({
      type: 'png',
      fullPage: false
    });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', 'inline; filename="real-estate-rundown-top10.png"');
    res.send(buffer);
  } catch (err) {
    console.error('Render failed:', err);
    res.status(500).json({
      error: 'Render failed',
      detail: err.message
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

app.listen(PORT, () => {
  console.log(`Top 10 renderer listening on ${PORT}`);
});
