// Învață: partea care lipsește (logica, pură). Bara de sus e întregul, bara de jos e făcută din două părți; una dintre mărimi e căsuța:
//   „□ + 7 = 15”, „7 + □ = 15” — lipsește o parte (□ = 15 − 7);
//   „15 − □ = 8”               — lipsește partea luată (scăzătorul): 15 = 8 + □, deci □ = 15 − 8;
//   „□ − 7 = 8”                — lipsește întregul (descăzutul): □ = 8 + 7.
// Glisorul lungește bucata necunoscută (11 valori, de la `lo`) până când barele sunt la fel de lungi. Ecuația și `lo` vin din parametri
// sau din `start`-ul unei provocări. Starea se schimbă doar prin apply(); vederea (view.js) desenează starea și trimite acțiunile.

import { NBSP, spokenMath } from '../../text.js';

export const QUANTITIES = ['guess', 'fits'];
/** Glisorul are 11 gradații: de la `lo` la `lo + 10`. */
export const SPAN = 10;
/** Cel mai lung întreg desenat (barele sunt la scară). */
export const WHOLE_MAX = 20;

/**
 * Ecuația ca întreg și părți: `whole`, `parts` (două, în ordinea de pe bara de jos), `missing` (care lipsește: 'part', 'taken' sau
 * 'whole') și `value` (căsuța). Null dacă forma nu e una dintre cele de sus sau numerele nu sunt naturale.
 */
export function parseBar(eq) {
  const s = String(eq ?? '');
  let m = /^(□|\d+) \+ (□|\d+) = (\d+)$/.exec(s);
  if (m && [m[1], m[2]].filter((x) => x === '□').length === 1) {
    const whole = Number(m[3]);
    const known = Number(m[1] === '□' ? m[2] : m[1]);
    const value = whole - known;
    // bara de jos: părțile în ordinea din ecuație, cu căsuța unde stă ea
    return value >= 0 ? { whole, parts: m[1] === '□' ? [null, known] : [known, null], missing: 'part', value, known, op: '+' } : null;
  }
  m = /^(\d+) − □ = (\d+)$/.exec(s);
  if (m) {
    const whole = Number(m[1]);
    const rest = Number(m[2]);
    return rest <= whole ? { whole, parts: [rest, null], missing: 'taken', value: whole - rest, known: rest, op: '−' } : null;
  }
  m = /^□ − (\d+) = (\d+)$/.exec(s);
  if (m) {
    const [taken, rest] = [Number(m[1]), Number(m[2])];
    return { whole: null, parts: [rest, taken], missing: 'whole', value: rest + taken, known: taken, op: '−' };
  }
  return null;
}

/** Ce e scris pe bare și cât de lungă e fiecare bucată, pentru o încercare `guess`: întregul de sus și cele două părți de jos. */
export function bars(eq, guess) {
  const b = parseBar(eq);
  const top = b.whole ?? guess;
  const bottom = b.parts.map((x) => x ?? guess);
  return { top, bottom, unknownTop: b.whole === null, unknownAt: b.parts.indexOf(null) };
}

export default {
  QUANTITIES,
  // bara necunoscută se vede, dar nu are număr scris pe ea cât timp nu se potrivește: nimic de ascuns
  hideable: () => [],

  check(p) {
    const b = parseBar(p.eq);
    if (!b) return [`ecuație greșită „${p.eq}” (□ + 7 = 15, 15 − □ = 8 sau □ − 7 = 8)`];
    const errors = [];
    const lo = p.lo ?? 0;
    if (!Number.isInteger(lo) || lo < 0) errors.push('„lo” e un număr natural');
    if (b.value < lo || b.value > lo + SPAN) errors.push(`căsuța (${b.value}) nu e pe glisor (${lo}–${lo + SPAN})`);
    if ((b.whole ?? b.value) > WHOLE_MAX) errors.push(`întregul are cel mult ${WHOLE_MAX}`);
    return errors;
  },

  controls: (p, s) => [{ id: 'guess', min: s.lo, max: s.lo + SPAN, axis: 'cols' }],

  initial: (p) => ({ eq: p.eq, lo: p.lo ?? 0, guess: p.lo ?? 0 }),

  actions(p, s) {
    const list = [];
    for (let v = s.lo; v <= s.lo + SPAN; v++) if (v !== s.guess) list.push({ set: 'guess', value: v });
    return list;
  },

  apply(p, s, a) {
    if (a.set !== 'guess') return s;
    return { ...s, guess: Math.min(s.lo + SPAN, Math.max(s.lo, Math.round(a.value))) };
  },

  derive(p, s) {
    const b = parseBar(s.eq);
    return { guess: s.guess, fits: s.guess === b.value };
  },

  /** Textele: `equation` (cu încercarea în locul căsuței și semnul potrivit), `reading`, `legend`, `extra` (regula) și `spoken`. */
  texts(p, s) {
    const b = parseBar(s.eq);
    const { top, bottom } = bars(s.eq, s.guess);
    const below = bottom[0] + bottom[1];
    const fits = s.guess === b.value;
    const out = {};
    // ecuația cu încercarea: „5 + 7 = 12, nu 15” se scrie „5 + 7 < 15”
    const filled = s.eq.replace('□', String(s.guess));
    out.equation = fits ? filled : filled.replace(' = ', below < top ? ' < ' : ' > ');
    if (!fits && b.op === '−') {
      // la scădere, semnul se pune între cele două părți ale scăderii: 15 − 5 > 8 (iar 15 − 9 < 8)
      const [left, right] = filled.split(' = ');
      const lv = left.includes('−') ? Number(left.split(' − ')[0]) - Number(left.split(' − ')[1]) : Number(left);
      out.equation = `${left} ${lv < Number(right) ? '<' : '>'} ${right}`;
    }
    out.equation = out.equation.replace(/ ([+−=<>]) /g, `${NBSP}$1${NBSP}`);
    out.legend = [['cols', `bucata necunoscută: ${s.guess}`]];
    out.reading = fits
      ? 'Barele sunt la fel de lungi: ai găsit numărul din căsuță.'
      : below < top
        ? `Bara de jos e mai scurtă: ${bottom[0]} + ${bottom[1]} = ${below}, iar sus e ${top}.`
        : `Bara de jos e mai lungă: ${bottom[0]} + ${bottom[1]} = ${below}, iar sus e ${top}.`;
    if (fits) {
      out.extra =
        b.missing === 'whole'
          ? `Descăzutul: □ = ${b.parts[0]} + ${b.parts[1]} = ${b.value}.`
          : b.missing === 'taken'
            ? `Scăzătorul: □ = ${b.whole} − ${b.known} = ${b.value}.`
            : `Termenul necunoscut: □ = ${b.whole} − ${b.known} = ${b.value}.`;
    }
    out.spoken = `${out.reading} ${spokenMath(out.equation)}`;
    return out;
  },
};
