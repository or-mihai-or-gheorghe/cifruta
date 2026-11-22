// Învață: partea care lipsește (vederea). Două bare la aceeași scară: sus întregul, jos cele două părți; bucata necunoscută are „?” și
// hașuri, iar o linie punctată arată unde se termină întregul. Glisorul lungește bucata necunoscută (intervalul vine de la provocare,
// prin `setScale`). Lungimile se schimbă fără animație (doar transform și opacity se animă); desenul are aria-hidden, iar citirea spune
// ce bară e mai lungă. La forma cu un factor („3 × x + 2 = 20”, capitolul „Ecuații cu x”), barele se desenează din bucăți (`pieces`):
// bucățile x, la fel de lungi (glisorul le lungește deodată), și numerele știute; la „− b”, cei luați au marginea punctată.

import { h } from '../../../core/dom.js';
import { legendNodes, mathNodes } from '../../legend.js';
import { slider } from '../../slider.js';
import { SPAN, bars, parseAx, parseBar, pieces, scaleOf } from './logic.js';

/** Câte unități încap pe lățimea desenului: întregul are cel mult 20, iar o încercare poate trece puțin de el. */
const SCALE = 22;

export function mount(host, params, { logic, dispatch }) {
  let state = logic.initial(params);
  const send = (commit) => (v) => dispatch({ set: 'guess', value: v }, { commit });
  // la forma cu un factor, glisorul lungește deodată toate bucățile x
  const ask = parseAx(params.eq) ? 'Cât de lungă e o bucată x' : 'Cât de lungă e bucata necunoscută';
  const guess = slider({ id: 'guess', label: ask, min: state.lo, max: state.lo + SPAN, count: SPAN + 1, origin: state.lo, value: state.guess, tone: 'cols', onInput: send(false), onCommit: send(true) });
  const piece = (cls) => h('span', { class: `iv-bar ${cls}` });
  const top = piece('iv-bar--whole');
  const bottom = [piece('iv-bar--part'), piece('iv-bar--part')];
  const guide = h('span', { class: 'iv-bars__guide' });
  const rows = [h('div', { class: 'iv-bars__row' }, top), h('div', { class: 'iv-bars__row' }, ...bottom)];
  const art = h('div', { class: 'iv-art iv-bars', 'aria-hidden': 'true', 'data-testid': 'iv-bars', style: { '--scale': SCALE } }, ...rows, guide);
  const eq = h('p', { class: 'iv-eq', 'data-testid': 'iv-eq' });
  const legend = h('p', { class: 'iv-legend', 'data-testid': 'iv-legend' });
  const reading = h('p', { class: 'iv-reading' });
  const extra = h('p', { class: 'iv-extra', 'data-testid': 'iv-extra' });
  const root = h(
    'div',
    { class: 'iv-widget iv-bare', 'data-testid': 'iv-bare' },
    h('div', { class: 'iv-head' }, eq, legend),
    h('div', { class: 'iv-main' }, art, h('div', { class: 'iv-control' }, h('span', { class: 'iv-control__label iv-f--cols' }, `${ask}?`), guess.el)),
    h('div', { class: 'iv-foot' }, h('div', { class: 'iv-text' }, reading, extra)),
  );
  host.append(root);

  /** O bucată de bară: lungimea, numărul scris pe ea și dacă e cea necunoscută. */
  function paint(el, n, unknown, fits) {
    el.style.setProperty('--n', String(n));
    el.classList.toggle('is-unknown', unknown);
    el.classList.toggle('is-fit', unknown && fits);
    el.textContent = unknown && !fits ? '?' : String(n);
  }

  /** O bucată a formei cu un factor: x (hașurată până se potrivește, apoi cu numărul), un număr știut sau cei luați (punctați). */
  function pieceEl({ n, kind }, fits, letter) {
    const cls = kind === 'x' ? ` iv-bar--x is-unknown${fits ? ' is-fit' : ''}` : kind === 'taken' ? ' iv-bar--taken' : '';
    const label = kind === 'x' && !fits ? (letter === 'x' ? h('var', { class: 'iv-x' }, 'x') : '?') : String(n);
    return h('span', { class: `iv-bar${cls}`, style: { '--n': String(n) } }, label);
  }

  function render(next) {
    state = next;
    guess.setScale(state.lo, SPAN + 1);
    guess.setRange(state.lo, state.lo + SPAN);
    guess.set(state.guess);
    const ax = parseAx(state.eq);
    if (ax) {
      // forma cu un factor: bucățile, la o scară care nu sare cât tragi (bara cea mai lungă de pe tot glisorul)
      const fits = state.guess === ax.value;
      const shape = pieces(state.eq, state.guess);
      art.style.setProperty('--scale', String(scaleOf(state.eq, state.lo)));
      rows[0].replaceChildren(...shape.top.map((pc) => pieceEl(pc, fits, ax.letter)));
      rows[1].replaceChildren(...shape.bottom.map((pc) => pieceEl(pc, fits, ax.letter)));
      // linia punctată: unde se termină bara știută (întregul, sau restul cu cei luați)
      guide.style.setProperty('--n', String(ax.op === '+' ? ax.c : ax.c + ax.b));
      art.dataset.fits = String(fits);
      return paintTexts();
    }
    art.style.setProperty('--scale', String(SCALE));
    if (rows[0].firstChild !== top) rows[0].replaceChildren(top);
    if (rows[1].firstChild !== bottom[0]) rows[1].replaceChildren(...bottom);
    const b = parseBar(state.eq);
    const shape = bars(state.eq, state.guess);
    const fits = state.guess === b.value;
    paint(top, shape.top, shape.unknownTop, fits);
    bottom.forEach((el, i) => paint(el, shape.bottom[i], shape.unknownAt === i, fits));
    // linia punctată: unde se termină întregul (sau, când întregul lipsește, unde se termină bara de jos)
    guide.style.setProperty('--n', String(shape.unknownTop ? shape.bottom[0] + shape.bottom[1] : shape.top));
    art.dataset.fits = String(fits);
    paintTexts();
  }

  function paintTexts() {
    const t = logic.texts(params, state);
    eq.replaceChildren(...mathNodes(t.equation));
    legend.replaceChildren(...legendNodes(t.legend));
    reading.textContent = t.reading;
    extra.replaceChildren(...mathNodes(t.extra ?? ''));
  }

  render(state);
  return {
    render,
    destroy() {
      root.remove();
    },
  };
}
