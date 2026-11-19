import { describe, expect, it, vi } from 'vitest';
import { apiError, json } from '../../test/fetchMock';
import { API_TIMEOUT_MS, ApiError, apiRequest } from './apiClient';
import { NetworkError } from './fetchWithTimeout';

/** fetch que nunca responde salvo que se cancele. */
const hangingFetch = () =>
  vi.fn(
    (_input: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      }),
  );

describe('apiRequest', () => {
  it('devuelve el JSON si la respuesta es correcta', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(json({ ok: 1 }))));
    await expect(apiRequest('/plans')).resolves.toEqual({ ok: 1 });
  });

  it('convierte el error de la API en ApiError con code, message y errores por campo', async () => {
    const details = [{ field: 'taxId', message: 'No válido' }];
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(apiError(422, 'TAX_ID_INVALID_CONTROL', 'Revisa el NIF', details))));

    const error = await apiRequest('/customers', { method: 'POST', body: {} }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ code: 'TAX_ID_INVALID_CONTROL', message: 'Revisa el NIF' });
    expect((error as ApiError).fieldErrors).toEqual(details);
  });

  it('una respuesta de error sin formato conocido da un mensaje genérico, sin códigos HTTP', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('<html>502</html>', { status: 502 }))));
    const error = await apiRequest('/plans').catch((e: unknown) => e);
    expect((error as Error).message).not.toMatch(/502/);
  });

  it('A.5 timeout de 10 s: mensaje claro para reintentar', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', hangingFetch());
    const promise = apiRequest('/plans').catch((e: unknown) => e);

    await vi.advanceTimersByTimeAsync(API_TIMEOUT_MS - 1);
    await vi.advanceTimersByTimeAsync(1);
    const error = await promise;
    expect(error).toBeInstanceOf(NetworkError);
    expect(error).toMatchObject({ kind: 'timeout', message: expect.stringContaining('no responde') });
  });

  it('servidor caído: mensaje de conexión con indicación de reintentar', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))));
    const error = await apiRequest('/plans').catch((e: unknown) => e);
    expect(error).toMatchObject({ kind: 'offline', message: expect.stringContaining('Reintentar') });
  });

  it('respeta la cancelación externa (búsqueda anterior) sin convertirla en error de red', async () => {
    vi.stubGlobal('fetch', hangingFetch());
    const controller = new AbortController();
    const promise = apiRequest('/customers', { signal: controller.signal }).catch((e: unknown) => e);
    controller.abort();
    expect(await promise).toBeInstanceOf(DOMException);
  });
});
