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
  6: [[28, 20], [72, 20], [28, 50], [72, 50], [28, 80], [72, 80]],
};
const COUNT_SCALE = { 1: 0.6, 2: 0.46, 3: 0.36, 4: 0.44, 5: 0.34, 6: 0.3 }; // cât de mari pot fi figurile fără să se atingă

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
    const [tile, band] = [r2(16 / k), r2(9 / k)]; // dungi late, care se văd și în figurile mici de pe telefon
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
          out += `<g transform="translate(${x + 5} ${y + 5}) scale(0.9)">${glyphBody(c, `${uid}-c${i}`)}</g>`;
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

// ——— figuri de numărat și desfășurări ———

// dreptunghi mare împărțit în dreptunghiuri înalte (niciunul pătrat, ca numărarea să nu ceară „pătratul e și el dreptunghi”)
registerVisual('rect-strip', {
  group: GROUP,
  defaults: { parts: 3 },
  label: (p) => `dreptunghi mare împărțit în ${Math.round(num(p.parts, 3))} dreptunghiuri mai mici`,
  render: (p) => {
    const parts = Math.round(num(p.parts, 3));
    let out = `<rect x="6" y="20" width="88" height="60" fill="${C.cream}" ${st(3)}/>`;
    for (let i = 1; i < parts; i++) out += `<line x1="${r2(6 + (88 * i) / parts)}" y1="20" x2="${r2(6 + (88 * i) / parts)}" y2="80" ${st(2.5)}/>`;
    return out;
  },
  check: (p) => {
    const parts = num(p.parts, NaN);
    return Number.isInteger(parts) && parts >= 2 && parts <= 4 ? [] : [`parts trebuie să fie între 2 și 4: ${p.parts}`];
  },
  demos: [{ parts: 2 }, { parts: 3 }],
});

// desfășurările: numele desenului spune din ce figuri e făcută, nu corpul (acela e răspunsul)
const NETS = {
  cub: {
    label: 'desfășurare din 6 pătrate',
    viewBox: '0 0 88 114',
    draw: () => [[0, 1], [1, 0], [1, 1], [1, 2], [2, 1], [3, 1]].map(([r, c]) => `<rect x="${5 + c * 26}" y="${5 + r * 26}" width="26" height="26" fill="${C.blue}" ${st(2.5)}/>`).join(''),
  },
  cuboid: {
    label: 'desfășurare din 6 dreptunghiuri',
    viewBox: '0 0 106 60',
    draw: () =>
      [[19, 5, 34, 14], [5, 19, 14, 22], [19, 19, 34, 22], [53, 19, 14, 22], [67, 19, 34, 22], [19, 41, 34, 14]]
        .map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.green}" ${st(2.5)}/>`)
        .join(''),
  },
  cilindru: {
    label: 'desfășurare dintr-un dreptunghi și două cercuri',
    viewBox: '0 0 100 88',
    draw: () => `<rect x="20" y="26" width="60" height="36" fill="${C.orange}" ${st(2.5)}/><circle cx="36" cy="16.5" r="9.5" fill="${C.yellow}" ${st(2.5)}/><circle cx="36" cy="71.5" r="9.5" fill="${C.yellow}" ${st(2.5)}/>`,
  },
  con: {
    label: 'desfășurare dintr-o bucată de cerc și un cerc mic',
    viewBox: '0 0 100 96',
    draw: () => `<path d="M50 12 L79.87 61.72 A58 58 0 0 1 20.13 61.72 Z" fill="${C.purple}" ${st(2.5)}/><circle cx="50" cy="80" r="10" fill="${C.purpleLight}" ${st(2.5)}/>`,
  },
};

registerVisual('net', {
  group: GROUP,
  defaults: { name: 'cub' },
  viewBox: (p) => (NETS[p.name] ?? NETS.cub).viewBox,
  label: (p) => (NETS[p.name] ?? NETS.cub).label,
  render: (p) => (NETS[p.name] ?? NETS.cub).draw(),
  check: (p) => (NETS[p.name] ? [] : [`desfășurare necunoscută: ${p.name}`]),
  demos: Object.keys(NETS).map((name) => ({ name })),
});

// ——— rețeaua robotului: litere și cifre, obiecte, robotul și drumul lui, o figură închisă cu semne ———

const RG = 24; // o căsuță
const TILE = 26; // o plăcuță cu un pas al robotului, cât o căsuță, ca să se vadă bine
const TILE_GAP = 6;
// pașii robotului: d = dreapta, s = stânga, j = jos, u = sus; rotirea săgeții desenate (care arată în sus) și numele pasului
const MOVES = { d: [90, 'dreapta'], s: [270, 'stânga'], j: [180, 'jos'], u: [0, 'sus'] };
const LETTERS = 'ABCDEF';
const spot = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? [Number(v.r), Number(v.c)] : null);
const robotN = (p) => Math.round(num(p.n, 4));
const programOf = (p) => String(p.program ?? '').split('').filter(Boolean);
const listOf = (v) => (Array.isArray(v) ? v : []);

