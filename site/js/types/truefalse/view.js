// truefalse — fiecare afirmație are butoanele A (adevărat) și F (fals).

import { h, pop } from '../../core/dom.js';
import { play } from '../../core/sound.js';
import { md } from '../../core/markup.js';
import { feedbackBox, isLocked, setState } from '../_view.js';

export default {
  howto: () => 'Pentru fiecare afirmație atinge A (adevărat) sau F (fals).',

  mount(el, part, ctx) {
    let answer = {};
    let mode = 'solve';
    const rows = {};

    const list = part.items.map((item) => {
      const btn = (value, letter, label) =>
        h(
          'button',
          {
            type: 'button',
            class: 'ex-tf__btn',
            'aria-label': label,
            'aria-pressed': 'false',
            'data-testid': `tf-${item.id}-${letter}`,
            'data-value': String(value),
            onClick: () => choose(item.id, value),
          },
          letter,
        );
      const row = h(
        'div',
        { class: 'ex-tf__row' },
        h('p', { class: 'ex-tf__text', html: md(item.text) }),
        h('div', { class: 'ex-tf__btns', role: 'group', 'aria-label': 'Adevărat sau fals' }, btn(true, 'A', 'Adevărat'), btn(false, 'F', 'Fals')),
        h('div', { class: 'ex-tf__why' }),
      );
      rows[item.id] = row;
      return row;
    });
    el.append(h('div', { class: 'ex-tf' }, list));

    function choose(id, value) {
      if (isLocked(mode)) return;
      answer = { ...answer, [id]: value };
      paint();
      pop(rows[id].querySelector('.ex-tf__btn.is-selected'));
      play('tap');
      ctx.onChange(answer);
    }

    function paint() {
      for (const [id, row] of Object.entries(rows)) {
        for (const b of row.querySelectorAll('.ex-tf__btn')) {
          const on = answer[id] !== undefined && String(answer[id]) === b.dataset.value;
          b.classList.toggle('is-selected', on);
          b.setAttribute('aria-pressed', String(on));
        }
      }
    }

    return {
      get: () => answer,
      set(a) {
        answer = { ...(a ?? {}) };
        paint();
      },
      mode(m) {
        mode = m;
        for (const row of Object.values(rows)) for (const b of row.querySelectorAll('button')) b.disabled = isLocked(m);
      },
      showResult(res) {
        for (const r of res.items) {
          const row = rows[r.id];
          setState(row, r.ok ? 'correct' : 'wrong');
          const item = part.items.find((i) => i.id === r.id);
          const note = r.ok ? null : `${r.given === null ? 'Nu ai ales. ' : ''}Răspunsul corect: **${r.expected ? 'Adevărat' : 'Fals'}**.${item.why ? ` ${item.why}` : ''}`;
          row.querySelector('.ex-tf__why').replaceChildren(feedbackBox(note) ?? '');
        }
      },
      destroy() {},
    };
  },
};
