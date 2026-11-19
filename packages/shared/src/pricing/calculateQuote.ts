import type { PricingTier, Quote } from '../types';
import { calculateBaseCost } from './calculateBaseCost';
import { calculateTaxCents } from './calculateTax';

/** Factura mensual completa: coste base por tramos + IVA del país. Usada por API y frontend. */
export function calculateQuote(
  activeUsers: number,
  tiers: readonly PricingTier[],
  taxPercent: number,
): Quote {
  const { baseCents, tierBreakdown } = calculateBaseCost(activeUsers, tiers);
  const taxCents = calculateTaxCents(baseCents, taxPercent);
  return { baseCents, tierBreakdown, taxPercent, taxCents, totalCents: baseCents + taxCents };
}
