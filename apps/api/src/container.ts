import type { Db } from './db/connection';
import { createCatalogRepository } from './repositories/catalog.repository';
import { createCustomersRepository } from './repositories/customers.repository';
import { createDashboardRepository } from './repositories/dashboard.repository';
import { createSimulationsRepository } from './repositories/simulations.repository';
import { createTaxRatesRepository } from './repositories/taxRates.repository';
import { createCatalogService } from './services/catalog.service';
import { createCustomersService } from './services/customers.service';
import { createDashboardService } from './services/dashboard.service';
import { createSimulationsService } from './services/simulations.service';

/** Composición de dependencias: repositorios → servicios. Un único sitio donde se cablea todo. */
export function createContainer(db: Db, now: () => Date = () => new Date()) {
  const catalogRepository = createCatalogRepository(db);
  const taxRatesRepository = createTaxRatesRepository(db);
  const customersRepository = createCustomersRepository(db);
  const simulationsRepository = createSimulationsRepository(db);

  const catalogService = createCatalogService(catalogRepository, taxRatesRepository);
  const customersService = createCustomersService(customersRepository, taxRatesRepository, catalogRepository, now);
  const simulationsService = createSimulationsService(
    simulationsRepository,
    customersService,
    taxRatesRepository,
    catalogRepository,
    now,
  );

  const dashboardService = createDashboardService(createDashboardRepository(db));

  return { taxRatesRepository, catalogService, customersService, simulationsService, dashboardService };
}

export type Container = ReturnType<typeof createContainer>;
