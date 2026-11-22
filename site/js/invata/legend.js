// Învață: legenda de sub calcul, în culorile glisoarelor („3 farfurii” ca glisorul din stânga, „câte 4 mere” ca cel de sus), ca
// copilul să vadă ce schimbă fiecare glisor. Culoarea nu e singurul indiciu: legenda spune și în cuvinte.

import { h } from '../core/dom.js';
import { keepMath, splitLetter } from './text.js';

/** Un text ca noduri, cu litera x (singură) desenată altfel decât semnul × (`<var class="iv-x">`). */
const letterNodes = (text) => splitLetter(text).map((part, i) => (i % 2 ? h('var', { class: 'iv-x' }, part) : part)).filter((part) => part !== '');

/** Un calcul ca noduri, ținut pe un rând (`keepMath`), cu litera x desenată. */
export const mathNodes = (text) => letterNodes(keepMath(text));

/** Bucățile legendei (`texts().legend`: [ton, text]) ca noduri, fără `null` (replaceChildren ar scrie „null”). */
export const legendNodes = (legend = []) => legend.flatMap(([tone, text]) => (tone ? [h('span', { class: `iv-f iv-f--${tone}` }, letterNodes(text))] : letterNodes(text)));
