import type { Plan, PricingTierRecord } from '@saasomatic/shared';
import type { Db } from '../db/connection';

interface PlanRow {
  code: string;
  name: string;
  storage_gb: number;
  api_calls: number;
}

interface TierRow {
  id: number;
  min_users: number;
  max_users: number | null;
  unit_cents: number;
}

const toPlan = (row: PlanRow): Plan => ({
  code: row.code,
  name: row.name,
  storageGb: row.storage_gb,
  apiCalls: row.api_calls,
});

const toTier = (row: TierRow): PricingTierRecord => ({
  id: row.id,
  minUsers: row.min_users,
  maxUsers: row.max_users,
  unitCents: row.unit_cents,
});

/** Planes y tramos de precio: datos de configuración de solo lectura para la API. */
export function createCatalogRepository(db: Db) {
  const allPlans = db.prepare<[], PlanRow>('SELECT * FROM plans ORDER BY storage_gb, code');
  const planByCode = db.prepare<[string], PlanRow>('SELECT * FROM plans WHERE code = ?');
  const allTiers = db.prepare<[], TierRow>('SELECT * FROM pricing_tiers ORDER BY min_users');

  return {
    findAllPlans: (): Plan[] => allPlans.all().map(toPlan),
    findPlanByCode: (code: string): Plan | undefined => {
      const row = planByCode.get(code);
      return row ? toPlan(row) : undefined;
    },
    findAllPricingTiers: (): PricingTierRecord[] => allTiers.all().map(toTier),
  };
}

export type CatalogRepository = ReturnType<typeof createCatalogRepository>;
