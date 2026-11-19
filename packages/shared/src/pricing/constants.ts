/** Rango admitido de usuarios activos por simulación (decisión 8 de incongruencias). */
export const MIN_ACTIVE_USERS = 1;
export const MAX_ACTIVE_USERS = 10_000;

export function isValidActiveUsers(value: number): boolean {
  return Number.isInteger(value) && value >= MIN_ACTIVE_USERS && value <= MAX_ACTIVE_USERS;
}
