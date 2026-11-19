import { describe, expect, it } from 'vitest';
import { DEFAULT_PRICING_TIERS } from './defaultTiers';
import { validateTiers } from './validateTiers';

describe('validateTiers', () => {
  it('acepta los tramos por defecto', () => {
    expect(validateTiers(DEFAULT_PRICING_TIERS)).toEqual([]);
  });

  it('acepta un único tramo sin tope', () => {
    expect(validateTiers([{ minUsers: 1, maxUsers: null, unitCents: 900 }])).toEqual([]);
  });

  it('rechaza una lista vacía', () => {
    expect(validateTiers([])).toHaveLength(1);
  });

  it('rechaza tramos que no empiezan en 1', () => {
    expect(validateTiers([{ minUsers: 2, maxUsers: null, unitCents: 500 }])).toHaveLength(1);
  });

  it('rechaza huecos entre tramos', () => {
    const tiers = [
      { minUsers: 1, maxUsers: 10, unitCents: 1_000 },
      { minUsers: 12, maxUsers: null, unitCents: 500 },
    ];
    expect(validateTiers(tiers)).toHaveLength(1);
  });

  it('rechaza solapes', () => {
    const tiers = [
      { minUsers: 1, maxUsers: 10, unitCents: 1_000 },
      { minUsers: 10, maxUsers: null, unitCents: 500 },
    ];
    expect(validateTiers(tiers)).toHaveLength(1);
  });

  it('rechaza que el último tramo tenga tope', () => {
    expect(validateTiers([{ minUsers: 1, maxUsers: 10, unitCents: 1_000 }])).toHaveLength(1);
  });

  it('rechaza más de un tramo sin tope', () => {
    const tiers = [
      { minUsers: 1, maxUsers: null, unitCents: 1_000 },
      { minUsers: 2, maxUsers: null, unitCents: 500 },
    ];
    expect(validateTiers(tiers).length).toBeGreaterThan(0);
  });

  it('rechaza precios no enteros o no positivos', () => {
    expect(validateTiers([{ minUsers: 1, maxUsers: null, unitCents: 0 }])).toHaveLength(1);
    expect(validateTiers([{ minUsers: 1, maxUsers: null, unitCents: 9.5 }])).toHaveLength(1);
  });

  it('rechaza un máximo menor que el mínimo', () => {
    const tiers = [
      { minUsers: 1, maxUsers: 0, unitCents: 1_000 },
      { minUsers: 1, maxUsers: null, unitCents: 500 },
    ];
    expect(validateTiers(tiers).length).toBeGreaterThan(0);
  });
});
