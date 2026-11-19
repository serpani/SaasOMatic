import type { ReactNode } from 'react';

/** Indicador de carga anunciado por los lectores de pantalla. */
export function LoadingState({ label = 'Cargando…' }: { label?: string }) {
  return (
    <p className="state state--loading" role="status">
      <span className="spinner" aria-hidden="true" />
      {label}
    </p>
  );
}

/** Error con mensaje claro y botón para reintentar. */
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="state state--error" role="alert">
      <p>
        <strong>No se ha podido completar la operación.</strong> {message}
      </p>
      {onRetry && (
        <button type="button" className="button button--secondary" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="state state--empty">{children}</div>;
}

/** Avisos que no dependen solo del color: siempre llevan un prefijo de texto. */
const NOTICE_PREFIX = { warning: 'Aviso:', success: 'Hecho:', info: 'Nota:' } as const;

export function Notice({ children, tone = 'warning' }: { children: ReactNode; tone?: keyof typeof NOTICE_PREFIX }) {
  return (
    <div className={`notice notice--${tone}`}>
      <strong>{NOTICE_PREFIX[tone]}</strong> {children}
    </div>
  );
}
