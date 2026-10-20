// usage: node heroclick.cjs <url> <outDir>
// 히어로 첫 화면에서 손 흔들기가 끝난 뒤 오리·강사를 눌러 반응(폴짝·갸웃)을 시간별로 찍는다
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const [base, out] = process.argv.slice(2);
  fs.mkdirSync(out, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 160)); });
  await page.goto(base + '/', { waitUntil: 'networkidle0' });
  await wait(6500); // 처음 손 흔들기 두 번(약 5초)이 끝날 때까지
  const log = [['누르는 자리', await page.evaluate(() => [...document.querySelectorAll('button[aria-label$="눌러 보세요"]')].map(b => b.getAttribute('aria-label')))]];
  await page.click('button[aria-label="오리를 눌러 보세요"]');
  const t0 = Date.now();
  for (const ms of [150, 700, 1100, 1700]) {
    await wait(t0 + ms - Date.now());
    await page.screenshot({ path: `${out}/duck-${ms}.jpg`, type: 'jpeg', quality: 82, clip: { x: 640, y: 120, width: 800, height: 700 } });
  }
  await page.click('button[aria-label="강사 백조를 눌러 보세요"]');
  const t1 = Date.now();
  for (const ms of [150, 1100, 2600]) {
    await wait(t1 + ms - Date.now());
    await page.screenshot({ path: `${out}/teacher-${ms}.jpg`, type: 'jpeg', quality: 82, clip: { x: 640, y: 120, width: 800, height: 700 } });
  }
  console.log(JSON.stringify(log), 'errors', JSON.stringify(errors));
  await browser.close();
})();
