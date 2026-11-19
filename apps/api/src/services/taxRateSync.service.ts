import { z } from 'zod';
import { EU_COUNTRY_CODES } from '../db/seedData/taxRates';
import type { TaxRatesRepository, TaxRateUpdate } from '../repositories/taxRates.repository';

/** Solo nos interesan estos campos de la respuesta de VATcomply (el resto se ignora). */
const vatComplySchema = z.array(
  z.object({
    country_code: z.string().length(2),
    standard_rate: z.number().min(0).max(100),
    currency: z.string().length(3),
  }),
);

/** VATcomply usa el código ISO de IVA de la UE; Grecia es `EL` en IVA y `GR` en ISO 3166. */
const toIsoCountry = (code: string): string => (code.toUpperCase() === 'EL' ? 'GR' : code.toUpperCase());

export type SyncResult = { ok: true; updated: number } | { ok: false; reason: string };

export interface TaxRateSyncOptions {
  url: string;
  timeoutMs: number;
  fetchFn?: typeof fetch;
  logger?: Pick<Console, 'info' | 'warn'>;
  now?: () => Date;
}

/**
 * Sincroniza el tipo estándar de IVA de los 27 países de la UE. Si VATcomply falla, no responde a tiempo
 * o devuelve datos inesperados, se registra el aviso y se sigue con lo que hay en la BD.
 */
export function createTaxRateSyncService(taxRates: TaxRatesRepository, options: TaxRateSyncOptions) {
  const fetchFn = options.fetchFn ?? fetch;
  const logger = options.logger ?? console;
  const now = options.now ?? (() => new Date());

  async function download(): Promise<TaxRateUpdate[]> {
    const response = await fetchFn(options.url, { signal: AbortSignal.timeout(options.timeoutMs) });
    if (!response.ok) throw new Error(`VATcomply respondió con estado ${response.status}`);
    const payload = vatComplySchema.parse(await response.json());
    const updatedAt = now().toISOString();

    return payload
      .map((entry) => ({ ...entry, country_code: toIsoCountry(entry.country_code) }))
      .filter((entry) => EU_COUNTRY_CODES.has(entry.country_code))
      .map((entry) => ({
        countryCode: entry.country_code,
        ratePercent: entry.standard_rate,
        currency: entry.currency.toUpperCase(),
        source: 'api' as const,
        updatedAt,
      }));
  }

  async function sync(): Promise<SyncResult> {
    try {
      const updates = await download();
      const updated = taxRates.updateMany(updates);
      logger.info(`IVA sincronizado con VATcomply: ${updated} países de la UE actualizados.`);
      return { ok: true, updated };
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      logger.warn(`No se pudo sincronizar el IVA con VATcomply; se usan los datos guardados. Motivo: ${reason}`);
      return { ok: false, reason };
    }
  }

  return {
    sync,
    /** Sincroniza ahora y cada `intervalMs`. Devuelve una función para parar la programación. */
    schedule(intervalMs: number): () => void {
      void sync();
      const timer = setInterval(() => void sync(), intervalMs);
      timer.unref();
      return () => clearInterval(timer);
    },
  };
}

export type TaxRateSyncService = ReturnType<typeof createTaxRateSyncService>;
