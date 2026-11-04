const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:4173/mus-app/';
const OUT = process.env.OUT || 'screenshots';
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  page.on('pageerror', (e) => console.log('pageerror', e.message));
  await page.goto(BASE);
  await page.evaluate(() => localStorage.setItem('mus-eskola-v1', JSON.stringify({ onboarded: true })));
  await page.goto(BASE + '#/jugar');
  await page.reload();
  await page.getByRole('button', { name: 'Nueva partida' }).click();
  for (let i = 0; i < 40; i++) {
    await page.waitForTimeout(700);
    const b = page.locator('.actions').getByRole('button', { name: 'No hay mus', exact: true });
    if (await b.count()) await b.click();
    const p = page.locator('.actions').getByRole('button', { name: 'Paso', exact: true });
    if (i > 3 && await p.count()) { await page.screenshot({ path: `${OUT}/t-${i}.png` }); await p.click(); }
    const q = page.locator('.actions').getByRole('button', { name: 'No quiero', exact: true });
    if (await q.count()) { await page.screenshot({ path: `${OUT}/t-${i}.png` }); await q.click(); }
    if (await page.getByRole('button', { name: /Siguiente/ }).count()) { await page.screenshot({ path: `${OUT}/t-end.png` }); break; }
  }
  await browser.close();
})();
