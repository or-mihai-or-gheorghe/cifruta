// Jocuri fulger: tipurile temei „Înmulțirea”. La Ușor, tabla înmulțirii (factori de o cifră), adunarea repetată, grupe egale desenate
// și factorul lipsă (o ecuație cu căsuța); la Intermediar, și o cifră × două cifre, cu rezultate până la 200; la Avansat, o cifră × două cifre până la 500 și
// două cifre × două cifre „prietenoase” (× 10, × 11, zeci rotunde), până la 1000. Alunele sunt pe măsura timpului (cam 1 la 2 s de timp
// „fulger”), iar calculul mai lung de 9 s are pauza „Hopa” cât timpul lui.
//
// Variantele nu au tipare care să arate răspunsul (măsurat de ghicitorii din tests/fulger.test.js):
// - locul răspunsului se alege întâi, la întâmplare, apoi un calcul a cărui formă încape cu răspunsul acolo (`placeAt`);
// - formele vin din greșelile tipice: la tablă, un rând al tablei (multiplii unui factor: vecinii care se încurcă, 7 × 8 cu 7 × 7);
//   la o cifră × două cifre și la × 11, patru zeci la rând, cu aceleași unități (transportul uitat sau dublat; cifra unităților se
//   află ușor, deci n-are voie să dea răspunsul); la zeci rotunde, rândul factorului rotund (toate se termină în 0);
// - nicio variantă nu e mai mică decât factorul mai mare și niciuna nu trece de plafonul nivelului;
// - la adunarea repetată, toate variantele au același al doilea factor (termenul), deci produsul inversat nu apare niciodată;
// - la comparări, două produse fără niciun număr comun nu sunt mereu egale (unul dintre factori e uneori schimbat cu 1).
// Convenția: n × t înseamnă „de n ori t” = t + t + … (n termeni). Variantele nu depind de ea.

import { cate, GROUP_ITEMS } from './contexte.js';
import { boxChoice, compare, numberQuestion, pickQuestion, shapedChoice } from './intrebari.js';
import { int, pickOne, placeAt, row, SHAPES, shuffle } from './rand.js';

const TIMES = ' × ';

const TABLA = 'mat.op.tabla-inmultirii';
const INMULTIRE = 'mat.op.inmultire';
const FACTOR = 'mat.op.factor-necunoscut';
const INM_1000 = 'mat.op1000.inmultire';
const STRATEGII = 'mat.op1000.inmultire-strategii';
const EXPRESII = 'mat.op.comparare-expresii';

/** Doi factori, scriși în ordinea dată sau inversată, la întâmplare. */
const product = (rand, a, b) => (rand() < 0.5 ? `${a}${TIMES}${b}` : `${b}${TIMES}${a}`);

/** Patru numere la rând, de la `start`. */
const windowOf = (start) => [0, 1, 2, 3].map((i) => start + i);

/** Perechi de fapte din tablă cu același produs (12, 16, 18, 24, 36). */
const SAME_PRODUCT = [
  [2, 6, 3, 4],
  [2, 8, 4, 4],
  [2, 9, 3, 6],
  [3, 8, 4, 6],
  [4, 9, 6, 6],
];

/** O cifră × un număr de două cifre (niciodată o zece rotundă), cu produsul între `min` și `max`. */
function oneByTwo(rand, { aMin = 2, min = 22, max }) {
  for (;;) {
    const a = int(rand, aMin, 9);
    const n = int(rand, Math.max(11, Math.ceil(min / a)), Math.min(99, Math.floor(max / a)));
    if (n % 10 !== 0) return [a, n];
  }
}

/** Un calcul cu răspunsul pe locul `slot` al formei, între factorul mai mare (exclus) și `max`; null dacă nu încape. */
const placed = (kind, rand, [a, b], shape, slot, max) => {
  const choices = placeAt(a * b, shape, slot, { min: Math.max(a, b) + 1, max });
  return choices && shapedChoice(kind, product(rand, a, b), choices);
};

