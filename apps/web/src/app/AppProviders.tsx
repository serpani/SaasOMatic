import type { ReactNode } from 'react';
import { CatalogProvider } from '../shared/catalog/CatalogContext';
import { CurrencyProvider } from '../features/currency/hooks/CurrencyContext';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <CatalogProvider>
      <CurrencyProvider>{children}</CurrencyProvider>
    </CatalogProvider>
  );
}
