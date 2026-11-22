// Învață: balanța (vederea). Un stâlp, o bară care se rotește (cel mult ±12°) și două talere care atârnă de capetele ei și urcă sau
// coboară cu ea; pe talerul cu necunoscuta, sacii (cu „?” sau x ori, la „ghicesc”, cu numărul pus în fiecare) și nucile știute; pe
// celălalt, grămezile de nuci. Cu mai mulți saci (3 × x + 4 = 19), sacii stau pe un rând, mai mici, cu nucile știute dedesubt, iar la
// împărțit nucile din celălalt taler se așază în câte o coloană pentru fiecare sac. Mișcarea e doar transform, iar desenul are
// aria-hidden: glisorul (sau butonul „Împarte”) e controlul echivalent, iar ecuația și citirea se anunță ca text. Controalele se fac o
// dată; în pagină stă doar cel al modului de acum (modul vine din `start`-ul provocării).

import { h } from '../../../core/dom.js';
import { legendNodes, mathNodes } from '../../legend.js';
import { slider } from '../../slider.js';
import { MAX, parseEq } from './logic.js';

const nutsOf = (n) => Array.from({ length: Math.max(0, n) }, () => h('span', { class: 'iv-nut' }));
/** O grămadă de nuci, cu `cols` pe rând (lângă sac 4, singură 5, două grămezi câte 3), ca talerul să nu se lățească peste lățimea lui. */
const pile = (n, cols) => h('span', { class: 'iv-scale__pile', style: { '--cols': String(Math.max(1, Math.min(cols, n))) } }, nutsOf(n));

export function mount(host, params, { logic, dispatch }) {
  let state = logic.initial(params);
  const send = (id, commit) => (v) => dispatch({ set: id, value: v }, { commit });
  // cu mai mulți saci, glisorul pune aceleași nuci în fiecare
  const many = (parseEq(params.eq)?.bags ?? 1) > 1;
  const guess = slider({ id: 'guess', label: many ? 'Câte nuci pui în fiecare sac' : 'Câte nuci pui în sac', valueText: (v) => (v === 1 ? 'o nucă' : `${v} nuci`), min: 0, max: MAX, count: MAX + 1, origin: 0, value: 0, tone: 'cols', onInput: send('guess', false), onCommit: send('guess', true) });
  const taken = slider({ id: 'taken', label: 'Câte nuci iei din fiecare taler', valueText: (v) => (v === 1 ? 'o nucă' : `${v} nuci`), min: 0, max: 1, count: 2, origin: 0, value: 0, tone: 'cols', onInput: send('taken', false), onCommit: send('taken', true) });
  const guessControl = h('div', { class: 'iv-control' }, h('span', { class: 'iv-control__label iv-f--cols' }, many ? 'Câte nuci crezi că are fiecare sac?' : 'Câte nuci crezi că are sacul?'), guess.el);
  const takenControl = h('div', { class: 'iv-control' }, h('span', { class: 'iv-control__label iv-f--cols' }, 'Câte nuci iei din fiecare taler?'), taken.el);

  const share = h('button', { type: 'button', class: 'c-btn iv-toggle', 'aria-pressed': 'false', 'data-testid': 'iv-toggle-shared', onClick: () => dispatch({ toggle: 'shared' }) });
  const shareControl = h('div', { class: 'iv-control' }, share);
  /** Un sac: numărul pus în el (la „ghicesc”), altfel „?” (căsuța) sau litera x. */
  const sackEl = (letter, guess) => h('span', { class: `iv-sack${guess === null ? '' : ' is-guess'}` }, guess === null ? (letter === 'x' ? h('var', { class: 'iv-x' }, 'x') : '?') : String(guess));
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
    const { mode } = state;
    const control = mode === 'take' ? takenControl : mode === 'share' ? shareControl : guessControl;
    if (controls.firstChild !== control) controls.replaceChildren(control);
    guess.set(state.guess);
    taken.setScale(0, e.withBag + 1);
    taken.setRange(0, e.withBag);
    taken.set(state.taken);
    share.textContent = `Împarte nucile la cei ${e.bags} saci`;
    share.setAttribute('aria-pressed', String(Boolean(state.shared)));

    // sacii: „?” sau x (ori numărul pus în fiecare, la „ghicesc”); lângă ei (sau dedesubt, la mai mulți saci), nucile știute rămase
    const sacks = Array.from({ length: e.bags }, () => sackEl(e.letter, mode === 'guess' ? state.guess : null));
    const near = mode === 'share' ? 0 : e.withBag - (mode === 'take' ? state.taken : 0);
    const bagPan = e.bags > 1 ? [h('span', { class: 'iv-scale__sacks' }, sacks), pile(near, 5)] : [...sacks, pile(near, 4)];
    // în celălalt taler: grămezile, din care se iau întâi nucile din ultima; la împărțit, câte o coloană pentru fiecare sac
    let otherPan;
    if (mode === 'share') {
      const rest = e.total - e.withBag;
      otherPan = state.shared ? Array.from({ length: e.bags }, () => pile(e.bag, 1)) : [pile(rest, 5)];
    } else {
      let toTake = mode === 'take' ? state.taken : 0;
      const piles = [...e.other].reverse().map((n) => {
        const left = Math.max(0, n - toTake);
        toTake -= n - left;
        return left;
      }).reverse();
      const full = piles.filter((n) => n > 0);
      otherPan = full.map((n) => pile(n, full.length > 1 ? 3 : 5));
    }
    const [left, right] = e.bagLeft ? [bagPan, otherPan] : [otherPan, bagPan];
    loads.l.replaceChildren(...left);
    loads.r.replaceChildren(...right);
    const stacked = e.bags > 1;
    loads[e.bagLeft ? 'l' : 'r'].classList.toggle('is-stacked', stacked);
    loads[e.bagLeft ? 'r' : 'l'].classList.toggle('is-stacked', false);
    loads[e.bagLeft ? 'r' : 'l'].classList.toggle('is-groups', mode === 'share' && Boolean(state.shared));
    loads[e.bagLeft ? 'l' : 'r'].classList.toggle('is-groups', false);

    // înclinarea: bara se rotește, talerele urcă și coboară cu capetele ei
    const tilt = logic.tilt(params, state);
    art.dataset.tilt = String(tilt);
    art.style.setProperty('--tilt', `${tilt}deg`);
    art.style.setProperty('--sin', Math.sin((tilt * Math.PI) / 180).toFixed(4));

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
