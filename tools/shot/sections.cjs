// usage: node sections.cjs <url> <outDir> <width> <height> [user=<id>|fail] [reduced]
// 홈의 섹션마다 섹션 윗변(메뉴 아래)에서 한 화면씩 찍는다. 고정 스크롤 섹션(히어로·모험길)은 시작 화면.
// user: 개발용 테스트 사용자 쿠키를 바꿔 본다 (fail = 로그인 실패)
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const [url, outDir, w, h, ...rest] = process.argv.slice(2);
  const W = Number(w), H = Number(h);
  const reduced = rest.includes('reduced');
  const userArg = rest.find(a => a.startsWith('user='));
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H });
  if (reduced) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
  await page.goto(url, { waitUntil: 'networkidle0' });
  if (userArg) {
    const v = userArg.slice(5);
    await page.evaluate(async v => { await fetch('/api/dev/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ user_id: v === 'fail' ? null : Number(v) }) }).catch(() => {}); }, v);
    await page.goto(url, { waitUntil: 'networkidle0' });
  }
  // 끝까지 한 번 내려가 등장 움직임을 끝낸다
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < total; y += 500) { await page.evaluate(y => window.scrollTo(0, y), y); await wait(60); }
  await wait(800);
  const secs = await page.evaluate(() => [...document.querySelectorAll('[data-section]')].map(s => ({ name: s.dataset.section, top: s.getBoundingClientRect().top + scrollY })));
  for (const [i, s] of secs.entries()) {
    await page.evaluate(y => window.scrollTo(0, y), Math.max(0, s.top - 88));
    await wait(900);
    await page.screenshot({ path: `${outDir}/${String(i + 1).padStart(2, '0')}-${s.name.replace(/[:]/g, '_')}.jpg`, type: 'jpeg', quality: 80 });
  }
  console.log(JSON.stringify({ sections: secs.map(s => s.name), total, errors }));
  await browser.close();
})();
