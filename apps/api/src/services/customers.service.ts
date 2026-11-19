import {
  normalizeTaxId,
  validateTaxId,
  type CreateCustomerInput,
  type Customer,
  type Paginated,
} from '@saasomatic/shared';
import { SqliteError } from 'better-sqlite3';
import { conflict, notFound, unprocessable } from '../errors/AppError';
import type { CatalogRepository } from '../repositories/catalog.repository';
import type { CustomersRepository } from '../repositories/customers.repository';
import type { TaxRatesRepository } from '../repositories/taxRates.repository';

export interface SearchCustomersQuery {
  q: string;
  page: number;
  pageSize: number;
}

const COUNTRY_NOT_SUPPORTED =
  'Solo se pueden registrar clientes de la Unión Europea, Reino Unido y Estados Unidos.';
const DUPLICATED = 'Ya existe un cliente con este identificador fiscal. Búscalo en el buscador.';

const duplicated = (customerId?: number) =>
  conflict('CUSTOMER_ALREADY_EXISTS', DUPLICATED, { field: 'taxId', customerId });

export function createCustomersService(
  customers: CustomersRepository,
  taxRates: TaxRatesRepository,
  catalog: CatalogRepository,
  now: () => Date = () => new Date(),
) {
  return {
    create(input: CreateCustomerInput): Customer {
      if (!taxRates.findByCountry(input.countryCode)) {
        throw unprocessable('COUNTRY_NOT_SUPPORTED', COUNTRY_NOT_SUPPORTED, [
          { field: 'countryCode', message: COUNTRY_NOT_SUPPORTED },
        ]);
      }
      if (!catalog.findPlanByCode(input.planCode)) {
        const message = 'El plan seleccionado no existe.';
        throw unprocessable('PLAN_NOT_FOUND', message, [{ field: 'planCode', message }]);
      }

      const taxId = validateTaxId(input.taxId, input.countryCode);
      if (!taxId.valid) {
        throw unprocessable(taxId.code, taxId.message, [{ field: 'taxId', message: taxId.message }]);
      }

      const existing = customers.findByTaxId(taxId.normalized);
      if (existing) throw duplicated(existing.id);

      try {
        return customers.insert({ ...input, taxId: taxId.normalized }, now().toISOString());
      } catch (error) {
        // Dos altas simultáneas con el mismo NIF: la restricción UNIQUE de la BD es la última barrera.
        if (error instanceof SqliteError && error.code === 'SQLITE_CONSTRAINT_UNIQUE') throw duplicated();
        throw error;
      }
    },

    getById(id: number): Customer {
      const customer = customers.findById(id);
      if (!customer) throw notFound('CUSTOMER_NOT_FOUND', 'No existe el cliente indicado.');
      return customer;
    },

    /** Búsqueda parcial sin distinguir mayúsculas ni tildes, por nombre o identificador fiscal. */
    search(query: SearchCustomersQuery): Paginated<Customer> {
      const { items, total } = customers.search({
        nameTerm: query.q,
        taxIdTerm: normalizeTaxId(query.q),
        page: query.page,
        pageSize: query.pageSize,
      });
      return { items, total, page: query.page, pageSize: query.pageSize };
    },
  };
}

export type CustomersService = ReturnType<typeof createCustomersService>;
