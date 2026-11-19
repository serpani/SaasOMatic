import type { Customer } from '@saasomatic/shared';
import { Link } from 'react-router';
import { useCatalog } from '../../../shared/catalog/CatalogContext';
import { Avatar, CountryChip, PlanChip } from '../../../shared/ui/Identity';

/** Tarjeta de resultado de búsqueda. El enlace del título cubre toda la tarjeta para facilitar el clic. */
export function CustomerCard({ customer }: { customer: Customer }) {
  const { data } = useCatalog();
  const country = data?.taxRates.find((r) => r.countryCode === customer.countryCode)?.countryName;
  const plan = data?.plans.find((p) => p.code === customer.planCode)?.name;

  return (
    <article className="card customer-card">
      <div className="customer-card__head">
        <Avatar name={customer.companyName} />
        <div className="customer-card__id">
          <h2 className="card__title">
            <Link to={`/customers/${customer.id}`} className="customer-card__link">
              {customer.companyName}
            </Link>
          </h2>
          <p className="customer-card__taxid">
            <span className="visually-hidden">Id. fiscal: </span>
            <span className="mono">{customer.taxId}</span>
          </p>
        </div>
      </div>
      <dl className="customer-card__tags">
        <div>
          <dt className="visually-hidden">País</dt>
          <dd>
            <CountryChip>{country ?? customer.countryCode}</CountryChip>
          </dd>
        </div>
        <div>
          <dt className="visually-hidden">Plan</dt>
          <dd>
            <PlanChip code={customer.planCode}>{plan ?? customer.planCode}</PlanChip>
          </dd>
        </div>
      </dl>
    </article>
  );
}
