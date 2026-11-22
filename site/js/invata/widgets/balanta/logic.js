// Învață: balanța (logica, pură). O ecuație cu necunoscuta, doar cu adunări, pusă pe o balanță: în talerul cu necunoscuta stau sacii
// cu nuci (câte, nu se știe) și nucile știute de lângă ei; în celălalt, nucile celeilalte părți (una sau două grămezi). Semnul = e
// balanța dreaptă. Necunoscuta e o căsuță și un singur sac („□ + 7 = 15”, „8 + 4 = □ + 5”) sau litera x, cu doi-trei saci la fel
// („3 × x + 4 = 19”, capitolul „Ecuații cu x”). Trei moduri, alese de lecție sau de `start`-ul unei provocări:
//   guess — glisorul pune în fiecare sac câte nuci crezi (0–10): balanța se înclină spre partea mai grea și stă dreaptă la răspunsul bun;
//   take  — glisorul ia aceleași nuci din ambele talere: balanța rămâne dreaptă, iar când sacii rămân singuri, cântăresc cât nucile
//           rămase în celălalt taler (□ = 15 − 7; 3 × x = 19 − 4);
//   share — sacii sunt singuri, iar butonul „Împarte” așază nucile din celălalt taler în câte o grămadă pentru fiecare sac: un sac
//           cântărește cât o grămadă (x = 15 : 3).
// Starea se schimbă doar prin apply(); vederea (view.js) desenează starea și trimite acțiunile.

import { NBSP, spokenMath } from '../../text.js';

export const MODES = ['guess', 'take', 'share'];
export const QUANTITIES = ['guess', 'taken', 'balanced', 'alone', 'bag', 'shared'];
/** Glisorul „ghicesc”: 0–10 nuci în fiecare sac (11 stări). */
export const MAX = 10;
/** Cel mult atâtea nuci pe un taler: încap pe telefon, câte 5 pe rând. */
const PAN_MAX = 20;
/** Cel mult atâția saci la fel: pe un rând, încap în taler pe telefonul de 360 px. */
export const BAGS_MAX = 3;

const sum = (list) => list.reduce((a, b) => a + b, 0);
const nuts = (n) => (n === 1 ? 'o nucă' : `${n} nuci`);
/** Necunoscuta: căsuța (un sac) sau litera x, singură ori cu câți saci sunt („3 × x”). */
const UNKNOWN = /^(?:(\d+) × )?(□|x)$/;

/**
 * Ecuația pe talere: câți saci sunt (`bags`) și cum se scrie necunoscuta (`letter`: □ sau x), nucile știute de lângă saci (`known`),
 * grămezile din celălalt taler (`other`), totalurile și cât are un sac (`bag`; la mai mulți saci, poate să nu fie întreg: `check` îl
 * refuză). Întoarce null dacă ecuația nu are exact o necunoscută, are altceva decât adunări sau numere care nu sunt naturale.
 */
export function parseEq(eq) {
  const sides = String(eq ?? '').split(' = ');
  if (sides.length !== 2) return null;
  const terms = sides.map((side) => side.split(' + ').map((t) => t.trim()));
  const isBag = (t) => UNKNOWN.test(t);
  const bagSide = terms.findIndex((side) => side.some(isBag));
  if (bagSide < 0 || terms.flat().filter(isBag).length !== 1) return null;
  const [, count, letter] = UNKNOWN.exec(terms[bagSide].find(isBag));
  const bags = count ? Number(count) : 1;
  if (count && bags < 2) return null;
  const known = terms[bagSide].filter((t) => !isBag(t)).map(Number);
  const other = terms[1 - bagSide].map(Number);
  if (![...known, ...other].every((n) => Number.isInteger(n) && n >= 1) || !other.length) return null;
  const withBag = sum(known);
  const total = sum(other);
  return { bagLeft: bagSide === 0, bags, letter, known, other, withBag, total, bag: (total - withBag) / bags };
}

/** Ecuația scrisă cu un număr în locul necunoscutei și cu semnul dintre părți (=, < sau >): „5 + 7 < 15”, „3 × 4 + 4 < 19”. */
function withGuess(eq, guess) {
  const e = parseEq(eq);
  const bagPart = (e.bags > 1 ? [`${e.bags} × ${guess}`] : [String(guess)]).concat(e.known.map(String));
  const bagSide = e.bags > 1 ? bagPart : eq.split(' = ')[e.bagLeft ? 0 : 1].split(' + ').map((t) => (t === e.letter ? String(guess) : t));
  const bagValue = e.bags * guess + e.withBag;
  const [l, r] = e.bagLeft ? [bagSide.join(' + '), e.other.join(' + ')] : [e.other.join(' + '), bagSide.join(' + ')];
  const [lv, rv] = e.bagLeft ? [bagValue, e.total] : [e.total, bagValue];
  const sign = lv === rv ? '=' : lv < rv ? '<' : '>';
  return `${l} ${sign} ${r}`.replace(/ ([+=<>×]) /g, `${NBSP}$1${NBSP}`);
}

