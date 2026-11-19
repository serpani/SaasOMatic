import type { ExchangeRates } from './exchangeRatesApi';

const CACHE_KEY = 'saasomatic.exchangeRates';
export const CACHE_TTL_MS = 60 * 60 * 1000;

/** Lee la última descarga guardada. localStorage puede no estar disponible: nunca lanza. */
export function readCachedRates(): ExchangeRates | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const { rates, fetchedAt } = parsed as Record<string, unknown>;
    if (typeof fetchedAt !== 'number' || typeof rates !== 'object' || rates === null) return null;
    return { rates: rates as Record<string, number>, fetchedAt };
  } catch {
    return null;
  }
}

export function writeCachedRates(rates: ExchangeRates): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(rates));
  } catch {
    // Sin almacenamiento (modo privado, cuota llena…): la app sigue funcionando sin caché.
  }
}

export const isFresh = (rates: ExchangeRates, now: number): boolean => now - rates.fetchedAt < CACHE_TTL_MS;
