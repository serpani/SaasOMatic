/**
 * DNI y NIE españoles (algoritmo oficial del Ministerio del Interior).
 * Letra de control = TABLA[número mod 23]. En el NIE la letra inicial X/Y/Z se sustituye por 0/1/2.
 */
const CONTROL_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';
const NIE_PREFIX: Readonly<Record<string, string>> = { X: '0', Y: '1', Z: '2' };

export const DNI_PATTERN = /^\d{8}[A-Z]$/;
export const NIE_PATTERN = /^[XYZ]\d{7}[A-Z]$/;

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
