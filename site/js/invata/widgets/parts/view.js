// Învață: întregul tăiat în părți egale (vederea). Desenul vine din bancă (`fraction`, aria-hidden); o atingere pe o bucată o
// colorează sau o șterge. Pentru tastatură și cititoarele de ecran, glisorul „Câte bucăți colorăm?” face același lucru (colorează
// primele bucăți). Fracția se scrie mare, cu numele ei; cu `labels`, numărătorul și numitorul își au eticheta alături.

import { h } from '../../../core/dom.js';
import { md } from '../../../core/markup.js';
import { cantitate } from '../../../core/ro.js';
import { arrowRadios } from '../../../types/_view.js';
import { visualSVG } from '../../../visuals/index.js';
import { slider } from '../../slider.js';
import { keepMath } from '../../text.js';
import { LEVELS, SHAPES, narrate } from './logic.js';

export function mount(host, params, { logic, dispatch }) {
  let state = logic.initial(params);
  const shapes = params.shapes ?? [params.shape];
  const send = (id, commit) => (v) => dispatch({ set: id, value: v }, { commit });
  const [lo, hi] = params.cut ? [1, 8] : [params.min ?? 1, params.max ?? 10];

  const picker =
    shapes.length > 1
      ? arrowRadios(
          h(
            'div',
            { class: 'iv-shapes', role: 'radiogroup', 'aria-label': 'Ce tăiem' },
            shapes.map((shape) =>
              h(
                'button',
                { type: 'button', role: 'radio', class: 'iv-shape', 'data-shape': shape, 'data-testid': `iv-shape-${shape}`, onClick: () => dispatch({ set: 'shape', value: shape }) },
                h('span', { class: 'iv-shape__art', 'aria-hidden': 'true', html: visualSVG({ v: 'fraction', shape, parts: 1 }) }),
                SHAPES[shape],
              ),
            ),
          ),
        )
      : null;

  // napolitana tăiată pe scară se taie în pătrate (jumătăți, apoi 4 pătrate, apoi 8), cum o taie copiii la școală
  const drawing = (shape, parts, on = []) => visualSVG({ v: 'fraction', shape, parts, on, cut: params.cut && shape === 'square' ? 'halves' : undefined });
  const art = h('div', { class: 'iv-parts__art', 'data-testid': 'iv-parts-art', 'aria-hidden': 'true' });
  art.addEventListener('click', (e) => {
    const piece = e.target.closest('[data-piece]');
    if (piece) dispatch({ toggle: Number(piece.dataset.piece) });
  });

  const sliders = {};
  if (!params.cut) {
    sliders.parts = slider({ id: 'parts', label: 'În câte părți egale tai', valueText: (v) => cantitate(v, 'parte egală', 'părți egale'), min: lo, max: hi, count: hi, value: state.parts, steppers: ['O parte mai puțin', 'O parte mai mult'], tone: 'rows', onInput: send('parts', false), onCommit: send('parts', true) });
  }
  sliders.count = slider({ id: 'count', label: 'Câte bucăți colorezi', valueText: (v) => cantitate(v, 'bucată colorată', 'bucăți colorate'), min: 0, max: state.parts, count: hi + 1, origin: 0, value: 0, steppers: ['O bucată mai puțin', 'O bucată mai mult'], tone: 'cols', onInput: send('count', false), onCommit: send('count', true) });

  // scara de tăiere: fiecare treaptă e desenată, deci copilul vede dinainte ce alege; între trepte, „fiecare bucată, în două”
  const ladder = params.cut
    ? arrowRadios(
        h(
          'div',
          { class: 'iv-ladder', role: 'radiogroup', 'aria-label': 'În câte bucăți tai' },
          LEVELS.flatMap(([n, name], i) => [
            i ? h('span', { class: 'iv-ladder__step', 'aria-hidden': 'true' }, '✂') : null,
            h(
              'button',
              { type: 'button', role: 'radio', class: 'iv-ladder__opt', 'data-level': n, 'data-testid': `iv-level-${n}`, 'aria-label': n === 1 ? 'întreg, netăiat' : `${n} ${name}`, onClick: () => dispatch({ set: 'level', value: n }) },
              h('span', { class: 'iv-ladder__art', 'aria-hidden': 'true' }),
              h('span', { class: 'iv-ladder__name' }, name),
            ),
          ]),
        ),
      )
    : null;
  const story = h('p', { class: 'iv-story', 'data-testid': 'iv-story', 'aria-live': 'polite' });

  const eq = h('div', { class: 'iv-eq iv-frac-eq', 'data-testid': 'iv-eq' });
  const reading = h('p', { class: 'iv-reading' });
  const sum = h('p', { class: 'iv-sum', 'data-testid': 'iv-sum' });
  const root = h(
    'div',
    { class: 'iv-parts', 'data-testid': 'iv-parts' },
    h('div', { class: 'iv-head' }, eq),
    h(
      'div',
      { class: 'iv-main' },
      art,
      // întâi tai (scara, chiar sub desen), apoi colorezi
      ladder ? h('div', { class: 'iv-ladder-box' }, h('span', { class: 'iv-control__label' }, 'Taie în:'), ladder, story) : null,
      h(
        'div',
        { class: 'iv-parts__controls' },
        sliders.parts ? h('div', { class: 'iv-control' }, h('span', { class: 'iv-control__label iv-f--rows' }, 'În câte părți egale tai?'), sliders.parts.el) : null,
        h('div', { class: 'iv-control' }, h('span', { class: 'iv-control__label iv-f--cols' }, 'Câte bucăți colorezi?'), sliders.count.el),
      ),
    ),
    h('div', { class: 'iv-foot' }, picker ? h('div', { class: 'iv-tools' }, picker) : null, h('div', { class: 'iv-text' }, reading, sum)),
  );
  host.append(root);

  /** Fracția mare; cu `labels`, numărătorul și numitorul au eticheta lor (culorile glisoarelor, plus cuvintele). */
  function paintFraction(t) {
    const [n, d] = [state.on.length, state.parts];
    if (!params.labels) {
      eq.innerHTML = md(keepMath(t.equation));
      return;
    }
    eq.replaceChildren(
      h(
        'div',
        { class: 'iv-frac-big', role: 'img', 'aria-label': t.reading },
        h('span', { class: 'iv-frac-big__n iv-f--cols' }, String(n)),
        h('span', { class: 'iv-frac-big__label iv-f--cols' }, 'numărătorul: câte bucăți colorezi'),
        h('span', { class: 'iv-frac-big__line' }),
        h('span', { class: 'iv-frac-big__d iv-f--rows' }, String(d)),
        h('span', { class: 'iv-frac-big__label iv-f--rows' }, 'numitorul: în câte părți egale tai'),
      ),
    );
  }

  function render(next) {
    const told = narrate(state, next);
    const reshaped = next.shape !== state.shape || !ladder?.querySelector('.iv-ladder__art svg');
    state = next;
    art.innerHTML = drawing(state.shape, state.parts, state.on);
    art.dataset.shape = state.shape; // bara (ciocolata) e lată și joasă: pe scena lată primește mai multă lățime
    sliders.parts?.set(state.parts);
    sliders.count.setRange(0, state.parts);
    sliders.count.set(state.on.length);
    picker?.querySelectorAll('[role=radio]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.shape === state.shape)));
    if (ladder) {
      ladder.querySelectorAll('[role=radio]').forEach((b) => {
        b.setAttribute('aria-checked', String(Number(b.dataset.level) === state.parts));
        if (reshaped) b.querySelector('.iv-ladder__art').innerHTML = drawing(state.shape, Number(b.dataset.level));
      });
      // povestea rămâne până la următoarea tăiere; o colorare nouă o șterge (ar putea spune altceva decât desenul)
      if (told) story.innerHTML = md(keepMath(told));
      else if (story.textContent) story.textContent = '';
    }
    const t = logic.texts(params, state);
    paintFraction(t);
    reading.textContent = t.reading;
    sum.textContent = t.sum ?? '';
    sum.hidden = !t.sum;
  }

  render(state);
  return {
    render,
    destroy() {
      root.remove();
    },
  };
}
