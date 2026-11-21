// Jocuri fulger: tipurile temei „Fracțiile”, în pașii lecțiilor din Învață. La Ușor, jumătatea și sfertul pe desen și dintr-un număr;
// la Intermediar, fracții până la zecimi (numărătorul și numitorul), desenul unei fracții și o fracție unitară dintr-un număr; la Avansat,
// fracții egale, fracția dintr-un număr (2/3 din 12) și cea mai mare sau cea mai mică fracție. Toate au desen (cardurile temei arată
// desene): întregul tăiat (`fraction`, cu bucăți egale), grupele egale (`groups`) sau fracțiile scrise etajat ca variante (`{ frac }`).
//
// Variantele nu arată răspunsul (măsurat de ghicitorii din tests/fulger.test.js):
// - fracțiile (scrise sau desenate) stau „în pătrat”: {n, n′} × {d, d′}, unde n′ e partea necolorată (sau o bucată în plus ori în minus)
//   și d′ o bucată tăiată în plus sau în minus. Fiecare numărător și fiecare numitor apare de două ori, deci varianta „cu părțile cele
//   mai împărțite cu celelalte” nu mai e răspunsul (cu câte o greșeală pe rând față de răspuns, era în 96% din întrebări);
// - la fracțiile egale obținute prin amplificare, toate variantele se simplifică prin același număr (2/6, 4/6, 2/8, 4/8), ca nu „cea care
//   se simplifică” să fie răspunsul;
// - la „2/3 din 12”, variantele sunt multipli ai numărătorului (multiplul lui 2 dintre patru numere la rând ar fi fost răspunsul);
// - printre variante nu sunt două fracții egale (doar una e răspunsul), iar variantele-desen au doar bucăți egale (numele citit nu spune
//   dacă bucățile sunt egale). Numele grupelor desenate (`alt`) nu spune câtul.

import { cantitate } from '../core/ro.js';
import { GROUP_ITEMS } from './contexte.js';
import { numberQuestion, pickQuestion } from './intrebari.js';
import { int, pickOne, placeAt, row, shuffle } from './rand.js';

const JUMATATE_SFERT = 'mat.fractii.jumatate-sfert';
const NUMARATOR = 'mat.fractii.numarator-numitor';
const DIN_MULTIME = 'mat.fractii.din-multime';
const EGALE = 'mat.fractii.egale';
const COMPARARE = 'mat.fractii.comparare';

const frac = (n, d) => ({ frac: `${n}/${d}` });
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
/** Valoarea unei fracții „n/d”, pentru comparări exacte (fără virgulă mobilă: n · D față de N · d). */
const same = ([a, b], [c, d]) => a * d === b * c;
const keyOf = (list) => list.map((f) => f.join('/')).sort().join(',');

/** Întregul tăiat în `parts` bucăți egale, cu `n` bucăți colorate una lângă alta, de la `from`. */
function drawing(shape, parts, n, from = 0) {
  const on = Array.from({ length: n }, (_, i) => (from + i) % parts);
  const spec = { v: 'fraction', shape, parts, on };
  // pătratul: în 4 bucăți ca un careu, altfel fâșii
  if (shape === 'square' && parts === 4) spec.cut = 'grid';
  return spec;
}

/**
 * Patru fracții „în pătrat”: {n, nAlt} × {d, dAlt}, cu răspunsul primul. Null dacă una nu e subunitară, are numitorul peste `maxD` sau
 * două au aceeași valoare (atunci ar fi două răspunsuri bune).
 */
function fractionGrid([n, d], nAlt, dAlt, maxD = 10) {
  const list = [[n, d], [nAlt, d], [n, dAlt], [nAlt, dAlt]];
  if (list.some(([a, b]) => !(a >= 1 && a < b && b <= maxD))) return null;
  if (list.some((x, i) => list.some((y, j) => j > i && same(x, y)))) return null;
  return list;
}

/** Celălalt numărător: partea necolorată (greșeala tipică) sau, când e cât cea colorată, o bucată în plus ori în minus. */
const otherNumerator = (rand, n, d) => (d - n !== n ? d - n : pickOne(rand, [n - 1, n + 1].filter((x) => x >= 1 && x < d)));

