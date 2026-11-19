import type { Customer } from '@saasomatic/shared';
import { Link } from 'react-router';
import { useCatalog } from '../../../shared/catalog/CatalogContext';

/** Tarjeta de resultado de búsqueda. Todo el título es el enlace al detalle. */
export function CustomerCard({ customer }: { customer: Customer }) {
  const { data } = useCatalog();
  const country = data?.taxRates.find((r) => r.countryCode === customer.countryCode)?.countryName;
  const plan = data?.plans.find((p) => p.code === customer.planCode)?.name;

  return (
    <article className="card customer-card">
      <h2 className="card__title">
        <Link to={`/customers/${customer.id}`}>{customer.companyName}</Link>
      </h2>
      <dl className="data-list">
        <div>
          <dt>Id. fiscal</dt>
          <dd>{customer.taxId}</dd>
        </div>
        <div>
          <dt>País</dt>
          <dd>{country ?? customer.countryCode}</dd>
        </div>
        <div>
          <dt>Plan</dt>
          <dd>{plan ?? customer.planCode}</dd>
        </div>
      </dl>
    </article>
  );
}
