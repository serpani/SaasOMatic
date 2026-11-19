import type { CreateCustomerInput } from '@saasomatic/shared';
import request from 'supertest';
import { createApp } from '../src/app';
import { createContainer } from '../src/container';
import { bootstrapDatabase } from '../src/db/bootstrap';

/** API completa sobre una base SQLite en memoria, con migraciones y datos iniciales. */
export function createTestContext(now?: () => Date) {
  const db = bootstrapDatabase(':memory:');
  const container = createContainer(db, now);
  const app = createApp(container, { webOrigin: 'http://localhost:5173' });
  return { db, container, app, api: request(app) };
}

export type TestContext = ReturnType<typeof createTestContext>;

export const validCustomer = (overrides: Partial<CreateCustomerInput> = {}): CreateCustomerInput => ({
  companyName: 'Fácil Software S.L.',
  taxId: 'B12345674',
  email: 'ventas@facil.es',
  countryCode: 'ES',
  planCode: 'basic',
  ...overrides,
});

/** Crea un cliente y devuelve su id. */
export async function createCustomer(
  ctx: TestContext,
  overrides: Partial<CreateCustomerInput> = {},
): Promise<number> {
  const res = await ctx.api.post('/customers').send(validCustomer(overrides)).expect(201);
  return Number(res.body.id);
}
