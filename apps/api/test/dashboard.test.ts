import { beforeEach, describe, expect, it } from 'vitest';
import { createCustomer, createTestContext, type TestContext } from './helpers';

let ctx: TestContext;
const simulate = (customerId: number, activeUsers: number) =>
  ctx.api.post('/simulations').send({ customerId, activeUsers, storageGb: 0, apiCalls: 0 }).expect(201);

beforeEach(() => {
  ctx = createTestContext();
});

describe('GET /dashboard', () => {
  it('sin datos devuelve ceros y todos los planes', async () => {
    const res = await ctx.api.get('/dashboard').expect(200);
    expect(res.body).toEqual({
      customersCount: 0,
      simulationsCount: 0,
      customersWithSimulationsCount: 0,
      estimatedMonthlyCents: 0,
      averageMonthlyCents: 0,
      customersByPlan: [
        { planCode: 'basic', planName: 'Basic', customers: 0 },
        { planCode: 'pro', planName: 'Pro', customers: 0 },
        { planCode: 'enterprise', planName: 'Enterprise', customers: 0 },
      ],
    });
  });

  it('la facturación estimada suma solo la última simulación de cada cliente', async () => {
    const spain = await createCustomer(ctx); // ES 21 %, basic
    const us = await createCustomer(ctx, { countryCode: 'US', taxId: '123456789', planCode: 'pro' }); // 0 %
    await createCustomer(ctx, { countryCode: 'FR', taxId: 'FR123456789', planCode: 'pro' }); // sin simulaciones

    await simulate(spain, 5); // 50 € + IVA → sustituida por la siguiente
    await simulate(spain, 15); // 140 € + 21 % = 169,40 €
    await simulate(us, 10); // 100 € + 0 % = 100 €

    const res = await ctx.api.get('/dashboard').expect(200);
    expect(res.body).toMatchObject({
      customersCount: 3,
      simulationsCount: 3,
      customersWithSimulationsCount: 2,
      estimatedMonthlyCents: 16_940 + 10_000,
      averageMonthlyCents: Math.round((16_940 + 10_000) / 2),
    });
    expect(res.body.customersByPlan).toEqual([
      { planCode: 'basic', planName: 'Basic', customers: 1 },
      { planCode: 'pro', planName: 'Pro', customers: 2 },
      { planCode: 'enterprise', planName: 'Enterprise', customers: 0 },
    ]);
  });
});

describe('GET /simulations/:id', () => {
  it('devuelve la foto guardada de la simulación', async () => {
    const id = await createCustomer(ctx);
    const created = await simulate(id, 15);
    const res = await ctx.api.get(`/simulations/${created.body.id}`).expect(200);
    // Es la misma simulación guardada; los avisos del plan solo acompañan a la respuesta del alta.
    expect({ ...res.body, planWarnings: created.body.planWarnings }).toEqual(created.body);
  });

  it('simulación inexistente → 404 con mensaje claro', async () => {
    const res = await ctx.api.get('/simulations/999').expect(404);
    expect(res.body.error).toEqual({ code: 'SIMULATION_NOT_FOUND', message: 'No existe la simulación indicada.' });
  });

  it('identificador no válido → 400', async () => {
    await ctx.api.get('/simulations/abc').expect(400);
  });
});
