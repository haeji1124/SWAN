// usage: node keyboard.cjs <url> <outDir>
// 키보드만으로 신청과 수준 테스트를 끝낼 수 있는지 (Phase 8 접근성). 마우스는 쓰지 않고 Tab·Shift+Tab·Space·Enter·방향키·글자만.
// 지금 초점이 어디 있는지 매번 적고, 끝 화면을 찍는다. 개발 DB를 바꾸므로 끝나면 seed.py
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
  const log = [];
  const focused = () => page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return '(없음)';
    return `${el.tagName.toLowerCase()}${el.getAttribute('role') ? `[${el.getAttribute('role')}]` : ''} "${(el.getAttribute('aria-label') || el.innerText || el.labels?.[0]?.innerText || el.closest('label')?.innerText || el.placeholder || el.value || '').trim().replace(/\s+/g, ' ').slice(0, 30)}"`;
  });
  // 초점이 원하는 글자를 가진 요소에 올 때까지 Tab (최대 n번)
  const tabTo = async (want, n = 60) => {
    for (let i = 0; i < n; i++) {
      await page.keyboard.press('Tab');
      const f = await focused();
      if (f.includes(want)) return f;
    }
    throw new Error(`Tab으로 못 감: ${want}`);
  };

  // 1) 신청: 직원 3이 /apply에서
  await page.setCookie({ name: 'swan_dev_user', value: '3', url: base });
  await page.goto(base + '/apply', { waitUntil: 'networkidle0' });
  await wait(700);
  // 라디오 묶음은 Tab으로 묶음에 들어가고 방향키로 고른다 (표준). [신청하기]는 고르기 전엔 꺼져 있어 Tab이 건너뛴다
  log.push(['신청 · 고르기 묶음으로', await tabTo('거의 없음')]);
  await page.keyboard.press('ArrowDown');
  log.push(['방향키로 고른 것', await focused()]);
  await page.keyboard.press('Tab');
  await page.keyboard.type('설비 로그 정리');
  log.push(['만들고 싶은 것 칸', await focused()]);
  log.push(['신청 버튼으로', await tabTo('신청하기')]);
  await page.keyboard.press('Enter');
  await wait(1500);
  log.push(['신청 뒤 화면', await page.evaluate(() => document.querySelector('h1')?.innerText.replace(/\n/g, ' '))]);
  await page.screenshot({ path: `${out}/apply-done.jpg`, type: 'jpeg', quality: 75 });

  // 2) 수준 테스트: 직원 4가 처음부터 끝까지
  await page.setCookie({ name: 'swan_dev_user', value: '4', url: base });
  await page.goto(base + '/quiz', { waitUntil: 'networkidle0' });
  await wait(700);
  log.push(['시작 버튼으로', await tabTo('시작하기')]);
  await page.keyboard.press('Enter');
  await wait(800);
  for (let q = 1; q <= 4; q++) {
    log.push([`${q}번 보기로`, await tabTo('②')]);
    await page.keyboard.press('Space');
    log.push([`${q}번 다음으로`, await tabTo(q === 4 ? '다음' : '다음')]);
    await page.keyboard.press('Enter');
    await wait(700);
  }
  log.push(['5번 입력 칸으로', await tabTo('input', 30).catch(() => tabTo('출력', 30))]);
  await page.keyboard.type('1234');
  log.push(['5번 다음으로', await tabTo('다음')]);
  await page.keyboard.press('Enter');
  await wait(700);
  // 6번: 코드 줄 고르기
  log.push(['6번 줄로', await tabTo('줄', 40)]);
  await page.keyboard.press('Enter');
  await wait(300);
  log.push(['6번 고른 뒤', await page.evaluate(() => document.body.innerText.match(/고른 줄: [^\n]+/)?.[0] ?? '(안 골라짐)')]);
  log.push(['결과 보기로', await tabTo('결과 보기')]);
  await page.keyboard.press('Enter');
  await wait(1800);
  log.push(['결과 화면', await page.evaluate(() => document.body.innerText.match(/6문제 중\s*\d+\s*개 맞혔어요/)?.[0] ?? '(결과 없음)')]);
  await page.screenshot({ path: `${out}/quiz-result.jpg`, type: 'jpeg', quality: 75 });

  // 3) 초점 표시가 보이는지: 홈에서 Tab 세 번 뒤 초점 테두리
  await page.goto(base + '/', { waitUntil: 'networkidle0' });
  for (let i = 0; i < 3; i++) await page.keyboard.press('Tab');
  log.push(['초점 테두리', await page.evaluate(() => { const cs = getComputedStyle(document.activeElement); return `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}` })]);
  await page.screenshot({ path: `${out}/focus-ring.jpg`, type: 'jpeg', quality: 75, clip: { x: 0, y: 0, width: 1440, height: 120 } });

  console.log(JSON.stringify(log, null, 1));
  console.log('errors', JSON.stringify(errors));
  await browser.close();
})();
