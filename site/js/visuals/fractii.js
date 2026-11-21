// Desenele pentru fracții (Învață): un întreg tăiat în bucăți (`parts`, 1–10). Forma e cerc („pizza”), bară („ciocolata”) sau
// pătrat („napolitana”). `sizes` face bucățile inegale (pentru „Sunt părți egale?”), iar `cut` alege tăietura pătratului: fâșii,
// careu 2 × 2 sau diagonale. Bucățile din `on` sunt colorate și hașurate, deci nu se deosebesc doar prin culoare. Fiecare bucată
// are `data-piece` (lecția le colorează la atingere). Numele desenului spune în câte bucăți e tăiat și câte sunt colorate, dar nu și
// dacă bucățile sunt egale: o provocare întreabă tocmai asta.

import { cantitate } from '../core/ro.js';
import { registerVisual } from './index.js';
import { C, list, num, st } from './palette.js';

const SHAPES = { circle: ['un cerc', 'n'], bar: ['o bară', 'f'], square: ['un pătrat', 'n'] };
const CUTS = ['strips', 'grid', 'diagonal'];
const CREAM = 'var(--v-cream, #FFEBCC)';

const shapeOf = (p) => (SHAPES[p.shape] ? p.shape : 'circle');
const cutOf = (p) => (CUTS.includes(p.cut) ? p.cut : 'strips');
const partsOf = (p) => Math.max(1, Math.min(10, Math.round(num(p.parts, 1))));
const onOf = (p) => [...new Set(list(p.on).map(Number))].filter((i) => Number.isInteger(i) && i >= 0 && i < partsOf(p));
/** Mărimile relative ale bucăților: `sizes` sau toate egale. */
const sizesOf = (p) => {
  const s = list(p.sizes).map(Number);
  return s.length === partsOf(p) && s.every((x) => x > 0) ? s : Array(partsOf(p)).fill(1);
};

const r1 = (n) => Math.round(n * 10) / 10;
const pt = (x, y) => `${r1(x)} ${r1(y)}`;

/** Bucățile (câte un `d` de path) și viewBox-ul. */
function pieces(p) {
  const shape = shapeOf(p);
  const n = partsOf(p);
  const sizes = sizesOf(p);
  const total = sizes.reduce((a, b) => a + b, 0);
  if (shape === 'circle') {
    const [cx, cy, r] = [100, 100, 88];
    if (n === 1) return { box: '0 0 200 200', d: [`M${pt(cx - r, cy)} A${r} ${r} 0 1 1 ${pt(cx + r, cy)} A${r} ${r} 0 1 1 ${pt(cx - r, cy)} Z`] };
    let start = -Math.PI / 2;
    const d = sizes.map((s) => {
      const angle = (2 * Math.PI * s) / total;
      const [a, b] = [start, start + angle];
      start = b;
      return `M${pt(cx, cy)} L${pt(cx + r * Math.cos(a), cy + r * Math.sin(a))} A${r} ${r} 0 ${angle > Math.PI ? 1 : 0} 1 ${pt(cx + r * Math.cos(b), cy + r * Math.sin(b))} Z`;
    });
    return { box: '0 0 200 200', d };
  }
  // bara și pătratul cu fâșii: bucăți verticale, de la stânga la dreapta
  const [x0, y0, w, h, box] = shape === 'bar' ? [10, 12, 300, 96, '0 0 320 120'] : [16, 16, 168, 168, '0 0 200 200'];
  const cut = shape === 'square' ? cutOf(p) : 'strips';
  if (cut === 'grid') {
    const [hw, hh] = [w / 2, h / 2];
    const cells = [[0, 0], [1, 0], [0, 1], [1, 1]];
    return { box, d: cells.map(([i, j]) => `M${pt(x0 + i * hw, y0 + j * hh)} h${r1(hw)} v${r1(hh)} h${r1(-hw)} Z`) };
  }
  if (cut === 'diagonal') {
    const [tl, tr, br, bl, c] = [[x0, y0], [x0 + w, y0], [x0 + w, y0 + h], [x0, y0 + h], [x0 + w / 2, y0 + h / 2]];
    const tri = (...ps) => `M${ps.map(([x, y]) => pt(x, y)).join(' L')} Z`;
    return { box, d: n === 2 ? [tri(tl, tr, br), tri(tl, br, bl)] : [tri(tl, tr, c), tri(tr, br, c), tri(br, bl, c), tri(bl, tl, c)] };
  }
  let x = x0;
  const d = sizes.map((s) => {
    const sw = (w * s) / total;
    const path = `M${pt(x, y0)} h${r1(sw)} v${h} h${r1(-sw)} Z`;
    x += sw;
    return path;
  });
  return { box, d };
}

