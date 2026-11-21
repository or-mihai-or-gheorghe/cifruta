// Jocuri fulger: tipurile temei „Termenul necunoscut” (ecuații cu căsuța). La Ușor, termenul, descăzutul și scăzătorul necunoscut până
// la 20 și balanța cu sume până la 20 („8 + 7 ◻ 9 + 6”: semnul = ca balanță dreaptă); la Intermediar, aceleași până la 100, plus
// factorul necunoscut (din „Înmulțirea”) și deîmpărțitul sau împărțitorul necunoscut (din „Împărțirea”); la Avansat, balanța cu căsuța
// („8 + 4 = □ + 5”), ecuații în doi pași („□ + 5 = 3 × 4”), termenul necunoscut până la 1000 și balanța cu înmulțiri și împărțiri.
//
// Toate ecuațiile sunt întrebări „choice” cu căsuța (`boxChoice`): răspunsul vine din calculul care rezolvă ecuația, iar variantele,
// de obicei, din `calcChoices` pe același calcul (formele calculelor obișnuite: fără tipare, cu răspunsul pe oricare loc, iar la
// calculele cu trecere cu aceleași unități). La balanța cu căsuța, variantele au forma [0, 1, c, c + 1], cu locul ales întâi: greșeala
// tipică (8 + 4 = 12, adică „=” citit ca „scrie rezultatul”) apare în jumătate din întrebări, iar ghicitorii din test nimeresc tot o
// dată din patru; răspunsurile ei rămân sub 23, deci ultima cifră nu ajunge să le arate. Felul ecuației se alege înaintea buclei, ca o întrebare refăcută să nu treacă la alt fel.

import { boxChoice, calcChoices, compare } from './intrebari.js';
import { int, pickOne, placeAt } from './rand.js';

const NECUNOSCUT = 'mat.op.necunoscut';
const BALANTA = 'mat.op.balanta';
const EXPRESII = 'mat.op.comparare-expresii';
const DOI_PASI = 'mat.op.necunoscut-doi-pasi';
const TABLA_INM = 'mat.op.tabla-inmultirii';
const TABLA_IMP = 'mat.op.tabla-impartirii';
const FARA = 'mat.op.fara-trecere';
const CU = 'mat.op.cu-trecere';
const FARA_1000 = 'mat.op1000.fara-trecere';
const CU_1000 = 'mat.op1000.cu-trecere';
const RELATIONS = ['<', '=', '>'];

/** Termenul necunoscut: „□ + a = s” sau „a + □ = s”, cu variantele calculului `s − a`. */
function missingTerm(kind, rand, x, a, opts) {
  const s = x + a;
  const text = rand() < 0.5 ? `□ + ${a} = ${s}` : `${a} + □ = ${s}`;
  const solving = `${s} − ${a}`;
  return boxChoice(kind, text, solving, calcChoices(rand, solving, opts));
}

/** Scăzătorul necunoscut („s − □ = r”, cu `s − r`) sau descăzutul necunoscut („□ − a = r”, cu `r + a`). */
function missingSub(kind, rand, form, [s, x, a, r], opts) {
  if (form === 'scazator') return boxChoice(kind, `${s} − □ = ${s - x}`, `${s} − ${s - x}`, calcChoices(rand, `${s} − ${s - x}`, opts));
  return boxChoice(kind, `□ − ${a} = ${r}`, `${r} + ${a}`, calcChoices(rand, `${r} + ${a}`, opts));
}

/**
 * Balanța cu două sume („8 + 7 ◻ 9 + 6”): semnul se alege întâi; la „=”, aceeași sumă mutată dintr-un termen în celălalt (8 + 7 = 9 + 6),
 * ca semnul să se vadă și fără să socotești. `range` dă termenii, `max` suma.
 */
function sums(kind, rand, [lo, hi], max) {
  const rel = pickOne(rand, RELATIONS);
  for (;;) {
    const a = int(rand, lo, hi);
    const b = int(rand, lo, hi);
    if (a + b > max) continue;
    const k = int(rand, 1, Math.max(1, Math.min(9, b - lo)));
    // c + d = a + b; la „<” și „>”, al doilea termen crește sau scade cu 1–3
    let [c, d] = [a + k, b - k];
    if (rel === '<') d += int(rand, 1, 3);
    else if (rel === '>') d -= int(rand, 1, 3);
    if (c < lo || d < lo || c > hi || d > hi || c + d > max || (c === a && d === b) || (c === b && d === a)) continue;
    const [l, r] = rand() < 0.5 ? [`${a} + ${b}`, `${c} + ${d}`] : [`${c} + ${d}`, `${a} + ${b}`];
    return compare(kind, l, r);
  }
}

