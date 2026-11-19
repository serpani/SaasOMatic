import type { PricingTier } from '../types';

/** Tramos iniciales del RN. Solo se usan para sembrar la BD; en ejecución se leen de `pricing_tiers`. */
export const DEFAULT_PRICING_TIERS: readonly PricingTier[] = [
  { minUsers: 1, maxUsers: 10, unitCents: 1000 },
  { minUsers: 11, maxUsers: 50, unitCents: 800 },
  { minUsers: 51, maxUsers: null, unitCents: 500 },
];
