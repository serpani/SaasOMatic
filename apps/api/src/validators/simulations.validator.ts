import { MAX_ACTIVE_USERS, MIN_ACTIVE_USERS } from '@saasomatic/shared';
import { z } from './zod';

const usersMessage = `El número de usuarios activos debe ser un número entero entre ${MIN_ACTIVE_USERS} y 10.000.`;

const nonNegativeInt = (message: string) =>
  z.number({ error: message }).int({ error: message }).min(0, { error: message });

/** Forma de `POST /simulations`. Los importes NO se aceptan del cliente: el backend los recalcula. */
export const createSimulationSchema = z.object({
  customerId: z
    .number({ error: 'Indica el cliente de la simulación.' })
    .int({ error: 'El cliente indicado no es válido.' })
    .positive({ error: 'El cliente indicado no es válido.' }),
  activeUsers: z
    .number({ error: usersMessage })
    .int({ error: usersMessage })
    .min(MIN_ACTIVE_USERS, { error: usersMessage })
    .max(MAX_ACTIVE_USERS, { error: usersMessage }),
  storageGb: nonNegativeInt('El almacenamiento debe ser un número entero de GB, 0 o mayor.'),
  apiCalls: nonNegativeInt('Las llamadas a la API deben ser un número entero, 0 o mayor.'),
});
