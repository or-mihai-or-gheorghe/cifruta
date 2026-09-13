// Jocuri fulger: desenul unei întrebări cu figuri sau al unei variante — un desen din bancă ({ v, … }), un emoji ({ emoji }) sau un
// text ({ text }). `alt` înlocuiește numele citit de cititorul de ecran, când numele desenului ar da răspunsul („pătrat”).

import { escapeHTML } from '../core/dom.js';
import { EMOJI, emojiHTML } from '../visuals/emoji.js';
import '../visuals/forme.js';
import { visualLabel, visualSVG, visualViewBox } from '../visuals/index.js';

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
