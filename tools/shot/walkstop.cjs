// usage: node walkstop.cjs <url> <out.jpg>
// 사람처럼 모험길 처음부터 휠을 쉬지 않고 굴린다 (0.05초마다 120px). 길 끝 도착 뒤에도 계속 굴려서,
// 축하 장면 동안 화면이 정말 멈춰 있는지 시간별 scrollY로 확인하고 도착 1.5초 뒤 화면을 찍는다
// 도착 0.5초 뒤에는 스크롤바를 끈 것처럼 1500px 내려 본다 (휠만 막던 예전 방식은 이걸 막지 못했다)
const puppeteer = require('puppeteer-core');
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const [url, out] = process.argv.slice(2);
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(url, { waitUntil: 'networkidle0' });
  const top = await page.evaluate(() => document.querySelector('[data-section="home:06b-journey"]').getBoundingClientRect().top + scrollY);
  await page.evaluate(y => window.scrollTo(0, y), top - 88);
  await wait(600);
  await page.mouse.move(720, 450);
  const t0 = Date.now();
  let arrivedAt = null, shot = false, dragged = 0;
  const log = [];
  while (Date.now() - t0 < 14000) {
    await page.mouse.wheel({ deltaY: 120 });
    await wait(50);
    const s = await page.evaluate(() => ({ y: Math.round(scrollY), playing: !!document.querySelector('[data-celebrate="playing"]') }));
    const t = Date.now() - t0;
    if (s.playing && arrivedAt === null) arrivedAt = t;
    log.push([t, s.y, s.playing]);
    if (arrivedAt !== null && !dragged && t - arrivedAt > 500) { await page.evaluate(() => window.scrollBy(0, 1500)); await wait(100); dragged = await page.evaluate(() => Math.round(scrollY)); }
    if (arrivedAt !== null && !shot && t - arrivedAt > 1500) { await page.screenshot({ path: out, type: 'jpeg', quality: 82 }); shot = true; }
    if (arrivedAt !== null && t - arrivedAt > 6000) break;
  }
  const at = ms => (log.find(([t]) => t >= ms) || log[log.length - 1])[1];
  if (arrivedAt === null) console.log('도착 못 함', log[log.length - 1]);
  else console.log(JSON.stringify({ arrivedMs: arrivedAt, yAtArrive: at(arrivedAt), moved1s: at(arrivedAt + 1000) - at(arrivedAt), moved2_5s: at(arrivedAt + 2500) - at(arrivedAt), moved5s: at(arrivedAt + 5000) - at(arrivedAt), yAfterDrag: dragged }));
  await browser.close();
})();
