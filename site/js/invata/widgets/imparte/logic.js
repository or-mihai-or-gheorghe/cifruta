// Învață: împărțirea (logica, pură). Un coș cu `total` nuci se împarte cu un singur glisor (1–10):
//   parti — pe `by` farfurii, pe rând, câte una pe fiecare (împărțirea în părți egale): câte primește fiecare farfurie;
//   grupe — câte `by` într-o pungă, pungă după pungă (împărțirea prin cuprindere, scăderea repetată): câte pungi se umplu;
//   zeci  — ca la parti, cu bețișoare: pachetele de câte 10 sunt zecile, bețișoarele libere unitățile. Întâi se împart pachetele;
//           cele care nu ajung pe toate farfuriile se desfac în câte 10 bețișoare, apoi se împart bețișoarele.
// Ce nu ajunge pentru încă o tură (sau pentru o pungă plină) rămâne în coș. O provocare își poate aduce alt `total` prin `start`.
// Starea se schimbă doar prin apply(); vederea (view.js) desenează starea și trimite acțiunile.

import { cantitate } from '../../../core/ro.js';
import { NBSP, factorsOf, spokenMath, times } from '../../text.js';

export const MODES = ['parti', 'grupe'];
export const QUANTITIES = ['total', 'plates', 'size', 'each', 'bags', 'left', 'exact', 'tens', 'units', 'broken'];
/** Glisorul: 1–10 farfurii sau nuci într-o pungă (10 stări, cât cere testul pentru un widget). */
export const MAX = 10;
/** Câte obiecte încap în coș: nucile se desenează una câte una (24 încap și pe telefon), bețișoarele merg până la 99. */
const TOTAL = { nuci: 30, zeci: 99 };

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const isZeci = (p) => Boolean(p.zeci);
const nuci = (n) => cantitate(n, 'nucă', 'nuci');
const farfurii = (n) => cantitate(n, 'farfurie', 'farfurii');
const pungi = (n) => cantitate(n, 'pungă', 'pungi');
const betisoare = (n) => cantitate(n, 'bețișor', 'bețișoare');
const pachete = (n) => cantitate(n, 'pachet', 'pachete');
const deOri = (n) => (n === 1 ? 'o dată' : `de ${cantitate(n, 'dată', 'ori')}`);
/** „rămân 2”, dar „rămâne 1”. */
const remain = (n) => (n === 1 ? 'rămâne 1' : `rămân ${n}`);
/** O împărțire scrisă pe un rând: „12 : 3 = 4” (spații nedespărțite). */
const division = (a, b, q) => `${a}${NBSP}:${NBSP}${b}${NBSP}=${NBSP}${q}`;

/**
 * Împărțirea cu pachete și bețișoare: câte pachete și câte bețișoare primește fiecare farfurie, câte pachete se desfac și câte
 * bețișoare rămân în coș. Pachetele care nu ajung pe toate farfuriile se desfac în câte 10 bețișoare.
 */
export function shareTens(total, plates) {
  const tens = Math.floor(total / 10);
  const tensEach = Math.floor(tens / plates);
  const broken = tens % plates;
  const pool = broken * 10 + (total % 10);
  const unitsEach = Math.floor(pool / plates);
  return { tensEach, unitsEach, broken, left: pool % plates, each: tensEach * 10 + unitsEach };
}