/** La o jumătate desenată nu iese un pătrat (2 bucăți au un singur numărător subunitar): sfertul, trei sferturi și o treime. */
const HALF_SET = [[1, 2], [1, 4], [3, 4], [1, 3]];

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
        // sferturile, în pătrat cu partea necolorată și cu cincimi, șesimi sau optimi; jumătatea, cu sfertul, trei sferturi și o treime
        const list = parts === 2 ? HALF_SET : fractionGrid([n, 4], otherNumerator(rand, n, 4), pickOne(rand, [5, 6, 8]));
        if (!list) continue;
        const q = pickQuestion('fr-parte', rand, {
          prompt: 'Ce parte e colorată?',
          figure: drawing(shape, parts, n, from),
          key: `${shape}:${parts}:${n}:${from}`,
          answer: frac(...list[0]),
          distractors: list.slice(1).map((f) => frac(...f)),
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
        // răspunsul: o jumătate (o bucată din 2 sau două din 4) sau un sfert, cu variantele în pătrat (sau setul jumătății)
        const answer = half ? pickOne(rand, [[1, 2], [2, 4]]) : [1, 4];
        const list = answer[1] === 2 ? HALF_SET : fractionGrid(answer, otherNumerator(rand, ...answer), pickOne(rand, [5, 6, 8]));
        if (!list) continue;
        const options = list.map(([n, d]) => drawing(shape, d, n));
        const q = pickQuestion('fr-unde', rand, {
          prompt: half ? 'Unde e colorată jumătatea?' : 'Unde e colorat un sfert?',
          // cheia nu ține seama de ordinea variantelor (figureQuestion le amestecă oricum): aceeași întrebare are aceeași cheie
          key: `${shape}:${keyOf(list)}`,
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
        // în pătrat: partea necolorată (numărătorul) și o bucată numărată în plus sau în minus (numitorul)
        const list = fractionGrid([n, d], otherNumerator(rand, n, d), pickOne(rand, [d - 1, d + 1]));
        if (!list) continue;
        const q = pickQuestion('fr-ce-fractie', rand, {
          prompt: 'Ce fracție e colorată?',
          figure: drawing(shape, d, n),
          key: `${shape}:${n}/${d}:${keyOf(list)}`,
          answer: frac(n, d),
          distractors: list.slice(1).map((f) => frac(...f)),
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
        // în pătrat, ca la „Ce fracție e colorată?”, dar cu desene
        const list = fractionGrid([n, d], otherNumerator(rand, n, d), pickOne(rand, [d - 1, d + 1]), 9);
        if (!list) continue;
        const options = list.map(([a, b]) => drawing(shape, b, a));
        const q = pickQuestion('fr-arata', rand, {
          prompt: `Care desen arată {{f:${n}/${d}}}?`,
          key: `${shape}:${keyOf(list)}`,
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
        if (gcd(a, b) !== 1) continue; // fracția de bază e ireductibilă
        const k = int(rand, 2, Math.max(2, Math.floor(10 / b)));
        if (k * b > 10) continue;
        // în ambele sensuri: 1/2 = ?/4 (amplificarea) și 2/4 = ?/2 (simplificarea); desenul arată fracția dată. La amplificare, toate
        // variantele au numărătorul și numitorul înmulțite cu k (se simplifică la fel), ca „cea care se simplifică” să nu fie răspunsul
        const up = rand() < 0.5;
        const given = up ? [a, b] : [k * a, k * b];
        let list;
        if (b === 2) {
          // jumătatea nu intră într-un pătrat (numitorul 2 are un singur numărător subunitar): seturi alese, cu răspunsul nu cel mai
          // „împărțit” cu celelalte și, la amplificare, cu toate variantele pare (se simplifică toate prin 2)
          if (!up) list = [[1, 2], [1, 3], [2, 3], [1, 4]];
          else if (k === 2) list = [[2, 4], [2, 6], [4, 6], [2, 8]];
          else if (k === 4) list = fractionGrid([4, 8], pickOne(rand, [2, 6]), pickOne(rand, [6, 10]));
          else continue;
        } else {
          const m = up ? k : 1;
          const aAlt = pickOne(rand, [a - 1, a + 1].filter((x) => x >= 1));
          list = fractionGrid([m * a, m * b], m * aAlt, m * pickOne(rand, [b - 1, b + 1]));
        }
        if (!list) continue;
        const q = pickQuestion('fr-egale', rand, {
          prompt: `Care e egală cu {{f:${given[0]}/${given[1]}}}?`,
          figure: drawing('bar', given[1], given[0]),
          key: `${given.join('/')}:${keyOf(list)}`,
          answer: frac(...list[0]),
          distractors: list.slice(1).map((f) => frac(...f)),
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
        // fracția scrisă ireductibil (2/4 se scrie 1/2, iar 1/2 e la Ușor)
        if (gcd(n, d) !== 1 || each - slot < 1) continue;
        const answer = n * each;
        // variantele: multipli ai numărătorului (n grupe cu câte o nucă mai mult sau mai puțin), ca „multiplul lui 2” să nu-l arate
        const choices = placeAt(answer, row(n), slot, { min: n });
        if (!choices) continue;
        const { total, figure, solved } = groupsFigure(rand, d, each);
        return numberQuestion('fr-din-numar-n', rand, {
          prompt: `Cât fac {{f:${n}/${d}}} din ${total}?`,
          figure,
          solved,
          key: `${n}/${d}:${total}:${figure.emoji}`,
          answer,
          fixed: choices,
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
          key: `${most ? 'max' : 'min'}:${keyOf(list)}`,
          answer: frac(...answer),
          distractors: list.filter((f) => f !== answer).map((f) => frac(...f)),
          ask: { op: most ? 'max' : 'min' },
        });
        if (q) return q;
      }
    },
  },
};
