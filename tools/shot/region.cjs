// usage: node region.cjs <url> <selector> <offsetY> <out.jpg> [reduced]
// 홈을 끝까지 한 번 스크롤해 등장 움직임을 끝낸 뒤, selector 윗변 + offsetY 위치에서 1440×900 화면을 찍는다
const puppeteer = require('puppeteer-core');
(async () => {
  const [url, selector, offset, out, reduced] = process.argv.slice(2);
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  if (reduced) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(url, { waitUntil: 'networkidle0' });
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 400) { await page.evaluate(y => window.scrollTo(0, y), y); await new Promise(r => setTimeout(r, 100)); }
  await new Promise(r => setTimeout(r, 4000)); // 모험길 끝에서 축하하는 동안(약 2.5초) 스크롤이 붙잡히므로 풀릴 때까지 기다린다
  const top = await page.evaluate(s => document.querySelector(s).getBoundingClientRect().top + window.scrollY, selector);
  await page.evaluate(y => window.scrollTo(0, y), Math.max(0, top + Number(offset)));
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: out, type: 'jpeg', quality: 82 });
  console.log('top', top, 'errors', JSON.stringify(errors));
  await browser.close();
})();
