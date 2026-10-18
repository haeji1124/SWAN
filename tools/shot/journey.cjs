// usage: node journey.cjs <url> <outPrefix> [reduced]
// 모험길 섹션을 스크롤 진행 0 · 0.3 · 0.6 · 1 지점에서 찍는다 (1440×900)
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
  const sel = '[data-section="home:06b-journey"]';
  const { top, height } = await page.evaluate(s => { const r = document.querySelector(s).getBoundingClientRect(); return { top: r.top + scrollY, height: r.height }; }, sel);
  const run = Math.max(0, height - (900 - 88));
  const stops = reduced ? [0] : [0, 0.3, 0.6, 1];
  for (const p of stops) {
    // 실제 사람처럼 조금씩 스크롤 (걷는 그림이 넘어가는지 보려고)
    const target = top - 88 + run * p;
    const from = await page.evaluate(() => scrollY);
    for (let i = 1; i <= 12; i++) { await page.evaluate(y => window.scrollTo(0, y), from + (target - from) * i / 12); await new Promise(r => setTimeout(r, 40)); }
    await new Promise(r => setTimeout(r, 700));
    await page.screenshot({ path: `${out}-${Math.round(p * 100)}.jpg`, type: 'jpeg', quality: 82 });
  }
  console.log('top', top, 'height', height, 'errors', JSON.stringify(errors));
  await browser.close();
})();
