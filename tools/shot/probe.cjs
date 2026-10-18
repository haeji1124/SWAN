const puppeteer = require('puppeteer-core');
(async () => {
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const page = await browser.newPage();
  page.on('response', r => { if (r.status() >= 400) console.log(r.status(), r.url()); });
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle0' });
  await browser.close();
})();
