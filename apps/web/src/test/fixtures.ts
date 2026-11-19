import type { Customer, Plan, PricingTierRecord, Simulation, TaxRate } from '@saasomatic/shared';

export const plans: Plan[] = [
  { code: 'basic', name: 'Basic', storageGb: 50, apiCalls: 10_000 },
  { code: 'pro', name: 'Pro', storageGb: 200, apiCalls: 100_000 },
];

const rate = (countryCode: string, countryName: string, ratePercent: number, currency: string): TaxRate => ({
  countryCode,
  countryName,
  rateType: 'standard',
  ratePercent,
  currency,
  source: 'manual',
  updatedAt: '2026-11-19T10:00:00.000Z',
});

export const taxRates: TaxRate[] = [
  rate('ES', 'España', 21, 'EUR'),
  rate('FR', 'Francia', 20, 'EUR'),
  rate('SE', 'Suecia', 25, 'SEK'),
  rate('US', 'Estados Unidos', 0, 'USD'),
];

export const pricingTiers: PricingTierRecord[] = [
  { id: 1, minUsers: 1, maxUsers: 10, unitCents: 1_000 },
  { id: 2, minUsers: 11, maxUsers: 50, unitCents: 800 },
  { id: 3, minUsers: 51, maxUsers: null, unitCents: 500 },
];

export const customer: Customer = {
  id: 1,
  companyName: 'Fácil Software S.L.',
  taxId: 'B12345674',
  email: 'ventas@facil.es',
  countryCode: 'ES',
  planCode: 'basic',
  createdAt: '2026-11-19T10:00:00.000Z',
};

export const simulation: Simulation = {
  id: 7,
  customerId: 1,
  activeUsers: 15,
  storageGb: 80,
  apiCalls: 500,
  baseCents: 14_000,
  taxPercent: 21,
  taxCents: 2_940,
  totalCents: 16_940,
  tierBreakdown: [
    { minUsers: 1, maxUsers: 10, users: 10, unitCents: 1_000, subtotalCents: 10_000 },
    { minUsers: 11, maxUsers: 50, users: 5, unitCents: 800, subtotalCents: 4_000 },
  ],
  createdAt: '2026-11-19T11:00:00.000Z',
};

/** Respuesta de open.er-api.com con base EUR. */
export const ratesPayload = {
  result: 'success',
  base_code: 'EUR',
  rates: { EUR: 1, USD: 1.1, GBP: 0.8, SEK: 11.5 },
};
