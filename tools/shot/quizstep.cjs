// usage: node quizstep.cjs <url> <outDir>
// 수준 테스트 첫 화면과 1번 문제 화면을 찍는다 (상단 머리 비교용, 기록은 남기지 않음 — 문제만 열어 본다)
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
  await page.setCookie({ name: 'swan_dev_user', value: '1', url: base });
  await page.goto(base + '/quiz', { waitUntil: 'networkidle0' });
  await wait(800);
  await page.screenshot({ path: `${out}/quiz-start.jpg`, type: 'jpeg', quality: 82 });
  await page.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent.includes('시작하기')).click());
  await wait(1000);
  await page.screenshot({ path: `${out}/quiz-q1.jpg`, type: 'jpeg', quality: 82 });
  // 메뉴와 로고가 있는지
  const nav = await page.evaluate(() => ({
    menus: [...document.querySelectorAll('header nav a')].map(a => a.textContent.trim()),
    logoHref: document.querySelector('header a[href="/"]')?.getAttribute('href') ?? null,
  }));
  console.log(JSON.stringify(nav), 'errors', JSON.stringify(errors));
  await browser.close();
})();
