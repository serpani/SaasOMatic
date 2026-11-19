import { type ReactNode, useEffect, useRef } from 'react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

/**
 * Encabezado principal de cada vista. Al cambiar de vista recibe el foco para que el lector de pantalla
 * anuncie la nueva página y la navegación por teclado empiece desde arriba.
 */
export function PageHeading({ title, children }: { title: string; children?: ReactNode }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useDocumentTitle(title);
  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <div className="page-heading">
      <h1 ref={ref} tabIndex={-1}>
        {title}
      </h1>
      {children}
    </div>
  );
}
