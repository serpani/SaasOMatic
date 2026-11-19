import type { Request, Response } from 'express';
import type { SimulationsService } from '../services/simulations.service';
import { createSimulationSchema } from '../validators/simulations.validator';

export function createSimulationsController(simulations: SimulationsService) {
  return {
    create(req: Request, res: Response): void {
      res.status(201).json(simulations.create(createSimulationSchema.parse(req.body)));
    },
  };
}
