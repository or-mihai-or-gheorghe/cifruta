// slider — axa numerelor (tragi direct pe axă) sau termometru (tragi cursorul, lichidul urcă).
// Folosește un <input type="range"> nativ: merge cu degetul, mouse-ul și săgețile de la tastatură.

import { h } from '../../core/dom.js';
import { md, plain } from '../../core/markup.js';
import { visualSVG } from '../../visuals/index.js';
import { isLocked, setState } from '../_view.js';

export default {
  howto: (part) => (part.skin === 'thermometer' ? 'Trage cursorul până când lichidul ajunge unde trebuie.' : 'Trage pe axă până la locul potrivit.'),

  mount(el, part, ctx) {
    const { min, max, step = 1 } = part;
    const thermo = part.skin === 'thermometer';
    let answer = {};
    let mode = 'solve';
    const rows = {};

    const art = (value) =>
      thermo
        ? visualSVG({ v: 'thermometer', min, max, minor: part.ticks?.minor ?? step, major: part.ticks?.major ?? 10, ...(value === null || value === undefined ? {} : { value }) })
        : visualSVG({ v: 'number-line', min, max, minor: part.ticks?.minor ?? 10, labels: (part.ticks?.labels ?? [min, max]).join(','), ...(value === null || value === undefined ? {} : { marker: value, icon: part.icon ?? 'racheta' }) });

    for (const item of part.items) {
      const pic = h('div', { class: 'ex-slider__art', html: art(null) });
      const input = h('input', {
        type: 'range',
        class: `ex-slider__range${thermo ? '' : ' ex-slider__range--overlay'}`,
        min: String(min),
        max: String(max),
        step: String(step),
        value: String(min),
        'aria-label': plain(item.label),
        'data-testid': `slider-${item.id}`,
      });
      const row = h(
        'div',
        { class: `ex-slider${thermo ? ' ex-slider--thermo' : ''} is-untouched` },
        h('p', { class: 'ex-slider__label', html: md(item.label) }),
        h('div', { class: 'ex-slider__stage' }, pic, input),
        h('div', { class: 'ex-slider__result' }),
      );
      input.addEventListener('input', () => {
        if (isLocked(mode)) return;
        answer = { ...answer, [item.id]: Number(input.value) };
        paintItem(item.id);
        ctx.onChange(answer);
      });
      rows[item.id] = { row, pic, input };
    }
    el.append(h('div', { class: 'l-stack' }, Object.values(rows).map((r) => r.row)));

    function paintItem(id) {
      const r = rows[id];
      const v = answer[id];
      r.row.classList.toggle('is-untouched', v === undefined || v === null);
      if (v !== undefined && v !== null) r.input.value = String(v);
      r.pic.innerHTML = art(v);
    }

    return {
      get: () => answer,
      set(a) {
        answer = { ...(a ?? {}) };
        for (const id of Object.keys(rows)) paintItem(id);
      },
      mode(m) {
        mode = m;
        for (const r of Object.values(rows)) r.input.disabled = isLocked(m);
      },
      showResult(res) {
        for (const x of res.items) {
          const r = rows[x.id];
          setState(r.row, x.ok ? 'correct' : 'wrong');
          const unit = part.unit ? ` ${part.unit}` : '';
          r.row.querySelector('.ex-slider__result').replaceChildren(
            x.ok
              ? h('span', { class: 'u-small' }, `Ai arătat ${x.given}${unit}.`)
              : h('span', { class: 'u-small' }, x.given === null ? 'Nu ai mutat cursorul. ' : `Ai arătat ${x.given}${unit}. `, h('span', { class: 'ex-expected' }, `${x.expected}${unit}`)),
          );
        }
      },
      destroy() {},
    };
  },
};
