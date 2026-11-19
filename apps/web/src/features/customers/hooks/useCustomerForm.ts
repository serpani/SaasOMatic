import type { CreateCustomerInput } from '@saasomatic/shared';
import { useState } from 'react';
import { ApiError } from '../../../shared/http/apiClient';
import { createCustomer } from '../api/customersApi';
import { type CustomerField, describeTaxId, type FieldErrors, validateCustomer } from './customerValidation';

export type { CustomerField, FieldErrors } from './customerValidation';

const EMPTY: CreateCustomerInput = { companyName: '', taxId: '', email: '', countryCode: '', planCode: '' };

/**
 * Estado del alta de cliente. Cada campo con contenido se valida al salir de él y, desde entonces, en cada
 * cambio; el identificador fiscal se vuelve a comprobar si cambia el país. Al guardar se validan todos.
 */
export function useCustomerForm(onCreated: (id: number) => void) {
  const [values, setValues] = useState<CreateCustomerInput>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<ReadonlySet<CustomerField>>(new Set());
  const [formError, setFormError] = useState<string | null>(null);
  const [existingId, setExistingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [attempt, setAttempt] = useState(0);

  /** Recalcula el error de los campos indicados con los valores dados. */
  const revalidate = (next: CreateCustomerInput, fields: CustomerField[]) => {
    const all = validateCustomer(next);
    setErrors((prev) => ({ ...prev, ...Object.fromEntries(fields.map((f) => [f, all[f]])) }));
  };

  const setField = (field: CustomerField, value: string) => {
    const next = { ...values, [field]: value };
    setValues(next);
    if (field === 'taxId') setExistingId(null);
    const live = [field, ...(field === 'countryCode' ? (['taxId'] as const) : [])].filter((f) => touched.has(f));
    if (live.length > 0) revalidate(next, live);
    else setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  /** Valida al salir del campo, salvo si está vacío: «es obligatorio» se indica al pulsar Guardar. */
  const blur = (field: CustomerField) => {
    if (!values[field].trim()) return;
    setTouched((prev) => new Set(prev).add(field));
    revalidate(values, [field]);
  };

  async function submit(): Promise<void> {
    setFormError(null);
    setExistingId(null);
    setTouched(new Set(Object.keys(EMPTY) as CustomerField[]));
    const clientErrors = validateCustomer(values);
    setErrors(clientErrors);
    setAttempt((n) => n + 1);
    if (Object.keys(clientErrors).length > 0) return;

    setSubmitting(true);
    try {
      const customer = await createCustomer(values);
      onCreated(customer.id);
    } catch (error) {
      handleError(error);
      setAttempt((n) => n + 1);
    } finally {
      setSubmitting(false);
    }
  }

  function handleError(error: unknown): void {
    if (!(error instanceof ApiError)) {
      setFormError(error instanceof Error ? error.message : 'Ha ocurrido un error inesperado.');
      return;
    }
    if (error.code === 'CUSTOMER_ALREADY_EXISTS') {
      const details = error.details as { customerId?: number } | undefined;
      setErrors({ taxId: error.message });
      setExistingId(details?.customerId ?? null);
      return;
    }
    const fieldErrors = error.fieldErrors;
    if (fieldErrors.length === 0) {
      setFormError(error.message);
      return;
    }
    setErrors(Object.fromEntries(fieldErrors.map((e) => [e.field, e.message])) as FieldErrors);
  }

  const taxIdStatus = errors.taxId ? null : describeTaxId(values.taxId, values.countryCode);

  return { values, errors, taxIdStatus, formError, existingId, submitting, attempt, setField, blur, submit };
}
