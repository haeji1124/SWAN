// usage: node offline.cjs <url> <outDir>
// 사내망 반입 점검: localhost 밖으로 나가는 요청을 모두 막은 채 모든 화면을 돌며
// 막힌 요청(외부 연결), 실패한 요청(404 등), 콘솔 오류를 센다. 화면마다 첫 화면을 찍는다
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const [base, out] = process.argv.slice(2);
  fs.mkdirSync(out, { recursive: true });
  const host = new URL(base).host;
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.setRequestInterception(true);
  const blocked = new Set();
  const failed = new Set();
  const errors = [];
  page.on('request', req => {
    const u = req.url();
    if (u.startsWith('data:') || u.startsWith('blob:') || new URL(u).host === host) return req.continue();
    blocked.add(u);
    req.abort();
  });
  page.on('response', res => { if (res.status() >= 400 && !res.url().includes('/api/')) failed.add(`${res.status()} ${res.url()}`); });
  page.on('pageerror', e => errors.push(`${page.url()} ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') errors.push(`${page.url().replace(base, '')} ${m.text().slice(0, 140)}`); });
  const as = async uid => { await page.setCookie({ name: 'swan_dev_user', value: String(uid), url: base }); };
  const visit = async (p, name, scroll) => {
    await page.goto(base + p, { waitUntil: 'networkidle0' });
    await wait(800);
    if (scroll) {
      const h = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < h; y += 500) { await page.evaluate(y => window.scrollTo(0, y), y); await wait(120); }
      await wait(1500);
      await page.evaluate(() => window.scrollTo(0, 0));
      await wait(500);
    }
    await page.screenshot({ path: `${out}/${name}.jpg`, type: 'jpeg', quality: 70 });
  };
  const pages = [
    [1, '/', 'home', true], [1, '/?hero=3d', 'home-3d', false], [1, '/projects', 'projects'], [1, '/projects/1', 'project-detail', true],
    [1, '/quiz', 'quiz'], [1, '/apply', 'apply'], [1, '/toys', 'toys'], [1, '/toys/1', 'toy'], [1, '/ideas', 'ideas'], [1, '/making', 'making', true],
    [9, '/projects/new', 'project-new', true], [8, '/toys/new', 'toy-new'],
    [11, '/admin/cohorts', 'admin-cohorts'], [11, '/admin/applicants', 'admin-applicants'], [11, '/admin/alumni', 'admin-alumni'],
    [11, '/admin/projects', 'admin-projects'], [11, '/admin/projects/view/7', 'admin-project-view', true], [11, '/admin/toys', 'admin-toys'],
    [11, '/admin/ideas', 'admin-ideas'], [11, '/admin/quiz', 'admin-quiz'], [11, '/admin/quiz/attempts', 'admin-attempts'],
    [11, '/admin/curriculum', 'admin-curriculum'], [11, '/admin/admins', 'admin-admins'], [1, '/nowhere', 'not-found'],
  ];
  for (const [uid, p, name, scroll] of pages) {
    await as(uid);
    await visit(p, name, scroll);
  }
  console.log(JSON.stringify({ pages: pages.length, blocked: [...blocked], failed: [...failed], errors }, null, 1));
  await browser.close();
})();
