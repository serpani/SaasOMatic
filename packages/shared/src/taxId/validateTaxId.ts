import type { TaxIdErrorCode, TaxIdType, TaxIdValidation } from '../types';
import { normalizeTaxId } from './normalize';
import { CIF_PATTERN, hasValidCifControl } from './spanishCif';
import {
  DNI_PATTERN,
  hasValidDniControl,
  hasValidKlmControl,
  hasValidNieControl,
  NIE_PATTERN,
  NIF_KLM_PATTERN,
} from './spanishPersonalId';

/** Formato básico para países distintos de España (decisión 6 de incongruencias). */
const GENERIC_PATTERN = /^[A-Z0-9]{5,20}$/;

const MESSAGES: Readonly<Record<TaxIdErrorCode, string>> = {
  TAX_ID_REQUIRED: 'Introduce el identificador fiscal.',
  TAX_ID_INVALID_FORMAT:
    'El identificador fiscal no tiene un formato válido. En España debe ser un NIF (DNI, NIE, K, L o M) o un CIF.',
  TAX_ID_INVALID_CONTROL:
    'El identificador fiscal no es válido. Revisa los números y la letra o dígito de control.',
};

const GENERIC_FORMAT_MESSAGE =
  'El identificador fiscal debe tener entre 5 y 20 letras o números, sin otros símbolos.';

function fail(normalized: string, code: TaxIdErrorCode, message = MESSAGES[code]): TaxIdValidation {
  return { valid: false, normalized, code, message };
}

function ok(normalized: string, type: TaxIdType): TaxIdValidation {
  return { valid: true, normalized, type };
}

function validateSpanish(id: string): TaxIdValidation {
  if (DNI_PATTERN.test(id)) {
    return hasValidDniControl(id) ? ok(id, 'DNI') : fail(id, 'TAX_ID_INVALID_CONTROL');
  }
  if (NIE_PATTERN.test(id)) {
    return hasValidNieControl(id) ? ok(id, 'NIE') : fail(id, 'TAX_ID_INVALID_CONTROL');
  }
  if (NIF_KLM_PATTERN.test(id)) {
    return hasValidKlmControl(id) ? ok(id, 'NIF_KLM') : fail(id, 'TAX_ID_INVALID_CONTROL');
  }
  if (CIF_PATTERN.test(id)) {
    return hasValidCifControl(id) ? ok(id, 'CIF') : fail(id, 'TAX_ID_INVALID_CONTROL');
  }
  return fail(id, 'TAX_ID_INVALID_FORMAT');
}

/**
 * Valida un identificador fiscal según el país del cliente.
 * España (ES): DNI, NIE, NIF K/L/M o CIF con algoritmo oficial. Resto: formato alfanumérico de 5 a 20 caracteres.
 */
export function validateTaxId(raw: string, countryCode: string): TaxIdValidation {
  const normalized = normalizeTaxId(raw);
  if (normalized === '') return fail(normalized, 'TAX_ID_REQUIRED');
  if (countryCode.toUpperCase() === 'ES') return validateSpanish(normalized);
  return GENERIC_PATTERN.test(normalized)
    ? ok(normalized, 'OTHER')
    : fail(normalized, 'TAX_ID_INVALID_FORMAT', GENERIC_FORMAT_MESSAGE);
}