export default {
  QUANTITIES,
  /** Ce poate ascunde o provocare: rezultatul (câte pe farfurie sau câte pungi), cât timp se cere. */
  hideable: (p) => (p.mode === 'grupe' ? ['bags'] : ['each']),

  check(p) {
    const errors = [];
    if (!MODES.includes(p.mode)) return [`mod necunoscut „${p.mode}” (${MODES.join(', ')})`];
    if (p.zeci !== undefined && (typeof p.zeci !== 'boolean' || p.mode !== 'parti')) errors.push('„zeci” (pachetele de bețișoare) e doar pentru modul parti');
    const max = TOTAL[isZeci(p) ? 'zeci' : 'nuci'];
    if (!Number.isInteger(p.total) || p.total < 1 || p.total > max) errors.push(`„total” între 1 și ${max}`);
    if (p.by !== undefined && !(Number.isInteger(p.by) && p.by >= 1 && p.by <= MAX)) errors.push(`„by” între 1 și ${MAX}`);
    return errors;
  },

  controls: (p) => [{ id: 'by', min: 1, max: MAX, axis: p.mode === 'grupe' ? 'cols' : 'rows' }],

  initial: (p) => ({ total: p.total, by: p.by ?? 1 }),

  actions(p, s) {
    const list = [];
    for (let v = 1; v <= MAX; v++) if (v !== s.by) list.push({ set: 'by', value: v });
    return list;
  },

  apply(p, s, a) {
    if (a.set !== 'by') return s;
    return { ...s, by: clamp(Math.round(a.value), 1, MAX) };
  },

  derive(p, s) {
    const { total, by } = s;
    if (p.mode === 'grupe') {
      const bags = Math.floor(total / by);
      const left = total % by;
      return { total, size: by, bags, left, exact: left === 0 };
    }
    if (isZeci(p)) {
      const t = shareTens(total, by);
      return { total, plates: by, each: t.each, left: t.left, exact: t.left === 0, tens: t.tensEach, units: t.unitsEach, broken: t.broken };
    }
    const each = Math.floor(total / by);
    const left = total % by;
    return { total, plates: by, each, left, exact: left === 0 };
  },

  /**
   * Textele: `equation` (mare), `reading` (în cuvinte), `legend` (glisorul, în culoarea lui), `sum` (scăderea repetată, la pungi),
   * `extra` (proba sau pachetele desfăcute) și `spoken`. `hidden` ascunde rezultatul („?”) cât timp îl cere o provocare: din calcul,
   * din citire și din scăderea repetată (care ar număra pungile).
   */
  texts(p, s, hidden = []) {
    const d = this.derive(p, s);
    const out = {};
    if (p.mode === 'grupe') {
      const hide = hidden.includes('bags');
      const bags = hide ? '?' : d.bags;
      out.equation = d.exact || hide ? division(d.total, d.size, bags) : `${division(d.total, d.size, d.bags)} și ${remain(d.left)}`;
      out.reading = hide
        ? `${nuci(d.total)}, câte ${d.size} într-o pungă`
        : `${nuci(d.total)}, câte ${d.size} într-o pungă: ${pungi(d.bags)}${d.left ? `, iar ${d.left === 1 ? 'o nucă rămâne' : `${nuci(d.left)} rămân`} în coș` : ''}`;
      out.legend = [['cols', `câte ${d.size} într-o pungă`], ...(hide ? [] : [['', ': '], ['rows', pungi(d.bags)]])];
      if (!hide) {
        // scăderea repetată: întreagă când e scurtă, altfel spusă în cuvinte
        out.sum =
          d.bags <= 6
            ? `${[d.total, ...Array(d.bags).fill(d.size)].join(`${NBSP}−${NBSP}`)}${NBSP}=${NBSP}${d.left}`
            : `Din ${d.total} scazi ${d.size} ${deOri(d.bags)} și ${remain(d.left)}.`;
      }
      if (d.exact && !hide) out.extra = `Proba: ${times(...factorsOf(d.bags, d.size))}${NBSP}=${NBSP}${d.total}.`;
    } else {
      const hide = hidden.includes('each');
      const each = hide ? '?' : d.each;
      out.equation = d.exact || hide ? division(d.total, d.plates, each) : `${division(d.total, d.plates, d.each)} și ${remain(d.left)}`;
      const what = isZeci(p) ? betisoare(d.total) : nuci(d.total);
      // la bețișoare, doar ce primește farfuria: „2 pachete și 8 bețișoare”, „9 bețișoare”, „2 pachete”
      const share = isZeci(p) ? [d.tens && pachete(d.tens), d.units && betisoare(d.units)].filter(Boolean).join(' și ') || 'nimic' : nuci(d.each);
      const one = isZeci(p) ? 'un bețișor' : 'o nucă';
      const leftover = d.left ? `, iar în coș ${d.left === 1 ? `rămâne ${one}` : `rămân ${isZeci(p) ? betisoare(d.left) : nuci(d.left)}`}` : '';
      out.reading = hide ? `${what} pe ${farfurii(d.plates)}` : `${what} pe ${farfurii(d.plates)}: câte ${share} pe fiecare${leftover}`;
      out.legend = [['rows', farfurii(d.plates)], ...(hide ? [] : [['', ', '], ['cols', `câte ${d.each} pe fiecare`]])];
      if (isZeci(p) && d.broken) {
        out.extra = `${d.broken === 1 ? 'Un pachet n-a' : `${pachete(d.broken)} n-au`} ajuns pe toate farfuriile: ${d.broken === 1 ? 'l-am desfăcut' : 'le-am desfăcut'} în ${betisoare(d.broken * 10)}.`;
      } else if (d.exact && !hide) {
        out.extra = `Proba: ${times(...factorsOf(d.plates, d.each))}${NBSP}=${NBSP}${d.total}.`;
      }
    }
    out.spoken = `${out.reading}. ${spokenMath(out.equation)}`;
    return out;
  },
};
