import type { DashboardSummary, PlanCustomers } from '@saasomatic/shared';
import type { Db } from '../db/connection';

interface TotalsRow {
  customers_count: number;
  simulations_count: number;
  customers_with_simulations_count: number;
  estimated_monthly_cents: number;
}

export type DashboardTotals = Omit<DashboardSummary, 'averageMonthlyCents' | 'customersByPlan'>;

interface PlanRow {
  plan_code: string;
  plan_name: string;
  customers: number;
}

/** Agregados para el dashboard. El total estimado usa la última simulación de cada cliente. */
export function createDashboardRepository(db: Db) {
  const totals = db.prepare<[], TotalsRow>(`
    SELECT
      (SELECT COUNT(*) FROM customers) AS customers_count,
      (SELECT COUNT(*) FROM simulations) AS simulations_count,
      (SELECT COUNT(DISTINCT customer_id) FROM simulations) AS customers_with_simulations_count,
      (SELECT COALESCE(SUM(s.total_cents), 0) FROM simulations s
        WHERE s.id = (SELECT s2.id FROM simulations s2 WHERE s2.customer_id = s.customer_id
                      ORDER BY s2.created_at DESC, s2.id DESC LIMIT 1)) AS estimated_monthly_cents
  `);
  const byPlan = db.prepare<[], PlanRow>(`
    SELECT p.code AS plan_code, p.name AS plan_name, COUNT(c.id) AS customers
    FROM plans p LEFT JOIN customers c ON c.plan_code = p.code
    GROUP BY p.code, p.name
    ORDER BY p.storage_gb, p.code
  `);

  return {
    totals(): DashboardTotals {
      const row = totals.get();
      if (!row) throw new Error('No se pudo calcular el resumen.');
      return {
        customersCount: row.customers_count,
        simulationsCount: row.simulations_count,
        customersWithSimulationsCount: row.customers_with_simulations_count,
        estimatedMonthlyCents: row.estimated_monthly_cents,
      };
    },
    customersByPlan: (): PlanCustomers[] =>
      byPlan.all().map((r) => ({ planCode: r.plan_code, planName: r.plan_name, customers: r.customers })),
  };
}

export type DashboardRepository = ReturnType<typeof createDashboardRepository>;
