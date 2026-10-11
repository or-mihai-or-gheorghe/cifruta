// Jocuri fulger: tipurile temei „Adunări și scăderi până la 1000”, cu trecere peste ordin (secțiunea U2). La Ușor trecerea are
// sprijin (zeci rotunde peste sută, regrupări, completarea până la sută), la Intermediar e una oriunde într-un calcul de trei cifre
// (și cifra lipsă din calculul în scris, calculul greșit, estimarea), la Avansat sunt două (cu împrumutul peste zero), trei termeni și
// scurtăturile cu numere rotunde. Alunele sunt pe măsura timpului, iar calculele mai lungi de 9 s au pauza „Hopa” cât timpul lor.
//
// Variantele nu au tipare care să arate răspunsul fără calcul (măsurat cu un „ghicitor pe tipare”, în tests/fulger.test.js):
// - la calcule, ele stau „în pătrat” ({x, x + 10, x + 100, x + 110}, `gridChoices`): celelalte colțuri sunt greșelile tipice
//   (transportul uitat sau dublat, împrumutul fără micșorare), iar unitățile sunt aceleași la toate;
// - la estimare, la completarea până la sută și la cifra lipsă, întâi se alege fereastra de patru valori la rând, apoi locul
//   răspunsului în ea, ca nici fereastra, nici marginile ei să nu-l arate;
// - calculul greșit dintre patru are greșeala mai mică decât al doilea termen, deci nu se vede din ochi (o sumă mai mică decât un
//   termen); nicio variantă nu repetă un număr din calcul.

import { cantitate } from '../core/ro.js';
import { treceri } from '../core/rules.js';
import { choice, compare, gridChoice, numberQuestion } from './intrebari.js';
import { figureQuestion } from './kinds-forme.js';
import { gridChoices, int, pickOne } from './rand.js';

const PLUS = ' + ';
const MINUS = ' − ';

const CU = 'mat.op1000.cu-trecere';
const GRUPARE = 'mat.op1000.grupare';
const STRATEGII = 'mat.op1000.strategii';
const IN_SCRIS = 'mat.op1000.in-scris';
const RECONSTITUIRE = 'mat.op1000.reconstituire';
const ESTIMARE = 'mat.op1000.estimare';
const EXPRESII = 'mat.op.comparare-expresii';
const GRESEALA = 'mat.op.greseala';

const MAX = 999;
/** Rezultatul unui calcul cu variantele „în pătrat”: toate colțurile încap între 0 și 999. */
const inGrid = (r) => r >= 110 && r <= 889;
/** Un calcul cu variantele „în pătrat”, dacă niciuna nu repetă un termen; altfel null (generatorul reîncearcă). */
function gridCalc(kind, rand, terms, op) {
  const q = gridChoice(kind, rand, terms.join(op === '+' ? PLUS : MINUS));
  return q.choices.some((c) => terms.includes(c)) ? null : q;
}

