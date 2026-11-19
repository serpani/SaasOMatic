/**
 * IVA en céntimos, redondeado al céntimo (Math.round).
 * El porcentaje se pasa a centésimas de punto (21 → 2100, 25.5 → 2550) para operar con enteros
 * y evitar errores de coma flotante con tipos decimales.
 */
export function calculateTaxCents(baseCents: number, taxPercent: number): number {
  if (!Number.isInteger(baseCents) || baseCents < 0) {
    throw new RangeError('El coste base debe ser un entero de céntimos no negativo.');
  }
  if (!Number.isFinite(taxPercent) || taxPercent < 0 || taxPercent > 100) {
    throw new RangeError('El porcentaje de IVA debe estar entre 0 y 100.');
  }
  const basisPoints = Math.round(taxPercent * 100);
  return Math.round((baseCents * basisPoints) / 10_000);
}
