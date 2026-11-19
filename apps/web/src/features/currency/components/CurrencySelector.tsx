import { useId } from 'react';
import { useCurrency } from '../hooks/CurrencyContext';

/** Selector de divisa de visualización (cabecera). Los importes se guardan siempre en euros. */
export function CurrencySelector() {
  const { selected, currencies, select, status } = useCurrency();
  const id = useId();

  return (
    <div className="currency-selector">
      <label htmlFor={id}>Divisa</label>
      <select id={id} value={selected} onChange={(event) => select(event.target.value)}>
        {currencies.map((code) => (
          <option key={code} value={code}>
            {code}
          </option>
        ))}
      </select>
      {status === 'loading' && (
        <span className="currency-selector__loading" role="status">
          <span className="spinner" aria-hidden="true" />
          <span className="visually-hidden">Cargando tipos de cambio…</span>
        </span>
      )}
    </div>
  );
}
