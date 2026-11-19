import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTaxRateSyncService, type TaxRateSyncOptions } from '../src/services/taxRateSync.service';
import { createTestContext } from './helpers';

const NOW = new Date('2026-11-19T10:00:00.000Z');
const silentLogger = { info: vi.fn(), warn: vi.fn() };

beforeEach(() => {
  vi.clearAllMocks();
});

const jsonResponse = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));

function setup(fetchFn: TaxRateSyncOptions['fetchFn'], timeoutMs = 1_000) {
  const ctx = createTestContext();
  const repo = ctx.container.taxRatesRepository;
  const service = createTaxRateSyncService(repo, {
    url: 'https://vat.test/vat_rates',
    timeoutMs,
    fetchFn,
    logger: silentLogger,
    now: () => NOW,
  });
  return { repo, service };
}

const entry = (country_code: string, standard_rate: number, currency = 'EUR') => ({
  country_code,
  country_name: 'X',
  standard_rate,
  currency,
  member_state: true,
  reduced_rates: [],
});

describe('Sincronización del IVA con VATcomply', () => {
  it('actualiza los países de la UE, marca la fuente como api y mapea EL → GR', async () => {
    const { repo, service } = setup(() => jsonResponse([entry('ES', 22), entry('EL', 25), entry('FI', 25.5)]));

    expect(await service.sync()).toEqual({ ok: true, updated: 3 });
    expect(repo.findByCountry('ES')).toMatchObject({ ratePercent: 22, source: 'api', updatedAt: NOW.toISOString() });
    expect(repo.findByCountry('GR')).toMatchObject({ ratePercent: 25, source: 'api', countryName: 'Grecia' });
    expect(repo.findByCountry('EL')).toBeUndefined();
  });

  it('ignora países fuera de la UE y no toca los cargados a mano', async () => {
    const { repo, service } = setup(() => jsonResponse([entry('GB', 5, 'GBP'), entry('US', 10, 'USD'), entry('NO', 25)]));

    expect(await service.sync()).toEqual({ ok: true, updated: 0 });
    expect(repo.findByCountry('GB')).toMatchObject({ ratePercent: 20, source: 'manual' });
    expect(repo.findByCountry('US')).toMatchObject({ ratePercent: 0, source: 'manual' });
    expect(repo.findByCountry('NO')).toBeUndefined();
  });

  it.each([
    ['servicio caído', () => Promise.reject(new TypeError('fetch failed'))],
    ['error HTTP', () => jsonResponse({ error: 'boom' }, 503)],
    ['respuesta con formato inesperado', () => jsonResponse({ rates: 'no es una lista' })],
    ['tipo de IVA imposible', () => jsonResponse([entry('ES', 250)])],
  ] as const)('A.4.10 %s → se usan los datos de BD sin error', async (_case, fetchFn) => {
    const { repo, service } = setup(fetchFn);
    const before = repo.findAll();

    const result = await service.sync();
    expect(result.ok).toBe(false);
    expect(repo.findAll()).toEqual(before);
    expect(silentLogger.warn).toHaveBeenCalledWith(expect.stringContaining('se usan los datos guardados'));
  });

  it('cancela la petición si VATcomply no responde a tiempo', async () => {
    const hanging: TaxRateSyncOptions['fetchFn'] = (_url, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(init.signal?.reason));
      });
    const { service } = setup(hanging, 20);
    expect(await service.sync()).toMatchObject({ ok: false });
  });

  it('si un solo país viene con datos no válidos, no se aplica ningún cambio', async () => {
    const { repo, service } = setup(() => jsonResponse([entry('ES', 22), entry('FR', 21, 'EURO')]));
    expect((await service.sync()).ok).toBe(false);
    expect(repo.findByCountry('ES')).toMatchObject({ ratePercent: 21, source: 'manual' });
  });
});
