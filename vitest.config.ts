import { defineConfig } from 'vitest/config';

// Cada paquete define su propio proyecto de tests (entorno node o jsdom).
export default defineConfig({
  test: {
    projects: ['packages/*', 'apps/*'],
  },
});
