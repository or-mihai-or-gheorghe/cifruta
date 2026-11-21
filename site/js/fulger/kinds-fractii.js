// Jocuri fulger: tipurile temei „Fracțiile”, în pașii lecțiilor din Învață. La Ușor, jumătatea și sfertul pe desen și dintr-un număr;
// la Intermediar, fracții până la zecimi (numărătorul și numitorul), desenul unei fracții și o fracție unitară dintr-un număr; la Avansat,
// fracții egale, fracția dintr-un număr (2/3 din 12) și cea mai mare sau cea mai mică fracție. Toate au desen (cardurile temei arată
// desene): întregul tăiat (`fraction`, cu bucăți egale), grupele egale (`groups`) sau fracțiile scrise etajat ca variante (`{ frac }`).
//
// Distractorii vin din greșelile tipice: partea necolorată în locul celei colorate, colorate față de necolorate, o bucată numărată în plus,
// 1/10 crezut mai mare decât 1/2 (numitorul mai mare), doar fracția unitară la 2/3 din 12. Variantele-desen au doar bucăți egale (numele
// citit nu spune dacă bucățile sunt egale), iar printre variante nu sunt două fracții egale (doar una e răspunsul). La răspunsurile-număr,
// variantele sunt patru numere la rând, cu răspunsul pe un loc ales întâi. Numele grupelor desenate (`alt`) nu spune câtul.

import { cantitate } from '../core/ro.js';
import { cate, GROUP_ITEMS } from './contexte.js';
import { numberQuestion, pickQuestion } from './intrebari.js';
import { int, pickOne, shuffle } from './rand.js';

const JUMATATE_SFERT = 'mat.fractii.jumatate-sfert';
const NUMARATOR = 'mat.fractii.numarator-numitor';
const DIN_MULTIME = 'mat.fractii.din-multime';
const EGALE = 'mat.fractii.egale';
const COMPARARE = 'mat.fractii.comparare';

const frac = (n, d) => ({ frac: `${n}/${d}` });
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
/** Valoarea unei fracții „n/d”, pentru comparări exacte (fără virgulă mobilă: n · D față de N · d). */
const same = ([a, b], [c, d]) => a * d === b * c;
const partsOf = (spec) => spec.frac.split('/').map(Number);

/** Întregul tăiat în `parts` bucăți egale, cu `n` bucăți colorate una lângă alta, de la `from`. */
function drawing(shape, parts, n, from = 0) {
  const on = Array.from({ length: n }, (_, i) => (from + i) % parts);
  const spec = { v: 'fraction', shape, parts, on };
  // pătratul: în 4 bucăți ca un careu, altfel fâșii
  if (shape === 'square' && parts === 4) spec.cut = 'grid';
  return spec;
}

/** Distractorii-fracție diferiți ca valoare de răspuns și între ei, în ordinea dată (greșelile tipice întâi), toți subunitari. */
function distinctFractions(answer, candidates) {
  const picked = [];
  for (const [n, d] of candidates) {
    if (!(n >= 1 && n < d && d <= 10) || same([n, d], answer) || picked.some((p) => same(p, [n, d]))) continue;
    picked.push([n, d]);
  }
  return picked.map(([n, d]) => frac(n, d));
}

/** Grupe egale desenate pentru „fracția dintr-un număr”: `groups` grupe de câte `each`, cu numele care nu spune câtul. */
function groupsFigure(rand, groups, each) {
  const item = pickOne(rand, GROUP_ITEMS);
  const total = groups * each;
  const figure = {
    v: 'groups',
    n: groups,
    each,
    emoji: item.emoji,
    unit: [item.sg, item.name],
    alt: `${cantitate(total, item.sg, item.name)} în ${cantitate(groups, 'grupă egală', 'grupe egale')}`,
  };
  return { item, total, figure, solved: { ...figure, counts: true } };
}

/** O întrebare cu număr ca răspuns: patru numere la rând, cu răspunsul pe locul `slot`, toate cel puțin 1. */
const windowAt = (answer, slot) => [0, 1, 2, 3].map((i) => answer - slot + i);

