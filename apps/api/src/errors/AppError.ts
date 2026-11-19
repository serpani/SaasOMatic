/** Detalle de un error asociado a un campo del formulario. */
export interface FieldErrorDetail {
  field: string;
  message: string;
}

/**
 * Error de negocio controlado. `code` es estable para el frontend; `message` está en español claro
 * para un comercial y nunca menciona códigos HTTP.
 */
export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const notFound = (code: string, message: string): AppError => new AppError(404, code, message);

export const conflict = (code: string, message: string, details?: unknown): AppError =>
  new AppError(409, code, message, details);

export const unprocessable = (code: string, message: string, details?: FieldErrorDetail[]): AppError =>
  new AppError(422, code, message, details);
