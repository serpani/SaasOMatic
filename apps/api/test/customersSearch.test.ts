import { beforeEach, describe, expect, it } from 'vitest';
import { createCustomer, createTestContext, type TestContext } from './helpers';

let ctx: TestContext;

const names = async (query: string): Promise<string[]> => {
  const res = await ctx.api.get('/customers').query({ q: query }).expect(200);
  return res.body.items.map((c: { companyName: string }) => c.companyName);
};

beforeEach(async () => {
  ctx = createTestContext();
  await createCustomer(ctx, { companyName: 'Fácil Software S.L.', taxId: 'B12345674' });
  await createCustomer(ctx, { companyName: 'Acme Corporation', taxId: 'FR12345678901', countryCode: 'FR' });
  await createCustomer(ctx, { companyName: 'Zeta 100% Cloud', taxId: '12345678Z' });
});

describe('GET /customers — A.4.9 búsqueda', () => {
  it('sin texto devuelve todos, ordenados por nombre', async () => {
    expect(await names('')).toEqual(['Acme Corporation', 'Fácil Software S.L.', 'Zeta 100% Cloud']);
  });

  it('busca por parte del nombre sin distinguir mayúsculas', async () => {
    expect(await names('CORPOR')).toEqual(['Acme Corporation']);
  });

  it('busca sin distinguir tildes en ningún sentido', async () => {
    expect(await names('facil')).toEqual(['Fácil Software S.L.']);
    expect(await names('FÁCIL')).toEqual(['Fácil Software S.L.']);
  });

  it('busca por parte del identificador fiscal, aunque se escriba con guiones o minúsculas', async () => {
    expect(await names('b-1234')).toEqual(['Fácil Software S.L.']);
    expect(await names('fr123')).toEqual(['Acme Corporation']);
  });

  it('trata % y _ como texto, no como comodines', async () => {
    expect(await names('100%')).toEqual(['Zeta 100% Cloud']);
    expect(await names('%')).toEqual(['Zeta 100% Cloud']);
    expect(await names('_')).toEqual([]);
  });

  it('devuelve lista vacía si no hay coincidencias', async () => {
    const res = await ctx.api.get('/customers').query({ q: 'inexistente' }).expect(200);
    expect(res.body).toEqual({ items: [], total: 0, page: 1, pageSize: 20 });
  });
});

describe('GET /customers — paginación', () => {
  it('pagina con total, page y pageSize', async () => {
    const first = await ctx.api.get('/customers').query({ page: 1, pageSize: 2 }).expect(200);
    expect(first.body).toMatchObject({ total: 3, page: 1, pageSize: 2 });
    expect(first.body.items).toHaveLength(2);

    const second = await ctx.api.get('/customers').query({ page: 2, pageSize: 2 }).expect(200);
    expect(second.body.items.map((c: { companyName: string }) => c.companyName)).toEqual(['Zeta 100% Cloud']);
  });

  it('una página más allá del final devuelve lista vacía con el total real', async () => {
    const res = await ctx.api.get('/customers').query({ page: 9 }).expect(200);
    expect(res.body).toMatchObject({ items: [], total: 3 });
  });

  it.each([
    { pageSize: 101 },
    { pageSize: 0 },
    { page: 0 },
    { page: 'uno' },
  ])('parámetros fuera de rango → 400 (%o)', async (query) => {
    const res = await ctx.api.get('/customers').query(query).expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
