/**
 * Migraciones versionadas. Se aplican en orden y la versión actual se guarda en `PRAGMA user_version`.
 * Nunca modificar una migración ya publicada: añadir una nueva.
 */
export interface Migration {
  version: number;
  name: string;
  sql: string;
}

export const MIGRATIONS: readonly Migration[] = [
  {
    version: 1,
    name: 'esquema inicial',
    sql: `
      CREATE TABLE plans (
        code        TEXT PRIMARY KEY,
        name        TEXT NOT NULL,
        storage_gb  INTEGER NOT NULL CHECK (storage_gb >= 0),
        api_calls   INTEGER NOT NULL CHECK (api_calls >= 0)
      );

      CREATE TABLE tax_rates (
        country_code  TEXT PRIMARY KEY CHECK (length(country_code) = 2),
        country_name  TEXT NOT NULL,
        rate_type     TEXT NOT NULL,
        rate_percent  REAL NOT NULL CHECK (rate_percent >= 0 AND rate_percent <= 100),
        currency      TEXT NOT NULL CHECK (length(currency) = 3),
        source        TEXT NOT NULL CHECK (source IN ('api', 'manual')),
        updated_at    TEXT NOT NULL
      );

      CREATE TABLE pricing_tiers (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        min_users   INTEGER NOT NULL CHECK (min_users >= 1),
        max_users   INTEGER CHECK (max_users IS NULL OR max_users >= min_users),
        unit_cents  INTEGER NOT NULL CHECK (unit_cents > 0)
      );

      CREATE TABLE customers (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        company_name  TEXT NOT NULL,
        tax_id        TEXT NOT NULL UNIQUE,
        email         TEXT NOT NULL,
        country_code  TEXT NOT NULL REFERENCES tax_rates (country_code),
        plan_code     TEXT NOT NULL REFERENCES plans (code),
        created_at    TEXT NOT NULL
      );

      CREATE TABLE simulations (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id     INTEGER NOT NULL REFERENCES customers (id) ON DELETE CASCADE,
        active_users    INTEGER NOT NULL CHECK (active_users BETWEEN 1 AND 10000),
        storage_gb      INTEGER NOT NULL CHECK (storage_gb >= 0),
        api_calls       INTEGER NOT NULL CHECK (api_calls >= 0),
        base_cents      INTEGER NOT NULL CHECK (base_cents >= 0),
        tax_percent     REAL NOT NULL CHECK (tax_percent >= 0 AND tax_percent <= 100),
        tax_cents       INTEGER NOT NULL CHECK (tax_cents >= 0),
        total_cents     INTEGER NOT NULL CHECK (total_cents = base_cents + tax_cents),
        tier_breakdown  TEXT NOT NULL CHECK (json_valid(tier_breakdown)),
        created_at      TEXT NOT NULL
      );

      CREATE INDEX idx_simulations_customer ON simulations (customer_id, created_at DESC);
      CREATE INDEX idx_customers_company_name ON customers (company_name);
    `,
  },
];
