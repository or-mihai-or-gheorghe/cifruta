// Forme și puzzle-uri pentru Jocurile fulger: o figură parametrică (formă, umplere, culoare, mărime, rotire, oglindire, axă) și un rând
// sau un tabel de celule (figuri, emoji, casete „?”, săgeți, texte). Geometria, cheile și numele stau în core/forme.js.

import { axisLine, COLORS, FILLS, glyphName, LINES, outline, SHAPES, SIZES } from '../core/forme.js';
import { EMOJI } from './emoji.js';
import { registerVisual } from './index.js';
import { bool, C, emojiImage, num, st, txt } from './palette.js';

const GROUP = 'Forme și puzzle-uri';
export const FILL_COLORS = { rosu: C.red, albastru: C.blue, galben: C.yellow, verde: C.green, mov: C.purple, portocaliu: C.orange };

const yes = (v) => v === true || v === 'true';
const norm = (g) => ({ ...g, rot: num(g.rot, 0), flip: yes(g.flip), open: yes(g.open) });
const r2 = (v) => Math.round(v * 100) / 100;

// figurile numărate (`count`): pozițiile, ca pe zar, și cât se micșorează fiecare figură ca să nu se atingă
const COUNT_SPOTS = {
  1: [[50, 50]],
  2: [[30, 30], [70, 70]],
  3: [[26, 26], [50, 50], [74, 74]],
  4: [[30, 30], [70, 30], [30, 70], [70, 70]],
  5: [[27, 27], [73, 27], [50, 50], [27, 73], [73, 73]],
  6: [[30, 22], [70, 22], [30, 50], [70, 50], [30, 78], [70, 78]],
};
const COUNT_SCALE = { 1: 0.5, 2: 0.38, 3: 0.34, 4: 0.38, 5: 0.3, 6: 0.26 };

/** Erorile unei figuri (formă, variantă, umplere, culoare, mărime, rotire, axă). */
export function glyphErrors(g, where = '') {
  const s = SHAPES[g?.shape];
  if (!s) return [`${where}formă necunoscută: ${g?.shape}`];
  const e = [];
  if (g.variant && !s.variants?.[g.variant]) e.push(`${where}variantă necunoscută: ${g.shape}~${g.variant}`);
  if (g.fill && !FILLS.includes(g.fill)) e.push(`${where}umplere necunoscută: ${g.fill}`);
  if (g.color && !COLORS.includes(g.color)) e.push(`${where}culoare necunoscută: ${g.color}`);
  if (g.size && !SIZES.includes(g.size)) e.push(`${where}mărime necunoscută: ${g.size}`);
  if (g.rot !== undefined && (!Number.isInteger(Number(g.rot)) || Number(g.rot) % 45 !== 0)) e.push(`${where}rotirea trebuie să fie multiplu de 45°: ${g.rot}`);
  if (g.axis && !LINES.includes(g.axis)) e.push(`${where}linie necunoscută: ${g.axis}`);
  if (g.count !== undefined && !COUNT_SPOTS[g.count]) e.push(`${where}count trebuie să fie între 1 și 6: ${g.count}`);
  return e;
}

/** Desenul unei figuri în cutia 100 × 100 (fără <svg>); id-urile încep cu `id`. Cu `count`, figura se repetă micșorată, ca pe zar. */
export function glyphBody(raw, id) {
  const g = norm(raw);
  const count = COUNT_SPOTS[g.count] ? Number(g.count) : 0;
  const k = count ? COUNT_SCALE[count] : 1;
  const fill = g.fill ?? 'plin';
  const color = FILL_COLORS[g.color] ?? C.blue;
  let defs = '';
  let paint = fill === 'gol' ? C.white : color;
  if (fill === 'dungi') {
    // dungile păstrează aceeași lățime în cutie și la figurile micșorate
    const [tile, band] = [r2(11 / k), r2(6 / k)];
    defs = `<defs><pattern id="${id}-d" width="${tile}" height="${tile}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="${tile}" height="${tile}" fill="${C.white}"/><rect width="${band}" height="${tile}" fill="${color}"/></pattern></defs>`;
    paint = `url(#${id}-d)`;
  }
  const pts = outline(count ? { ...g, size: 'mare' } : g).map(([x, y]) => `${x},${y}`).join(' ');
  const width = r2((g.open ? 4 : fill === 'gol' ? 3.5 : 3) * (count ? 0.75 / k : 1));
  const shape = g.open ? `<polyline points="${pts}" fill="none" ${st(width)}/>` : `<polygon points="${pts}" fill="${paint}" ${st(width)}/>`;
  if (count) return defs + COUNT_SPOTS[count].map(([cx, cy]) => `<g transform="translate(${r2(cx - 50 * k)} ${r2(cy - 50 * k)}) scale(${k})">${shape}</g>`).join('');
  let axis = '';
  if (g.axis) {
    const [[x1, y1], [x2, y2]] = axisLine(g, g.axis);
    const line = `x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke-linecap="round"`;
    axis = `<line ${line} stroke="${C.white}" stroke-width="7"/><line ${line} stroke="${C.ink}" stroke-width="3" stroke-dasharray="7 5"/>`;
  }
  return defs + shape + axis;
}

