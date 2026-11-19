import type { Simulation, TierBreakdownItem } from '@saasomatic/shared';
import { z } from 'zod';
import type { Db } from '../db/connection';

interface SimulationRow {
  id: number;
  customer_id: number;
  active_users: number;
  storage_gb: number;
  api_calls: number;
  base_cents: number;
  tax_percent: number;
  tax_cents: number;
  total_cents: number;
  tier_breakdown: string;
  created_at: string;
}

export type NewSimulation = Omit<Simulation, 'id'>;

/** El desglose se guarda como JSON: se valida al leerlo para no propagar datos corruptos. */
const tierBreakdownSchema = z.array(
  z.object({
    minUsers: z.number().int(),
    maxUsers: z.number().int().nullable(),
    users: z.number().int(),
    unitCents: z.number().int(),
    subtotalCents: z.number().int(),
  }),
);

const parseBreakdown = (json: string): TierBreakdownItem[] => tierBreakdownSchema.parse(JSON.parse(json));

const toSimulation = (row: SimulationRow): Simulation => ({
  id: row.id,
  customerId: row.customer_id,
  activeUsers: row.active_users,
  storageGb: row.storage_gb,
  apiCalls: row.api_calls,
  baseCents: row.base_cents,
  taxPercent: row.tax_percent,
  taxCents: row.tax_cents,
  totalCents: row.total_cents,
  tierBreakdown: parseBreakdown(row.tier_breakdown),
  createdAt: row.created_at,
});

export function createSimulationsRepository(db: Db) {
  const insert = db.prepare(
    `INSERT INTO simulations (customer_id, active_users, storage_gb, api_calls, base_cents, tax_percent,
       tax_cents, total_cents, tier_breakdown, created_at)
     VALUES (@customerId, @activeUsers, @storageGb, @apiCalls, @baseCents, @taxPercent,
       @taxCents, @totalCents, @tierBreakdown, @createdAt)`,
  );
  const byId = db.prepare<[number], SimulationRow>('SELECT * FROM simulations WHERE id = ?');
  const byCustomer = db.prepare<[number], SimulationRow>(
    'SELECT * FROM simulations WHERE customer_id = ? ORDER BY created_at DESC, id DESC',
  );

  return {
    /** Guarda una foto inmutable del cálculo y la devuelve tal y como ha quedado en BD. */
    insert(simulation: NewSimulation): Simulation {
      const { lastInsertRowid } = insert.run({
        ...simulation,
        tierBreakdown: JSON.stringify(simulation.tierBreakdown),
      });
      const row = byId.get(Number(lastInsertRowid));
      if (!row) throw new Error('No se pudo leer la simulación recién guardada.');
      return toSimulation(row);
    },
    findByCustomer: (customerId: number): Simulation[] => byCustomer.all(customerId).map(toSimulation),
  };
}

export type SimulationsRepository = ReturnType<typeof createSimulationsRepository>;
