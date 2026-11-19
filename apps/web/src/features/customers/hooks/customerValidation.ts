import { type CreateCustomerInput, type TaxIdType, validateTaxId } from '@saasomatic/shared';
import type { FieldStatus } from '../../../shared/ui/FormField';

export type CustomerField = keyof CreateCustomerInput;
export type FieldErrors = Partial<Record<CustomerField, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Validación en el navegador. El backend vuelve a validarlo todo (no se confía en el frontend). */
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

const TYPE_LABEL: Readonly<Record<TaxIdType, string>> = {
  DNI: 'DNI',
  NIE: 'NIE',
  NIF_KLM: 'NIF (tipo K, L o M)',
  CIF: 'CIF',
  OTHER: 'Identificador fiscal',
};

/**
 * Confirmación visible del identificador fiscal mientras se escribe: qué tipo se ha detectado y cómo
 * se guardará. `null` si no hay nada que confirmar (vacío o con error, que se muestra aparte).
 */
export function describeTaxId(taxId: string, countryCode: string): FieldStatus | null {
  if (!taxId.trim()) return null;
  if (!countryCode) return { tone: 'info', message: 'Selecciona el país para comprobar el identificador fiscal.' };

  const result = validateTaxId(taxId, countryCode);
  if (!result.valid) return null;
  const saved = `Se guardará como ${result.normalized}.`;
  const message =
    result.type === 'OTHER'
      ? `formato válido. Fuera de España solo se comprueba el formato. ${saved}`
      : `${TYPE_LABEL[result.type]} válido, carácter de control correcto. ${saved}`;
  return { tone: 'success', message };
}
