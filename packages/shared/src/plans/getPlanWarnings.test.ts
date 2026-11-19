import { describe, expect, it } from 'vitest';
import type { Plan } from '../types';
import { formatInteger } from './formatNumber';
import { getPlanWarnings } from './getPlanWarnings';

const basic: Plan = { code: 'basic', name: 'Basic', storageGb: 50, apiCalls: 10_000 };

describe('getPlanWarnings', () => {
  it('sin avisos si el uso está dentro del plan', () => {
    expect(getPlanWarnings({ storageGb: 10, apiCalls: 500 }, basic)).toEqual([]);
  });

  it('sin avisos justo en el límite del plan', () => {
    expect(getPlanWarnings({ storageGb: 50, apiCalls: 10_000 }, basic)).toEqual([]);
  });

  it('avisa si el almacenamiento supera el plan', () => {
    expect(getPlanWarnings({ storageGb: 51, apiCalls: 0 }, basic)).toEqual([
      'El almacenamiento estimado (51 GB) supera los 50 GB incluidos en el plan Basic.',
    ]);
  });

  it('avisa si las llamadas a la API superan el plan', () => {
    expect(getPlanWarnings({ storageGb: 0, apiCalls: 25_000 }, basic)).toEqual([
      'Las llamadas a la API estimadas (25.000) superan las 10.000 incluidas en el plan Basic.',
    ]);
  });

  it('devuelve los dos avisos si se superan ambos límites', () => {
    expect(getPlanWarnings({ storageGb: 1_000, apiCalls: 1_000_000 }, basic)).toHaveLength(2);
  });
});

describe('formatInteger', () => {
  it.each([
    [0, '0'],
    [999, '999'],
    [1_000, '1.000'],
    [10_000, '10.000'],
    [1_000_000, '1.000.000'],
  ])('%i → %s', (value, expected) => {
    expect(formatInteger(value)).toBe(expected);
  });
});
