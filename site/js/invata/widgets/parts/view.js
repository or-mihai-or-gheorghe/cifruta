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
import { SHAPES } from './logic.js';

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

  const cutting = params.cut
    ? {
        cut: h('button', { type: 'button', class: 'c-btn c-btn--sm', 'data-testid': 'iv-cut', onClick: () => dispatch({ do: 'cut' }) }, 'Taie fiecare bucată în două'),
        glue: h('button', { type: 'button', class: 'c-btn c-btn--sm', 'data-testid': 'iv-glue', onClick: () => dispatch({ do: 'glue' }) }, 'Lipește la loc'),
      }
    : null;

  const eq = h('div', { class: 'iv-eq iv-frac-eq', 'data-testid': 'iv-eq' });
  const reading = h('p', { class: 'iv-reading' });
  const sum = h('p', { class: 'iv-sum', 'data-testid': 'iv-sum' });
  const root = h(
    'div',
    { class: 'iv-parts', 'data-testid': 'iv-parts' },
    eq,
    art,
    h(
      'div',
      { class: 'iv-parts__controls' },
      sliders.parts ? h('div', { class: 'iv-control' }, h('span', { class: 'iv-control__label iv-f--rows' }, 'În câte părți egale tai?'), sliders.parts.el) : null,
      h('div', { class: 'iv-control' }, h('span', { class: 'iv-control__label iv-f--cols' }, 'Câte bucăți colorezi?'), sliders.count.el),
    ),
    picker || cutting ? h('div', { class: 'iv-tools' }, picker, cutting?.cut, cutting?.glue) : null,
    h('div', { class: 'iv-text' }, reading, sum),
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
    state = next;
    art.innerHTML = visualSVG({ v: 'fraction', shape: state.shape, parts: state.parts, on: state.on });
    sliders.parts?.set(state.parts);
    sliders.count.setRange(0, state.parts);
    sliders.count.set(state.on.length);
    picker?.querySelectorAll('[role=radio]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.shape === state.shape)));
    if (cutting) {
      cutting.cut.disabled = state.parts >= 8;
      cutting.glue.disabled = state.parts <= 1;
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
