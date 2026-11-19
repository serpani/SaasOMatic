import { useEffect } from 'react';

/** Título de la pestaña por vista (lo anuncian los lectores de pantalla al navegar). */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = `${title} · SaaS-O-Matic`;
  }, [title]);
}