/** O parte a ecuației scrisă cu spații nedespărțite. */
const tight = (text) => text.replace(/ ([+=<>×:−]) /g, `${NBSP}$1${NBSP}`);

export default {
  QUANTITIES,
  // balanța nu ascunde nimic: sacii arată „?” sau x, iar nucile se văd
  hideable: () => [],

  check(p) {
    const errors = [];
    if (!MODES.includes(p.mode)) errors.push(`mod necunoscut „${p.mode}” (${MODES.join(', ')})`);
    const e = parseEq(p.eq);
    if (!e) return [...errors, `ecuație greșită „${p.eq}” (doar adunări, cu o singură căsuță)`];
    if (e.bags > BAGS_MAX) errors.push(`cel mult ${BAGS_MAX} saci (încap pe un rând în taler)`);
    if (!Number.isInteger(e.bag)) errors.push(`nucile se împart la ${e.bags} saci doar exact (${e.total} − ${e.withBag} nu se împarte la ${e.bags})`);
    if (e.bag < 0 || e.bag > MAX) errors.push(`sacul are ${e.bag} nuci: între 0 și ${MAX}`);
    if (e.withBag > MAX || e.total > PAN_MAX) errors.push(`prea multe nuci pe talere (cel mult ${MAX} lângă sac și ${PAN_MAX} în celălalt)`);
    if (p.mode === 'share' && e.bags < 2) errors.push('împărțitul are rost doar cu mai mulți saci');
    return errors;
  },

  /** Controlul modului: câte nuci pui în fiecare sac (0–10), câte iei din fiecare taler (cel mult cele de lângă saci), iar la împărțit
   *  niciun glisor (doar butonul „Împarte”). */
  controls(p, s) {
    if (s.mode === 'share') return [];
    if (s.mode === 'take') return [{ id: 'taken', min: 0, max: parseEq(s.eq)?.withBag ?? 0, axis: 'cols' }];
    return [{ id: 'guess', min: 0, max: MAX, axis: 'cols' }];
  },

  initial: (p) => ({ mode: p.mode, eq: p.eq, guess: 0, taken: 0, shared: false }),

  actions(p, s) {
    if (s.mode === 'share') return [{ toggle: 'shared' }];
    const list = [];
    for (const c of this.controls(p, s)) for (let v = c.min; v <= c.max; v++) if (v !== s[c.id]) list.push({ set: c.id, value: v });
    return list;
  },

  apply(p, s, a) {
    if (a.toggle === 'shared') return s.mode === 'share' ? { ...s, shared: !s.shared } : s;
    const c = this.controls(p, s).find((x) => x.id === a.set);
    if (!c) return s;
    return { ...s, [a.set]: Math.min(c.max, Math.max(c.min, Math.round(a.value))) };
  },

  /** Mărimile: la împărțit și `shared`, altfel fără (ca balanța cu un sac să rămână cum o știu testele). */
  derive(p, s) {
    const e = parseEq(s.eq);
    if (s.mode === 'share') return { guess: s.guess, taken: s.taken, balanced: true, alone: true, bag: e.bag, shared: s.shared };
    if (s.mode === 'take') return { guess: s.guess, taken: s.taken, balanced: true, alone: s.taken === e.withBag, bag: e.bag };
    return { guess: s.guess, taken: s.taken, balanced: s.guess === e.bag, alone: false, bag: e.bag };
  },

  /**
   * Cât se înclină balanța, în grade: negativ când talerul din stânga e mai greu (coboară), pozitiv când e cel din dreapta, 0 dreaptă.
   * Mărimea crește cu diferența, până la 12°. Luatul și împărțitul o lasă dreaptă.
   */
  tilt(p, s) {
    if (s.mode !== 'guess') return 0;
    const e = parseEq(s.eq);
    const bagPan = e.bags * s.guess + e.withBag;
    const diff = e.bagLeft ? bagPan - e.total : e.total - bagPan; // stânga minus dreapta
    return diff === 0 ? 0 : -Math.sign(diff) * Math.min(12, 4 + 2 * Math.abs(diff));
  },

  /** Textele: `equation` (mare), `reading`, `legend` (glisorul, în culoarea lui), `extra` (regula, la final) și `spoken`. */
  texts(p, s) {
    const e = parseEq(s.eq);
    const out = e.bags > 1 ? manyTexts(e, s, this.tilt(p, s)) : oneTexts(e, s, this.tilt(p, s));
    out.spoken = `${out.reading} ${spokenMath(out.equation)}`;
    return out;
  },
};

