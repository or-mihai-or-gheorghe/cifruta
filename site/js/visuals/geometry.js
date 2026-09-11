// Geometrie: figuri plane, corpuri, racheta din figuri, figuri compuse pentru numărat.

import { cantitate } from '../core/ro.js';
import { registerVisual } from './index.js';
import { C, list, num, ST, st, txt } from './palette.js';

const GROUP = 'Geometrie';
const COLORS = { rosu: C.red, galben: C.yellow, verde: C.green, albastru: C.blue, mov: C.purple, portocaliu: C.orange };
const SHAPES = {
  triunghi: { label: 'triunghi', color: C.orange, draw: (f) => `<polygon points="50,10 92,86 8,86" fill="${f}" ${st(3)}/>` },
  patrat: { label: 'pătrat', color: C.blue, draw: (f) => `<rect x="14" y="14" width="72" height="72" rx="2" fill="${f}" ${st(3)}/>` },
  dreptunghi: { label: 'dreptunghi', color: C.green, draw: (f) => `<rect x="5" y="26" width="90" height="48" rx="2" fill="${f}" ${st(3)}/>` },
  cerc: { label: 'cerc', color: C.yellow, draw: (f) => `<circle cx="50" cy="50" r="40" fill="${f}" ${st(3)}/>` },
};

registerVisual('shape', {
  group: GROUP,
  defaults: { name: 'triunghi' },
  label: (p) => (SHAPES[p.name] ?? SHAPES.triunghi).label,
  render: (p) => {
    const s = SHAPES[p.name] ?? SHAPES.triunghi;
    return s.draw(COLORS[p.color] ?? s.color);
  },
  demos: Object.keys(SHAPES).map((name) => ({ name })),
});

const SOLIDS = {
  cub: {
    label: 'cub',
    draw: () => `
      <polygon points="18,34 34,18 82,18 66,34" fill="${C.blueLight}" ${ST}/>
      <polygon points="66,34 82,18 82,66 66,82" fill="${C.blueDark}" ${ST}/>
      <rect x="18" y="34" width="48" height="48" fill="${C.blue}" ${ST}/>`,
  },
  cuboid: {
    label: 'cuboid',
    draw: () => `
      <polygon points="8,44 26,28 92,28 74,44" fill="${C.grass}" ${ST}/>
      <polygon points="74,44 92,28 92,62 74,78" fill="${C.greenDark}" ${ST}/>
      <rect x="8" y="44" width="66" height="34" fill="${C.green}" ${ST}/>`,
  },
  cilindru: {
    label: 'cilindru',
    draw: () => `
      <path d="M26 24 V78 A24 8 0 0 0 74 78 V24 Z" fill="${C.orange}" ${ST}/>
      <ellipse cx="50" cy="24" rx="24" ry="8" fill="${C.yellow}" ${ST}/>`,
  },
  sfera: {
    label: 'sferă',
    draw: () => `
      <circle cx="50" cy="50" r="38" fill="${C.red}" ${st(3)}/>
      <ellipse cx="50" cy="52" rx="38" ry="10" fill="none" stroke="${C.ink}" stroke-width="1.5" stroke-dasharray="4 3" opacity=".6"/>
      <ellipse cx="36" cy="34" rx="8" ry="12" fill="${C.white}" opacity=".45" transform="rotate(35 36 34)"/>`,
  },
  con: {
    label: 'con',
    draw: () => `
      <path d="M50 10 L80 76 A30 9 0 0 1 20 76 Z" fill="${C.purple}" ${ST}/>
      <path d="M20 76 A30 9 0 0 1 80 76" fill="none" stroke="${C.ink}" stroke-width="1.5" stroke-dasharray="4 3" opacity=".6"/>`,
  },
};

registerVisual('solid', {
  group: GROUP,
  defaults: { name: 'cub' },
  label: (p) => (SOLIDS[p.name] ?? SOLIDS.cub).label,
  render: (p) => (SOLIDS[p.name] ?? SOLIDS.cub).draw(),
  demos: Object.keys(SOLIDS).map((name) => ({ name })),
});

