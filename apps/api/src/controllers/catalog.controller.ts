import type { Request, Response } from 'express';
import type { CatalogService } from '../services/catalog.service';

export function createCatalogController(service: CatalogService) {
  return {
    listPlans: (_req: Request, res: Response) => void res.json(service.listPlans()),
    listTaxRates: (_req: Request, res: Response) => void res.json(service.listTaxRates()),
    listPricingTiers: (_req: Request, res: Response) => void res.json(service.listPricingTiers()),
  };
}
