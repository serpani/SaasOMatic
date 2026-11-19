import { describe, expect, it } from 'vitest';
import { describeTaxId } from './customerValidation';

describe('describeTaxId — confirmación del identificador fiscal', () => {
  it.each([
    ['12345678Z', 'DNI válido'],
    ['X1234567L', 'NIE válido'],
    ['K1234567L', 'NIF (tipo K, L o M) válido'],
    ['B12345674', 'CIF válido'],
  ])('España: %s → %s', (taxId, expected) => {
    expect(describeTaxId(taxId, 'ES')).toEqual({ tone: 'success', message: expect.stringContaining(expected) });
  });

  it('indica cómo se guardará (normalizado)', () => {
    expect(describeTaxId(' b-1234567 4 ', 'ES')?.message).toContain('Se guardará como B12345674.');
  });

  it('fuera de España deja claro que solo se comprueba el formato', () => {
    expect(describeTaxId('fr12345678901', 'FR')?.message).toMatch(/solo se comprueba el formato.*FR12345678901/);
  });

  it('sin país pide seleccionarlo para poder comprobarlo', () => {
    expect(describeTaxId('12345678Z', '')).toEqual({ tone: 'info', message: expect.stringContaining('Selecciona el país') });
  });

  it('vacío o no válido → sin confirmación (el error se muestra aparte)', () => {
    expect(describeTaxId('', 'ES')).toBeNull();
    expect(describeTaxId('12345678A', 'ES')).toBeNull();
  });
});
