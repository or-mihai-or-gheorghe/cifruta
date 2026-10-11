// Jocuri fulger: tipurile temei „Adunări și scăderi până la 1000”, cu trecere peste ordin (secțiunea U2). La Ușor trecerea are
// sprijin (zeci rotunde peste sută, regrupări, completarea până la sută), la Intermediar e una oriunde într-un calcul de trei cifre
// (și cifra lipsă din calculul în scris, calculul greșit, estimarea), la Avansat sunt două (cu împrumutul peste zero), trei termeni și
// scurtăturile cu numere rotunde. Variantele greșite vin din greșelile tipice (transportul uitat sau dublat, cifra mică scăzută din
// cea mare, împrumutul fără micșorare, oprit la zero) și păstrează, cât se poate, cifra unităților, ca unitățile singure să nu dea
// răspunsul. Alunele sunt pe măsura timpului, iar calculele mai lungi de 9 s au pauza „Hopa” cât timpul lor (`pauseMaxMs`).

import { cantitate } from '../core/ro.js';
import { treceri } from '../core/rules.js';
import { choice, compare, numberQuestion } from './intrebari.js';
import { figureQuestion } from './kinds-forme.js';
import { int, pickOne } from './rand.js';

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

// rezultatele și variantele rămân sub 1000: o sumă de 1000 ar sta mereu pe ultimul loc dintre variante
const MAX = 999;

/** Cifrele unui număr de cel mult trei cifre: unități, zeci, sute. */
const digits = (n) => [n % 10, Math.floor(n / 10) % 10, Math.floor(n / 100) % 10];
const fromDigits = ([u, z, s]) => u + 10 * z + 100 * s;

