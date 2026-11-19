import { describe, expect, it } from 'vitest';
import { normalizeTaxId } from './normalize';
import { validateTaxId } from './validateTaxId';

const isValidEs = (id: string) => validateTaxId(id, 'ES').valid;

describe('validateTaxId — DNI (plan de pruebas A.3)', () => {
  it('acepta 12345678Z', () => {
    expect(validateTaxId('12345678Z', 'ES')).toEqual({ valid: true, normalized: '12345678Z', type: 'DNI' });
  });

  it('rechaza 12345678A por letra de control', () => {
    expect(validateTaxId('12345678A', 'ES')).toMatchObject({ valid: false, code: 'TAX_ID_INVALID_CONTROL' });
  });

  it('acepta DNI con ceros a la izquierda', () => {
    expect(isValidEs('00000000T')).toBe(true);
  });

  it.each(['1234567Z', '123456789Z', '12345678', 'ABCDEFGHZ'])('rechaza el formato %s', (id) => {
    expect(validateTaxId(id, 'ES')).toMatchObject({ valid: false, code: 'TAX_ID_INVALID_FORMAT' });
  });
});

describe('validateTaxId — NIE', () => {
  it.each(['X1234567L', 'Y1234567X', 'Z1234567R'])('acepta %s', (id) => {
    expect(validateTaxId(id, 'ES')).toMatchObject({ valid: true, type: 'NIE' });
  });

  it.each(['X1234567A', 'Y1234567L', 'Z1234567X'])('rechaza %s por letra de control', (id) => {
    expect(validateTaxId(id, 'ES')).toMatchObject({ valid: false, code: 'TAX_ID_INVALID_CONTROL' });
  });

  it('rechaza un NIE con prefijo no admitido', () => {
    expect(validateTaxId('W1234567L', 'ES')).toMatchObject({ valid: false });
  });
});

describe('validateTaxId — NIF K, L y M', () => {
  it.each(['K1234567L', 'L1234567L', 'M1234567L', 'K0000001R'])('acepta %s', (id) => {
    expect(validateTaxId(id, 'ES')).toMatchObject({ valid: true, type: 'NIF_KLM' });
  });

  it.each(['K1234567A', 'L1234567Z', 'M1234567T'])('rechaza %s por letra de control', (id) => {
    expect(validateTaxId(id, 'ES')).toMatchObject({ valid: false, code: 'TAX_ID_INVALID_CONTROL' });
  });

  it.each(['K123456L', 'L12345678L', 'M12345674'])('rechaza el formato %s', (id) => {
    expect(validateTaxId(id, 'ES')).toMatchObject({ valid: false, code: 'TAX_ID_INVALID_FORMAT' });
  });

  it('se normaliza igual que el resto (k-1234567-l)', () => {
    expect(validateTaxId('k-1234567-l', 'ES')).toMatchObject({ valid: true, normalized: 'K1234567L' });
  });
});

describe('validateTaxId — CIF', () => {
  it('acepta B12345674', () => {
    expect(validateTaxId('B12345674', 'ES')).toEqual({ valid: true, normalized: 'B12345674', type: 'CIF' });
  });

  it('rechaza B12345670 por dígito de control', () => {
    expect(validateTaxId('B12345670', 'ES')).toMatchObject({ valid: false, code: 'TAX_ID_INVALID_CONTROL' });
  });

  it('acepta un CIF real de una sociedad anónima (A58818501)', () => {
    expect(isValidEs('A58818501')).toBe(true);
  });

  it('las organizaciones A, B, E y H exigen dígito de control', () => {
    expect(isValidEs('A12345674')).toBe(true);
    expect(isValidEs('A1234567D')).toBe(false);
  });

  it('las organizaciones P, Q, R, S, N y W exigen letra de control', () => {
    expect(isValidEs('P1234567D')).toBe(true);
    expect(isValidEs('P12345674')).toBe(false);
  });

  it('el resto de organizaciones admite dígito o letra', () => {
    expect(isValidEs('C12345674')).toBe(true);
    expect(isValidEs('C1234567D')).toBe(true);
    expect(isValidEs('C1234567E')).toBe(false);
  });

  it('rechaza letras de organización no válidas', () => {
    expect(validateTaxId('I12345674', 'ES')).toMatchObject({ valid: false, code: 'TAX_ID_INVALID_FORMAT' });
  });
});

describe('validateTaxId — normalización', () => {
  it('pasa a mayúsculas y elimina espacios y guiones', () => {
    expect(normalizeTaxId(' 12345678-z ')).toBe('12345678Z');
    expect(normalizeTaxId('b-1234 5674')).toBe('B12345674');
  });

  it.each(['12345678z', ' 12345678 Z ', '12345678-Z', 'x-1234567-l', 'b 1234567 4'])(
    'valida %s tras normalizar',
    (id) => {
      expect(isValidEs(id)).toBe(true);
    },
  );

  it('devuelve el valor normalizado para guardarlo', () => {
    expect(validateTaxId('b-12345674', 'ES').normalized).toBe('B12345674');
  });

  it('acepta el código de país en minúsculas', () => {
    expect(validateTaxId('12345678A', 'es').valid).toBe(false);
  });

  it.each(['', '   ', ' - '])('exige un valor (%j)', (id) => {
    expect(validateTaxId(id, 'ES')).toMatchObject({ valid: false, code: 'TAX_ID_REQUIRED' });
  });
});

describe('validateTaxId — otros países: solo formato básico', () => {
  it.each([
    ['FR', 'FR12345678901'],
    ['DE', 'DE123456789'],
    ['US', '12-3456789'],
    ['PT', '12345678A'],
  ])('%s acepta %s', (country, id) => {
    expect(validateTaxId(id, country)).toMatchObject({ valid: true, type: 'OTHER' });
  });

  it('no aplica el algoritmo español fuera de España', () => {
    expect(validateTaxId('12345678A', 'FR').valid).toBe(true);
  });

  it.each(['1234', 'A'.repeat(21), 'FR123.456', 'DE_123456'])('rechaza %s', (id) => {
    expect(validateTaxId(id, 'FR')).toMatchObject({ valid: false, code: 'TAX_ID_INVALID_FORMAT' });
  });

  it('todos los errores incluyen un mensaje en español', () => {
    const result = validateTaxId('1234', 'FR');
    expect(result.valid === false && result.message.length > 0).toBe(true);
  });
});
