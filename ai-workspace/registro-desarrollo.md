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
