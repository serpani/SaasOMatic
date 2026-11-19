import { type ReactElement, cloneElement, useId } from 'react';

interface FormFieldProps {
  label: string;
  hint?: string;
  error?: string;
  /** Clases extra del contenedor (p. ej. `field--full` para ocupar toda la fila en el formulario). */
  className?: string;
  /** Un único control (input o select). Recibe id, aria-describedby y aria-invalid. */
  children: ReactElement<Record<string, unknown>>;
}

/** Campo con label, ayuda y error asociados al control (WCAG: labels y errores accesibles). */
export function FormField({ label, hint, error, className, children }: FormFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className={['field', error ? 'field--invalid' : '', className ?? ''].filter(Boolean).join(' ')}>
      <label htmlFor={id}>{label}</label>
      {hint && (
        <p id={hintId} className="field__hint">
          {hint}
        </p>
      )}
      {cloneElement(children, { id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      <p id={errorId} className="field__error" aria-live="polite">
        {error ? `Error: ${error}` : ''}
      </p>
    </div>
  );
}
