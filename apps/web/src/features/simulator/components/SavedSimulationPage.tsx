import { type Customer, getPlanWarnings, type Simulation } from '@saasomatic/shared';
import { useNavigate, useParams } from 'react-router';
import { type Catalog } from '../../../shared/catalog/catalogApi';
import { useCatalog } from '../../../shared/catalog/CatalogContext';
import { formatDateTime, formatPercent } from '../../../shared/format/formatters';
import { useResource } from '../../../shared/hooks/useResource';
import { CountryChip, PlanChip } from '../../../shared/ui/Identity';
import { PageHeading } from '../../../shared/ui/PageHeading';
import { ErrorState, LoadingState, Notice } from '../../../shared/ui/StatusMessages';
import { useCurrency } from '../../currency/hooks/CurrencyContext';
import { getCustomer } from '../../customers/api/customersApi';
import { getSimulation } from '../api/simulationsApi';
import { QuoteSummary } from './QuoteSummary';
import { UsageControls } from './UsageControls';

const NOT_FOUND = 'No existe la simulación indicada para este cliente.';
const noop = () => undefined;

/** Simulación guardada en la misma pantalla que el simulador, en solo lectura y sin botón de guardar. */
export function SavedSimulationPage() {
  const params = useParams();
  const customerId = Number(params.id);
  const simulationId = Number(params.simulationId);
  const catalog = useCatalog();
  const customer = useResource((signal) => getCustomer(customerId, signal), [customerId]);
  const simulation = useResource((signal) => getSimulation(simulationId, signal), [simulationId]);

  const states = [customer, simulation, catalog];
  if (states.some((s) => s.status === 'loading')) return <LoadingState label="Cargando simulación…" />;
  const failed = states.find((s) => s.status === 'error');
  if (failed?.status === 'error') return <ErrorState message={failed.error.message} onRetry={failed.retry} />;
  if (customer.status !== 'success' || simulation.status !== 'success' || catalog.status !== 'success') return null;
  if (simulation.data.customerId !== customer.data.id) return <ErrorState message={NOT_FOUND} />;

  return <SavedSimulation customer={customer.data} simulation={simulation.data} catalog={catalog.data} />;
}

function SavedSimulation({ customer, simulation, catalog }: { customer: Customer; simulation: Simulation; catalog: Catalog }) {
  const navigate = useNavigate();
  const { formatCents } = useCurrency();
  const country = catalog.taxRates.find((r) => r.countryCode === customer.countryCode);
  const plan = catalog.plans.find((p) => p.code === customer.planCode);
  const warnings = plan ? getPlanWarnings(simulation, plan) : [];
  const inputs = {
    usersText: String(simulation.activeUsers),
    storageText: String(simulation.storageGb),
    apiCallsText: String(simulation.apiCalls),
  };

  return (
    <>
      <PageHeading
        title={`Simulación para ${customer.companyName}`}
        meta={
          <>
            <CountryChip>
              {country?.countryName ?? customer.countryCode} · IVA {formatPercent(simulation.taxPercent)}
            </CountryChip>
            <PlanChip code={customer.planCode}>Plan {plan?.name ?? customer.planCode}</PlanChip>
          </>
        }
      />
      <Notice tone="info">
        Simulación guardada el <time dateTime={simulation.createdAt}>{formatDateTime(simulation.createdAt)}</time>.
        Solo lectura: los importes son los calculados al guardarla y no se pueden modificar.
      </Notice>
      <div className="split">
        <UsageControls
          inputs={inputs}
          users={simulation.activeUsers}
          totalLabel={formatCents(simulation.totalCents)}
          errors={{}}
          onUsers={noop}
          onStorage={noop}
          onApiCalls={noop}
          readOnly
        />
        <div className="sticky">
          <QuoteSummary quote={simulation} />
          {warnings.map((warning) => (
            <Notice key={warning}>{warning}</Notice>
          ))}
          <div className="form__actions quote__actions">
            <button type="button" className="button button--secondary" onClick={() => navigate(`/customers/${customer.id}`)}>
              Volver al cliente
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
