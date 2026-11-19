// Recorrido real en Chromium: capturas en 3 anchos, axe-core en navegador (incluye contraste) y scroll horizontal.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = process.argv[2];
const AXE = fs.readFileSync(process.argv[3], 'utf8');
const BASE = 'http://localhost:5173';

const pages = [
  ['buscador', '/'],
  ['detalle', '/customers/1'],
  ['simulador', '/customers/1/simulate'],
  ['simulacion-guardada', '/customers/1/simulations/2'],
  ['alta', '/customers/new'],
  ['no-encontrada', '/nada'],
];
const widths = [['movil', 360, 740], ['tablet', 768, 1024], ['escritorio', 1280, 900]];

(async () => {
  const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' } : undefined;
  const browser = await chromium.launch({ proxy });
  const results = [];
  for (const [device, width, height] of widths) {
    const context = await browser.newContext({ viewport: { width, height }, ignoreHTTPSErrors: true, locale: 'es-ES' });
    const page = await context.newPage();
    const consoleErrors = [];
    page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
    for (const [name, url] of pages) {
      await page.goto(BASE + url);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      await page.addScriptTag({ content: AXE });
      const axe = await page.evaluate(async () => {
        const r = await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] });
        return r.violations.map((v) => `${v.id} (${v.nodes.length}): ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`);
      });
      await page.screenshot({ path: path.join(OUT, `${name}-${device}.png`), fullPage: true });
      results.push({ device, name, overflow, axe });
    }
    results.push({ device, consoleErrors });
    await context.close();
  }
  await browser.close();
  console.log(JSON.stringify(results, null, 1));
})();
