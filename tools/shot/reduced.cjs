const puppeteer = require('puppeteer-core');
(async () => {
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle0' });
  // 스크롤하지 않고 바로: 숨겨진 요소와 숫자 값, 띠의 움직임 여부
  const r = await page.evaluate(() => ({
    hidden: [...document.querySelectorAll('[data-reveal]')].filter(e => getComputedStyle(e).opacity !== '1').length,
    total: document.querySelectorAll('[data-reveal]').length,
    numbers: [...document.querySelectorAll('[data-section="home:03-numbers"] .font-display')].map(e => e.textContent),
    marquee: getComputedStyle(document.querySelector('.marquee')).animationName,
  }));
  console.log(JSON.stringify(r));
  await browser.close();
})();
