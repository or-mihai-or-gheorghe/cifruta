// Jocuri fulger: tipurile temei „Împărțirea”. La Ușor, împărțirea la 2, 3, 4, 5 și 10, scăderea repetată și probleme scurte (împărțirea
// în părți egale și în grupe); la Intermediar, toată tabla împărțirii, deîmpărțitul sau împărțitorul lipsă (ecuații cu căsuța) și
// probleme; la Avansat, câturi de două cifre în care fiecare cifră se împarte exact (84 : 4 = 21, 80 : 4 = 20; materie de clasa a
// III-a), tot cu căsuța. Alunele sunt pe măsura timpului (cam 1 la 2 s de timp „fulger”).
//
// Variantele n-au tipare care să arate răspunsul (măsurat de ghicitorii din tests/fulger.test.js): locul răspunsului se alege întâi, apoi
// un calcul care încape cu răspunsul acolo, iar felul întrebării (deîmpărțitul sau împărțitorul lipsă) se alege înaintea buclei.
// - la tablă: patru câturi la rând (vecinii din tablă se încurcă: 7 × 6 cu 7 × 7);
// - la deîmpărțitul lipsă: un rând al tablei, adică multiplii împărțitorului (la câturi de două cifre, patru zeci la rând, cu aceleași
//   unități, ca la înmulțirea „o cifră × două cifre”);
// - la câturi de două cifre: careul [0, 1, 10, 11], ca nici zecile, nici unitățile singure să nu dea răspunsul;
// - nicio variantă nu e cât deîmpărțitul sau mai mare, iar deîmpărțiții din tablă au cel puțin 10.

import { cantitate } from '../core/ro.js';
import { promptLength } from './art.js';
import { cate, GROUP_ITEMS } from './contexte.js';
import { boxChoice, compare, numberQuestion, shapedChoice } from './intrebari.js';
import { int, pickOne, placeAt, row, SHAPES } from './rand.js';

const TABLA_IMP = 'mat.op.tabla-impartirii';
const TABLA_INM = 'mat.op.tabla-inmultirii';
const IMPARTIRE = 'mat.op.impartire';
const NECUNOSCUT = 'mat.op.impartire-necunoscut';
const ZECI = 'mat.op.impartire-zeci';
const EXPRESII = 'mat.op.comparare-expresii';

const NB = ' ';
const SMALL = [2, 3, 4, 5, 10];
const FULL = [2, 3, 4, 5, 6, 7, 8, 9, 10];
const RELATIONS = ['<', '=', '>'];

const division = (n, d) => `${n} : ${d}`;
/** Patru numere la rând, de la `start`. */
const windowOf = (start) => [0, 1, 2, 3].map((i) => start + i);

/**
 * Un fapt din tablă cu împărțitorul din `divisors`, câtul între 2 și 10 și deîmpărțitul de cel puțin 10, astfel încât câtul să stea pe
 * locul `slot` din patru câturi la rând, toate cel puțin 1.
 */
function tableFact(rand, divisors, slot) {
  for (;;) {
    const d = pickOne(rand, divisors);
    const q = int(rand, 2, 10);
    if (d * q >= 10 && q - slot >= 1) return { d, q, n: d * q };
  }
}

/** Deîmpărțiții de două cifre în care fiecare cifră se împarte exact (84 : 4 = 21, 60 : 3 = 20): câtul are două cifre. */
export const DIGITWISE = [];
for (let d = 2; d <= 9; d++) {
  for (let t = d; t <= 9; t += d) for (let u = 0; u <= 9; u += d) DIGITWISE.push({ n: 10 * t + u, d, q: (10 * t + u) / d });
}

/** O latură de comparat cu un cât dat: un număr sau altă împărțire cu acel cât (cu alt împărțitor), din lista dată. */
function sideWithQuotient(rand, q, facts, avoid) {
  const same = facts.filter((f) => f.q === q && f.d !== avoid);
  if (same.length && rand() < 0.6) {
    const f = pickOne(rand, same);
    return division(f.n, f.d);
  }
  return String(q);
}

/** Probleme scurte: „18 mere la 3 copii. Câte are fiecare?” (părți egale) sau „18 mere, câte 3 în cutie. Câte cutii?” (grupe). */
function problem(kind, rand, divisors, qMax) {
  const slot = int(rand, 0, 3);
  const parti = rand() < 0.5;
  for (;;) {
    const item = pickOne(rand, GROUP_ITEMS);
    const d = pickOne(rand, divisors);
    const q = int(rand, 2, qMax);
    const n = d * q;
    if (n < 10 || q - slot < 1) continue;
    const many = cantitate(n, item.sg, item.name);
    const prompt = parti ? `${many} la ${d} copii. ${cate(item.f)} are fiecare?` : `${many}, câte ${d} în cutie. Câte cutii?`;
    // „100 de portocale la 10 copii…” ar trece de 45 de caractere: alt obiect sau alte numere
    if (promptLength(prompt) > 45) continue;
    return numberQuestion(kind, rand, {
      prompt,
      key: `${item.emoji}:${n}:${d}:${parti ? 'parti' : 'grupe'}`,
      answer: q,
      fixed: windowOf(q - slot),
      ask: { op: parti ? 'parti' : 'grupe' },
    });
  }
}

