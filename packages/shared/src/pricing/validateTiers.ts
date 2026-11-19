import type { PricingTier } from '../types';

/**
 * Comprueba que los tramos son utilizables: empiezan en 1, son contiguos, sin solapes,
 * con precios enteros positivos y un único tramo final sin tope.
 * Devuelve la lista de problemas encontrados (vacía si los tramos son válidos).
 */
export function validateTiers(tiers: readonly PricingTier[]): string[] {
  if (tiers.length === 0) return ['No hay tramos de precio definidos.'];

  const errors: string[] = [];
  const sorted = [...tiers].sort((a, b) => a.minUsers - b.minUsers);
  let expectedMin = 1;

  sorted.forEach((tier, index) => {
    const label = `Tramo ${index + 1}`;
    const isLast = index === sorted.length - 1;

    if (!Number.isInteger(tier.unitCents) || tier.unitCents <= 0) {
      errors.push(`${label}: el precio por usuario debe ser un entero positivo en céntimos.`);
    }
    if (tier.minUsers !== expectedMin) {
      errors.push(`${label}: debería empezar en ${expectedMin} usuarios y empieza en ${tier.minUsers}.`);
    }
    if (tier.maxUsers === null) {
      if (!isLast) errors.push(`${label}: solo el último tramo puede no tener tope.`);
      return;
    }
    if (!Number.isInteger(tier.maxUsers) || tier.maxUsers < tier.minUsers) {
      errors.push(`${label}: el máximo de usuarios debe ser mayor o igual que el mínimo.`);
    }
    if (isLast) errors.push(`${label}: el último tramo no debe tener tope de usuarios.`);
    expectedMin = tier.maxUsers + 1;
  });

  return errors;
}
