import { type FormEvent, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { useCatalog } from '../../../shared/catalog/CatalogContext';
import { formatInteger } from '@saasomatic/shared';
import { FormField } from '../../../shared/ui/FormField';
import { PageHeading } from '../../../shared/ui/PageHeading';
import { ErrorState, LoadingState } from '../../../shared/ui/StatusMessages';
import { useCustomerForm } from '../hooks/useCustomerForm';

/** Alta de cliente. País y plan se cargan desde la API (solo países con IVA conocido). */
export function NewCustomerPage() {
  const navigate = useNavigate();
  const catalog = useCatalog();
  const formRef = useRef<HTMLFormElement>(null);
  const form = useCustomerForm((id) =>
    navigate(`/customers/${id}`, { state: { flash: 'Cliente dado de alta correctamente.' } }),
  );
  const { values, errors, setField, blur } = form;

  // Tras un envío con errores, el foco va al primer campo que hay que corregir.
  useEffect(() => {
    if (form.attempt > 0) formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [form.attempt]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void form.submit();
  };

  return (
    <>
      <PageHeading title="Nuevo cliente" />
      {catalog.status === 'loading' && <LoadingState label="Cargando países y planes…" />}
      {catalog.status === 'error' && <ErrorState message={catalog.error.message} onRetry={catalog.retry} />}
      {catalog.status === 'success' && (
        <form ref={formRef} className="card form" onSubmit={onSubmit} noValidate>
          {form.formError && <ErrorState message={form.formError} />}
          <div className="form__grid">
            <FormField label="Nombre de la empresa" error={errors.companyName} className="field--full">
              <input value={values.companyName} onChange={(e) => setField('companyName', e.target.value)} onBlur={() => blur('companyName')} autoComplete="organization" required />
            </FormField>
            <FormField label="País" error={errors.countryCode} hint="Solo Unión Europea, Reino Unido y Estados Unidos.">
              <select value={values.countryCode} onChange={(e) => setField('countryCode', e.target.value)} onBlur={() => blur('countryCode')} required>
                <option value="">Selecciona un país</option>
                {catalog.data.taxRates.map((r) => (
                  <option key={r.countryCode} value={r.countryCode}>
                    {r.countryName}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField
              label="Identificador fiscal"
              error={errors.taxId}
              status={form.taxIdStatus}
              hint="En España se comprueba la letra o dígito de control de DNI, NIE, NIF (K, L, M) y CIF."
            >
              <input value={values.taxId} onChange={(e) => setField('taxId', e.target.value)} onBlur={() => blur('taxId')} autoComplete="off" required />
            </FormField>
            {form.existingId !== null && (
              <p className="field--full">
                <Link to={`/customers/${form.existingId}`}>Ver el cliente existente</Link>
              </p>
            )}
            <FormField label="Email de contacto" error={errors.email}>
              <input type="email" value={values.email} onChange={(e) => setField('email', e.target.value)} onBlur={() => blur('email')} autoComplete="email" required />
            </FormField>
            <FormField label="Plan" error={errors.planCode}>
              <select value={values.planCode} onChange={(e) => setField('planCode', e.target.value)} onBlur={() => blur('planCode')} required>
                <option value="">Selecciona un plan</option>
                {catalog.data.plans.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name} ({formatInteger(p.storageGb)} GB, {formatInteger(p.apiCalls)} llamadas/mes)
                  </option>
                ))}
              </select>
            </FormField>
          </div>
          <div className="form__actions form__actions--end">
            <button type="submit" className="button" disabled={form.submitting}>
              {form.submitting ? 'Guardando…' : 'Guardar'}
            </button>
            <Link to="/" className="button button--secondary">
              Cancelar
            </Link>
          </div>
        </form>
      )}
    </>
  );
}
