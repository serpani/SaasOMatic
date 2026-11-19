import { formatInteger } from '@saasomatic/shared';
import { useResource } from '../../../shared/hooks/useResource';
import { ErrorState, LoadingState } from '../../../shared/ui/StatusMessages';
import { useCurrency } from '../../currency/hooks/CurrencyContext';
import { getDashboard } from '../api/dashboardApi';

/**
 * Resumen comercial sobre el buscador. La facturación estimada suma la última simulación de cada cliente
 * (su presupuesto vigente) y se muestra en la divisa seleccionada.
 */
export function DashboardSummary() {
  const summary = useResource(getDashboard, []);
  const { formatCents } = useCurrency();

  return (
    <section className="dashboard" aria-labelledby="dashboard-title" aria-busy={summary.status === 'loading'}>
      <h2 id="dashboard-title" className="dashboard__title">
        Resumen
      </h2>
      {summary.status === 'loading' && <LoadingState label="Cargando resumen…" />}
      {summary.status === 'error' && <ErrorState message={summary.error.message} onRetry={summary.retry} />}
      {summary.status === 'success' && (
        <>
          <dl className="kpis">
            <div className="kpi">
              <dt>Clientes</dt>
              <dd>{formatInteger(summary.data.customersCount)}</dd>
            </div>
            <div className="kpi">
              <dt>Simulaciones guardadas</dt>
              <dd>{formatInteger(summary.data.simulationsCount)}</dd>
            </div>
            <div className="kpi kpi--highlight">
              <dt>Facturación mensual estimada</dt>
              <dd>
                {formatCents(summary.data.estimatedMonthlyCents)}
                <span className="kpi__note">
                  Última simulación de {formatInteger(summary.data.customersWithSimulationsCount)} clientes
                </span>
              </dd>
            </div>
            <div className="kpi">
              <dt>Media por cliente</dt>
              <dd>{formatCents(summary.data.averageMonthlyCents)}</dd>
            </div>
          </dl>
          <p className="dashboard__plans">
            <span>Clientes por plan:</span>{' '}
            {summary.data.customersByPlan.map((p) => `${p.planName} ${formatInteger(p.customers)}`).join(' · ')}
          </p>
        </>
      )}
    </section>
  );
}
