# Verificación cruzada de la validación fiscal

Comprueba `validateTaxId` contra un oráculo independiente: una reimplementación en Python de la lógica de
[python-stdnum](https://github.com/arthurdejong/python-stdnum) (`stdnum/es/nif.py`, `cif.py`, `dni.py`),
una librería de validación de identificadores muy extendida.

```bash
python3 ai-workspace/verificaciones/oraculo-nif.py casos.json
npx tsx ai-workspace/verificaciones/comparar-nif.ts casos.json
```

Resultado (4.000 identificadores aleatorios: DNI, NIE, NIF K/L/M y CIF, la mitad con control correcto):

```
casos=4000 (dni=1021 nie=986 klm=977 cif=1016)
diferencias=198 esperadasPorReglaEstrictaCIF=198 inesperadas=0
```

Las 198 diferencias son intencionadas: python-stdnum admite letra o dígito de control en cualquier CIF
porque considera que hay información contradictoria. SaaS-O-Matic aplica la regla estricta de la AEAT
(P, Q, R, S, N, W → letra; A, B, E, H → dígito), como pide el RN ("algoritmo oficial").
