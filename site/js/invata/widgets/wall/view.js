// Învață: zidul fracțiilor (vederea). Zece rânduri: întregul, apoi tăiat în 2, 3, … 10 bucăți egale. Glisorul din stânga alege
// rândul (numitorul), cel de sus câte bucăți (numărătorul; gradațiile lui stau sub bucățile rândului ales). Bucățile alese sunt
// colorate și hașurate; o linie arată unde se termină fracția, iar în celelalte rânduri bucățile care se termină exact acolo au
// contur și semnul „=”. Zidul are aria-hidden: glisoarele sunt controlul echivalent, iar fracțiile egale se anunță ca text.

import { h } from '../../../core/dom.js';
import { md } from '../../../core/markup.js';
import { fractionWords } from '../../../core/ro.js';
import { slider } from '../../slider.js';
import { legendNodes } from '../../legend.js';
import { keepMath } from '../../text.js';
import { ROWS } from './logic.js';

export function mount(host, params, { logic, dispatch }) {
  let state = logic.initial(params);
  const send = (id, commit) => (v) => dispatch({ set: id, value: v }, { commit });
  const sliders = {
    den: slider({ id: 'den', label: 'Rândul: în câte bucăți e tăiat întregul', valueText: (v) => (v === 1 ? 'întregul' : `tăiat în ${v} bucăți`), min: 1, max: ROWS, value: state.den, vertical: true, tone: 'rows', onInput: send('den', false), onCommit: send('den', true) }),
    num: slider({ id: 'num', label: 'Câte bucăți iei', valueText: (v) => fractionWords(v, state.den), min: 1, max: state.den, count: state.den, value: state.num, tone: 'cols', onInput: send('num', false), onCommit: send('num', true) }),
  };

  const bricks = [];
  const line = h('span', { class: 'iv-wall__line' });
  const board = h(
    'div',
    { class: 'iv-array__board iv-wall', 'aria-hidden': 'true' },
    Array.from({ length: ROWS }, (_, r) =>
      h(
        'div',
        { class: 'iv-wall__row', style: { '--d': r + 1 } },
        Array.from({ length: r + 1 }, (_, i) => {
          const brick = h('span', { class: 'iv-brick', 'data-row': r, 'data-i': i, html: r ? md(`{{f:1/${r + 1}}}`) : '1' });
          bricks.push({ el: brick, d: r + 1, i });
          return brick;
        }),
      ),
    ),
    line,
  );
  board.addEventListener('click', (e) => {
    const brick = e.target.closest('.iv-brick');
    if (brick) dispatch({ tap: [Number(brick.dataset.row), Number(brick.dataset.i)] });
  });

  const eq = h('p', { class: 'iv-eq iv-frac-eq', 'data-testid': 'iv-eq' });
  const legend = h('p', { class: 'iv-legend', 'data-testid': 'iv-legend' });
  const reading = h('p', { class: 'iv-reading' });
  const sum = h('p', { class: 'iv-sum', 'data-testid': 'iv-sum' });
  const root = h(
    'div',
    { class: 'iv-array iv-array--wall', 'data-testid': 'iv-wall', style: { '--rows-max': ROWS, '--cols-max': ROWS } },
    h('div', { class: 'iv-head' }, eq, legend),
    h(
      'div',
      { class: 'iv-main' },
      h(
        'div',
        { class: 'iv-array__stage' },
        h('div', { class: 'iv-array__top' }, sliders.num.el),
        h('div', { class: 'iv-array__left' }, sliders.den.el),
        board,
      ),
    ),
    h('div', { class: 'iv-foot' }, h('div', { class: 'iv-text' }, reading, sum)),
  );
  host.append(root);

  function render(next, { hidden = [] } = {}) {
    state = next;
    sliders.den.set(state.den);
    sliders.num.setCount(state.den);
    sliders.num.setRange(1, state.den);
    sliders.num.set(state.num);
    root.style.setProperty('--frac', state.num / state.den);
    for (const b of bricks) {
      const chosen = b.d === state.den && b.i < state.num;
      // în alt rând, aceeași lungime: (i + 1) / d = num / den
      const ends = b.d !== state.den && (b.i + 1) * state.den === state.num * b.d;
      const within = b.d !== state.den && (b.i + 1) * state.den <= state.num * b.d;
      b.el.classList.toggle('is-on', chosen);
      b.el.classList.toggle('is-eq', within && logic.same(state).some(([, d]) => d === b.d));
      b.el.classList.toggle('is-end', ends);
    }
    const t = logic.texts(params, state, hidden);
    eq.innerHTML = md(keepMath(t.equation));
    legend.replaceChildren(...legendNodes(t.legend));
    reading.textContent = t.reading;
    sum.textContent = t.sum;
  }

  render(state);
  return {
    render,
    destroy() {
      root.remove();
    },
  };
}
