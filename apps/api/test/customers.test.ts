import { beforeEach, describe, expect, it } from 'vitest';
import { createCustomer, createTestContext, type TestContext, validCustomer } from './helpers';

let ctx: TestContext;
beforeEach(() => {
  ctx = createTestContext();
});

describe('POST /customers', () => {
  it('A.4.1 crea el cliente → 201 y queda persistido', async () => {
    const res = await ctx.api.post('/customers').send(validCustomer()).expect(201);

    expect(res.body).toMatchObject({ id: expect.any(Number), ...validCustomer(), createdAt: expect.any(String) });
    const row = ctx.db.prepare('SELECT * FROM customers WHERE id = ?').get(res.body.id);
    expect(row).toMatchObject({ company_name: 'Fácil Software S.L.', tax_id: 'B12345674', plan_code: 'basic' });
  });

  it('guarda el identificador fiscal y los códigos normalizados', async () => {
    const res = await ctx.api
      .post('/customers')
      .send(validCustomer({ taxId: ' b-1234567 4 ', countryCode: 'es', planCode: 'PRO', companyName: '  ACME  ' }))
      .expect(201);
    expect(res.body).toMatchObject({ taxId: 'B12345674', countryCode: 'ES', planCode: 'pro', companyName: 'ACME' });
  });

  it.each(['12345678Z', 'X1234567L', 'K1234567L', 'B12345674'])('acepta el NIF español %s', async (taxId) => {
    await ctx.api.post('/customers').send(validCustomer({ taxId })).expect(201);
  });

  it('A.4.2 taxId repetido → 409 con mensaje legible', async () => {
    const id = await createCustomer(ctx);
    const res = await ctx.api.post('/customers').send(validCustomer({ taxId: 'b-12345674' })).expect(409);
    expect(res.body.error).toMatchObject({
      code: 'CUSTOMER_ALREADY_EXISTS',
      message: expect.stringContaining('Ya existe un cliente'),
      details: { field: 'taxId', customerId: id },
    });
  });

  it('A.4.3 país no admitido (JP) enviado directo a la API → 422', async () => {
    const res = await ctx.api
      .post('/customers')
      .send(validCustomer({ countryCode: 'JP', taxId: 'JP1234567' }))
      .expect(422);
    expect(res.body.error.code).toBe('COUNTRY_NOT_SUPPORTED');
    expect(res.body.error.details).toEqual([{ field: 'countryCode', message: expect.any(String) }]);
  });

  it('A.4.4 plan inexistente → 422', async () => {
    const res = await ctx.api.post('/customers').send(validCustomer({ planCode: 'gold' })).expect(422);
    expect(res.body.error.code).toBe('PLAN_NOT_FOUND');
  });

  it('NIF español con control erróneo → 422 asociado al campo taxId', async () => {
    const res = await ctx.api.post('/customers').send(validCustomer({ taxId: '12345678A' })).expect(422);
    expect(res.body.error).toMatchObject({
      code: 'TAX_ID_INVALID_CONTROL',
      details: [{ field: 'taxId', message: expect.stringContaining('no es válido') }],
    });
  });

  it('fuera de España solo valida el formato básico', async () => {
    await ctx.api.post('/customers').send(validCustomer({ countryCode: 'FR', taxId: '12345678A' })).expect(201);
    const res = await ctx.api.post('/customers').send(validCustomer({ countryCode: 'DE', taxId: 'DE.1' })).expect(422);
    expect(res.body.error.code).toBe('TAX_ID_INVALID_FORMAT');
  });

  it('A.4.4 campos ausentes → 400 con un detalle por campo', async () => {
    const res = await ctx.api.post('/customers').send({}).expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    const fields = res.body.error.details.map((d: { field: string }) => d.field);
    expect(fields).toEqual(['companyName', 'taxId', 'email', 'countryCode', 'planCode']);
  });

  it('A.4.4 email inválido → 400', async () => {
    const res = await ctx.api.post('/customers').send(validCustomer({ email: 'no-es-un-email' })).expect(400);
    expect(res.body.error.details).toEqual([{ field: 'email', message: 'El email de contacto no es válido.' }]);
  });

  it('rechaza tipos incorrectos → 400', async () => {
    await ctx.api.post('/customers').send({ ...validCustomer(), companyName: 42 }).expect(400);
  });
});

describe('GET /customers/:id', () => {
  it('devuelve el cliente', async () => {
    const id = await createCustomer(ctx);
    const res = await ctx.api.get(`/customers/${id}`).expect(200);
    expect(res.body).toMatchObject({ id, companyName: 'Fácil Software S.L.' });
  });

  it('A.4.7 cliente inexistente → 404', async () => {
    const res = await ctx.api.get('/customers/999').expect(404);
    expect(res.body.error.code).toBe('CUSTOMER_NOT_FOUND');
  });

  it.each(['abc', '0', '-1', '1.5'])('identificador no válido (%s) → 400', async (id) => {
    await ctx.api.get(`/customers/${id}`).expect(400);
  });
});
