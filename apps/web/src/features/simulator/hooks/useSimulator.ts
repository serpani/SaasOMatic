import {
  calculateQuote,
  getPlanWarnings,
  isValidActiveUsers,
  type Plan,
  type PricingTier,
  type Quote,
} from '@saasomatic/shared';
import { useMemo, useState } from 'react';
import { createSimulation } from '../api/simulationsApi';

const parseInteger = (text: string): number | null => (/^\d+$/.test(text.trim()) ? Number(text.trim()) : null);

export const USERS_ERROR = 'Indica un número entero de usuarios entre 1 y 10.000.';
export const STORAGE_ERROR = 'Indica un número entero de GB, 0 o mayor.';
export const API_CALLS_ERROR = 'Indica un número entero de llamadas, 0 o mayor.';

interface SimulatorConfig {
  customerId: number;
  tiers: readonly PricingTier[];
  taxPercent: number;
  plan: Plan | undefined;
}

/**
 * Estado del simulador. La factura se recalcula en cada cambio con la misma lógica que el backend
 * (`@saasomatic/shared`); al guardar, el backend la vuelve a calcular y es la cifra que queda registrada.
 */
export function useSimulator({ customerId, tiers, taxPercent, plan }: SimulatorConfig) {
  const [usersText, setUsersText] = useState('10');
  const [storageText, setStorageText] = useState('0');
  const [apiCallsText, setApiCallsText] = useState('0');
  const [lastValidUsers, setLastValidUsers] = useState(10);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const users = parseInteger(usersText);
  const usersValid = users !== null && isValidActiveUsers(users);
  const storageGb = parseInteger(storageText);
  const apiCalls = parseInteger(apiCallsText);

  const setUsers = (text: string) => {
    setUsersText(text);
    const value = parseInteger(text);
    if (value !== null && isValidActiveUsers(value)) setLastValidUsers(value);
  };

  const quote: Quote = useMemo(
    () => calculateQuote(lastValidUsers, tiers, taxPercent),
    [lastValidUsers, tiers, taxPercent],
  );

  const warnings =
    plan && storageGb !== null && apiCalls !== null ? getPlanWarnings({ storageGb, apiCalls }, plan) : [];

  const errors = {
    users: usersValid ? undefined : USERS_ERROR,
    storageGb: storageGb === null ? STORAGE_ERROR : undefined,
    apiCalls: apiCalls === null ? API_CALLS_ERROR : undefined,
  };
  const canSave = usersValid && storageGb !== null && apiCalls !== null && !saving;

  async function save(): Promise<boolean> {
    if (!canSave) return false;
    setSaving(true);
    setSaveError(null);
    try {
      await createSimulation({ customerId, activeUsers: lastValidUsers, storageGb, apiCalls });
      return true;
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'No se pudo guardar la simulación.');
      return false;
    } finally {
      setSaving(false);
    }
  }

  return {
    inputs: { usersText, storageText, apiCallsText },
    setUsers,
    setStorage: setStorageText,
    setApiCalls: setApiCallsText,
    users: lastValidUsers,
    quote,
    warnings,
    errors,
    canSave,
    saving,
    saveError,
    save,
  };
}
