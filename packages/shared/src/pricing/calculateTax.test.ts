import { describe, expect, it } from 'vitest';
import { calculateQuote } from './calculateQuote';
import { calculateTaxCents } from './calculateTax';
import { DEFAULT_PRICING_TIERS } from './defaultTiers';

describe('IVA y redondeo — plan de pruebas A.2', () => {
  it('España 21 % sobre 140 € → 29,40 € de IVA y 169,40 € de total', () => {
    const quote = calculateQuote(15, DEFAULT_PRICING_TIERS, 21);
    expect(quote.baseCents).toBe(14_000);
    expect(quote.taxCents).toBe(2_940);
    expect(quote.totalCents).toBe(16_940);
    expect(quote.taxPercent).toBe(21);
  });

  it('redondea al céntimo más cercano', () => {
    expect(calculateTaxCents(999, 21)).toBe(210); // 209,79 → 210
    expect(calculateTaxCents(1_001, 21)).toBe(210); // 210,21 → 210
  });

  it('redondea hacia arriba en el medio céntimo', () => {
    expect(calculateTaxCents(250, 21)).toBe(53); // 52,5 → 53
  });

  it('opera sin errores de coma flotante con tipos decimales', () => {
    expect(calculateTaxCents(10_000, 8.1)).toBe(810);
    expect(calculateTaxCents(10_800, 25.5)).toBe(2_754);
    expect(calculateTaxCents(100, 5.5)).toBe(6); // 5,5 → 6
  });

  it('EE. UU. 0 % → sin IVA', () => {
    const quote = calculateQuote(15, DEFAULT_PRICING_TIERS, 0);
    expect(quote.taxCents).toBe(0);
    expect(quote.totalCents).toBe(14_000);
  });

  it.each([
    [-1, 21],
    [1.5, 21],
    [100, -1],
    [100, 101],
    [100, Number.NaN],
  ])('rechaza entradas no válidas (base %s, IVA %s)', (base, percent) => {
    expect(() => calculateTaxCents(base, percent)).toThrow(RangeError);
  });
});
