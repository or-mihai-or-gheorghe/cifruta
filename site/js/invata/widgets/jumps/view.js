// Învață: săriturile pe axă (vederea). Desenul vine din bancă (`skip-line`, aria-hidden), glisoarele au butoane − și +, iar
// „Sari!” reia săriturile una câte una, cu un ton care urcă (la mișcare redusă apar toate deodată).

import { h } from '../../../core/dom.js';
import { cantitate } from '../../../core/ro.js';
import { play } from '../../../core/sound.js';
import { visualSVG } from '../../../visuals/index.js';
import { slider } from '../../slider.js';
import { legendNodes } from '../../legend.js';
import { factorsOf } from '../../text.js';

export function mount(host, params, { logic, dispatch }) {
  let state = logic.initial(params);
  let timers = [];
  const send = (id, commit) => (v) => dispatch({ set: id, value: v }, { commit });
  const sliders = {
    step: slider({ id: 'step', label: 'Lungimea săriturii', valueText: (v) => `sărituri de câte ${v}`, min: 1, max: 10, value: state.step, steppers: ['Mai scurtă', 'Mai lungă'], tone: 'cols', onInput: send('step', false), onCommit: send('step', true) }),
    count: slider({ id: 'count', label: 'Câte sărituri', valueText: (v) => cantitate(v, 'săritură', 'sărituri'), min: 1, max: 10, value: state.count, steppers: ['O săritură mai puțin', 'O săritură mai mult'], tone: 'rows', onInput: send('count', false), onCommit: send('count', true) }),
  };
  const art = h('div', { class: 'iv-jumps__art', 'aria-hidden': 'true' });
  const eq = h('p', { class: 'iv-eq', 'data-testid': 'iv-eq' });
  const legend = h('p', { class: 'iv-legend iv-reading', 'data-testid': 'iv-legend' });
  const sum = h('p', { class: 'iv-sum', 'data-testid': 'iv-sum' });
  const root = h(
    'div',
    { class: 'iv-jumps', 'data-testid': 'iv-jumps' },
    h('div', { class: 'iv-head' }, eq, legend),
    h(
      'div',
      { class: 'iv-main' },
      art,
      h(
        'div',
        { class: 'iv-jumps__controls' },
        h('div', { class: 'iv-control' }, h('span', { class: 'iv-control__label iv-f--cols' }, 'Cât de lungă e săritura?'), sliders.step.el),
        h('div', { class: 'iv-control' }, h('span', { class: 'iv-control__label iv-f--rows' }, 'Câte sărituri?'), sliders.count.el),
      ),
    ),
    h(
      'div',
      { class: 'iv-foot' },
      h('div', { class: 'iv-tools' }, h('button', { type: 'button', class: 'c-btn c-btn--sm', 'data-testid': 'iv-jump', onClick: replay }, 'Sari!')),
      h('div', { class: 'iv-text' }, sum),
    ),
  );
  host.append(root);

  /** „Sari!”: săriturile reapar una câte una, fiecare cu tonul ei. */
  function replay() {
    timers.forEach(clearTimeout);
    art.classList.remove('is-playing');
    void art.offsetWidth;
    art.classList.add('is-playing');
    timers = Array.from({ length: state.count }, (_, i) => setTimeout(() => play('tap', { step: Math.min(5, i) }), i * 280));
  }

  function render(next) {
    const fresh = next.step === state.step && next.count === state.count + 1 ? next.count - 1 : -1;
    if (next.step !== state.step || next.count !== state.count) timers.forEach(clearTimeout); // „Sari!” se oprește
    state = next;
    sliders.step.set(state.step);
    sliders.count.set(state.count);
    art.classList.remove('is-playing');
    art.innerHTML = visualSVG({ v: 'skip-line', step: state.step, count: state.count, fresh });
    const t = logic.texts(params, state);
    const [a, b] = factorsOf(state.count, state.step);
    const [ta, tb] = factorsOf('rows', 'cols');
    const tone = (v, which) => h('span', { class: `iv-f iv-f--${which}` }, String(v));
    eq.replaceChildren(tone(a, ta), ' × ', tone(b, tb), ` = ${t.equation.split('=').pop().trim()}`);
    legend.replaceChildren(...legendNodes(t.legend));
    sum.textContent = t.sum ?? '';
    sum.hidden = !t.sum;
  }

  render(state);
  return {
    render,
    destroy() {
      timers.forEach(clearTimeout);
      root.remove();
    },
  };
}
