const puppeteer = require('puppeteer-core');
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  for (const mode of ['3d']) for (const [w, h] of [[1440, 900], [1280, 720], [1024, 768]]) {
    const page = await browser.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.setViewport({ width: w, height: h });
    await page.goto('http://localhost:5174/?hero=' + mode, { waitUntil: 'networkidle0' });
    await wait(mode === '3d' ? 4000 : 2000);
    const span = await page.evaluate(() => { const el = document.querySelector('[data-section="home:01-intro"] > div'); return el.offsetHeight - innerHeight; });
    for (const p of [0, 1]) {
      await page.evaluate(y => window.scrollTo(0, y), Math.round(p * span) + 1);
      await wait(mode === '3d' ? 1500 : 700);
      await page.screenshot({ path: `sz-${mode}-${w}-${p}.png` });
    }
    await page.close();
  }
  console.log('errors', JSON.stringify(errors));
  await browser.close();
})();
