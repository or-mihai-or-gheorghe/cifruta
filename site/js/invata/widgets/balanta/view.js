// Învață: balanța (vederea). Un stâlp, o bară care se rotește (cel mult ±12°) și două talere care atârnă de capetele ei și urcă sau
// coboară cu ea; pe talerul cu căsuța, sacul (cu „?” sau, la „ghicesc”, cu numărul pus în el) și nucile știute; pe celălalt, grămezile
// de nuci. Mișcarea e doar transform, iar desenul are aria-hidden: glisorul e controlul echivalent, iar ecuația și citirea se anunță ca
// text. Ambele glisoare se fac o dată; în pagină stă doar cel al modului de acum (modul vine din `start`-ul provocării).

import { h } from '../../../core/dom.js';
import { legendNodes } from '../../legend.js';
import { slider } from '../../slider.js';
import { keepMath } from '../../text.js';
import { MAX, parseEq } from './logic.js';

const nutsOf = (n) => Array.from({ length: Math.max(0, n) }, () => h('span', { class: 'iv-nut' }));
/** O grămadă de nuci, cu `cols` pe rând (lângă sac 4, singură 5, două grămezi câte 3), ca talerul să nu se lățească peste lățimea lui. */
const pile = (n, cols) => h('span', { class: 'iv-scale__pile', style: { '--cols': String(Math.max(1, Math.min(cols, n))) } }, nutsOf(n));

export function mount(host, params, { logic, dispatch }) {
  let state = logic.initial(params);
  const send = (id, commit) => (v) => dispatch({ set: id, value: v }, { commit });
  const guess = slider({ id: 'guess', label: 'Câte nuci pui în sac', valueText: (v) => (v === 1 ? 'o nucă' : `${v} nuci`), min: 0, max: MAX, count: MAX + 1, origin: 0, value: 0, tone: 'cols', onInput: send('guess', false), onCommit: send('guess', true) });
  const taken = slider({ id: 'taken', label: 'Câte nuci iei din fiecare taler', valueText: (v) => (v === 1 ? 'o nucă' : `${v} nuci`), min: 0, max: 1, count: 2, origin: 0, value: 0, tone: 'cols', onInput: send('taken', false), onCommit: send('taken', true) });
  const guessControl = h('div', { class: 'iv-control' }, h('span', { class: 'iv-control__label iv-f--cols' }, 'Câte nuci crezi că are sacul?'), guess.el);
  const takenControl = h('div', { class: 'iv-control' }, h('span', { class: 'iv-control__label iv-f--cols' }, 'Câte nuci iei din fiecare taler?'), taken.el);

  const sack = h('span', { class: 'iv-sack' });
  const loads = { l: h('div', { class: 'iv-scale__load' }), r: h('div', { class: 'iv-scale__load' }) };
  const pan = (side) => h('div', { class: `iv-scale__pan iv-scale__pan--${side}`, 'data-testid': `iv-pan-${side}` }, loads[side], h('span', { class: 'iv-scale__dish' }));
  const art = h(
    'div',
    { class: 'iv-art iv-scale', 'aria-hidden': 'true', 'data-testid': 'iv-scale' },
    h('span', { class: 'iv-scale__post' }),
    h('span', { class: 'iv-scale__arm' }),
    pan('l'),
    pan('r'),
  );
  const eq = h('p', { class: 'iv-eq', 'data-testid': 'iv-eq' });
  const legend = h('p', { class: 'iv-legend', 'data-testid': 'iv-legend' });
  const reading = h('p', { class: 'iv-reading' });
  const extra = h('p', { class: 'iv-extra', 'data-testid': 'iv-extra' });
  // doar glisorul modului de acum stă în pagină (măsurătorile și tastatura nu dau peste unul ascuns)
  const controls = h('div', { class: 'iv-balanta__controls' });
  const root = h(
    'div',
    { class: 'iv-widget iv-balanta', 'data-testid': 'iv-balanta' },
    h('div', { class: 'iv-head' }, eq, legend),
    h('div', { class: 'iv-main' }, art, controls),
    h('div', { class: 'iv-foot' }, h('div', { class: 'iv-text' }, reading, extra)),
  );
  host.append(root);

  function render(next) {
    state = next;
    const e = parseEq(state.eq);
    const take = state.mode === 'take';
    if (controls.firstChild !== (take ? takenControl : guessControl)) controls.replaceChildren(take ? takenControl : guessControl);
    guess.set(state.guess);
    taken.setScale(0, e.withBag + 1);
    taken.setRange(0, e.withBag);
    taken.set(state.taken);

    // sacul: „?” (sau numărul pus în el, la „ghicesc”); lângă el, nucile știute rămase
    sack.textContent = take ? '?' : String(state.guess);
    sack.classList.toggle('is-guess', !take);
    const near = e.withBag - (take ? state.taken : 0);
    // în celălalt taler: grămezile, din care se iau întâi nucile din ultima
    let toTake = take ? state.taken : 0;
    const piles = [...e.other].reverse().map((n) => {
      const left = Math.max(0, n - toTake);
      toTake -= n - left;
      return left;
    }).reverse();
    const bagPan = [sack, pile(near, 4)];
    const full = piles.filter((n) => n > 0);
    const otherPan = full.map((n) => pile(n, full.length > 1 ? 3 : 5));
    loads.l.replaceChildren(...(e.bagLeft ? bagPan : otherPan));
    loads.r.replaceChildren(...(e.bagLeft ? otherPan : bagPan));

    // înclinarea: bara se rotește, talerele urcă și coboară cu capetele ei
    const tilt = logic.tilt(params, state);
    art.dataset.tilt = String(tilt);
    art.style.setProperty('--tilt', `${tilt}deg`);
    art.style.setProperty('--sin', Math.sin((tilt * Math.PI) / 180).toFixed(4));

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