/** Textele cu un singur sac și căsuța („□ + 7 = 15”), ca în lecția „Balanța”. */
function oneTexts(e, s, tilt) {
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
    return out;
  }
  out.equation = withGuess(s.eq, s.guess);
  out.legend = [['cols', `în sac: ${nuts(s.guess)}`]];
  out.reading =
    tilt === 0
      ? `Balanța stă dreaptă: în sac sunt ${nuts(s.guess)}.`
      : `Balanța coboară în ${tilt < 0 ? 'stânga' : 'dreapta'}: ${nuts(s.guess)} în sac ${s.guess === 1 ? 'e prea ' : 'sunt prea '}${(tilt < 0) === e.bagLeft ? (s.guess === 1 ? 'mult' : 'multe') : s.guess === 1 ? 'puțin' : 'puține'}.`;
  if (tilt === 0) out.extra = `□${NBSP}=${NBSP}${e.total}${NBSP}−${NBSP}${e.withBag}${NBSP}=${NBSP}${e.bag}.`;
  return out;
}

/** Textele cu mai mulți saci și litera x („3 × x + 4 = 19”): ghicești, iei din ambele talere, apoi împarți. */
function manyTexts(e, s, tilt) {
  const out = {};
  const rest = e.total - e.withBag;
  const bags = `${e.bags}${NBSP}×${NBSP}x`;
  const proba = `Proba: ${tight(`${e.bags} × ${e.bag} + ${e.withBag} = ${e.total}`)}.`;
  if (s.mode === 'share') {
    out.equation = s.shared ? tight(`x = ${rest} : ${e.bags} = ${e.bag}`) : `${bags}${NBSP}=${NBSP}${rest}`;
    out.legend = [['cols', s.shared ? `în fiecare grămadă: ${nuts(e.bag)}` : `${nuts(rest)} pentru ${e.bags} saci`]];
    out.reading = s.shared ? `Fiecare sac cântărește cât o grămadă de ${nuts(e.bag)}.` : `Împarte nucile în ${e.bags} grămezi la fel, câte una pentru fiecare sac.`;
    if (s.shared) out.extra = `${tight(`x = ${rest} : ${e.bags} = ${e.bag}`)}. ${proba}`;
    return out;
  }
  if (s.mode === 'take') {
    const near = e.withBag - s.taken;
    const far = e.total - s.taken;
    out.equation = near ? `${bags}${NBSP}+${NBSP}${near}${NBSP}=${NBSP}${far}` : `${bags}${NBSP}=${NBSP}${far}`;
    out.legend = [['cols', `am luat câte ${s.taken} din fiecare taler`]];
    if (near === 0) {
      out.reading = `Sacii au rămas singuri și balanța e tot dreaptă, deci ${e.bags} saci cântăresc cât ${nuts(far)}.`;
      out.extra = `${tight(`${e.bags} × x = ${e.total} − ${e.withBag} = ${rest}`)}.`;
    } else {
      out.reading = s.taken ? `Am luat ${nuts(s.taken)} din fiecare taler: balanța a rămas dreaptă.` : 'Ia aceleași nuci din ambele talere.';
    }
    return out;
  }
  out.equation = withGuess(s.eq, s.guess);
  out.legend = [['cols', `în fiecare sac: ${nuts(s.guess)}`]];
  const heavy = (tilt < 0) === e.bagLeft; // talerul cu sacii e mai greu: prea multe nuci în saci
  out.reading =
    tilt === 0
      ? `Balanța stă dreaptă: în fiecare sac sunt ${nuts(s.guess)}.`
      : `Balanța coboară în ${tilt < 0 ? 'stânga' : 'dreapta'}: ${nuts(s.guess)} în fiecare sac ${s.guess === 1 ? 'e prea ' : 'sunt prea '}${heavy ? (s.guess === 1 ? 'mult' : 'multe') : s.guess === 1 ? 'puțin' : 'puține'}.`;
  if (tilt === 0) out.extra = `${tight(`${e.bags} × x = ${e.total} − ${e.withBag} = ${rest}`)}, deci ${tight(`x = ${rest} : ${e.bags} = ${e.bag}`)}.`;
  return out;
}
