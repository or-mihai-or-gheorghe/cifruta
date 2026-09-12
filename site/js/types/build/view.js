// build — numărătoarea: butoane + și − pe fiecare tijă (sute / zeci / unități).

import { h } from '../../core/dom.js';
import { md } from '../../core/markup.js';
import { visualSVG } from '../../visuals/index.js';
import { isLocked, setState } from '../_view.js';

const NAMES = { S: 'sute', Z: 'zeci', U: 'unități' };

export default {
  howto: () => 'Apasă + ca să pui o bilă pe tijă și − ca să o scoți.',

  mount(el, part, ctx) {
    const places = part.places;
    let answer = {};
    let mode = 'solve';
    const rows = {};

    for (const item of part.items) {
      const pic = h('div', { class: 'ex-abacus__art' });
      const controls = h('div', { class: 'ex-abacus__controls' }, places.map((p) =>
        h('div', { class: `ex-abacus__rod ex-abacus__rod--${p.toLowerCase()}` },
          h('button', { type: 'button', class: 'c-btn c-btn--icon ex-abacus__btn', 'aria-label': `adaugă o bilă la ${NAMES[p]}`, 'data-testid': `abacus-${item.id}-${p}-plus`, onClick: () => bump(item.id, p, 1) }, '+'),
          h('span', { class: 'ex-abacus__name' }, p),
          h('button', { type: 'button', class: 'c-btn c-btn--icon ex-abacus__btn', 'aria-label': `scoate o bilă de la ${NAMES[p]}`, 'data-testid': `abacus-${item.id}-${p}-minus`, onClick: () => bump(item.id, p, -1) }, '−'),
        )));
      const row = h('div', { class: 'ex-abacus' }, h('p', { class: 'ex-abacus__label', html: md(item.label) }), h('div', { class: 'ex-abacus__body' }, pic, controls), h('div', { class: 'ex-abacus__result' }));
      rows[item.id] = { row, pic };
    }
    el.append(h('div', { class: 'ex-abacus-list' }, Object.values(rows).map((r) => r.row)));

    function bump(id, place, delta) {
      if (isLocked(mode)) return;
      const beads = { ...Object.fromEntries(places.map((p) => [p, 0])), ...(answer[id] ?? {}) };
      const was = beads[place];
      beads[place] = Math.max(0, Math.min(9, beads[place] + delta));
      answer = { ...answer, [id]: beads };
      if (places.every((p) => beads[p] === 0)) delete answer[id]; // toate bilele scoase: la fel ca neatinsă
      paint(id);
      if (beads[place] > was) rows[id].pic.querySelector(`.v-abacus__bead[data-rod="${place}"][data-i="${beads[place] - 1}"]`)?.classList.add('is-new'); // bila nouă cade pe tijă
      ctx.onChange(answer);
    }

    function paint(id) {
      const beads = answer[id] ?? {};
      rows[id].pic.innerHTML = visualSVG({ v: 'abacus', places: places.join(''), ...beads });
    }
    for (const id of Object.keys(rows)) paint(id);

    return {
      get: () => answer,
      set(a) {
        answer = { ...(a ?? {}) };
        for (const id of Object.keys(rows)) paint(id);
      },
      mode(m) {
        mode = m;
        for (const r of Object.values(rows)) for (const b of r.row.querySelectorAll('button')) b.disabled = isLocked(m);
      },
      showResult(res) {
        for (const x of res.items) {
          setState(rows[x.id].row, x.ok ? 'correct' : 'wrong');
          rows[x.id].row.querySelector('.ex-abacus__result').replaceChildren(
            x.ok ? '' : h('span', { class: 'u-small' }, x.given === null ? 'Numărătoarea a rămas goală. ' : `Ai format ${x.given}. `, h('span', { class: 'ex-expected' }, String(x.expected))),
          );
        }
      },
      destroy() {},
    };
  },
};
