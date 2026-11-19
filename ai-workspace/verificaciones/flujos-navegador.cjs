// Flujos interactivos del plan de pruebas (B) en Chromium real.
const { chromium } = require('playwright');
const path = require('path');
const OUT = process.argv[2];
const BASE = 'http://localhost:5173';
const log = (...a) => console.log(...a);

(async () => {
  const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' } : undefined;
  const browser = await chromium.launch({ proxy });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, ignoreHTTPSErrors: true });
  const page = await ctx.newPage();

  // B.5 búsqueda por parte del nombre y por id fiscal
  await page.goto(BASE + '/');
  await page.getByLabel('Buscar por nombre de empresa o identificador fiscal').fill('facil');
  await page.getByText('1 cliente encontrado').waitFor();
  log('B.5 nombre sin tilde →', await page.locator('.card__title').allInnerTexts());
  await page.getByLabel('Buscar por nombre de empresa o identificador fiscal').fill('k123');
  await page.getByText('1 cliente encontrado').waitFor();
  log('B.5 id fiscal parcial →', await page.locator('.card__title').allInnerTexts());

  // B.7 slider por teclado y desglose; B.10 cambio de divisa
  await page.goto(BASE + '/customers/1/simulate');
  const slider = page.getByLabel('Usuarios activos (deslizador)');
  await slider.focus();
  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight');
  log('B.7 teclado 10→15: total =', await page.getByTestId('quote-total').innerText(), '| aria-valuetext =', await slider.getAttribute('aria-valuetext'));
  for (const users of ['10', '11', '50', '51']) {
    await page.getByLabel('Usuarios activos', { exact: true }).fill(users);
    log(`B.7 ${users} usuarios: base =`, await page.locator('.quote__totals dd').first().innerText());
  }
  await page.getByLabel('Usuarios activos', { exact: true }).fill('15');
  await page.getByLabel('Divisa').selectOption('USD');
  log('B.10 USD total =', await page.getByTestId('quote-total').innerText());
  await page.getByLabel('Divisa').selectOption('GBP');
  log('B.10 GBP total =', await page.getByTestId('quote-total').innerText());
  await page.getByLabel('Divisa').selectOption('EUR');

  // B.9 superar plan → aviso visible y se puede guardar; B.8 aparece en historial
  await page.getByLabel('Almacenamiento (GB)').fill('75');
  log('B.9 aviso =', await page.locator('.notice').first().innerText());
  await page.screenshot({ path: path.join(OUT, 'flujo-simulador-aviso.png'), fullPage: true });
  await page.getByRole('button', { name: 'Guardar simulación' }).click();
  await page.getByText('Simulación guardada en el historial.').waitFor();
  log('B.8 primera del historial =', (await page.locator('.history__item').first().innerText()).replace(/\n/g, ' | '));

  // B.2 / B.3 alta con NIF erróneo y duplicado
  await page.goto(BASE + '/customers/new');
  await page.getByLabel('Nombre de la empresa').fill('Prueba S.L.');
  await page.getByLabel('País').selectOption('ES');
  await page.getByLabel('Identificador fiscal').fill('12345678A');
  await page.getByLabel('Email de contacto').fill('a@prueba.es');
  await page.getByLabel('Plan').selectOption('pro');
  await page.getByRole('button', { name: 'Guardar' }).click();
  log('B.2 NIF erróneo →', await page.locator('.field__error').allInnerTexts(), '| foco en:', await page.evaluate(() => document.activeElement?.getAttribute('aria-invalid')));
  await page.getByLabel('Identificador fiscal').fill('B12345674');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await page.getByRole('link', { name: 'Ver el cliente existente' }).waitFor();
  log('B.3 duplicado →', await page.locator('.field__error').allInnerTexts());
  await page.screenshot({ path: path.join(OUT, 'flujo-alta-duplicado.png'), fullPage: true });

  // B.11 sin API de divisas (y sin caché) → aviso y EUR
  const offline = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const p2 = await offline.newPage();
  await p2.route('https://open.er-api.com/**', (r) => r.abort());
  await p2.goto(BASE + '/customers/1/simulate');
  await p2.locator('.notice').first().waitFor();
  log('B.11 sin divisas →', await p2.locator('.notice').first().innerText(), '| total =', await p2.getByTestId('quote-total').innerText());
  await p2.screenshot({ path: path.join(OUT, 'flujo-sin-divisas.png'), fullPage: true });

  // B.12 backend parado → error claro con reintentar
  await p2.route('http://localhost:3000/**', (r) => r.abort());
  await p2.goto(BASE + '/');
  await p2.getByRole('alert').waitFor();
  log('B.12 backend parado →', (await p2.getByRole('alert').innerText()).replace(/\n/g, ' | '));
  await p2.screenshot({ path: path.join(OUT, 'flujo-backend-parado.png'), fullPage: true });

  await browser.close();
})().catch((e) => {
  console.error('FALLO:', e.message);
  process.exit(1);
});
