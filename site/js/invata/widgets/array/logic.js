// Învață: dreptunghiul înmulțirii (logica, pură). Un singur widget, cu patru aspecte:
//   plates — farfurii una sub alta, câte o tavă pe rând (grupe egale; cel mult 6 × 6);
//   grid   — rânduri și coloane pe un careu de 10 × 10, cu „Întoarce” (ordinea factorilor);
//   split  — dreptunghiul tăiat între rânduri: 7 × 6 = 5 × 6 + 2 × 6;
//   table  — harta tablei înmulțirii, cu strategiile care aprind căsuțele știute.
// Starea se schimbă doar prin apply(); vederea (view.js) desenează starea și trimite acțiunile.

import { cantitate } from '../../../core/ro.js';
import { NBSP, equation, factorsOf, repeatedSum, spokenMath, times } from '../../text.js';

export const SKINS = ['plates', 'grid', 'split', 'table'];
const LIMIT = { plates: 6, grid: 10, split: 10, table: 10 };

/** Obiectele de pe careu: emoji-ul și numele lor (singular, plural). `punct` și `patrat` se desenează din CSS. */
export const ITEMS = {
  mar: { emoji: 'mar', unit: ['măr', 'mere'] },
  stea: { emoji: 'stea', unit: ['stea', 'stele'] },
  punct: { unit: ['bulină', 'buline'] },
  patrat: { unit: ['pătrățel', 'pătrățele'] },
};
/** Obiectele de sub tăietură (aspectul split): altele decât cele de deasupra, ca bucățile să nu se deosebească doar prin culoare. */
export const SPLIT_ITEMS = { top: 'mar', bottom: 'para', unit: { mar: ['măr', 'mere'], para: ['pară', 'pere'] } };

/** Strategiile hărții: × 1, × 2, × 5 și × 10 aprind câte un rând; pătratele, diagonala; „Întoarse” oglindește tot ce e aprins. */
export const STRATEGIES = [
  { id: 'x1', label: `×${NBSP}1`, row: 1 },
  { id: 'x2', label: `×${NBSP}2`, row: 2 },
  { id: 'x5', label: `×${NBSP}5`, row: 5 },
  { id: 'x10', label: `×${NBSP}10`, row: 10 },
  { id: 'patrate', label: 'Pătratele' },
  { id: 'intoarse', label: 'Întoarse' },
];

export const QUANTITIES = ['rows', 'cols', 'product', 'cut', 'top', 'bottom', 'known', 'left', 'pairs', ...STRATEGIES.map((s) => s.id)];
/** Ce poate ascunde o provocare („Cât face 7 × 8?” nu arată produsul). */
export const HIDEABLE = ['product'];

const limit = (p) => LIMIT[p.skin] ?? 10;
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const minRows = (p) => (p.skin === 'split' ? 2 : 1);

/** Căsuțele aprinse ale hărții, ca „r,c” (rândul și coloana, de la 1). */
export function litCells(lit = []) {
  const on = new Set();
  for (const s of STRATEGIES) {
    if (!lit.includes(s.id)) continue;
    if (s.row) for (let c = 1; c <= 10; c++) on.add(`${s.row},${c}`);
    if (s.id === 'patrate') for (let k = 1; k <= 10; k++) on.add(`${k},${k}`);
  }
  if (lit.includes('intoarse')) {
    for (const key of [...on]) {
      const [r, c] = key.split(',');
      on.add(`${c},${r}`);
    }
  }
  return on;
}

/** Calculele rămase de învățat: perechile {a, b} stinse în ambele sensuri (6 × 7 și 7 × 6 sunt un singur calcul). */
export function pairsLeft(on) {
  let n = 0;
  for (let a = 1; a <= 10; a++) for (let b = a; b <= 10; b++) if (!on.has(`${a},${b}`) && !on.has(`${b},${a}`)) n++;
  return n;
}

