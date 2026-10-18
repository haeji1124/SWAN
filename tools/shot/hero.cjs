const puppeteer = require('puppeteer-core');
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const mode = process.argv[2];
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
  await page.goto('http://localhost:5174/?hero=' + mode, { waitUntil: 'load', timeout: 90000 });
  await wait(mode === '3d' ? 5000 : 2500);
  const span = await page.evaluate(() => { const el = document.querySelector('[data-section="home:01-intro"] > div'); return el.offsetHeight - innerHeight; });
  const shots = [0, 0.25, 0.45, 0.6, 1];
  for (const p of shots) {
    await page.evaluate(y => window.scrollTo(0, y), Math.round(p * span) + 1);
    await wait(mode === '3d' ? 1500 : 600);
    await page.screenshot({ path: `hero-${mode}-${Math.round(p * 100)}.png` });
  }
  console.log(mode, 'span', span, 'errors', JSON.stringify(errors));
  await browser.close();
})();
