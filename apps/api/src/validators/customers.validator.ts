import { z } from './zod';

const required = (message: string) => z.string({ error: message }).trim().min(1, { error: message });

/** Forma de `POST /customers`. Las reglas de negocio (país admitido, plan, NIF) van en el servicio → 422. */
export const createCustomerSchema = z.object({
  companyName: required('Introduce el nombre de la empresa.').max(200, {
    error: 'El nombre de la empresa no puede superar los 200 caracteres.',
  }),
  taxId: required('Introduce el identificador fiscal.').max(30, {
    error: 'El identificador fiscal no puede superar los 30 caracteres.',
  }),
  email: required('Introduce el email de contacto.')
    .max(254, { error: 'El email de contacto es demasiado largo.' })
    .pipe(z.email({ error: 'El email de contacto no es válido.' })),
  countryCode: required('Selecciona un país.')
    .toUpperCase()
    .regex(/^[A-Z]{2}$/, { error: 'Selecciona un país.' }),
  planCode: required('Selecciona un plan.').toLowerCase(),
});

/** `GET /customers?q=&page=&pageSize=` */
export const searchCustomersSchema = z.object({
  q: z
    .string({ error: 'El texto de búsqueda no es válido.' })
    .trim()
    .max(100, { error: 'El texto de búsqueda no puede superar los 100 caracteres.' })
    .default(''),
  page: z.coerce
    .number()
    .int({ error: 'La página debe ser un número entero.' })
    .min(1, { error: 'La página debe ser 1 o mayor.' })
    .default(1),
  pageSize: z.coerce
    .number()
    .int({ error: 'El tamaño de página debe ser un número entero.' })
    .min(1, { error: 'El tamaño de página debe estar entre 1 y 100.' })
    .max(100, { error: 'El tamaño de página debe estar entre 1 y 100.' })
    .default(20),
});
