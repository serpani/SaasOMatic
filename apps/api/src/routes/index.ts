import { Router } from 'express';
import type { Container } from '../container';
import { createCatalogController } from '../controllers/catalog.controller';
import { createCustomersController } from '../controllers/customers.controller';
import { createDashboardController } from '../controllers/dashboard.controller';
import { getHealth } from '../controllers/health.controller';
import { createSimulationsController } from '../controllers/simulations.controller';

/** Tabla de rutas de la API. Cada ruta solo conecta una URL con su controlador. */
export function createRouter(container: Container): Router {
  const catalog = createCatalogController(container.catalogService);
  const customers = createCustomersController(container.customersService, container.simulationsService);
  const simulations = createSimulationsController(container.simulationsService);
  const dashboard = createDashboardController(container.dashboardService);

  const router = Router();
  router.get('/health', getHealth);

  router.get('/plans', catalog.listPlans);
  router.get('/tax-rates', catalog.listTaxRates);
  router.get('/pricing-tiers', catalog.listPricingTiers);

  router.post('/customers', customers.create);
  router.get('/customers', customers.search);
  router.get('/customers/:id', customers.getById);
  router.get('/customers/:id/simulations', customers.listSimulations);

  router.post('/simulations', simulations.create);
  router.get('/simulations/:id', simulations.getById);

  router.get('/dashboard', dashboard.getSummary);
  return router;
}
