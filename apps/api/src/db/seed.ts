import { DEFAULT_PRICING_TIERS } from '@saasomatic/shared';
import type { Db } from './connection';
import { DEFAULT_PLANS } from './seedData/plans';
import { EU_TAX_RATES, MANUAL_TAX_RATES } from './seedData/taxRates';

/**
 * Datos iniciales idempotentes: nunca sobrescribe lo que ya existe (p. ej. IVA ya sincronizado
 * o tramos modificados), así que puede ejecutarse en cada arranque.
 */
export function seed(db: Db, now: Date = new Date()): void {
  const insertPlan = db.prepare(
    'INSERT OR IGNORE INTO plans (code, name, storage_gb, api_calls) VALUES (?, ?, ?, ?)',
  );
  const insertTaxRate = db.prepare(
    `INSERT OR IGNORE INTO tax_rates
       (country_code, country_name, rate_type, rate_percent, currency, source, updated_at)
     VALUES (?, ?, 'standard', ?, ?, 'manual', ?)`,
  );
  const countTiers = db.prepare('SELECT COUNT(*) AS total FROM pricing_tiers').pluck();
  const insertTier = db.prepare('INSERT INTO pricing_tiers (min_users, max_users, unit_cents) VALUES (?, ?, ?)');

  const run = db.transaction(() => {
    for (const plan of DEFAULT_PLANS) insertPlan.run(plan.code, plan.name, plan.storageGb, plan.apiCalls);
    for (const rate of [...EU_TAX_RATES, ...MANUAL_TAX_RATES]) {
      insertTaxRate.run(rate.countryCode, rate.countryName, rate.ratePercent, rate.currency, now.toISOString());
    }
    if (Number(countTiers.get()) === 0) {
      for (const tier of DEFAULT_PRICING_TIERS) insertTier.run(tier.minUsers, tier.maxUsers, tier.unitCents);
    }
  });
  run();
}
