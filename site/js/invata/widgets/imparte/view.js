// Învață: împărțirea (vederea). Coșul cu ce a rămas, apoi farfuriile (sau pungile) într-o grilă care trece pe rândul următor, fiecare
// cu obiectele ei într-un careu mic. La fiecare schimbare, obiectele apar în ordinea împărțirii: câte una pe fiecare farfurie, pe rând
// (la pungi, pungă după pungă; la bețișoare, întâi pachetele, apoi bețișoarele), cu o întârziere care crește. Desenul are aria-hidden:
// glisorul e controlul echivalent, iar împărțirea se anunță ca text.

import { h } from '../../../core/dom.js';
import { cantitate } from '../../../core/ro.js';
import { legendNodes } from '../../legend.js';
import { slider } from '../../slider.js';
import { keepMath } from '../../text.js';
import { MAX, shareTens } from './logic.js';

/** Câte obiecte pe rând într-o farfurie: careul rămâne cât mai pătrat, ca 24 de nuci și 10 farfurii să încapă pe telefon. */
const colsFor = (n) => (n <= 3 ? Math.max(1, n) : n === 4 ? 2 : n <= 9 ? 3 : n <= 16 ? 4 : 6);
/** Întârzierea dintre două obiecte: tot dealul ține cel mult ~1,2 s, oricâte obiecte ar fi. */
const stepMs = (n) => Math.max(12, Math.min(45, Math.round(1200 / Math.max(1, n))));

export function mount(host, params, { logic, dispatch }) {
  let state = logic.initial(params);
  const grupe = params.mode === 'grupe';
  const zeci = Boolean(params.zeci);
  const tone = grupe ? 'cols' : 'rows';
  const question = grupe ? 'Câte nuci într-o pungă?' : 'Câte farfurii?';
  const send = (commit) => (v) => dispatch({ set: 'by', value: v }, { commit });
  const by = slider({
    id: 'by',
    label: grupe ? 'Câte nuci într-o pungă' : 'Câte farfurii',
    valueText: (v) => (grupe ? `câte ${v} într-o pungă` : cantitate(v, 'farfurie', 'farfurii')),
    min: 1,
    max: MAX,
    value: state.by,
    tone,
    onInput: send(false),
    onCommit: send(true),
  });

  const basket = h('div', { class: 'iv-share__basket', 'data-testid': 'iv-basket' });
  const groups = h('div', { class: 'iv-share__groups', 'data-testid': 'iv-groups' });
  const art = h('div', { class: `iv-art iv-share${zeci ? ' iv-share--zeci' : ''}${grupe ? ' iv-share--bags' : ''}`, 'aria-hidden': 'true' }, basket, groups);
  const eq = h('p', { class: 'iv-eq', 'data-testid': 'iv-eq' });
  const legend = h('p', { class: 'iv-legend', 'data-testid': 'iv-legend' });
  const reading = h('p', { class: 'iv-reading' });
  const sum = h('p', { class: 'iv-sum', 'data-testid': 'iv-sum' });
  const extra = h('p', { class: 'iv-extra', 'data-testid': 'iv-extra' });
  const root = h(
    'div',
    { class: 'iv-widget iv-imparte', 'data-testid': 'iv-imparte' },
    eq,
    legend,
    art,
    h('div', { class: 'iv-imparte__control iv-control' }, h('span', { class: `iv-control__label iv-f--${tone}` }, question), by.el),
    h('div', { class: 'iv-text' }, reading, sum, extra),
  );
  host.append(root);

  const nut = (k) => h('span', { class: 'iv-nut', style: { '--k': k } });
  const bundle = (k) => h('span', { class: 'iv-bundle', style: { '--k': k } });
  const stick = (k) => h('span', { class: 'iv-stick', style: { '--k': k } });

  /** Farfuriile (sau pungile) cu obiectele lor; `k` e locul fiecărui obiect în ordinea împărțirii (pentru întârziere). */
  function drawGroups(d) {
    if (zeci) {
      const t = shareTens(d.total, d.plates);
      const dealtTens = t.tensEach * d.plates;
      return Array.from({ length: d.plates }, (_, i) =>
        h(
          'div',
          { class: 'iv-share__group', 'data-testid': 'iv-group', 'data-each': t.each },
          Array.from({ length: t.tensEach }, (_, j) => bundle(j * d.plates + i)),
          Array.from({ length: t.unitsEach }, (_, j) => stick(dealtTens + j * d.plates + i)),
        ),
      );
    }
    const count = grupe ? d.bags : d.plates;
    const size = grupe ? d.size : d.each;
    return Array.from({ length: count }, (_, i) =>
      h(
        'div',
        { class: `iv-share__group${grupe ? ' is-bag' : ''}`, 'data-testid': 'iv-group', 'data-each': size, style: { '--cols': colsFor(size) } },
        Array.from({ length: size }, (_, j) => nut(grupe ? i * size + j : j * count + i)),
      ),
    );
  }

  let built = false;
  function render(next, { hidden = [] } = {}) {
    // farfuriile se refac (și obiectele se împart din nou, cu animația) doar când se schimbă totalul sau glisorul: la „Bravo!” și la
    // provocarea următoare, cu aceeași stare, desenul rămâne pe loc
    const changed = !built || next.total !== state.total || next.by !== state.by;
    state = next;
    by.set(state.by);
    const d = logic.derive(params, state);
    if (changed) {
      built = true;
      // ce rămâne în coș stă pe loc; un coș gol rămâne desenat, ca să se vadă de unde pleacă obiectele
      const leftover = Array.from({ length: d.left }, () => (zeci ? h('span', { class: 'iv-stick' }) : h('span', { class: 'iv-nut' })));
      basket.style.setProperty('--cols', String(colsFor(Math.min(d.left, 8))));
      basket.replaceChildren(...leftover);
      basket.classList.toggle('is-empty', !d.left);
      groups.replaceChildren(...drawGroups(d));
      art.style.setProperty('--deal-step', `${stepMs(d.total - d.left)}ms`);
      art.classList.remove('is-dealing');
      void art.offsetWidth; // repornește animația
      art.classList.add('is-dealing');
    }
    const t = logic.texts(params, state, hidden);
    eq.textContent = keepMath(t.equation);
    legend.replaceChildren(...legendNodes(t.legend));
    reading.textContent = t.reading;
    sum.textContent = t.sum ?? '';
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
