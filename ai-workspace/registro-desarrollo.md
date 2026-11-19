# Registro de desarrollo con IA

Bitácora de cada fase definida en `CLAUDE.md`. Al terminar cada fase la IA se detiene, resume lo hecho y
espera revisión antes de continuar. Aquí queda constancia de qué se pidió, qué se generó, qué se corrigió
durante la revisión y cómo se verificó.

---

## Fase 1 — Scaffolding del monorepo, lint, typecheck y Vitest

**Instrucción:** montar el monorepo según la sección *Stack* y *Estructura* de `CLAUDE.md`, con lint,
comprobación de tipos y tests funcionando antes de escribir lógica de negocio.

### Qué se generó

| Pieza | Detalle |
|---|---|
| Monorepo | npm workspaces: `packages/shared`, `apps/api`, `apps/web`. ESM en todos los paquetes. |
| TypeScript | `tsconfig.base.json` en modo `strict` + `noUncheckedIndexedAccess`, extendido por cada paquete. |
| `packages/shared` | Se consume directamente desde el código TypeScript (sin paso de build), así API y web comparten la misma lógica. |
| `apps/api` | Express 5 con `createApp()` separado de `server.ts` para testear con Supertest. Endpoint `GET /health`. Carpetas de capas creadas. `.env` opcional (`PORT`, `WEB_ORIGIN`). |
| `apps/web` | React 19 + Vite 6, `lang="es"`, estructura `features/*` y `shared/*`. Vitest con jsdom, Testing Library y `vitest-axe`. |
| Scripts raíz | `npm run dev` (API + web a la vez), `npm test`, `npm run lint`, `npm run typecheck`. |

### Reglas de `CLAUDE.md` convertidas en comprobaciones automáticas

En lugar de confiar en que la IA "recuerde" las reglas, se configuró ESLint para que las haga cumplir:

| Regla de `CLAUDE.md` | Cómo se hace cumplir |
|---|---|
| 1. Ficheros < 200 líneas | `max-lines: 200` como **error** en todos los `.ts/.tsx`. |
| 3. Prohibido `any` | `@typescript-eslint/no-explicit-any` como **error**. |
| Accesibilidad | `eslint-plugin-jsx-a11y` en modo `strict` para los componentes React; test de axe desde el primer componente. |
| Código limpio | `consistent-type-imports`, `eqeqeq`, `no-unused-vars`, reglas de hooks de React. |

### Correcciones hechas durante la revisión

1. **Vulnerabilidad crítica en las dependencias de test.** `npm audit` detectó dos avisos críticos
   (RCE por *prototype pollution* en `tinypool`) en Vitest 3. La solución automática proponía Vitest 5,
   que **ya no es compatible con Node 20** (requisito del README). Se eligió Vitest 4.1, compatible con
   Node 20 y sin la vulnerabilidad → `npm audit`: 0 vulnerabilidades.
2. **Configuración obsoleta.** Vitest 4 elimina `vitest.workspace.ts`; se migró a `test.projects` en
   `vitest.config.ts`.
3. **Fallo de npm 10 al resolver dependencias** (`Cannot read properties of null (reading 'edgesOut')`).
   Se generó el lockfile y se comprobó que una instalación limpia con npm 10 (el que trae Node 20)
   funciona sin errores a partir de él.
4. **Ruido en los tests de accesibilidad.** axe intenta usar canvas, que jsdom no implementa. Se
   desactiva en el *setup* de tests y se documenta que el contraste se valida con Lighthouse (plan de
   pruebas, punto C.18), porque jsdom no puede medirlo.
5. **`console.log` en el servidor** marcado por lint → sustituido por `console.info`.

### Verificación

- `npm run lint` ✔ · `npm run typecheck` ✔ · `npm test` ✔ (3 ficheros, 4 tests, incluido axe sin violaciones).
- `npm run dev`: `GET http://localhost:3000/health` → `{"status":"ok"}` y la web responde en `http://localhost:5173`.

---

