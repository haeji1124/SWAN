// usage: node phase3.cjs <url> <outDir> [quiz|admin|all]
// Phase 3 확인 순서를 화면에서 그대로 따라 하며 찍는다 (응시 기록이 쌓이므로 끝나면 seed.py로 되돌린다)
// quiz: 다 맞히기(직원 1) · 절반(6번 except, 직원 3) · 다 틀리기(직원 4) · 이미 신청한 사람(6) · 로그인 실패 · 다시 풀기(직원 2)
// admin: 관리자 수준 테스트 메뉴(문제 목록·수정, 응시 결과 표) · 신청자 표의 '수준 테스트' 칸
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const [base, out, which = 'all'] = process.argv.slice(2);
  fs.mkdirSync(out, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 160)); });
  const as = async uid => { await page.setCookie({ name: 'swan_dev_user', value: String(uid), url: base }); };
  const shot = async (name, full) => { await wait(500); await page.screenshot({ path: `${out}/${name}.jpg`, type: 'jpeg', quality: 82, fullPage: !!full }); };
  const clickText = async (sel, text) => {
    const ok = await page.evaluate((sel, text) => { const el = [...document.querySelectorAll(sel)].find(e => e.textContent.trim().includes(text) && !e.disabled); if (el) { el.click(); return true } return false }, sel, text);
    if (!ok) throw new Error(`못 찾음: ${text}`);
    await wait(500);
  };
  const text = sel => page.evaluate(sel => document.querySelector(sel)?.innerText.replace(/\n+/g, ' / ').slice(0, 160), sel);
  const log = [];

  // picks: 1~4 보기 번호, 5 글, 6 줄 번호. shots가 있으면 단계마다 찍는다
  async function solve(uid, picks, tag, shots) {
    await as(uid);
    await page.goto(base + '/quiz', { waitUntil: 'networkidle0' });
    await wait(800);
    if (shots) await shot(`${tag}-01-start`);
    log.push([`${tag} 시작 화면`, await text('main')]);
    await clickText('main button', '풀기').catch(() => clickText('main button', '시작하기'));
    for (let i = 0; i < 4; i++) {
      if (shots && i === 0) await shot(`${tag}-02-q1`);
      await page.click(`[role=radio]:nth-child(${picks[i]})`);
      if (shots && i === 0) await shot(`${tag}-03-q1-picked`);
      await clickText('main button', '다음');
    }
    if (shots) await shot(`${tag}-04-q5-empty`);
    log.push([`${tag} 5번 [다음] 쓸 수 없음`, await page.evaluate(() => [...document.querySelectorAll('main button')].find(b => b.textContent.includes('다음')).disabled)]);
    await page.type('#short-answer', picks[4]);
    if (shots) await shot(`${tag}-05-q5-filled`);
    await clickText('main button', '다음');
    if (shots) await shot(`${tag}-06-q6`);
    if (shots) { await page.hover('[aria-label="9번 줄"]'); await shot(`${tag}-07-q6-hover`); }
    await page.click(`[aria-label="${picks[5]}번 줄"]`);
    if (shots) await shot(`${tag}-08-q6-picked`);
    log.push([`${tag} 6번 고른 줄 표시`, await page.evaluate(() => [...document.querySelectorAll('main span')].find(s => s.textContent.startsWith('고른 줄'))?.textContent)]);
    await clickText('main button', '결과 보기');
    await wait(900);
    await shot(`${tag}-09-result`);
    log.push([`${tag} 결과`, await text('main section')]);
    if (shots) {
      await clickText('main button', '해설 보기');
      await wait(900);
      await shot(`${tag}-10-result-back`);
      await clickText('.flip-back li button', '딕셔너리');
      await wait(400);
      await shot(`${tag}-11-back-open`);
    }
    await page.evaluate(() => document.querySelector('#q6').scrollIntoView());
    await wait(700);
    await shot(`${tag}-12-six`);
    log.push([`${tag} 6번 내 답 상자`, await text('#q6 p')]);
    if (shots) await shot(`${tag}-13-full`, true);
  }

  if (which !== 'admin') {
    await solve(1, [2, 2, 2, 2, '"1234"', 12], 'a-right', true); // 6/6 어린 백조
    await solve(3, [2, 2, 1, 1, ' 1234 ', 10], 'b-half'); // 3/6 아기 오리, 6번 절반
    await solve(4, [1, 1, 1, 1, '4321', 9], 'c-wrong'); // 0/6 알에서 나온 오리
    await solve(6, [2, 2, 2, 2, '1234', 11], 'd-applied'); // 이미 신청한 사람
    await solve('fail', [2, 2, 2, 2, '1234', 12], 'e-guest'); // 로그인 실패: 기록 안 함
    await solve(2, [2, 2, 2, 2, '1234', 12], 'f-retake'); // 첫 기록 1/6 → 다시 풀어 6/6
    // 홈에서 들어오기: [테스트 시작하기]와 상단 메뉴
    await as(1);
    await page.goto(base + '/', { waitUntil: 'networkidle0' });
    log.push(['상단 메뉴 수준 테스트 주소', await page.evaluate(() => [...document.querySelectorAll('header a')].find(a => a.textContent.trim() === '수준 테스트')?.getAttribute('href'))]);
    log.push(['홈 테스트 시작하기 주소', await page.evaluate(() => [...document.querySelectorAll('a')].find(a => a.textContent.trim() === '테스트 시작하기')?.getAttribute('href'))]);
  }

  if (which !== 'quiz') {
    await as(11);
    await page.goto(base + '/admin/quiz', { waitUntil: 'networkidle0' });
    await wait(600);
    await shot('g-01-admin-questions');
    await page.goto(base + '/admin/quiz/attempts', { waitUntil: 'networkidle0' });
    await wait(600);
    await shot('g-02-admin-attempts');
    log.push(['응시 결과 표', await text('table')]);
    await page.goto(base + '/admin/quiz', { waitUntil: 'networkidle0' });
    await wait(600);
    await clickText('main button, section button', '수정');
    await wait(500);
    await shot('g-03-admin-edit');
    await shot('g-04-admin-edit-full', true);
    // 줄 고르기 문제(6번) 편집: 정답 줄·부분 정답 줄을 코드에서 눌러 고른다
    await page.goto(base + '/admin/quiz', { waitUntil: 'networkidle0' });
    await wait(600);
    await page.evaluate(() => [...document.querySelectorAll('td button')].filter(b => b.textContent.includes('수정')).pop().click());
    await wait(600);
    await page.evaluate(() => [...document.querySelectorAll('form button')].find(b => b.textContent.startsWith('정답 줄')).scrollIntoView({ block: 'start' }));
    await page.evaluate(() => window.scrollBy(0, -120));
    await shot('g-06-admin-edit-line');
    await page.goto(base + '/admin/applicants', { waitUntil: 'networkidle0' });
    await wait(600);
    await shot('g-05-admin-applicants');
    log.push(['신청자 표', await text('table')]);
  }

  for (const [k, v] of log) console.log(`${k}: ${v}`);
  console.log('errors', JSON.stringify(errors));
  await browser.close();
})();
