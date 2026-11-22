// Învață: partea care lipsește (logica, pură). Bara de sus e întregul, bara de jos e făcută din două părți; una dintre mărimi e căsuța:
//   „□ + 7 = 15”, „7 + □ = 15” — lipsește o parte (□ = 15 − 7);
//   „15 − □ = 8”               — lipsește partea luată (scăzătorul): 15 = 8 + □, deci □ = 15 − 8;
//   „□ − 7 = 8”                — lipsește întregul (descăzutul): □ = 8 + 7.
// Capitolul „Ecuații cu x” adaugă forma cu un factor (`parseAx`): „3 × x + 2 = 20” (sus întregul, jos 3 bucăți x și 2) și
// „4 × x − 3 = 17” (sus 4 bucăți x, jos 17 și cei 3 luați), cu x sau □; glisorul lungește deodată toate bucățile x.
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

/** Forma cu un factor: „3 × x + 2 = 20”, „4 × x − 3 = 17” (cu x sau □), cu x (`value`) socotit; null pentru celelalte forme. */
export function parseAx(eq) {
  const m = /^(\d+) × (□|x) ([+−]) (\d+) = (\d+)$/.exec(String(eq ?? ''));
  if (!m) return null;
  const [a, b, c] = [Number(m[1]), Number(m[4]), Number(m[5])];
  if (a < 2 || b < 1 || c < 1) return null;
  return { a, b, c, op: m[3], letter: m[2], value: (m[3] === '+' ? c - b : c + b) / a };
}

/**
 * Bucățile celor două bare la forma cu un factor, pentru o încercare: { top, bottom }, fiecare bucată { n, kind } cu `kind` „x”
 * (necunoscuta, cât încercarea), „known” (un număr știut) sau „taken” (cei luați, la „− b”, puși la loc lângă rest).
 */
export function pieces(eq, guess) {
  const e = parseAx(eq);
  const xs = Array.from({ length: e.a }, () => ({ n: guess, kind: 'x' }));
  return e.op === '+'
    ? { top: [{ n: e.c, kind: 'known' }], bottom: [...xs, { n: e.b, kind: 'known' }] }
    : { top: xs, bottom: [{ n: e.c, kind: 'known' }, { n: e.b, kind: 'taken' }] };
}

/** Cele mai multe unități pe lățimea desenului, la forma cu un factor: bara cea mai lungă de pe tot glisorul (scara nu sare cât tragi). */
export function scaleOf(eq, lo = 0) {
  const e = parseAx(eq);
  const most = e.a * (lo + SPAN);
  return e.op === '+' ? Math.max(e.c, most + e.b) : Math.max(most, e.c + e.b);
}
/** Cea mai lungă scară: o bucată x de 5 rămâne lată de vreo 30 px pe telefonul de 360 px. */
export const SCALE_MAX = 50;

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
    const lo = p.lo ?? 0;
    const ax = parseAx(p.eq);
    if (ax) {
      const errors = [];
      if (!Number.isInteger(lo) || lo < 0) errors.push('„lo” e un număr natural');
      if (!Number.isInteger(ax.value)) errors.push(`x nu e număr natural în „${p.eq}”`);
      else if (ax.value < lo || ax.value > lo + SPAN) errors.push(`x (${ax.value}) nu e pe glisor (${lo}–${lo + SPAN})`);
      if (scaleOf(p.eq, lo) > SCALE_MAX) errors.push(`bara cea mai lungă are ${scaleOf(p.eq, lo)}, peste ${SCALE_MAX}`);
      return errors;
    }
    const b = parseBar(p.eq);
    if (!b) return [`ecuație greșită „${p.eq}” (□ + 7 = 15, 15 − □ = 8, □ − 7 = 8 sau 3 × x + 2 = 20)`];
    const errors = [];
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
    const value = parseAx(s.eq)?.value ?? parseBar(s.eq).value;
    return { guess: s.guess, fits: s.guess === value };
  },

  /** Textele: `equation` (cu încercarea în locul căsuței și semnul potrivit), `reading`, `legend`, `extra` (regula) și `spoken`. */
  texts(p, s) {
    if (parseAx(s.eq)) return axTexts(s);
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

/** Textele formei cu un factor: ecuația cu încercarea și semnul potrivit, ce bară e mai lungă și, la final, cei doi pași. */
function axTexts(s) {
  const e = parseAx(s.eq);
  const g = s.guess;
  const fits = g === e.value;
  const nb = (text) => text.replace(/ ([+−=<>×:]) /g, `${NBSP}$1${NBSP}`);
  const sign = (a, b) => (a === b ? '=' : a < b ? '<' : '>');
  const out = { legend: [['cols', `bucata x: ${g}`]] };
  if (e.op === '+') {
    const below = e.a * g + e.b;
    out.equation = nb(`${e.a} × ${g} + ${e.b} ${sign(below, e.c)} ${e.c}`);
    out.reading = fits
      ? 'Barele sunt la fel de lungi, deci ai aflat x.'
      : `Bara de jos e mai ${below < e.c ? 'scurtă' : 'lungă'}: ${nb(`${e.a} × ${g} + ${e.b} = ${below}`)}, iar sus e ${e.c}.`;
    if (fits) out.extra = `${nb(`${e.a} × x = ${e.c} − ${e.b} = ${e.c - e.b}`)}, deci ${nb(`x = ${e.c - e.b} : ${e.a} = ${e.value}`)}.`;
  } else {
    const top = e.a * g;
    const bottom = e.c + e.b;
    out.equation = nb(`${e.a} × ${g} − ${e.b} ${sign(top - e.b, e.c)} ${e.c}`);
    out.reading = fits
      ? 'Barele sunt la fel de lungi, deci ai aflat x.'
      : `Bara de sus e mai ${top < bottom ? 'scurtă' : 'lungă'}: ${nb(`${e.a} × ${g} = ${top}`)}, iar jos e ${nb(`${e.c} + ${e.b} = ${bottom}`)}.`;
    if (fits) out.extra = `${nb(`${e.a} × x = ${e.c} + ${e.b} = ${bottom}`)}, deci ${nb(`x = ${bottom} : ${e.a} = ${e.value}`)}.`;
  }
  out.spoken = `${out.reading} ${spokenMath(out.equation)}`;
  return out;
}
