import type { Plan, PricingTierRecord, TaxRate } from '@saasomatic/shared';
import { apiRequest } from '../http/apiClient';

export interface Catalog {
  plans: Plan[];
  taxRates: TaxRate[];
  pricingTiers: PricingTierRecord[];
}

/** Datos de configuración que usan varias vistas: planes, IVA por país y tramos de precio. */
export async function fetchCatalog(signal: AbortSignal): Promise<Catalog> {
  const [plans, taxRates, pricingTiers] = await Promise.all([
    apiRequest<Plan[]>('/plans', { signal }),
    apiRequest<TaxRate[]>('/tax-rates', { signal }),
    apiRequest<PricingTierRecord[]>('/pricing-tiers', { signal }),
  ]);
  return { plans, taxRates, pricingTiers };
}
