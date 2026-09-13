// Calcul fulger: tipurile de întrebări. Fiecare tip generează, cu un generator cu sămânță (`rand`, din core/rng.js),
// o întrebare cu răspunsul calculat din text (`calc`) și variante greșite plauzibile. Pur: se poate importa din Node.
//
// Forma întrebării: { kind, mode, key, answer, … }
//   choice  → text: '38 + 47', choices: [75, 84, 85, 95] (crescător)
//   compare → left: '35 + 8', right: '42', answer: '<' | '=' | '>'
//   sort    → numbers: plăcile în ordinea afișată, dir: 'asc' | 'desc', answer: ordinea corectă
// Un tip nou: o intrare aici, o linie în `mix`-ul unui nivel din data/fulger.js și regulile lui în tests/fulger.test.js.

import { calc, relation } from '../core/expr.js';
import { trecere } from '../core/rules.js';

const PLUS = ' + ';
const MINUS = ' − ';

const int = (rand, min, max) => min + Math.floor(rand() * (max - min + 1));
const pickOne = (rand, list) => list[Math.floor(rand() * list.length)];

function shuffle(rand, list) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** `count` numere diferite între `min` și `max`. */
function distinct(rand, count, min, max) {
  const set = new Set();
  while (set.size < count) set.add(int(rand, min, max));
  return [...set];
}

/** Două cifre diferite, de la 1 la 9. */
function twoDigits(rand) {
  const a = int(rand, 1, 9);
  const b = int(rand, 1, 8);
  return [a, b >= a ? b + 1 : b];
}

/** Numărul cu cifrele inversate (43 → 34), pentru greșeli tipice. */
const reversed = (n) => (n >= 10 && n <= 99 && n % 10 !== 0 ? (n % 10) * 10 + Math.floor(n / 10) : null);

/**
 * Patru variante în ordine crescătoare: răspunsul și trei greșeli. Poziția răspunsului se alege întâi, la întâmplare
 * (altfel ar sta mereu la mijloc), apoi greșelile de sub și de peste el; greșelile tipice au întâietate față de vecinii ±1, ±2, ±3, ±10.
 */
export function withChoices(rand, answer, typical = [], { max = 100 } = {}) {
  const ok = (w) => Number.isInteger(w) && w >= 0 && w <= max && w !== answer;
  const near = [1, 2, 3, 10].flatMap((d) => [answer - d, answer + d]);
  const side = (inSide) => [
    ...new Set([...shuffle(rand, typical.filter((w) => ok(w) && inSide(w))), ...shuffle(rand, near.filter((w) => ok(w) && inSide(w)))]),
  ];
  const below = side((w) => w < answer);
  const above = side((w) => w > answer);
  for (const pos of shuffle(rand, [0, 1, 2, 3])) {
    if (below.length >= pos && above.length >= 3 - pos) return [...below.slice(0, pos), answer, ...above.slice(0, 3 - pos)].sort((a, b) => a - b);
  }
  throw new Error(`fulger: nu găsesc variante pentru ${answer}`);
}

function choice(kind, rand, text, typical, max) {
  const answer = calc(text);
  return { kind, mode: 'choice', key: `${kind}:${text}`, text, answer, choices: withChoices(rand, answer, typical, { max }) };
}

function compare(kind, left, right) {
  const [l, r] = [String(left), String(right)];
  return { kind, mode: 'compare', key: `${kind}:${l}|${r}`, left: l, right: r, answer: relation(calc(l), calc(r)) };
}

function sorting(kind, rand, values, dir = 'asc') {
  const answer = [...values].sort((a, b) => (dir === 'asc' ? a - b : b - a));
  let numbers = shuffle(rand, values);
  while (numbers.every((n, i) => n === answer[i])) numbers = shuffle(rand, values);
  return { kind, mode: 'sort', key: `${kind}:${dir}:${numbers.join(',')}`, dir, numbers, answer };
}

/** Patru numere care se încurcă ușor: aceleași cifre (43, 34, 40, 30), aceleași zeci (52, 55, 57, 59) sau vecine. */
function trickyFour(rand) {
  const roll = rand();
  if (roll < 0.4) {
    const [a, b] = twoDigits(rand);
    return [10 * a + b, 10 * b + a, 10 * a, 10 * b];
  }
  if (roll < 0.7) {
    const t = int(rand, 1, 9);
    return distinct(rand, 4, 0, 9).map((u) => 10 * t + u);
  }
  const c = int(rand, 20, 80);
  return distinct(rand, 4, c - 12, c + 12);
}