## Fase 2 — `packages/shared`: cálculo por tramos y validación fiscal

**Instrucción:** implementar `pricing` y `taxId` en el paquete compartido siguiendo las secciones
*Cálculo por tramos* y *Validación fiscal* de `CLAUDE.md`, con los casos A.1, A.2 y A.3 del plan de pruebas.

### Qué se generó

| Módulo | Ficheros | Responsabilidad |
|---|---|---|
| `types/` | `pricing.ts`, `taxId.ts`, `api.ts` | Tipos compartidos: tramos, desglose, factura, resultado de validación y contratos de la API (`Customer`, `Simulation`, `Plan`, `TaxRate`, `Paginated`, `ApiErrorBody`). |
| `pricing/` | `calculateBaseCost.ts` | Tarificación acumulativa. Recibe los tramos como parámetro (vienen de BD), devuelve `baseCents` y `tierBreakdown` con solo los tramos usados. |
| | `calculateTax.ts` | IVA redondeado al céntimo con `Math.round`. |
| | `calculateQuote.ts` | Base + IVA + total. Es la función que usarán **tanto la API como el simulador del frontend**. |
| | `validateTiers.ts` | Tramos contiguos desde 1, sin solapes, precio entero positivo y un único tramo final sin tope. Se ejecutará al arrancar la API. |
| | `constants.ts`, `defaultTiers.ts` | Rango 1–10.000 y tramos iniciales del RN (solo para sembrar la BD). |
| `taxId/` | `normalize.ts` | Mayúsculas, sin espacios ni guiones. |
| | `spanishPersonalId.ts` | DNI (mod 23) y NIE (X/Y/Z → 0/1/2). |
| | `spanishCif.ts` | CIF (algoritmo de la AEAT), incluida la regla de qué organizaciones exigen letra o dígito de control. |
| | `validateTaxId.ts` | Orquesta según el país y devuelve `code` técnico + `message` en español. |

### Decisiones técnicas revisadas

1. **IVA sin coma flotante.** Un cálculo directo `base × 8,1 / 100` da `810,0000000000001`. El porcentaje se
   convierte a centésimas de punto (`8,1 → 810`) y se opera solo con enteros antes de redondear. Hay tests
   con tipos decimales reales de la UE (8,1 %, 25,5 %, 5,5 %).
2. **Validación de entradas en el propio cálculo.** `calculateBaseCost` rechaza 0, 10.001, decimales,
   negativos, `NaN` e `Infinity` aunque la API ya valide antes: la función es segura por sí misma.
3. **Tramos parametrizables de verdad.** Un test usa tramos distintos a los del RN para asegurar que
   no hay precios fijados en el código.
4. **CIF completo.** Además del caso del plan de pruebas (`B12345674`) se cubre la regla de tipo de control
   por letra de organización y un CIF real (`A58818501`).
5. **Mensajes para el comercial.** Cada error de validación fiscal lleva un `code` estable para la API y un
   `message` en español sin jerga técnica.

### Verificación

- 81 tests en `packages/shared` (84 en total en el monorepo): tramos 1/10/11/15/50/51/100, rechazos,
  desglose, IVA 21 % sobre 140 € = 29,40 € / 169,40 €, redondeo, 0 % EE. UU., DNI/NIE/CIF válidos e
  inválidos, normalización y países no españoles.
- `npm run lint` ✔ · `npm run typecheck` ✔ · `npm test` ✔ · fichero más largo: 121 líneas.

### Puntos abiertos para revisar

- ~~**NIF de tipo K, L y M**: no implementados.~~ → Resuelto tras la revisión (ver *Ajuste — Todos los tipos de NIF*).

---

## Ajuste — Node.js 24 LTS

Node.js 20 dejó de tener soporte en abril de 2026 y `winget install OpenJS.NodeJS.LTS` ya no instala
esa versión. Se actualiza el requisito a **Node.js 24 LTS** (con npm 11) en el `README`, en `CLAUDE.md`,
en `.nvmrc`, en `engines` de `package.json` y en `@types/node`.

