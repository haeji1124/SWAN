// usage: node pages.cjs <base> <outDir> <userId|fail> <path=name> [<path=name> ...]
// 주소마다 1440×900 첫 화면을 찍는다 (비포·애프터 비교용). 예: node pages.cjs http://localhost:5174 out 11 /quiz=quiz /admin/quiz=admin-quiz
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const [base, out, uid, ...pairs] = process.argv.slice(2);
  fs.mkdirSync(out, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const page = await browser.newPage();
  // 창 크기: 기본 1440×900, 환경 변수 W·H로 바꾼다 (예: W=1920 H=1080)
  await page.setViewport({ width: Number(process.env.W) || 1440, height: Number(process.env.H) || 900 });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 160)); });
  await page.setCookie({ name: 'swan_dev_user', value: uid, url: base });
  for (const pair of pairs) {
    const [path, name] = pair.split('=');
    await page.goto(base + path, { waitUntil: 'networkidle0' });
    await wait(900);
    await page.screenshot({ path: `${out}/${name}.jpg`, type: 'jpeg', quality: 82 });
  }
  console.log('errors', JSON.stringify(errors));
  await browser.close();
})();
