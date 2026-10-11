// Jocuri fulger: tipurile temei „Numere până la 1000”. Sute, zeci și unități: formarea numerelor (numărătoarea, forma desfășurată,
// scrierea cu cifre), comparări, ordonări, șiruri, rotunjire la sute și calcule fără trecere peste ordin. La Avansat apare o
// singură trecere simplă: la unități (345 + 27) sau cu un împrumut din zeci (452 − 28), niciodată două și niciodată la sute.
// Variantele au o formă fixă, cu răspunsul pe un loc la întâmplare, ca forma lor să nu-l arate: pe numărătoare, câte o greșeală pe
// fiecare ordin; la numerele scrise cu litere și la forma desfășurată, o unitate și o zece în aceeași sută; la calcule (`calcChoice`),
// forma potrivită calculului (sute la rând, zeci la rând, pătratul cu zeci și sute, unități și zeci), fără variante absurde (o sumă
// mai mică decât un termen); la șiruri și rotunjire, variantele rămân din greșelile tipice.

import { cantitate, numberToWords } from '../core/ro.js';
import { trecere } from '../core/rules.js';
import { calcChoice, compare, numberQuestion, sorting } from './intrebari.js';
import { distinct, int, pickOne, shapeChoices, SHAPES } from './rand.js';

const PLUS = ' + ';
const MINUS = ' − ';

const FORMARE = 'mat.nr1000.formare';
const SCRIERE = 'mat.nr1000.citire-scriere';
const COMPARARE = 'mat.nr1000.comparare';
const ORDONARE = 'mat.nr1000.ordonare';
const SIRURI = 'mat.nr1000.siruri';
const ROTUNJIRE = 'mat.nr1000.rotunjire';
const FARA = 'mat.op1000.fara-trecere';
const CU = 'mat.op1000.cu-trecere';
const EXPRESII = 'mat.op.comparare-expresii';

const MAX = 1000; // marginea variantelor numerice (fără ea, `withChoices` caută variante până la 100)
/** Cifrele unui număr: sute, zeci, unități. */
const szu = (n) => [Math.floor(n / 100), Math.floor(n / 10) % 10, n % 10];
/** Numărul cu cifrele date (3, 4, 5 → 345), pentru răspunsuri și pentru cifrele citite în altă ordine. */
const num = (s, z, u) => 100 * s + 10 * z + u;
/** Suma cifrelor unei coloane trece peste 9 (adunare cu oricâți termeni). */
const anyCarry = (terms) => [1, 10, 100].some((p) => terms.reduce((sum, x) => sum + (Math.floor(x / p) % 10), 0) >= 10);

/** Patru numere care se încurcă ușor: aceleași cifre, zerourile pe alt loc sau numere vecine. */
function trickyFour(rand) {
  const roll = rand();
  if (roll < 0.4) {
    const [a, b, c] = distinct(rand, 3, 1, 9);
    return [num(a, b, c), num(a, c, b), num(b, a, c), num(c, b, a)];
  }
  if (roll < 0.7) {
    const s = int(rand, 1, 9);
    const [x, y] = distinct(rand, 2, 1, 9);
    return [num(s, 0, x), num(s, x, 0), num(s, 0, y), num(s, y, 0)];
  }
  const c = int(rand, 230, 770);
  return distinct(rand, 4, c - 30, c + 30);
}

