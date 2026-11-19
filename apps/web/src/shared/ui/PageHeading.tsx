import { type ReactNode, useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

interface PageHeadingProps {
  title: string;
  /** Elemento decorativo a la izquierda del título (p. ej. el avatar del cliente). */
  leading?: ReactNode;
  /** Datos breves bajo el título (chips de país, plan…). */
  meta?: ReactNode;
  /** Acciones a la derecha (botones). */
  children?: ReactNode;
}

/**
 * Encabezado principal de cada vista. Al navegar a otra vista recibe el foco para que el lector de pantalla
 * anuncie la nueva página. En la carga inicial NO se mueve el foco: así el primer Tab llega al enlace
 * «Saltar al contenido» y a la navegación, como en cualquier página web.
 */
export function PageHeading({ title, leading, meta, children }: PageHeadingProps) {
  const ref = useRef<HTMLHeadingElement>(null);
  const isInitialLoad = useLocation().key === 'default';
  useDocumentTitle(title);
  useEffect(() => {
    if (!isInitialLoad) ref.current?.focus();
  }, [isInitialLoad]);

  return (
    <div className="page-heading">
      <div className="page-heading__main">
        {leading}
        <div>
          <h1 ref={ref} tabIndex={-1}>
            {title}
          </h1>
          {meta && <div className="page-heading__meta">{meta}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}
