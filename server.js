const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

const iconSets = {
  city:  ['ti-building','ti-bridge','ti-beach','ti-building-lighthouse','ti-building-skyscraper','ti-antenna','ti-building-arch','ti-building-castle','ti-building-bank','ti-sailboat'],
  money: ['ti-cash','ti-coin','ti-report-money','ti-currency-dollar','ti-wallet','ti-pig-money','ti-receipt','ti-credit-card','ti-chart-bar','ti-trending-up'],
  home:  ['ti-home','ti-home-2','ti-door','ti-stairs','ti-key','ti-pool','ti-garden-cart','ti-fence','ti-smart-home','ti-home-heart'],
  trend: ['ti-trending-up','ti-chart-line','ti-arrow-up-right','ti-chart-area','ti-graph','ti-chart-bar','ti-trending-down','ti-arrows-diff','ti-activity','ti-pulse']
};

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function titleHtml(title, goldWord) {
  const safeTitle = escapeHtml(title || '10 Real Estate Trends To Watch');
  const safeGold = escapeHtml(goldWord || '').trim();
  if (!safeGold) return safeTitle;
  const pattern = new RegExp(`(${safeGold.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i');
  return safeTitle.replace(pattern, '<span class="rr-gold">$1</span>');
}

function normalizePayload(body = {}) {
  const defaults = [
    { name: 'Austin', sub: 'Texas', val: 'Watch list' },
    { name: 'Phoenix', sub: 'Arizona', val: 'Cooling' },
    { name: 'Tampa', sub: 'Florida', val: 'Supply' },
    { name: 'Denver', sub: 'Colorado', val: 'Reset' },
    { name: 'Nashville', sub: 'Tennessee', val: 'Growth' },
    { name: 'Dallas', sub: 'Texas', val: 'Volume' },
    { name: 'Boise', sub: 'Idaho', val: 'Volatile' },
    { name: 'Orlando', sub: 'Florida', val: 'Tourism' },
    { name: 'Raleigh', sub: 'North Carolina', val: 'Jobs' },
    { name: 'Las Vegas', sub: 'Nevada', val: 'Cyclical' }
  ];
  const items = Array.isArray(body.items) ? body.items.slice(0, 10) : [];
  while (items.length < 10) items.push(defaults[items.length]);

  return {
    title: body.title || '10 Real Estate Trends To Watch',
    goldWord: body.goldWord || body.gold_word || '',
    pill: body.pill || 'TOP 10 LIST',
    source: body.source || 'Source: Real Estate Rundown analysis',
    handle: body.handle || '@real_estate_rundown',
    iconSet: iconSets[body.iconSet] ? body.iconSet : 'trend',
    items: items.map((item, idx) => ({
      name: item.name || item.city || item.market || `Item ${idx + 1}`,
      sub: item.sub || item.state || item.subtitle || '',
      val: item.val || item.value || item.metric || ''
    }))
  };
}

function buildHtml(rawPayload) {
  const p = normalizePayload(rawPayload);
  const icons = iconSets[p.iconSet];
  const rows = p.items.map((item, i) => `
    <div class="rr-row">
      <div class="rr-num">${i + 1}</div>
      <div class="rr-icon-circle"><i class="ti ${icons[i]}" aria-hidden="true"></i></div>
      <div class="rr-city">
        <div class="rr-city-name">${escapeHtml(item.name)}</div>
        <div class="rr-city-state">${escapeHtml(item.sub)}</div>
      </div>
      <div class="rr-value">${escapeHtml(item.val)}</div>
    </div>
  `).join('');

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Real Estate Rundown Top 10</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Oswald:wght@600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet"><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}body{background:#0a0f1a;font-family:'Inter',sans-serif;width:1080px;height:1080px;display:flex;align-items:center;justify-content:center;overflow:hidden}.rr-post{width:1080px;height:1080px;background:#0d1b2e;overflow:hidden;position:relative;box-shadow:0 24px 60px rgba(0,0,0,.6)}.rr-hero{position:relative;height:360px;background:#111e31;overflow:hidden}.rr-hero-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(184,148,60,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(184,148,60,.07) 1px,transparent 1px);background-size:64px 64px}.rr-hero-glow{position:absolute;bottom:-40px;right:-40px;width:440px;height:440px;background:radial-gradient(circle,rgba(184,148,60,.2) 0%,transparent 70%);pointer-events:none}.rr-badge-logo{position:absolute;top:28px;left:28px;display:flex;align-items:center;gap:14px;background:#0d1b2e;border:3px solid #b8943c;border-radius:44px;padding:10px 22px 10px 14px}.rr-badge-logo-icon{width:52px;height:52px;background:#b8943c;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Oswald',sans-serif;font-size:22px;font-weight:700;color:#0d1b2e;letter-spacing:1px}.rr-badge-logo-text{display:flex;flex-direction:column;line-height:1.1}.rr-badge-logo-text span:first-child{font-family:'Oswald',sans-serif;font-size:22px;font-weight:700;color:#fff;letter-spacing:2px;text-transform:uppercase}.rr-badge-logo-text span:last-child{font-size:18px;color:#b8943c;letter-spacing:3px;text-transform:uppercase}.rr-pill{position:absolute;top:28px;right:28px;background:#b8943c;color:#0d1b2e;font-family:'Oswald',sans-serif;font-size:22px;font-weight:700;letter-spacing:3px;text-transform:uppercase;padding:12px 26px;border-radius:12px}.rr-headline-block{position:absolute;bottom:28px;left:32px;right:32px}.rr-eyebrow{font-size:22px;color:#b8943c;letter-spacing:3px;text-transform:uppercase;margin-bottom:10px;display:flex;align-items:center;gap:12px}.rr-eyebrow::before{content:'';display:inline-block;width:36px;height:4px;background:#b8943c;flex-shrink:0}.rr-title{font-family:'Oswald',sans-serif;font-size:58px;font-weight:700;color:#fff;line-height:1.02;text-transform:uppercase;letter-spacing:1px}.rr-title .rr-gold{color:#b8943c}.rr-list{padding:24px 28px 18px;display:flex;flex-direction:column;gap:12px}.rr-row{display:flex;align-items:center;background:#132338;border-radius:16px;padding:18px 24px;border:2px solid rgba(184,148,60,.12);gap:20px}.rr-num{width:52px;height:52px;background:#b8943c;border-radius:12px;display:flex;align-items:center;justify-content:center;font-family:'Oswald',sans-serif;font-size:26px;font-weight:700;color:#0d1b2e;flex-shrink:0}.rr-icon-circle{width:60px;height:60px;border:3px solid rgba(184,148,60,.35);border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#b8943c;font-size:28px}.rr-city{flex:1;display:flex;flex-direction:column;gap:2px;min-width:0}.rr-city-name{font-family:'Oswald',sans-serif;font-size:31px;font-weight:600;color:#fff;text-transform:uppercase;letter-spacing:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.rr-city-state{font-size:20px;color:rgba(255,255,255,.42);letter-spacing:1.6px;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.rr-value{font-family:'Oswald',sans-serif;font-size:30px;font-weight:600;color:#b8943c;white-space:nowrap;max-width:220px;overflow:hidden;text-overflow:ellipsis;text-align:right}.rr-footer{display:flex;align-items:center;justify-content:space-between;padding:16px 28px 28px;border-top:2px solid rgba(184,148,60,.12);position:absolute;left:0;right:0;bottom:0;background:#0d1b2e}.rr-footer-handle{font-size:22px;color:rgba(255,255,255,.3);letter-spacing:1.6px;display:flex;align-items:center;gap:10px}.rr-footer-handle i{font-size:26px;color:#b8943c}.rr-footer-source{font-size:20px;color:rgba(255,255,255,.25);letter-spacing:1px;text-align:right;max-width:560px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
</style></head><body><div class="rr-post" id="rr-post"><div class="rr-hero"><div class="rr-hero-grid"></div><div class="rr-hero-glow"></div><div class="rr-badge-logo"><div class="rr-badge-logo-icon">RE</div><div class="rr-badge-logo-text"><span>Real Estate</span><span>— Rundown —</span></div></div><div class="rr-pill">${escapeHtml(p.pill)}</div><div class="rr-headline-block"><div class="rr-eyebrow">${escapeHtml(p.handle)}</div><div class="rr-title">${titleHtml(p.title, p.goldWord)}</div></div></div><div class="rr-list">${rows}</div><div class="rr-footer"><div class="rr-footer-handle"><i class="ti ti-home" aria-hidden="true"></i>${escapeHtml(p.handle)}</div><div class="rr-footer-source">${escapeHtml(p.source)}</div></div></div></body></html>`;
}

async function getBrowser() {
  // @sparticuz/chromium changed executablePath across versions.
  // Some versions expose it as an async function, others as a string.
  const executablePath =
    typeof chromium.executablePath === 'function'
      ? await chromium.executablePath()
      : chromium.executablePath;

  return puppeteer.launch({
    args: chromium.args,
    executablePath,
    headless: chromium.headless === undefined ? true : chromium.headless,
    defaultViewport: { width: 1080, height: 1080, deviceScaleFactor: 1 }
  });
}

app.get('/health', (req, res) => res.json({ ok: true, service: 'real-estate-rundown-top10-renderer' }));

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
    await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.evaluateHandle('document.fonts.ready');
    const buffer = await page.screenshot({ type: 'png', fullPage: false });
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', 'inline; filename="real-estate-rundown-top10.png"');
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Render failed', detail: err.message });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(PORT, () => console.log(`Top 10 renderer listening on ${PORT}`));
