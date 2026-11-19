import { beforeEach, describe, expect, it } from 'vitest';
import { createCustomer, createTestContext, type TestContext } from './helpers';

let ctx: TestContext;
let customerId: number;

const simulate = (body: Record<string, unknown>) =>
  ctx.api.post('/simulations').send({ customerId, storageGb: 10, apiCalls: 1_000, ...body });

beforeEach(async () => {
  ctx = createTestContext();
  customerId = await createCustomer(ctx); // España, plan basic (50 GB, 10.000 llamadas)
});

describe('POST /simulations', () => {
  it('A.4.5 calcula importes correctos, desglose coherente y lo guarda en BD', async () => {
    const res = await simulate({ activeUsers: 15 }).expect(201);

    expect(res.body).toMatchObject({
      id: expect.any(Number),
      customerId,
      activeUsers: 15,
      baseCents: 14_000,
      taxPercent: 21,
      taxCents: 2_940,
      totalCents: 16_940,
      planWarnings: [],
    });
    expect(res.body.tierBreakdown).toEqual([
      { minUsers: 1, maxUsers: 10, users: 10, unitCents: 1_000, subtotalCents: 10_000 },
      { minUsers: 11, maxUsers: 50, users: 5, unitCents: 800, subtotalCents: 4_000 },
    ]);

    const row = ctx.db.prepare('SELECT * FROM simulations WHERE id = ?').get(res.body.id);
    expect(row).toMatchObject({ base_cents: 14_000, tax_cents: 2_940, total_cents: 16_940 });
  });

  it('nunca confía en importes enviados por el cliente: los recalcula', async () => {
    const res = await simulate({ activeUsers: 15, baseCents: 1, totalCents: 1, taxPercent: 0 }).expect(201);
    expect(res.body).toMatchObject({ baseCents: 14_000, taxPercent: 21, totalCents: 16_940 });
  });

  it('aplica el IVA del país del cliente (EE. UU. 0 %, Reino Unido 20 %)', async () => {
    const us = await createCustomer(ctx, { countryCode: 'US', taxId: '123456789' });
    const gb = await createCustomer(ctx, { countryCode: 'GB', taxId: 'GB123456789' });
    const usRes = await ctx.api.post('/simulations').send({ customerId: us, activeUsers: 15, storageGb: 0, apiCalls: 0 });
    const gbRes = await ctx.api.post('/simulations').send({ customerId: gb, activeUsers: 15, storageGb: 0, apiCalls: 0 });
    expect(usRes.body).toMatchObject({ taxCents: 0, totalCents: 14_000 });
    expect(gbRes.body).toMatchObject({ taxPercent: 20, taxCents: 2_800, totalCents: 16_800 });
  });

  it('A.4.6 superar el plan → 201 con planWarnings (no bloquea)', async () => {
    const res = await simulate({ activeUsers: 5, storageGb: 80, apiCalls: 20_000 }).expect(201);
    expect(res.body.planWarnings).toEqual([
      'El almacenamiento estimado (80 GB) supera los 50 GB incluidos en el plan Basic.',
      'Las llamadas a la API estimadas (20.000) superan las 10.000 incluidas en el plan Basic.',
    ]);
  });

  it('A.4.7 cliente inexistente → 404', async () => {
    const res = await ctx.api.post('/simulations').send({ customerId: 999, activeUsers: 5, storageGb: 0, apiCalls: 0 });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('CUSTOMER_NOT_FOUND');
  });

  it.each([0, 10_001, 1.5, -1, '15', null])('usuarios no válidos (%s) → 400', async (activeUsers) => {
    const res = await simulate({ activeUsers }).expect(400);
    expect(res.body.error.details[0]).toMatchObject({ field: 'activeUsers' });
  });

  it.each([
    { storageGb: -1 },
    { apiCalls: 2.5 },
    { storageGb: undefined },
  ])('almacenamiento o llamadas no válidos → 400 (%o)', async (body) => {
    await simulate({ activeUsers: 5, ...body }).expect(400);
  });
});

describe('GET /customers/:id/simulations', () => {
  it('lista el historial, de la más reciente a la más antigua', async () => {
    await simulate({ activeUsers: 1 }).expect(201);
    await simulate({ activeUsers: 2 }).expect(201);
    await simulate({ activeUsers: 3 }).expect(201);
    const res = await ctx.api.get(`/customers/${customerId}/simulations`).expect(200);
    expect(res.body.map((s: { activeUsers: number }) => s.activeUsers)).toEqual([3, 2, 1]);
  });

  it('cliente sin simulaciones → lista vacía', async () => {
    await ctx.api.get(`/customers/${customerId}/simulations`).expect(200, []);
  });

  it('cliente inexistente → 404', async () => {
    await ctx.api.get('/customers/999/simulations').expect(404);
  });
});

describe('A.4.8 simulaciones inmutables', () => {
  it('cambiar un tramo o el IVA no altera las simulaciones antiguas; las nuevas usan el precio nuevo', async () => {
    const old = await simulate({ activeUsers: 15 }).expect(201);

    ctx.db.prepare('UPDATE pricing_tiers SET unit_cents = 600 WHERE min_users = 11').run();
    ctx.db.prepare("UPDATE tax_rates SET rate_percent = 10 WHERE country_code = 'ES'").run();
    const fresh = await simulate({ activeUsers: 15 }).expect(201);

    expect(fresh.body).toMatchObject({ baseCents: 13_000, taxPercent: 10, taxCents: 1_300 });
    const history = await ctx.api.get(`/customers/${customerId}/simulations`).expect(200);
    const stored = history.body.find((s: { id: number }) => s.id === old.body.id);
    expect(stored).toMatchObject({ baseCents: 14_000, taxPercent: 21, taxCents: 2_940, totalCents: 16_940 });
    expect(stored.tierBreakdown[1]).toMatchObject({ unitCents: 800 });
  });
});
