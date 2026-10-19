// usage: node fly.cjs <url> <outPrefix> [초,초,...]
// 홈 맨 아래 마지막 신청 섹션으로 바로 건너뛴 뒤, 정한 시각마다 1440×900 화면을 찍는다 (날아오르는 어린 백조 확인용)
const puppeteer = require('puppeteer-core');
(async () => {
  const [url, prefix, times = '1,4,6,8,11,14'] = process.argv.slice(2);
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(url, { waitUntil: 'networkidle0' });
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const start = Date.now();
  for (const t of times.split(',').map(Number)) {
    const wait = start + t * 1000 - Date.now();
    if (wait > 0) await new Promise(r => setTimeout(r, wait));
    await page.screenshot({ path: `${prefix}-${String(t).padStart(2, '0')}s.jpg`, type: 'jpeg', quality: 80 });
  }
  console.log('errors', JSON.stringify(errors));
  await browser.close();
})();