export default {
  QUANTITIES,
  HIDEABLE,

  check(p) {
    const errors = [];
    if (!SKINS.includes(p.skin)) return [`aspect necunoscut „${p.skin}” (${SKINS.join(', ')})`];
    const max = limit(p);
    for (const k of ['rows', 'cols']) {
      if (!Number.isInteger(p[k]) || p[k] < (k === 'rows' ? minRows(p) : 1) || p[k] > max) errors.push(`„${k}” între ${k === 'rows' ? minRows(p) : 1} și ${max}`);
    }
    if (p.skin === 'split' && !(Number.isInteger(p.cut) && p.cut >= 1 && p.cut < p.rows)) errors.push('„cut” între 1 și rows − 1');
    if (['plates', 'grid'].includes(p.skin) && !ITEMS[p.item]) errors.push(`obiect necunoscut „${p.item}”`);
    if (p.flip !== undefined && (typeof p.flip !== 'boolean' || p.skin !== 'grid')) errors.push('„flip” e doar pentru aspectul grid');
    return errors;
  },

  /** Glisoarele: rândurile (vertical), câte pe rând (orizontal) și, la tăietură, rândul după care se taie. */
  controls(p, s) {
    const max = limit(p);
    const list = [
      { id: 'rows', min: minRows(p), max, axis: 'rows' },
      { id: 'cols', min: 1, max, axis: 'cols' },
    ];
    if (p.skin === 'split') list.push({ id: 'cut', min: 1, max: s.rows - 1, axis: 'rows' });
    return list;
  },

  initial(p) {
    const s = { rows: p.rows, cols: p.cols };
    if (p.skin === 'grid') s.item = p.item; // obiectul se poate schimba din careu (🍎 ⭐ ● ■)
    if (p.skin === 'grid' && p.flip) s.flipped = false;
    if (p.skin === 'split') s.cut = p.cut;
    if (p.skin === 'table') s.lit = [];
    return s;
  },

  /** Tot ce poate face copilul dintr-o stare (căutarea din teste trece prin aceleași acțiuni ca interfața). */
  actions(p, s) {
    const list = [];
    for (const c of this.controls(p, s)) for (let v = c.min; v <= c.max; v++) if (v !== s[c.id]) list.push({ set: c.id, value: v });
    if (p.skin === 'grid' && p.flip) list.push({ do: 'flip' });
    if (p.skin === 'grid') for (const item of Object.keys(ITEMS)) if (item !== s.item) list.push({ set: 'item', value: item });
    if (p.skin === 'table') for (const st of STRATEGIES) list.push({ toggle: st.id });
    return list;
  },

  apply(p, s, a) {
    const max = limit(p);
    const next = { ...s };
    if (a.set === 'rows' || a.set === 'cols' || a.set === 'cut') {
      const c = this.controls(p, s).find((x) => x.id === a.set);
      next[a.set] = clamp(a.value, c.min, c.max);
    } else if (a.set === 'item') {
      if (p.skin === 'grid' && ITEMS[a.value]) next.item = a.value;
    } else if (a.tap) {
      next.rows = clamp(a.tap[0] + 1, minRows(p), max);
      next.cols = clamp(a.tap[1] + 1, 1, max);
    } else if (a.do === 'flip') {
      [next.rows, next.cols] = [s.cols, s.rows];
      next.flipped = !s.flipped;
    } else if (a.toggle) {
      next.lit = s.lit.includes(a.toggle) ? s.lit.filter((x) => x !== a.toggle) : [...s.lit, a.toggle];
    }
    if (p.skin === 'split') next.cut = clamp(next.cut, 1, next.rows - 1);
    return next;
  },

  derive(p, s) {
    const d = { rows: s.rows, cols: s.cols, product: s.rows * s.cols };
    if (p.skin === 'split') Object.assign(d, { cut: s.cut, top: s.cut * s.cols, bottom: (s.rows - s.cut) * s.cols });
    if (p.skin === 'table') {
      const on = litCells(s.lit);
      Object.assign(d, { known: on.size, left: 100 - on.size, pairs: pairsLeft(on) });
      for (const st of STRATEGIES) d[st.id] = s.lit.includes(st.id);
    }
    return d;
  },

  /**
   * Textele: `equation` (mare), `reading` (în cuvinte), `sum` (adunarea repetată), `totals` (numărătoarea de la capătul rândurilor),
   * `parts` (bucățile tăieturii), `extra` (harta) și `spoken` (pentru cititorul de ecran). `hidden` ascunde mărimile cerute de o
   * provocare („?”), ca răspunsul să nu stea scris pe ecran.
   */
  texts(p, s, hidden = []) {
    const d = this.derive(p, s);
    const show = (key, value) => (hidden.includes(key) ? '?' : value);
    const [a, b] = factorsOf(s.rows, s.cols);
    const product = show('product', d.product);
    const out = { equation: equation(a, b, product) };
    if (p.skin === 'plates' || p.skin === 'grid') {
      const [sg, pl] = ITEMS[s.item ?? p.item].unit;
      const groups = p.skin === 'plates' ? cantitate(s.rows, 'farfurie', 'farfurii') : cantitate(s.rows, 'rând', 'rânduri');
      out.reading = `${groups} cu câte ${cantitate(s.cols, sg, pl)}`;
      out.sum = repeatedSum(s.cols, s.rows, product);
      out.totals = Array.from({ length: s.rows }, (_, i) => (hidden.includes('product') && i === s.rows - 1 ? '?' : (i + 1) * s.cols));
    } else if (p.skin === 'split') {
      const [top, bottom] = [s.cut, s.rows - s.cut];
      const [ta, tb] = factorsOf(top, s.cols);
      const [ba, bb] = factorsOf(bottom, s.cols);
      out.reading = `${cantitate(top, 'rând', 'rânduri')} de mere și ${cantitate(bottom, 'rând', 'rânduri')} de pere, câte ${s.cols} pe rând`;
      out.parts = [equation(ta, tb, d.top), equation(ba, bb, d.bottom)];
      out.equation = `${times(a, b)}${NBSP}=${NBSP}${times(ta, tb)}${NBSP}+ ${times(ba, bb)}${NBSP}=${NBSP}${d.top}${NBSP}+ ${d.bottom}${NBSP}=${NBSP}${product}`;
    } else if (p.skin === 'table') {
      out.reading = `rândul ${s.rows}, coloana ${s.cols}`;
      if (d.known) {
        out.extra = `Știi deja ${cantitate(d.known, 'căsuță', 'căsuțe')} din 100.`;
        if (s.lit.includes('intoarse')) out.extra += ` Mai ai de învățat ${cantitate(d.pairs, 'calcul', 'calcule')} (și întoarsele lor).`;
      }
    }
    out.spoken = `${out.reading}: ${spokenMath(out.equation)}`;
    return out;
  },
};
