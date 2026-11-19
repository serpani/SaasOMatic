# Oráculo independiente: reimplementa la lógica de python-stdnum (es/nif, es/cif, es/dni) leída a mano.
import sys, json, random
random.seed(42)
L = 'TRWAGMYFPDXBNJZSQVHLCKE'
C = 'JABCDEFGHI'


def luhn_check(num):
    s = 0
    for i, ch in enumerate(reversed(num)):
        v = int(ch)
        if i % 2 == 0:
            v *= 2
            v = v - 9 if v > 9 else v
        s += v
    return str((10 - s % 10) % 10)


def cif_cands(body):
    c = luhn_check(body)
    return c + C[int(c)]


def oracle(s):
    if len(s) != 9 or not s[1:-1].isdigit():
        return False
    if s[0] in 'KLM':
        return s[-1] == L[int(s[1:-1]) % 23]
    if s[0].isdigit():
        return s[:8].isdigit() and s[-1] == L[int(s[:8]) % 23]
    if s[0] in 'XYZ':
        return s[-1] == L[int(str('XYZ'.index(s[0])) + s[1:8]) % 23]
    if s[0] in 'ABCDEFGHJNPQRSUVW':
        return s[-1] in cif_cands(s[1:8])
    return False


def d(n):
    return ''.join(random.choice('0123456789') for _ in range(n))


def pick(good, alphabet):
    return good if random.random() < .5 else random.choice(alphabet)


cases = []
for _ in range(4000):
    k = random.choice(['dni', 'nie', 'klm', 'cif'])
    if k == 'dni':
        b = d(8)
        s = b + pick(L[int(b) % 23], L)
    elif k == 'nie':
        p = random.choice('XYZ'); b = d(7)
        s = p + b + pick(L[int(str('XYZ'.index(p)) + b) % 23], L)
    elif k == 'klm':
        p = random.choice('KLM'); b = d(7)
        s = p + b + pick(L[int(b) % 23], L)
    else:
        p = random.choice('ABCDEFGHJNPQRSUVW'); b = d(7); cd = cif_cands(b); r = random.random()
        s = p + b + (cd[0] if r < .33 else cd[1] if r < .66 else random.choice('0123456789' + C))
    cases.append({'id': s, 'kind': k, 'org': s[0], 'oracle': oracle(s)})

# Sanidad del oráculo con los casos del plan de pruebas
assert oracle('12345678Z') and not oracle('12345678A') and oracle('B12345674') and not oracle('B12345670')
json.dump(cases, open(sys.argv[1], 'w'))
print(len(cases), 'casos; válidos según el oráculo:', sum(c['oracle'] for c in cases))
