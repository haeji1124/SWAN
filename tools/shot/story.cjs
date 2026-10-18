// usage: node story.cjs <url> <outPrefix>
// 히어로 이야기를 단계별로 찍는다 (1440×900). 손 흔들기 1·2번째, 변신 정도 a = 0.1 · 0.3 · 0.5 · 0.58 · 0.67(펑 직후) · 0.9(함께 손 흔들기)
// 스크롤 진행 p = 0.06 + 0.8a (Hero.tsx transformAmount). 히어로는 메뉴 아래에서 시작하므로 top을 더한다
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
  const t0 = Date.now();
  await page.goto(url, { waitUntil: 'networkidle0' });
  const since = () => Date.now() - t0;
  await wait(Math.max(0, 1200 - since())); await page.screenshot({ path: `${out}-wave1.jpg`, type: 'jpeg', quality: 82 });
  await wait(Math.max(0, 3700 - since())); await page.screenshot({ path: `${out}-wave2.jpg`, type: 'jpeg', quality: 82 });
  await wait(Math.max(0, 6200 - since())); await page.screenshot({ path: `${out}-afterwave.jpg`, type: 'jpeg', quality: 82 });
  const { top, span } = await page.evaluate(() => { const el = document.querySelector('[data-section="home:01-intro"] > div'); return { top: el.getBoundingClientRect().top + scrollY, span: el.offsetHeight - innerHeight }; });
  for (const a of [0.1, 0.3, 0.5, 0.58, 0.67, 0.9]) {
    // 실제 사람처럼 조금씩 스크롤
    const target = top + (0.06 + 0.8 * a) * span;
    const from = await page.evaluate(() => scrollY);
    for (let i = 1; i <= 8; i++) { await page.evaluate(y => window.scrollTo(0, y), from + (target - from) * i / 8); await wait(30); }
    await wait(a === 0.67 ? 250 : a === 0.9 ? 1600 : 900);
    await page.screenshot({ path: `${out}-a${Math.round(a * 100)}.jpg`, type: 'jpeg', quality: 82 });
  }
  console.log('errors', JSON.stringify(errors));
  await browser.close();
})();
