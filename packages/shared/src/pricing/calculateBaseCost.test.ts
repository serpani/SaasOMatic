import { describe, expect, it } from 'vitest';
import { calculateBaseCost } from './calculateBaseCost';
import { DEFAULT_PRICING_TIERS } from './defaultTiers';

const tiers = DEFAULT_PRICING_TIERS;

describe('calculateBaseCost — plan de pruebas A.1', () => {
  it.each([
    [1, 1_000],
    [10, 10_000],
    [11, 10_800],
    [15, 14_000],
    [50, 42_000],
    [51, 42_500],
    [100, 67_000],
  ])('%i usuarios → %i céntimos', (users, expectedCents) => {
    expect(calculateBaseCost(users, tiers).baseCents).toBe(expectedCents);
  });

  it.each([0, 10_001, 1.5, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    'rechaza %s usuarios',
    (users) => {
      expect(() => calculateBaseCost(users, tiers)).toThrow(RangeError);
    },
  );

  it('acepta el máximo de 10.000 usuarios', () => {
    // 10×10 € + 40×8 € + 9.950×5 € = 100 + 320 + 49.750 = 50.170 €
    expect(calculateBaseCost(10_000, tiers).baseCents).toBe(5_017_000);
  });
});

describe('calculateBaseCost — desglose por tramos', () => {
  it('15 usuarios: ejemplo del RN', () => {
    expect(calculateBaseCost(15, tiers).tierBreakdown).toEqual([
      { minUsers: 1, maxUsers: 10, users: 10, unitCents: 1_000, subtotalCents: 10_000 },
      { minUsers: 11, maxUsers: 50, users: 5, unitCents: 800, subtotalCents: 4_000 },
    ]);
  });

  it('solo incluye los tramos con usuarios', () => {
    expect(calculateBaseCost(7, tiers).tierBreakdown).toHaveLength(1);
    expect(calculateBaseCost(51, tiers).tierBreakdown).toHaveLength(3);
  });

  it('la suma de subtotales coincide con el coste base y con los usuarios', () => {
    const result = calculateBaseCost(137, tiers);
    const users = result.tierBreakdown.reduce((sum, item) => sum + item.users, 0);
    const cents = result.tierBreakdown.reduce((sum, item) => sum + item.subtotalCents, 0);
    expect(users).toBe(137);
    expect(cents).toBe(result.baseCents);
  });

  it('no depende del orden en que lleguen los tramos', () => {
    const shuffled = [...tiers].reverse();
    expect(calculateBaseCost(60, shuffled)).toEqual(calculateBaseCost(60, tiers));
  });

  it('usa los tramos recibidos (parametrizables), no valores fijos', () => {
    const custom = [
      { minUsers: 1, maxUsers: 5, unitCents: 2_000 },
      { minUsers: 6, maxUsers: null, unitCents: 100 },
    ];
    expect(calculateBaseCost(8, custom).baseCents).toBe(5 * 2_000 + 3 * 100);
  });
});
