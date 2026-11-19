import type { CreateCustomerInput, Customer, Paginated, Simulation } from '@saasomatic/shared';
import { apiRequest } from '../../../shared/http/apiClient';

export const PAGE_SIZE = 12;

export function searchCustomers(q: string, page: number, signal: AbortSignal): Promise<Paginated<Customer>> {
  const params = new URLSearchParams({ q, page: String(page), pageSize: String(PAGE_SIZE) });
  return apiRequest(`/customers?${params.toString()}`, { signal });
}

export const getCustomer = (id: number, signal: AbortSignal): Promise<Customer> =>
  apiRequest(`/customers/${id}`, { signal });

export const listSimulations = (customerId: number, signal: AbortSignal): Promise<Simulation[]> =>
  apiRequest(`/customers/${customerId}/simulations`, { signal });

export const createCustomer = (input: CreateCustomerInput): Promise<Customer> =>
  apiRequest('/customers', { method: 'POST', body: input });
