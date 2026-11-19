# Verificación final — plan de pruebas punto por punto

Fase 5 de `CLAUDE.md`. Cada punto de `plan-de-pruebas.pdf` con su evidencia: test automático (ruta),
prueba en navegador real (`verificaciones/`) o comprobación manual. Fecha: 19/11/2026.

**Resumen:** 223 tests en verde · lint y typecheck sin errores · ningún fichero > 200 líneas · sin `any` ·
axe sin violaciones (jsdom y Chromium real) · Lighthouse accesibilidad 100/100 en las 4 vistas ·
README seguido desde cero en un clon limpio.

## A. Verificación automática

### A.1 Cálculo por tramos — `packages/shared/src/pricing/calculateBaseCost.test.ts`

| Usuarios | Esperado | Resultado |
|---|---|---|
| 1 / 10 / 11 / 15 / 50 / 51 / 100 | 10 € / 100 € / 108 € / 140 € / 420 € / 425 € / 670 € | ✔ |
| 0, 10.001, decimal, negativo (y NaN, Infinity) | Rechazado | ✔ |

### A.2 IVA y redondeo — `packages/shared/src/pricing/calculateTax.test.ts`

| Caso | Resultado |
|---|---|
| ES 21 % sobre 140 € → 29,40 € / 169,40 € | ✔ |
| Redondeo al céntimo (209,79 → 210; 52,5 → 53) y tipos decimales (8,1 %, 25,5 %, 5,5 %) sin errores de coma flotante | ✔ |
| EE. UU. 0 % | ✔ |

### A.3 Validación fiscal — `packages/shared/src/taxId/validateTaxId.test.ts`

| Caso | Resultado |
|---|---|
| DNI 12345678Z válido / 12345678A inválido | ✔ |
| NIE válido e inválido (X, Y, Z) | ✔ |
| NIF K, L, M (ampliación pedida en la revisión) | ✔ |
| CIF B12345674 válido / B12345670 inválido, regla letra/dígito por organización | ✔ |
| Normalización de minúsculas, espacios y guiones | ✔ |
| País no español: solo formato básico | ✔ |
| Prueba cruzada con 4.000 identificadores contra un oráculo independiente | ✔ 0 diferencias inesperadas (`verificaciones/`) |

### A.4 API (integración) — `apps/api/test/`

| # | Caso | Test | Resultado |
|---|---|---|---|
| 1 | POST /customers → 201 y persistido | `customers.test.ts` | ✔ |
| 2 | taxId repetido → 409 legible | `customers.test.ts` | ✔ |
| 3 | País JP directo a la API → 422 | `customers.test.ts` | ✔ |
| 4 | Plan inexistente → 422; campos ausentes o email inválido → 400 | `customers.test.ts` | ✔ |
| 5 | Simulación: importes, desglose y guardado en BD | `simulations.test.ts` | ✔ |
| 6 | Supera el plan → 201 con `planWarnings` | `simulations.test.ts` | ✔ |
| 7 | Cliente inexistente → 404 | `customers.test.ts`, `simulations.test.ts` | ✔ |
| 8 | Cambiar tramo (y IVA) → antiguas intactas, nuevas con precio nuevo | `simulations.test.ts` | ✔ |
| 9 | Búsqueda parcial nombre/taxId sin mayúsculas (y sin tildes); paginación | `customersSearch.test.ts` | ✔ |
| 10 | VATcomply caída, lenta o con datos erróneos → datos de BD sin error | `taxRateSync.test.ts` | ✔ |
| 11 | Todo error con `code` y `message` en español | `errorsAndNaming.test.ts` | ✔ |
| 12 | Nombres de atributos idénticos BD ↔ API (5 tablas) | `errorsAndNaming.test.ts` | ✔ |

Además: migraciones y seed idempotentes, claves foráneas y `CHECK` en BD (`database.test.ts`), tramos
incoherentes impiden arrancar (`catalog.test.ts`). Probado también contra el VATcomply real: 27 países
sincronizados y `EL → GR`.

### A.5 Frontend (lógica) — `apps/web/src/`

| Caso | Test | Resultado |
|---|---|---|
| Conversión de divisa con tipos simulados | `features/currency/currency.test.tsx` | ✔ |
| API de divisas caída → caché con fecha, o EUR con aviso | `features/currency/currency.test.tsx` | ✔ |
| Timeout 30 s (divisas) y 10 s (backend), con mensaje y reintento | `currency.test.tsx`, `shared/http/apiClient.test.ts` | ✔ |