Vitest 4.1 se mantiene: es compatible con Node 24 y no tiene vulnerabilidades conocidas.

**Pendiente para la fase 3:** npm 11 no ejecuta por defecto los scripts de instalación de las
dependencias si no están aprobados (`allow-scripts`). `better-sqlite3` necesita el suyo para descargar su
binario nativo, así que habrá que aprobarlo de forma explícita y documentarlo en el README.

---

## Ajuste — Todos los tipos de NIF y avisos del plan en `packages/shared`

### Revisión: la IA se quedó corta con los NIF

Al cerrar la fase 2 la IA propuso dejar sin soporte los NIF K, L y M por no estar en `CLAUDE.md`.
**Se rechazó la propuesta:** el RN pide validar el DNI/NIF/CIF con el algoritmo oficial, y un NIF de una
persona menor de 14 años (K), un español residente en el extranjero sin DNI (L) o un extranjero sin NIE (M)
es tan válido como un DNI. Se exigió soportar todos los tipos de NIF.

| Tipo | Formato | Control |
|---|---|---|
| DNI | 8 dígitos + letra | `TRWAGMYFPDXBNJZSQVHLCKE`[número mod 23] |
| NIE | X/Y/Z + 7 dígitos + letra | Igual que el DNI, con X/Y/Z → 0/1/2 |
| **NIF K, L, M** | K/L/M + 7 dígitos + letra | **Igual que el DNI, sobre los 7 dígitos** |
| CIF | Letra de organización + 7 dígitos + control | Luhn; letra `JABCDEFGHI` o dígito según la organización |

**Cómo se verificó el algoritmo** en lugar de fiarse de la memoria del modelo:
1. Se leyó el código fuente de python-stdnum (`stdnum/es/nif.py`), que confirma que K/L/M usan el algoritmo
   del DNI sobre los 7 dígitos centrales.
2. Se hizo una prueba cruzada con 4.000 identificadores aleatorios contra un oráculo independiente
   (ver `verificaciones/`): **0 diferencias inesperadas**. Las únicas diferencias son los CIF en los que
   aplicamos la regla estricta de la AEAT y python-stdnum es permisivo; es una decisión intencionada.

### Avisos del plan compartidos

`getPlanWarnings` vive en `packages/shared/src/plans` (se añade `plans` a la estructura de `CLAUDE.md`).
La API la usará para devolver `planWarnings` y el simulador para mostrar los mismos avisos en tiempo real
mientras se mueve el slider, sin duplicar la lógica. Avisa solo si el uso **supera** el plan (en el límite
exacto no hay aviso) y formatea los números con separador de miles español igual en Node y navegador.

### Verificación

- 105 tests en verde (nuevos: NIF K/L/M válidos, inválidos, formato y normalización; avisos del plan).
- `npm run lint` ✔ · `npm run typecheck` ✔.

---

## Fase 3 — API: BD, migraciones, seeds, sincronización de IVA, endpoints, errores y tests

**Instrucción:** implementar el backend según *Modelo de datos*, *IVA* y *API* de `CLAUDE.md`, con los casos
A.4 del plan de pruebas.

### Arquitectura en capas

```
routes/index.ts          URL → controlador (tabla de rutas, nada más)
controllers/*            valida la forma con Zod → llama al servicio → responde (sin lógica)
services/*               reglas de negocio: país admitido, plan, NIF, duplicados, cálculo, avisos, sync IVA
repositories/*           SQL y mapeo snake_case ↔ camelCase (único sitio donde ocurre)
db/*                     conexión, migraciones versionadas, seed idempotente, bootstrap y script de setup
errors/*                 AppError + manejador único → { error: { code, message, details? } }
container.ts             cableado de dependencias (repositorios → servicios); los tests lo reutilizan
```

### Decisiones técnicas

