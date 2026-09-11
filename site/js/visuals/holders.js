// Suporturi pentru numere: obiecte pe care scriem un număr (scoică, stea, floare, valiză…).
// Culorile vin din variabile CSS (--v-*) cu valori de rezervă, ca desenele să arate bine și fără stiluri.

import { registerVisual, svgText } from './index.js';

const GROUP = 'Suporturi pentru numere';
const label = (name) => (p) => (p.n !== undefined && p.n !== '' ? `${name} cu numărul ${p.n}` : name);

registerVisual('shell', {
  group: GROUP,
  label: label('scoică'),
  render: (p) => `
    <path d="M50 8 C20 8 6 38 10 62 C12 76 24 88 50 92 C76 88 88 76 90 62 C94 38 80 8 50 8 Z" fill="var(--v-pink, #F9B8C6)" stroke="var(--v-ink, #3B2F4A)" stroke-width="2.5"/>
    <path d="M50 12 L50 90 M50 12 L28 86 M50 12 L72 86 M50 12 L14 66 M50 12 L86 66" stroke="var(--v-pink-dark, #E48AA2)" stroke-width="2" fill="none"/>
    <rect x="22" y="84" width="56" height="12" rx="6" fill="var(--v-pink-dark, #E48AA2)" stroke="var(--v-ink, #3B2F4A)" stroke-width="2.5"/>
    ${p.n !== undefined ? `<circle cx="50" cy="52" r="21" fill="var(--v-white, #fff)" stroke="var(--v-ink, #3B2F4A)" stroke-width="2"/>${svgText(50, 53, p.n, { size: 22 })}` : ''}`,
  demos: [{ n: 14 }],
});

registerVisual('star', {
  group: GROUP,
  label: label('stea'),
  render: (p) => `
    <path d="M50 5 L62 36 L95 38 L69 58 L78 92 L50 73 L22 92 L31 58 L5 38 L38 36 Z" fill="var(--v-yellow, #FFD34D)" stroke="var(--v-ink, #3B2F4A)" stroke-width="3" stroke-linejoin="round"/>
    ${p.n !== undefined ? svgText(50, 55, p.n, { size: 24 }) : ''}`,
  demos: [{ n: 47 }],
});

registerVisual('flower', {
  group: GROUP,
  defaults: { color: 'roz' },
  label: label('floare'),
  render: (p) => {
    const fill = { roz: 'var(--v-pink, #F9B8C6)', galben: 'var(--v-yellow, #FFD34D)', albastru: 'var(--v-blue-light, #9CCBF5)', mov: 'var(--v-purple-light, #C9B6F2)' }[p.color] ?? 'var(--v-pink, #F9B8C6)';
    const petals = [0, 60, 120, 180, 240, 300]
      .map((a) => `<ellipse cx="50" cy="24" rx="15" ry="22" fill="${fill}" stroke="var(--v-ink, #3B2F4A)" stroke-width="2.5" transform="rotate(${a} 50 50)"/>`)
      .join('');
    return `${petals}<circle cx="50" cy="50" r="22" fill="var(--v-white, #fff)" stroke="var(--v-ink, #3B2F4A)" stroke-width="2.5"/>${p.n !== undefined ? svgText(50, 51, p.n, { size: 22 }) : ''}`;
  },
  demos: [{ n: 39 }, { n: 82, color: 'galben' }],
});

registerVisual('suitcase', {
  group: GROUP,
  defaults: { color: 'albastru' },
  label: (p) => `valiză${p.n !== undefined ? ` cu numărul ${p.n}` : ''}${p.tag ? ` și litera ${p.tag}` : ''}`,
  render: (p) => {
    const fill = { albastru: 'var(--v-blue, #5AA9E6)', rosu: 'var(--v-red, #F07167)', verde: 'var(--v-green, #6BCB77)', galben: 'var(--v-yellow, #FFD34D)' }[p.color] ?? 'var(--v-blue, #5AA9E6)';
    return `
      <path d="M36 22 V14 Q36 8 42 8 H58 Q64 8 64 14 V22" fill="none" stroke="var(--v-ink, #3B2F4A)" stroke-width="4"/>
      <rect x="10" y="22" width="80" height="66" rx="10" fill="${fill}" stroke="var(--v-ink, #3B2F4A)" stroke-width="3"/>
      <rect x="18" y="22" width="8" height="66" fill="var(--v-ink, #3B2F4A)" opacity=".15"/><rect x="74" y="22" width="8" height="66" fill="var(--v-ink, #3B2F4A)" opacity=".15"/>
      ${p.n !== undefined ? `<rect x="30" y="36" width="40" height="30" rx="6" fill="var(--v-white, #fff)" stroke="var(--v-ink, #3B2F4A)" stroke-width="2"/>${svgText(50, 52, p.n, { size: 22 })}` : ''}
      ${p.tag ? svgText(50, 79, p.tag, { size: 14, cls: 'v-tag' }) : ''}`;
  },
  demos: [{ n: 65, tag: 'N' }],
});
