# SaaS-O-Matic

Herramienta interna para simular, optimizar y presupuestar suscripciones SaaS multi-divisa para clientes corporativos.

- **Backend:** Node.js + TypeScript, Express, SQLite.
- **Frontend:** React + Vite + TypeScript.
- **Documentación del proceso con IA:** carpeta [`/ai-workspace`](./ai-workspace).

## Requisitos previos

Se da por hecho que **Git** está instalado. Además se necesita **Node.js 24 LTS** (incluye npm 11).

### Instalar Node.js en Windows 10 / 11

Abre **PowerShell** y ejecuta:

```powershell
winget install OpenJS.NodeJS.LTS
```

Cierra y vuelve a abrir PowerShell, y comprueba la instalación:

```powershell
node -v
npm -v
```

Debe mostrar `v24.x` o superior y `11.x` o superior.

> Si `winget` no está disponible, descarga el instalador LTS desde https://nodejs.org y sigue el asistente con las opciones por defecto.

> Si PowerShell bloquea `npm` por la política de ejecución, ejecuta una vez:
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

## Puesta en marcha

### 1. Descargar el repositorio

```powershell
git clone https://github.com/<usuario>/<repositorio>.git
cd <repositorio>
```

### 2. Instalar dependencias

```powershell
npm install
```

Instala de una vez las dependencias de backend, frontend y paquete compartido.

### 3. Preparar la base de datos

```powershell
npm run db:setup
```

Crea el fichero SQLite, las tablas y los datos iniciales (planes, tramos de precio e IVA). No requiere instalar ningún servidor de base de datos. Además descarga el IVA vigente de la UE desde VATcomply; si no hay conexión, se usan los tipos incluidos en el seed.

La configuración (puerto, ruta de la base de datos…) tiene valores por defecto. Para cambiarla, copia `apps/api/.env.example` como `apps/api/.env` y edítalo.

### 4. Arrancar la aplicación

```powershell
npm run dev
```

Arranca backend y frontend a la vez.

### 5. Abrir en el navegador

| Servicio | Dirección |
|---|---|
| Aplicación (frontend) | http://localhost:5173 |
| API (backend) | http://localhost:3000 |

## Otros comandos

| Comando | Descripción |
|---|---|
| `npm test` | Ejecuta todos los tests |
| `npm run lint` | Revisa el estilo del código |
| `npm run typecheck` | Comprueba los tipos de TypeScript |
| `npm run db:reset` | Borra y recrea la base de datos |

## Solución de problemas

- **Puerto ocupado:** cierra la aplicación que use el puerto 3000 o 5173, o cambia `PORT` en `apps/api/.env`.
- **Sin internet:** la app funciona; el IVA usa los datos guardados y las divisas muestran un aviso y valores en EUR.
- **Error al instalar `better-sqlite3`:** asegúrate de usar Node 24 LTS (`node -v`) y repite `npm install`.
- **Aviso `install-scripts` de npm 11:** `better-sqlite3` necesita su script de instalación para descargar el binario de SQLite. Ya está aprobado en `allowScripts` del `package.json`; si npm lo bloquea, ejecuta `npm install-scripts approve better-sqlite3` y repite `npm install`.
- **Red con proxy corporativo:** la sincronización del IVA usa `fetch` de Node, que no lee el proxy del sistema por defecto. Define `NODE_USE_ENV_PROXY=1` junto a `HTTPS_PROXY` antes de `npm run dev`. Sin acceso, la API arranca igual con el IVA guardado.

## Estructura

```
apps/api         Backend (Express + SQLite)
apps/web         Frontend (React)
packages/shared  Lógica compartida (tramos, validación fiscal, tipos)
ai-workspace     Especificaciones, decisiones y proceso con IA
```
