import { Link } from 'react-router';
import { SearchIcon } from '../../../shared/ui/Identity';
import { PageHeading } from '../../../shared/ui/PageHeading';
import { EmptyState, ErrorState, LoadingState } from '../../../shared/ui/StatusMessages';
import { PAGE_SIZE } from '../api/customersApi';
import { useCustomerSearch } from '../hooks/useCustomerSearch';
import { CustomerCard } from './CustomerCard';
import { Pagination } from './Pagination';

/** Buscador y dashboard: resultados en tarjetas mientras se escribe. */
export function SearchPage() {
  const { query, setQuery, page, setPage, debouncedQuery, result } = useCustomerSearch();

  return (
    <>
      <PageHeading title="Clientes">
        <Link to="/customers/new" className="button">
          Nuevo cliente
        </Link>
      </PageHeading>

      <search className="search-box">
        <label htmlFor="customer-search">Buscar por nombre de empresa o identificador fiscal</label>
        <div className="search-box__control">
          <SearchIcon className="search-box__icon" />
          <input
            id="customer-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ej.: Acme o B12345674"
            autoComplete="off"
          />
        </div>
      </search>

      <section aria-labelledby="results-title" aria-busy={result.status === 'loading'}>
        <h2 id="results-title" className="visually-hidden">
          Resultados
        </h2>
        {result.status === 'loading' && <LoadingState label="Buscando clientes…" />}
        {result.status === 'error' && <ErrorState message={result.error.message} onRetry={result.retry} />}
        {result.status === 'success' && result.data.total === 0 && (
          <EmptyState>
            {debouncedQuery ? (
              <p>No hay clientes que coincidan con «{debouncedQuery}».</p>
            ) : (
              <p>Todavía no hay clientes registrados.</p>
            )}
            <Link to="/customers/new">Dar de alta un cliente</Link>
          </EmptyState>
        )}
        {result.status === 'success' && result.data.total > 0 && (
          <>
            <p role="status" className="results-count">
              {result.data.total === 1 ? '1 cliente encontrado' : `${result.data.total} clientes encontrados`}
            </p>
            <ul className="card-grid">
              {result.data.items.map((customer) => (
                <li key={customer.id}>
                  <CustomerCard customer={customer} />
                </li>
              ))}
            </ul>
            <Pagination page={page} totalPages={Math.ceil(result.data.total / PAGE_SIZE)} onChange={setPage} />
          </>
        )}
      </section>
    </>
  );
}