registerVisual('fraction', {
  group: 'Desene pentru fracții',
  defaults: { shape: 'circle', parts: 4, on: [] },
  label: (p) => {
    const [name, gender] = SHAPES[shapeOf(p)];
    const f = gender === 'f';
    const n = partsOf(p);
    const colored = onOf(p).length;
    const cut = n === 1 ? `${name} ${f ? 'întreagă' : 'întreg'}` : `${name} ${f ? 'tăiată' : 'tăiat'} în ${cantitate(n, 'bucată', 'bucăți')}`;
    return colored ? `${cut}, cu ${cantitate(colored, 'bucată colorată', 'bucăți colorate')}` : cut;
  },
  viewBox: (p) => pieces(p).box,
  check(p) {
    const errors = [];
    if (!SHAPES[p.shape]) errors.push(`formă necunoscută „${p.shape}” (${Object.keys(SHAPES).join(', ')})`);
    const n = Number(p.parts);
    if (!Number.isInteger(n) || n < 1 || n > 10) errors.push(`„parts” între 1 și 10 (acum ${p.parts})`);
    if (p.cut !== undefined) {
      if (!CUTS.includes(p.cut)) errors.push(`tăietură necunoscută „${p.cut}”`);
      else if (p.cut !== 'strips' && p.shape !== 'square') errors.push('„cut” (careu, diagonale) e doar pentru pătrat');
      else if (p.cut === 'grid' && n !== 4) errors.push('careul are 4 bucăți');
      else if (p.cut === 'diagonal' && n !== 2 && n !== 4) errors.push('diagonalele dau 2 sau 4 bucăți');
    }
    if (p.sizes !== undefined) {
      const s = list(p.sizes).map(Number);
      if (s.length !== n || !s.every((x) => x > 0)) errors.push('„sizes” are câte o mărime pozitivă pentru fiecare bucată');
      if (p.cut && p.cut !== 'strips') errors.push('„sizes” merge doar cu fâșii sau cu cercul');
    }
    const on = list(p.on).map(Number);
    if (on.some((i) => !Number.isInteger(i) || i < 0 || i >= n) || new Set(on).size !== on.length) errors.push('„on” are bucăți diferite, între 0 și parts − 1');
    return errors;
  },
  render(p, { uid }) {
    const hatch = `${uid}h`;
    const on = new Set(onOf(p));
    let out = `<defs><pattern id="${hatch}" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="4" height="9" fill="${C.ink}" opacity="0.22"/></pattern></defs>`;
    pieces(p).d.forEach((d, i) => {
      const colored = on.has(i);
      out += `<path class="v-fraction__piece${colored ? ' is-on' : ''}" data-piece="${i}" d="${d}" fill="${colored ? C.orange : CREAM}" ${st(3)}/>`;
      if (colored) out += `<path d="${d}" fill="url(#${hatch})" pointer-events="none"/>`;
    });
    return out;
  },
  demos: [
    { shape: 'circle', parts: 4, on: [0] },
    { shape: 'bar', parts: 5, on: [0, 1, 2] },
    { shape: 'square', parts: 4, cut: 'grid', on: [1, 2] },
    { shape: 'square', parts: 2, cut: 'diagonal' },
    { shape: 'circle', parts: 2, sizes: [1, 2] },
    { shape: 'circle', parts: 1 },
  ],
});