/** Comparări cu un semn ales întâi (fiecare semn apare cam o dată din trei); laturile se schimbă între ele la întâmplare. */
function relationFirst(kind, rand, make) {
  const rel = pickOne(rand, RELATIONS);
  for (;;) {
    const sides = make(rel);
    if (!sides) continue;
    const [l, r] = rand() < 0.5 ? sides : [sides[1], sides[0]];
    return compare(kind, l, r);
  }
}
const shifted = (rand, q, rel) => (rel === '=' ? q : rel === '<' ? q + int(rand, 1, 2) : q - int(rand, 1, 2));

/** Faptele din tablă pentru comparări: împărțitorii dați, câtul 2–10, deîmpărțitul cel puțin 10. */
const facts = (divisors) => divisors.flatMap((d) => Array.from({ length: 9 }, (_, i) => ({ d, q: i + 2, n: d * (i + 2) })).filter((f) => f.n >= 10));
const SMALL_FACTS = facts(SMALL);
const FULL_FACTS = facts(FULL);

export const IMPARTIRE_KINDS = {
  // ——— Ușor: împărțirea la 2, 3, 4, 5 și 10, scăderea repetată, probleme scurte ———
  'imp-tabla-mica': {
    label: 'Împărțirea la 2, 3, 4, 5 și 10',
    points: 2,
    fastMs: 4500,
    mode: 'choice',
    concepts: [TABLA_IMP],
    generate(rand) {
      const slot = int(rand, 0, 3);
      const { d, q, n } = tableFact(rand, SMALL, slot);
      return shapedChoice('imp-tabla-mica', division(n, d), windowOf(q - slot));
    },
  },
  'cmp-imp-tabla-mica': {
    label: 'Comparări cu împărțiri la 2, 3, 4, 5 și 10',
    points: 3,
    fastMs: 5500,
    mode: 'compare',
    concepts: [TABLA_IMP, EXPRESII],
    generate(rand) {
      return relationFirst('cmp-imp-tabla-mica', rand, (rel) => {
        const f = pickOne(rand, SMALL_FACTS);
        const q2 = shifted(rand, f.q, rel);
        if (q2 < 1) return null;
        const other = sideWithQuotient(rand, q2, SMALL_FACTS, f.d);
        return [division(f.n, f.d), other];
      });
    },
  },
  'imp-scadere-repetata': {
    label: 'Împărțirea ca scădere repetată',
    points: 2,
    fastMs: 5000,
    mode: 'figure',
    concepts: [IMPARTIRE],
    generate(rand) {
      // de câte ori am scăzut: 2–4 scăderi (cerința de cel mult 45 de caractere), împărțitorul de o cifră, ca șirul să încapă pe telefon
      const slot = int(rand, 0, 3);
      for (;;) {
        const d = int(rand, 2, 9);
        const k = int(rand, 2, 4);
        if (k - slot < 1) continue;
        const n = d * k;
        // spații nedespărțite în șir: o scădere rămasă singură pe rândul următor s-ar număra greșit
        const chain = [n, ...Array(k).fill(d)].join(`${NB}−${NB}`);
        return numberQuestion('imp-scadere-repetata', rand, {
          prompt: `${chain}${NB}=${NB}0, deci ${n}${NB}:${NB}${d}${NB}=${NB}?`,
          key: `${n}:${d}`,
          answer: k,
          fixed: windowOf(k - slot),
          ask: { op: 'scadere-repetata' },
        });
      }
    },
  },
  'imp-problema-mica': {
    label: 'Probleme scurte: împărțim în mod egal',
    points: 3,
    fastMs: 7000,
    mode: 'figure',
    concepts: [IMPARTIRE],
    generate: (rand) => problem('imp-problema-mica', rand, SMALL, 10),
  },

  // ——— Intermediar: toată tabla împărțirii, căsuța, probleme ———
  'imp-tabla': {
    label: 'Tabla împărțirii',
    points: 2,
    fastMs: 5000,
    mode: 'choice',
    concepts: [TABLA_IMP],
    generate(rand) {
      const slot = int(rand, 0, 3);
      const { d, q, n } = tableFact(rand, FULL, slot);
      return shapedChoice('imp-tabla', division(n, d), windowOf(q - slot));
    },
  },
  'cmp-imp-tabla': {
    label: 'Comparări cu împărțiri și înmulțiri din tablă',
    points: 3,
    fastMs: 6000,
    mode: 'compare',
    concepts: [TABLA_IMP, TABLA_INM, EXPRESII],
    generate(rand) {
      return relationFirst('cmp-imp-tabla', rand, (rel) => {
        const f = pickOne(rand, FULL_FACTS);
        const q2 = shifted(rand, f.q, rel);
        if (q2 < 1) return null;
        // cealaltă latură: altă împărțire, un număr sau o înmulțire mică (2 × 3) cu același rezultat
        if (rand() < 0.4) {
          const pairs = [];
          for (let a = 2; a <= 9; a++) for (let b = a; b <= 9; b++) if (a * b === q2) pairs.push([a, b]);
          if (pairs.length) {
            const [a, b] = pickOne(rand, pairs);
            return [division(f.n, f.d), rand() < 0.5 ? `${a} × ${b}` : `${b} × ${a}`];
          }
        }
        return [division(f.n, f.d), sideWithQuotient(rand, q2, FULL_FACTS, f.d)];
      });
    },
  },
  'imp-lipsa': {
    label: 'Deîmpărțitul sau împărțitorul lipsă',
    points: 3,
    fastMs: 6500,
    mode: 'choice',
    concepts: [NECUNOSCUT, TABLA_IMP],
    generate(rand) {
      const slot = int(rand, 0, 3);
      const dividend = rand() < 0.5;
      for (;;) {
        const d = int(rand, 2, 9);
        const q = int(rand, 2, 10);
        const n = d * q;
        if (n < 10) continue;
        if (dividend) {
          // „□ : 4 = 7”: deîmpărțitul; variantele sunt multipli ai împărțitorului (un rând al tablei)
          const choices = placeAt(n, row(d), slot, { min: d, max: 100 });
          if (choices) return boxChoice('imp-lipsa', `□ : ${d} = ${q}`, `${q} × ${d}`, choices);
        } else if (d - slot >= 2 && d - slot + 3 <= 10) {
          // „28 : □ = 7”: împărțitorul; variantele sunt patru numere la rând, între 2 și 10
          return boxChoice('imp-lipsa', `${n} : □ = ${q}`, `${n} : ${q}`, windowOf(d - slot));
        }
      }
    },
  },
  'imp-problema': {
    label: 'Probleme cu împărțirea până la 100',
    points: 3,
    fastMs: 7500,
    mode: 'figure',
    concepts: [IMPARTIRE],
    generate: (rand) => problem('imp-problema', rand, FULL, 10),
  },

  // ——— Avansat: câturi de două cifre (84 : 4, 80 : 4) ———
  'imp-2c': {
    label: 'Câturi de două cifre (84 : 4, 80 : 4)',
    points: 3,
    fastMs: 6500,
    mode: 'choice',
    concepts: [ZECI],
    generate(rand) {
      const slot = int(rand, 0, 3);
      for (;;) {
        const { n, d, q } = pickOne(rand, DIGITWISE);
        const choices = placeAt(q, SHAPES.grid10, slot, { min: 1, max: n - 1 });
        if (choices) return shapedChoice('imp-2c', division(n, d), choices);
      }
    },
  },
  'imp-lipsa-2c': {
    label: 'Deîmpărțitul sau împărțitorul lipsă, cu câturi de două cifre',
    points: 4,
    fastMs: 8000,
    mode: 'choice',
    concepts: [NECUNOSCUT, ZECI],
    generate(rand) {
      const slot = int(rand, 0, 3);
      const dividend = rand() < 0.5;
      for (;;) {
        const { n, d, q } = pickOne(rand, DIGITWISE);
        if (dividend) {
          // „□ : 3 = 32”: deîmpărțitul (32 × 3); variantele sunt patru zeci la rând, cu aceleași unități, ca la înmulțire: ultima cifră
          // (2 × 3 = 6) se află dintr-o privire, deci n-are voie să dea răspunsul
          const choices = placeAt(n, SHAPES.tens, slot, { min: 10, max: 99 });
          if (choices) return boxChoice('imp-lipsa-2c', `□ : ${d} = ${q}`, `${q} × ${d}`, choices);
        } else if (d - slot >= 2 && d - slot + 3 <= 9) {
          // „84 : □ = 21”: împărțitorul, între 2 și 9
          return boxChoice('imp-lipsa-2c', `${n} : □ = ${q}`, `${n} : ${q}`, windowOf(d - slot));
        }
      }
    },
  },
  'cmp-imp-2c': {
    label: 'Comparări cu câturi de două cifre',
    points: 4,
    fastMs: 7500,
    mode: 'compare',
    concepts: [ZECI, EXPRESII],
    generate(rand) {
      return relationFirst('cmp-imp-2c', rand, (rel) => {
        const f = pickOne(rand, DIGITWISE);
        const q2 = rel === '=' ? f.q : rel === '<' ? f.q + pickOne(rand, [1, 2, 10]) : f.q - pickOne(rand, [1, 2, 10]);
        if (q2 < 10) return null;
        return [division(f.n, f.d), sideWithQuotient(rand, q2, DIGITWISE, f.d)];
      });
    },
  },
};
