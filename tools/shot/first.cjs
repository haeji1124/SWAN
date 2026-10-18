// usage: node first.cjs <url> <out.jpg> <width> <height>
// 처음 들어왔을 때의 첫 화면을 스크롤 없이 찍는다 (손 흔들기가 끝난 뒤 3초)
const puppeteer = require('puppeteer-core');
(async () => {
  const [url, out, w, h] = process.argv.slice(2);
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: Number(w), height: Number(h) });
  await page.goto(url, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 6000));
  await page.screenshot({ path: out, type: 'jpeg', quality: 85 });
  await browser.close();
})();
