// Învață: împărțirea (vederea). Coșul cu ce a rămas, apoi farfuriile (sau pungile) pe o masă de mărime fixă, fiecare cu obiectele ei
// într-un careu mic. Farfuriile au toate aceeași mărime, oricâte ar fi, iar masa și coșul nu se schimbă când tragi de glisor: nimic de
// sub desen nu se mișcă (mărimile, în css/10-invata.css). Când o farfurie primește mai mult decât încape la mărimea obișnuită (o
// singură farfurie cu 18 nuci, 9 pachete de bețișoare) sau sunt mai mult de 12 pungi, obiectele se strâng (`--fit`, `--gfit`). La
// fiecare schimbare, obiectele apar în ordinea împărțirii: câte una pe fiecare farfurie, pe rând (la pungi, pungă după pungă; la
// bețișoare, întâi pachetele, apoi bețișoarele), cu o întârziere care crește. Desenul are aria-hidden: glisorul e controlul
// echivalent, iar împărțirea se anunță ca text.

import { h } from '../../../core/dom.js';
import { cantitate } from '../../../core/ro.js';
import { legendNodes } from '../../legend.js';
import { slider } from '../../slider.js';
import { keepMath } from '../../text.js';
import { MAX, shareTens } from './logic.js';

/** Câte nuci pe rând într-o farfurie, cât timp încap la mărimea lor (cel mult 12, în 4 × 3): careul rămâne cât mai pătrat. */
const colsFor = (n) => (n <= 3 ? Math.max(1, n) : n === 4 ? 2 : n <= 9 ? 3 : 4);
/** Întârzierea dintre două obiecte: tot dealul ține cel mult ~1,2 s, oricâte obiecte ar fi. */
const stepMs = (n) => Math.max(12, Math.min(45, Math.round(1200 / Math.max(1, n))));
// mărimile din CSS, în nuci: careul unei farfurii (4 × 3 nuci), al unei farfurii cu bețișoare (4 pachete, 9 bețișoare) și masa pungilor
const PLATE = { w: 4.45, h: 3.3 };
const STICKS = { w: 3.55, h: 4.15, bundle: 0.82, stick: 0.23, gap: 0.09, tall: 2, row: 0.15 };
const BAGS = { per: 4, lines: 3, w: 6.3, h: 2.85, gap: 0.4 };

/** Cel mai bun careu pentru `n` obiecte de `w` × `h` (cu spațiul `gap`) într-o cutie de `boxW` × `boxH`: coloanele și cât se strâng. */
function fitGrid(n, boxW, boxH, w, h, gap, from = 1) {
  let best = { cols: from, fit: 0 };
  for (let c = from; c <= Math.max(from, n); c++) {
    const r = Math.ceil(n / c);
    const fit = Math.min(1, boxW / (c * w + (c - 1) * gap), boxH / (r * h + (r - 1) * gap));
    if (fit > best.fit + 1e-9) best = { cols: c, fit };
  }
  return best;
}

/** Nucile de pe o farfurie: până la 12, la mărimea lor; mai multe, strânse în același careu. */
const plateFit = (n) => (n <= 12 ? { cols: colsFor(n), fit: 1 } : fitGrid(n, PLATE.w, PLATE.h, 1, 1, 0.15, 4));

/** Pachetele și bețișoarele de pe o farfurie: pachetele pe rânduri de câte `cols`, bețișoarele dedesubt, totul strâns cu `fit`. */
function sticksFit(tens, units) {
  const unitsW = units ? units * STICKS.stick + (units - 1) * STICKS.gap : 0;
  let best = { cols: Math.max(1, tens), fit: 0 };
  for (let c = 1; c <= Math.max(1, tens); c++) {
    const rows = tens ? Math.ceil(tens / c) : 0;
    const w = Math.max(tens ? Math.min(c, tens) * STICKS.bundle + (Math.min(c, tens) - 1) * STICKS.gap : 0, unitsW);
    const h = rows * STICKS.tall + Math.max(0, rows - 1) * STICKS.row + (units ? STICKS.tall + (rows ? STICKS.row : 0) : 0);
    const fit = Math.min(1, STICKS.w / Math.max(w, 1e-9), STICKS.h / Math.max(h, 1e-9));
    if (fit > best.fit + 1e-9) best = { cols: c, fit };
  }
  return best;
}

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
    h('div', { class: 'iv-head' }, eq, legend),
    h('div', { class: 'iv-main' }, art, h('div', { class: 'iv-imparte__control iv-control' }, h('span', { class: `iv-control__label iv-f--${tone}` }, question), by.el)),
    h('div', { class: 'iv-foot' }, h('div', { class: 'iv-text' }, reading, sum, extra)),
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
      const f = sticksFit(t.tensEach, t.unitsEach);
      groups.style.setProperty('--zc', String(f.cols));
      groups.style.setProperty('--fit', String(f.fit));
      groups.style.removeProperty('--gfit');
      return Array.from({ length: d.plates }, (_, i) =>
        h(
          'div',
          { class: 'iv-share__group', 'data-testid': 'iv-group', 'data-each': t.each },
          h('div', { class: 'iv-share__tens' }, Array.from({ length: t.tensEach }, (_, j) => bundle(j * d.plates + i))),
          h('div', { class: 'iv-share__units' }, Array.from({ length: t.unitsEach }, (_, j) => stick(dealtTens + j * d.plates + i))),
        ),
      );
    }
    const count = grupe ? d.bags : d.plates;
    const size = grupe ? d.size : d.each;
    // pe o pungă încap 10 nuci (5 × 2); peste 12 pungi, toate pungile se strâng pe aceeași masă
    const inside = grupe ? { cols: Math.min(5, Math.max(1, size)), fit: 1 } : plateFit(size);
    const table = grupe && count > BAGS.per * BAGS.lines ? fitGrid(count, BAGS.per * (BAGS.w + BAGS.gap) - BAGS.gap, BAGS.lines * (BAGS.h + BAGS.gap) - BAGS.gap, BAGS.w, BAGS.h, BAGS.gap, BAGS.per) : null;
    groups.style.setProperty('--pc', String(inside.cols));
    groups.style.setProperty('--fit', String(table ? table.fit : inside.fit));
    if (table) groups.style.setProperty('--gfit', String(table.fit));
    else groups.style.removeProperty('--gfit');
    return Array.from({ length: count }, (_, i) =>
      h(
        'div',
        { class: `iv-share__group${grupe ? ' is-bag' : ''}`, 'data-testid': 'iv-group', 'data-each': size },
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
      // coșul ține cel mult 9 nuci: pe un rând până la 4, apoi pe două
      basket.style.setProperty('--bc', String(d.left <= 4 ? Math.max(1, d.left) : Math.ceil(d.left / 2)));
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
