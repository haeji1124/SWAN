// usage: node shot.cjs <url> <outPrefix> [reduced]
const puppeteer = require('puppeteer-core');
(async () => {
  const [url, out, reduced] = process.argv.slice(2);
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  if (reduced) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(url, { waitUntil: 'networkidle0' });
  // 끝까지 천천히 스크롤해서 ScrollTrigger 등장 움직임을 모두 실행
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 400) { await page.evaluate(y => window.scrollTo(0, y), y); await new Promise(r => setTimeout(r, 120)); }
  await new Promise(r => setTimeout(r, 1800));
  await page.evaluate(() => window.scrollTo(0, 0)); await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: out + '-full.png', fullPage: true });
  console.log('height', h, 'errors', JSON.stringify(errors));
  await browser.close();
})();
