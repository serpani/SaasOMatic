import type { Simulation } from '@saasomatic/shared';
import { formatInteger } from '@saasomatic/shared';
import { Link } from 'react-router';
import { formatDateTime, formatPercent } from '../../../shared/format/formatters';
import { EmptyState } from '../../../shared/ui/StatusMessages';
import { useCurrency } from '../../currency/hooks/CurrencyContext';

/**
 * Historial de simulaciones guardadas, de la más reciente a la más antigua. El total mensual va destacado.
 * Cada tarjeta abre la simulación en el simulador, en solo lectura.
 */
export function SimulationHistory({ simulations }: { simulations: Simulation[] }) {
  const { formatCents } = useCurrency();

  if (simulations.length === 0) {
    return (
      <EmptyState>
        <p>Este cliente todavía no tiene simulaciones guardadas.</p>
      </EmptyState>
    );
  }

  return (
    <ol className="history">
      {simulations.map((s) => (
        <li key={s.id} className="card history__item">
          <div className="history__body">
            <h3 className="history__date">
              {/* El enlace se estira para que toda la tarjeta abra la simulación en solo lectura. */}
              <Link to={`/customers/${s.customerId}/simulations/${s.id}`} className="history__link">
                <span className="visually-hidden">Ver simulación del </span>
                <time dateTime={s.createdAt}>{formatDateTime(s.createdAt)}</time>
              </Link>
            </h3>
            <dl className="data-list data-list--grid">
              <div>
                <dt>Usuarios</dt>
                <dd>{formatInteger(s.activeUsers)}</dd>
              </div>
              <div>
                <dt>Almacenamiento</dt>
                <dd>{formatInteger(s.storageGb)} GB</dd>
              </div>
              <div>
                <dt>Llamadas API</dt>
                <dd>{formatInteger(s.apiCalls)}</dd>
              </div>
              <div>
                <dt>Coste base</dt>
                <dd>{formatCents(s.baseCents)}</dd>
              </div>
              <div>
                <dt>IVA ({formatPercent(s.taxPercent)})</dt>
                <dd>{formatCents(s.taxCents)}</dd>
              </div>
            </dl>
          </div>
          <dl className="history__total">
            <dt>Total mensual</dt>
            <dd>{formatCents(s.totalCents)}</dd>
          </dl>
        </li>
      ))}
    </ol>
  );
}