export const KINDS = {
  'add-1c': {
    label: 'Adunări cu o cifră',
    points: 1,
    fastMs: 3000,
    mode: 'choice',
    generate(rand) {
      const [a, b] = [int(rand, 1, 9), int(rand, 1, 9)];
      const r = a + b;
      return choice('add-1c', rand, `${a}${PLUS}${b}`, [r - 1, r + 1, r - 10], 30);
    },
  },
  'add-1c-2c': {
    label: 'O cifră + un număr până la 20',
    points: 2,
    fastMs: 4000,
    mode: 'choice',
    generate(rand) {
      const [a, b] = [int(rand, 1, 9), int(rand, 10, 20)];
      const r = a + b;
      return choice('add-1c-2c', rand, `${a}${PLUS}${b}`, [r - 10, r + 10, r - 1, r + 1], 40);
    },
  },
  'sub-20-fara': {
    label: 'Scăderi până la 20, fără trecere',
    points: 2,
    fastMs: 4000,
    mode: 'choice',
    generate(rand) {
      const u = int(rand, 1, 9);
      const b = int(rand, 1, u);
      const a = 10 + u;
      const r = a - b;
      return choice('sub-20-fara', rand, `${a}${MINUS}${b}`, [r - 1, r + 1, r - 10, a + b], 30);
    },
  },
  'cmp-20': {
    label: 'Comparări până la 20',
    points: 1,
    fastMs: 2500,
    mode: 'compare',
    generate(rand) {
      const x = int(rand, 0, 20);
      const roll = rand();
      let y;
      if (roll < 0.2) y = x;
      else if (roll < 0.7) {
        const d = int(rand, 1, 5);
        y = x + d <= 20 && (rand() < 0.5 || x - d < 0) ? x + d : x - d;
      } else y = (x + int(rand, 1, 20)) % 21;
      return compare('cmp-20', x, y);
    },
  },
  'sort-3-20': {
    label: 'Ordonări până la 20',
    points: 2,
    fastMs: 5000,
    mode: 'sort',
    generate: (rand) => sorting('sort-3-20', rand, distinct(rand, 3, 0, 20)),
  },
  'sub-20-cu': {
    label: 'Scăderi până la 20, cu trecere',
    points: 2,
    fastMs: 4000,
    mode: 'choice',
    generate(rand) {
      const u = int(rand, 1, 8);
      const b = int(rand, u + 1, 9);
      const a = 10 + u;
      const r = a - b;
      // greșeala tipică: scade cifra mică din cea mare (13 − 7 → 14)
      return choice('sub-20-cu', rand, `${a}${MINUS}${b}`, [10 + b - u, r + 1, r - 1, r + 10], 20);
    },
  },
  'add-100-fara': {
    label: 'Adunări până la 100, fără trecere',
    points: 3,
    fastMs: 5000,
    mode: 'choice',
    generate(rand) {
      const two = rand() < 0.8; // al doilea termen are două cifre
      const t1 = int(rand, 1, 8);
      const u1 = int(rand, 0, two ? 9 : 8);
      const t2 = two ? int(rand, 1, 9 - t1) : 0;
      const u2 = int(rand, two ? 0 : 1, 9 - u1);
      let [a, b] = [10 * t1 + u1, 10 * t2 + u2];
      if (two && rand() < 0.3) [a, b] = [b, a];
      const r = a + b;
      return choice('add-100-fara', rand, `${a}${PLUS}${b}`, [r - 10, r + 10, r - 1, r + 1, reversed(r)], 100);
    },
  },
  'sub-100-fara': {
    label: 'Scăderi până la 100, fără trecere',
    points: 3,
    fastMs: 6000,
    mode: 'choice',
    generate(rand) {
      const ta = int(rand, 2, 9);
      const ua = int(rand, 0, 9);
      const one = ua > 0 && rand() < 0.2; // scăzător de o cifră
      let tb = one ? 0 : int(rand, 1, ta);
      const ub = one ? int(rand, 1, ua) : int(rand, 0, ua);
      if (tb === ta && ub === ua) tb--; // fără rezultatul 0
      const [a, b] = [10 * ta + ua, 10 * tb + ub];
      const r = a - b;
      return choice('sub-100-fara', rand, `${a}${MINUS}${b}`, [r - 10, r + 10, r - 1, r + 1, a + b, reversed(r)], 100);
    },
  },
  'add-3op-1c': {
    label: 'Adunări cu trei termeni de o cifră',
    points: 3,
    fastMs: 5000,
    mode: 'choice',
    generate(rand) {
      const [a, b, c] = [int(rand, 1, 9), int(rand, 1, 9), int(rand, 1, 9)];
      const r = a + b + c;
      return choice('add-3op-1c', rand, `${a}${PLUS}${b}${PLUS}${c}`, [a + b, r - 1, r + 1, r - 10, r + 10], 40);
    },
  },
  'cmp-100': {
    label: 'Comparări până la 100',
    points: 2,
    fastMs: 3000,
    mode: 'compare',
    generate(rand) {
      const roll = rand();
      if (roll < 0.35) {
        const [a, b] = twoDigits(rand); // cifre inversate: 43 și 34
        return compare('cmp-100', 10 * a + b, 10 * b + a);
      }
      if (roll < 0.65) {
        const t = int(rand, 1, 9); // aceleași zeci: 43 și 47
        const [u, v] = distinct(rand, 2, 0, 9);
        return compare('cmp-100', 10 * t + u, 10 * t + v);
      }
      if (roll < 0.8) {
        const x = int(rand, 10, 100);
        return compare('cmp-100', x, x);
      }
      const [x, y] = distinct(rand, 2, 0, 100);
      return compare('cmp-100', x, y);
    },
  },
  'sort-4-100': {
    label: 'Ordonări până la 100',
    points: 3,
    fastMs: 7000,
    mode: 'sort',
    generate: (rand) => sorting('sort-4-100', rand, trickyFour(rand)),
  },
  'add-100-cu': {
    label: 'Adunări până la 100, cu trecere',
    points: 4,
    fastMs: 7000,
    mode: 'choice',
    generate(rand) {
      for (;;) {
        const a = int(rand, 11, 89);
        const b = rand() < 0.2 ? int(rand, 2, 9) : int(rand, 11, 89);
        const r = a + b;
        if (r > 100 || (a % 10) + (b % 10) < 10) continue;
        // greșeala tipică: uită zecea trecută (38 + 47 → 75)
        return choice('add-100-cu', rand, `${a}${PLUS}${b}`, [r - 10, r + 10, r - 1, r + 1, r - 2, r + 2], 100);
      }
    },
  },
  'sub-100-cu': {
    label: 'Scăderi până la 100, cu trecere',
    points: 5,
    fastMs: 8000,
    mode: 'choice',
    generate(rand) {
      for (;;) {
        const a = rand() < 0.1 ? 100 : int(rand, 21, 99);
        const b = rand() < 0.2 ? int(rand, 2, 9) : int(rand, 11, a - 1);
        if (b >= a || !trecere('-', a, b)) continue;
        const r = a - b;
        // greșeala tipică: pe fiecare coloană scade cifra mică din cea mare (72 − 38 → 46)
        const digits = a < 100 ? (Math.floor(a / 10) - Math.floor(b / 10)) * 10 + Math.abs((a % 10) - (b % 10)) : null;
        return choice('sub-100-cu', rand, `${a}${MINUS}${b}`, [digits, r + 10, r - 10, r - 1, r + 1], 100);
      }
    },
  },
  'add-3op-100': {
    label: 'Adunări cu trei termeni, cu trecere',
    points: 5,
    fastMs: 9000,
    mode: 'choice',
    generate(rand) {
      for (;;) {
        const a = int(rand, 10, 59);
        const b = int(rand, 10, 39);
        const c = rand() < 0.6 ? int(rand, 2, 9) : int(rand, 10, 29);
        const r = a + b + c;
        if (r > 100 || (a % 10) + (b % 10) + (c % 10) < 10) continue;
        return choice('add-3op-100', rand, `${a}${PLUS}${b}${PLUS}${c}`, [a + b, r - 10, r + 10, r - 1, r + 1], 100);
      }
    },
  },
  'cmp-expr': {
    label: 'Comparări cu calcule',
    points: 4,
    fastMs: 5000,
    mode: 'compare',
    generate(rand) {
      let expr;
      let value;
      if (rand() < 0.55) {
        const a = int(rand, 12, 89);
        const b = rand() < 0.5 ? int(rand, 2, 9) : int(rand, 11, 100 - a);
        [expr, value] = [`${a}${PLUS}${b}`, a + b];
      } else {
        const a = int(rand, 21, 99);
        const b = rand() < 0.5 ? int(rand, 2, 9) : int(rand, 11, a - 1);
        [expr, value] = [`${a}${MINUS}${b}`, a - b];
      }
      const d = pickOne(rand, [-3, -2, -1, 0, 0, 1, 2, 3]);
      const n = value + d >= 0 && value + d <= 100 ? value + d : value - d;
      return rand() < 0.3 ? compare('cmp-expr', n, expr) : compare('cmp-expr', expr, n);
    },
  },
  'sort-4-dir': {
    label: 'Ordonări crescătoare și descrescătoare',
    points: 4,
    fastMs: 8000,
    mode: 'sort',
    generate(rand) {
      const dir = rand() < 0.5 ? 'asc' : 'desc';
      if (rand() < 0.4) {
        const [a, b] = twoDigits(rand); // 81, 18, 88, 11
        return sorting('sort-4-dir', rand, [10 * a + b, 10 * b + a, 11 * a, 11 * b], dir);
      }
      return sorting('sort-4-dir', rand, trickyFour(rand), dir);
    },
  },
};