| Tema | Decisión | Motivo |
|---|---|---|
| Códigos de error | 400 forma (Zod) → 422 negocio (país, plan, NIF) → 409 duplicado → 404 | Coincide con el contrato de `CLAUDE.md` y permite al frontend reaccionar por `code`. |
| `details` | Lista `[{ field, message }]` en 400 y 422 | El frontend asocia cada error a su campo (`aria-describedby`, requisito de accesibilidad). |
| Mensajes de Zod | Mensaje propio en español por campo + `z.locales.es()` de respaldo | Ningún mensaje técnico o en inglés llega al comercial. |
| Duplicados | Comprobación previa + `UNIQUE` en BD capturado como 409 | Cubre la carrera de dos altas simultáneas con el mismo NIF. |
| Búsqueda | Función SQL `search_normalize` (minúsculas y sin tildes) y escape de `%` y `_` | `LIKE` de SQLite solo ignora mayúsculas en ASCII: "facil" no encontraba "Fácil". |
| Integridad en BD | `CHECK` (rangos, `total = base + IVA`, JSON válido) y claves foráneas activas | Última barrera aunque falle una capa superior. |
| Migraciones | Lista versionada con `PRAGMA user_version`, en transacción | Sin dependencias extra; idempotente. |
| Seed | `INSERT OR IGNORE`, tramos solo si la tabla está vacía | Se ejecuta en cada arranque sin pisar el IVA sincronizado ni tramos modificados. |
| Sync IVA | Zod sobre la respuesta, `EL → GR`, solo los 27 de la UE, timeout 10 s, escritura en transacción | Un dato raro de VATcomply no corrompe la BD; si falla, aviso en log y se sigue con la BD. |
| Tramos | `assertPricingTiersAreValid()` al arrancar; la API no arranca si son incoherentes | Requisito de `CLAUDE.md`. |

### Problemas encontrados y cómo se resolvieron

1. **El entorno de desarrollo bloqueaba VATcomply** (`403` del proxy). En lugar de suponer el formato de
   la respuesta, se pidió permiso para abrir `api.vatcomply.com` y `open.er-api.com` y se inspeccionó la
   respuesta real: array de 27 países, Grecia como `EL`, y la divisa incluida.
2. **`fetch` de Node ignora el proxy del sistema.** La primera sincronización falló con `fetch failed`;
   con `NODE_USE_ENV_PROXY=1` funcionó (27 países actualizados). Se documenta en el README para redes
   corporativas.
3. **npm 11 y los scripts de instalación.** npm 11 avisa de que `better-sqlite3` tiene un script no
   aprobado (en el futuro lo bloqueará). Se probó en un directorio aislado y se añadió
   `allowScripts` al `package.json` sin fijar versión, para que no se rompa al actualizar.
4. **Revisión de los tests generados.** Se detectaron dos defectos en los propios tests: un mock de logger
   compartido entre casos sin limpiar (una aserción podía pasar por una llamada anterior) y un test cuyo
   nombre prometía comprobar la transacción cuando en realidad comprobaba la validación. Ambos corregidos.
5. **Cast innecesario** (`as CustomerRow[]`) en la búsqueda: sustituido por sentencias preparadas tipadas.

### Prueba manual con el servidor real

Alta con NIF `b-1234567 4` → guardado como `B12345674`; repetido → 409; Japón → 422; NIF con letra mala →
422; campos vacíos → 400 con un mensaje por campo; simulación de 15 usuarios con 80 GB en plan Basic →
140 € + 29,40 € = 169,40 € y aviso de almacenamiento; búsqueda por `FACIL` y por `b-123` → encontrado;
JSON roto → 400; cliente y ruta inexistentes → 404.

### Verificación

- 78 tests de integración de la API (182 en total), que cubren los 12 puntos de A.4: alta y persistencia,
  409, JP → 422, plan → 422, 400, cálculo y BD, avisos, 404, inmutabilidad ante cambios de tramo e IVA,
  búsqueda y paginación, VATcomply caída o con datos erróneos o lenta, formato de errores y nombres BD = API.
- `npm run lint` ✔ · `npm run typecheck` ✔ · `npm test` ✔ · fichero más largo: 112 líneas.
