import type { TaxRate, TaxRateSource } from '@saasomatic/shared';
import type { Db } from '../db/connection';

interface TaxRateRow {
  country_code: string;
  country_name: string;
  rate_type: string;
  rate_percent: number;
  currency: string;
  source: TaxRateSource;
  updated_at: string;
}

export interface TaxRateUpdate {
  countryCode: string;
  ratePercent: number;
  currency: string;
  source: TaxRateSource;
  updatedAt: string;
}

const toTaxRate = (row: TaxRateRow): TaxRate => ({
  countryCode: row.country_code,
  countryName: row.country_name,
  rateType: row.rate_type,
  ratePercent: row.rate_percent,
  currency: row.currency,
  source: row.source,
  updatedAt: row.updated_at,
});

export function createTaxRatesRepository(db: Db) {
  const all = db.prepare<[], TaxRateRow>('SELECT * FROM tax_rates ORDER BY country_name');
  const byCountry = db.prepare<[string], TaxRateRow>('SELECT * FROM tax_rates WHERE country_code = ?');
  const update = db.prepare<[number, string, TaxRateSource, string, string]>(
    `UPDATE tax_rates SET rate_type = 'standard', rate_percent = ?, currency = ?, source = ?, updated_at = ?
     WHERE country_code = ?`,
  );

  return {
    findAll: (): TaxRate[] => all.all().map(toTaxRate),
    findByCountry: (countryCode: string): TaxRate | undefined => {
      const row = byCountry.get(countryCode);
      return row ? toTaxRate(row) : undefined;
    },
    /** Actualiza varios países en una sola transacción. Devuelve cuántos se han actualizado. */
    updateMany: db.transaction((updates: readonly TaxRateUpdate[]): number => {
      let changed = 0;
      for (const u of updates) {
        changed += update.run(u.ratePercent, u.currency, u.source, u.updatedAt, u.countryCode).changes;
      }
      return changed;
    }),
  };
}

export type TaxRatesRepository = ReturnType<typeof createTaxRatesRepository>;
