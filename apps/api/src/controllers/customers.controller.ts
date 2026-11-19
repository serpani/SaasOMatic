import type { Request, Response } from 'express';
import type { CustomersService } from '../services/customers.service';
import type { SimulationsService } from '../services/simulations.service';
import { idParamSchema } from '../validators/common.validator';
import { createCustomerSchema, searchCustomersSchema } from '../validators/customers.validator';

/** Sin lógica: valida la forma de la petición, delega en el servicio y responde. */
export function createCustomersController(customers: CustomersService, simulations: SimulationsService) {
  return {
    create(req: Request, res: Response): void {
      res.status(201).json(customers.create(createCustomerSchema.parse(req.body)));
    },
    search(req: Request, res: Response): void {
      res.json(customers.search(searchCustomersSchema.parse(req.query)));
    },
    getById(req: Request, res: Response): void {
      res.json(customers.getById(idParamSchema.parse(req.params).id));
    },
    listSimulations(req: Request, res: Response): void {
      res.json(simulations.listByCustomer(idParamSchema.parse(req.params).id));
    },
  };
}
