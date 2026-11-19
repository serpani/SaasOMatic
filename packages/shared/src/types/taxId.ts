export type TaxIdType = 'DNI' | 'NIE' | 'CIF' | 'OTHER';

export type TaxIdErrorCode = 'TAX_ID_REQUIRED' | 'TAX_ID_INVALID_FORMAT' | 'TAX_ID_INVALID_CONTROL';

export type TaxIdValidation =
  | { valid: true; normalized: string; type: TaxIdType }
  | { valid: false; normalized: string; code: TaxIdErrorCode; message: string };
