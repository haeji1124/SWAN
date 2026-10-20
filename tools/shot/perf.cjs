// usage: node perf.cjs <url>
// 성능 점검 (Phase 8): 홈을 처음 열 때 받는 양(종류별), 첫 화면이 뜨기까지, 사람처럼 휠로 끝까지 내릴 때 초당 장면 수
const puppeteer = require('puppeteer-core');
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const [base] = process.argv.slice(2);
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const cdp = await page.createCDPSession();
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  const bytes = {};
  const urls = {};
  cdp.on('Network.responseReceived', e => { urls[e.requestId] = e.response.url; });
  cdp.on('Network.loadingFinished', e => {
    const u = urls[e.requestId] || '';
    const kind = u.includes('/frames/') ? 'frames' : /\.(webp|png|jpg)/.test(u) ? 'images' : /\.(woff2?|ttf)/.test(u) ? 'fonts' : /\.js/.test(u) ? 'js' : /\.css/.test(u) ? 'css' : u.includes('/api/') ? 'api' : 'other';
    bytes[kind] = (bytes[kind] || 0) + e.encodedDataLength;
    bytes.count = (bytes.count || 0) + 1;
  });
  const t0 = Date.now();
  await page.goto(base + '/', { waitUntil: 'load' });
  const loadMs = Date.now() - t0;
  await page.waitForNetworkIdle({ idleTime: 800 });
  const idleMs = Date.now() - t0;
  const atIdle = { ...bytes };
  if (process.env.SETTLE) await wait(Number(process.env.SETTLE)); // 사람이 첫 화면을 보는 시간 (한가할 때 미리 받기를 재려고)
  // 휠로 끝까지: 120px씩, 16ms 간격 (빠르게 훑는 사람). 그동안 requestAnimationFrame 수를 센다
  await page.evaluate(() => { window.__frames = []; const f = t => { window.__frames.push(t); requestAnimationFrame(f) }; requestAnimationFrame(f) });
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.mouse.move(700, 450);
  const s0 = Date.now();
  for (let y = 0; y < h; y += 120) { await page.mouse.wheel({ deltaY: 120 }); await wait(16); }
  const scrollMs = Date.now() - s0;
  await wait(500);
  const gaps = await page.evaluate(() => { const f = window.__frames; const g = []; for (let i = 1; i < f.length; i++) g.push(f[i] - f[i - 1]); return g });
  gaps.sort((a, b) => a - b);
  const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  const mb = n => (n / 1024 / 1024).toFixed(2) + 'MB';
  const fmt = o => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, k === 'count' ? v : mb(v)]));
  console.log(JSON.stringify({
    loadMs, idleMs, firstIdle: fmt(atIdle), afterScroll: fmt(bytes), scrollMs,
    fps: (1000 / avg).toFixed(1), p95FrameMs: gaps[Math.floor(gaps.length * 0.95)].toFixed(1), worstFrameMs: gaps[gaps.length - 1].toFixed(1),
    longFrames: gaps.filter(g => g > 50).length, frames: gaps.length,
  }, null, 1));
  await browser.close();
})();
