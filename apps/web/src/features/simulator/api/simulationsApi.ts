import type { CreatedSimulation, CreateSimulationInput } from '@saasomatic/shared';
import { apiRequest } from '../../../shared/http/apiClient';

export const createSimulation = (input: CreateSimulationInput): Promise<CreatedSimulation> =>
  apiRequest('/simulations', { method: 'POST', body: input });
