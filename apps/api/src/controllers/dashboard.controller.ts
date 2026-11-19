import type { Request, Response } from 'express';
import type { DashboardService } from '../services/dashboard.service';

export function createDashboardController(service: DashboardService) {
  return {
    getSummary: (_req: Request, res: Response) => void res.json(service.getSummary()),
  };
}
