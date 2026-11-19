import { formatDateTime } from '../../../shared/format/formatters';
import { Notice } from '../../../shared/ui/StatusMessages';
import { useCurrency } from '../hooks/CurrencyContext';

/** Avisa cuando los tipos de cambio no están al día o no hay ninguno. La app sigue usable. */
export function CurrencyNotice() {
  const { status, rates, retry, selected, displayCurrency } = useCurrency();

  if (status === 'stale' && rates) {
    return (
      <div role="status">
        <Notice>
          Tipos de cambio no disponibles. Se usan los últimos guardados, del {formatDateTime(rates.fetchedAt)}.{' '}
          <button type="button" className="link-button" onClick={retry}>
            Reintentar
          </button>
        </Notice>
      </div>
    );
  }
  if (status === 'unavailable') {
    return (
      <div role="status">
        <Notice>
          Tipos de cambio no disponibles. Los importes se muestran en euros.{' '}
          <button type="button" className="link-button" onClick={retry}>
            Reintentar
          </button>
        </Notice>
      </div>
    );
  }
  if (selected !== displayCurrency && status === 'ready') {
    return (
      <div role="status">
        <Notice>No hay tipo de cambio para {selected}. Los importes se muestran en euros.</Notice>
      </div>
    );
  }
  return null;
}
