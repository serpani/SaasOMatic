import { z } from './zod';

/** Identificador numérico en la URL (`/customers/:id`). */
export const idParamSchema = z.object({
  id: z.coerce
    .number({ error: 'El identificador no es válido.' })
    .int({ error: 'El identificador no es válido.' })
    .positive({ error: 'El identificador no es válido.' }),
});
