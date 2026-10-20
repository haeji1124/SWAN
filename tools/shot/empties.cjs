// usage: node empties.cjs <url> <outDir>
// 빈 상태 화면을 찍는다: 관리자 권한으로 완성작을 모두 내리고(반려) 아이디어·모집 글을 숨겨 0개로 만든다.
// 개발 DB를 바꾸므로 끝나면 app/server에서 seed.py로 되돌린다
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const [base, out] = process.argv.slice(2);
  fs.mkdirSync(out, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const as = async uid => { await page.setCookie({ name: 'swan_dev_user', value: String(uid), url: base }); };
  const go = async p => { await page.goto(base + p, { waitUntil: 'networkidle0' }); await wait(900); };
  const call = (p, body) => page.evaluate(async (p, body) => {
    const r = await fetch(p, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {});
    return r.json();
  }, p, body);

  await as(11);
  await go('/');
  for (const p of (await call('/api/admin/projects?status=published')).items) await call(`/api/admin/projects/${p.id}/reject`, { reason: '빈 상태 캡처용 (seed로 되돌림)' })
  for (const i of (await call('/api/admin/ideas')).items) await call(`/api/admin/ideas/${i.id}/hide`, { hidden: true })
  for (const t of (await call('/api/admin/toys')).items) await call(`/api/admin/toys/${t.id}/hide`, { hidden: true })

  await as(1); // 직원으로 본다
  for (const [p, name] of [['/projects', 'projects'], ['/ideas', 'ideas'], ['/toys', 'toys']]) {
    await go(p);
    await page.screenshot({ path: `${out}/${name}.jpg`, type: 'jpeg', quality: 82 });
  }
  for (const s of ['home:04-showcase', 'home:09-ideas']) {
    await go('/');
    await page.evaluate(s => { const el = document.querySelector(`[data-section="${s}"]`); window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 60) }, s);
    await wait(1500);
    await page.screenshot({ path: `${out}/${s.replace('home:', 'home-')}.jpg`, type: 'jpeg', quality: 82 });
  }
  console.log('errors', JSON.stringify(errors));
  await browser.close();
})();