export const KINDS_1000 = {
  // ——— Ușor: sute, zeci și unități ———
  'nr-numaratoare': {
    label: 'Numărătoarea: ce număr arată',
    points: 2,
    fastMs: 5500,
    mode: 'figure',
    concepts: [FORMARE],
    generate(rand) {
      const [s, z, u] = [int(rand, 1, 8), int(rand, 0, 9), int(rand, 0, 9)];
      const answer = num(s, z, u);
      // numele citit de cititorul de ecran spune mărgelele, nu numărul (numărul e chiar răspunsul)
      const figure = {
        v: 'abacus',
        places: 'SZU',
        S: s,
        Z: z,
        U: u,
        alt: `numărătoare cu ${cantitate(s, 'mărgea', 'mărgele')} pe tija sutelor, ${z} pe a zecilor și ${u} pe a unităților`,
      };
      return numberQuestion('nr-numaratoare', rand, {
        prompt: 'Ce număr arată numărătoarea?',
        figure,
        key: `${s}${z}${u}`,
        answer,
        // o mărgea în plus sau în minus pe fiecare tijă ({x, x + 1, x + 10, x + 100}), cu răspunsul pe un loc la întâmplare: toate
        // tijele trebuie citite, iar forma variantelor nu-l arată (tijele citite în altă ordine lăsau răspunsul la mijloc)
        fixed: shapeChoices(rand, answer, SHAPES.place, { min: 100, max: 999 }),
        ask: { op: 'abacus' },
      });
    },
  },

  'nr-litere': {
    label: 'Scrie cu cifre numărul citit',
    points: 2,
    fastMs: 5500,
    mode: 'figure',
    concepts: [SCRIERE],
    generate(rand) {
      const [s, z, u] = [int(rand, 1, 9), int(rand, 0, 9), int(rand, 0, 9)];
      const answer = num(s, z, u);
      // sutele se aud în cuvinte, deci variantele rămân în aceeași sută: o unitate și o zece în plus ori în minus, toate de trei cifre;
      // nici lungimea (4007, 47), nici forma variantelor, nici unitățile singure nu arată răspunsul
      return numberQuestion('nr-litere', rand, {
        prompt: `Scrie cu cifre: ${numberToWords(answer)}`,
        key: `${answer}`,
        answer,
        fixed: shapeChoices(rand, answer, SHAPES.grid10, { min: 100 * s, max: 100 * s + 99 }),
        ask: { op: 'litere' },
      });
    },
  },

  'op-sute': {
    label: 'Sute rotunde: adunări și scăderi',
    points: 1,
    fastMs: 3500,
    mode: 'choice',
    concepts: [FARA],
    generate(rand) {
      // rezultatul are între 4 și 7 sute; variantele sunt patru sute la rând, cu răspunsul pe un loc la întâmplare (un calcul cu o
      // cifră, pe sute: locul la întâmplare are întâietate față de plauzibilitate, ca la calculele cu o cifră)
      const h = int(rand, 4, 7);
      if (rand() < 0.55) {
        const a = int(rand, 1, h - 1);
        return calcChoice('op-sute', rand, `${100 * a}${PLUS}${100 * (h - a)}`, { min: 100, max: MAX, plausible: false });
      }
      const b = int(rand, 1, 9 - h);
      return calcChoice('op-sute', rand, `${100 * (h + b)}${MINUS}${100 * b}`, { min: 100, max: MAX, plausible: false });
    },
  },

  'nr-extins': {
    label: 'Forma desfășurată: sute, zeci, unități',
    points: 2,
    fastMs: 4000,
    mode: 'choice',
    concepts: [FORMARE, FARA],
    generate(rand) {
      for (;;) {
        const [s, z, u] = [int(rand, 1, 9), int(rand, 0, 9), int(rand, 0, 9)];
        const parts = [100 * s, 10 * z, u].filter((x) => x > 0);
        if (parts.length < 2) continue;
        // sutele sunt scrise în calcul, deci variantele rămân în aceeași sută: o unitate și o zece în plus ori în minus, cu răspunsul
        // pe un loc la întâmplare (patru numere la rând l-ar arăta prin unități, iar la zeci 0 n-ar încăpea sub el)
        const text = parts.join(PLUS);
        const answer = num(s, z, u);
        const choices = shapeChoices(rand, answer, SHAPES.grid10, { min: 100 * s, max: 100 * s + 99 });
        return { kind: 'nr-extins', mode: 'choice', key: `nr-extins:${text}`, text, answer, choices };
      }
    },
  },

  'cmp-sute': {
    label: 'Comparări cu sute și zeci rotunde',
    points: 1,
    fastMs: 3000,
    mode: 'compare',
    concepts: [COMPARARE],
    generate(rand) {
      const roll = rand();
      if (roll < 0.2) {
        const x = num(int(rand, 1, 9), int(rand, 0, 9), 0);
        return compare('cmp-sute', x, x);
      }
      if (roll < 0.55) {
        const [s, t] = distinct(rand, 2, 1, 9); // cifrele inversate: 340 și 430
        return compare('cmp-sute', num(s, t, 0), num(t, s, 0));
      }
      if (roll < 0.8) {
        const s = int(rand, 1, 9); // aceleași sute: 340 și 370
        const [t, u] = distinct(rand, 2, 0, 9);
        return compare('cmp-sute', num(s, t, 0), num(s, u, 0));
      }
      const [x, y] = distinct(rand, 2, 1, 9);
      return compare('cmp-sute', 100 * x, 100 * y);
    },
  },

  'sort-3-sute': {
    label: 'Ordonări cu sute diferite',
    points: 2,
    fastMs: 5500,
    mode: 'sort',
    concepts: [ORDONARE],
    generate: (rand) => sorting('sort-3-sute', rand, distinct(rand, 3, 1, 9).map((h) => num(h, int(rand, 0, 9), 0))),
  },

  // ——— Intermediar: calcule fără trecere, șiruri, rotunjire ———
  'add-1000-fara': {
    label: 'Adunări până la 1000, fără trecere',
    points: 3,
    fastMs: 6000,
    mode: 'choice',
    concepts: [FARA],
    generate(rand) {
      for (;;) {
        const a = int(rand, 101, 899);
        const roll = rand();
        // cu 1 sau 2, variantele plauzibile n-ar mai încăpea în jurul răspunsului
        const b = roll < 0.3 ? int(rand, 3, 9) : roll < 0.6 ? int(rand, 10, 99) : int(rand, 100, 499);
        if (trecere('+', a, b) || a + b > 999) continue;
        // variantele fără tipare și fără sume mai mici decât un termen (calcChoice)
        return calcChoice('add-1000-fara', rand, `${a}${PLUS}${b}`, { max: 999 });
      }
    },
  },

  'sub-1000-fara': {
    label: 'Scăderi până la 1000, fără împrumut',
    points: 3,
    fastMs: 6500,
    mode: 'choice',
    concepts: [FARA],
    generate(rand) {
      for (;;) {
        const a = int(rand, 120, 999);
        const roll = rand();
        // cu 1 sau 2, variantele plauzibile n-ar mai încăpea în jurul răspunsului
        const b = roll < 0.25 ? int(rand, 3, 9) : roll < 0.6 ? int(rand, 10, 99) : int(rand, 100, 499);
        if (b >= a || trecere('-', a, b) || a - b < 10) continue;
        return calcChoice('sub-1000-fara', rand, `${a}${MINUS}${b}`, { max: 999 });
      }
    },
  },

  'op-zeci-sute': {
    label: 'Adaugi sau scazi zeci și sute rotunde',
    points: 2,
    fastMs: 4500,
    mode: 'choice',
    concepts: [FARA],
    generate(rand) {
      for (;;) {
        const a = int(rand, 102, 989);
        const tens = rand() < 0.5;
        const b = tens ? 10 * int(rand, 1, 9) : 100 * int(rand, 1, 8);
        const add = rand() < 0.5;
        if (add ? trecere('+', a, b) || a + b > 999 : trecere('-', a, b) || a - b < 10) continue;
        // variantele cu aceleași unități (zeci sau sute în plus ori în minus), fără tipare
        return calcChoice('op-zeci-sute', rand, `${a}${add ? PLUS : MINUS}${b}`, { max: 999 });
      }
    },
  },

  'cmp-1000': {
    label: 'Comparări până la 1000',
    points: 2,
    fastMs: 3500,
    mode: 'compare',
    concepts: [COMPARARE],
    generate(rand) {
      const roll = rand();
      if (roll < 0.18) {
        const x = int(rand, 100, 999);
        return compare('cmp-1000', x, x);
      }
      if (roll < 0.45) {
        const [s, t] = [int(rand, 1, 9), int(rand, 0, 9)]; // aceleași sute și zeci: 457 și 453
        const [u, v] = distinct(rand, 2, 0, 9);
        return compare('cmp-1000', num(s, t, u), num(s, t, v));
      }
      if (roll < 0.7) {
        const [a, b, c] = distinct(rand, 3, 1, 9); // cifrele inversate: 345 și 543
        return compare('cmp-1000', num(a, b, c), num(c, b, a));
      }
      if (roll < 0.85) {
        const s = int(rand, 1, 9); // zeroul pe alt loc: 305 și 350
        const d = int(rand, 1, 9);
        // numărul cu zeroul la mijloc e mereu cel mic, deci laturile se dau la întâmplare (altfel răspunsul ar fi mereu „<”)
        const [p, q] = [num(s, 0, d), num(s, d, 0)];
        return rand() < 0.5 ? compare('cmp-1000', p, q) : compare('cmp-1000', q, p);
      }
      // în jurul sutei: unul sub 100, celălalt peste (99 și 100), în ordine la întâmplare
      const [x, y] = rand() < 0.5 ? [int(rand, 85, 99), int(rand, 100, 115)] : [int(rand, 100, 115), int(rand, 85, 99)];
      return compare('cmp-1000', x, y);
    },
  },

  'sort-4-1000': {
    label: 'Ordonări până la 1000',
    points: 3,
    fastMs: 8000,
    mode: 'sort',
    concepts: [ORDONARE],
    generate: (rand) => sorting('sort-4-1000', rand, trickyFour(rand)),
  },

  'sir-1000': {
    label: 'Șiruri din 10 în 10 și din 100 în 100',
    points: 3,
    fastMs: 6000,
    mode: 'figure',
    concepts: [SIRURI],
    generate(rand) {
      for (;;) {
        const step = pickOne(rand, [10, -10, 100, -100]);
        const first = num(int(rand, 1, 9), int(rand, 0, 9), 0);
        const terms = [0, 1, 2, 3].map((i) => first + i * step);
        if (terms.some((x) => x < 110 || x > 990)) continue;
        // la pasul de 10, șirul rămâne în aceeași sută: fără trecere peste ordin
        if (Math.abs(step) === 10 && Math.floor(terms[0] / 100) !== Math.floor(terms[3] / 100)) continue;
        const hole = rand() < 0.35 ? int(rand, 1, 2) : 3;
        const answer = terms[hole];
        // răspunsul stă între 200 și 800: așa are distractori rotunzi și deasupra, și dedesubt
        if (answer < 200 || answer > 800) continue;
        const other = Math.abs(step) === 10 ? 100 : 10;
        const shown = terms.map((x, i) => (i === hole ? '?' : x));
        // un număr care stă deja în cerință se elimină din ochi: îl păstrăm doar pe cel dinainte de gol („îl repet pe ultimul”)
        const printed = new Set(hole === 3 ? terms.slice(0, 3) : terms.filter((_, i) => i !== hole));
        // pasul greșit (+1 în loc de +10), pasul celălalt, un pas sau doi în plus ori în minus
        const wrong = [terms[hole - 1] + Math.sign(step), answer + step, answer - 2 * step, answer + 2 * step]
          .concat([other, -other, 2 * other, -2 * other].map((d) => answer + d))
          .filter((x) => !printed.has(x));
        return numberQuestion('sir-1000', rand, {
          prompt: hole === 3 ? `Ce urmează? ${terms.slice(0, 3).join(', ')}` : `Ce lipsește? ${shown.join(', ')}`,
          key: `${first}:${step}:${hole}`,
          answer,
          typical: [answer - step, ...wrong],
          max: MAX,
          ask: { op: 'sir' },
        });
      }
    },
  },

  'rotunjire-sute': {
    label: 'Rotunjirea la sute',
    points: 3,
    fastMs: 5500,
    mode: 'figure',
    concepts: [ROTUNJIRE],
    generate(rand) {
      let n;
      // 360–739: răspunsul are între 4 și 7 sute, deci are trei sute întregi de fiecare parte, pentru variante;
      // fără numerele terminate în 50 (cele de la jumătate) și fără sutele întregi (rotunjirea ar fi degeaba)
      do n = int(rand, 360, 739);
      while (n % 100 === 50 || n % 100 === 0);
      const answer = Math.round(n / 100) * 100;
      const up = n % 100 > 50; // se rotunjește în sus, deci suta în care s-ar rotunji greșit e cea de dedesubt
      const other = up ? answer - 100 : answer + 100;
      const ask = { op: 'rotunjire' };
      // jumătate din întrebări au patru sute la rând care le cuprind pe amândouă (suta bună și cea vecină), cu răspunsul pe o
      // poziție la întâmplare dintre cele posibile; la celelalte, variantele vin din greșelile tipice
      if (rand() < 0.5) {
        const below = up ? int(rand, 1, 3) : int(rand, 0, 2);
        return numberQuestion('rotunjire-sute', rand, {
          prompt: `Cât e ${n} rotunjit la sute?`,
          key: `${n}`,
          answer,
          fixed: [0, 1, 2, 3].map((i) => answer + (i - below) * 100),
          ask,
        });
      }
      return numberQuestion('rotunjire-sute', rand, {
        prompt: `Cât e ${n} rotunjit la sute?`,
        key: `${n}`,
        answer,
        // suta vecină, numărul rotunjit la zeci (nerotunjit până la sute) și sutele mai depărtate
        typical: [other, answer - 100, answer + 100, Math.round(n / 10) * 10, answer - 200, answer + 200, answer - 300, answer + 300],
        max: MAX,
        ask,
      });
    },
  },

  // ——— Avansat: trei termeni, comparări cu calcule, o trecere simplă ———
  'add-3op-1000': {
    label: 'Adunări cu trei termeni, fără trecere',
    points: 4,
    fastMs: 8000,
    mode: 'choice',
    concepts: [FARA],
    generate(rand) {
      for (;;) {
        const terms = [int(rand, 100, 500), int(rand, 10, 300), rand() < 0.5 ? int(rand, 1, 9) : int(rand, 10, 99)];
        const r = terms[0] + terms[1] + terms[2];
        if (r > 999 || anyCarry(terms)) continue;
        return calcChoice('add-3op-1000', rand, terms.join(PLUS), { max: 999 });
      }
    },
  },

  'cmp-expr-1000': {
    label: 'Comparări cu calcule până la 1000',
    points: 4,
    fastMs: 6000,
    mode: 'compare',
    concepts: [EXPRESII],
    generate(rand) {
      for (;;) {
        const add = rand() < 0.55;
        const a = int(rand, 120, 800);
        const b = int(rand, 10, 199);
        if (add ? trecere('+', a, b) || a + b > 999 : trecere('-', a, b) || a - b < 100) continue;
        const value = add ? a + b : a - b;
        const n = value + pickOne(rand, [-20, -10, -2, -1, 0, 0, 1, 2, 10, 20]);
        if (n < 100 || n > 999) continue;
        const expr = `${a}${add ? PLUS : MINUS}${b}`;
        return rand() < 0.3 ? compare('cmp-expr-1000', n, expr) : compare('cmp-expr-1000', expr, n);
      }
    },
  },

  'sort-4-1000-dir': {
    label: 'Ordonări până la 1000, crescătoare și descrescătoare',
    points: 4,
    fastMs: 9000,
    mode: 'sort',
    concepts: [ORDONARE],
    generate: (rand) => sorting('sort-4-1000-dir', rand, trickyFour(rand), rand() < 0.5 ? 'asc' : 'desc'),
  },

  'add-1000-cu': {
    label: 'Adunări cu o trecere la unități',
    points: 5,
    fastMs: 8000,
    mode: 'choice',
    concepts: [CU],
    generate(rand) {
      for (;;) {
        const a = int(rand, 105, 879);
        const b = rand() < 0.35 ? int(rand, 2, 9) : int(rand, 11, 99);
        const [, za, ua] = szu(a);
        const [, zb, ub] = szu(b);
        // o singură trecere: unitățile trec de 10, iar zecile (cu zecea trecută) rămân sub 10
        if (ua + ub < 10 || za + zb + 1 > 9 || a + b < 110 || a + b > 889) continue;
        // variantele fără tipare și fără sume mai mici decât primul termen (calcChoice): zecea trecută uitată (345 + 27 → 362) e
        // una dintre ele; fără termenii calculului printre variante
        const q = calcChoice('add-1000-cu', rand, `${a}${PLUS}${b}`, { max: 999 });
        if (!q.choices.includes(a) && !q.choices.includes(b)) return q;
      }
    },
  },

  'sub-1000-cu': {
    label: 'Scăderi cu un împrumut din zeci',
    points: 5,
    fastMs: 9000,
    mode: 'choice',
    concepts: [CU],
    generate(rand) {
      for (;;) {
        const a = int(rand, 120, 999);
        const b = rand() < 0.35 ? int(rand, 2, 9) : int(rand, 11, 99);
        const [, za, ua] = szu(a);
        const [, zb, ub] = szu(b);
        // se împrumută doar din zeci: unitățile nu ajung, dar zecile rămân destule
        if (ua >= ub || za - 1 < zb || a - b < 110 || a - b > 889) continue;
        // variantele fără tipare și fără diferențe mai mari decât descăzutul (calcChoice): împrumutul fără micșorare (452 − 28 → 434)
        // e una dintre ele; fără termenii calculului printre variante
        const q = calcChoice('sub-1000-cu', rand, `${a}${MINUS}${b}`, { max: 999 });
        if (!q.choices.includes(a) && !q.choices.includes(b)) return q;
      }
    },
  },
};