/**
 * „□ × 6 = 42”: factorul lipsă (2–9), cu căsuța pe primul sau pe al doilea loc, lângă factorul vizibil `k` (ca la tema „Termenul
 * necunoscut”, unde tipul intră și el). Variantele sunt patru numere la rând, între 1 și 10, cu răspunsul pe un loc ales întâi. Factorul
 * vizibil poate fi printre ele, iar pătratele (□ × 6 = 36) se întreabă și ele: un copil care l-ar scoate din variante pentru că e scris
 * în cerință tot o dată din patru nimerește.
 */
function missingFactor(kind, rand, k) {
  const slot = int(rand, 0, 3);
  let m;
  do m = int(rand, 2, 9);
  while (m - slot < 1 || m - slot + 3 > 10);
  const equation = rand() < 0.5 ? `□${TIMES}${k} = ${m * k}` : `${k}${TIMES}□ = ${m * k}`;
  return boxChoice(kind, equation, `${m * k} : ${k}`, windowOf(m - slot));
}

/** Întâi fereastra de patru numere (factorul lipsă, numărul de grupe sau de termeni), apoi locul răspunsului în ea. */
function windowAndAnswer(rand, min, max) {
  const start = int(rand, min, max);
  return [start, start + int(rand, 0, 3)];
}