// liniile desenate peste figură, spuse cititorului de ecran (d1 = diagonala cutiei figurii de sus din stânga în jos spre dreapta)
const AXIS_WORDS = {
  v: 'cu o linie punctată verticală, prin mijloc',
  h: 'cu o linie punctată orizontală, prin mijloc',
  d1: 'cu o linie punctată pe diagonală, din stânga sus',
  d2: 'cu o linie punctată pe diagonală, din stânga jos',
  'v-off': 'cu o linie punctată verticală, alături de mijloc',
  'h-off': 'cu o linie punctată orizontală, alături de mijloc',
};

registerVisual('glyph', {
  group: GROUP,
  defaults: { shape: 'patrat', fill: 'plin', color: 'albastru', size: 'mare', rot: 0 },
  label: (p) => `${glyphName(norm(p))}${p.axis ? `, ${AXIS_WORDS[p.axis] ?? 'cu o linie punctată'}` : ''}`,
  render: (p, { uid }) => glyphBody(p, uid),
  check: (p) => glyphErrors(p),
  demos: [
    { shape: 'patrat', color: 'rosu' },
    { shape: 'triunghi', fill: 'dungi', color: 'verde', rot: 90 },
    { shape: 'semicerc', fill: 'gol' },
    { shape: 'dreptunghi', color: 'galben', axis: 'd1' },
    { shape: 'stea', color: 'mov', size: 'mic' },
    { shape: 'patrat', fill: 'gol', open: true },
    { shape: 'stea', color: 'galben', count: 5 },
    { shape: 'triunghi', fill: 'dungi', color: 'verde', count: 3 },
  ],
});

const cellName = (c) =>
  c.slot ? 'semnul întrebării' : c.sep ? 'devine' : c.emoji ? (EMOJI[c.emoji]?.label ?? c.emoji) : c.text !== undefined ? String(c.text) : glyphName(norm(c));

const cellsOf = (p) => (Array.isArray(p.cells) ? p.cells : []);
const colsOf = (p) => Math.max(1, Math.min(9, Math.round(num(p.cols, 4))));

