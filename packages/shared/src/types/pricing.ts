/** Tramo de precio por usuario. `maxUsers = null` indica el tramo final sin tope. */
export interface PricingTier {
  minUsers: number;
  maxUsers: number | null;
  unitCents: number;
}

/** Tramo tal y como se guarda en BD y lo devuelve `GET /pricing-tiers`. */
export interface PricingTierRecord extends PricingTier {
  id: number;
}

/** Parte del coste base que corresponde a un tramo concreto. */
export interface TierBreakdownItem {
  minUsers: number;
  maxUsers: number | null;
  users: number;
  unitCents: number;
  subtotalCents: number;
}

export interface BaseCostResult {
  baseCents: number;
  tierBreakdown: TierBreakdownItem[];
}

/** Factura mensual completa: coste base + IVA. Todos los importes en céntimos de euro. */
export interface Quote extends BaseCostResult {
  taxPercent: number;
  taxCents: number;
  totalCents: number;
}
