/** Formatea un entero con separador de miles español (10000 → "10.000"), igual en Node y navegador. */
export function formatInteger(value: number): string {
  return String(Math.trunc(value)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
