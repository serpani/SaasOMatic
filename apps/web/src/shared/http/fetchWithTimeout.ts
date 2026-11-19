/** Error de red con un motivo claro para mostrar al usuario. */
export class NetworkError extends Error {
  constructor(
    readonly kind: 'timeout' | 'offline',
    message: string,
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

/**
 * `fetch` con tiempo máximo de espera (AbortController). También respeta la señal externa, p. ej. para
 * cancelar una búsqueda anterior cuando el usuario sigue escribiendo.
 */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit & { timeoutMs: number; timeoutMessage: string; offlineMessage: string },
): Promise<Response> {
  const { timeoutMs, timeoutMessage, offlineMessage, signal: external, ...rest } = init;
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const onExternalAbort = () => controller.abort();
  external?.addEventListener('abort', onExternalAbort);

  try {
    return await fetch(url, { ...rest, signal: controller.signal });
  } catch (error) {
    if (timedOut) throw new NetworkError('timeout', timeoutMessage);
    if (external?.aborted) throw error;
    throw new NetworkError('offline', offlineMessage);
  } finally {
    clearTimeout(timer);
    external?.removeEventListener('abort', onExternalAbort);
  }
}

export const isAbortError = (error: unknown): boolean =>
  error instanceof DOMException && error.name === 'AbortError';
