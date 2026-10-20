// usage: node phase6.cjs <url> <outDir>
// Phase 6 확인 순서를 화면에서 따라 하며 찍는다 (개발 DB와 업로드 폴더를 바꾸므로 끝나면 seed.py로 되돌린다)
// 홈 맨 아래 링크 → /making 7구획 · 펼치기 · 복사 · 전체 프롬프트 → making.md 제목을 잠깐 바꿔 화면이 바뀌는지 (끝나면 되돌림) →
// 관리자: 단원 고치기 → 홈에 반영 · 실습 프로젝트 추가(그림) → 홈 목록 맨 뒤 · 위로 옮기기 · 지우기 → 관리자 추가 → 그 사람으로 관리자 화면 → 해제
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const [base, out] = process.argv.slice(2);
  fs.mkdirSync(out, { recursive: true });
  const md = path.resolve(__dirname, '../../app/web/src/content/making.md');
  const img = path.resolve(__dirname, '../../app/server/seed_assets/project-2.webp');
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 160)); });
  const as = async uid => { await page.setCookie({ name: 'swan_dev_user', value: String(uid), url: base }); };
  const shot = async (name, full) => { await wait(500); await page.screenshot({ path: `${out}/${name}.jpg`, type: 'jpeg', quality: 80, fullPage: !!full }); };
  const go = async p => { await page.goto(base + p, { waitUntil: 'networkidle0' }); await wait(700); };
  const clickText = async (sel, text) => {
    const ok = await page.evaluate((sel, text) => {
      const el = [...document.querySelectorAll(sel)].find(e => e.textContent.trim().includes(text) && !e.disabled);
      if (!el) return false;
      el.scrollIntoView({ block: 'center' });
      el.click();
      return true;
    }, sel, text);
    if (!ok) throw new Error(`못 찾음: ${text}`);
    await wait(800);
  };
  const typeIn = async (sel, text) => { await page.click(sel, { clickCount: 3 }); await page.keyboard.press('Backspace'); await page.type(sel, text); };
  const api = p => page.evaluate(async p => (await fetch(p)).json(), p);
  const log = [];

  // 1) 홈 맨 아래 링크 → /making
  await as(1);
  await go('/');
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await wait(800);
  await clickText('a', '이 사이트는 바이브코딩으로 만들었습니다');
  await wait(1200);
  log.push(['홈 링크 → 주소', page.url().replace(base, '')]);
  await shot('01-making-top');
  log.push(['구획 수', await page.evaluate(() => document.querySelectorAll('[data-section^="making:"]').length)]);
  // 2) 프롬프트 펼치기 · 복사 · 전체 프롬프트
  await clickText('main button', '펼쳐 보기');
  await shot('02-prompt-open');
  await clickText('main button', '복사하기');
  log.push(['복사 뒤 알림', await page.evaluate(() => document.querySelector('[aria-live="polite"]')?.innerText.trim())]);
  await clickText('main button', '전체 프롬프트 보기');
  await shot('03-all-prompts');
  log.push(['전체 프롬프트 항목', await page.evaluate(() => document.querySelectorAll('[data-section="making:04-prompts"] ol li').length)]);
  await page.evaluate(() => document.querySelector('[data-section="making:05-stuck"]').scrollIntoView());
  await shot('04-stuck');
  await shot('05-making-full', true);

  // 3) 내용 파일만 고쳐도 화면이 바뀐다 (잠깐 바꾸고 바로 되돌린다)
  const original = fs.readFileSync(md, 'utf8');
  try {
    fs.writeFileSync(md, original.replace('- 제목: 이 사이트는 바이브코딩으로 만들었습니다', '- 제목: 이 사이트는 바이브코딩으로 만들었습니다 (내용 파일 시험)'));
    await wait(2500);
    await go('/making');
    log.push(['파일 고친 뒤 제목', await page.evaluate(() => document.querySelector('h1').innerText.replace(/\n/g, ' '))]);
    await shot('06-content-edited');
  } finally {
    fs.writeFileSync(md, original);
  }
  await wait(2500);

  // 4) 관리자: 단원 고치기 → 홈
  await as(11);
  await go('/admin/curriculum');
  await shot('07-admin-curriculum');
  await clickText('tbody button', '고치기');
  await typeIn('input[aria-label="단원 제목"]', '파이썬 환경 구성 (시험으로 고침)');
  await shot('08-unit-edit');
  await clickText('tbody button', '저장');
  log.push(['홈 단원 제목', (await api('/api/home')).units[0].title]);

  // 5) 실습 프로젝트 추가(그림) → 홈 목록 맨 뒤
  await clickText('main button', '프로젝트 추가');
  await page.type('form[role=dialog] input', '엑셀 보고서 자동화');
  await page.type('form[role=dialog] input[placeholder^="무엇을"]', '엑셀 실적표를 읽어 주간 보고서를 만든다');
  await page.type('form[role=dialog] textarea', 'openpyxl로 읽기\n표와 그래프 만들기');
  await page.type('form[role=dialog] input[placeholder^="예: 기능이"]', '반복 업무를 코드로');
  const [fileInput] = await page.$$('form[role=dialog] input[type=file]');
  await fileInput.uploadFile(img);
  await wait(500);
  await shot('09-project-dialog');
  await clickText('form[role=dialog] button[type=submit]', '추가하기');
  await wait(800);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await shot('10-project-added');
  let projects = (await api('/api/home')).projects;
  log.push(['홈 실습 프로젝트 마지막', `${projects.length}개 / ${projects[projects.length - 1].title} / 그림 ${!!projects[projects.length - 1].preview_image}`]);
  // 위로 옮기기, 지우기
  await page.click('button[aria-label="엑셀 보고서 자동화 위로"]');
  await wait(800);
  projects = (await api('/api/home')).projects;
  log.push(['한 칸 위로 뒤 끝에서 두 번째', projects[projects.length - 2].title]);
  await page.evaluate(() => [...document.querySelectorAll('main li')].find(li => li.textContent.includes('엑셀 보고서 자동화')).querySelector('button.text-error').click());
  await wait(500);
  await shot('11-project-delete-confirm');
  await clickText('[role=alertdialog] button', '지우기');
  log.push(['지운 뒤 실습 프로젝트 수', (await api('/api/home')).projects.length]);

  // 6) 관리자 추가 → 그 사람으로 관리자 화면 → 해제
  await go('/admin/admins');
  await page.type('input[aria-label="사번이나 이름으로 찾기"]', '오지');
  await wait(900);
  await shot('12-admin-search');
  await clickText('main li button', '추가');
  await shot('13-admin-add-confirm');
  await clickText('[role=alertdialog] button', '추가하기');
  await shot('14-admin-added');
  await as(2);
  await go('/admin/cohorts');
  log.push(['추가된 사람이 관리자 화면', await page.evaluate(() => !!document.querySelector('aside nav'))]);
  await as(11);
  await go('/admin/admins');
  await page.evaluate(() => [...document.querySelectorAll('tbody tr')].find(tr => tr.textContent.includes('오지유')).querySelector('button').click());
  await wait(500);
  await clickText('[role=alertdialog] button', '해제하기');
  await shot('15-admin-removed');
  log.push(['내 줄에 해제 버튼', await page.evaluate(() => !![...document.querySelectorAll('tbody tr')].find(tr => tr.textContent.includes('정나연')).querySelector('button'))]);

  console.log(JSON.stringify(log, null, 1));
  console.log('errors', JSON.stringify(errors));
  await browser.close();
})();