/** Faptele din tablă cu același rezultat: produse (3 × 8 = 4 × 6) și câturi (24 : 4 = 18 : 3). */
const PRODUCTS = [];
for (let a = 2; a <= 9; a++) for (let b = 2; b <= 9; b++) PRODUCTS.push({ text: `${a} × ${b}`, value: a * b });
const QUOTIENTS = [];
for (let d = 2; d <= 9; d++) for (let q = 2; q <= 9; q++) QUOTIENTS.push({ text: `${d * q} : ${d}`, value: q });

export const ECUATII_KINDS = {
  // ——— Ușor: până la 20 ———
  'ec-termen-20': {
    label: 'Termenul necunoscut, până la 20',
    points: 2,
    fastMs: 5000,
    mode: 'choice',
    concepts: [NECUNOSCUT, FARA, CU],
    generate(rand) {
      for (;;) {
        const x = int(rand, 2, 11);
        const a = int(rand, 2, 9);
        if (x + a <= 20) return missingTerm('ec-termen-20', rand, x, a, { max: 30, plausible: false });
      }
    },
  },
  'ec-scadere-20': {
    label: 'Descăzutul sau scăzătorul necunoscut, până la 20',
    points: 2,
    fastMs: 5500,
    mode: 'choice',
    concepts: [NECUNOSCUT, FARA, CU],
    generate(rand) {
      const form = rand() < 0.5 ? 'scazator' : 'descazut';
      for (;;) {
        const s = int(rand, 6, 20);
        const x = int(rand, 2, 9);
        const a = int(rand, 2, 9);
        const r = int(rand, 1, 11);
        if (form === 'scazator' ? s - x >= 1 : a + r <= 20) return missingSub('ec-scadere-20', rand, form, [s, x, a, r], { max: 30, plausible: false });
      }
    },
  },
  'cmp-balanta-20': {
    label: 'Balanța: sume până la 20',
    points: 3,
    fastMs: 5500,
    mode: 'compare',
    concepts: [BALANTA, EXPRESII],
    generate: (rand) => sums('cmp-balanta-20', rand, [2, 9], 18),
  },

  // ——— Intermediar: până la 100 ———
  'ec-termen-100': {
    label: 'Termenul necunoscut, până la 100',
    points: 3,
    fastMs: 7000,
    mode: 'choice',
    concepts: [NECUNOSCUT, FARA, CU],
    generate(rand) {
      for (;;) {
        const x = int(rand, 11, 79);
        const a = int(rand, 11, 79);
        if (x + a <= 99) return missingTerm('ec-termen-100', rand, x, a, { max: 100 });
      }
    },
  },
  'ec-scadere-100': {
    label: 'Descăzutul sau scăzătorul necunoscut, până la 100',
    points: 3,
    fastMs: 7500,
    mode: 'choice',
    concepts: [NECUNOSCUT, FARA, CU],
    generate(rand) {
      const form = rand() < 0.5 ? 'scazator' : 'descazut';
      for (;;) {
        const s = int(rand, 30, 99);
        const x = int(rand, 11, 79);
        const a = int(rand, 11, 69);
        const r = int(rand, 11, 69);
        if (form === 'scazator' ? s - x >= 11 : a + r <= 99) return missingSub('ec-scadere-100', rand, form, [s, x, a, r], { max: 100 });
      }
    },
  },
  'cmp-balanta-100': {
    label: 'Balanța: sume până la 100',
    points: 3,
    fastMs: 7000,
    mode: 'compare',
    concepts: [BALANTA, EXPRESII],
    generate: (rand) => sums('cmp-balanta-100', rand, [11, 59], 99),
  },

  // ——— Avansat: balanța cu căsuța, doi pași, până la 1000 ———
  'ec-balanta': {
    label: 'Balanța cu căsuța: 8 + 4 = □ + 5',
    points: 3,
    fastMs: 7000,
    mode: 'choice',
    concepts: [BALANTA, NECUNOSCUT, FARA, CU],
    generate(rand) {
      const slot = int(rand, 0, 3);
      for (;;) {
        const a = int(rand, 2, 15);
        const b = int(rand, 2, 9);
        const c = int(rand, 2, 9);
        const x = a + b - c;
        if (x < 1 || c === a || c === b) continue;
        // forma [0, 1, c, c + 1]: a + b (greșeala tipică) e printre variante când răspunsul stă pe primele două locuri
        const choices = placeAt(x, [0, 1, c, c + 1], slot, { min: 0, max: 40 });
        if (!choices) continue;
        const [sumSide, boxSide] = [`${a} + ${b}`, rand() < 0.5 ? `□ + ${c}` : `${c} + □`];
        const text = rand() < 0.5 ? `${sumSide} = ${boxSide}` : `${boxSide} = ${sumSide}`;
        return boxChoice('ec-balanta', text, `${a + b} − ${c}`, choices);
      }
    },
  },
  'ec-doi-pasi': {
    label: 'Ecuații în doi pași',
    points: 4,
    fastMs: 8500,
    mode: 'choice',
    concepts: [DOI_PASI, TABLA_INM, TABLA_IMP, FARA, CU],
    generate(rand) {
      const form = rand() < 0.5 ? 'produs' : 'cat';
      for (;;) {
        if (form === 'produs') {
          // „□ + 5 = 3 × 4”: întâi 3 × 4 = 12, apoi □ = 12 − 5. Variantele vin din calculul care rezolvă, ca la balanță n-ar merge:
          // forma [0, 1, c, c + 1] le dă unități diferite, iar aici răspunsul trece des de 20 și ultima cifră l-ar arăta (95%)
          const [p, q, c] = [int(rand, 2, 9), int(rand, 2, 9), int(rand, 2, 9)];
          const S = p * q;
          if (S - c < 2 || S > 60) continue;
          const text = rand() < 0.5 ? `□ + ${c} = ${p} × ${q}` : `${p} × ${q} = □ + ${c}`;
          return boxChoice('ec-doi-pasi', text, `${S} − ${c}`, calcChoices(rand, `${S} − ${c}`, { max: 70 }));
        }
        // „□ − 8 = 20 : 4”: întâi 20 : 4 = 5, apoi □ = 5 + 8
        const [d, q, c] = [int(rand, 2, 9), int(rand, 2, 9), int(rand, 2, 9)];
        const text = `□ − ${c} = ${d * q} : ${d}`;
        return boxChoice('ec-doi-pasi', text, `${q} + ${c}`, calcChoices(rand, `${q} + ${c}`, { max: 30, plausible: false }));
      }
    },
  },
  'ec-termen-1000': {
    label: 'Termenul necunoscut, până la 1000',
    points: 3,
    fastMs: 7000,
    mode: 'choice',
    concepts: [NECUNOSCUT, FARA_1000, CU_1000],
    generate(rand) {
      for (;;) {
        // zeci rotunde: „□ + 250 = 730”
        const x = 10 * int(rand, 11, 79);
        const a = 10 * int(rand, 11, 79);
        if (x + a <= 990) return missingTerm('ec-termen-1000', rand, x, a, { max: 1000 });
      }
    },
  },
  'cmp-balanta-x': {
    label: 'Balanța: înmulțiri și împărțiri',
    points: 4,
    fastMs: 7500,
    mode: 'compare',
    concepts: [BALANTA, EXPRESII, TABLA_INM, TABLA_IMP],
    generate(rand) {
      const rel = pickOne(rand, RELATIONS);
      for (;;) {
        const left = pickOne(rand, rand() < 0.5 ? PRODUCTS : QUOTIENTS);
        const pool = (rand() < 0.5 ? PRODUCTS : QUOTIENTS).filter((f) => f.text !== left.text);
        const wanted = pool.filter((f) => (rel === '=' ? f.value === left.value : rel === '<' ? f.value > left.value && f.value - left.value <= 6 : f.value < left.value && left.value - f.value <= 6));
        if (!wanted.length) continue;
        const right = pickOne(rand, wanted);
        const [l, r] = rand() < 0.5 ? [left.text, right.text] : [right.text, left.text];
        return compare('cmp-balanta-x', l, r);
      }
    },
  },
};
