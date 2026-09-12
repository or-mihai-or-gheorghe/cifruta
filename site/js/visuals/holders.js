// Suporturi pentru numere: obiecte pe care scriem un număr (scoică, stea, floare, valiză, măr…).

import { cantitate, singularOf } from '../core/ro.js';
import { registerVisual, svgText } from './index.js';
import { C, fit, has, numberBadge, ST, st, txt } from './palette.js';

const GROUP = 'Suporturi pentru numere';
const withNumber = (name) => (p) => (has(p.n) ? `${name} cu numărul ${p.n}` : name);
const COLORS = {
  rosu: C.red, galben: C.yellow, verde: C.green, albastru: C.blue, mov: C.purple,
  roz: C.pink, portocaliu: C.orange,
};
const colorOf = (name, fallback) => COLORS[name] ?? fallback;

registerVisual('shell', {
  group: GROUP,
  label: withNumber('scoică'),
  render: (p) => `
    <path d="M50 8 C20 8 6 38 10 62 C12 76 24 88 50 92 C76 88 88 76 90 62 C94 38 80 8 50 8 Z" fill="${C.pink}" ${ST}/>
    <path d="M50 12 L50 90 M50 12 L28 86 M50 12 L72 86 M50 12 L14 66 M50 12 L86 66" stroke="${C.pinkDark}" stroke-width="2" fill="none"/>
    <rect x="22" y="84" width="56" height="12" rx="6" fill="${C.pinkDark}" ${ST}/>
    ${has(p.n) ? numberBadge(50, 52, 21, p.n, 22) : ''}`,
  demos: [{ n: 14 }],
});

registerVisual('star', {
  group: GROUP,
  label: withNumber('stea'),
  render: (p) => `
    <path d="M50 5 L62 36 L95 38 L69 58 L78 92 L50 73 L22 92 L31 58 L5 38 L38 36 Z" fill="${C.yellow}" ${st(3)}/>
    <path d="M44 34 L50 16 L53 26 L47 37 Z" fill="${C.white}" opacity=".5"/>
    ${has(p.n) ? svgText(50, 55, p.n, { size: fit(p.n, 24) }) : ''}`,
  demos: [{ n: 47 }],
});

registerVisual('flower', {
  group: GROUP,
  defaults: { color: 'roz' },
  label: withNumber('floare'),
  render: (p) => {
    const fill = { roz: C.pink, galben: C.yellow, albastru: C.blueLight, mov: C.purpleLight }[p.color] ?? C.pink;
    const petals = [0, 60, 120, 180, 240, 300]
      .map((a) => `<ellipse cx="50" cy="24" rx="15" ry="22" fill="${fill}" ${ST} transform="rotate(${a} 50 50)"/>`)
      .join('');
    return `${petals}<circle cx="50" cy="50" r="22" fill="${C.white}" ${ST}/>${has(p.n) ? svgText(50, 51, p.n, { size: fit(p.n, 22) }) : ''}`;
  },
  demos: [{ n: 39 }, { n: 82, color: 'galben' }],
});

registerVisual('suitcase', {
  group: GROUP,
  defaults: { color: 'albastru' },
  label: (p) => `valiză${has(p.n) ? ` cu numărul ${p.n}` : ''}${p.tag ? ` și litera ${p.tag}` : ''}`,
  render: (p) => {
    const fill = { albastru: C.blue, rosu: C.red, verde: C.green, galben: C.yellow }[p.color] ?? C.blue;
    return `
      <path d="M36 22 V14 Q36 8 42 8 H58 Q64 8 64 14 V22" fill="none" ${st(4)}/>
      <rect x="10" y="22" width="80" height="66" rx="10" fill="${fill}" ${st(3)}/>
      <rect x="18" y="22" width="8" height="66" fill="${C.ink}" opacity=".15"/><rect x="74" y="22" width="8" height="66" fill="${C.ink}" opacity=".15"/>
      ${has(p.n) ? `<rect x="30" y="36" width="40" height="30" rx="6" fill="${C.white}" ${st(2)}/>${svgText(50, 52, p.n, { size: fit(p.n, 22) })}` : ''}
      ${p.tag ? svgText(50, 79, p.tag, { size: 14, cls: 'v-tag' }) : ''}`;
  },
  demos: [{ n: 65, tag: 'N' }],
});

registerVisual('apple', {
  group: GROUP,
  defaults: { color: 'rosu' },
  label: withNumber('măr'),
  render: (p) => `
    <path d="M50 30 C50 20 53 12 60 6" fill="none" ${st(3.5)}/>
    <path d="M55 20 C62 8 76 8 82 12 C76 22 64 26 55 20 Z" fill="${C.green}" ${ST}/>
    <path d="M50 30 C38 18 12 22 12 50 C12 74 30 94 50 92 C70 94 88 74 88 50 C88 22 62 18 50 30 Z" fill="${colorOf(p.color, C.red)}" ${st(3)}/>
    <ellipse cx="30" cy="48" rx="5" ry="10" fill="${C.white}" opacity=".45"/>
    ${has(p.n) ? numberBadge(52, 60, 20, p.n, 21) : ''}`,
  demos: [{ n: 35 }, { color: 'verde', n: 40 }],
});

registerVisual('leaf', {
  group: GROUP,
  label: withNumber('frunză'),
  render: (p) => `
    <path d="M10 90 C10 42 40 10 90 10 C90 60 58 90 10 90 Z" fill="${C.green}" ${st(3)}/>
    <path d="M10 90 L80 20" fill="none" stroke="${C.greenDark}" stroke-width="3" stroke-linecap="round"/>
    <path d="M34 66 L30 46 M48 52 L46 32 M44 58 L64 60 M58 44 L76 46" fill="none" stroke="${C.greenDark}" stroke-width="2" stroke-linecap="round"/>
    ${has(p.n) ? numberBadge(52, 52, 19, p.n, 20) : ''}`,
  demos: [{ n: 27 }],
});