export const INMULTIRE_KINDS = {
  // ——— Ușor: tabla înmulțirii, adunarea repetată, grupe egale, factorul lipsă ———
  'inm-tabla': {
    label: 'Tabla înmulțirii',
    points: 2,
    fastMs: 4000,
    mode: 'choice',
    concepts: [TABLA],
    generate(rand) {
      const slot = int(rand, 0, 3);
      const a = int(rand, 2, 9);
      const b = int(rand, 2, 9);
      const limits = { min: Math.max(a, b) + 1, max: 81 };
      // un rând al tablei: multiplii unuia dintre factori
      const rows = shuffle(rand, [a, b]).map(row);
      // faptele de la marginea tablei (9 × 9) încap doar pe unele locuri: atunci, pe oricare loc care încape (altfel ar apărea rar)
      const choices =
        rows.map((shape) => placeAt(a * b, shape, slot, limits)).find(Boolean) ??
        pickOne(rand, rows.flatMap((shape) => [0, 1, 2, 3].map((i) => placeAt(a * b, shape, i, limits))).filter(Boolean));
      return shapedChoice('inm-tabla', `${a}${TIMES}${b}`, choices);
    },
  },
  'inm-adunare-repetata': {
    label: 'Adunarea repetată ca înmulțire',
    points: 2,
    fastMs: 5000,
    mode: 'figure',
    concepts: [INMULTIRE],
    generate(rand) {
      // 2–6 termeni egali; variantele „k × t” pentru k din fereastră, ordonate după k
      const [start, n] = windowAndAnswer(rand, 2, 3);
      const t = int(rand, 2, 9);
      const option = (k) => ({ text: `${k}${TIMES}${t}` });
      return pickQuestion('inm-adunare-repetata', rand, {
        // spații nedespărțite: suma stă pe un singur rând (un termen rămas singur pe rândul următor s-ar număra greșit)
        prompt: `Cum scrii ca înmulțire? ${Array(n).fill(t).join(' + ')}`,
        key: `${n}x${t}:${start}`,
        answer: option(n),
        distractors: windowOf(start).filter((k) => k !== n).map(option),
        order: (o) => parseInt(o.text, 10),
        ask: { op: 'adunare-repetata' },
      });
    },
  },
  'inm-grupe': {
    label: 'Grupe egale desenate',
    points: 3,
    fastMs: 6500,
    mode: 'figure',
    concepts: [INMULTIRE],
    generate(rand) {
      const item = pickOne(rand, GROUP_ITEMS);
      const each = int(rand, 2, 6);
      // 2–6 grupe; variantele sunt multipli ai mărimii grupei
      const [start, n] = windowAndAnswer(rand, 2, 3);
      const figure = { v: 'groups', n, each, emoji: item.emoji, unit: [item.sg, item.name] };
      return numberQuestion('inm-grupe', rand, {
        prompt: `${cate(item.f)} ${item.name} sunt în total?`,
        figure,
        solved: { ...figure, counts: true },
        key: `${item.emoji}:${n}x${each}`,
        answer: n * each,
        fixed: windowOf(start).map((k) => k * each),
        ask: { op: 'grupe' },
      });
    },
  },
  'inm-factor-lipsa': {
    label: 'Factorul lipsă din tabla înmulțirii',
    points: 3,
    fastMs: 6000,
    mode: 'choice',
    concepts: [FACTOR, TABLA],
    generate(rand) {
      // toate cele 64 de fapte ale tablei, la fel de des
      return missingFactor('inm-factor-lipsa', rand, int(rand, 2, 9));
    },
  },
  'cmp-inm-tabla': {
    label: 'Comparări cu înmulțiri din tablă',
    points: 3,
    fastMs: 5500,
    mode: 'compare',
    concepts: [EXPRESII],
    generate(rand) {
      const fact = () => [int(rand, 2, 9), int(rand, 2, 9)];
      for (;;) {
        const roll = rand();
        let left;
        let right;
        if (roll < 0.15) {
          // aceiași factori, în altă ordine
          const [a, b] = fact();
          if (a === b) continue;
          [left, right] = [`${a}${TIMES}${b}`, `${b}${TIMES}${a}`];
        } else if (roll < 0.27) {
          // același produs din alți factori (3 × 8 și 4 × 6); jumătate din ele cu un factor schimbat cu 1 (4 × 7)
          const [a, b, c, d] = pickOne(rand, SAME_PRODUCT);
          const e = rand() < 0.5 ? d : d + pickOne(rand, [-1, 1]);
          if (e < 2 || e > 9) continue;
          [left, right] = [product(rand, a, b), product(rand, c, e)];
        } else if (roll < 0.6) {
          // un factor comun, celălalt mai mare sau mai mic cu 1–2
          const [a, b] = fact();
          const c = b + pickOne(rand, [-2, -1, 1, 2]);
          if (c < 2 || c > 9) continue;
          [left, right] = [product(rand, a, b), product(rand, a, c)];
        } else if (roll < 0.8) {
          // două fapte din tablă cu produse apropiate (diferă cu 1–4)
          const [a, b] = fact();
          const [c, d] = fact();
          const diff = Math.abs(a * b - c * d);
          if (diff < 1 || diff > 4) continue;
          [left, right] = [product(rand, a, b), product(rand, c, d)];
        } else {
          // un fapt față de un număr apropiat de produs
          const [a, b] = fact();
          [left, right] = [product(rand, a, b), String(a * b + int(rand, -3, 3))];
        }
        if (rand() < 0.5) [left, right] = [right, left];
        return compare('cmp-inm-tabla', left, right);
      }
    },
  },

  // ——— Intermediar: o cifră × două cifre, până la 200 ———
  'inm-zeci': {
    label: 'O cifră ori zeci rotunde',
    points: 2,
    fastMs: 4500,
    mode: 'choice',
    concepts: [STRATEGII],
    generate(rand) {
      const slot = int(rand, 0, 3);
      for (;;) {
        const a = int(rand, 2, 9);
        const t = 10 * int(rand, 1, 9);
        // × 10 mai rar (e doar un zero adăugat)
        if (a * t > 200 || (t === 10 && rand() >= 0.3)) continue;
        // multiplii zecii rotunde (de cel puțin 2 ori) sau ai lui 10 × a (a ori zecile vecine)
        for (const [shape, min] of shuffle(rand, [
          [row(t), 2 * t],
          [row(10 * a), t + 1],
        ])) {
          const choices = placeAt(a * t, shape, slot, { min, max: 200 });
          if (choices) return shapedChoice('inm-zeci', product(rand, a, t), choices);
        }
      }
    },
  },
  'inm-1x2': {
    label: 'Înmulțiri cu un număr de două cifre, până la 200',
    points: 5,
    fastMs: 9000,
    mode: 'choice',
    concepts: [INM_1000],
    generate(rand) {
      const slot = int(rand, 0, 3);
      for (;;) {
        const q = placed('inm-1x2', rand, oneByTwo(rand, { max: 200 }), SHAPES.tens, slot, 200);
        if (q) return q;
      }
    },
  },
  'cmp-inm-200': {
    label: 'Comparări cu înmulțiri până la 200',
    points: 3,
    fastMs: 6000,
    mode: 'compare',
    concepts: [EXPRESII],
    generate(rand) {
      for (;;) {
        const roll = rand();
        const [a, n] = oneByTwo(rand, { max: 200 });
        const p = a * n;
        let left = product(rand, a, n);
        let right;
        if (roll < 0.15) {
          // aceiași factori, în altă ordine
          [left, right] = [`${a}${TIMES}${n}`, `${n}${TIMES}${a}`];
        } else if (roll < 0.3) {
          // același produs din alți factori (4 × 15 și 2 × 30); jumătate din ele cu numărul de două cifre schimbat cu 1 (2 × 31)
          const other = [2, 3, 4, 5, 6, 7, 8, 9].filter((b) => b !== a && p % b === 0 && p / b >= 10 && p / b <= 99);
          if (!other.length) continue;
          const b = pickOne(rand, other);
          const m = p / b + (rand() < 0.5 ? 0 : pickOne(rand, [-1, 1]));
          if (m < 10 || m > 99 || b * m > 200) continue;
          right = product(rand, b, m);
        } else if (roll < 0.65) {
          // același factor de o cifră, celălalt mai mare sau mai mic cu 1–3
          const m = n + pickOne(rand, [-3, -2, -1, 1, 2, 3]);
          if (m < 11 || a * m > 200) continue;
          right = product(rand, a, m);
        } else {
          // produsul față de zecea apropiată (cel mult 200, plafonul nivelului)
          const x = Math.round(p / 10) * 10 + pickOne(rand, [-10, 0, 10]);
          if (x > 200) continue;
          right = String(x);
        }
        if (rand() < 0.5) [left, right] = [right, left];
        return compare('cmp-inm-200', left, right);
      }
    },
  },

  // ——— Avansat: o cifră × două cifre până la 500, × 11, zeci rotunde, până la 1000 ———
  'inm-1x2-500': {
    label: 'Înmulțiri cu un număr de două cifre, până la 500',
    points: 6,
    fastMs: 12000,
    pauseMaxMs: 12000,
    mode: 'choice',
    concepts: [INM_1000],
    generate(rand) {
      const slot = int(rand, 0, 3);
      for (;;) {
        const q = placed('inm-1x2-500', rand, oneByTwo(rand, { aMin: 3, min: 110, max: 500 }), SHAPES.tens, slot, 500);
        if (q) return q;
      }
    },
  },
  'inm-11': {
    label: 'Înmulțirea cu 11',
    points: 4,
    fastMs: 8000,
    mode: 'choice',
    concepts: [STRATEGII],
    generate(rand) {
      const slot = int(rand, 0, 3);
      for (;;) {
        const n = int(rand, 12, 90);
        // zecile rotunde mai rar (11 × 30 e doar 330)
        if (n % 10 === 0 && rand() < 0.7) continue;
        const q = placed('inm-11', rand, [11, n], SHAPES.tens, slot, 999);
        if (q) return q;
      }
    },
  },
  'inm-zeci-2x2': {
    label: 'Înmulțiri cu zeci rotunde (10 × 34, 12 × 20, 20 × 30)',
    points: 4,
    fastMs: 7000,
    mode: 'choice',
    concepts: [STRATEGII],
    generate(rand) {
      const slot = int(rand, 0, 3);
      // întâi felul calculului (altfel × 10 ar ieși în trei sferturi din întrebări), apoi numerele; produsul din interior rămâne până
      // la 100 (47 × 20 → 47 × 2 = 94), deci rezultatul până la 1000
      const roll = rand();
      for (;;) {
        let m;
        let t;
        let shape;
        if (roll < 0.3) {
          // × 10 (34 × 10): zeci la rând; cifrele numărului se văd în rezultat, iar asta e chiar deprinderea
          [m, t, shape] = [int(rand, 11, 99), 10, row(10)];
        } else if (roll < 0.85) {
          // un număr de două cifre ori zeci rotunde (12 × 20): sute la rând, cu aceleași zeci (transportul uitat sau dublat:
          // 37 × 20 → 640, 840), ca ultimele cifre singure (7 × 2 → …40) să nu dea răspunsul
          t = 10 * int(rand, 2, 9);
          [m, shape] = [int(rand, 11, Math.min(99, Math.floor(1000 / t))), row(100)];
        } else {
          // zeci ori zeci (20 × 30): sute la rând
          [m, t, shape] = [10 * int(rand, 2, 5), 10 * int(rand, 2, 5), row(100)];
        }
        if ((roll < 0.85 && m % 10 === 0) || m * t > 1000) continue;
        const q = placed('inm-zeci-2x2', rand, [m, t], shape, slot, 1000);
        if (q) return q;
      }
    },
  },
  'cmp-inm-1000': {
    label: 'Comparări cu înmulțiri până la 1000',
    points: 3,
    fastMs: 6000,
    mode: 'compare',
    concepts: [EXPRESII],
    generate(rand) {
      for (;;) {
        const roll = rand();
        let left;
        let right;
        if (roll < 0.2) {
          // dublare și înjumătățire: 12 × 20 = 24 × 10; jumătate din ele cu un factor schimbat cu 1 (25 × 10)
          const t = pickOne(rand, [20, 40, 60, 80]);
          const m = int(rand, 11, 49);
          const d = 2 * m + (rand() < 0.5 ? 0 : pickOne(rand, [-1, 1]));
          if (m * t > 1000 || d * (t / 2) > 1000) continue;
          [left, right] = [product(rand, m, t), product(rand, d, t / 2)];
        } else if (roll < 0.35) {
          // × 11 = × 10 + încă o dată: 11 × 23 și 230 + 23 (uneori cu o unitate sau o zece greșită)
          const n = int(rand, 12, 90);
          left = product(rand, 11, n);
          right = rand() < 0.5 ? `${10 * n} + ${n}` : pickOne(rand, [`${10 * n} + ${n + 1}`, `${10 * n} + ${n - 1}`, `${10 * n + 10} + ${n}`, `${10 * n - 10} + ${n}`]);
        } else if (roll < 0.45) {
          // aceiași factori, în altă ordine
          const [a, n] = oneByTwo(rand, { aMin: 3, min: 110, max: 500 });
          [left, right] = [`${a}${TIMES}${n}`, `${n}${TIMES}${a}`];
        } else if (roll < 0.7) {
          // un factor mai mare sau mai mic cu 1–2
          const [a, n] = oneByTwo(rand, { aMin: 3, min: 110, max: 500 });
          const d = pickOne(rand, [-2, -1, 1, 2]);
          const [b, m] = rand() < 0.5 ? [a + d, n] : [a, n + d];
          if (b < 2 || b > 9 || m < 11 || m > 99 || b * m > 1000) continue;
          [left, right] = [product(rand, a, n), product(rand, b, m)];
        } else {
          // un produs față de rotunjirea factorului mare (7 × 46 și 7 × 50; fără 100, care are trei cifre) sau față de zecea apropiată
          const [a, n] = oneByTwo(rand, { aMin: 3, min: 110, max: 500 });
          const p = a * n;
          const rounded = Math.round(n / 10) * 10;
          if (rounded === 100) continue;
          left = product(rand, a, n);
          right = rand() < 0.5 ? product(rand, a, rounded) : String(Math.round(p / 10) * 10 + pickOne(rand, [-10, 0, 10]));
        }
        if (rand() < 0.5) [left, right] = [right, left];
        return compare('cmp-inm-1000', left, right);
      }
    },
  },
  'inm-factor-lipsa-mare': {
    label: 'Factorul lipsă, cu zeci rotunde sau numere până la 19',
    points: 4,
    fastMs: 8000,
    mode: 'choice',
    concepts: [FACTOR, INM_1000, STRATEGII],
    generate(rand) {
      // factorul vizibil: o zece rotundă (20–90) sau un număr de la 11 la 19 (produsul rămâne sub 1000)
      return missingFactor('inm-factor-lipsa-mare', rand, rand() < 0.6 ? 10 * int(rand, 2, 9) : int(rand, 11, 19));
    },
  },
};