/** Pe fiecare coloană, cifra mică scăzută din cea mare: 306 − 187 → 281. */
const smallFromLarge = (a, b) => fromDigits(digits(a).map((d, i) => Math.abs(d - digits(b)[i])));
/** Împrumutul luat fără să micșoreze coloana din stânga: 306 − 187 → 229. */
const noDecrease = (a, b) => fromDigits(digits(a).map((d, i) => (d < digits(b)[i] ? d + 10 - digits(b)[i] : d - digits(b)[i])));
/** Peste zero: zecile devin 10, dar nu mai scad la 9 când dau unităților: 306 − 187 → 129. */
function stopAtZero(a, b) {
  const [ua, za, sa] = digits(a);
  const [ub, zb, sb] = digits(b);
  return za === 0 && ua < ub ? ua + 10 - ub + 10 * (10 - zb) + 100 * (sa - 1 - sb) : null;
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
        // suta uitată sau pusă de două ori, zecile greșite cu una sau două
        return choice('zeci-peste-suta', rand, `${a}${add ? PLUS : MINUS}${b}`, [r - 100, r + 100, r - 10, r + 10, r - 20, r + 20, r - 200, r + 200], MAX);
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
        if (answer > 999 || parts.length < 2) continue;
        const words = parts.map(([n, one, many]) => cantitate(n, one, many));
        // greșelile tipice: numerele scrise unul după altul (4 sute, 13 zeci, 5 unități → 4135), suta sau zecea formată, uitată
        const glued = Number(parts.map(([n]) => n).join(''));
        return numberQuestion('nr-regrupat', rand, {
          prompt: `Cât fac ${words.slice(0, -1).join(', ')} și ${words.at(-1)}?`,
          key: `${s}:${z}:${u}`,
          answer,
          typical: [glued, z >= 10 ? answer - 100 : null, u >= 10 ? answer - 10 : null, answer + 100, answer - 110, answer + 10].filter((x) => x !== null),
          max: 9999,
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
        const n = int(rand, 101, 989);
        const target = Math.ceil(n / 100) * 100;
        const answer = target - n;
        // zecile rotunde mai rar (370 → 30); răspunsul are cel puțin 10, ca să poată sta pe orice poziție
        if (n % 100 === 0 || answer < 10 || (n % 10 === 0 && rand() < 0.6)) continue;
        const [u, z] = digits(n);
        return numberQuestion('pana-la-suta', rand, {
          prompt: `Cât adaugi la ${n} ca să ajungi la ${target}?`,
          key: `${n}`,
          answer,
          // fiecare cifră completată până la 10 (367 → 43) sau până la 9 (32), și o sută în plus (133)
          typical: [((10 - u) % 10) + 10 * ((10 - z) % 10), 9 - u + 10 * (9 - z), answer + 100, answer - 10, answer + 10],
          max: 200,
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
        const a = int(rand, 101, 899);
        const b = rand() < 0.7 ? int(rand, 101, 899) : int(rand, 11, 99);
        const r = a + b;
        if (r > MAX || treceri('+', a, b).length !== 1) continue;
        // transportul uitat sau pus de două ori, la zeci sau la sute
        return choice('add-1000-o-trecere', rand, `${a}${PLUS}${b}`, [r - 10, r + 10, r - 100, r + 100, r - 110, r + 110], MAX);
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
        const r = a - b;
        if (r < 10 || treceri('-', a, b).length !== 1) continue;
        return choice('sub-1000-un-imprumut', rand, `${a}${MINUS}${b}`, [smallFromLarge(a, b), noDecrease(a, b), r + 10, r - 10, r + 100, r - 100], MAX);
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
      for (;;) {
        const add = rand() < 0.55;
        const a = add ? int(rand, 101, 899) : int(rand, 201, 999);
        const b = add ? int(rand, 101, 899) : int(rand, 101, a - 100);
        const r = add ? a + b : a - b;
        if (r < 100 || r > MAX || treceri(add ? '+' : '-', a, b).length !== 1) continue;
        // o cifră ascunsă dintr-un termen sau din rezultat; rezolvarea o arată, cu coloana ei evidențiată
        const rows = [String(a), String(b), String(r)];
        const row = int(rand, 0, 2);
        const place = int(rand, 0, 2); // 0 = unități, 1 = zeci, 2 = sute
        const at = rows[row].length - 1 - place;
        const digit = Number(rows[row][at]);
        const shown = rows.map((t, i) => (i === row ? `${t.slice(0, at)}?${t.slice(at + 1)}` : t));
        const op = add ? '+' : '-';
        return numberQuestion('cifra-lipsa-1000', rand, {
          prompt: 'Ce cifră lipsește?',
          figure: { v: 'column-op', op, terms: `${shown[0]},${shown[1]}`, result: shown[2] },
          solved: { v: 'column-op', op, terms: `${a},${b}`, result: String(r), mark: 'UZS'[place] },
          key: `${a}${op}${b}:${row}${place}`,
          answer: digit,
          // transportul sau împrumutul uitat dă cifra vecină; 10 − cifra vine din completarea până la 10
          typical: [digit - 1, digit + 1, (10 - digit) % 10],
          min: 0,
          max: 9,
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
      // un calcul scurt, cu o trecere: zeci rotunde peste sută, trei cifre ± o cifră, trei cifre ± două cifre
      const short = () => {
        for (;;) {
          const add = rand() < 0.5;
          const family = int(rand, 0, 2);
          const a = family === 0 ? 100 * int(rand, 1, 8) + 10 * int(rand, add ? 1 : 0, 9) : int(rand, 101, 989);
          const b = family === 0 ? 10 * int(rand, 1, 9) : family === 1 ? int(rand, 2, 9) : int(rand, 11, 99);
          const r = add ? a + b : a - b;
          const cross = treceri(add ? '+' : '-', a, b);
          if (r < 100 || r > MAX || cross.length !== 1) continue;
          return { text: `${a}${add ? PLUS : MINUS}${b}`, r, add, step: cross[0] === 'u' ? 10 : 100 };
        }
      };
      for (;;) {
        const calcs = [short(), short(), short(), short()];
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
        if (q) return q;
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
      for (;;) {
        const add = rand() < 0.6;
        const a = int(rand, 101, 899);
        const b = add ? int(rand, 101, 899) : int(rand, 101, Math.max(101, a - 100));
        const r = add ? a + b : a - b;
        const estimate = add ? round(a) + round(b) : round(a) - round(b);
        if (!far(a) || !far(b) || r < 100 || Math.abs((r % 100) - 50) < 15) continue;
        // estimarea dă chiar suta rezultatului, iar trunchierea (doar sutele) dă altceva
        if (estimate !== round(r) || estimate < 400 || estimate > 700) continue;
        if ((add ? cut(a) + cut(b) : cut(a) - cut(b)) === estimate) continue;
        const below = int(rand, 0, 3);
        return numberQuestion('estimare-sute', rand, {
          prompt: `Cam cât face ${a}${add ? PLUS : MINUS}${b}?`,
          key: `${a}${add ? '+' : '-'}${b}`,
          answer: estimate,
          fixed: [0, 1, 2, 3].map((i) => estimate + (i - below) * 100),
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
        const a = int(rand, 101, 899);
        const b = rand() < 0.8 ? int(rand, 101, 899) : int(rand, 11, 99);
        const r = a + b;
        if (r > MAX || treceri('+', a, b).length !== 2) continue;
        return choice('add-1000-doua-treceri', rand, `${a}${PLUS}${b}`, [r - 10, r - 100, r - 110, r + 10, r + 100, r + 110], MAX);
      }
    },
  },

  'sub-1000-doua-imprumuturi': {
    label: 'Scăderi cu două împrumuturi (și peste zero)',
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
        const r = a - b;
        if (r < 100 || treceri('-', a, b).length !== 2) continue;
        const typical = [smallFromLarge(a, b), noDecrease(a, b), stopAtZero(a, b), r + 10, r - 10, r + 100, r - 100].filter((x) => x !== null);
        return choice('sub-1000-doua-imprumuturi', rand, `${a}${MINUS}${b}`, typical, MAX);
      }
    },
  },

  'add-3op-1000-cu': {
    label: 'Adunări cu trei termeni, cu trecere',
    points: 7,
    fastMs: 13000,
    pauseMaxMs: 13000,
    mode: 'choice',
    concepts: [CU],
    generate(rand) {
      for (;;) {
        const terms = [int(rand, 101, 599), int(rand, 101, 399), rand() < 0.5 ? int(rand, 11, 99) : int(rand, 101, 299)];
        const r = terms[0] + terms[1] + terms[2];
        // cel puțin o coloană trece de 9 (la unități, transportul poate fi și 2)
        const sums = [1, 10, 100].map((p) => terms.reduce((s, t) => s + (Math.floor(t / p) % 10), 0));
        if (r > MAX || !sums.some((s) => s >= 10)) continue;
        // transportul uitat (1 sau 2 zeci, o sută) și al treilea termen uitat
        return choice('add-3op-1000-cu', rand, terms.join(PLUS), [terms[0] + terms[1], r - 10, r - 20, r - 100, r + 10, r + 100], MAX);
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
          const a = int(rand, 101, 899);
          const b = 100 * k - d;
          const r = a + b;
          if (r > MAX || !treceri('+', a, b).length) continue;
          // compensarea în sens greșit (+2 în loc de −2) sau uitată
          return choice('compensare-1000', rand, `${a}${PLUS}${b}`, [r + 2 * d, r + d, r - 10, r + 10, r - 100, r + 100], MAX);
        }
        // − 297: scad 300, apoi adun 3; − 302: scad 300, apoi încă 2
        const over = roll >= 0.85;
        const a = int(rand, 201, 999);
        const b = 100 * k + (over ? d : -d);
        const r = a - b;
        if (r < 100 || !treceri('-', a, b).length) continue;
        const typical = over ? [r + 2 * d, r + d, r - 10, r + 10, r - 100, r + 100] : [r - 2 * d, r - d, r - 10, r + 10, r - 100, r + 100];
        return choice('compensare-1000', rand, `${a}${MINUS}${b}`, typical, MAX);
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
        const n = rand() < 0.4 ? 10 * int(rand, 11, 98) : int(rand, 101, 989);
        if (n % 100 === 0) continue;
        const answer = 1000 - n;
        return numberQuestion('pana-la-1000', rand, {
          prompt: `Cât adaugi la ${n} ca să ajungi la 1000?`,
          key: `${n}`,
          answer,
          // fiecare cifră completată până la 10 (375 → 735) sau până la 9 (624)
          typical: [fromDigits(digits(n).map((x) => (10 - x) % 10)), fromDigits(digits(n).map((x) => 9 - x)), answer + 100, answer - 100, answer + 10, answer - 10],
          max: MAX,
          ask: { op: 'pana-la-1000' },
        });
      }
    },
  },
};
