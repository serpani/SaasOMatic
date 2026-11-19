import { useEffect, useState } from 'react';
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue';
import { useResource } from '../../../shared/hooks/useResource';
import { searchCustomers } from '../api/customersApi';

export const SEARCH_DEBOUNCE_MS = 300;

/** Búsqueda con debounce de 300 ms; al cambiar el texto se vuelve a la primera página. */
export function useCustomerSearch() {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const debouncedQuery = useDebouncedValue(query.trim(), SEARCH_DEBOUNCE_MS);

  useEffect(() => setPage(1), [debouncedQuery]);

  const result = useResource((signal) => searchCustomers(debouncedQuery, page, signal), [debouncedQuery, page]);
  return { query, setQuery, page, setPage, debouncedQuery, result };
}
