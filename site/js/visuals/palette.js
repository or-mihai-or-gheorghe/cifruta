// Culori și ajutoare comune pentru desenele SVG. Culorile sunt variabile CSS (--v-*) cu valori de rezervă.

import { escapeHTML } from '../core/dom.js';
import { EMOJI } from './emoji.js';

export const C = {
  ink: 'var(--v-ink, #3B2F4A)',
  white: 'var(--v-white, #FFFFFF)',
  red: 'var(--v-red, #F07167)',
  redDark: 'var(--v-red-dark, #D64545)',
  orange: 'var(--v-orange, #F9A03F)',
  orangeDark: 'var(--v-orange-dark, #E07B39)',
  yellow: 'var(--v-yellow, #FFD34D)',
  yellowDark: 'var(--v-yellow-dark, #F2B705)',
  green: 'var(--v-green, #6BCB77)',
  greenDark: 'var(--v-green-dark, #3FA34D)',
  teal: 'var(--v-teal, #4ECDC4)',
  blue: 'var(--v-blue, #5AA9E6)',
  blueDark: 'var(--v-blue-dark, #2F80C8)',
  blueLight: 'var(--v-blue-light, #9CCBF5)',
  purple: 'var(--v-purple, #9B7BEA)',
  purpleLight: 'var(--v-purple-light, #C9B6F2)',
  pink: 'var(--v-pink, #F9B8C6)',
  pinkDark: 'var(--v-pink-dark, #E48AA2)',
  brown: 'var(--v-brown, #A86B3C)',
  brownLight: 'var(--v-brown-light, #D9A066)',
  gray: 'var(--v-gray, #B8B3C2)',
  grayLight: 'var(--v-gray-light, #E9E6EF)',
  skin: 'var(--v-skin, #F6C9A0)',
  sky: 'var(--v-sky, #DFF3FF)',
  grass: 'var(--v-grass, #9ED98A)',
  cream: 'var(--v-cream, #FFEBCC)',
  s: 'var(--v-s, #2E9E44)',
  z: 'var(--v-z, #E03131)',
  u: 'var(--v-u, #1C7ED6)',
};

/** Contur standard. */
export const ST = `stroke="${C.ink}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"`;
export const st = (w) => `stroke="${C.ink}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

export const has = (v) => v !== undefined && v !== null && v !== '';
export const num = (v, fallback) => (has(v) && !Number.isNaN(Number(v)) ? Number(v) : fallback);
export const list = (v) =>
  (Array.isArray(v) ? v : has(v) ? String(v).split(',') : []).map((x) => String(x).trim()).filter((x) => x !== '');
export const bool = (v, fallback = false) => (has(v) ? v === true || v === 'true' || v === 1 || v === '1' : fallback);

/** Text cu culoare explicită (pentru etichete, nu pentru numerele principale). */
export const txt = (x, y, s, { size = 12, fill = C.ink, weight = 700, anchor = 'middle', cls = 'v-label' } = {}) =>
  `<text x="${x}" y="${y}" class="${cls}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" dominant-baseline="central">${escapeHTML(s)}</text>`;

/** Imagine emoji din site/assets/emoji (cale relativă la pagină). */
export const emojiImage = (name, x, y, size) => {
  const e = EMOJI[name];
  return e ? `<image href="assets/emoji/${e.code}.svg" x="${x}" y="${y}" width="${size}" height="${size}"/>` : '';
};

/** Mărimea fontului micșorată pentru numere cu 3 sau mai multe cifre. */
export const fit = (n, size) => (String(n).length >= 3 ? Math.round(size * 0.74) : size);

/** Cerc alb cu număr (pentru obiecte colorate). */
export const numberBadge = (cx, cy, r, n, size) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.white}" ${st(2)}/>` +
  `<text x="${cx}" y="${cy + 1}" class="v-num" font-size="${fit(n, size)}" font-weight="700" text-anchor="middle" dominant-baseline="central">${escapeHTML(n)}</text>`;
