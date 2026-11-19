import { createContext, type ReactNode, useContext } from 'react';
import { type ResourceState, useResource } from '../hooks/useResource';
import { type Catalog, fetchCatalog } from './catalogApi';

type CatalogState = ResourceState<Catalog> & { retry: () => void };

const CatalogContext = createContext<CatalogState | null>(null);

/** Carga el catálogo una sola vez para toda la aplicación. */
export function CatalogProvider({ children }: { children: ReactNode }) {
  const state = useResource(fetchCatalog, []);
  return <CatalogContext.Provider value={state}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): CatalogState {
  const value = useContext(CatalogContext);
  if (!value) throw new Error('useCatalog debe usarse dentro de <CatalogProvider>');
  return value;
}
