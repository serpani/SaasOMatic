import { validateTiers, type Plan, type PricingTierRecord, type TaxRate } from '@saasomatic/shared';
import type { CatalogRepository } from '../repositories/catalog.repository';
import type { TaxRatesRepository } from '../repositories/taxRates.repository';

export function createCatalogService(catalog: CatalogRepository, taxRates: TaxRatesRepository) {
  return {
    listPlans: (): Plan[] => catalog.findAllPlans(),
    listTaxRates: (): TaxRate[] => taxRates.findAll(),
    listPricingTiers: (): PricingTierRecord[] => catalog.findAllPricingTiers(),

    /** Se ejecuta al arrancar: la API no debe calcular precios con tramos incoherentes. */
    assertPricingTiersAreValid(): void {
      const errors = validateTiers(catalog.findAllPricingTiers());
      if (errors.length > 0) {
        throw new Error(`Los tramos de precio de la base de datos no son válidos:\n- ${errors.join('\n- ')}`);
      }
    },
  };
}

export type CatalogService = ReturnType<typeof createCatalogService>;
