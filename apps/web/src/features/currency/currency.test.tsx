import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { CatalogProvider } from '../../shared/catalog/CatalogContext';
import { json, mockFetch } from '../../test/fetchMock';
import { ratesPayload } from '../../test/fixtures';
import { EXCHANGE_RATES_TIMEOUT_MS, fetchExchangeRates } from './api/exchangeRatesApi';
import { CACHE_TTL_MS, readCachedRates, writeCachedRates } from './api/ratesCache';
import { CurrencyNotice } from './components/CurrencyNotice';
import { CurrencyProvider, useCurrency } from './hooks/CurrencyContext';

const NOW = new Date('2026-11-19T12:00:00Z').getTime();
const now = () => NOW;
const wrapper = ({ children }: { children: ReactNode }) => (
  <CatalogProvider>
    <CurrencyProvider now={now}>
      {children}
      <CurrencyNotice />
    </CurrencyProvider>
  </CatalogProvider>
);
const ratesCalls = (fetchMock: ReturnType<typeof mockFetch>) =>
  fetchMock.mock.calls.filter(([url]) => String(url).includes('open.er-api.com')).length;

describe('A.5 conversión de divisa (tipos simulados)', () => {
  it('convierte céntimos de euro a la divisa elegida al momento', async () => {
    mockFetch();
    const { result } = renderHook(() => useCurrency(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('ready'));

    expect(result.current.formatCents(16_940)).toMatch(/169,40\s€/);
    act(() => result.current.select('USD'));
    expect(result.current.formatCents(16_940)).toMatch(/186,34\sUS\$/);
    act(() => result.current.select('GBP'));
    expect(result.current.formatCents(16_940)).toMatch(/135,52\sGBP/);
  });

  it('ofrece EUR, USD, GBP y las monedas locales de los países admitidos', async () => {
    mockFetch();
    const { result } = renderHook(() => useCurrency(), { wrapper });
    await waitFor(() => expect(result.current.currencies).toEqual(['EUR', 'USD', 'GBP', 'SEK']));
  });

  it('recuerda la divisa elegida', async () => {
    mockFetch();
    const first = renderHook(() => useCurrency(), { wrapper });
    act(() => first.result.current.select('USD'));
    first.unmount();
    const second = renderHook(() => useCurrency(), { wrapper });
    expect(second.result.current.selected).toBe('USD');
  });
});

describe('caché de 1 h y fallos de la API de divisas', () => {
  it('con caché de menos de 1 h no vuelve a llamar a la API', async () => {
    writeCachedRates({ rates: ratesPayload.rates, fetchedAt: NOW - CACHE_TTL_MS + 60_000 });
    const fetchMock = mockFetch();
    const { result } = renderHook(() => useCurrency(), { wrapper });
    expect(result.current.status).toBe('ready');
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(ratesCalls(fetchMock)).toBe(0);
  });

  it('con caché caducada descarga de nuevo y la guarda', async () => {
    writeCachedRates({ rates: { EUR: 1, USD: 2 }, fetchedAt: NOW - CACHE_TTL_MS - 1 });
    mockFetch();
    const { result } = renderHook(() => useCurrency(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(readCachedRates()).toEqual({ rates: ratesPayload.rates, fetchedAt: NOW });
  });

  it('API caída con caché antigua → usa los últimos tipos y avisa con su fecha', async () => {
    writeCachedRates({ rates: { EUR: 1, USD: 2 }, fetchedAt: NOW - 3 * CACHE_TTL_MS });
    mockFetch({ RATES: () => Promise.reject(new TypeError('Failed to fetch')) });
    render(<span />, { wrapper });
    expect(await screen.findByText(/Se usan los últimos guardados, del 19 nov 2026/)).toBeInTheDocument();
  });

  it('API caída sin caché → EUR con aviso y botón de reintentar que vuelve a intentarlo', async () => {
    const fetchMock = mockFetch({ RATES: () => json({ result: 'error' }) });
    const { result } = renderHook(() => useCurrency(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('unavailable'));
    act(() => result.current.select('USD'));
    expect(result.current.displayCurrency).toBe('EUR');
    expect(screen.getByText(/Los importes se muestran en euros/)).toBeInTheDocument();

    screen.getByRole('button', { name: 'Reintentar' }).click();
    await waitFor(() => expect(ratesCalls(fetchMock)).toBe(2));
  });

  it('A.5 timeout de 30 s en la API de divisas', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn((_u: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_r, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      })),
    );
    const promise = fetchExchangeRates().catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(EXCHANGE_RATES_TIMEOUT_MS);
    expect(await promise).toMatchObject({ kind: 'timeout', message: 'El servicio de divisas no responde.' });
  });

  it('rechaza respuestas con tipos no válidos', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(json({ ...ratesPayload, rates: { USD: -1 } }))));
    await expect(fetchExchangeRates()).rejects.toThrow('datos no válidos');
  });
});
