import { formatInteger, type Quote } from '@saasomatic/shared';
import { formatPercent } from '../../../shared/format/formatters';
import { useCurrency } from '../../currency/hooks/CurrencyContext';

const tierLabel = (min: number, max: number | null) =>
  max === null ? `Desde ${formatInteger(min)}` : `${formatInteger(min)} a ${formatInteger(max)}`;

/** Proyección de la factura mensual: desglose por tramos, IVA y total en la divisa seleccionada. */
export function QuoteSummary({ quote }: { quote: Quote }) {
  const { formatCents, displayCurrency } = useCurrency();

  return (
    <section className="card quote" aria-labelledby="quote-title">
      <h2 id="quote-title">Factura mensual estimada</h2>
      {/* Región desplazable en pantallas estrechas: enfocable para poder recorrerla con teclado (WCAG 2.1.1). */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
      <div className="table-scroll" role="region" aria-labelledby="breakdown-caption" tabIndex={0}>
        <table className="breakdown">
          <caption id="breakdown-caption">Desglose por tramos de usuarios (importes en {displayCurrency})</caption>
          <thead>
            <tr>
              <th scope="col">Tramo</th>
              <th scope="col">Usuarios</th>
              <th scope="col">Precio/usuario</th>
              <th scope="col">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {quote.tierBreakdown.map((t) => (
              <tr key={t.minUsers}>
                <th scope="row">{tierLabel(t.minUsers, t.maxUsers)}</th>
                <td>{formatInteger(t.users)}</td>
                <td>{formatCents(t.unitCents)}</td>
                <td>{formatCents(t.subtotalCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <dl className="data-list quote__totals">
        <div>
          <dt>Coste base</dt>
          <dd>{formatCents(quote.baseCents)}</dd>
        </div>
        <div>
          <dt>IVA ({formatPercent(quote.taxPercent)})</dt>
          <dd>{formatCents(quote.taxCents)}</dd>
        </div>
        <div className="data-list__total">
          <dt>Total mensual</dt>
          <dd data-testid="quote-total">{formatCents(quote.totalCents)}</dd>
        </div>
      </dl>
    </section>
  );
}
