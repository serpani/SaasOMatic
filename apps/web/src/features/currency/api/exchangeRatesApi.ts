import { fetchWithTimeout } from '../../../shared/http/fetchWithTimeout';

export const EXCHANGE_RATES_URL = 'https://open.er-api.com/v6/latest/EUR';
export const EXCHANGE_RATES_TIMEOUT_MS = 30_000;

/** Tipos de cambio con base EUR: 1 € = rates[divisa]. */
export interface ExchangeRates {
  rates: Record<string, number>;
  /** Momento (ms) en que se descargaron. */
  fetchedAt: number;
}

function isRatesPayload(value: unknown): value is { result: 'success'; base_code: string; rates: Record<string, number> } {
  if (typeof value !== 'object' || value === null) return false;
  const { result, base_code: base, rates } = value as Record<string, unknown>;
  return (
    result === 'success' &&
    base === 'EUR' &&
    typeof rates === 'object' &&
    rates !== null &&
    Object.values(rates).every((rate) => typeof rate === 'number' && rate > 0)
  );
}

/** Descarga los tipos de cambio del día (solo desde el frontend, timeout 30 s). */
export async function fetchExchangeRates(signal?: AbortSignal, now: () => number = Date.now): Promise<ExchangeRates> {
  const response = await fetchWithTimeout(EXCHANGE_RATES_URL, {
    signal,
    timeoutMs: EXCHANGE_RATES_TIMEOUT_MS,
    timeoutMessage: 'El servicio de divisas no responde.',
    offlineMessage: 'No se pudo conectar con el servicio de divisas.',
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok || !isRatesPayload(payload)) {
    throw new Error('El servicio de divisas ha devuelto datos no válidos.');
  }
  return { rates: { ...payload.rates, EUR: 1 }, fetchedAt: now() };
}
