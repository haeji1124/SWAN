// usage: node celebrate.cjs <url> <outPrefix>
// 모험길 끝까지 걸어간 뒤, 도착 축하를 시간 순서로 찍는다 (1440×900)
// 도착 직후 · 가운데로 나옴 · 학사모 들어 올림 · 씌움 · 꽃비 · 원래 자리
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
  const { top, height } = await page.evaluate(() => { const r = document.querySelector('[data-section="home:06b-journey"]').getBoundingClientRect(); return { top: r.top + scrollY, height: r.height }; });
  const run = height - (900 - 88);
  // 길 끝 직전까지 조금씩 걸어간다
  for (let i = 0; i <= 30; i++) { await page.evaluate(y => window.scrollTo(0, y), top - 88 + run * 0.9 * i / 30); await wait(40); }
  await wait(500);
  const t0 = Date.now();
  await page.evaluate(y => window.scrollTo(0, y), top - 88 + run * 0.99);
  // 시각은 Journey.tsx의 GLIDE_MS(400)·SCENE_FPS(20)에 맞춘다
  const shots = [[150, 'arrive'], [480, 'center'], [1700, 'lift'], [2500, 'capped'], [3100, 'rain'], [5800, 'back']];
  for (const [ms, name] of shots) {
    await wait(Math.max(0, ms - (Date.now() - t0)));
    await page.screenshot({ path: `${out}-${name}.jpg`, type: 'jpeg', quality: 82 });
  }
  console.log('errors', JSON.stringify(errors));
  await browser.close();
})();
