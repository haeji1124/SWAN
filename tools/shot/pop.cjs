// usage: node pop.cjs <url> <outPrefix>
// 히어로 변신을 단계별로 찍는다: 움츠림(0.38) → 펑 직후 0.25초(컨페티가 공중에) → 0.7초 → 끝
const puppeteer = require('puppeteer-core');
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const [url, out] = process.argv.slice(2);
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
  await page.goto(url, { waitUntil: 'networkidle0' });
  await wait(3000); // 첫 손 흔들기가 끝나도록
  const { top, span } = await page.evaluate(() => { const el = document.querySelector('[data-section="home:01-intro"] > div'); return { top: el.getBoundingClientRect().top + scrollY, span: el.offsetHeight - innerHeight }; });
  const go = async p => { await page.evaluate(y => window.scrollTo(0, y), Math.round(top + p * span)); };
  await go(0.2); await wait(400);
  await go(0.38); await wait(500); await page.screenshot({ path: `${out}-squash.jpg`, type: 'jpeg', quality: 82 });
  await go(0.56); await wait(250); await page.screenshot({ path: `${out}-burst.jpg`, type: 'jpeg', quality: 82 });
  await wait(450); await page.screenshot({ path: `${out}-burst2.jpg`, type: 'jpeg', quality: 82 });
  await go(1); await wait(1500); await page.screenshot({ path: `${out}-end.jpg`, type: 'jpeg', quality: 82 });
  console.log('span', span, 'errors', JSON.stringify(errors));
  await browser.close();
})();
