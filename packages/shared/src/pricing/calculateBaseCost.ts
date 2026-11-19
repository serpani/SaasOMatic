import type { BaseCostResult, PricingTier, TierBreakdownItem } from '../types';
import { isValidActiveUsers, MAX_ACTIVE_USERS, MIN_ACTIVE_USERS } from './constants';

/**
 * Tarificación acumulativa por tramos: cada usuario se cobra al precio del tramo en el que cae.
 * Ej.: 15 usuarios con tramos (1-10: 10 €, 11-50: 8 €) = 10 × 10 € + 5 × 8 € = 140 €.
 * Los tramos deben haber pasado `validateTiers`.
 */
export function calculateBaseCost(activeUsers: number, tiers: readonly PricingTier[]): BaseCostResult {
  if (!isValidActiveUsers(activeUsers)) {
    throw new RangeError(
      `El número de usuarios debe ser un entero entre ${MIN_ACTIVE_USERS} y ${MAX_ACTIVE_USERS}.`,
    );
  }

  const sorted = [...tiers].sort((a, b) => a.minUsers - b.minUsers);
  const tierBreakdown: TierBreakdownItem[] = [];

  for (const tier of sorted) {
    if (activeUsers < tier.minUsers) break;
    const upper = tier.maxUsers === null ? activeUsers : Math.min(activeUsers, tier.maxUsers);
    const users = upper - tier.minUsers + 1;
    tierBreakdown.push({
      minUsers: tier.minUsers,
      maxUsers: tier.maxUsers,
      users,
      unitCents: tier.unitCents,
      subtotalCents: users * tier.unitCents,
    });
  }

  const baseCents = tierBreakdown.reduce((sum, item) => sum + item.subtotalCents, 0);
  return { baseCents, tierBreakdown };
}
