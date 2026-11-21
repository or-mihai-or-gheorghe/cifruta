// Învață: balanța (logica, pură). O ecuație cu căsuța, doar cu adunări („□ + 7 = 15”, „8 + 4 = □ + 5”), pusă pe o balanță: în talerul
// cu căsuța stă un sac cu nuci (câte, nu se știe) și nucile știute de lângă el; în celălalt, nucile celeilalte părți (una sau două
// grămezi). Semnul = e balanța dreaptă. Două moduri, alese de lecție sau de `start`-ul unei provocări:
//   guess — glisorul pune în sac câte nuci crezi (0–10): balanța se înclină spre partea mai grea și stă dreaptă la răspunsul bun;
//   take  — glisorul ia aceleași nuci din ambele talere: balanța rămâne dreaptă, iar când sacul rămâne singur, cântărește cât nucile
//           rămase în celălalt taler (□ = 15 − 7).
// Starea se schimbă doar prin apply(); vederea (view.js) desenează starea și trimite acțiunile.

import { NBSP, spokenMath } from '../../text.js';

export const MODES = ['guess', 'take'];
export const QUANTITIES = ['guess', 'taken', 'balanced', 'alone', 'bag'];
/** Glisorul „ghicesc”: 0–10 nuci în sac (11 stări). */
export const MAX = 10;
/** Cel mult atâtea nuci pe un taler: încap pe telefon, câte 5 pe rând. */
const PAN_MAX = 20;

const sum = (list) => list.reduce((a, b) => a + b, 0);
const nuts = (n) => (n === 1 ? 'o nucă' : `${n} nuci`);

/**
 * Ecuația pe talere: nucile știute de lângă sac (`known`), grămezile din celălalt taler (`other`), totalurile și sacul (`bag`, cât
 * cântărește). Întoarce null dacă ecuația nu are exact o căsuță, are altceva decât adunări sau sacul n-ar avea un număr natural de nuci.
 */
export function parseEq(eq) {
  const sides = String(eq ?? '').split(' = ');
  if (sides.length !== 2) return null;
  const terms = sides.map((side) => side.split(' + ').map((t) => t.trim()));
  const bagSide = terms.findIndex((side) => side.includes('□'));
  if (bagSide < 0 || terms.flat().filter((t) => t === '□').length !== 1) return null;
  const known = terms[bagSide].filter((t) => t !== '□').map(Number);
  const other = terms[1 - bagSide].map(Number);
  if (![...known, ...other].every((n) => Number.isInteger(n) && n >= 1) || !other.length) return null;
  const withBag = sum(known);
  const total = sum(other);
  return { bagLeft: bagSide === 0, known, other, withBag, total, bag: total - withBag };
}

/** Ecuația scrisă cu un număr în locul căsuței și cu semnul dintre părți (=, < sau >): „5 + 7 < 15”. */
function withGuess(eq, guess) {
  const [l, r] = eq.split(' = ').map((side) => side.replace('□', String(guess)));
  const value = (side) => sum(side.split(' + ').map(Number));
  const sign = value(l) === value(r) ? '=' : value(l) < value(r) ? '<' : '>';
  return `${l} ${sign} ${r}`.replace(/ ([+=<>]) /g, `${NBSP}$1${NBSP}`);
}

