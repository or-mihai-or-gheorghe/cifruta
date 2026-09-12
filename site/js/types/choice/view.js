// choice — carduri de variante; alegere simplă sau multiplă.

import { h, pop } from '../../core/dom.js';
import { play } from '../../core/sound.js';
import { md } from '../../core/markup.js';
import { shuffled } from '../../core/rng.js';
import { feedbackBox, isLocked, itemFace, setState } from '../_view.js';
import { optionId } from './logic.js';

const optionFace = (o) => (typeof o === 'object' ? itemFace(o) : itemFace({ text: o }));

export default {
  howto: (part) => (part.items.some((i) => i.multi) ? 'Atinge toate variantele potrivite.' : 'Atinge varianta corectă.'),

  mount(el, part, ctx) {
    let answer = {};
    let mode = 'solve';
    const buttons = {}; // itemId → { optionId: button }
    const feedback = {};

    const rows = part.items.map((item, idx) => {
      const opts = part.shuffle ? shuffled(item.options, ctx.seed + idx) : item.options;
      buttons[item.id] = {};
      const list = h(
        'div',
        { class: `ex-options${part.style === 'circles' ? ' ex-options--circles' : ''}`, role: item.multi ? 'group' : 'radiogroup' },
        opts.map((o) => {
          const id = optionId(o);
          const btn = h(
            'button',
            {
              type: 'button',
              class: 'ex-option',
              role: item.multi ? 'checkbox' : 'radio',
              'aria-checked': 'false',
              'data-testid': `opt-${item.id}-${id}`,
              onClick: () => choose(item, id),
            },
            optionFace(o),
          );
          buttons[item.id][id] = btn;
          return btn;
        }),
      );
      feedback[item.id] = h('div', { class: 'ex-q__feedback' });
      return h('div', { class: 'ex-q' }, item.q ? h('div', { class: 'ex-q__text', html: md(item.q) }) : null, list, feedback[item.id]);
    });
    el.append(h('div', { class: 'l-stack' }, rows));

    function choose(item, id) {
      if (isLocked(mode)) return;
      if (item.multi) {
        const cur = new Set(answer[item.id] ?? []);
        cur.has(id) ? cur.delete(id) : cur.add(id);
        answer = { ...answer, [item.id]: [...cur] };
      } else {
        answer = { ...answer, [item.id]: id };
      }
      paint();
      pop(buttons[item.id][id]);
      play('tap');
      ctx.onChange(answer);
    }

    function paint() {
      for (const item of part.items) {
        const sel = new Set([].concat(answer[item.id] ?? []).map(String));
        for (const [id, btn] of Object.entries(buttons[item.id])) {
          btn.classList.toggle('is-selected', sel.has(id));
          btn.setAttribute('aria-checked', String(sel.has(id)));
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
        for (const group of Object.values(buttons)) for (const b of Object.values(group)) b.disabled = isLocked(m);
      },
      showResult(res) {
        for (const r of res.items) {
          const item = part.items.find((i) => i.id === r.id);
          const expected = new Set([].concat(r.expected).map(String));
          const given = new Set([].concat(r.given ?? []).map(String));
          for (const [id, btn] of Object.entries(buttons[item.id])) {
            if (given.has(id)) setState(btn, expected.has(id) ? 'correct' : 'wrong');
            else setState(btn, expected.has(id) ? 'missed' : null);
          }
          feedback[item.id].replaceChildren(feedbackBox(r.feedback) ?? '');
        }
      },
      destroy() {},
    };
  },
};
