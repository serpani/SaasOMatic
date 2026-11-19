import type { TierBreakdownItem } from './pricing';

/** Contratos de la API (JSON camelCase). Mismos nombres que las columnas de BD en snake_case. */

export interface Plan {
  code: string;
  name: string;
  storageGb: number;
  apiCalls: number;
}

export type TaxRateSource = 'api' | 'manual';

export interface TaxRate {
  countryCode: string;
  countryName: string;
  rateType: string;
  ratePercent: number;
  currency: string;
  source: TaxRateSource;
  updatedAt: string;
}

export interface CreateCustomerInput {
  companyName: string;
  taxId: string;
  email: string;
  countryCode: string;
  planCode: string;
}

export interface Customer extends CreateCustomerInput {
  id: number;
  createdAt: string;
}

export interface CreateSimulationInput {
  customerId: number;
  activeUsers: number;
  storageGb: number;
  apiCalls: number;
}

export interface Simulation extends CreateSimulationInput {
  id: number;
  baseCents: number;
  taxPercent: number;
  taxCents: number;
  totalCents: number;
  tierBreakdown: TierBreakdownItem[];
  createdAt: string;
}

/** Respuesta de `POST /simulations`: la simulación guardada más los avisos del plan. */
export interface CreatedSimulation extends Simulation {
  planWarnings: string[];
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
