// usage: node phase2.cjs <url> <outDir> <xlsxPath>
// Phase 2 확인 순서를 화면에서 그대로 따라 하며 찍는다 (개발 DB를 바꾸므로 끝나면 seed.py로 되돌린다)
// 1) 직원: 신청 → 접수 완료 → [신청 완료] → 취소  2) 관리자: 모집 닫기 → 직원: [다음 기수 알림 받기]
// 3) 관리자: 신청자 표·엑셀, 졸업생 엑셀 올리기 → 홈 숫자  4) 직원이 /admin
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const [base, out, xlsxPath] = process.argv.slice(2);
  fs.mkdirSync(out, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 160)); });
  const as = async uid => { await page.setCookie({ name: 'swan_dev_user', value: String(uid), url: base }); };
  const shot = async name => { await wait(500); await page.screenshot({ path: `${out}/${name}.jpg`, type: 'jpeg', quality: 82 }); };
  const navText = () => page.evaluate(() => document.querySelector('header .inline-flex button')?.textContent.trim());
  const clickText = async (sel, text) => {
    const ok = await page.evaluate((sel, text) => { const el = [...document.querySelectorAll(sel)].find(e => e.textContent.trim().includes(text) && !e.disabled); if (el) { el.click(); return true } return false }, sel, text);
    if (!ok) throw new Error(`못 찾음: ${text}`);
    await wait(700);
  };
  const log = [];

  // 1) 직원 한서준
  await as(1);
  await page.goto(base + '/', { waitUntil: 'networkidle0' });
  log.push(['처음 상단 버튼', await navText()]);
  await clickText('header button', '신청하기');
  await wait(800);
  log.push(['신청하기 → 주소', page.url().replace(base, '')]);
  await shot('01-apply-form');
  await page.click('input[value="script"] + span');
  await page.type('#want', '매일 아침 설비 로그를 모아 보는 일 (가상)');
  await shot('02-apply-filled');
  await clickText('button[type=submit]', '신청하기');
  await wait(1200);
  await shot('03-apply-done');
  log.push(['접수 완료 제목', await page.evaluate(() => document.querySelector('h1').innerText.replace(/\n/g, ' '))]);
  await page.goto(base + '/', { waitUntil: 'networkidle0' });
  log.push(['신청 뒤 상단 버튼', await navText()]);
  await clickText('header button', '신청 완료');
  await shot('04-cancel-confirm');
  log.push(['확인 창', await page.evaluate(() => document.querySelector('[role=dialog], .fixed.inset-0')?.innerText.replace(/\n/g, ' / ').slice(0, 80))]);
  await clickText('.fixed.inset-0 button', '신청 취소');
  await wait(800);
  log.push(['취소 뒤 상단 버튼', await navText()]);
  // 다시 신청해서 표에 남긴다
  await page.goto(base + '/apply', { waitUntil: 'networkidle0' });
  await page.click('input[value="none"] + span');
  await clickText('button[type=submit]', '신청하기');
  await wait(1000);
  await page.goto(base + '/apply', { waitUntil: 'networkidle0' });
  await shot('05-already-applied');

  // 4) 직원이 /admin
  await page.goto(base + '/admin', { waitUntil: 'networkidle0' });
  log.push(['직원의 /admin', await page.evaluate(() => document.querySelector('h1')?.innerText)]);

  // 2) 관리자 정나연: 기수 → 모집 닫기
  await as(11);
  await page.goto(base + '/admin/cohorts', { waitUntil: 'networkidle0' });
  await shot('06-admin-cohorts');
  await clickText('button', '모집 닫기');
  await clickText('.fixed.inset-0 button', '모집 닫기');
  await wait(800);
  await shot('07-admin-closed');
  await as(2);
  await page.goto(base + '/', { waitUntil: 'networkidle0' });
  log.push(['모집 닫은 뒤 직원 상단 버튼', await navText()]);
  await clickText('header button', '다음 기수 알림 받기');
  await wait(800);
  log.push(['알림 받기 누른 뒤', await navText()]);
  await shot('08-interest');
  await page.goto(base + '/apply', { waitUntil: 'networkidle0' });
  await shot('09-apply-not-recruiting');

  // 다시 열기
  await as(11);
  await page.goto(base + '/admin/cohorts', { waitUntil: 'networkidle0' });
  await clickText('button', '모집 열기');
  await wait(800);
  // 기수 추가 폼
  await clickText('button', '기수 추가');
  await shot('10-admin-cohort-form');
  await clickText('button', '그만두기');

  // 3) 신청자
  await page.goto(base + '/admin/applicants', { waitUntil: 'networkidle0' });
  await shot('11-admin-applicants');
  const href = await page.evaluate(() => document.querySelector('a[href*="applicants.xlsx"]')?.getAttribute('href'));
  const dl = await page.evaluate(async h => { const r = await fetch(h); return { status: r.status, type: r.headers.get('content-type'), size: (await r.arrayBuffer()).byteLength, disp: r.headers.get('content-disposition') }; }, href);
  log.push(['엑셀 내려받기', JSON.stringify(dl)]);

  // 졸업생 엑셀 올리기
  const before = await page.evaluate(() => fetch('/api/home').then(r => r.json()).then(d => d.stats));
  await page.goto(base + '/admin/alumni', { waitUntil: 'networkidle0' });
  await shot('12-admin-alumni');
  const input = await page.$('input[type=file]');
  await input.uploadFile(xlsxPath);
  await wait(1500);
  await shot('13-admin-alumni-preview');
  await clickText('button', '명 올리기');
  await wait(1200);
  await shot('14-admin-alumni-done');
  const after = await page.evaluate(() => fetch('/api/home').then(r => r.json()).then(d => d.stats));
  log.push(['홈 숫자 전 → 후', `수료 ${before.alumni}→${after.alumni}, 부서 ${before.depts}→${after.depts}`]);

  for (const [k, v] of log) console.log(`${k}: ${v}`);
  console.log('errors', JSON.stringify(errors));
  await browser.close();
})();