/** Numele unei căsuțe: „C2” (coloana C, rândul 2) când rețeaua are litere și cifre, altfel rândul și coloana. */
const cellWord = (p, r, c) => (bool(p.labels) ? `${LETTERS[c]}${r + 1}` : `rândul ${r + 1}, coloana ${c + 1}`);

registerVisual('robot-grid', {
  group: GROUP,
  defaults: { n: 4 },
  viewBox: (p) => {
    const pad = bool(p.labels) ? 18 : 0;
    const steps = programOf(p).length;
    const width = Math.max(robotN(p) * RG, steps * (TILE + TILE_GAP) - TILE_GAP) + 8 + pad;
    return `0 0 ${width} ${robotN(p) * RG + 8 + pad + (steps ? TILE + 22 : 0)}`;
  },
  label: (p) => {
    const n = robotN(p);
    const parts = [`rețea de ${n} pe ${n}${bool(p.labels) ? ', cu litere pe coloane și cifre pe rânduri' : ''}`];
    if (cellList(p.region).length) parts.push(`o figură închisă din ${cellList(p.region).length} căsuțe`);
    for (const m of listOf(p.marks)) parts.push(`${glyphName(norm(m))} în ${cellWord(p, m.r, m.c)}`);
    for (const it of listOf(p.items)) parts.push(`${EMOJI[it.emoji]?.label ?? it.emoji} în ${cellWord(p, it.r, it.c)}`);
    if (spot(p.robot)) parts.push(`robotul în ${cellWord(p, ...spot(p.robot))}`);
    if (programOf(p).length) parts.push(`pașii robotului, pe rând, câte o căsuță: ${programOf(p).map((m) => MOVES[m]?.[1] ?? m).join(', ')}`);
    if (cellList(p.path).length) parts.push(`drumul, pas cu pas: ${cellList(p.path).map(([r, c]) => cellWord(p, r, c)).join(', ')}`);
    if (spot(p.mark)) parts.push(`căsuța încercuită: ${cellWord(p, ...spot(p.mark))}`);
    return parts.join('; ');
  },
  render: (p, { uid }) => {
    const n = robotN(p);
    const pad = bool(p.labels) ? 18 : 0;
    // rețeaua și șirul pașilor stau centrate, oricare dintre ele e mai lat
    const stripWidth = programOf(p).length * (TILE + TILE_GAP) - TILE_GAP;
    const width = Math.max(n * RG, stripWidth);
    const [ox, oy] = [4 + pad + (width - n * RG) / 2, 4 + pad];
    const at = (r, c) => [ox + c * RG, oy + r * RG];
    const region = cellList(p.region);
    let out = `<rect x="${ox}" y="${oy}" width="${n * RG}" height="${n * RG}" fill="${C.white}"/>`;
    for (const [r, c] of region) out += `<rect x="${at(r, c)[0]}" y="${at(r, c)[1]}" width="${RG}" height="${RG}" fill="${C.sky}"/>`;
    for (let i = 1; i < n; i++) out += `<path d="M${ox + i * RG} ${oy} V${oy + n * RG} M${ox} ${oy + i * RG} H${ox + n * RG}" stroke="${C.gray}" stroke-width="1"/>`;
    // conturul figurii închise: laturile căsuțelor care nu au vecin în figură
    for (const [r, c] of region) {
      const [x, y] = at(r, c);
      const sides = [[r - 1, c, x, y, x + RG, y], [r + 1, c, x, y + RG, x + RG, y + RG], [r, c - 1, x, y, x, y + RG], [r, c + 1, x + RG, y, x + RG, y + RG]];
      for (const [nr, nc, x1, y1, x2, y2] of sides) {
        if (!hasCell(region, nr, nc)) out += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${C.ink}" stroke-width="3" stroke-linecap="round"/>`;
      }
    }
    out += `<rect x="${ox}" y="${oy}" width="${n * RG}" height="${n * RG}" fill="none" ${st(2.5)}/>`;
    if (bool(p.labels)) {
      for (let i = 0; i < n; i++) out += txt(ox + i * RG + RG / 2, 12, LETTERS[i], { size: 12 }) + txt(12, oy + i * RG + RG / 2, String(i + 1), { size: 12 });
    }
    listOf(p.marks).forEach((m, i) => {
      const [x, y] = at(Number(m.r), Number(m.c));
      out += `<g transform="translate(${x + 4} ${y + 4}) scale(0.16)">${glyphBody({ ...m, size: 'mare' }, `${uid}-m${i}`)}</g>`;
    });
    // drumul (în desenul rezolvat): o linie din puncte prin mijlocul căsuțelor, pe sub obiecte
    const path = cellList(p.path);
    const center = ([r, c]) => [ox + c * RG + RG / 2, oy + r * RG + RG / 2];
    if (path.length && spot(p.robot)) {
      const points = [spot(p.robot), ...path].map(center).map(([x, y]) => `${x},${y}`).join(' ');
      out += `<polyline points="${points}" fill="none" stroke="${C.blueDark}" stroke-width="3.5" stroke-dasharray="0.5 6" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    for (const it of listOf(p.items)) out += emojiImage(it.emoji, at(Number(it.r), Number(it.c))[0] + 3, at(Number(it.r), Number(it.c))[1] + 3, RG - 6);
    if (spot(p.robot)) out += emojiImage('robot', at(...spot(p.robot))[0] + 2, at(...spot(p.robot))[1] + 2, RG - 4);
    // numărul fiecărui pas, în colțul căsuței în care ajunge robotul (cifre închise pe cerc alb: .v-label își impune culoarea din CSS)
    path.forEach(([r, c], i) => {
      out += `<circle cx="${at(r, c)[0] + 6}" cy="${at(r, c)[1] + 6}" r="5.5" fill="${C.white}" stroke="${C.blueDark}" stroke-width="1.5"/>${txt(at(r, c)[0] + 6, at(r, c)[1] + 6.5, String(i + 1), { size: 7.5 })}`;
    });
    if (spot(p.mark)) out += `<rect x="${at(...spot(p.mark))[0] + 1.5}" y="${at(...spot(p.mark))[1] + 1.5}" width="${RG - 3}" height="${RG - 3}" rx="5" fill="none" stroke="${C.greenDark}" stroke-width="3"/>`;
    // pașii, sub rețea, de la stânga la dreapta: plăcuțe numerotate, cât o căsuță, cu săgeți pline
    programOf(p).forEach((m, i) => {
      const [x, y] = [4 + pad + (width - stripWidth) / 2 + i * (TILE + TILE_GAP), oy + n * RG + 18];
      out += `<circle cx="${x + TILE / 2}" cy="${y - 8}" r="7" fill="${C.white}" ${st(1.5)}/>${txt(x + TILE / 2, y - 7.5, String(i + 1), { size: 9 })}`;
      out += `<rect x="${x}" y="${y}" width="${TILE}" height="${TILE}" rx="6" fill="${C.blueDark}"/>`;
      out += `<polygon points="0,-9 8,-1 3,-1 3,9 -3,9 -3,-1 -8,-1" fill="${C.white}" transform="translate(${x + TILE / 2} ${y + TILE / 2}) rotate(${MOVES[m]?.[0] ?? 0})"/>`;
    });
    return out;
  },
  check: (p) => {
    const n = robotN(p);
    const e = [];
    if (!(Number.isInteger(num(p.n, NaN)) && n >= 3 && n <= 6)) e.push(`n trebuie să fie între 3 și 6: ${p.n}`);
    const inside = (r, c) => Number.isInteger(r) && Number.isInteger(c) && r >= 0 && r < n && c >= 0 && c < n;
    for (const it of listOf(p.items)) {
      if (!inside(Number(it.r), Number(it.c))) e.push(`obiect în afara rețelei: ${JSON.stringify(it)}`);
      if (!EMOJI[it.emoji]) e.push(`emoji necunoscut: ${it.emoji}`);
    }
    for (const m of listOf(p.marks)) {
      if (!inside(Number(m.r), Number(m.c))) e.push(`semn în afara rețelei: ${JSON.stringify(m)}`);
      e.push(...glyphErrors(m, 'semn: '));
    }
    for (const [name, v] of [['robot', p.robot], ['mark', p.mark]]) if (v !== undefined && !(spot(v) && inside(...spot(v)))) e.push(`${name} în afara rețelei`);
    if (!cellList(p.region).every(([r, c]) => inside(r, c))) e.push('region: căsuțe din rețea');
    if (!cellList(p.path).every(([r, c]) => inside(r, c))) e.push('path: căsuțe din rețea');
    if (!programOf(p).every((m) => MOVES[m])) e.push(`program: doar d, s, j, u (${p.program})`);
    if (programOf(p).length > 8) e.push(`program: cel mult 8 pași (${p.program})`);
    return e;
  },
  demos: [
    { n: 4, labels: true, items: [{ r: 1, c: 2, emoji: 'mar' }, { r: 3, c: 0, emoji: 'para' }], mark: { r: 1, c: 2 } },
    { n: 4, robot: { r: 0, c: 0 }, program: 'djj', items: [{ r: 2, c: 1, emoji: 'cirese' }] },
    { n: 4, robot: { r: 0, c: 0 }, program: 'djj', items: [{ r: 2, c: 1, emoji: 'cirese' }], path: [[0, 1], [1, 1], [2, 1]], mark: { r: 2, c: 1 } },
    { n: 5, region: [[1, 1], [1, 2], [2, 1], [2, 2], [2, 3], [3, 2]], marks: [{ r: 2, c: 2, shape: 'cerc', color: 'rosu' }, { r: 1, c: 3, shape: 'triunghi', color: 'albastru' }] },
  ],
});
