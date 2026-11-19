import { useCallback, useEffect, useState } from 'react';
import { type ExchangeRates, fetchExchangeRates } from '../api/exchangeRatesApi';
import { isFresh, readCachedRates, writeCachedRates } from '../api/ratesCache';

/**
 * - `loading`: descargando (si hay caché antigua se sigue usando mientras tanto).
 * - `ready`: tipos del día (caché de menos de 1 h o descarga correcta).
 * - `stale`: el servicio falló; se usan los últimos tipos guardados (con su fecha).
 * - `unavailable`: el servicio falló y no hay caché; solo se puede mostrar en EUR.
 */
export type RatesStatus = 'loading' | 'ready' | 'stale' | 'unavailable';

export interface ExchangeRatesState {
  status: RatesStatus;
  rates: ExchangeRates | null;
  retry: () => void;
}

export function useExchangeRates(now: () => number = Date.now): ExchangeRatesState {
  const [rates, setRates] = useState<ExchangeRates | null>(() => readCachedRates());
  const [status, setStatus] = useState<RatesStatus>(() => {
    const cached = readCachedRates();
    return cached && isFresh(cached, now()) ? 'ready' : 'loading';
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const cached = readCachedRates();
    if (cached && isFresh(cached, now())) return;

    const controller = new AbortController();
    setStatus('loading');
    fetchExchangeRates(controller.signal, now).then(
      (fresh) => {
        writeCachedRates(fresh);
        setRates(fresh);
        setStatus('ready');
      },
      () => {
        if (controller.signal.aborted) return;
        setRates(cached);
        setStatus(cached ? 'stale' : 'unavailable');
      },
    );
    return () => controller.abort();
  }, [attempt, now]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { status, rates, retry };
}
