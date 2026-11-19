import { z } from 'zod';

// Mensajes genéricos de Zod en español para cualquier campo sin mensaje propio.
z.config(z.locales.es());

export { z };