registerVisual('glyph-cells', {
  group: GROUP,
  defaults: { cols: 4 },
  viewBox: (p) => `0 0 ${colsOf(p) * 100} ${Math.max(1, Math.ceil(cellsOf(p).length / colsOf(p))) * 100}`,
  label: (p) => cellsOf(p).map(cellName).join('; '),
  render: (p, { uid }) => {
    const cols = colsOf(p);
    const mark = p.mark === undefined || p.mark === null ? -1 : num(p.mark, -1);
    return cellsOf(p)
      .map((c, i) => {
        const [x, y] = [(i % cols) * 100, Math.floor(i / cols) * 100];
        let out = yes(p.frame) ? `<rect x="${x + 3}" y="${y + 3}" width="94" height="94" rx="12" fill="${C.white}" stroke="${C.grayLight}" stroke-width="3"/>` : '';
        if (c.slot) {
          out += `<rect x="${x + 11}" y="${y + 11}" width="78" height="78" rx="14" fill="${C.grayLight}" stroke="${C.ink}" stroke-width="3" stroke-dasharray="9 6"/>${txt(x + 50, y + 52, '?', { size: 46 })}`;
        } else if (c.sep) {
          out += txt(x + 50, y + 50, c.sep, { size: 52 });
        } else if (c.emoji) {
          out += emojiImage(c.emoji, x + 15, y + 15, 70);
        } else if (c.text !== undefined) {
          out += txt(x + 50, y + 52, String(c.text), { size: 40 });
        } else {
          out += `<g transform="translate(${x + 8} ${y + 8}) scale(0.84)">${glyphBody(c, `${uid}-c${i}`)}</g>`;
        }
        if (i === mark) out += `<rect x="${x + 4}" y="${y + 4}" width="92" height="92" rx="16" fill="none" stroke="${C.greenDark}" stroke-width="6"/>`;
        return out;
      })
      .join('');
  },
  check: (p) => {
    const cells = cellsOf(p);
    const e = [];
    if (!cells.length) e.push('cells e gol');
    const cols = num(p.cols, 4);
    if (!Number.isInteger(cols) || cols < 1 || cols > 9) e.push(`cols trebuie să fie între 1 și 9: ${p.cols}`);
    cells.forEach((c, i) => {
      if (c.slot || c.sep || c.text !== undefined) return;
      if (c.emoji) {
        if (!EMOJI[c.emoji]) e.push(`celula ${i}: emoji necunoscut ${c.emoji}`);
        return;
      }
      e.push(...glyphErrors(c, `celula ${i}: `));
    });
    if (p.mark !== undefined && p.mark !== null && !(num(p.mark, -1) >= 0 && num(p.mark, -1) < cells.length)) e.push(`mark în afara celulelor: ${p.mark}`);
    return e;
  },
  demos: [
    {
      cols: 7,
      cells: [
        { shape: 'cerc', color: 'rosu' },
        { shape: 'patrat', color: 'albastru' },
        { shape: 'cerc', color: 'rosu' },
        { shape: 'patrat', color: 'albastru' },
        { shape: 'cerc', color: 'rosu' },
        { shape: 'patrat', color: 'albastru' },
        { slot: true },
      ],
    },
    {
      cols: 3,
      frame: true,
      cells: [
        { shape: 'triunghi', fill: 'plin', color: 'verde' },
        { shape: 'triunghi', fill: 'gol' },
        { shape: 'triunghi', fill: 'dungi', color: 'verde' },
        { shape: 'stea', fill: 'plin', color: 'mov' },
        { shape: 'stea', fill: 'gol' },
        { shape: 'stea', fill: 'dungi', color: 'mov' },
        { shape: 'inima', fill: 'plin', color: 'rosu' },
        { shape: 'inima', fill: 'gol' },
        { slot: true },
      ],
    },
    { cols: 3, cells: [{ shape: 'sageata', color: 'portocaliu' }, { sep: '→' }, { shape: 'sageata', color: 'portocaliu', rot: 90 }, { emoji: 'minge' }, { sep: '→' }, { slot: true }], mark: 5 },
  ],
});

// ——— rețele de căsuțe: table cu un gol, piese, figuri de completat în oglindă ———

const CELL = 20;
const cellList = (v) => (Array.isArray(v) ? v.filter((x) => Array.isArray(x) && x.length === 2).map(([r, c]) => [Number(r), Number(c)]) : []);
const hasCell = (list, r, c) => list.some(([a, b]) => a === r && b === c);

/** Mărimea rețelei și a cutiei în care se desenează (`box`: o cutie pătrată comună, ca piesele variantelor să aibă aceeași scară). */
function gridSize(p) {
  const rows = Math.round(num(p.rows, 3));
  const cols = Math.round(num(p.cols, 3));
  const box = p.box === undefined ? null : Math.round(num(p.box, 0));
  return { rows, cols, w: box ?? cols, h: box ?? rows };
}

