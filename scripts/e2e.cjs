// Recorrido de la app en viewport móvil (390x844) con Playwright: lección completa,
// partida completa contra bots y capturas de las pantallas principales.
const { chromium } = require('playwright');
const fs = require('fs');
const BASE = process.env.BASE || 'http://localhost:4173/mus-app/';
const OUT = process.env.OUT || 'screenshots';
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, colorScheme: process.env.DARK ? 'dark' : 'light' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  const shot = async (name) => { await page.waitForTimeout(350); await page.screenshot({ path: `${OUT}/${name}.png` }); };
  const hasH = async () => (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1));

  await page.goto(BASE);
  await shot('01-onboarding-1');
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await shot('02-onboarding-2');
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.getByRole('button', { name: '¡Vamos a jugar!' }).click();
  await shot('03-aprender');

  async function runSession(prefix, maxSteps = 80) {
    for (let i = 0; i < maxSteps; i++) {
      await page.waitForTimeout(120);
      if (await page.locator('.done-screen').count()) return true;
      const ent = page.getByRole('button', { name: 'Entendido' });
      if (await ent.count()) { if (i < 3) await shot(`${prefix}-teach-${i}`); await ent.click(); continue; }
      const cont = page.getByRole('button', { name: 'Continuar' });
      if (await cont.count()) { if (i < 6) await shot(`${prefix}-feedback-${i}`); await cont.click(); continue; }
      const radios = page.getByRole('radio');
      if (await radios.count()) {
        await radios.first().click();
        if (i < 6) await shot(`${prefix}-ex-${i}`);
        await page.getByRole('button', { name: 'Comprobar' }).click();
        continue;
      }
      const cards = page.locator('.lesson-body button.card');
      if (await cards.count()) {
        await cards.first().click();
        await page.getByRole('button', { name: 'Comprobar' }).click();
        continue;
      }
      if (await page.locator('.match').count()) {
        const lefts = page.locator('.match > .stack:first-child button:not([disabled])');
        const nL = await lefts.count();
        for (let l = 0; l < nL; l++) {
          const left = page.locator('.match > .stack:first-child button:not([disabled])').first();
          for (let r = 0; r < 4; r++) {
            await left.click();
            const rights = page.locator('.match > .stack:nth-child(2) button:not([disabled])');
            if (r >= await rights.count()) break;
            const before = await page.locator('.match .opt--done').count();
            await rights.nth(r).click();
            await page.waitForTimeout(80);
            if ((await page.locator('.match .opt--done').count()) > before) break;
            await page.waitForTimeout(450);
          }
        }
        continue;
      }
      const chk = page.getByRole('button', { name: 'Comprobar' });
      if (await chk.count()) { await chk.click(); continue; }
    }
    return false;
  }

  await page.getByRole('button', { name: /Empezar/ }).click();
  const ok1 = await runSession('04-l1');
  await shot('05-leccion-terminada');
  console.log('Lección 1 completada:', ok1);
  await page.getByRole('button', { name: /Siguiente:/ }).click();
  const ok2 = await runSession('06-l2');
  console.log('Lección 2 completada:', ok2);
  await page.getByRole('button', { name: 'Volver al camino' }).click();
  await shot('07-aprender-progreso');
  if (await hasH()) errors.push('scroll horizontal en aprender');

  // Practicar
  await page.getByRole('button', { name: /Practicar/ }).click();
  await shot('08-practicar');
  await page.getByRole('button', { name: /Pares/ }).first().click();
  const ok3 = await runSession('09-pr', 60);
  console.log('Práctica completada:', ok3);
  await page.goto(BASE + '#/practicar/examen');
  await page.waitForTimeout(400);
  await shot('10-examen');
  await page.goto(BASE + '#/practicar/senas');
  await page.waitForTimeout(400);
  await shot('11-senas-ex');

  // Consultar
  for (const [i, t] of ['Reglamento', 'Tabla rápida', 'Juegos', 'Señas', 'Glosario'].entries()) {
    await page.goto(BASE + '#/consultar');
    await page.getByRole('tab', { name: t }).click();
    if (t === 'Glosario') await page.getByLabel('Buscar en el glosario').fill('hor');
    await shot(`12-consultar-${i}`);
    if (await hasH()) errors.push('scroll horizontal en consultar ' + t);
  }
  await page.goto(BASE + '#/ajustes');
  await shot('13-ajustes');
  await page.goto(BASE + '#/logros');
  await shot('14-logros');

  // Partida completa
  await page.goto(BASE + '#/jugar');
  await shot('15-jugar-inicio');
  await page.getByRole('button', { name: 'Nueva partida' }).click();
  let hands = 0;
  const t0 = Date.now();
  let shotTable = 0;
  while (Date.now() - t0 < 9 * 60 * 1000) {
    await page.waitForTimeout(250);
    if (await page.getByRole('button', { name: 'Otra partida' }).count()) break;
    const next = page.getByRole('button', { name: /Siguiente mano|Siguiente juego|Ver resultado/ });
    if (await next.count()) {
      hands++;
      if (hands <= 2) await shot(`17-recuento-${hands}`);
      await next.click();
      continue;
    }
    const tryBtn = async (name) => {
      const b = page.locator('.actions').getByRole('button', { name, exact: true });
      if ((await b.count()) && (await b.first().isEnabled())) { await b.first().click(); return true; }
      return false;
    };
    if (shotTable < 3 && (await page.locator('.tutor').count())) { await shot(`16-mesa-${shotTable++}`); }
    if (await page.locator('.actions .btn', { hasText: 'Descartar' }).count()) {
      await page.locator('.my-cards button.card').first().click();
      await page.locator('.actions .btn', { hasText: 'Descartar' }).click();
      continue;
    }
    if (await tryBtn('No hay mus')) continue;
    if (await tryBtn('Quiero')) continue;
    if (await tryBtn('Envido')) continue;
  }
  await shot('18-fin-partida');
  console.log('Manos jugadas:', hands, 'fin de partida:', await page.getByRole('button', { name: 'Otra partida' }).count() > 0);

  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto(BASE + '#/aprender');
  await shot('19-aprender-oscuro');
  await page.goto(BASE + '#/jugar');
  await page.getByRole('button', { name: 'Nueva partida' }).click();
  await page.waitForTimeout(2500);
  await shot('20-mesa-oscuro');

  console.log('Errores:', errors.length ? errors : 'ninguno');
  await browser.close();
})();