export default {
  QUANTITIES,
  // balanța nu ascunde nimic: sacul arată „?”, iar nucile se văd
  hideable: () => [],

  check(p) {
    const errors = [];
    if (!MODES.includes(p.mode)) errors.push(`mod necunoscut „${p.mode}” (${MODES.join(', ')})`);
    const e = parseEq(p.eq);
    if (!e) return [...errors, `ecuație greșită „${p.eq}” (doar adunări, cu o singură căsuță)`];
    if (e.bag < 0 || e.bag > MAX) errors.push(`sacul are ${e.bag} nuci: între 0 și ${MAX}`);
    if (e.withBag > MAX || e.total > PAN_MAX) errors.push(`prea multe nuci pe talere (cel mult ${MAX} lângă sac și ${PAN_MAX} în celălalt)`);
    return errors;
  },

  /** Glisorul modului: câte nuci pui în sac (0–10) sau câte iei din fiecare taler (cel mult cele de lângă sac). */
  controls(p, s) {
    if (s.mode === 'take') return [{ id: 'taken', min: 0, max: parseEq(s.eq)?.withBag ?? 0, axis: 'cols' }];
    return [{ id: 'guess', min: 0, max: MAX, axis: 'cols' }];
  },

  initial: (p) => ({ mode: p.mode, eq: p.eq, guess: 0, taken: 0 }),

  actions(p, s) {
    const list = [];
    for (const c of this.controls(p, s)) for (let v = c.min; v <= c.max; v++) if (v !== s[c.id]) list.push({ set: c.id, value: v });
    return list;
  },

  apply(p, s, a) {
    const c = this.controls(p, s).find((x) => x.id === a.set);
    if (!c) return s;
    return { ...s, [a.set]: Math.min(c.max, Math.max(c.min, Math.round(a.value))) };
  },

  derive(p, s) {
    const e = parseEq(s.eq);
    if (s.mode === 'take') return { guess: s.guess, taken: s.taken, balanced: true, alone: s.taken === e.withBag, bag: e.bag };
    return { guess: s.guess, taken: s.taken, balanced: s.guess === e.bag, alone: false, bag: e.bag };
  },

  /**
   * Cât se înclină balanța, în grade: negativ când talerul din stânga e mai greu (coboară), pozitiv când e cel din dreapta, 0 dreaptă.
   * Mărimea crește cu diferența, până la 12°.
   */
  tilt(p, s) {
    if (s.mode === 'take') return 0;
    const e = parseEq(s.eq);
    const bagPan = s.guess + e.withBag;
    const diff = e.bagLeft ? bagPan - e.total : e.total - bagPan; // stânga minus dreapta
    return diff === 0 ? 0 : -Math.sign(diff) * Math.min(12, 4 + 2 * Math.abs(diff));
  },

  /** Textele: `equation` (mare), `reading`, `legend` (glisorul, în culoarea lui), `extra` (regula, la final) și `spoken`. */
  texts(p, s) {
    const e = parseEq(s.eq);
    const out = {};
    if (s.mode === 'take') {
      // după ce iei aceleași nuci din ambele talere: „□ + 4 = 12”, apoi „□ = 8”
      const near = e.withBag - s.taken;
      const far = e.total - s.taken;
      const bagSide = near ? `□${NBSP}+${NBSP}${near}` : '□';
      const otherSide = s.taken ? String(far) : e.other.join(`${NBSP}+${NBSP}`);
      out.equation = e.bagLeft ? `${bagSide}${NBSP}=${NBSP}${otherSide}` : `${otherSide}${NBSP}=${NBSP}${bagSide}`;
      out.legend = [['cols', `am luat câte ${s.taken} din fiecare taler`]];
      if (near === 0) {
        out.reading = `Sacul a rămas singur și balanța e tot dreaptă: cântărește cât ${nuts(far)}.`;
        out.extra = `□${NBSP}=${NBSP}${e.total}${NBSP}−${NBSP}${e.withBag}${NBSP}=${NBSP}${e.bag}. Proba: ${e.bag}${NBSP}+${NBSP}${e.withBag}${NBSP}=${NBSP}${e.total}.`;
      } else {
        out.reading = s.taken ? `Am luat ${nuts(s.taken)} din fiecare taler: balanța a rămas dreaptă.` : 'Ia aceleași nuci din ambele talere.';
      }
    } else {
      out.equation = withGuess(s.eq, s.guess);
      out.legend = [['cols', `în sac: ${nuts(s.guess)}`]];
      const tilt = this.tilt(p, s);
      out.reading =
        tilt === 0
          ? `Balanța stă dreaptă: în sac sunt ${nuts(s.guess)}.`
          : `Balanța coboară în ${tilt < 0 ? 'stânga' : 'dreapta'}: ${nuts(s.guess)} în sac sunt ${(tilt < 0) === e.bagLeft ? 'prea multe' : 'prea puține'}.`;
      if (tilt === 0) out.extra = `□${NBSP}=${NBSP}${e.total}${NBSP}−${NBSP}${e.withBag}${NBSP}=${NBSP}${e.bag}.`;
    }
    out.spoken = `${out.reading} ${spokenMath(out.equation)}`;
    return out;
  },
};
