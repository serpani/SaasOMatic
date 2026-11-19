import { type ReactElement, cloneElement, useId } from 'react';

/** Mensaje positivo o informativo bajo el campo (p. ej. «CIF válido»). */
export interface FieldStatus {
  tone: 'success' | 'info';
  message: string;
}

interface FormFieldProps {
  label: string;
  hint?: string;
  error?: string;
  /** Se muestra solo si no hay error. */
  status?: FieldStatus | null;
  /** Clases extra del contenedor (p. ej. `field--full` para ocupar toda la fila en el formulario). */
  className?: string;
  /** Un único control (input o select). Recibe id, aria-describedby y aria-invalid. */
  children: ReactElement<Record<string, unknown>>;
}

const PREFIX = { error: 'Error:', success: 'Correcto:', info: 'Nota:' } as const;

/**
 * Campo con label, ayuda y mensaje asociados al control (WCAG: labels y errores accesibles).
 * El mensaje (error o estado) se anuncia con aria-live y lleva un prefijo de texto, no solo color.
 */
export function FormField({ label, hint, error, status, className, children }: FormFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const messageId = `${id}-message`;
  const tone = error ? 'error' : status?.tone;
  const message = error ?? status?.message;
  const describedBy = [hint ? hintId : null, message ? messageId : null].filter(Boolean).join(' ') || undefined;
  const classes = ['field', error ? 'field--invalid' : '', tone === 'success' ? 'field--valid' : '', className ?? ''];

  return (
    <div className={classes.filter(Boolean).join(' ')}>
      <label htmlFor={id}>{label}</label>
      {hint && (
        <p id={hintId} className="field__hint">
          {hint}
        </p>
      )}
      {cloneElement(children, { id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      <p id={messageId} className={tone ? `field__message field__message--${tone}` : 'field__message'} aria-live="polite">
        {tone && message ? `${PREFIX[tone]} ${message}` : ''}
      </p>
    </div>
  );
}
