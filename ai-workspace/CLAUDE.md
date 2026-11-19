# CLAUDE.md — SaaS-O-Matic

Eres el desarrollador de SaaS-O-Matic: herramienta interna para que el equipo comercial simule y presupueste suscripciones SaaS multi-divisa. Las especificaciones completas están en `/ai-workspace`. Ante cualquier duda NO inventes: detente y pregunta.

## Stack
- Monorepo con npm workspaces. Node.js 20 LTS + TypeScript (strict).
- `apps/api`: Express + SQLite (better-sqlite3) + Zod.
- `apps/web`: React + Vite + TypeScript.
- `packages/shared`: lógica y tipos compartidos.
- Tests: Vitest (+ Supertest para la API).

## Estructura
```
apps/api/src/{routes,controllers,services,repositories,validators,db,errors}
apps/web/src/features/{customers,simulator,currency}/{components,hooks,api}
apps/web/src/shared/{http,ui}
packages/shared/src/{pricing,taxId,types}
ai-workspace/
```

## Reglas obligatorias
1. Ficheros < 200 líneas, una responsabilidad por fichero.
2. Capas: routes → controllers (sin lógica) → services (negocio) → repositories (SQL).
3. Prohibido `any`. Tipos compartidos en `packages/shared`.
4. **Nomenclatura única**: mismo nombre en BD (snake_case), API y frontend (camelCase). Ej.: `company_name` ↔ `companyName`. Sin sinónimos. El mapeo vive solo en repositories.
5. **Importes en céntimos enteros** (sufijo `_cents` / `Cents`). Nunca floats para dinero. IVA redondeado al céntimo (Math.round).
6. Nunca confíes en el frontend: el backend valida todo y recalcula importes.
7. Errores: `{ "error": { "code", "message", "details"? } }`. `message` en español claro para un comercial; nunca mostrar códigos HTTP al usuario.
8. Tests antes de dar una fase por terminada. `npm run lint`, `npm run typecheck` y `npm test` en verde.
9. Commits pequeños por fase con mensajes convencionales (feat:, fix:, test:, docs:).

## Modelo de datos (SQLite)
- `plans(code PK, name, storage_gb, api_calls)` — seed: basic(50 GB, 10000), pro(200 GB, 100000), enterprise(1000 GB, 1000000).
- `tax_rates(country_code PK, country_name, rate_type, rate_percent, currency, source['api'|'manual'], updated_at)`.
- `customers(id PK, company_name, tax_id UNIQUE, email, country_code FK→tax_rates, plan_code FK→plans, created_at)`.
- `simulations(id PK, customer_id FK→customers, active_users, storage_gb, api_calls, base_cents, tax_percent, tax_cents, total_cents, tier_breakdown JSON, created_at)`.
- `pricing_tiers(id PK, min_users, max_users NULL=sin tope, unit_cents)` — seed: (1,10,1000), (11,50,800), (51,NULL,500).
- Validar al arrancar que los tramos son contiguos, sin solapes y con un único tramo final sin tope.

## IVA
- Al arrancar (y cada 24 h) sincronizar `GET https://api.vatcomply.com/vat_rates` → tipo estándar de los 27 países UE. Mapear `EL` → `GR`. Si falla: log y seguir con lo que hay en BD.
- Seed manual: GB 20 %, US 0 % (provisional, sin IVA federal). Seed inicial UE en BD para arrancar sin red.
- Solo se admiten clientes de países presentes en `tax_rates` (validado también en backend → 422).

## Cálculo por tramos (packages/shared/pricing)
Acumulativo: cada usuario se cobra al precio de su tramo. 15 usuarios = 10×10 € + 5×8 € = 140 €. Devuelve `baseCents` y `tierBreakdown[{minUsers,maxUsers,users,unitCents,subtotalCents}]`. Rango válido 1–10.000 enteros.

## Validación fiscal (packages/shared/taxId)
Normalizar (mayúsculas, sin espacios ni guiones). Si país = ES: DNI (8 dígitos + letra mod 23), NIE (X/Y/Z → 0/1/2) y CIF (algoritmo oficial de dígito/letra de control). Otros países: formato alfanumérico 5–20.

## API (JSON camelCase)
- `POST /customers` {companyName, taxId, email, countryCode, planCode} → 201 | 400 | 409 (taxId duplicado) | 422 (país/plan/taxId no válido).
- `POST /simulations` {customerId, activeUsers, storageGb, apiCalls} → 201 con {id, customerId, activeUsers, storageGb, apiCalls, baseCents, taxPercent, taxCents, totalCents, tierBreakdown, planWarnings[], createdAt} | 400 | 404.
- `GET /customers?q=&page=&pageSize=` (parcial, case-insensitive en companyName y taxId; pageSize 20, máx 100) → {items,total,page,pageSize}.
- `GET /customers/:id`, `GET /customers/:id/simulations` (recientes primero), `GET /tax-rates`, `GET /plans`, `GET /pricing-tiers`.
- `planWarnings`: textos legibles si storageGb o apiCalls superan el plan. No bloquean.

## Frontend
- Vistas: Buscador/Dashboard (debounce 300 ms, cards responsive), Detalle de cliente (card + historial), Simulador (slider 1–10.000 + storageGb + apiCalls, factura y desglose en tiempo real con la lógica de `packages/shared`), Alta de cliente (selectores de país y plan desde la API), selector de divisa en la cabecera.
- Divisas: `https://open.er-api.com/v6/latest/EUR` SOLO desde el frontend. Caché en localStorage 1 h. Divisas: EUR, USD, GBP + monedas locales de países admitidos. Carga: indicador sin bloquear. Error: últimos tipos guardados con su fecha; sin caché, EUR con aviso.
- Timeouts (AbortController): 30 s API de divisas, 10 s nuestro backend. Al vencer: mensaje claro + botón reintentar.
- Estados de carga, vacío y error en todas las vistas.
- **Responsive (mobile-first)**: toda la aplicación usable en móvil (≥360 px), tablet y escritorio, no solo las cards. Slider y botones con área táctil ≥44 px.
- **Accesibilidad WCAG 2.1 AA**: HTML semántico; labels en todos los campos; errores asociados al campo (aria-describedby) y anunciados (aria-live); navegación completa por teclado con foco visible; slider accesible (aria-valuetext con el importe); contraste ≥4.5:1; no transmitir información solo con color; textos alternativos. Tests con eslint-plugin-jsx-a11y y axe (vitest-axe) sin violaciones.

## Fases (detente al final de cada una y resume lo hecho)
1. Scaffolding del monorepo, lint, typecheck y Vitest.
2. `packages/shared`: pricing + taxId con tests (ver plan de pruebas).
3. API: BD, migraciones, seeds, sync de IVA, endpoints, errores, tests de integración.
4. Web: http client con timeouts, divisas, vistas.
5. Verificación completa según `ai-workspace/plan-de-pruebas.pdf` y README.

## Casos de prueba mínimos
Tramos: 1→10 €, 10→100 €, 11→108 €, 15→140 €, 50→420 €, 51→425 €, 100→670 €; 0, 10001, decimales y negativos rechazados. IVA ES 21 % sobre 140 € → 29,40 € / 169,40 €. DNI 12345678Z válido, 12345678A inválido; CIF B12345674 válido. País JP vía API → 422. taxId duplicado → 409. Cambiar un tramo no altera simulaciones antiguas. axe sin violaciones en todas las vistas.