### A.6 Calidad

| Comprobación | Resultado |
|---|---|
| `npm run lint` y `npm run typecheck` | ✔ 0 errores |
| Ningún fichero > 200 líneas (TS, TSX, CSS, scripts) | ✔ máximo 181 |
| Sin `any` | ✔ 0 usos; los 4 `eslint-disable` están justificados en un comentario |

## B. Revisión manual (ejecutada en Chromium con Playwright y en terminal)

| # | Acción | Resultado esperado | Resultado |
|---|---|---|---|
| 1 | Seguir el README desde cero | Arranca sin fricción | ✔ en Linux con un clon limpio (install con npm 11, `db:setup`, `dev`, `test`, `lint`, `typecheck`, `db:reset`). **Windows no se ha podido probar** (ver abajo). |
| 2 | Alta con NIF válido y con letra errónea | Se crea / mensaje comprensible | ✔ `flujos-navegador.cjs` |
| 3 | Mismo cliente dos veces | Aviso de cliente existente | ✔ con enlace a su ficha (`capturas/flujo-alta-duplicado.png`) |
| 4 | Selector de país | Solo UE, Reino Unido y EE. UU. | ✔ 29 países |
| 5 | Buscar por parte del nombre y por id. fiscal | Aparece el cliente | ✔ también sin tildes y con guiones |
| 6 | Abrir el detalle | Datos correctos en la card | ✔ |
| 7 | Slider en 10, 11, 15, 50, 51 | Desglose correcto; 15 → 140 € base | ✔ |
| 8 | Guardar simulación | Aparece en el historial con los mismos importes | ✔ |
| 9 | Superar el almacenamiento | Aviso visible, se puede guardar | ✔ |
| 10 | Cambiar entre EUR, USD y GBP | Conversión al momento | ✔ tipos reales de open.er-api.com |
| 11 | Cortar internet | Aviso de divisas; la app sigue usable | ✔ |
| 12 | Parar el backend | Error claro con reintentar | ✔ |
| 13 | Móvil, tablet y escritorio | Las cards se adaptan | ✔ 360, 768 y 1280 px |
| 14 | Revisar el código | Capas, nombres coherentes, controladores sin lógica | ✔ |

## C. Responsive y accesibilidad

| # | Comprobación | Resultado |
|---|---|---|
| Auto | eslint-plugin-jsx-a11y (strict) sin errores | ✔ |
| Auto | axe (vitest-axe) sin violaciones en todas las vistas, también con errores y avisos | ✔ |
| 15 | Toda la app a 360 px sin scroll horizontal | ✔ 5 vistas × 3 anchos, 0 px de desborde |
| 16 | Solo teclado, foco siempre visible | ✔ `recorrido-teclado.cjs`: skip link → buscador → tarjeta → detalle → simulador → slider con flechas → guardar |
| 17 | Lector de pantalla (NVDA) | ⚠ No ejecutable en este entorno. Cubierto indirectamente: nombres accesibles, `aria-describedby` en errores, `aria-live`, `aria-valuetext` del slider. **Pendiente de prueba manual.** |
| 18 | Lighthouse accesibilidad ≥ 90 | ✔ **100/100** en buscador, detalle, simulador y alta |

## Defectos encontrados en esta fase y corregidos

1. **Foco en la carga inicial.** El recorrido con teclado detectó que el primer Tab no llegaba a «Saltar al
   contenido»: el `h1` recibía el foco también al cargar la página. Ahora solo se mueve el foco al navegar
   entre vistas. Tests nuevos para ambos casos.
2. **Lint roto en un clon limpio.** Los scripts de verificación `.cjs` añadidos en la fase 4 no pasaban
   el lint (26 errores) porque no se volvió a ejecutar antes del commit. Se configuró ESLint para scripts
   CommonJS de Node.
3. **Instalación de SQLite en Windows.** La aprobación `allowScripts: { "better-sqlite3": true }` de la
   fase 3 hacía que npm 11 compilara SQLite desde el código fuente (necesita Visual Studio Build Tools en
   Windows). `better-sqlite3` 13.2 ya incluye los binarios para Windows, así que se marca como `false`:
   sin aviso y sin compilar.
4. **README:** cambiar el puerto de la API también requiere `VITE_API_URL`, sintaxis de PowerShell para el
   proxy, comportamiento real sin internet, ubicación de la BD, `Ctrl + C` para parar y enlace al tutorial.

