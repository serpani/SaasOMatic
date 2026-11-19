// B.16: recorrido completo solo con teclado. En cada paso comprueba que el elemento con foco tiene
// un indicador visible (outline). Uso: node recorrido-teclado.cjs (con `npm run dev` y datos de ejemplo).
const { chromium } = require('playwright');

const BASE = 'http://localhost:5173';
const problems = [];

async function focused(page) {
  return page.evaluate(() => {
    const el = document.activeElement;
    const style = el ? getComputedStyle(el) : null;
    const label = el?.getAttribute('aria-label') || el?.textContent?.trim().slice(0, 40) || el?.getAttribute('id');
    return {
      tag: el?.tagName.toLowerCase(),
      label,
      visible: !!style && style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2,
    };
  });
}

async function tab(page, times = 1, key = 'Tab') {
  for (let i = 0; i < times; i++) {
    await page.keyboard.press(key);
    const f = await focused(page);
    if (f.tag !== 'body' && f.tag !== 'main' && f.tag !== 'h1' && !f.visible) problems.push(f);
  }
  return focused(page);
}

(async () => {
  const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' } : undefined;
  const browser = await chromium.launch({ proxy });
  const page = await (await browser.newContext({ ignoreHTTPSErrors: true })).newPage();
  await page.goto(BASE + '/');
  await page.waitForLoadState('networkidle');

  console.log('1. Primer Tab →', await tab(page));
  await page.keyboard.press('Enter');
  console.log('2. Enter en el skip link → foco en', (await focused(page)).tag);

  let f;
  for (let i = 0; i < 15; i++) {
    f = await tab(page);
    if (f.tag === 'input') break;
  }
  console.log('3. Llega al buscador →', f);
  await page.keyboard.type('facil');
  await page.getByText('1 cliente encontrado').waitFor();
  f = await tab(page);
  console.log('4. Tab hasta la tarjeta →', f);
  await page.keyboard.press('Enter');
  await page.waitForURL('**/customers/1');
  await page.getByRole('heading', { level: 1, name: 'Fácil Software S.L.' }).waitFor();
  await page.waitForTimeout(100);
  console.log('5. Enter abre el detalle; foco en', (await focused(page)).tag);

  f = await tab(page);
  console.log('6. Tab →', f);
  await page.keyboard.press('Enter');
  await page.waitForURL('**/simulate');
  await page.getByRole('heading', { level: 1 }).waitFor();
  await page.waitForTimeout(100);
  console.log('   Simulador cargado; foco en', (await focused(page)).tag);
  f = await tab(page);
  console.log('7. Simulador, primer control →', f);
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  const valuetext = await page.evaluate(() => document.activeElement?.getAttribute('aria-valuetext'));
  console.log('8. Flechas en el slider → aria-valuetext:', valuetext);

  for (let i = 0; i < 12; i++) {
    f = await tab(page);
    if (f.label === 'Guardar simulación') break;
  }
  console.log('9. Llega a «Guardar simulación» →', f);

  console.log(problems.length === 0 ? 'FOCO VISIBLE EN TODOS LOS PASOS' : 'SIN FOCO VISIBLE:', problems);
  await browser.close();
})().catch((e) => {
  console.error('FALLO:', e.message);
  process.exit(1);
});
