import { describe, expect, it } from 'vitest';
import { openDatabase } from '../src/db/connection';
import { migrate } from '../src/db/migrate';
import { seed } from '../src/db/seed';

describe('migraciones y datos iniciales', () => {
  it('las migraciones son idempotentes', () => {
    const db = openDatabase(':memory:');
    expect(migrate(db)).toEqual([1]);
    expect(migrate(db)).toEqual([]);
    expect(db.pragma('user_version', { simple: true })).toBe(1);
  });

  it('el seed es idempotente y no sobrescribe datos modificados', () => {
    const db = openDatabase(':memory:');
    migrate(db);
    seed(db);
    db.prepare("UPDATE tax_rates SET rate_percent = 22, source = 'api' WHERE country_code = 'ES'").run();
    db.prepare('UPDATE pricing_tiers SET unit_cents = 900 WHERE min_users = 1').run();

    seed(db);

    const count = (table: string) => db.prepare(`SELECT COUNT(*) FROM ${table}`).pluck().get();
    expect(count('plans')).toBe(3);
    expect(count('tax_rates')).toBe(29);
    expect(count('pricing_tiers')).toBe(3);
    expect(db.prepare("SELECT rate_percent FROM tax_rates WHERE country_code = 'ES'").pluck().get()).toBe(22);
    expect(db.prepare('SELECT unit_cents FROM pricing_tiers WHERE min_users = 1').pluck().get()).toBe(900);
  });

  it('las claves foráneas están activas', () => {
    const db = openDatabase(':memory:');
    migrate(db);
    const insert = () =>
      db
        .prepare(
          `INSERT INTO customers (company_name, tax_id, email, country_code, plan_code, created_at)
           VALUES ('X', 'X1', 'x@x.es', 'JP', 'basic', 'now')`,
        )
        .run();
    expect(insert).toThrow(/FOREIGN KEY/);
  });

  it('la BD rechaza una simulación con total incoherente', () => {
    const db = openDatabase(':memory:');
    migrate(db);
    seed(db);
    db.prepare(
      `INSERT INTO customers (company_name, tax_id, email, country_code, plan_code, created_at)
       VALUES ('X', 'X1', 'x@x.es', 'ES', 'basic', 'now')`,
    ).run();
    const insert = () =>
      db
        .prepare(
          `INSERT INTO simulations (customer_id, active_users, storage_gb, api_calls, base_cents, tax_percent,
             tax_cents, total_cents, tier_breakdown, created_at)
           VALUES (1, 1, 0, 0, 1000, 21, 210, 999, '[]', 'now')`,
        )
        .run();
    expect(insert).toThrow(/CHECK/);
  });
});
