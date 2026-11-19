const dateFormatter = new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' });

/** Importe ya convertido (en unidades de la divisa) con símbolo, p. ej. "169,40 €". */
export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(amount);
}

export const formatDateTime = (iso: string | number | Date): string => dateFormatter.format(new Date(iso));

// Enteros: usar `formatInteger` de @saasomatic/shared (mismo formato que los avisos del backend).
export const formatPercent = (value: number): string => `${String(value).replace('.', ',')} %`;