export const FRACTII_KINDS = {
  // ——— Ușor: jumătatea și sfertul ———
  'fr-parte': {
    label: 'Jumătatea și sfertul pe desen',
    points: 2,
    fastMs: 5000,
    mode: 'figure',
    concepts: [JUMATATE_SFERT],
    generate(rand) {
      for (;;) {
        const shape = pickOne(rand, ['circle', 'bar', 'square']);
        const parts = pickOne(rand, [2, 4, 4]);
        const n = int(rand, 1, parts - 1);
        const from = shape === 'bar' ? 0 : int(rand, 0, parts - 1);
        const figure = drawing(shape, parts, n, from);
        const answer = [n, parts];
        // greșelile: partea necolorată, colorate față de necolorate, un sfert în loc de o jumătate și invers
        const distractors = distinctFractions(answer, [[parts - n, parts], [n, parts - n], [1, 4], [1, 2], [3, 4], [1, 3], [2, 3]]).slice(0, 3);
        const q = pickQuestion('fr-parte', rand, {
          prompt: 'Ce parte e colorată?',
          figure,
          key: `${shape}:${parts}:${n}:${from}`,
          answer: frac(n, parts),
          distractors,
          ask: { op: 'parte' },
        });
        if (q) return q;
      }
    },
  },
  'fr-unde': {
    label: 'Desenul jumătății sau al sfertului',
    points: 3,
    fastMs: 6000,
    mode: 'figure',
    concepts: [JUMATATE_SFERT],
    generate(rand) {
      for (;;) {
        const shape = pickOne(rand, ['circle', 'bar', 'square']);
        const half = rand() < 0.5;
        // răspunsul: o jumătate (o bucată din 2 sau două din 4) sau un sfert; greșelile: alt număr de bucăți colorate sau tăiate
        const answer = half ? pickOne(rand, [[1, 2], [2, 4]]) : [1, 4];
        const pool = shuffle(rand, [[1, 3], [3, 4], [1, 4], [1, 2], [2, 3]]).filter((f) => !same(f, answer));
        const options = [answer, ...pool.slice(0, 3)].map(([n, d]) => drawing(shape, d, n));
        const q = pickQuestion('fr-unde', rand, {
          prompt: half ? 'Unde e colorată jumătatea?' : 'Unde e colorat un sfert?',
          key: `${shape}:${answer.join('/')}:${pool.slice(0, 3).flat().join('')}`,
          answer: options[0],
          distractors: options.slice(1),
          ask: { op: 'unde', target: half ? '1/2' : '1/4' },
        });
        if (q) return q;
      }
    },
  },
  'fr-jumatate-din': {
    label: 'Jumătatea și sfertul unui număr',
    points: 2,
    fastMs: 5500,
    mode: 'figure',
    concepts: [DIN_MULTIME, JUMATATE_SFERT],
    generate(rand) {
      const slot = int(rand, 0, 3);
      for (;;) {
        const half = rand() < 0.5;
        const groups = half ? 2 : 4;
        const each = int(rand, 2, 6);
        if (each - slot < 1) continue;
        const { total, figure, solved } = groupsFigure(rand, groups, each);
        return numberQuestion('fr-jumatate-din', rand, {
          prompt: `Cât e ${half ? 'jumătate' : 'un sfert'} din ${total}?`,
          figure,
          solved,
          key: `${half ? 'jumatate' : 'sfert'}:${total}:${figure.emoji}`,
          answer: each,
          fixed: windowAt(each, slot),
          ask: { op: 'din', of: [1, groups] },
        });
      }
    },
  },

  // ——— Intermediar: până la zecimi ———
  'fr-ce-fractie': {
    label: 'Fracția colorată, până la zecimi',
    points: 3,
    fastMs: 6000,
    mode: 'figure',
    concepts: [NUMARATOR],
    generate(rand) {
      for (;;) {
        const d = int(rand, 3, 10);
        const n = int(rand, 1, d - 1);
        const shape = d > 8 ? 'bar' : pickOne(rand, ['circle', 'bar']);
        const figure = drawing(shape, d, n);
        const answer = [n, d];
        const distractors = distinctFractions(answer, [[d - n, d], [n, d - n], [n + 1, d], [n, d + 1], [n - 1, d], [n, d - 1]]).slice(0, 3);
        const q = pickQuestion('fr-ce-fractie', rand, {
          prompt: 'Ce fracție e colorată?',
          figure,
          key: `${shape}:${n}/${d}`,
          answer: frac(n, d),
          distractors,
          ask: { op: 'parte' },
        });
        if (q) return q;
      }
    },
  },
  'fr-arata': {
    label: 'Desenul unei fracții',
    points: 3,
    fastMs: 6500,
    mode: 'figure',
    concepts: [NUMARATOR],
    generate(rand) {
      for (;;) {
        const d = int(rand, 3, 8);
        const n = int(rand, 1, d - 1);
        const shape = pickOne(rand, ['circle', 'bar']);
        const answer = [n, d];
        // greșelile: partea necolorată, o bucată tăiată în plus sau în minus, o bucată colorată în plus
        const wrong = distinctFractions(answer, [[d - n, d], [n, d + 1], [n, d - 1], [n + 1, d], [n - 1, d]]).slice(0, 3).map(partsOf);
        const options = [answer, ...wrong].map(([a, b]) => drawing(shape, b, a));
        const q = pickQuestion('fr-arata', rand, {
          prompt: `Care desen arată {{f:${n}/${d}}}?`,
          key: `${shape}:${n}/${d}`,
          answer: options[0],
          distractors: options.slice(1),
          ask: { op: 'arata', target: `${n}/${d}` },
        });
        if (q) return q;
      }
    },
  },
  'fr-din-numar': {
    label: 'O fracție unitară dintr-un număr (1/3 din 12)',
    points: 3,
    fastMs: 6500,
    mode: 'figure',
    concepts: [DIN_MULTIME],
    generate(rand) {
      const slot = int(rand, 0, 3);
      for (;;) {
        // o treime, un sfert, o cincime, o șesime (jumătatea e la Ușor)
        const d = int(rand, 3, 6);
        const each = int(rand, 2, 6);
        if (each - slot < 1) continue;
        const { total, figure, solved } = groupsFigure(rand, d, each);
        return numberQuestion('fr-din-numar', rand, {
          prompt: `Cât e {{f:1/${d}}} din ${total}?`,
          figure,
          solved,
          key: `1/${d}:${total}:${figure.emoji}`,
          answer: each,
          fixed: windowAt(each, slot),
          ask: { op: 'din', of: [1, d] },
        });
      }
    },
  },

  // ——— Avansat: fracții egale, fracția dintr-un număr, comparări ———
  'fr-egale': {
    label: 'Fracții egale',
    points: 3,
    fastMs: 7000,
    mode: 'figure',
    concepts: [EGALE],
    generate(rand) {
      for (;;) {
        const b = int(rand, 2, 5);
        const a = int(rand, 1, b - 1);
        if (a > 1 && b % a === 0) continue; // fracția dată e ireductibilă: 2/4 se scrie 1/2
        const k = int(rand, 2, Math.floor(10 / b));
        if (k < 2) continue;
        // în ambele sensuri: 1/2 = ?/4 (amplificarea) și 2/4 = ?/2 (simplificarea); desenul arată fracția dată
        const up = rand() < 0.5;
        const [given, answer] = up ? [[a, b], [a * k, b * k]] : [[a * k, b * k], [a, b]];
        // greșelile: același numitor cu alt numărător, același numărător cu alt numitor, numărătorul și numitorul doar „adunate”
        const [n, d] = answer;
        const distractors = distinctFractions(answer, [[n + 1, d], [n - 1, d], [given[0], d], [n, d + 1], [a + k, b + k], [n + 1, d + 1]]).slice(0, 3);
        const q = pickQuestion('fr-egale', rand, {
          prompt: `Care e egală cu {{f:${given[0]}/${given[1]}}}?`,
          figure: drawing('bar', given[1], given[0]),
          key: `${given.join('/')}:${answer.join('/')}`,
          answer: frac(...answer),
          distractors,
          ask: { op: 'egale', of: given },
        });
        if (q) return q;
      }
    },
  },
  'fr-din-numar-n': {
    label: 'Fracția dintr-un număr (2/3 din 12)',
    points: 4,
    fastMs: 8000,
    mode: 'figure',
    concepts: [DIN_MULTIME],
    generate(rand) {
      const slot = int(rand, 0, 3);
      for (;;) {
        const d = int(rand, 3, 6);
        const n = int(rand, 2, d - 1);
        const each = int(rand, 2, 6);
        const answer = n * each;
        // fracția scrisă ireductibil (2/4 se scrie 1/2, iar 1/2 e la Ușor)
        if (answer - slot < 1 || gcd(n, d) !== 1) continue;
        const { total, figure, solved } = groupsFigure(rand, d, each);
        return numberQuestion('fr-din-numar-n', rand, {
          prompt: `Cât fac {{f:${n}/${d}}} din ${total}?`,
          figure,
          solved,
          key: `${n}/${d}:${total}:${figure.emoji}`,
          answer,
          fixed: windowAt(answer, slot),
          ask: { op: 'din', of: [n, d] },
        });
      }
    },
  },
  'fr-compara': {
    label: 'Cea mai mare sau cea mai mică fracție',
    points: 3,
    fastMs: 6500,
    mode: 'figure',
    concepts: [COMPARARE],
    generate(rand) {
      const most = rand() < 0.5;
      for (;;) {
        // același numărător (cu cât bucățile sunt mai multe, cu atât fiecare e mai mică: 1/10 < 1/2) sau același numitor
        const byNumerator = rand() < 0.6;
        let list;
        if (byNumerator) {
          const n = pickOne(rand, [1, 1, 2]);
          list = shuffle(rand, [2, 3, 4, 5, 6, 8, 10].filter((d) => d > n)).slice(0, 4).map((d) => [n, d]);
        } else {
          const d = int(rand, 5, 10);
          list = shuffle(rand, Array.from({ length: d - 1 }, (_, i) => [i + 1, d])).slice(0, 4);
        }
        if (list.length < 4) continue;
        const value = ([n, d]) => n / d;
        const sorted = [...list].sort((x, y) => value(x) - value(y));
        const answer = most ? sorted[3] : sorted[0];
        const q = pickQuestion('fr-compara', rand, {
          prompt: most ? 'Care fracție e cea mai mare?' : 'Care fracție e cea mai mică?',
          key: `${most ? 'max' : 'min'}:${list.map((f) => f.join('/')).sort().join(',')}`,
          answer: frac(...answer),
          distractors: list.filter((f) => f !== answer).map((f) => frac(...f)),
          ask: { op: most ? 'max' : 'min' },
        });
        if (q) return q;
      }
    },
  },
};
