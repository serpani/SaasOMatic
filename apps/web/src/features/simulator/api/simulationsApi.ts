import type { CreatedSimulation, CreateSimulationInput, Simulation } from '@saasomatic/shared';
import { apiRequest } from '../../../shared/http/apiClient';

export const createSimulation = (input: CreateSimulationInput): Promise<CreatedSimulation> =>
  apiRequest('/simulations', { method: 'POST', body: input });

export const getSimulation = (id: number, signal: AbortSignal): Promise<Simulation> =>
  apiRequest(`/simulations/${id}`, { signal });
