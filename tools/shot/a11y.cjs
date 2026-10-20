// usage: node a11y.cjs <url>
// 접근성 점검 (Phase 8): 화면마다
// 1) 이름 없는 버튼·링크 (보이는 글자, aria-label, title, 그림 alt가 모두 없는 것)
// 2) 작은 글자(24px 미만, 굵은 글씨면 18.66px 미만)의 대비가 4.5:1에 못 미치는 것 — 글자색·바탕색 조합별로 개수와 예시
const puppeteer = require('puppeteer-core');
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const [base] = process.argv.slice(2);
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]); // 등장 움직임 중간의 흐린 글자를 재지 않게
  const pages = [[1, '/'], [1, '/projects'], [1, '/projects/1'], [1, '/quiz'], [1, '/apply'], [1, '/toys'], [1, '/toys/1'], [1, '/ideas'], [1, '/making'],
    [11, '/admin/cohorts'], [11, '/admin/applicants'], [11, '/admin/ideas'], [11, '/admin/curriculum'], [11, '/admin/admins'], [11, '/admin/quiz']];
  const unnamed = [];
  const pairs = {};
  for (const [uid, p] of pages) {
    await page.setCookie({ name: 'swan_dev_user', value: String(uid), url: base });
    await page.goto(base + p, { waitUntil: 'networkidle0' });
    await wait(700);
    const r = await page.evaluate(() => {
      const rgb = s => (s.match(/[\d.]+/g) || []).map(Number);
      const lum = ([r, g, b]) => { const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) };
      const mix = (fg, bg) => { const a = fg[3] ?? 1; return [0, 1, 2].map(i => fg[i] * a + bg[i] * (1 - a)) };
      const bgOf = el => {
        const stack = [];
        for (let e = el; e; e = e.parentElement) { const c = rgb(getComputedStyle(e).backgroundColor); if (c.length >= 3 && (c[3] ?? 1) > 0) { stack.push(c); if ((c[3] ?? 1) >= 1) break } }
        let bg = [251, 250, 247];
        for (const c of stack.reverse()) bg = mix(c, bg);
        return bg;
      };
      const out = { unnamed: [], low: [] };
      for (const el of document.querySelectorAll('button, a[href], [role=button], [role=radio]')) {
        const r0 = el.getBoundingClientRect();
        if (!r0.width || getComputedStyle(el).visibility === 'hidden') continue;
        const name = (el.innerText || '').trim() || el.getAttribute('aria-label') || el.getAttribute('title') || [...el.querySelectorAll('img[alt]')].map(i => i.alt).join('');
        if (!name) out.unnamed.push(el.outerHTML.slice(0, 120));
      }
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const seen = new Set();
      while (walker.nextNode()) {
        const t = walker.currentNode;
        if (!t.textContent.trim()) continue;
        const el = t.parentElement;
        if (!el || seen.has(el)) continue;
        seen.add(el);
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || +cs.opacity === 0 || !el.getBoundingClientRect().width) continue;
        if (el.closest('[aria-hidden="true"], button:disabled, [disabled]')) continue;
        const size = parseFloat(cs.fontSize), bold = +cs.fontWeight >= 700;
        if (size >= 24 || (bold && size >= 18.66)) continue;
        const bg = bgOf(el);
        const fg = mix(rgb(cs.color), bg);
        const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x);
        const ratio = (a + 0.05) / (b + 0.05);
        if (ratio < 4.5) out.low.push({ key: `${fg.map(Math.round).join(',')} on ${bg.map(Math.round).join(',')} = ${ratio.toFixed(2)}`, text: t.textContent.trim().slice(0, 30), size });
      }
      return out;
    });
    r.unnamed.forEach(u => unnamed.push(`${p} ${u}`));
    for (const l of r.low) { pairs[l.key] = pairs[l.key] || { count: 0, examples: [] }; pairs[l.key].count++; if (pairs[l.key].examples.length < (process.env.ALL ? 400 : 4)) pairs[l.key].examples.push(`${p} ${l.size}px "${l.text}"`) }
  }
  console.log(JSON.stringify({ unnamed, lowContrast: Object.entries(pairs).sort((a, b) => b[1].count - a[1].count) }, null, 1));
  await browser.close();
})();
