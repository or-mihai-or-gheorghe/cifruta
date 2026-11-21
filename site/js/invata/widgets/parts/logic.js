// Învață: întregul tăiat în părți egale (logica, pură). Copilul alege forma (pizza, ciocolata, napolitana), în câte părți egale o
// taie și ce bucăți colorează. Cu `cut: true`, întregul se taie pe o scară: întreg → jumătăți → sferturi → optimi. Fiecare treaptă
// taie fiecare bucată în două, iar bucățile colorate se taie odată cu restul (o jumătate colorată devine 2/4); la lipire, o bucată
// rămâne colorată dacă toate bucățile ei erau colorate. Desenul vine din bancă (`fraction`; napolitana se taie în pătrate).

import { cantitate, fractionWords } from '../../../core/ro.js';
import { fractionText, reduce } from '../../fractions.js';

/** Formele și numele lor din lecție. */
export const SHAPES = { circle: 'Pizza', bar: 'Ciocolata', square: 'Napolitana' };
export const QUANTITIES = ['shape', 'parts', 'on', 'value'];
const MAX = 10;
/** Treptele scării de tăiere și numele bucăților. */
export const LEVELS = [
  [1, 'întreg'],
  [2, 'jumătăți'],
  [4, 'sferturi'],
  [8, 'optimi'],
];
const CUTS = LEVELS.map(([n]) => n);

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const range = (n) => Array.from({ length: n }, (_, i) => i);
const limits = (p) => (p.cut ? [1, 8] : [p.min ?? 1, p.max ?? MAX]);

/**
 * Bucățile colorate după o altă treaptă: la tăiere, bucata i devine bucățile i·k … i·k + k − 1 (aceeași parte din întreg); la
 * lipire, o bucată nouă e colorată doar dacă toate bucățile ei erau colorate.
 */
export function relevel(on, from, to) {
  if (to === from) return on;
  if (to > from) {
    const k = to / from;
    return on.flatMap((i) => range(k).map((j) => i * k + j));
  }
  const k = from / to;
  const set = new Set(on);
  return range(to).filter((i) => range(k).every((j) => set.has(i * k + j)));
}

/** Ce s-a întâmplat la o treaptă nouă, pentru copil (mini-markup); null dacă treapta nu s-a schimbat. */
export function narrate(prev, next) {
  if (prev.parts === next.parts) return null;
  const [n, d] = [next.on.length, next.parts];
  const pieces = d === 1 ? 'un întreg' : fractionWords(d, d);
  if (next.parts > prev.parts) {
    const k = next.parts / prev.parts;
    const cut = `Ai tăiat fiecare bucată în ${k === 2 ? 'două' : k === 4 ? 'patru' : 'opt'}: acum sunt ${pieces}.`;
    return prev.on.length ? `${cut} Partea colorată e aceeași: {{f:${prev.on.length}/${prev.parts}}} = {{f:${n}/${d}}}.` : cut;
  }
  const glued = `Ai lipit bucățile la loc: acum ${d === 1 ? 'e un întreg' : `sunt ${pieces}`}.`;
  if (!prev.on.length) return glued;
  const kept = n * prev.parts === prev.on.length * d;
  return kept ? `${glued} Partea colorată e aceeași: {{f:${prev.on.length}/${prev.parts}}} = {{f:${n}/${d}}}.` : `${glued} O bucată colorată doar pe jumătate nu mai e colorată.`;
}

