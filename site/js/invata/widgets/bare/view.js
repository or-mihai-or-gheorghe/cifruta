// Învață: partea care lipsește (vederea). Două bare la aceeași scară: sus întregul, jos cele două părți; bucata necunoscută are „?” și
// hașuri, iar o linie punctată arată unde se termină întregul. Glisorul lungește bucata necunoscută (intervalul vine de la provocare,
// prin `setScale`). Lungimile se schimbă fără animație (doar transform și opacity se animă); desenul are aria-hidden, iar citirea spune
// ce bară e mai lungă.

import { h } from '../../../core/dom.js';
import { legendNodes } from '../../legend.js';
import { slider } from '../../slider.js';
import { keepMath } from '../../text.js';
import { SPAN, bars, parseBar } from './logic.js';

/** Câte unități încap pe lățimea desenului: întregul are cel mult 20, iar o încercare poate trece puțin de el. */
const SCALE = 22;

export function mount(host, params, { logic, dispatch }) {
  let state = logic.initial(params);
  const send = (commit) => (v) => dispatch({ set: 'guess', value: v }, { commit });
  const guess = slider({ id: 'guess', label: 'Cât de lungă e bucata necunoscută', min: state.lo, max: state.lo + SPAN, count: SPAN + 1, origin: state.lo, value: state.guess, tone: 'cols', onInput: send(false), onCommit: send(true) });
  const piece = (cls) => h('span', { class: `iv-bar ${cls}` });
  const top = piece('iv-bar--whole');
  const bottom = [piece('iv-bar--part'), piece('iv-bar--part')];
  const guide = h('span', { class: 'iv-bars__guide' });
  const art = h(
    'div',
    { class: 'iv-art iv-bars', 'aria-hidden': 'true', 'data-testid': 'iv-bars', style: { '--scale': SCALE } },
    h('div', { class: 'iv-bars__row' }, top),
    h('div', { class: 'iv-bars__row' }, ...bottom),
    guide,
  );
  const eq = h('p', { class: 'iv-eq', 'data-testid': 'iv-eq' });
  const legend = h('p', { class: 'iv-legend', 'data-testid': 'iv-legend' });
  const reading = h('p', { class: 'iv-reading' });
  const extra = h('p', { class: 'iv-extra', 'data-testid': 'iv-extra' });
  const root = h(
    'div',
    { class: 'iv-widget iv-bare', 'data-testid': 'iv-bare' },
    eq,
    legend,
    art,
    h('div', { class: 'iv-control' }, h('span', { class: 'iv-control__label iv-f--cols' }, 'Cât de lungă e bucata necunoscută?'), guess.el),
    h('div', { class: 'iv-text' }, reading, extra),
  );
  host.append(root);

  /** O bucată de bară: lungimea, numărul scris pe ea și dacă e cea necunoscută. */
  function paint(el, n, unknown, fits) {
    el.style.setProperty('--n', String(n));
    el.classList.toggle('is-unknown', unknown);
    el.classList.toggle('is-fit', unknown && fits);
    el.textContent = unknown && !fits ? '?' : String(n);
  }

  function render(next) {
    state = next;
    guess.setScale(state.lo, SPAN + 1);
    guess.setRange(state.lo, state.lo + SPAN);
    guess.set(state.guess);
    const b = parseBar(state.eq);
    const shape = bars(state.eq, state.guess);
    const fits = state.guess === b.value;
    paint(top, shape.top, shape.unknownTop, fits);
    bottom.forEach((el, i) => paint(el, shape.bottom[i], shape.unknownAt === i, fits));
    // linia punctată: unde se termină întregul (sau, când întregul lipsește, unde se termină bara de jos)
    guide.style.setProperty('--n', String(shape.unknownTop ? shape.bottom[0] + shape.bottom[1] : shape.top));
    art.dataset.fits = String(fits);
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
