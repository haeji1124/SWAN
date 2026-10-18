// usage: node measure.cjs <url>
// 홈 점검용 수치: 섹션 제목 크기, 누르는 요소 크기, 작은 글씨 대비, 고정 스크롤 길이
const puppeteer = require('puppeteer-core');
(async () => {
  const [url] = process.argv.slice(2);
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto(url, { waitUntil: 'networkidle0' });
  const r = await page.evaluate(() => {
    const lum = c => { const m = c.match(/\d+(\.\d+)?/g).map(Number); const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]); };
    const bgOf = el => { while (el) { const b = getComputedStyle(el).backgroundColor; if (b && !b.includes('rgba(0, 0, 0, 0)') && !b.endsWith(', 0)')) return b; el = el.parentElement; } return 'rgb(251, 250, 247)'; };
    const ratio = el => { const a = lum(getComputedStyle(el).color), b = lum(bgOf(el)); return ((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toFixed(2); };
    const secs = [...document.querySelectorAll('[data-section]')];
    const titles = secs.map(s => { const h = s.querySelector('h1,h2'); return { section: s.dataset.section, tag: h?.tagName, text: h?.innerText.replace(/\n/g, ' ').slice(0, 24), size: h ? getComputedStyle(h).fontSize : null, height: Math.round(s.getBoundingClientRect().height) }; });
    const clickables = [...document.querySelectorAll('a,button')].filter(e => e.offsetParent && !e.closest('.fixed')).map(e => { const b = e.getBoundingClientRect(); return { text: (e.innerText || e.getAttribute('aria-label') || '').trim().slice(0, 20), h: Math.round(b.height), w: Math.round(b.width), section: e.closest('[data-section]')?.dataset.section || 'nav' }; });
    const small = clickables.filter(c => c.h < 44);
    const lowContrast = [...document.querySelectorAll('body *')].filter(e => e.childElementCount === 0 && e.innerText && e.innerText.trim().length > 1 && e.offsetParent).map(e => ({ t: e.innerText.trim().slice(0, 24), r: Number(ratio(e)), fs: parseFloat(getComputedStyle(e).fontSize), sec: e.closest('[data-section]')?.dataset.section || 'nav' })).filter(x => x.r < 4.5 && x.fs < 18);
    return { titles, smallCount: small.length, small: small.slice(0, 40), lowContrast: lowContrast.slice(0, 40), lowContrastCount: lowContrast.length, vh: innerHeight };
  });
  console.log(JSON.stringify(r, null, 1));
  await browser.close();
})();
