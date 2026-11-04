// Capturas puntuales de pantallas concretas (desarrollo).
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:4173/mus-app/';
const OUT = process.env.OUT || 'screenshots';
const targets = process.argv.slice(2);
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('pageerror', e.message));
  await page.goto(BASE);
  await page.evaluate(() => {
    const p = JSON.parse(localStorage.getItem('mus-eskola-v1') || '{}');
    p.onboarded = true;
    localStorage.setItem('mus-eskola-v1', JSON.stringify(p));
  });
  for (const t of targets) {
    const [route, wait, name] = t.split('@');
    await page.goto(BASE + '#/' + route);
    await page.reload();
    await page.waitForTimeout(Number(wait || 600));
    await page.screenshot({ path: `${OUT}/${name || route.replace(/\//g, '_')}.png` });
  }
  await browser.close();
})();
