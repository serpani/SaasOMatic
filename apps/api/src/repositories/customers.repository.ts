import type { CreateCustomerInput, Customer } from '@saasomatic/shared';
import { type Db, searchNormalize } from '../db/connection';

interface CustomerRow {
  id: number;
  company_name: string;
  tax_id: string;
  email: string;
  country_code: string;
  plan_code: string;
  created_at: string;
}

export interface CustomerSearch {
  /** Texto ya normalizado para comparar con el nombre (minúsculas, sin tildes). */
  nameTerm: string;
  /** Texto normalizado como identificador fiscal (mayúsculas, sin espacios ni guiones). */
  taxIdTerm: string;
  page: number;
  pageSize: number;
}

const toCustomer = (row: CustomerRow): Customer => ({
  id: row.id,
  companyName: row.company_name,
  taxId: row.tax_id,
  email: row.email,
  countryCode: row.country_code,
  planCode: row.plan_code,
  createdAt: row.created_at,
});

/** Escapa los comodines de LIKE para que '%' o '_' se busquen como texto literal. */
const likeContains = (term: string): string => `%${term.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

interface SearchParams {
  nameTerm: string;
  taxIdTerm: string;
  namePattern: string;
  taxIdPattern: string;
}

interface PageParams extends SearchParams {
  limit: number;
  offset: number;
}

const SEARCH_WHERE = `
  (@nameTerm = '' AND @taxIdTerm = '')
  OR (@nameTerm <> '' AND search_normalize(company_name) LIKE @namePattern ESCAPE '\\')
  OR (@taxIdTerm <> '' AND tax_id LIKE @taxIdPattern ESCAPE '\\')`;

export function createCustomersRepository(db: Db) {
  const insert = db.prepare(
    `INSERT INTO customers (company_name, tax_id, email, country_code, plan_code, created_at)
     VALUES (@companyName, @taxId, @email, @countryCode, @planCode, @createdAt)`,
  );
  const byId = db.prepare<[number], CustomerRow>('SELECT * FROM customers WHERE id = ?');
  const byTaxId = db.prepare<[string], CustomerRow>('SELECT * FROM customers WHERE tax_id = ?');
  const count = db.prepare<[SearchParams], number>(`SELECT COUNT(*) FROM customers WHERE ${SEARCH_WHERE}`).pluck();
  const page = db.prepare<[PageParams], CustomerRow>(
    `SELECT * FROM customers WHERE ${SEARCH_WHERE}
     ORDER BY company_name COLLATE NOCASE, id LIMIT @limit OFFSET @offset`,
  );

  return {
    insert(input: CreateCustomerInput, createdAt: string): Customer {
      const { lastInsertRowid } = insert.run({ ...input, createdAt });
      return { id: Number(lastInsertRowid), ...input, createdAt };
    },
    findById: (id: number): Customer | undefined => {
      const row = byId.get(id);
      return row ? toCustomer(row) : undefined;
    },
    findByTaxId: (taxId: string): Customer | undefined => {
      const row = byTaxId.get(taxId);
      return row ? toCustomer(row) : undefined;
    },
    search(search: CustomerSearch): { items: Customer[]; total: number } {
      const params: SearchParams = {
        nameTerm: searchNormalize(search.nameTerm),
        taxIdTerm: search.taxIdTerm,
        namePattern: likeContains(searchNormalize(search.nameTerm)),
        taxIdPattern: likeContains(search.taxIdTerm),
      };
      const total = count.get(params) ?? 0;
      const rows = page.all({ ...params, limit: search.pageSize, offset: (search.page - 1) * search.pageSize });
      return { items: rows.map(toCustomer), total };
    },
  };
}

export type CustomersRepository = ReturnType<typeof createCustomersRepository>;
