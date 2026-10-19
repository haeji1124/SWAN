// usage: node quizleave.cjs <url> <outDir>
// 수준 테스트를 풀던 중에 상단 메뉴를 누르면 먼저 묻는지 확인한다 (계속 풀기 → 그대로 · 그만두기 → 옮김). 제출하지 않으니 기록이 남지 않는다
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
  await page.setCookie({ name: 'swan_dev_user', value: '1', url: base });
  const click = async (sel, text) => { await page.evaluate((sel, text) => [...document.querySelectorAll(sel)].find(e => e.textContent.trim().includes(text)).click(), sel, text); await wait(600); };
  const log = [];
  await page.goto(base + '/quiz', { waitUntil: 'networkidle0' });
  await wait(600);
  // 고르기 전에는 묻지 않는다
  await click('button', '시작하기');
  await click('header nav a', '완성작');
  log.push(['고르기 전 메뉴', page.url().replace(base, '')]);
  await page.goto(base + '/quiz', { waitUntil: 'networkidle0' });
  await wait(600);
  await click('button', '시작하기');
  await page.evaluate(() => document.querySelector('main [role=radio], main input[type=radio], main button[aria-pressed]')?.click() ?? [...document.querySelectorAll('main button')].find(b => b.textContent.includes('①'))?.click());
  await wait(400);
  await click('header nav a', '완성작');
  await page.screenshot({ path: `${out}/quiz-leave-confirm.jpg`, type: 'jpeg', quality: 82 });
  log.push(['풀던 중 메뉴 → 묻는 창', await page.evaluate(() => document.querySelector('[role=alertdialog] h2')?.textContent ?? null)]);
  await click('[role=alertdialog] button', '계속 풀기');
  log.push(['계속 풀기 뒤', page.url().replace(base, '')]);
  await click('header a[href="/"]', 'SWAN');
  await click('[role=alertdialog] button', '그만두기');
  log.push(['로고 → 그만두기 뒤', page.url().replace(base, '')]);
  console.log(JSON.stringify(log), 'errors', JSON.stringify(errors));
  await browser.close();
})();
