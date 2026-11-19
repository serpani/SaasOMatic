import type { ErrorRequestHandler, RequestHandler } from 'express';
import type { ApiErrorBody } from '@saasomatic/shared';
import { ZodError } from 'zod';
import { AppError, type FieldErrorDetail } from './AppError';

function body(code: string, message: string, details?: unknown): ApiErrorBody {
  return { error: details === undefined ? { code, message } : { code, message, details } };
}

function zodDetails(error: ZodError): FieldErrorDetail[] {
  return error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }));
}

function hasType(error: unknown): error is { type: string } {
  return typeof error === 'object' && error !== null && typeof Reflect.get(error, 'type') === 'string';
}

/** Rutas inexistentes. */
export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json(body('NOT_FOUND', 'El recurso solicitado no existe.'));
};

/** Convierte cualquier error en `{ error: { code, message, details? } }`. */
export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  if (error instanceof AppError) {
    res.status(error.status).json(body(error.code, error.message, error.details));
    return;
  }
  if (error instanceof ZodError) {
    res
      .status(400)
      .json(body('VALIDATION_ERROR', 'Hay datos que no son válidos. Revisa los campos marcados.', zodDetails(error)));
    return;
  }
  if (hasType(error) && error.type === 'entity.parse.failed') {
    res.status(400).json(body('INVALID_JSON', 'Los datos enviados no tienen un formato válido.'));
    return;
  }
  if (hasType(error) && error.type === 'entity.too.large') {
    res.status(413).json(body('PAYLOAD_TOO_LARGE', 'Los datos enviados son demasiado grandes.'));
    return;
  }
  console.error('Error no controlado:', error);
  res.status(500).json(body('INTERNAL_ERROR', 'Ha ocurrido un error inesperado. Inténtalo de nuevo en unos segundos.'));
};