## Limitaciones conocidas

- **Windows no probado directamente.** Comprobado: scripts multiplataforma (`tsx`, `concurrently`,
  `rmSync`), saltos de línea normalizados (`.gitattributes`) y binario de SQLite para `win32-x64` dentro
  del paquete. Con Node 24 / npm 11 no se compila nada. Con Node 22 / npm 10, npm sí compila SQLite y
  necesitaría Build Tools: por eso el README exige Node 24.
- **`better-sqlite3` 13.2.0** se publicó el 14/11/2026. Se eligió porque es la primera línea que trae los
  binarios dentro del paquete. Alternativa más veterana: 12.11.x (descarga el binario en la instalación).
- **NVDA** (C.17) queda para revisión manual.

---

# Revisión contra el documento original del reto (19/11/2026, tras el rediseño visual)

Segunda verificación completa, esta vez requisito a requisito del enunciado (`Prueba Devs con IA`),
sobre la versión con el rediseño visual. Base de datos recreada desde cero, VATcomply y open.er-api.com reales.

## 2.A Backend

| Requisito del enunciado | Evidencia | Estado |
|---|---|---|
| Node.js (TypeScript) + SQLite | Express 5 + better-sqlite3 | ✔ |
| `POST /customers` con empresa, identificador fiscal, email, país y plan | Alta real de clientes de ES, FR y SE | ✔ |
| Validación algorítmica estricta del identificador si el país es España | DNI, NIE, NIF K y CIF falsos → 422; formato desconocido → 422 | ✔ |
| `POST /simulations` (cliente, usuarios, almacenamiento, llamadas API) persistido | Fila comprobada en la tabla `simulations` | ✔ |
| Tarificación acumulativa por tramos (10 € / 8 € / 5 €) | Ejemplo del enunciado: 15 usuarios = 140 €; 120 usuarios = 770 € | ✔ |
| Sumar el IVA del país del cliente | ES 21 % → 169,40 €; FR 20 % → 168,00 €; SE 25 % → 962,50 € | ✔ |

## 2.B Frontend

| Requisito del enunciado | Evidencia | Estado |
|---|---|---|
| API pública de tipos de cambio y cambio de divisa en tiempo real | USD 185,90 US$ y GBP 141,28 GBP para 169,40 € | ✔ |
| Buscador por nombre de empresa o identificador fiscal | Nombre sin tildes («facil») y NIF parcial con guion («b-123»); estado vacío | ✔ |
| Detalle del cliente en tarjetas responsive con historial de simulaciones | 360 / 768 / 1280 px sin desbordes | ✔ |
| Slider con proyección de la factura en tiempo real en la divisa elegida | 10 / 11 / 50 / 51 usuarios → 100 / 108 / 420 / 425 €; slider con teclado | ✔ |
| Interfaz responsive y estados de carga/error con la API externa | Sin divisas → aviso y EUR; backend parado → error con «Reintentar» | ✔ |

## Calidad y accesibilidad tras el rediseño

- 239 tests · lint y typecheck sin errores · ningún fichero > 200 líneas · 0 `any`.
- axe sin violaciones en 5 vistas × 3 anchos · recorrido solo con teclado con foco visible.
- Lighthouse: **accesibilidad 100** y **buenas prácticas 100** en las 4 vistas.

## Defectos encontrados en esta revisión y corregidos

1. **Subtotal oculto en móvil.** Con el rediseño, la tabla de desglose medía hasta 348 px en un espacio de
   278 px (pantalla de 360 px): la columna «Subtotal» quedaba fuera de la vista. Se permite partir
   «Precio/usuario» y se compacta la tabla solo en móvil, manteniendo el punto de color, que sirve de
   leyenda de la barra de tramos. Medido con 10, 60 y 10.000 usuarios: cabe en los tres casos.
2. **Error en consola en todas las páginas** (`favicon.ico` 404, detectado por Lighthouse). Se añade un
   favicon SVG con el logotipo del rediseño. Buenas prácticas: de 96 a 100.
3. **Script de verificación desactualizado.** `flujos-navegador.cjs` usaba una clase de CSS que el rediseño
   eliminó y tenía una carrera con el debounce del buscador (leía resultados de la búsqueda anterior). Ahora
   espera al resultado concreto y localiza los importes por su etiqueta visible, no por clases de estilo.
