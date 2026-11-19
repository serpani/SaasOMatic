import type { DashboardSummary } from '@saasomatic/shared';
import type { DashboardRepository } from '../repositories/dashboard.repository';

export function createDashboardService(dashboard: DashboardRepository) {
  return {
    /** Totales + importe medio por cliente con simulación (redondeado al céntimo). */
    getSummary(): DashboardSummary {
      const totals = dashboard.totals();
      const averageMonthlyCents =
        totals.customersWithSimulationsCount === 0
          ? 0
          : Math.round(totals.estimatedMonthlyCents / totals.customersWithSimulationsCount);
      return { ...totals, averageMonthlyCents, customersByPlan: dashboard.customersByPlan() };
    },
  };
}

export type DashboardService = ReturnType<typeof createDashboardService>;