// Racheta desenată doar din: 1 triunghi (vârful), 1 dreptunghi (corpul), 2 cercuri (hublouri), 2 triunghiuri (aripioare).
registerVisual('rocket-shapes', {
  group: GROUP,
  viewBox: (p) => (p.labels === true || p.labels === 'true' ? '0 0 190 116' : '0 0 100 116'),
  label: (p) =>
    p.labels === true || p.labels === 'true'
      ? 'rachetă desenată din triunghiuri, un dreptunghi și cercuri'
      : 'rachetă desenată din figuri geometrice',
  render: (p) => {
    const rocket = `
      <polygon points="32,78 32,104 12,108" fill="${C.red}" ${ST}/>
      <polygon points="68,78 68,104 88,108" fill="${C.red}" ${ST}/>
      <rect x="32" y="40" width="36" height="64" fill="${C.blueLight}" ${ST}/>
      <polygon points="50,6 68,40 32,40" fill="${C.red}" ${ST}/>
      <circle cx="50" cy="58" r="8" fill="${C.yellow}" ${ST}/>
      <circle cx="50" cy="84" r="8" fill="${C.yellow}" ${ST}/>`;
    if (!(p.labels === true || p.labels === 'true')) return rocket;
    const lead = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${C.ink}" stroke-width="1.2" stroke-dasharray="3 2"/>`;
    return `${rocket}
      ${lead(58, 26, 118, 18)}${txt(150, 18, 'triunghi', { size: 11 })}
      ${lead(68, 50, 118, 44)}${txt(150, 44, 'dreptunghi', { size: 11 })}
      ${lead(58, 58, 118, 70)}${txt(150, 70, 'cerc', { size: 11 })}
      ${lead(84, 104, 118, 98)}${txt(150, 98, 'triunghi', { size: 11 })}`;
  },
  demos: [{}, { labels: true }],
});

// Triunghi mare cu segmente din vârf. Triunghiurile se numără după perechile de puncte de pe bază.
export function fanTriangles(cuts) {
  const pts = cuts + 2;
  const out = [];
  for (let i = 0; i < pts; i++) for (let j = i + 1; j < pts; j++) out.push([i, j]);
  return out;
}

registerVisual('triangle-fan', {
  group: GROUP,
  defaults: { cuts: 2 },
  label: (p) => `triunghi mare împărțit de ${cantitate(num(p.cuts, 2), 'segment', 'segmente')} care pleacă din vârf`,
  render: (p) => {
    const cuts = Math.max(0, Math.min(4, num(p.cuts, 2)));
    const bx = (i) => 6 + (88 * i) / (cuts + 1);
    const tris = fanTriangles(cuts);
    let out = '';
    for (const h of list(p.highlight).map(Number)) {
      const t = tris[h];
      if (t) out += `<polygon points="50,8 ${bx(t[0])},90 ${bx(t[1])},90" fill="${C.yellow}" opacity=".85"/>`;
    }
    out += `<polygon points="50,8 94,90 6,90" fill="none" ${st(3)}/>`;
    for (let i = 1; i <= cuts; i++) out += `<line x1="50" y1="8" x2="${bx(i)}" y2="90" ${st(2.5)}/>`;
    return out;
  },
  demos: [{ cuts: 2 }, { cuts: 2, highlight: '1' }],
});

export function gridSquares(n) {
  const out = [];
  for (let s = 1; s <= n; s++) for (let r = 0; r + s <= n; r++) for (let c = 0; c + s <= n; c++) out.push({ s, r, c });
  return out;
}

registerVisual('square-grid', {
  group: GROUP,
  defaults: { n: 2 },
  label: (p) => `pătrat mare împărțit în ${cantitate(num(p.n, 2) ** 2, 'pătrățel', 'pătrățele')}`,
  render: (p) => {
    const n = Math.max(1, Math.min(4, num(p.n, 2)));
    const cell = 80 / n;
    const squares = gridSquares(n);
    let out = '';
    for (const h of list(p.highlight).map(Number)) {
      const q = squares[h];
      if (q) out += `<rect x="${10 + q.c * cell}" y="${10 + q.r * cell}" width="${q.s * cell}" height="${q.s * cell}" fill="${C.yellow}" opacity=".85"/>`;
    }
    out += `<rect x="10" y="10" width="80" height="80" fill="none" ${st(3)}/>`;
    for (let i = 1; i < n; i++) {
      out += `<line x1="${10 + i * cell}" y1="10" x2="${10 + i * cell}" y2="90" ${st(2.5)}/>`;
      out += `<line x1="10" y1="${10 + i * cell}" x2="90" y2="${10 + i * cell}" ${st(2.5)}/>`;
    }
    return out;
  },
  demos: [{ n: 2 }, { n: 2, highlight: '4' }],
});
