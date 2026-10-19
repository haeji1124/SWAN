// usage: node phase5.cjs <url> <outDir>
// Phase 5 확인 순서를 화면에서 그대로 따라 하며 찍는다 (개발 DB를 바꾸므로 끝나면 seed.py로 되돌린다)
// 직원 2: 아이디어 남기기(부서만) → 직원 3: 공감 → 관리자: 상태 변경·답변 → 직원 3: 카드에서 확인 → 관리자: 숨기기 →
// 직원 1: 토이프로젝트에 글쓰기·참여 버튼 없음 → 졸업생 8: 모집 글 → 수강생 7: 참여 → 졸업생 8: 희망자 확인·마감 →
// 관리자: 모집 글 숨기기 → 홈 ⑩ 미리보기 3개 · 1개 · 0개
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
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 160)); });
  const as = async uid => { await page.setCookie({ name: 'swan_dev_user', value: String(uid), url: base }); };
  const shot = async (name, full) => { await wait(500); await page.screenshot({ path: `${out}/${name}.jpg`, type: 'jpeg', quality: 82, fullPage: !!full }); };
  const go = async p => { await page.goto(base + p, { waitUntil: 'networkidle0' }); await wait(700); };
  // 눌러야 할 것을 화면 가운데로 옮긴 뒤 누른다 (화면 아래 오른쪽의 개발용 사용자 상자가 가릴 수 있다)
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
  const has = (sel, text) => page.evaluate((sel, text) => !![...document.querySelectorAll(sel)].find(e => e.textContent.includes(text)), sel, text);
  const api = (p, body) => page.evaluate(async (p, body) => {
    const r = await fetch(p, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {});
    return r.json();
  }, p, body);
  const typeIn = async (sel, text) => { await page.click(sel, { clickCount: 3 }); await page.type(sel, text); };
  const ideasSection = async name => {
    await go('/');
    await page.evaluate(() => document.querySelector('[data-section="home:09-ideas"]').scrollIntoView());
    await page.evaluate(() => window.scrollBy(0, -60));
    await wait(1500);
    await shot(name);
  };
  const log = [];
  const TITLE = '야간 근무표를 한곳에서';

  // 1) 직원 2: 아이디어 보드 → 남기기
  await as(2);
  await go('/ideas');
  await shot('01-ideas');
  log.push(['아이디어 수', await page.evaluate(() => document.querySelectorAll('main ol h2').length)]);
  await clickText('main button', '아이디어 남기기');
  await shot('02-dialog');
  await clickText('form[role=dialog] button', '남기기');
  await shot('03-dialog-errors');
  await typeIn('form[role=dialog] input', TITLE);
  await typeIn('form[role=dialog] textarea', '근무표를 사진으로 단체방에 돌려 봐서, 바뀐 내용을 놓칠 때가 있어요.');
  await clickText('form[role=dialog] label', '부서만');
  // 그림 첨부: 파일 고르기로 한 장 + 화면 캡처를 붙여 넣은 것처럼 paste 이벤트로 한 장
  const fileInput = await page.$('form[role=dialog] input[type=file]');
  await fileInput.uploadFile(require('path').resolve(__dirname, '../../app/server/seed_assets/project-3.webp'));
  await wait(400);
  await page.evaluate(async () => {
    const c = document.createElement('canvas');
    c.width = 480;
    c.height = 300;
    const g = c.getContext('2d');
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 480, 300);
    g.fillStyle = '#1f2a44';
    g.font = '28px sans-serif';
    g.fillText('붙여 넣은 화면 캡처 (시험용)', 40, 150);
    const blob = await new Promise(r => c.toBlob(r, 'image/png'));
    const dt = new DataTransfer();
    dt.items.add(new File([blob], 'image.png', { type: 'image/png' }));
    document.querySelector('form[role=dialog] textarea').dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
  });
  await wait(500);
  await shot('04-dialog-filled');
  await clickText('form[role=dialog] button[type=submit]', '남기기');
  await wait(800);
  await shot('05-after-post');
  const latest = await api('/api/ideas?sort=latest');
  const mine = latest.items[0];
  log.push(['남긴 뒤 맨 위', `${mine.title} / 올린 사람 표시: ${mine.author} / 그림 ${mine.images.length}장`]);
  await page.click('button[aria-label="첨부 그림 2 크게 보기"]');
  await shot('05b-image-zoom');
  await page.keyboard.press('Escape');

  // 2) 직원 3: 공감
  await as(3);
  await go('/ideas');
  await clickText('main button', '최신순');
  await clickText('main ol button[aria-pressed]', '나도 필요해요');
  await wait(800);
  await shot('06-vote');
  log.push(['공감 뒤', JSON.stringify((await api('/api/ideas?sort=latest')).items[0].votes)]);

  // 3) 관리자: 상태 변경과 답변
  await as(11);
  await go('/admin/ideas');
  await page.evaluate(t => [...document.querySelectorAll('tbody tr')].find(tr => tr.textContent.includes(t)).scrollIntoView({ block: 'center' }), TITLE);
  await shot('07-admin-ideas');
  await page.select(`select[aria-label="${TITLE} 상태 바꾸기"]`, 'reviewing');
  await wait(1000);
  await page.evaluate(t => [...document.querySelectorAll('tbody tr')].find(tr => tr.textContent.includes(t)).querySelector('button').click(), TITLE);
  await wait(400);
  await page.type('input[aria-label="답변"]', '근무표 공유 방식을 부서 몇 곳에 여쭤보고 있어요');
  await shot('08-admin-reply');
  await clickText('tbody button[type=submit]', '저장');
  await wait(800);
  await page.evaluate(t => [...document.querySelectorAll('tbody tr')].find(tr => tr.textContent.includes(t)).scrollIntoView({ block: 'center' }), TITLE);
  await shot('09-admin-after');

  // 4) 직원 3: 카드에 상태·답변
  await as(3);
  await go('/ideas');
  await clickText('main button', '최신순');
  await shot('10-card-reply');
  const card = (await api('/api/ideas?sort=latest')).items[0];
  log.push(['카드 상태·답변', `${card.status_label} / ${card.reply}`]);

  // 5) 직원 2: 내 아이디어 고치기 창, 직원 1: 지우기 확인 창
  await as(2);
  await go('/ideas');
  await clickText('main button', '최신순');
  await clickText('main ol button', '고치기');
  await shot('11-edit-dialog');
  await page.keyboard.press('Escape');
  await as(1);
  await go('/ideas');
  await clickText('main ol button', '지우기');
  await shot('12-delete-confirm');
  await clickText('[role=alertdialog] button', '그만두기');

  // 6) 관리자: 숨기기 → 목록에서 사라짐
  await as(11);
  await go('/admin/ideas');
  await page.evaluate(t => [...document.querySelectorAll('tbody tr')].find(tr => tr.textContent.includes(t)).querySelector('td:last-child button').click(), TITLE);
  await wait(800);
  await shot('13-admin-hidden');
  await as(3);
  await go('/ideas');
  log.push(['숨긴 뒤 보드에 남아 있나', await has('main ol h2', TITLE)]);

  // 7) 직원 1: 토이프로젝트 — 보기만
  await as(1);
  await go('/toys');
  await shot('14-toys-employee');
  log.push(['직원에게 모집 글 쓰기', await has('main a', '모집 글 쓰기')]);
  await go('/toys/1');
  await shot('15-toy-employee');
  log.push(['직원에게 참여 버튼', await has('main button', '참여하고 싶어요')]);

  // 8) 졸업생 8: 모집 글 쓰기
  await as(8);
  await go('/toys');
  await clickText('main a', '모집 글 쓰기');
  await wait(600);
  await typeIn('input[placeholder^="예: 설비 로그"]', '측정값 비교 도구 같이 만들어요');
  await typeIn('main textarea', '장비마다 다른 단위의 측정값을 한 표로 비교하는 작은 도구예요. 화면은 거의 만들었고, 단위 변환 규칙을 같이 정리할 분을 찾아요.');
  await typeIn('input[placeholder^="어떤 일을"]', '데이터 정리 1명');
  await clickText('main [role=radio]', '2주');
  await shot('16-toy-form');
  await clickText('main button[type=submit]', '모집 글 올리기');
  await wait(1000);
  const toyId = Number(page.url().split('/').pop());
  await shot('17-toy-new-detail');

  // 9) 수강생 7: 참여
  await as(7);
  await go(`/toys/${toyId}`);
  await shot('18-toy-student');
  await clickText('main button', '참여하고 싶어요');
  await wait(600);
  await shot('19-toy-joined');
  log.push(['수강생에게 희망자 목록', await has('aside', '나에게만 보여요')]);

  // 10) 졸업생 8: 희망자 확인 → 마감
  await as(8);
  await go(`/toys/${toyId}`);
  await shot('20-toy-applicants');
  log.push(['글쓴이가 본 희망자', await page.evaluate(() => document.querySelector('aside ul')?.innerText.replace(/\n+/g, ' / '))]);
  await clickText('aside button', '모집 마감');
  await shot('21-toy-closed');

  // 11) 관리자: 모집 글 숨기기
  await as(11);
  await go('/admin/toys');
  await shot('22-admin-toys');
  await page.evaluate(id => [...document.querySelectorAll('tbody tr')].find(tr => tr.querySelector(`a[href="/toys/${id}"]`)).querySelector('td:last-child button').click(), toyId);
  await wait(800);
  await shot('23-admin-toy-hidden');
  await as(1);
  await go('/toys');
  log.push(['숨긴 뒤 토이 목록 수', await page.evaluate(() => document.querySelectorAll('main ol > li').length)]);

  // 12) 홈 ⑩: 3개 → 1개 → 0개 (관리자가 숨겨서 만든다)
  await as(1);
  await ideasSection('24-home-ideas');
  await as(11);
  const all = (await api('/api/admin/ideas')).items;
  for (const i of all.slice(1)) await api(`/api/admin/ideas/${i.id}/hide`, { hidden: true });
  await as(1);
  await ideasSection('25-home-ideas-one');
  await as(11);
  await api(`/api/admin/ideas/${all[0].id}/hide`, { hidden: true });
  await as(1);
  await ideasSection('26-home-ideas-zero');
  await go('/ideas');
  await shot('27-ideas-empty');

  console.log(JSON.stringify(log, null, 1));
  console.log('errors', JSON.stringify(errors));
  await browser.close();
})();
