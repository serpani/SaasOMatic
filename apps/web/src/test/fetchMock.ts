import { vi } from 'vitest';
import { EXCHANGE_RATES_URL } from '../features/currency/api/exchangeRatesApi';
import { API_URL } from '../shared/http/apiClient';
import { customer, plans, pricingTiers, ratesPayload, simulation, taxRates } from './fixtures';

export type Handler = (init: RequestInit | undefined, url: URL) => Response | Promise<Response>;

export const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export const apiError = (status: number, code: string, message: string, details?: unknown): Response =>
  json({ error: { code, message, details } }, status);

/** Respuestas por defecto de la API y de la API de divisas. Clave: "MÉTODO /ruta" o "RATES". */
export const defaultHandlers = (): Record<string, Handler> => ({
  'GET /plans': () => json(plans),
  'GET /tax-rates': () => json(taxRates),
  'GET /pricing-tiers': () => json(pricingTiers),
  'GET /customers': () => json({ items: [customer], total: 1, page: 1, pageSize: 12 }),
  'GET /customers/1': () => json(customer),
  'GET /customers/1/simulations': () => json([simulation]),
  RATES: () => json(ratesPayload),
});

/** Sustituye `fetch` global. Devuelve el mock para inspeccionar llamadas. */
export function mockFetch(overrides: Record<string, Handler> = {}) {
  const handlers = { ...defaultHandlers(), ...overrides };
  const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    if (url.href === EXCHANGE_RATES_URL) return Promise.resolve(handlers.RATES?.(init, url) ?? json({}, 500));
    const path = url.href.replace(API_URL, '').split('?')[0] ?? '';
    const handler = handlers[`${init?.method ?? 'GET'} ${path}`];
    if (!handler) return Promise.resolve(apiError(404, 'NOT_FOUND', `Sin mock para ${path}`));
    return Promise.resolve(handler(init, url));
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

/** Peticiones hechas a una ruta de la API (sin query). */
export const callsTo = (fetchMock: ReturnType<typeof mockFetch>, method: string, path: string) =>
  fetchMock.mock.calls.filter(([input, init]) => {
    const url = new URL(String(input));
    return (init?.method ?? 'GET') === method && url.pathname === path;
  });
