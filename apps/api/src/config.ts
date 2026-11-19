// Lee la configuración del entorno. `.env` es opcional: si no existe se usan los valores por defecto.
try {
  process.loadEnvFile();
} catch {
  // Sin fichero .env: valores por defecto.
}

function readPort(raw: string | undefined): number {
  const port = Number(raw ?? 3000);
  return Number.isInteger(port) && port > 0 ? port : 3000;
}

export const config = {
  port: readPort(process.env.PORT),
  webOrigin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
} as const;
