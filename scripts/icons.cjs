// Genera los PNG de los iconos a partir de public/favicon.svg usando Playwright.
const { chromium } = require('playwright');
const { readFileSync } = require('node:fs');
const svg = readFileSync('public/favicon.svg', 'utf8');
(async () => {
const browser = await chromium.launch();
const page = await browser.newPage();
async function render(size, file, pad = 0, bg = 'transparent') {
  await page.setViewportSize({ width: size, height: size });
  const inner = size - pad * 2;
  await page.setContent(`<html><body style="margin:0;background:${bg};display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px">${svg.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</body></html>`);
  await page.screenshot({ path: file, omitBackground: bg === 'transparent' });
}
await render(192, 'public/pwa-192.png');
await render(512, 'public/pwa-512.png');
await render(512, 'public/pwa-maskable-512.png', 56, '#1d4a33');
await render(180, 'public/apple-touch-icon.png', 0, '#1d4a33');
await browser.close();
console.log('iconos generados');
})();