registerVisual('balloon', {
  group: GROUP,
  defaults: { color: 'rosu' },
  label: withNumber('balon'),
  render: (p) => `
    <path d="M50 86 C44 92 56 94 50 99" fill="none" stroke="${C.ink}" stroke-width="2"/>
    <path d="M45 82 L55 82 L50 88 Z" fill="${colorOf(p.color, C.red)}" ${st(2)}/>
    <path d="M50 4 C26 4 14 22 14 42 C14 62 32 78 50 82 C68 78 86 62 86 42 C86 22 74 4 50 4 Z" fill="${colorOf(p.color, C.red)}" ${st(3)}/>
    <ellipse cx="32" cy="30" rx="6" ry="11" fill="${C.white}" opacity=".45" transform="rotate(20 32 30)"/>
    ${has(p.n) ? numberBadge(50, 43, 20, p.n, 21) : ''}`,
  demos: [{ n: 200 }, { n: 7, color: 'galben' }],
});

registerVisual('planet', {
  group: GROUP,
  defaults: { color: 'mov' },
  label: withNumber('planetă'),
  render: (p) => `
    <ellipse cx="50" cy="54" rx="46" ry="14" fill="none" stroke="${C.ink}" stroke-width="9"/>
    <ellipse cx="50" cy="54" rx="46" ry="14" fill="none" stroke="${C.yellow}" stroke-width="5"/>
    <circle cx="50" cy="50" r="31" fill="${colorOf(p.color, C.purple)}" ${st(3)}/>
    <path d="M28 36 C40 30 58 30 72 38 M24 58 C38 64 62 66 76 58" fill="none" stroke="${C.white}" stroke-width="3" opacity=".35" stroke-linecap="round"/>
    <path d="M4 54 A46 14 0 0 0 96 54" fill="none" stroke="${C.ink}" stroke-width="9"/>
    <path d="M4 54 A46 14 0 0 0 96 54" fill="none" stroke="${C.yellow}" stroke-width="5"/>
    ${has(p.n) ? numberBadge(50, 48, 17, p.n, 18) : ''}`,
  demos: [{ n: 96 }, { n: 46, color: 'albastru' }],
});

registerVisual('rocket', {
  group: GROUP,
  label: withNumber('rachetă'),
  render: (p) => `
    <path d="M36 74 C38 86 44 92 50 99 C56 92 62 86 64 74 Z" fill="${C.orange}" ${st(2)}/>
    <path d="M43 74 C44 82 47 86 50 91 C53 86 56 82 57 74 Z" fill="${C.yellow}"/>
    <path d="M28 52 L10 78 L28 74 Z M72 52 L90 78 L72 74 Z" fill="${C.red}" ${ST}/>
    <path d="M50 4 C70 18 76 42 73 76 L27 76 C24 42 30 18 50 4 Z" fill="${C.grayLight}" ${st(3)}/>
    <path d="M50 4 C61 12 67 21 70 31 L30 31 C33 21 39 12 50 4 Z" fill="${C.red}" ${ST}/>
    <circle cx="50" cy="52" r="15" fill="${C.blueLight}" ${st(2.5)}/>
    ${has(p.n) ? svgText(50, 53, p.n, { size: fit(p.n, 16) }) : ''}`,
  demos: [{ n: 48 }],
});

registerVisual('basket', {
  group: GROUP,
  label: (p) => `coș${p.label ? ` cu eticheta „${p.label}”` : has(p.n) ? ` cu numărul ${p.n}` : ''}`,
  render: (p) => `
    <path d="M24 46 C24 12 76 12 76 46" fill="none" stroke="${C.ink}" stroke-width="8" stroke-linecap="round"/>
    <path d="M24 46 C24 12 76 12 76 46" fill="none" stroke="${C.brown}" stroke-width="4" stroke-linecap="round"/>
    <path d="M10 46 L90 46 L80 92 L20 92 Z" fill="${C.brownLight}" ${st(3)}/>
    <path d="M14 62 L86 62 M17 77 L83 77 M34 46 L36 92 M50 46 L50 92 M66 46 L64 92" stroke="${C.brown}" stroke-width="2" fill="none"/>
    <rect x="6" y="38" width="88" height="12" rx="6" fill="${C.brown}" ${ST}/>
    ${p.label ? `<rect x="18" y="58" width="64" height="22" rx="6" fill="${C.white}" ${st(2)}/>${txt(50, 69, p.label, { size: String(p.label).length > 8 ? 9 : 11 })}`
      : has(p.n) ? numberBadge(50, 69, 16, p.n, 18) : ''}`,
  demos: [{ n: 42 }, { label: 'rădăcină' }],
});

registerVisual('tag', {
  group: GROUP,
  defaults: { unit: 'lei' },
  viewBox: '0 0 120 64',
  label: (p) => `etichetă de preț: ${has(p.n) ? cantitate(Number(p.n), singularOf(p.unit), p.unit) : p.unit}`,
  render: (p) => `
    <path d="M4 32 L28 6 H110 Q116 6 116 12 V52 Q116 58 110 58 H28 Z" fill="${C.yellow}" ${st(3)}/>
    <circle cx="24" cy="32" r="5" fill="${C.white}" ${st(2)}/>
    ${svgText(72, 32, has(p.n) ? cantitate(Number(p.n), singularOf(p.unit), p.unit) : p.unit, { size: has(p.n) && Number(p.n) % 100 >= 20 ? 15 : 20 })}`,
  demos: [{ n: 18 }, { n: 42 }],
});
