// Desenele pentru înmulțire (Jocuri fulger, tema „Înmulțirea”): grupe egale de obiecte, pe tăvi.
// Ca desenele jocurilor: 320 de unități lățime, emoji de cel puțin 24 și numere de cel puțin 20 (tests/visuals.test.js). Tăvile au
// contur, deci grupele nu se despart doar prin culoare; numele desenului spune grupele, nu totalul.

import { cantitate } from '../core/ro.js';
import { hasEmoji } from './emoji.js';
import { pill } from './grafice.js';
import { registerVisual } from './index.js';
import { bool, emojiImage, num, st } from './palette.js';

const W = 320;
const TRAY = 100; // lățimea unei tăvi: cel mult 3 obiecte pe rând
const GAP = 8;
const CELL = 30; // locul unui obiect
const ICON = 26; // emoji-ul din loc
const PAD = 5; // marginea tăvii, sus și jos
const BELOW = 22; // sub fiecare rând de tăvi: locul pastilelor numărătorii (desenul rezolvat are aceleași dimensiuni)
const CREAM = 'var(--v-cream, #FFEBCC)';

/** Câte pe fiecare rând: cel mult 3 (4 → 2 + 2, 5 → 3 + 2, 6 → 3 + 3), ca punctele zarului. */
const split = (k) => (k <= 3 ? [k] : [Math.ceil(k / 2), Math.floor(k / 2)]);

function layout(p) {
  const n = num(p.n, 1);
  const each = num(p.each, 1);
  const items = split(each);
  const trayH = 2 * PAD + CELL * items.length;
  const trays = split(n);
  return { n, each, items, trays, trayH, height: 4 + trays.length * (trayH + BELOW) };
}

registerVisual('groups', {
  group: 'Desene pentru înmulțire',
  defaults: { n: 3, each: 4, emoji: 'mar', unit: ['măr', 'mere'] },
  label: (p) => {
    const { n, each } = layout(p);
    const [sg, pl] = p.unit;
    const groups = `${cantitate(n, 'grupă', 'grupe')} cu câte ${cantitate(each, sg, pl)}`;
    if (!bool(p.counts)) return groups;
    return `${groups}; din ${each} în ${each}: ${Array.from({ length: n }, (_, i) => (i + 1) * each).join(', ')}`;
  },
  viewBox: (p) => `0 0 ${W} ${layout(p).height}`,
  check(p) {
    const errors = [];
    for (const key of ['n', 'each']) {
      const v = Number(p[key]);
      if (!Number.isInteger(v) || v < 1 || v > 6) errors.push(`„${key}” între 1 și 6 (acum ${p[key]})`);
    }
    if (!hasEmoji(p.emoji)) errors.push(`emoji necunoscut „${p.emoji}”`);
    if (!Array.isArray(p.unit) || p.unit.length !== 2 || !p.unit.every((u) => typeof u === 'string' && u)) errors.push('„unit” e [singular, plural]');
    return errors;
  },
  render(p) {
    const { each, items, trays, trayH } = layout(p);
    let out = '';
    let index = 0;
    trays.forEach((count, r) => {
      const y = 2 + r * (trayH + BELOW);
      const x0 = (W - count * TRAY - (count - 1) * GAP) / 2;
      for (let i = 0; i < count; i++, index++) {
        const x = x0 + i * (TRAY + GAP);
        out += `<rect x="${x}" y="${y}" width="${TRAY}" height="${trayH}" rx="12" fill="${CREAM}" ${st(2)}/>`;
        items.forEach((k, j) => {
          const left = x + (TRAY - k * CELL) / 2 + (CELL - ICON) / 2;
          const top = y + PAD + j * CELL + (CELL - ICON) / 2;
          for (let m = 0; m < k; m++) out += emojiImage(p.emoji, left + m * CELL, top, ICON);
        });
        // desenul rezolvat: numărătoarea din grupă în grupă, sub fiecare tavă (pastila atinge doar marginea tăvii)
        if (bool(p.counts)) out += pill(x + TRAY / 2, y + trayH + 8, String((index + 1) * each));
      }
    });
    return out;
  },
  demos: [
    { n: 3, each: 4, emoji: 'mar', unit: ['măr', 'mere'] },
    { n: 5, each: 6, emoji: 'ou', unit: ['ou', 'ouă'], counts: true },
    { n: 2, each: 3, emoji: 'stea', unit: ['stea', 'stele'] },
  ],
});
