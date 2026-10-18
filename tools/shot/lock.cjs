// usage: node lock.cjs <url>
// 모험길 끝에 도착한 뒤 마우스 휠을 굴려, 축하 중에는 스크롤이 막히고 꽃비 뒤에는 풀리는지 확인한다
const puppeteer = require('puppeteer-core');
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const [url] = process.argv.slice(2);
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(url, { waitUntil: 'networkidle0' });
  const { top, height } = await page.evaluate(() => { const r = document.querySelector('[data-section="home:06b-journey"]').getBoundingClientRect(); return { top: r.top + scrollY, height: r.height }; });
  const run = height - (900 - 88);
  for (let i = 0; i <= 30; i++) { await page.evaluate(y => window.scrollTo(0, y), top - 88 + run * 0.9 * i / 30); await wait(40); }
  await page.evaluate(y => window.scrollTo(0, y), top - 88 + run * 0.99);
  await wait(400);
  await page.mouse.move(720, 450);
  const y0 = await page.evaluate(() => scrollY);
  await page.mouse.wheel({ deltaY: 800 }); await wait(500);
  const y1 = await page.evaluate(() => scrollY);
  await wait(5600);
  await page.mouse.wheel({ deltaY: 800 }); await wait(500);
  const y2 = await page.evaluate(() => scrollY);
  console.log(JSON.stringify({ duringCelebration: y1 - y0, afterRain: y2 - y1 }));
  await browser.close();
})();
