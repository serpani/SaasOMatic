import type { Simulation } from '@saasomatic/shared';
import { formatInteger } from '@saasomatic/shared';
import { formatDateTime, formatPercent } from '../../../shared/format/formatters';
import { EmptyState } from '../../../shared/ui/StatusMessages';
import { useCurrency } from '../../currency/hooks/CurrencyContext';

/** Historial de simulaciones guardadas, de la más reciente a la más antigua. */
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
          <h3 className="history__date">
            <time dateTime={s.createdAt}>{formatDateTime(s.createdAt)}</time>
          </h3>
          <dl className="data-list data-list--compact">
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
            <div className="data-list__total">
              <dt>Total mensual</dt>
              <dd>{formatCents(s.totalCents)}</dd>
            </div>
          </dl>
        </li>
      ))}
    </ol>
  );
}
