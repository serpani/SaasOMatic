/**
 * CIF español (algoritmo oficial de la AEAT): letra de organización + 7 dígitos + control.
 * - Dígitos en posición par (2.ª, 4.ª, 6.ª) se suman tal cual.
 * - Dígitos en posición impar (1.ª, 3.ª, 5.ª, 7.ª) se multiplican por 2 y se suman sus cifras.
 * - Dígito de control = (10 − suma mod 10) mod 10; letra de control = 'JABCDEFGHI'[dígito].
 * - P, Q, R, S, N, W exigen letra; A, B, E, H exigen dígito; el resto admite ambos.
 */
export const CIF_PATTERN = /^[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J]$/;

const CONTROL_LETTERS = 'JABCDEFGHI';
const LETTER_CONTROL_ORGS = 'PQRSNW';
const DIGIT_CONTROL_ORGS = 'ABEH';

function controlDigit(digits: string): number {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    const digit = Number(digits.charAt(i));
    if (i % 2 === 0) {
      const doubled = digit * 2;
      sum += Math.floor(doubled / 10) + (doubled % 10);
    } else {
      sum += digit;
    }
  }
  return (10 - (sum % 10)) % 10;
}

/** Recibe un CIF ya normalizado con formato válido y comprueba su carácter de control. */
export function hasValidCifControl(cif: string): boolean {
  const org = cif.charAt(0);
  const control = cif.charAt(8);
  const digit = controlDigit(cif.slice(1, 8));
  const expectedDigit = String(digit);
  const expectedLetter = CONTROL_LETTERS.charAt(digit);

  if (LETTER_CONTROL_ORGS.includes(org)) return control === expectedLetter;
  if (DIGIT_CONTROL_ORGS.includes(org)) return control === expectedDigit;
  return control === expectedDigit || control === expectedLetter;
}
