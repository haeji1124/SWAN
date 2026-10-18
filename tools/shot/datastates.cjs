// usage: node datastates.cjs <url> <outPrefix> <loading|error|retry>
// /api/home을 일부러 응답하지 않거나(loading) 500으로 돌려(error) 데이터를 쓰는 섹션을 1280×800으로 찍는다.
// retry: 처음 두 번은 500(개발 모드는 첫 요청이 두 번 나간다), 그 뒤로는 정상 → 오류 화면에서 [다시 시도]를 눌러 채워지는지 본다
const puppeteer = require('puppeteer-core');
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const [url, out, mode] = process.argv.slice(2);
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.setRequestInterception(true);
  let homeCalls = 0;
  page.on('request', r => {
    if (!r.url().includes('/api/home')) return r.continue();
    homeCalls += 1;
    if (mode === 'loading') return; // 응답하지 않는다 = 계속 불러오는 중
    if (mode === 'error' || (mode === 'retry' && homeCalls <= 2)) return r.respond({ status: 500, body: 'err' });
    r.continue();
  });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(url, { waitUntil: mode === 'loading' ? 'domcontentloaded' : 'networkidle0' });
  await wait(2500);
  await page.screenshot({ path: `${out}-hero.jpg`, type: 'jpeg', quality: 80 });
  if (mode === 'retry') {
    const btn = await page.$('[data-retry]');
    if (btn) { await btn.click(); await wait(1500); }
    console.log('retry button', !!btn, 'calls', homeCalls);
  }
  const secs = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('[data-section]')].map(s => [s.dataset.section, s.getBoundingClientRect().top + scrollY])));
  for (const n of ['home:02-summary', 'home:03-numbers', 'home:06-curriculum', 'home:10-final']) {
    await page.evaluate(y => window.scrollTo(0, y), secs[n] - 88);
    await wait(900);
    await page.screenshot({ path: `${out}-${n.split(':')[1]}.jpg`, type: 'jpeg', quality: 80 });
  }
  console.log(mode, 'errors', JSON.stringify(errors));
  await browser.close();
})();
