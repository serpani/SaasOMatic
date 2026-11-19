import type { Customer } from '@saasomatic/shared';
import { useNavigate, useParams } from 'react-router';
import { type Catalog } from '../../../shared/catalog/catalogApi';
import { useCatalog } from '../../../shared/catalog/CatalogContext';
import { useResource } from '../../../shared/hooks/useResource';
import { PageHeading } from '../../../shared/ui/PageHeading';
import { ErrorState, LoadingState, Notice } from '../../../shared/ui/StatusMessages';
import { useCurrency } from '../../currency/hooks/CurrencyContext';
import { getCustomer } from '../../customers/api/customersApi';
import { useSimulator } from '../hooks/useSimulator';
import { QuoteSummary } from './QuoteSummary';
import { UsageControls } from './UsageControls';

/** Carga cliente y catálogo; el simulador se monta cuando ambos están disponibles. */
export function SimulatorPage() {
  const id = Number(useParams().id);
  const catalog = useCatalog();
  const customer = useResource((signal) => getCustomer(id, signal), [id]);

  if (customer.status === 'loading' || catalog.status === 'loading') return <LoadingState />;
  if (customer.status === 'error') return <ErrorState message={customer.error.message} onRetry={customer.retry} />;
  if (catalog.status === 'error') return <ErrorState message={catalog.error.message} onRetry={catalog.retry} />;
  return <Simulator customer={customer.data} catalog={catalog.data} />;
}

function Simulator({ customer, catalog }: { customer: Customer; catalog: Catalog }) {
  const navigate = useNavigate();
  const { formatCents } = useCurrency();
  const taxRate = catalog.taxRates.find((r) => r.countryCode === customer.countryCode);
  const plan = catalog.plans.find((p) => p.code === customer.planCode);
  const sim = useSimulator({
    customerId: customer.id,
    tiers: catalog.pricingTiers,
    taxPercent: taxRate?.ratePercent ?? 0,
    plan,
  });

  const onSave = async () => {
    if (await sim.save()) {
      navigate(`/customers/${customer.id}`, { state: { flash: 'Simulación guardada en el historial.' } });
    }
  };

  return (
    <>
      <PageHeading title={`Simulación para ${customer.companyName}`} />
      <p>
        País: {taxRate?.countryName ?? customer.countryCode} · Plan: {plan?.name ?? customer.planCode}
      </p>
      <div className="simulator">
        <UsageControls
          inputs={sim.inputs}
          users={sim.users}
          totalLabel={formatCents(sim.quote.totalCents)}
          errors={sim.errors}
          onUsers={sim.setUsers}
          onStorage={sim.setStorage}
          onApiCalls={sim.setApiCalls}
        />
        <div>
          <QuoteSummary quote={sim.quote} />
          <div role="status">
            {sim.warnings.map((warning) => (
              <Notice key={warning}>{warning} Puedes guardar igualmente.</Notice>
            ))}
          </div>
          {sim.saveError && <ErrorState message={sim.saveError} onRetry={() => void onSave()} />}
          <div className="form__actions">
            <button type="button" className="button" disabled={!sim.canSave} onClick={() => void onSave()}>
              {sim.saving ? 'Guardando…' : 'Guardar simulación'}
            </button>
            <button type="button" className="button button--secondary" onClick={() => navigate(`/customers/${customer.id}`)}>
              Volver al cliente
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
