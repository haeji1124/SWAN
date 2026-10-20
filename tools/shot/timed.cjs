// usage: node timed.cjs <url> <section> <outPrefix> [초,초,...]
// 홈의 한 섹션(data-section 이름)으로 건너뛴 뒤 정한 시각마다 1440×900을 찍는다 (오리 고개 내밀기, 강사 갸웃처럼 시간에 따라 바뀌는 움직임 확인용)
const puppeteer = require('puppeteer-core');
(async () => {
  const [url, section, prefix, times = '1,2,3,4'] = process.argv.slice(2);
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(url, { waitUntil: 'networkidle0' });
  await page.evaluate(s => {
    const el = document.querySelector(`[data-section="${s}"]`);
    window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 60);
  }, section);
  const start = Date.now();
  for (const t of times.split(',').map(Number)) {
    const wait = start + t * 1000 - Date.now();
    if (wait > 0) await new Promise(r => setTimeout(r, wait));
    await page.screenshot({ path: `${prefix}-${t}s.jpg`, type: 'jpeg', quality: 80 });
  }
  console.log('errors', JSON.stringify(errors));
  await browser.close();
})();
