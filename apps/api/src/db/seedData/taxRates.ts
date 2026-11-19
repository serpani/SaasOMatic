/**
 * Seed inicial de IVA para poder arrancar sin red. Los países de la UE se actualizan después desde
 * VATcomply (fuente TEDB de la Comisión Europea). Tipos estándar vigentes en noviembre de 2026.
 * Reino Unido y EE. UU. se cargan a mano (decisiones 1 y 3 de incongruencias).
 */
export interface TaxRateSeed {
  countryCode: string;
  countryName: string;
  ratePercent: number;
  currency: string;
}

export const EU_TAX_RATES: readonly TaxRateSeed[] = [
  { countryCode: 'AT', countryName: 'Austria', ratePercent: 20, currency: 'EUR' },
  { countryCode: 'BE', countryName: 'Bélgica', ratePercent: 21, currency: 'EUR' },
  { countryCode: 'BG', countryName: 'Bulgaria', ratePercent: 20, currency: 'EUR' },
  { countryCode: 'CY', countryName: 'Chipre', ratePercent: 19, currency: 'EUR' },
  { countryCode: 'CZ', countryName: 'Chequia', ratePercent: 21, currency: 'CZK' },
  { countryCode: 'DE', countryName: 'Alemania', ratePercent: 19, currency: 'EUR' },
  { countryCode: 'DK', countryName: 'Dinamarca', ratePercent: 25, currency: 'DKK' },
  { countryCode: 'EE', countryName: 'Estonia', ratePercent: 24, currency: 'EUR' },
  { countryCode: 'ES', countryName: 'España', ratePercent: 21, currency: 'EUR' },
  { countryCode: 'FI', countryName: 'Finlandia', ratePercent: 25.5, currency: 'EUR' },
  { countryCode: 'FR', countryName: 'Francia', ratePercent: 20, currency: 'EUR' },
  { countryCode: 'GR', countryName: 'Grecia', ratePercent: 24, currency: 'EUR' },
  { countryCode: 'HR', countryName: 'Croacia', ratePercent: 25, currency: 'EUR' },
  { countryCode: 'HU', countryName: 'Hungría', ratePercent: 27, currency: 'HUF' },
  { countryCode: 'IE', countryName: 'Irlanda', ratePercent: 23, currency: 'EUR' },
  { countryCode: 'IT', countryName: 'Italia', ratePercent: 22, currency: 'EUR' },
  { countryCode: 'LT', countryName: 'Lituania', ratePercent: 21, currency: 'EUR' },
  { countryCode: 'LU', countryName: 'Luxemburgo', ratePercent: 17, currency: 'EUR' },
  { countryCode: 'LV', countryName: 'Letonia', ratePercent: 21, currency: 'EUR' },
  { countryCode: 'MT', countryName: 'Malta', ratePercent: 18, currency: 'EUR' },
  { countryCode: 'NL', countryName: 'Países Bajos', ratePercent: 21, currency: 'EUR' },
  { countryCode: 'PL', countryName: 'Polonia', ratePercent: 23, currency: 'PLN' },
  { countryCode: 'PT', countryName: 'Portugal', ratePercent: 23, currency: 'EUR' },
  { countryCode: 'RO', countryName: 'Rumanía', ratePercent: 21, currency: 'RON' },
  { countryCode: 'SE', countryName: 'Suecia', ratePercent: 25, currency: 'SEK' },
  { countryCode: 'SI', countryName: 'Eslovenia', ratePercent: 22, currency: 'EUR' },
  { countryCode: 'SK', countryName: 'Eslovaquia', ratePercent: 23, currency: 'EUR' },
];

export const MANUAL_TAX_RATES: readonly TaxRateSeed[] = [
  { countryCode: 'GB', countryName: 'Reino Unido', ratePercent: 20, currency: 'GBP' },
  // Provisional: EE. UU. no tiene IVA federal; el sales tax por estado queda fuera del alcance.
  { countryCode: 'US', countryName: 'Estados Unidos', ratePercent: 0, currency: 'USD' },
];

export const EU_COUNTRY_CODES: ReadonlySet<string> = new Set(EU_TAX_RATES.map((r) => r.countryCode));
