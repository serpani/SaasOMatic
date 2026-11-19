import { formatInteger } from '@saasomatic/shared';
import { Link, useLocation, useParams } from 'react-router';
import { useCatalog } from '../../../shared/catalog/CatalogContext';
import { formatDateTime, formatPercent } from '../../../shared/format/formatters';
import { useResource } from '../../../shared/hooks/useResource';
import { PageHeading } from '../../../shared/ui/PageHeading';
import { ErrorState, LoadingState, Notice } from '../../../shared/ui/StatusMessages';
import { getCustomer, listSimulations } from '../api/customersApi';
import { SimulationHistory } from './SimulationHistory';

/** Detalle del cliente: tarjeta con sus datos y plan + historial de simulaciones. */
export function CustomerDetailPage() {
  const id = Number(useParams().id);
  const flash = (useLocation().state as { flash?: string } | null)?.flash;
  const catalog = useCatalog();
  const customer = useResource((signal) => getCustomer(id, signal), [id]);
  const history = useResource((signal) => listSimulations(id, signal), [id]);

  if (customer.status === 'loading') return <LoadingState label="Cargando cliente…" />;
  if (customer.status === 'error') return <ErrorState message={customer.error.message} onRetry={customer.retry} />;

  const c = customer.data;
  const taxRate = catalog.data?.taxRates.find((r) => r.countryCode === c.countryCode);
  const plan = catalog.data?.plans.find((p) => p.code === c.planCode);

  return (
    <>
      <PageHeading title={c.companyName}>
        <Link to={`/customers/${c.id}/simulate`} className="button">
          Nueva simulación
        </Link>
      </PageHeading>
      {flash && <Notice tone="success">{flash}</Notice>}

      <section className="card" aria-labelledby="customer-data-title">
        <h2 id="customer-data-title">Datos del cliente</h2>
        <dl className="data-list">
          <div>
            <dt>Identificador fiscal</dt>
            <dd>{c.taxId}</dd>
          </div>
          <div>
            <dt>Email de contacto</dt>
            <dd>
              <a href={`mailto:${c.email}`}>{c.email}</a>
            </dd>
          </div>
          <div>
            <dt>País</dt>
            <dd>
              {taxRate?.countryName ?? c.countryCode}
              {taxRate && ` (IVA ${formatPercent(taxRate.ratePercent)})`}
            </dd>
          </div>
          <div>
            <dt>Plan</dt>
            <dd>
              {plan
                ? `${plan.name}: ${formatInteger(plan.storageGb)} GB y ${formatInteger(plan.apiCalls)} llamadas/mes`
                : c.planCode}
            </dd>
          </div>
          <div>
            <dt>Alta</dt>
            <dd>{formatDateTime(c.createdAt)}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="history-title" aria-busy={history.status === 'loading'}>
        <h2 id="history-title">Historial de simulaciones</h2>
        {history.status === 'loading' && <LoadingState label="Cargando simulaciones…" />}
        {history.status === 'error' && <ErrorState message={history.error.message} onRetry={history.retry} />}
        {history.status === 'success' && <SimulationHistory simulations={history.data} />}
      </section>
    </>
  );
}
