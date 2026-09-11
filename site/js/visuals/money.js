// Bani românești stilizați: doar valoarea și culoarea (fără portrete sau elemente de siguranță).

import { cantitate } from '../core/ro.js';
import { registerVisual } from './index.js';
import { C, num, st, txt } from './palette.js';

const GROUP = 'Bani';

const NOTE_COLORS = {
  1: 'var(--v-note-1, #A9C4A2)',
  5: 'var(--v-note-5, #B9A3E3)',
  10: 'var(--v-note-10, #F29BB8)',
  20: 'var(--v-note-20, #F9B45C)',
  50: 'var(--v-note-50, #FFE066)',
  100: 'var(--v-note-100, #86B8EA)',
  200: 'var(--v-note-200, #CFA77E)',
  500: 'var(--v-note-500, #A7B0DE)',
};

const lei = (v) => cantitate(v, 'leu', 'lei');

registerVisual('banknote', {
  group: GROUP,
  defaults: { value: 10 },
  viewBox: '0 0 160 80',
  label: (p) => `bancnotă de ${lei(num(p.value, 10))}`,
  render: (p) => {
    const v = num(p.value, 10);
    const fill = NOTE_COLORS[v] ?? C.grayLight;
    return `
      <rect x="4" y="6" width="152" height="68" rx="9" fill="${fill}" ${st(2.5)}/>
      <rect x="12" y="14" width="136" height="52" rx="6" fill="none" stroke="${C.white}" stroke-width="2" opacity=".75"/>
      <circle cx="120" cy="40" r="19" fill="${C.white}" opacity=".45"/>
      <path d="M100 22 C110 30 130 30 140 22 M100 58 C110 50 130 50 140 58" fill="none" stroke="${C.white}" stroke-width="2" opacity=".6"/>
      ${txt(58, 36, v, { size: v >= 100 ? 26 : 30, weight: 800 })}
      ${txt(58, 58, v === 1 ? 'LEU' : 'LEI', { size: 12, weight: 800 })}
      ${txt(120, 40, v, { size: 13, weight: 800 })}`;
  },
  demos: [1, 5, 10, 20, 50, 100].map((value) => ({ value })),
});

const COIN_COLORS = {
  1: 'var(--v-coin-gold, #E2C25B)',
  5: 'var(--v-coin-copper, #D08C5B)',
  10: 'var(--v-coin-silver, #C9CDD6)',
  50: 'var(--v-coin-gold, #E2C25B)',
};

registerVisual('coin', {
  group: GROUP,
  defaults: { value: 50 },
  label: (p) => {
    const v = num(p.value, 50);
    return `monedă de ${cantitate(v, 'ban', 'bani')}`;
  },
  render: (p) => {
    const v = num(p.value, 50);
    return `
      <circle cx="50" cy="50" r="44" fill="${COIN_COLORS[v] ?? COIN_COLORS[50]}" ${st(3)}/>
      <circle cx="50" cy="50" r="35" fill="none" stroke="${C.ink}" stroke-width="1.5" stroke-dasharray="3 3" opacity=".6"/>
      ${txt(50, 44, v, { size: 30, weight: 800 })}
      ${txt(50, 68, v === 1 ? 'BAN' : 'BANI', { size: 11, weight: 800 })}`;
  },
  demos: [1, 5, 10, 50].map((value) => ({ value })),
});
