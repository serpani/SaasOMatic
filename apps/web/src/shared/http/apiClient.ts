import type { ApiErrorBody } from '@saasomatic/shared';
import { fetchWithTimeout } from './fetchWithTimeout';

export const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
export const API_TIMEOUT_MS = 10_000;

export interface FieldError {
  field: string;
  message: string;
}

/** Error devuelto por nuestra API: `code` para decidir qué hacer, `message` listo para mostrar. */
export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** Errores asociados a campos del formulario (400 y 422). */
  get fieldErrors(): FieldError[] {
    if (!Array.isArray(this.details)) return [];
    return this.details.filter(
      (d): d is FieldError => typeof d?.field === 'string' && typeof d?.message === 'string',
    );
  }
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== 'object' || value === null || !('error' in value)) return false;
  const error: unknown = value.error;
  return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
}

interface RequestOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
  signal?: AbortSignal;
}

/** Llama a nuestro backend con timeout de 10 s y convierte cualquier fallo en un mensaje comprensible. */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetchWithTimeout(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: options.body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
    timeoutMs: API_TIMEOUT_MS,
    timeoutMessage: 'El servidor no responde. Pulsa «Reintentar» en unos segundos.',
    offlineMessage: 'No se puede conectar con el servidor. Comprueba que está en marcha y pulsa «Reintentar».',
  });

  const payload: unknown = await response.json().catch(() => null);
  if (response.ok) return payload as T;
  if (isApiErrorBody(payload)) {
    throw new ApiError(payload.error.code, payload.error.message, payload.error.details);
  }
  throw new ApiError('UNEXPECTED_RESPONSE', 'El servidor ha devuelto una respuesta inesperada. Inténtalo de nuevo.');
}