export const CALC_1000_KINDS = {
  // ——— Ușor: trecerea cu sprijin ———
  'zeci-peste-suta': {
    label: 'Zeci rotunde peste sută',
    points: 2,
    fastMs: 4500,
    mode: 'choice',
    concepts: [CU, STRATEGII],
    generate(rand) {
      for (;;) {
        // zeci rotunde care trec peste o sută (470 + 50) sau coboară sub ea (520 − 40, 500 − 30)
        const add = rand() < 0.55;
        const a = add ? 100 * int(rand, 1, 7) + 10 * int(rand, 1, 9) : 100 * int(rand, 2, 9) + 10 * int(rand, 0, 8);
        const b = 10 * int(rand, 1, 9);
        const r = add ? a + b : a - b;
        // rezultatul are zeci rotunde de ambele părți (110–890), ca toate variantele să fie rotunde
        if (r < 110 || r > 890 || treceri(add ? '+' : '-', a, b).length !== 1) continue;
        // suta uitată sau pusă de două ori, zecile greșite cu una, două sau trei; toate rotunde, fără termenii calculului
        const typical = [r - 100, r + 100, r - 10, r + 10, r - 20, r + 20, r - 30, r + 30, r - 200, r + 200].filter((x) => x !== a && x !== b);
        const q = choice('zeci-peste-suta', rand, `${a}${add ? PLUS : MINUS}${b}`, typical, MAX);
        if (!q.choices.includes(a)) return q;
      }
    },
  },

  'nr-regrupat': {
    label: 'Sute, zeci și unități regrupate',
    points: 2,
    fastMs: 5000,
    mode: 'figure',
    concepts: [GRUPARE],
    generate(rand) {
      for (;;) {
        // 13 zeci = 1 sută și 3 zeci; 14 unități = 1 zece și 4 unități; uneori amândouă
        const s = int(rand, 1, 8);
        const roll = rand();
        const both = roll >= 0.85;
        const z = roll < 0.45 || both ? int(rand, 10, 19) : int(rand, 0, 9);
        const u = roll >= 0.45 ? int(rand, 10, 19) : int(rand, 0, 9);
        const answer = 100 * s + 10 * z + u;
        const parts = [
          [s, 'sută', 'sute'],
          [z, 'zece', 'zeci'],
          [u, 'unitate', 'unități'],
        ].filter(([n]) => n > 0);
        if (!inGrid(answer) || parts.length < 2) continue;
        const words = parts.map(([n, one, many]) => cantitate(n, one, many));
        // variantele „în pătrat”: suta sau zecea formată și uitată (o sută, o zece în minus) sunt colțuri ale lui
        return numberQuestion('nr-regrupat', rand, {
          prompt: `Cât fac ${words.slice(0, -1).join(', ')} și ${words.at(-1)}?`,
          key: `${s}:${z}:${u}`,
          answer,
          fixed: gridChoices(rand, answer),
          ask: { op: 'regrupare' },
        });
      }
    },
  },

  'pana-la-suta': {
    label: 'Cât lipsește până la suta următoare',
    points: 2,
    fastMs: 5500,
    mode: 'figure',
    concepts: [STRATEGII],
    generate(rand) {
      for (;;) {
        // întâi fereastra de patru numere din 10 în 10 (cu aceleași unități), apoi locul răspunsului în ea
        const start = int(rand, 10, 69);
        const answer = start + 10 * int(rand, 0, 3);
        const target = 100 * int(rand, 2, 9);
        const n = target - answer;
        // zecile rotunde mai rar (370 → 30)
        if (n % 10 === 0 && rand() < 0.6) continue;
        return numberQuestion('pana-la-suta', rand, {
          prompt: `Cât adaugi la ${n} ca să ajungi la ${target}?`,
          key: `${n}`,
          answer,
          fixed: [0, 1, 2, 3].map((i) => start + 10 * i),
          ask: { op: 'pana-la-suta' },
        });
      }
    },
  },

  'cmp-fara-calcul-1000': {
    label: 'Comparări fără calcul',
    points: 3,
    fastMs: 5000,
    mode: 'compare',
    concepts: [EXPRESII],
    generate(rand) {
      for (;;) {
        const roll = rand();
        const a = int(rand, 201, 699);
        const b = int(rand, 101, 289);
        let left;
        let right;
        if (roll < 0.25) {
          // același prim termen: decide al doilea
          left = [a, '+', b];
          right = [a, '+', b + pickOne(rand, [-90, -10, -9, -1, 1, 9, 10, 90])];
        } else if (roll < 0.5) {
          // același descăzut: cine scade mai mult rămâne cu mai puțin (capcana: 650 − 128 < 650 − 118)
          left = [a, '−', b];
          right = [a, '−', b + pickOne(rand, [-10, -9, -1, 1, 9, 10])];
        } else if (roll < 0.65) {
          // același scăzător: decide descăzutul
          left = [a, '−', b];
          right = [a + pickOne(rand, [-90, -10, -9, 9, 10, 90]), '−', b];
        } else if (roll < 0.85) {
          // termenii schimbați între ei: aceeași sumă
          left = [a, '+', b];
          right = [b, '+', a];
        } else {
          // cât ia un termen, atât primește celălalt: aceeași sumă (398 + 245 și 400 + 243)
          const k = pickOne(rand, [1, 2, 3, 10]);
          left = [a, '+', b];
          right = [a + k, '+', b - k];
        }
        const value = ([x, op, y]) => (op === '+' ? x + y : x - y);
        // laturile diferă (250 + 250 schimbat între termeni ar fi același calcul) și rămân între 100 și 999
        if (left.join() === right.join() || [left, right].some((side) => value(side) < 100 || value(side) > MAX)) continue;
        const text = ([x, op, y]) => `${x} ${op} ${y}`;
        return rand() < 0.5 ? compare('cmp-fara-calcul-1000', text(left), text(right)) : compare('cmp-fara-calcul-1000', text(right), text(left));
      }
    },
  },

  // ——— Intermediar: o trecere oriunde, în scris, verificări ———
  'add-1000-o-trecere': {
    label: 'Adunări cu o trecere, la unități sau la zeci',
    points: 5,
    fastMs: 9000,
    mode: 'choice',
    concepts: [CU],
    generate(rand) {
      for (;;) {
        const a = int(rand, 101, 799);
        const b = rand() < 0.7 ? int(rand, 101, 799) : int(rand, 11, 99);
        if (!inGrid(a + b) || treceri('+', a, b).length !== 1) continue;
        const q = gridCalc('add-1000-o-trecere', rand, [a, b], '+');
        if (q) return q;
      }
    },
  },

  'sub-1000-un-imprumut': {
    label: 'Scăderi cu un împrumut, din zeci sau din sute',
    points: 6,
    fastMs: 10000,
    pauseMaxMs: 10000,
    mode: 'choice',
    concepts: [CU],
    generate(rand) {
      for (;;) {
        const a = int(rand, 201, 999);
        const b = rand() < 0.7 ? int(rand, 101, a - 10) : int(rand, 11, 99);
        if (!inGrid(a - b) || treceri('-', a, b).length !== 1) continue;
        const q = gridCalc('sub-1000-un-imprumut', rand, [a, b], '-');
        if (q) return q;
      }
    },
  },

  'cifra-lipsa-1000': {
    label: 'Cifra lipsă din calculul în scris',
    points: 5,
    fastMs: 9000,
    mode: 'figure',
    concepts: [RECONSTITUIRE, IN_SCRIS],
    generate(rand) {
      // întâi fereastra de patru cifre la rând și cifra căutată, apoi un calcul în care ea lipsește
      const start = int(rand, 0, 6);
      const target = start + int(rand, 0, 3);
      for (;;) {
        const add = rand() < 0.55;
        const a = add ? int(rand, 101, 899) : int(rand, 201, 999);
        const b = add ? int(rand, 101, 899) : int(rand, 101, a - 100);
        const r = add ? a + b : a - b;
        const cross = treceri(add ? '+' : '-', a, b);
        if (r < 100 || r > MAX || cross.length !== 1) continue;
        // cifra lipsă stă în coloana trecerii sau în cea din stânga ei (care primește transportul sau dă împrumutul): fără trecere,
        // ar fi doar o adunare sau o scădere de cifre
        const place = 'uz'.indexOf(cross[0]) + int(rand, 0, 1); // 0 = unități, 1 = zeci, 2 = sute
        const rows = [String(a), String(b), String(r)];
        const row = int(rand, 0, 2);
        const at = rows[row].length - 1 - place;
        if (Number(rows[row][at]) !== target) continue;
        const shown = rows.map((t, i) => (i === row ? `${t.slice(0, at)}?${t.slice(at + 1)}` : t));
        const op = add ? '+' : '-';
        return numberQuestion('cifra-lipsa-1000', rand, {
          prompt: 'Ce cifră lipsește?',
          figure: { v: 'column-op', op, terms: `${shown[0]},${shown[1]}`, result: shown[2] },
          solved: { v: 'column-op', op, terms: `${a},${b}`, result: String(r), mark: 'UZS'[place] },
          key: `${a}${op}${b}:${row}${place}`,
          answer: target,
          fixed: [0, 1, 2, 3].map((i) => start + i),
          ask: { op: 'cifra-lipsa' },
        });
      }
    },
  },

  'calcul-gresit-1000': {
    label: 'Calculul greșit dintre patru',
    points: 6,
    fastMs: 12000,
    pauseMaxMs: 12000,
    mode: 'figure',
    concepts: [GRESEALA, CU],
    generate(rand) {
      // un calcul cu o trecere: trei cifre ± două cifre (trecerea la unități) sau ± trei cifre (la unități sau la zeci)
      const one = () => {
        for (;;) {
          const add = rand() < 0.5;
          const a = int(rand, 101, 989);
          const b = rand() < 0.4 ? int(rand, 101, 899) : int(rand, 11, 99);
          const r = add ? a + b : a - b;
          const cross = treceri(add ? '+' : '-', a, b);
          const step = cross[0] === 'u' ? 10 : 100;
          // greșeala (o zece sau o sută) e mai mică decât al doilea termen: suma greșită rămâne peste primul termen, diferența
          // greșită sub descăzut, deci nu se vede din ochi
          if (r < 100 || r > MAX || cross.length !== 1 || b <= step) continue;
          return { text: `${a}${add ? PLUS : MINUS}${b}`, r, add, step };
        }
      };
      for (;;) {
        const calcs = [one(), one(), one(), one()];
        if (new Set(calcs.map((c) => c.text)).size < 4) continue;
        // greșeala tipică a coloanei unde trece: transportul uitat (o zece sau o sută în minus) sau împrumutul fără micșorare
        const [bad, ...good] = calcs;
        const wrong = bad.add ? bad.r - bad.step : bad.r + bad.step;
        const q = figureQuestion('calcul-gresit-1000', rand, {
          prompt: 'Care calcul e greșit?',
          key: calcs.map((c) => c.text).join('|'),
          answer: { text: `${bad.text} = ${wrong}` },
          distractors: good.map((c) => ({ text: `${c.text} = ${c.r}` })),
        });
        // calculul corect, pentru „Greșelile tale” (răspunsul e chiar calculul greșit)
        if (q) return { ...q, fix: `${bad.text} = ${bad.r}` };
      }
    },
  },

  'estimare-sute': {
    label: 'Estimarea la sute',
    points: 3,
    fastMs: 6500,
    mode: 'figure',
    concepts: [ESTIMARE],
    generate(rand) {
      const round = (n) => Math.round(n / 100) * 100;
      const cut = (n) => Math.floor(n / 100) * 100;
      // departe de jumătatea sutei (și nu sute întregi), ca rotunjirea să nu fie la mustață
      const far = (n) => n % 100 !== 0 && Math.abs((n % 100) - 50) >= 15;
      // întâi fereastra de patru sute la rând (100–400 … 600–900) și estimarea, apoi un calcul care dă acea estimare
      const start = 100 * int(rand, 1, 6);
      const below = int(rand, 0, 3);
      const target = start + 100 * below;
      for (;;) {
        const add = target >= 900 || (target > 200 && rand() < 0.6);
        const a = int(rand, 101, 899);
        const b = add ? int(rand, 101, 899) : int(rand, 101, Math.max(101, a - 100));
        const r = add ? a + b : a - b;
        const estimate = add ? round(a) + round(b) : round(a) - round(b);
        if (estimate !== target || !far(a) || !far(b) || r < 100 || r > MAX || Math.abs((r % 100) - 50) < 15) continue;
        // estimarea dă chiar suta rezultatului, iar trunchierea (doar sutele) dă altceva
        if (round(r) !== estimate || (add ? cut(a) + cut(b) : cut(a) - cut(b)) === estimate) continue;
        return numberQuestion('estimare-sute', rand, {
          prompt: `Cam cât face ${a}${add ? PLUS : MINUS}${b}?`,
          key: `${a}${add ? '+' : '-'}${b}`,
          answer: estimate,
          fixed: [0, 1, 2, 3].map((i) => start + 100 * i),
          ask: { op: 'estimare' },
        });
      }
    },
  },

  // ——— Avansat: două treceri, trei termeni, scurtături ———
  'add-1000-doua-treceri': {
    label: 'Adunări cu două treceri',
    points: 7,
    fastMs: 12000,
    pauseMaxMs: 12000,
    mode: 'choice',
    concepts: [CU],
    generate(rand) {
      for (;;) {
        const a = int(rand, 101, 799);
        const b = rand() < 0.8 ? int(rand, 101, 799) : int(rand, 11, 99);
        if (!inGrid(a + b) || treceri('+', a, b).length !== 2) continue;
        const q = gridCalc('add-1000-doua-treceri', rand, [a, b], '+');
        if (q) return q;
      }
    },
  },

  'sub-1000-doua-imprumuturi': {
    label: 'Scăderi cu două împrumuturi (și împrumutul peste zero)',
    points: 8,
    fastMs: 13000,
    pauseMaxMs: 13000,
    mode: 'choice',
    concepts: [CU],
    generate(rand) {
      for (;;) {
        // ~40% peste zero: zecile descăzutului sunt 0 (603 − 258), uneori și unitățile (500 − 167); zeroul se alege rar, pentru că
        // aproape orice astfel de descăzut dă două împrumuturi, deci trece filtrul mai des (măsurat: 12% aleși → ~40% din întrebări)
        let a = int(rand, 201, 999);
        if (rand() < 0.12) a = 100 * Math.floor(a / 100) + (rand() < 0.35 ? 0 : int(rand, 1, 9));
        const b = int(rand, 101, Math.max(101, a - 100));
        if (!inGrid(a - b) || treceri('-', a, b).length !== 2) continue;
        const q = gridCalc('sub-1000-doua-imprumuturi', rand, [a, b], '-');
        if (q) return q;
      }
    },
  },

  'add-3op-1000-cu': {
    label: 'Adunări cu trei termeni până la 1000, cu trecere',
    points: 7,
    fastMs: 13000,
    pauseMaxMs: 13000,
    mode: 'choice',
    concepts: [CU],
    generate(rand) {
      for (;;) {
        const terms = [int(rand, 101, 499), int(rand, 101, 299), rand() < 0.5 ? int(rand, 11, 99) : int(rand, 101, 199)];
        const r = terms[0] + terms[1] + terms[2];
        // cel puțin o coloană trece de 9 (la unități, transportul poate fi și 2)
        const sums = [1, 10, 100].map((p) => terms.reduce((s, t) => s + (Math.floor(t / p) % 10), 0));
        if (!inGrid(r) || !sums.some((s) => s >= 10)) continue;
        const q = gridCalc('add-3op-1000-cu', rand, terms, '+');
        if (q) return q;
      }
    },
  },

  'compensare-1000': {
    label: 'Numere aproape rotunde (+199, −298)',
    points: 4,
    fastMs: 7000,
    mode: 'choice',
    concepts: [STRATEGII, CU],
    generate(rand) {
      for (;;) {
        const d = int(rand, 1, 3);
        const k = int(rand, 1, 6);
        const roll = rand();
        if (roll < 0.55) {
          // + 198: adun 200, apoi scad 2
          const a = int(rand, 101, 799);
          const b = 100 * k - d;
          if (!inGrid(a + b) || !treceri('+', a, b).length) continue;
          const q = gridCalc('compensare-1000', rand, [a, b], '+');
          if (q) return q;
          continue;
        }
        // − 297: scad 300, apoi adun 3; − 302: scad 300, apoi încă 2 (unitățile descăzutului mai mici decât 2, ca să fie împrumut)
        const over = roll >= 0.85;
        const a = over ? 10 * int(rand, 21, 99) + int(rand, 0, d - 1) : int(rand, 201, 999);
        const b = 100 * k + (over ? d : -d);
        if (!inGrid(a - b) || !treceri('-', a, b).length) continue;
        const q = gridCalc('compensare-1000', rand, [a, b], '-');
        if (q) return q;
      }
    },
  },

  'pana-la-1000': {
    label: 'Cât lipsește până la 1000',
    points: 4,
    fastMs: 7000,
    mode: 'figure',
    concepts: [STRATEGII],
    generate(rand) {
      for (;;) {
        // zeci rotunde (650) sau orice număr de trei cifre (375)
        const n = rand() < 0.4 ? 10 * int(rand, 12, 89) : int(rand, 111, 890);
        const answer = 1000 - n;
        if (n % 100 === 0 || !inGrid(answer)) continue;
        // variantele „în pătrat”: cifrele completate până la 10 în loc de 9 (375 → 735, cu o sută și o zece în plus) e un colț al lui;
        // fără numărul din cerință printre ele (450 → 550 ar avea colțul 450)
        const fixed = gridChoices(rand, answer);
        if (fixed.includes(n)) continue;
        return numberQuestion('pana-la-1000', rand, {
          prompt: `Cât adaugi la ${n} ca să ajungi la 1000?`,
          key: `${n}`,
          answer,
          fixed,
          ask: { op: 'pana-la-1000' },
        });
      }
    },
  },
};
