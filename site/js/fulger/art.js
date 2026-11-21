// Jocuri fulger: desenul unei întrebări cu figuri sau al unei variante — un desen din bancă ({ v, … }), un emoji ({ emoji }), o fracție
// ({ frac: '3/5' }, etajată, citită „trei cincimi”) sau un text ({ text }, cu `note` dedesubt: „Ma” / „marți”). `alt` înlocuiește numele
// citit de cititorul de ecran, când numele desenului ar da răspunsul („pătrat”) sau când textul e prescurtat. Cerințele pot avea
// emoji-uri scrise {{e:nume}} (stațiile de pe hartă) și fracții scrise {{f:n/d}} („Cât fac {{f:2/3}} din 12?”).

import { escapeHTML } from '../core/dom.js';
import { md } from '../core/markup.js';
import { fractionWords } from '../core/ro.js';
import { EMOJI, emojiHTML } from '../visuals/emoji.js';
import '../visuals/forme.js';
import '../visuals/fractii.js';
import '../visuals/grafice.js';
import '../visuals/grafuri.js';
import '../visuals/inmultire.js';
import { visualLabel, visualSVG, visualViewBox } from '../visuals/index.js';

/** Emoji-urile și fracțiile din cerințe, cu numele (sau fracția) într-un singur grup: {{e:mar}}, {{f:2/3}}. */
const TOKENS = /\{\{(e:[a-z0-9]+|f:\d+\/\d+)\}\}/g;
const fracOf = (text) => String(text).split('/').map(Number);

/** Cerința cu emoji-urile și fracțiile ei desenate (restul textului e scăpat, deci nu poate aduce HTML). */
export const promptHTML = (text) =>
  String(text ?? '')
    .split(TOKENS)
    .map((part, i) => {
      if (!(i % 2)) return escapeHTML(part);
      if (part.startsWith('f:')) return md(`{{${part}}}`);
      const name = part.slice(2);
      return EMOJI[name] ? emojiHTML(name, { cls: 'c-emoji fg-prompt__emoji' }) : '';
    })
    .join('');

/** Cerința pentru cititorul de ecran: emoji-urile și fracțiile devin cuvinte. */
export const promptSpoken = (text) =>
  String(text ?? '').replace(TOKENS, (_, part) => (part.startsWith('f:') ? fractionWords(...fracOf(part.slice(2))) : EMOJI[part.slice(2)]?.label ?? part.slice(2)));

/** Lungimea vizibilă a cerinței: un emoji sau o fracție etajată ocupă cam cât două litere. */
export const promptLength = (text) => String(text ?? '').replace(TOKENS, 'ee').length;

/** Textul unei ecuații cu căsuța, desfăcut în jurul ei: „□ + 7 = 15” → ['', ' + 7 = 15']; null dacă n-are căsuță. */
export const boxParts = (text) => {
  const parts = String(text ?? '').split('□');
  return parts.length === 2 ? parts : null;
};

/** Desenele de date (grafice, hărți, rețele, arbori, grupele de la înmulțire): se văd mai mari în arenă și la „Greșelile tale”. */
export const isChart = (spec) => /^(chart-|metro$|network$|bracket$|tree$|venn$|groups$)/.test(spec?.v ?? '');

export function artHTML(spec) {
  if (spec?.v) return visualSVG(spec);
  if (spec?.emoji) return emojiHTML(spec.emoji);
  if (spec?.frac) return md(`{{f:${spec.frac}}}`);
  return escapeHTML(String(spec?.text ?? ''));
}

export function artName(spec) {
  if (!spec) return '';
  if (spec.alt) return spec.alt;
  if (spec.v) return visualLabel(spec);
  if (spec.emoji) return EMOJI[spec.emoji]?.label ?? spec.emoji;
  if (spec.frac) return fractionWords(...fracOf(spec.frac));
  return String(spec.text ?? '');
}

/** Lățime / înălțime, din viewBox (1 pentru emoji și text). */
export function aspect(spec) {
  if (!spec?.v) return 1;
  const [, , w, h] = visualViewBox(spec).split(/\s+/).map(Number);
  return w > 0 && h > 0 ? Math.round((w / h) * 1000) / 1000 : 1;
}
