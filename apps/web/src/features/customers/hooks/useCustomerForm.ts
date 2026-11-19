import { type CreateCustomerInput, validateTaxId } from '@saasomatic/shared';
import { useState } from 'react';
import { ApiError } from '../../../shared/http/apiClient';
import { createCustomer } from '../api/customersApi';

export type CustomerField = keyof CreateCustomerInput;
export type FieldErrors = Partial<Record<CustomerField, string>>;

const EMPTY: CreateCustomerInput = { companyName: '', taxId: '', email: '', countryCode: '', planCode: '' };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Validación inmediata en el navegador. El backend vuelve a validarlo todo (no se confía en el frontend). */
export function validateCustomer(values: CreateCustomerInput): FieldErrors {
  const errors: FieldErrors = {};
  if (!values.companyName.trim()) errors.companyName = 'Introduce el nombre de la empresa.';
  if (!values.email.trim()) errors.email = 'Introduce el email de contacto.';
  else if (!EMAIL.test(values.email.trim())) errors.email = 'El email de contacto no es válido.';
  if (!values.countryCode) errors.countryCode = 'Selecciona un país.';
  if (!values.planCode) errors.planCode = 'Selecciona un plan.';
  if (!values.taxId.trim()) errors.taxId = 'Introduce el identificador fiscal.';
  else if (values.countryCode) {
    const result = validateTaxId(values.taxId, values.countryCode);
    if (!result.valid) errors.taxId = result.message;
  }
  return errors;
}

export function useCustomerForm(onCreated: (id: number) => void) {
  const [values, setValues] = useState<CreateCustomerInput>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [existingId, setExistingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const setField = (field: CustomerField, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  async function submit(): Promise<void> {
    setFormError(null);
    setExistingId(null);
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

  return { values, errors, formError, existingId, submitting, attempt, setField, submit };
}
