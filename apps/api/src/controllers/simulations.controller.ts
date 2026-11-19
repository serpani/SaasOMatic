import type { Request, Response } from 'express';
import type { SimulationsService } from '../services/simulations.service';
import { idParamSchema } from '../validators/common.validator';
import { createSimulationSchema } from '../validators/simulations.validator';

export function createSimulationsController(simulations: SimulationsService) {
  return {
    create(req: Request, res: Response): void {
      res.status(201).json(simulations.create(createSimulationSchema.parse(req.body)));
    },
    getById(req: Request, res: Response): void {
      res.json(simulations.getById(idParamSchema.parse(req.params).id));
    },
  };
}
