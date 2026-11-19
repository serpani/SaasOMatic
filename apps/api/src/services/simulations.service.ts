import {
  calculateQuote,
  getPlanWarnings,
  type CreatedSimulation,
  type CreateSimulationInput,
  type Simulation,
} from '@saasomatic/shared';
import { AppError } from '../errors/AppError';
import type { CatalogRepository } from '../repositories/catalog.repository';
import type { SimulationsRepository } from '../repositories/simulations.repository';
import type { TaxRatesRepository } from '../repositories/taxRates.repository';
import type { CustomersService } from './customers.service';

export function createSimulationsService(
  simulations: SimulationsRepository,
  customers: CustomersService,
  taxRates: TaxRatesRepository,
  catalog: CatalogRepository,
  now: () => Date = () => new Date(),
) {
  return {
    /**
     * Recalcula siempre los importes en el backend (nunca se aceptan del cliente) con los tramos y el IVA
     * vigentes, y guarda una foto inmutable del cálculo.
     */
    create(input: CreateSimulationInput): CreatedSimulation {
      const customer = customers.getById(input.customerId);
      const taxRate = taxRates.findByCountry(customer.countryCode);
      const plan = catalog.findPlanByCode(customer.planCode);
      if (!taxRate || !plan) {
        throw new AppError(500, 'CONFIGURATION_ERROR', 'Falta configuración del IVA o del plan del cliente.');
      }

      const quote = calculateQuote(input.activeUsers, catalog.findAllPricingTiers(), taxRate.ratePercent);
      const saved = simulations.insert({ ...input, ...quote, createdAt: now().toISOString() });
      return { ...saved, planWarnings: getPlanWarnings(input, plan) };
    },

    listByCustomer(customerId: number): Simulation[] {
      customers.getById(customerId);
      return simulations.findByCustomer(customerId);
    },
  };
}

export type SimulationsService = ReturnType<typeof createSimulationsService>;
