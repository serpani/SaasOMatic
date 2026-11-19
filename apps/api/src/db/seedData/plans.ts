import type { Plan } from '@saasomatic/shared';

/** Planes provisionales (decisión 4 de incongruencias): no cambian el precio, solo generan avisos. */
export const DEFAULT_PLANS: readonly Plan[] = [
  { code: 'basic', name: 'Basic', storageGb: 50, apiCalls: 10_000 },
  { code: 'pro', name: 'Pro', storageGb: 200, apiCalls: 100_000 },
  { code: 'enterprise', name: 'Enterprise', storageGb: 1_000, apiCalls: 1_000_000 },
];
