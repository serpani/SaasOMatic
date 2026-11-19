import type { Plan } from '../types';
import { formatInteger } from './formatNumber';

export interface PlanUsage {
  storageGb: number;
  apiCalls: number;
}

/**
 * Avisos legibles cuando el uso estimado supera lo incluido en el plan (decisión 5 de incongruencias).
 * No bloquean la simulación ni cambian el precio. Usado por la API (`planWarnings`) y por el simulador.
 */
export function getPlanWarnings(usage: PlanUsage, plan: Plan): string[] {
  const warnings: string[] = [];

  if (usage.storageGb > plan.storageGb) {
    warnings.push(
      `El almacenamiento estimado (${formatInteger(usage.storageGb)} GB) supera los ` +
        `${formatInteger(plan.storageGb)} GB incluidos en el plan ${plan.name}.`,
    );
  }
  if (usage.apiCalls > plan.apiCalls) {
    warnings.push(
      `Las llamadas a la API estimadas (${formatInteger(usage.apiCalls)}) superan las ` +
        `${formatInteger(plan.apiCalls)} incluidas en el plan ${plan.name}.`,
    );
  }

  return warnings;
}
