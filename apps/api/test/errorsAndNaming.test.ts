import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app';
import { createContainer } from '../src/container';
import { bootstrapDatabase } from '../src/db/bootstrap';
import { createCustomer, createTestContext } from './helpers';
import request from 'supertest';

const camel = (snake: string) => snake.replace(/_([a-z])/g, (_m, c: string) => c.toUpperCase());

describe('A.4.11 formato de errores', () => {
  it('JSON mal formado → 400 INVALID_JSON', async () => {
    const res = await createTestContext()
      .api.post('/customers')
      .set('Content-Type', 'application/json')
      .send('{"companyName":')
      .expect(400);
    expect(res.body).toEqual({ error: { code: 'INVALID_JSON', message: expect.any(String) } });
  });

  it('ruta inexistente → 404 NOT_FOUND', async () => {
    const res = await createTestContext().api.get('/no-existe').expect(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('error inesperado → 500 con mensaje genérico, sin filtrar detalles internos', async () => {
    const db = bootstrapDatabase(':memory:');
    const app = createApp(createContainer(db), { webOrigin: 'http://localhost:5173' });
    db.close();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const res = await request(app).get('/plans').expect(500);
    expect(res.body).toEqual({ error: { code: 'INTERNAL_ERROR', message: expect.stringContaining('inesperado') } });
    expect(JSON.stringify(res.body)).not.toMatch(/database|sqlite/i);
  });

  it('todos los errores incluyen code y un message en español sin códigos HTTP', async () => {
    const ctx = createTestContext();
    const responses = await Promise.all([
      ctx.api.post('/customers').send({}),
      ctx.api.get('/customers/999'),
      ctx.api.get('/customers?pageSize=500'),
      ctx.api.post('/simulations').send({ customerId: 1, activeUsers: 0 }),
      ctx.api.get('/nada'),
    ]);
    for (const res of responses) {
      expect(res.body.error.code).toMatch(/^[A-Z_]+$/);
      expect(res.body.error.message).toMatch(/[a-záéíóúñ]/);
      expect(res.body.error.message).not.toMatch(/\b[1-5]\d\d\b|error:/i);
    }
  });

  it('permite peticiones desde el frontend (CORS)', async () => {
    const res = await createTestContext().api.get('/plans').set('Origin', 'http://localhost:5173');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });
});

describe('A.4.12 nombres de atributos idénticos entre BD y API', () => {
  const columns = (ctx: ReturnType<typeof createTestContext>, table: string) =>
    ctx.db
      .prepare<[], { name: string }>(`SELECT name FROM pragma_table_info('${table}')`)
      .all()
      .map((c) => camel(c.name))
      .sort();

  it.each([
    ['customers', '/customers/1'],
    ['plans', '/plans'],
    ['tax_rates', '/tax-rates'],
    ['pricing_tiers', '/pricing-tiers'],
    ['simulations', '/customers/1/simulations'],
  ])('%s ↔ %s', async (table, path) => {
    const ctx = createTestContext();
    const id = await createCustomer(ctx);
    await ctx.api.post('/simulations').send({ customerId: id, activeUsers: 3, storageGb: 0, apiCalls: 0 });

    const res = await ctx.api.get(path).expect(200);
    const sample = Array.isArray(res.body) ? res.body[0] : res.body;
    expect(Object.keys(sample).sort()).toEqual(columns(ctx, table));
  });
});
