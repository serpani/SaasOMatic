import { formatInteger, type Quote } from '@saasomatic/shared';
import { formatPercent } from '../../../shared/format/formatters';
import { useCurrency } from '../../currency/hooks/CurrencyContext';
import { TierBar } from './TierBar';

const tierLabel = (min: number, max: number | null) =>
  max === null ? `Desde ${formatInteger(min)}` : `${formatInteger(min)} a ${formatInteger(max)}`;

/** Proyección de la factura mensual: total destacado, IVA y desglose por tramos en la divisa seleccionada. */
export function QuoteSummary({ quote }: { quote: Quote }) {
  const { formatCents, displayCurrency } = useCurrency();

  return (
    <section className="card quote" aria-labelledby="quote-title">
      <h2 id="quote-title">Factura mensual estimada</h2>
      <div className="quote__summary">
        <dl className="quote__total">
          <dt>Total mensual</dt>
          <dd data-testid="quote-total">{formatCents(quote.totalCents)}</dd>
        </dl>
        <dl className="amounts">
          <div>
            <dt>Coste base</dt>
            <dd>{formatCents(quote.baseCents)}</dd>
          </div>
          <div>
            <dt>IVA ({formatPercent(quote.taxPercent)})</dt>
            <dd>{formatCents(quote.taxCents)}</dd>
          </div>
        </dl>
      </div>
      <TierBar tiers={quote.tierBreakdown} />
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
            {quote.tierBreakdown.map((t, index) => (
              <tr key={t.minUsers}>
                <th scope="row">
                  <span className={`tier-dot tier-dot--${index % 3}`} aria-hidden="true" />
                  {tierLabel(t.minUsers, t.maxUsers)}
                </th>
                <td>{formatInteger(t.users)}</td>
                <td>{formatCents(t.unitCents)}</td>
                <td>{formatCents(t.subtotalCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
