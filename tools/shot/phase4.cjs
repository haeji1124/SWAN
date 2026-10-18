// usage: node phase4.cjs <url> <outDir>
// Phase 4 확인 순서를 화면에서 그대로 따라 하며 찍는다 (개발 DB와 업로드 폴더를 바꾸므로 끝나면 seed.py로 되돌린다)
// 직원: 목록·카드 마우스 올림·필터·정렬·상세·좋아요·캡처 크게 보기 → 졸업생: 올리기 → 관리자: 반려 →
// 졸업생: 반려 이유 보고 고쳐 다시 올리기 → 관리자: 승인 → 직원: 목록에서 확인·좋아요 → 직원이 /projects/new → 홈
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const [base, out] = process.argv.slice(2);
  fs.mkdirSync(out, { recursive: true });
  const img = path.resolve(__dirname, '../../app/server/seed_assets/project-3.webp');
  const shotImg = path.resolve(__dirname, '../../app/server/seed_assets/project-6.webp');
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 160)); });
  const as = async uid => { await page.setCookie({ name: 'swan_dev_user', value: String(uid), url: base }); };
  const shot = async (name, full) => { await wait(500); await page.screenshot({ path: `${out}/${name}.jpg`, type: 'jpeg', quality: 82, fullPage: !!full }); };
  const go = async p => { await page.goto(base + p, { waitUntil: 'networkidle0' }); await wait(700); };
  const clickText = async (sel, text) => {
    const ok = await page.evaluate((sel, text) => { const el = [...document.querySelectorAll(sel)].find(e => e.textContent.trim().includes(text) && !e.disabled); if (el) { el.click(); return true } return false }, sel, text);
    if (!ok) throw new Error(`못 찾음: ${text}`);
    await wait(700);
  };
  // 하트는 화면 가운데로 옮긴 뒤 누른다 (화면 아래 오른쪽의 개발용 사용자 상자가 가릴 수 있다)
  const clickHeart = async () => { await page.evaluate(() => document.querySelector('button[aria-pressed]').scrollIntoView({ block: 'center' })); await wait(200); await page.click('button[aria-pressed]'); };
  const text = sel => page.evaluate(sel => document.querySelector(sel)?.innerText.replace(/\n+/g, ' / ').slice(0, 200), sel);
  const log = [];

  // 1) 직원: 목록
  await as(1);
  await go('/projects');
  await shot('01-list');
  log.push(['목록 카드 수', await page.evaluate(() => document.querySelectorAll('main a[href^="/projects/"]').length)]);
  log.push(['직원에게 올리기 버튼', await page.evaluate(() => !![...document.querySelectorAll('a')].find(a => a.textContent.includes('완성작 올리기')))]);
  await page.hover('main a[href^="/projects/"]');
  await shot('02-card-hover');
  await clickText('main button', '3기');
  await wait(600);
  log.push(['3기 필터 카드 수', await page.evaluate(() => document.querySelectorAll('main a[href^="/projects/"]').length)]);
  await clickText('main button', '전체 기수');
  await clickText('main button', '좋아요순');
  await wait(600);
  await shot('03-sort-likes');
  // 상세
  await page.click('main a[href^="/projects/"]');
  await wait(1500);
  await shot('04-detail');
  await shot('05-detail-full', true);
  const before = await text('button[aria-pressed]');
  await clickHeart();
  await wait(800);
  log.push(['좋아요 전→후', `${before} → ${await text('button[aria-pressed]')}`]);
  await page.evaluate(() => document.querySelector('button[aria-label^="화면 캡처"]')?.scrollIntoView({ block: 'center' }));
  await page.click('button[aria-label^="화면 캡처"]');
  await shot('06-zoom');
  await page.keyboard.press('Escape');

  // 2) 졸업생(2기): 올리기
  await as(9);
  await go('/projects');
  await shot('07-alumni-list');
  await go('/projects/new');
  await wait(1500);
  await shot('08-new-empty');
  log.push(['확인 체크 전 올리기 버튼', await page.evaluate(() => [...document.querySelectorAll('button[type=submit]')][0].disabled)]);
  const typeIn = async (ph, v) => { const el = await page.$(`input[placeholder="${ph}"], textarea[placeholder="${ph}"]`); await el.type(v); };
  await typeIn('예: 설비 로그 자동 요약기', '라인 점검표 모으기 (가상)');
  await typeIn('무엇을 해 주는 도구인지 한두 줄로', '흩어진 점검표 엑셀을 한 표로 합쳐 줘요');
  await typeIn('이 도구가 없을 때 무엇이 불편했나요?', '점검표 엑셀 열두 개를 매주 손으로 합쳤어요.');
  const files = await page.$$('input[type=file]');
  await files[0].uploadFile(img);
  await files[1].uploadFile(shotImg);
  await wait(400);
  await page.click('.toastui-editor-ww-container .ProseMirror');
  await page.keyboard.type('엑셀 파일을 고르면 같은 열끼리 맞춰 합칩니다.');
  await page.click('input[type=checkbox]');
  await shot('09-new-filled', true);
  await clickText('button[type=submit]', '올리기');
  await wait(1500);
  const newId = page.url().split('/').pop();
  await shot('10-after-upload');
  log.push(['올린 뒤 주소 · 상태', `${page.url().replace(base, '')} · ${await text('main article')?.then?.(x => x) ?? ''}`.slice(0, 80)]);
  log.push(['올린 사람 상태 줄', await page.evaluate(() => document.querySelector('main .mb-8')?.innerText.replace(/\n+/g, ' / '))]);

  // 3) 관리자: 반려
  await as(11);
  await go('/admin/projects');
  await shot('11-admin-pending');
  await go(`/admin/projects/view/${newId}`);
  await wait(1200);
  await shot('12-admin-preview');
  await clickText('button', '반려');
  await page.type('textarea', '화면 캡처에 실제 라인 이름이 보여요. 가리거나 예시 데이터로 바꿔 주세요.');
  await shot('13-admin-reject');
  await clickText('button', '반려하기');
  await wait(800);

  // 4) 졸업생: 반려 이유 보고 고쳐 다시 올리기
  await as(9);
  await go('/projects');
  await shot('14-alumni-rejected');
  log.push(['내 완성작 줄', await page.evaluate(() => [...document.querySelectorAll('main li')].map(l => l.innerText.replace(/\n+/g, ' / ')).find(t => t.includes('라인 점검표')))]);
  await go(`/projects/${newId}/edit`);
  await wait(1500);
  const title = await page.$('input[placeholder="예: 설비 로그 자동 요약기"]');
  await title.click({ clickCount: 3 });
  await title.type('라인 점검표 모으기');
  await page.click('button[aria-label="이 캡처 빼기"]');
  await page.click('input[type=checkbox]');
  await shot('15-edit');
  await clickText('button[type=submit]', '다시 올리기');
  await wait(1500);
  log.push(['고친 뒤 상태 줄', await page.evaluate(() => document.querySelector('main .mb-8')?.innerText.replace(/\n+/g, ' / '))]);

  // 5) 관리자: 승인
  await as(11);
  await go(`/admin/projects/view/${newId}`);
  await wait(1000);
  await clickText('button', '승인');
  await clickText('.fixed.inset-0 button', '승인');
  await wait(900);
  await go('/admin/projects/published');
  await shot('16-admin-published');

  // 6) 직원: 목록에서 확인 · 좋아요
  await as(1);
  await go('/projects');
  log.push(['승인 뒤 목록에 있음', await page.evaluate(id => !!document.querySelector(`main a[href="/projects/${id}"]`), newId)]);
  await go(`/projects/${newId}`);
  await clickHeart();
  await wait(700);
  log.push(['새 완성작 좋아요', await text('button[aria-pressed]')]);
  await shot('17-new-detail');
  await go('/projects/new');
  await shot('18-employee-new');
  log.push(['직원의 /projects/new', await text('main section')]);

  // 7) 로그인 실패: 좋아요 누르면 안내
  await as('fail');
  await go(`/projects/${newId}`);
  await clickHeart();
  await wait(300);
  log.push(['로그인 실패 좋아요', await page.evaluate(() => document.body.innerText.includes('로그인이 필요해요'))]);

  // 8) 홈 미리보기
  await as(1);
  await go('/');
  const top = await page.evaluate(() => document.querySelector('[data-section="home:04-showcase"]').getBoundingClientRect().top + scrollY);
  for (let y = 0; y < top; y += 500) { await page.evaluate(y => scrollTo(0, y), y); await wait(60); }
  await page.evaluate(y => scrollTo(0, y - 100), top);
  await wait(1500);
  await shot('19-home-showcase');

  for (const [k, v] of log) console.log(`${k}: ${v}`);
  console.log('errors', JSON.stringify(errors));
  await browser.close();
})();