export default {
  QUANTITIES,
  hideable: () => [],

  check(p) {
    const errors = [];
    const shapes = p.shapes ?? [p.shape];
    if (!Array.isArray(shapes) || !shapes.length || !shapes.every((s) => SHAPES[s])) errors.push(`forme necunoscute (${Object.keys(SHAPES).join(', ')})`);
    else if (!shapes.includes(p.shape)) errors.push(`„shape” e una din „shapes”`);
    const [lo, hi] = limits(p);
    if (!Number.isInteger(lo) || !Number.isInteger(hi) || lo < 1 || hi > MAX || lo > hi) errors.push('„min” și „max” între 1 și 10');
    if (p.cut ? !CUTS.includes(p.parts) : !(Number.isInteger(p.parts) && p.parts >= lo && p.parts <= hi)) errors.push(`„parts” nepotrivit (${p.parts})`);
    if (p.labels !== undefined && typeof p.labels !== 'boolean') errors.push('„labels” e true sau false');
    return errors;
  },

  /** Glisoarele: în câte părți (fără `cut`) și câte bucăți colorăm (colorează primele, de la stânga sau de sus). */
  controls(p, s) {
    const list = [];
    if (!p.cut) list.push({ id: 'parts', min: limits(p)[0], max: limits(p)[1] });
    list.push({ id: 'count', min: 0, max: s.parts });
    return list;
  },

  initial: (p) => ({ shape: p.shape, parts: p.parts, on: [] }),

  actions(p, s) {
    const list = [];
    for (const shape of p.shapes ?? [p.shape]) if (shape !== s.shape) list.push({ set: 'shape', value: shape });
    if (!p.cut) for (let v = limits(p)[0]; v <= limits(p)[1]; v++) if (v !== s.parts) list.push({ set: 'parts', value: v });
    for (let k = 0; k <= s.parts; k++) list.push({ set: 'count', value: k });
    for (let i = 0; i < s.parts; i++) list.push({ toggle: i });
    if (p.cut) for (const n of CUTS) if (n !== s.parts) list.push({ set: 'level', value: n });
    return list;
  },

  apply(p, s, a) {
    if (a.set === 'shape') return (p.shapes ?? [p.shape]).includes(a.value) ? { ...s, shape: a.value } : s;
    if (a.set === 'parts' && !p.cut) {
      const parts = clamp(a.value, ...limits(p));
      return parts === s.parts ? s : { ...s, parts, on: [] };
    }
    if (a.set === 'count') return { ...s, on: range(clamp(a.value, 0, s.parts)) };
    if (Number.isInteger(a.toggle) && a.toggle >= 0 && a.toggle < s.parts) {
      const on = s.on.includes(a.toggle) ? s.on.filter((i) => i !== a.toggle) : [...s.on, a.toggle].sort((x, y) => x - y);
      return { ...s, on };
    }
    if (a.set === 'level' && p.cut && CUTS.includes(a.value)) return { ...s, parts: a.value, on: relevel(s.on, s.parts, a.value) };
    return s;
  },

  derive: (p, s) => ({ shape: s.shape, parts: s.parts, on: s.on.length, value: fractionText(reduce([s.on.length, s.parts])) }),

  /**
   * `equation` e mini-markup (fracția etajată și, dacă se simplifică, fracția egală: „2/4 = 1/2”); `reading` o spune cu litere;
   * `sum` descrie desenul.
   */
  texts(p, s) {
    const [n, d] = [s.on.length, s.parts];
    if (d === 1) {
      const out = { markup: true, equation: n ? '{{f:1/1}} = un întreg' : 'un întreg', reading: n ? 'întregul e colorat' : 'un întreg, încă netăiat', sum: null };
      return { ...out, spoken: out.reading };
    }
    const [a, b] = reduce([n, d]);
    const whole = n === d;
    const same = whole ? ' = un întreg' : n > 0 && b !== d ? ` = {{f:${a}/${b}}}` : '';
    const sameWords = whole ? ', adică un întreg' : n > 0 && b !== d ? `, adică ${fractionWords(a, b)}` : '';
    const out = {
      markup: true,
      equation: `{{f:${n}/${d}}}${same}`,
      reading: n ? `${fractionWords(n, d)}${sameWords}` : 'nicio bucată colorată',
      sum: `${cantitate(d, 'parte egală', 'părți egale')}, din care ${n === 0 ? 'niciuna colorată' : n === 1 ? 'una colorată' : `${n} colorate`}.`,
    };
    out.spoken = n ? `${out.reading}: ${n} din ${cantitate(d, 'parte egală', 'părți egale')}` : `${cantitate(d, 'parte egală', 'părți egale')}, nicio bucată colorată`;
    return out;
  },
};
