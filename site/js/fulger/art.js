// Jocuri fulger: desenul unei întrebări cu figuri sau al unei variante — un desen din bancă ({ v, … }), un emoji ({ emoji }) sau un
// text ({ text }, cu `note` dedesubt: „Ma” / „marți”). `alt` înlocuiește numele citit de cititorul de ecran, când numele desenului ar
// da răspunsul („pătrat”) sau când textul e prescurtat. Cerințele pot avea emoji-uri scrise {{e:nume}} (stațiile de pe hartă).

import { escapeHTML } from '../core/dom.js';
import { EMOJI, emojiHTML } from '../visuals/emoji.js';
import '../visuals/forme.js';
import '../visuals/grafice.js';
import '../visuals/grafuri.js';
import { visualLabel, visualSVG, visualViewBox } from '../visuals/index.js';

const TOKEN = /\{\{e:([a-z0-9]+)\}\}/g;

/** Cerința cu emoji-urile ei desenate (restul textului e scăpat, deci nu poate aduce HTML). */
export const promptHTML = (text) =>
  String(text ?? '')
    .split(TOKEN)
    .map((part, i) => (i % 2 ? (EMOJI[part] ? emojiHTML(part, { cls: 'c-emoji fg-prompt__emoji' }) : '') : escapeHTML(part)))
    .join('');

/** Cerința pentru cititorul de ecran: emoji-urile devin cuvinte. */
export const promptSpoken = (text) => String(text ?? '').replace(TOKEN, (_, name) => EMOJI[name]?.label ?? name);

/** Lungimea vizibilă a cerinței: un emoji ocupă cam cât două litere. */
export const promptLength = (text) => String(text ?? '').replace(TOKEN, 'ee').length;

/** Desenele de date (grafice, hărți, rețele, arbori): se văd mai mari în arenă și la „Greșelile tale”. */
export const isChart = (spec) => /^(chart-|metro$|network$|bracket$|tree$|venn$)/.test(spec?.v ?? '');

export function artHTML(spec) {
  if (spec?.v) return visualSVG(spec);
  if (spec?.emoji) return emojiHTML(spec.emoji);
  return escapeHTML(String(spec?.text ?? ''));
}

export function artName(spec) {
  if (!spec) return '';
  if (spec.alt) return spec.alt;
  if (spec.v) return visualLabel(spec);
  if (spec.emoji) return EMOJI[spec.emoji]?.label ?? spec.emoji;
  return String(spec.text ?? '');
}

/** Lățime / înălțime, din viewBox (1 pentru emoji și text). */
export function aspect(spec) {
  if (!spec?.v) return 1;
  const [, , w, h] = visualViewBox(spec).split(/\s+/).map(Number);
  return w > 0 && h > 0 ? Math.round((w / h) * 1000) / 1000 : 1;
}
