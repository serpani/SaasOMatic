import { type ReactNode, useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

/**
 * Encabezado principal de cada vista. Al navegar a otra vista recibe el foco para que el lector de pantalla
 * anuncie la nueva página. En la carga inicial NO se mueve el foco: así el primer Tab llega al enlace
 * «Saltar al contenido» y a la navegación, como en cualquier página web.
 */
export function PageHeading({ title, children }: { title: string; children?: ReactNode }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const isInitialLoad = useLocation().key === 'default';
  useDocumentTitle(title);
  useEffect(() => {
    if (!isInitialLoad) ref.current?.focus();
  }, [isInitialLoad]);

  return (
    <div className="page-heading">
      <h1 ref={ref} tabIndex={-1}>
        {title}
      </h1>
      {children}
    </div>
  );
}