registerVisual('cell-grid', {
  group: GROUP,
  defaults: { rows: 3, cols: 3, color: 'albastru' },
  viewBox: (p) => {
    const { w, h } = gridSize(p);
    return `0 0 ${w * CELL + 8} ${h * CELL + 8}`;
  },
  label: (p) => {
    const { rows, cols } = gridSize(p);
    const [filled, holes] = [cellList(p.cells), cellList(p.holes)];
    const what = bool(p.grid) ? `rețea de ${rows} pe ${cols}` : `piesă din ${filled.length === 1 ? '1 căsuță' : `${filled.length} căsuțe`}`;
    const axis = p.axis === 'v' ? ', cu axa punctată verticală' : p.axis === 'h' ? ', cu axa punctată orizontală' : '';
    const rowText = (r) => `rândul ${r + 1}: ${Array.from({ length: cols }, (_, c) => (hasCell(holes, r, c) ? 'lipsă' : hasCell(filled, r, c) ? 'plină' : 'goală')).join(', ')}`;
    return `${what}${axis}; ${Array.from({ length: rows }, (_, r) => rowText(r)).join('; ')}`;
  },
  render: (p) => {
    const { rows, cols, w, h } = gridSize(p);
    const [ox, oy] = [4 + ((w - cols) * CELL) / 2, 4 + ((h - rows) * CELL) / 2];
    const [filled, holes] = [cellList(p.cells), cellList(p.holes)];
    const color = FILL_COLORS[p.color] ?? C.blue;
    const board = bool(p.grid);
    let out = board ? `<rect x="${ox}" y="${oy}" width="${cols * CELL}" height="${rows * CELL}" fill="${C.white}"/>` : '';
    if (board) {
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out += `<rect x="${ox + c * CELL}" y="${oy + r * CELL}" width="${CELL}" height="${CELL}" fill="none" stroke="${C.gray}" stroke-width="1"/>`;
    }
    for (const [r, c] of filled) out += `<rect x="${ox + c * CELL}" y="${oy + r * CELL}" width="${CELL}" height="${CELL}" fill="${color}" ${st(2)}/>`;
    // golul: doar marginea lui, punctată
    for (const [r, c] of holes) {
      const [x, y] = [ox + c * CELL, oy + r * CELL];
      const sides = [[r - 1, c, x, y, x + CELL, y], [r + 1, c, x, y + CELL, x + CELL, y + CELL], [r, c - 1, x, y, x, y + CELL], [r, c + 1, x + CELL, y, x + CELL, y + CELL]];
      for (const [nr, nc, x1, y1, x2, y2] of sides) {
        if (!hasCell(holes, nr, nc)) out += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${C.ink}" stroke-width="2.5" stroke-dasharray="4 3" stroke-linecap="round"/>`;
      }
    }
    if (board) out += `<rect x="${ox}" y="${oy}" width="${cols * CELL}" height="${rows * CELL}" fill="none" ${st(2.5)}/>`;
    if (p.axis === 'v' || p.axis === 'h') {
      const [mx, my] = [ox + (cols * CELL) / 2, oy + (rows * CELL) / 2];
      const [x1, y1, x2, y2] = p.axis === 'v' ? [mx, oy - 3, mx, oy + rows * CELL + 3] : [ox - 3, my, ox + cols * CELL + 3, my];
      const line = `x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke-linecap="round"`;
      out += `<line ${line} stroke="${C.white}" stroke-width="5"/><line ${line} stroke="${C.ink}" stroke-width="2.5" stroke-dasharray="5 4"/>`;
    }
    return out;
  },
  check: (p) => {
    const e = [];
    const { rows, cols, w } = gridSize(p);
    if (!(rows >= 1 && rows <= 8 && cols >= 1 && cols <= 8)) e.push(`rows și cols trebuie să fie între 1 și 8: ${p.rows} × ${p.cols}`);
    if (p.box !== undefined && !(w >= Math.max(rows, cols) && w <= 8)) e.push(`box trebuie să cuprindă rețeaua: ${p.box}`);
    const inside = ([r, c]) => Number.isInteger(r) && Number.isInteger(c) && r >= 0 && r < rows && c >= 0 && c < cols;
    for (const [name, v] of [['cells', p.cells], ['holes', p.holes]]) {
      if (v !== undefined && !(Array.isArray(v) && v.every((x) => Array.isArray(x) && x.length === 2 && inside(x.map(Number))))) e.push(`${name}: căsuțe [rând, coloană] din rețea`);
    }
    const keys = [...cellList(p.cells), ...cellList(p.holes)].map(([r, c]) => `${r}.${c}`);
    if (new Set(keys).size !== keys.length) e.push('o căsuță apare de două ori');
    if (p.axis !== undefined && !['v', 'h'].includes(p.axis)) e.push(`axis: v sau h, nu ${p.axis}`);
    if (p.color !== undefined && !FILL_COLORS[p.color]) e.push(`culoare necunoscută: ${p.color}`);
    return e;
  },
  demos: [
    { rows: 3, cols: 4, grid: true, color: 'verde', cells: [[0, 0], [0, 1], [0, 2], [0, 3], [1, 0], [1, 3], [2, 0], [2, 1], [2, 3]], holes: [[1, 1], [1, 2], [2, 2]] },
    { rows: 2, cols: 3, box: 4, color: 'portocaliu', cells: [[0, 0], [0, 1], [1, 1], [1, 2]] },
    { rows: 4, cols: 4, grid: true, axis: 'v', color: 'mov', cells: [[0, 1], [1, 0], [1, 1], [3, 0]] },
  ],
});
