// Învață: legenda de sub calcul, în culorile glisoarelor („3 farfurii” ca glisorul din stânga, „câte 4 mere” ca cel de sus), ca
// copilul să vadă ce schimbă fiecare glisor. Culoarea nu e singurul indiciu: legenda spune și în cuvinte.

import { h } from '../core/dom.js';

/** Bucățile legendei (`texts().legend`: [ton, text]) ca noduri, fără `null` (replaceChildren ar scrie „null”). */
export const legendNodes = (legend = []) => legend.map(([tone, text]) => (tone ? h('span', { class: `iv-f iv-f--${tone}` }, text) : text));
