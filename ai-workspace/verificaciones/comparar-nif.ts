import { readFileSync } from 'node:fs';
import { validateTaxId } from '../../packages/shared/src/taxId/validateTaxId';

type Case = { id: string; kind: string; org: string; oracle: boolean };
const cases = JSON.parse(readFileSync(process.argv[2] ?? '', 'utf8')) as Case[];
const diffs = cases.filter((c) => validateTaxId(c.id, 'ES').valid !== c.oracle);
// Diferencia esperada: el oráculo admite letra o dígito en cualquier CIF; nosotros aplicamos la regla estricta.
const expected = diffs.filter((c) => c.kind === 'cif' && 'ABEHPQRSNW'.includes(c.org) && c.oracle);
const byKind = (k: string) => cases.filter((c) => c.kind === k).length;
console.info(`casos=${cases.length} (dni=${byKind('dni')} nie=${byKind('nie')} klm=${byKind('klm')} cif=${byKind('cif')})`);
console.info(`diferencias=${diffs.length} esperadasPorReglaEstrictaCIF=${expected.length} inesperadas=${diffs.length - expected.length}`);
for (const c of diffs.filter((x) => !expected.includes(x)).slice(0, 10)) console.info('INESPERADA', c);
