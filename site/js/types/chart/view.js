// chart — graficul cu bare se construiește cu butoane + / − pe fiecare categorie; barele date sunt blocate.

import { h, pop } from '../../core/dom.js';
import { play } from '../../core/sound.js';
import { md, plain } from '../../core/markup.js';
import { visualSVG } from '../../visuals/index.js';
import { emojiHTML } from '../../visuals/emoji.js';
import { expectedTag, feedbackBox, isLocked, setState } from '../_view.js';
import { editable } from './logic.js';

export default {
  howto: () => 'Apasă + și − ca să ridici sau să cobori fiecare bară.',

  mount(el, part, ctx) {
    const free = editable(part);
    let answer = {};
    let mode = 'solve';
    const art = h('div', { class: 'ex-chart__art' });
    const stage = h('div', { class: 'ex-chart__stage' }, art);
    const rows = {};
    const controls = h('div', { class: 'ex-chart__controls' }, part.categories.filter((c) => free.includes(c.id)).map((c) => {
      const value = h('span', { class: 'ex-chart__value', role: 'spinbutton', 'aria-label': plain(c.label), 'aria-valuemin': '0', 'aria-valuemax': String(part.max), 'aria-valuenow': '0', 'data-testid': `bar-${c.id}` }, '0');
      const row = h(
        'div',
        { class: 'ex-chart__cat', 'data-id': c.id },
        h('span', { class: 'ex-chart__name' }, c.emoji ? h('span', { class: 'ex-chart__emoji', 'aria-hidden': 'true', html: emojiHTML(c.emoji) }) : null, h('span', { html: md(c.label) })),
        h('button', { type: 'button', class: 'c-btn c-btn--icon ex-chart__btn', 'aria-label': `coboară bara ${plain(c.label)}`, 'data-testid': `bar-${c.id}-minus`, onClick: () => bump(c.id, -1) }, '−'),
        value,
        h('button', { type: 'button', class: 'c-btn c-btn--icon ex-chart__btn', 'aria-label': `ridică bara ${plain(c.label)}`, 'data-testid': `bar-${c.id}-plus`, onClick: () => bump(c.id, 1) }, '+'),
      );
      rows[c.id] = { row, value };
      return row;
    }));
    const notes = h('div', { class: 'l-stack l-stack--sm' });
    el.append(stage, controls, notes);

    function paint() {
      const vals = part.categories.map((c) => (c.id in (part.given ?? {}) ? part.given[c.id] : (answer[c.id] ?? 0)));
      const hide = free.filter((id) => answer[id] === undefined);
      art.innerHTML = visualSVG({ v: 'bar-chart', ids: part.categories.map((c) => c.id), labels: part.categories.map((c) => plain(c.label)), emojis: part.categories.map((c) => c.emoji ?? ''), values: vals, step: part.step, max: part.max, hide });
      for (const [id, r] of Object.entries(rows)) {
        const v = answer[id] ?? 0;
        r.value.textContent = String(v);
        r.value.setAttribute('aria-valuenow', String(v));
      }
    }

    function bump(id, dir) {
      if (isLocked(mode)) return;
      const was = answer[id] ?? 0;
      const v = Math.max(0, Math.min(part.max, was + dir * part.step));
      answer = { ...answer, [id]: v };
      paint();
      if (v !== was) {
        play('tap');
        const bar = art.querySelector(`.v-bar-chart__bar[data-id="${id}"]`);
        if (bar) pop(bar);
      }
      ctx.onChange(answer);
    }
    paint();

    return {
      get: () => answer,
      set(a) {
        answer = Object.fromEntries(Object.entries(a ?? {}).filter(([id, v]) => free.includes(id) && Number.isInteger(v)));
        paint();
      },
      mode(m) {
        mode = m;
        for (const b of controls.querySelectorAll('button')) b.disabled = isLocked(m);
      },
      showResult(res) {
        if (part.key) {
          for (const r of res.items) {
            const row = rows[r.id];
            if (!row) continue;
            row.row.querySelector('.ex-expected')?.remove();
            setState(row.row, r.ok ? 'correct' : 'wrong');
            if (!r.ok) row.row.append(expectedTag(String(r.expected)));
          }
          return;
        }
        const r = res.items[0];
        setState(stage, r.ok ? 'correct' : 'wrong');
        notes.replaceChildren(...(r.feedback ? [feedbackBox(r.feedback)] : []));
      },
      destroy() {},
    };
  },
};
