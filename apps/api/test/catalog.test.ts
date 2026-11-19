import { describe, expect, it } from 'vitest';
import { createTestContext } from './helpers';

describe('GET /plans, /tax-rates, /pricing-tiers', () => {
  it('devuelve los planes con sus límites', async () => {
    const res = await createTestContext().api.get('/plans').expect(200);
    expect(res.body).toEqual([
      { code: 'basic', name: 'Basic', storageGb: 50, apiCalls: 10_000 },
      { code: 'pro', name: 'Pro', storageGb: 200, apiCalls: 100_000 },
      { code: 'enterprise', name: 'Enterprise', storageGb: 1_000, apiCalls: 1_000_000 },
    ]);
  });

  it('B.4 solo hay países de la UE, Reino Unido y EE. UU. (29), ordenados por nombre', async () => {
    const res = await createTestContext().api.get('/tax-rates').expect(200);
    const codes: string[] = res.body.map((r: { countryCode: string }) => r.countryCode);
    expect(codes).toHaveLength(29);
    expect(codes).toEqual(expect.arrayContaining(['ES', 'GR', 'GB', 'US']));
    expect(codes).not.toContain('JP');
    expect(codes).not.toContain('EL');
    expect(res.body[0].countryName).toBe('Alemania');
  });

  it('cada tipo de IVA incluye todos los campos del contrato', async () => {
    const res = await createTestContext().api.get('/tax-rates').expect(200);
    const spain = res.body.find((r: { countryCode: string }) => r.countryCode === 'ES');
    expect(spain).toEqual({
      countryCode: 'ES',
      countryName: 'España',
      rateType: 'standard',
      ratePercent: 21,
      currency: 'EUR',
      source: 'manual',
      updatedAt: expect.any(String),
    });
  });

  it('devuelve los tramos de precio ordenados', async () => {
    const res = await createTestContext().api.get('/pricing-tiers').expect(200);
    expect(res.body).toEqual([
      { id: 1, minUsers: 1, maxUsers: 10, unitCents: 1_000 },
      { id: 2, minUsers: 11, maxUsers: 50, unitCents: 800 },
      { id: 3, minUsers: 51, maxUsers: null, unitCents: 500 },
    ]);
  });
});

describe('validación de tramos al arrancar', () => {
  it('acepta los tramos iniciales', () => {
    expect(() => createTestContext().container.catalogService.assertPricingTiersAreValid()).not.toThrow();
  });

  it('impide arrancar con tramos con hueco o sin tramo final sin tope', () => {
    const ctx = createTestContext();
    ctx.db.prepare('UPDATE pricing_tiers SET min_users = 12 WHERE min_users = 11').run();
    ctx.db.prepare('UPDATE pricing_tiers SET max_users = 100 WHERE min_users = 51').run();
    expect(() => ctx.container.catalogService.assertPricingTiersAreValid()).toThrow(
      /Tramo 2: debería empezar en 11[\s\S]*último tramo no debe tener tope/,
    );
  });
});
