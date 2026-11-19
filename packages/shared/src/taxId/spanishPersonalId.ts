/**
 * NIF de personas físicas (algoritmo oficial del Ministerio del Interior / AEAT).
 * Letra de control = TABLA[número mod 23].
 * - DNI: 8 dígitos + letra.
 * - NIE: X/Y/Z + 7 dígitos + letra; X/Y/Z se sustituye por 0/1/2.
 * - NIF K, L y M: letra + 7 dígitos + letra, calculada solo sobre los 7 dígitos.
 *   K: españoles menores de 14 años · L: españoles residentes en el extranjero sin DNI ·
 *   M: extranjeros sin NIE (Orden EHA/451/2008).
 */
const CONTROL_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';
const NIE_PREFIX: Readonly<Record<string, string>> = { X: '0', Y: '1', Z: '2' };

export const DNI_PATTERN = /^\d{8}[A-Z]$/;
export const NIE_PATTERN = /^[XYZ]\d{7}[A-Z]$/;
export const NIF_KLM_PATTERN = /^[KLM]\d{7}[A-Z]$/;

function controlLetter(digits: string): string {
  return CONTROL_LETTERS.charAt(Number(digits) % 23);
}

/** Recibe un DNI ya normalizado con formato válido y comprueba su letra de control. */
export function hasValidDniControl(dni: string): boolean {
  return controlLetter(dni.slice(0, 8)) === dni.charAt(8);
}

/** Recibe un NIE ya normalizado con formato válido y comprueba su letra de control. */
export function hasValidNieControl(nie: string): boolean {
  const prefix = NIE_PREFIX[nie.charAt(0)] ?? '';
  return controlLetter(prefix + nie.slice(1, 8)) === nie.charAt(8);
}

/** Recibe un NIF K, L o M ya normalizado con formato válido y comprueba su letra de control. */
export function hasValidKlmControl(nif: string): boolean {
  return controlLetter(nif.slice(1, 8)) === nif.charAt(8);
}
