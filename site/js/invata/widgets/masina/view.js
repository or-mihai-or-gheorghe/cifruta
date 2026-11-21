// Învață: mașina de numere (vederea). Un rând: numărul care intră, cartonașele operațiilor („× 4”, „+ 20”, „− 8”), numerele dintre ele
// și ce iese, iar alături ce trebuie să iasă. „Pe dos” arată sub el drumul înapoi, cu cartonașele întoarse (operațiile inverse). Desenul
// are aria-hidden: glisorul și butonul sunt controalele, iar calculul și citirea se anunță ca text.

import { h } from '../../../core/dom.js';
import { legendNodes } from '../../legend.js';
import { slider } from '../../slider.js';
import { keepMath } from '../../text.js';
import { SPAN, backwards, steps } from './logic.js';

const INVERSE = { '+': '−', '−': '+', '×': ':', ':': '×' };
const arrow = () => h('span', { class: 'iv-machine__arrow' }, '→');
const value = (v, cls = '') => h('span', { class: `iv-machine__value${cls}` }, v === null ? '✗' : String(v));
const card = (op, k) => h('span', { class: 'iv-machine__card' }, `${op} ${k}`);

export function mount(host, params, { logic, dispatch }) {
  let state = logic.initial(params);
  const send = (commit) => (v) => dispatch({ set: 'input', value: v }, { commit });
  const input = slider({ id: 'input', label: 'Ce număr intră', min: state.lo, max: state.lo + SPAN, count: SPAN + 1, origin: state.lo, value: state.input, tone: 'cols', onInput: send(false), onCommit: send(true) });
  const backButton = h('button', { type: 'button', class: 'c-btn c-btn--sm iv-toggle', 'aria-pressed': 'false', 'data-testid': 'iv-toggle-back', onClick: () => dispatch({ toggle: 'back' }) }, 'Pe dos');
  const forward = h('div', { class: 'iv-machine__row', 'data-testid': 'iv-machine-forward' });
  const back = h('div', { class: 'iv-machine__row is-back', 'data-testid': 'iv-machine-back' });
  const art = h('div', { class: 'iv-art iv-machine', 'aria-hidden': 'true', 'data-testid': 'iv-machine' }, forward, back);
  const eq = h('p', { class: 'iv-eq', 'data-testid': 'iv-eq' });
  const legend = h('p', { class: 'iv-legend', 'data-testid': 'iv-legend' });
  const reading = h('p', { class: 'iv-reading' });
  const extra = h('p', { class: 'iv-extra', 'data-testid': 'iv-extra' });
  const root = h(
    'div',
    { class: 'iv-widget iv-masina', 'data-testid': 'iv-masina' },
    eq,
    legend,
    art,
    h('div', { class: 'iv-control' }, h('span', { class: 'iv-control__label iv-f--cols' }, 'Ce număr intră?'), input.el),
    h('div', { class: 'iv-tools' }, backButton),
    h('div', { class: 'iv-text' }, reading, extra),
  );
  host.append(root);

  function render(next) {
    state = next;
    input.setScale(state.lo, SPAN + 1);
    input.setRange(state.lo, state.lo + SPAN);
    input.set(state.input);
    backButton.setAttribute('aria-pressed', String(state.back));

    // înainte: intră → cartonașe → iese, cu ce trebuie să iasă alături
    const values = steps(state.ops, state.input);
    const result = values.at(-1);
    forward.replaceChildren(
      value(state.input, ' is-in'),
      ...state.ops.flatMap(([op, k], i) => [arrow(), card(op, k), arrow(), value(values[i + 1], i === state.ops.length - 1 ? ' is-out' : '')]),
      h('span', { class: `iv-machine__target${result === state.out ? ' is-ok' : ''}` }, `trebuie: ${state.out}`),
    );
    art.dataset.fits = String(result === state.out);

    // pe dos: de la ce trebuie să iasă, cartonașele întoarse, de la ultimul la primul
    back.hidden = !state.back;
    if (state.back) {
      const path = backwards(state.ops, state.out);
      back.replaceChildren(
        value(state.out, ' is-out'),
        ...[...state.ops].reverse().flatMap(([op, k], i) => [arrow(), card(INVERSE[op], k), arrow(), value(path[i + 1], i === state.ops.length - 1 ? ' is-in' : '')]),
      );
    }

    const t = logic.texts(params, state);
    eq.textContent = keepMath(t.equation);
    legend.replaceChildren(...legendNodes(t.legend));
    reading.textContent = t.reading;
    extra.textContent = t.extra ?? '';
  }

  render(state);
  return {
    render,
    destroy() {
      root.remove();
    },
  };
}
