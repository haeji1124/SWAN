// usage: node states.cjs <url> <outDir>
// 상태 점검 (Phase 8)
// 1) 오류: 화면에 필요한 /api 요청을 500으로 실패시키고, 화면이 "불러오지 못했어요 · 다시 시도"를 보여 주는지
// 2) 권한: 권한 없는 사람이 들어가면 어떤 안내가 나오는지 (직원의 관리자 화면, 로그인 실패의 쓰기 화면, 남의 글 고치기, 없는 번호)
// 화면마다 찍고 화면에 보이는 글 앞부분을 남긴다
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const [base, out] = process.argv.slice(2);
  fs.mkdirSync(out, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.setRequestInterception(true);
  let failApi = null // 이 문자열이 들어간 /api GET 요청을 500으로 돌려준다 (/api/me는 그대로)
  page.on('request', req => {
    const u = req.url();
    if (failApi && req.method() === 'GET' && u.includes('/api/') && !u.includes('/api/me') && !u.includes('/api/dev') && u.includes(failApi))
      return req.respond({ status: 500, contentType: 'application/json', body: '{"detail":"서버 오류 (시험)"}' });
    req.continue();
  });
  const errors = [];
  page.on('pageerror', e => errors.push(`${page.url()} ${e.message}`));
  const as = async uid => { await page.setCookie({ name: 'swan_dev_user', value: uid === null ? 'fail' : String(uid), url: base }); };
  const text = () => page.evaluate(() => (document.querySelector('main')?.innerText || document.body.innerText).replace(/\s+/g, ' ').slice(0, 160));
  const result = { error: {}, access: {} };

  // 1) 오류 상태
  const errorPages = [
    ['/', '/api/home', 'home'], ['/projects', '/api/projects', 'projects'], ['/projects/1', '/api/projects/1', 'project'],
    ['/quiz', '/api/quiz', 'quiz'], ['/apply', '/api/apply', 'apply'], ['/toys', '/api/toys', 'toys'], ['/toys/1', '/api/toys/1', 'toy'],
    ['/ideas', '/api/ideas', 'ideas'], ['/admin/cohorts', '/api/admin', 'admin-cohorts'], ['/admin/ideas', '/api/admin', 'admin-ideas'],
    ['/admin/curriculum', '/api/admin', 'admin-curriculum'], ['/admin/admins', '/api/admin', 'admin-admins'],
  ];
  for (const [p, fail, name] of errorPages) {
    failApi = fail;
    await as(11);
    await page.goto(base + p, { waitUntil: 'networkidle0' });
    await wait(900);
    if (p === '/') await page.evaluate(() => window.scrollTo(0, 900));
    await wait(400);
    await page.screenshot({ path: `${out}/error-${name}.jpg`, type: 'jpeg', quality: 70 });
    result.error[name] = { retry: await page.evaluate(() => /다시 시도/.test(document.body.innerText)), text: await text() };
  }
  failApi = null;

  // 2) 권한 · 없는 주소
  const access = [
    [1, '/admin', 'employee-admin'], [null, '/projects/new', 'guest-project-new'], [1, '/projects/new', 'employee-project-new'],
    [null, '/toys/new', 'guest-toy-new'], [1, '/toys/new', 'employee-toy-new'], [9, '/toys/1/edit', 'other-toy-edit'],
    [1, '/projects/999', 'no-project'], [1, '/toys/999', 'no-toy'], [11, '/admin/projects/view/999', 'admin-no-project'],
    [8, '/projects/8/edit', 'other-project-edit'], [null, '/apply', 'guest-apply'], [null, '/admin/cohorts', 'guest-admin'],
  ];
  for (const [uid, p, name] of access) {
    await as(uid);
    await page.goto(base + p, { waitUntil: 'networkidle0' });
    await wait(1200);
    await page.screenshot({ path: `${out}/access-${name}.jpg`, type: 'jpeg', quality: 70 });
    result.access[name] = { url: page.url().replace(base, ''), text: await text() };
  }
  console.log(JSON.stringify(result, null, 1));
  console.log('errors', JSON.stringify(errors));
  await browser.close();
})();
