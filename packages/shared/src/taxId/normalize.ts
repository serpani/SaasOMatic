/** Normaliza un identificador fiscal: mayúsculas, sin espacios ni guiones. */
export function normalizeTaxId(raw: string): string {
  return raw.toUpperCase().replace(/[\s-]/g, '');
}
