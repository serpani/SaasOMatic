import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { useCatalog } from '../../../shared/catalog/CatalogContext';
import { formatCurrency } from '../../../shared/format/formatters';
import { type ExchangeRatesState, useExchangeRates } from './useExchangeRates';

const BASE_CURRENCIES = ['EUR', 'USD', 'GBP'];
const SELECTED_KEY = 'saasomatic.currency';

interface CurrencyContextValue extends ExchangeRatesState {
  /** Divisa elegida por el usuario. */
  selected: string;
  /** Divisa en la que realmente se muestra (EUR si no hay tipo de cambio para la elegida). */
  displayCurrency: string;
  currencies: string[];
  select: (currency: string) => void;
  /** Convierte céntimos de euro a la divisa mostrada y los formatea. Solo visualización. */
  formatCents: (cents: number) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

const readSelected = (): string => {
  try {
    return localStorage.getItem(SELECTED_KEY) ?? 'EUR';
  } catch {
    return 'EUR';
  }
};

export function CurrencyProvider({ children, now }: { children: ReactNode; now?: () => number }) {
  const ratesState = useExchangeRates(now);
  const catalog = useCatalog();
  const [selected, setSelected] = useState(readSelected);

  const currencies = useMemo(() => {
    const local = catalog.data?.taxRates.map((rate) => rate.currency) ?? [];
    const all = [...new Set([...BASE_CURRENCIES, ...local])];
    const rates = ratesState.rates?.rates;
    return rates ? all.filter((code) => code === 'EUR' || rates[code] !== undefined) : all;
  }, [catalog.data, ratesState.rates]);

  const rate = ratesState.rates?.rates[selected];
  const displayCurrency = rate === undefined ? 'EUR' : selected;

  const select = useCallback((currency: string) => {
    setSelected(currency);
    try {
      localStorage.setItem(SELECTED_KEY, currency);
    } catch {
      // Preferencia no persistente: no pasa nada.
    }
  }, []);

  const formatCents = useCallback(
    (cents: number) => formatCurrency((cents / 100) * (rate ?? 1), displayCurrency),
    [rate, displayCurrency],
  );

  const value = { ...ratesState, selected, displayCurrency, currencies, select, formatCents };
  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextValue {
  const value = useContext(CurrencyContext);
  if (!value) throw new Error('useCurrency debe usarse dentro de <CurrencyProvider>');
  return value;
}
