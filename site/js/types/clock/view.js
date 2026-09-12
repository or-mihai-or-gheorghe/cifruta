// clock — mută acele ceasului cu butoane (câte o oră sau câte jumătate de oră).

import { h } from '../../core/dom.js';
import { play } from '../../core/sound.js';
import { md } from '../../core/markup.js';
import { visualLabel, visualSVG } from '../../visuals/index.js';
import { expectedTag, isLocked, setState } from '../_view.js';
import { timeText } from './logic.js';

export default {
  howto: () => 'Apasă butoanele ca să miști acele ceasului.',

  mount(el, part, ctx) {
    const step = part.step ?? 30;
    let answer = {};
    let mode = 'solve';
    const rows = {};
    const rot = {}; // rotația acumulată a acelor (grade): acul se rotește mereu în direcția butonului, fără salt peste 12

    for (const item of part.items) {
      const face = h('div', { class: 'ex-clock__face' });
      const move = (minutes, text, id) =>
        h('button', { type: 'button', class: 'c-btn c-btn--sm', 'data-testid': `clock-${item.id}-${id}`, onClick: () => turn(item.id, minutes) }, text);
      const row = h(
        'div',
        { class: 'ex-clock is-untouched' },
        item.label ? h('p', { class: 'ex-clock__label', html: md(item.label) }) : null,
        face,
        h('div', { class: 'ex-clock__controls' },
          move(-60, '⟲ o oră', 'h-minus'),
          move(-step, `⟲ ${step} min`, 'm-minus'),
          move(step, `⟳ ${step} min`, 'm-plus'),
          move(60, '⟳ o oră', 'h-plus')),
        h('div', { class: 'ex-clock__result' }),
      );
      rows[item.id] = { row, face };
    }
    el.append(h('div', { class: 'ex-clock-list' }, Object.values(rows).map((r) => r.row)));

    function turn(id, minutes) {
      if (isLocked(mode)) return;
      const t = answer[id] ?? { h: 12, m: 0 };
      const total = (((t.h % 12) * 60 + t.m + minutes) % 720 + 720) % 720;
      answer = { ...answer, [id]: { h: Math.floor(total / 60) === 0 ? 12 : Math.floor(total / 60), m: total % 60 } };
      const hour = rows[id].face.querySelector('.v-clock__hand--h');
      const minute = rows[id].face.querySelector('.v-clock__hand--m');
      if (rot[id] && hour && minute) {
        // doar acele se rotesc (tranziție CSS); desenul rămâne același
        rot[id].h += minutes * 0.5;
        rot[id].m += minutes * 6;
        hour.style.transform = `rotate(${rot[id].h}deg)`;
        minute.style.transform = `rotate(${rot[id].m}deg)`;
        rows[id].row.classList.remove('is-untouched');
        rows[id].face.querySelector('svg')?.setAttribute('aria-label', visualLabel({ v: 'clock', ...answer[id] }));
      } else {
        paint(id);
      }
      play('tap');
      ctx.onChange(answer);
    }

    function paint(id) {
      const t = answer[id] ?? { h: 12, m: 0 };
      rows[id].row.classList.toggle('is-untouched', !answer[id]);
      rot[id] = { h: (t.h % 12) * 30 + t.m * 0.5, m: t.m * 6 };
      rows[id].face.innerHTML = visualSVG({ v: 'clock', h: t.h, m: t.m });
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
          rows[x.id].row.querySelector('.ex-clock__result').replaceChildren(
            x.ok ? '' : h('span', { class: 'u-small' }, x.given ? `Ai arătat ${timeText(x.given)}. ` : 'Nu ai mutat acele. ', expectedTag(timeText(x.expected))),
          );
        }
      },
      destroy() {},
    };
  },
};
