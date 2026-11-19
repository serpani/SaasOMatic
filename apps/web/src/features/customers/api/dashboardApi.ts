import type { DashboardSummary } from '@saasomatic/shared';
import { apiRequest } from '../../../shared/http/apiClient';

export const getDashboard = (signal: AbortSignal): Promise<DashboardSummary> => apiRequest('/dashboard', { signal });
