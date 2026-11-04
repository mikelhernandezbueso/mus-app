// Comprueba que la PWA funciona sin conexión tras la primera visita.
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:4173/mus-app/';
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(BASE);
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.waitForTimeout(1500);
  const manifest = await page.evaluate(async () => {
    const l = document.querySelector('link[rel="manifest"]');
    return l ? (await (await fetch(l.href)).json()) : null;
  });
  console.log('manifest:', manifest && manifest.name, manifest && manifest.icons.length, 'iconos', manifest && manifest.start_url);
  await ctx.setOffline(true);
  await page.reload();
  await page.waitForTimeout(800);
  const txt = await page.textContent('body');
  console.log('offline OK:', /Aprende mus|Aprender/.test(txt));
  await page.goto(BASE + '#/consultar');
  await page.waitForTimeout(500);
  console.log('offline consultar OK:', /Consultar/.test(await page.textContent('body')));
  await browser.close();
})();
