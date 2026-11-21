// Învață: dreptunghiul înmulțirii (vederea). Desenul are aria-hidden: glisoarele sunt controlul echivalent, iar calculul se anunță
// în regiunea de stare a lecției. Toate locurile se construiesc o dată; o schimbare doar comută clase și variabile CSS, iar
// obiectele alunecă prin `transform` (instant la mișcare redusă). Vederea nu socotește: totul vine din logic.derive / logic.texts.

import { h, pop } from '../../../core/dom.js';
import { md } from '../../../core/markup.js';
import { cantitate } from '../../../core/ro.js';
import { play } from '../../../core/sound.js';
import { emojiHTML } from '../../../visuals/emoji.js';
import { slider } from '../../slider.js';
import { factorsOf, keepMath } from '../../text.js';
import { ITEMS, SPLIT_ITEMS, STRATEGIES, litCells } from './logic.js';

const ITEM_ICONS = { mar: emojiHTML('mar'), stea: emojiHTML('stea'), punct: '<span class="iv-bead"></span>', patrat: '<span class="iv-tile"></span>' };
const ITEM_NAMES = { mar: 'Mere', stea: 'Stele', punct: 'Buline', patrat: 'Pătrățele' };

/** Numele glisoarelor și textele citite, pe aspecte. */
function labels(p, unit) {
  if (p.skin === 'plates') {
    return {
      rows: ['Farfurii', (v) => cantitate(v, 'farfurie', 'farfurii')],
      cols: [`${unit[1][0].toUpperCase()}${unit[1].slice(1)} pe farfurie`, (v) => `câte ${cantitate(v, unit[0], unit[1])} pe farfurie`],
    };
  }
  if (p.skin === 'table') return { rows: ['Rândul', (v) => `rândul ${v}`], cols: ['Coloana', (v) => `coloana ${v}`] };
  return { rows: ['Rânduri', (v) => cantitate(v, 'rând', 'rânduri')], cols: ['Câte pe rând', (v) => `câte ${v} pe rând`] };
}

export function mount(host, params, { logic, dispatch }) {
  const p = params;
  const first = logic.initial(p);
  const ctl = Object.fromEntries(logic.controls(p, first).map((c) => [c.id, c]));
  const [R, C] = [ctl.rows.max, ctl.cols.max];
  const unit = ITEMS[p.item]?.unit ?? ITEMS.mar.unit;
  const names = labels(p, unit);
  let state = first;
  let timers = [];

  const send = (id, commit) => (v) => dispatch({ set: id, value: v }, { commit });
  const sliders = {
    rows: slider({ id: 'rows', label: names.rows[0], valueText: names.rows[1], min: ctl.rows.min, max: R, value: first.rows, vertical: true, tone: 'rows', onInput: send('rows', false), onCommit: send('rows', true) }),
    cols: slider({ id: 'cols', label: names.cols[0], valueText: names.cols[1], min: 1, max: C, value: first.cols, tone: 'cols', onInput: send('cols', false), onCommit: send('cols', true) }),
  };
  if (p.mark) {
    sliders.marked = slider({ id: 'marked', label: 'Farfurii colorate', valueText: (v) => cantitate(v, 'farfurie colorată', 'farfurii colorate'), min: 1, max: first.rows, count: R, value: first.marked, vertical: true, tone: 'mark', onInput: send('marked', false), onCommit: send('marked', true) });
  }
  if (p.skin === 'split') {
    sliders.cut = slider({ id: 'cut', label: 'Tăietura', valueText: (v) => `taie după rândul ${v}`, min: 1, max: first.rows - 1, count: R, value: first.cut, vertical: true, tone: 'cut', onInput: send('cut', false), onCommit: send('cut', true) });
  }

  // ——— desenul: locurile (obiecte sau căsuțele hărții), tăvile farfuriilor, tăietura și numărătoarea de la capătul rândurilor ———
  const slots = [];
  const trays = [];
  const totals = [];
  const board = h('div', { class: 'iv-array__board', 'aria-hidden': 'true', onClick: tap });
  if (p.skin === 'plates') for (let r = 0; r < R; r++) trays.push(board.appendChild(h('span', { class: 'iv-tray', style: { '--r': r } })));
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      const el =
        p.skin === 'table'
          ? h('span', { class: 'iv-cell', style: { '--r': r, '--c': c } }, String((r + 1) * (c + 1)))
          : h('span', { class: 'iv-item', style: { '--r': r, '--c': c } });
      slots.push({ el, r, c });
      board.append(el);
    }
  }
  const cutLine = p.skin === 'split' ? board.appendChild(h('span', { class: 'iv-cutline' })) : null;
  const side =
    p.skin === 'split' || p.mark
      ? (sliders.cut ?? sliders.marked).el
      : p.skin === 'table'
        ? null
        : h('ol', { class: 'iv-array__totals', 'aria-hidden': 'true' }, Array.from({ length: R }, (_, r) => (totals[r] = h('li', { style: { '--r': r } }))));

  function paintItems(item) {
    for (const s of slots) {
      if (p.skin === 'split') s.el.innerHTML = `${emojiHTML(SPLIT_ITEMS.top, { cls: 'iv-item__top' })}${emojiHTML(SPLIT_ITEMS.bottom, { cls: 'iv-item__bottom' })}`;
      else if (p.skin !== 'table') s.el.innerHTML = ITEM_ICONS[item];
    }
  }

  // ——— butoanele de sub desen ———
  const tools = h('div', { class: 'iv-tools' });
  let picker = null;
  if (p.skin === 'plates' || p.skin === 'grid') tools.append(h('button', { type: 'button', class: 'c-btn c-btn--sm', 'data-testid': 'iv-count', onClick: count }, 'Numără'));
  if (p.skin === 'grid' && p.flip) {
    tools.append(h('button', { type: 'button', class: 'c-btn c-btn--sm', 'data-testid': 'iv-flip', onClick: () => dispatch({ do: 'flip' }) }, 'Întoarce'));
  }
  if (p.skin === 'grid') {
    const order = Object.keys(ITEMS);
    picker = h('button', { type: 'button', class: 'iv-picker', 'data-testid': 'iv-item', onClick: () => dispatch({ set: 'item', value: order[(order.indexOf(state.item) + 1) % order.length] }) });
  }
  const toggles = {};
  if (p.skin === 'table') {
    for (const st of STRATEGIES) {
      toggles[st.id] = h('button', { type: 'button', class: 'c-btn c-btn--sm iv-toggle', 'aria-pressed': 'false', 'data-testid': `iv-toggle-${st.id}`, onClick: () => dispatch({ toggle: st.id }) }, st.label);
      tools.append(toggles[st.id]);
    }
  }

  // ——— calculul ———
  const eq = h('p', { class: 'iv-eq', 'data-testid': 'iv-eq' });
  const reading = h('p', { class: 'iv-reading' });
  const sum = h('p', { class: 'iv-sum', 'data-testid': 'iv-sum' });
  const extra = h('p', { class: 'iv-extra', 'data-testid': 'iv-extra' });
  const parts = h('p', { class: 'iv-parts', 'data-testid': 'iv-parts' });
  const text = h('div', { class: 'iv-text' }, reading, sum, parts, extra);

  const stage = h(
    'div',
    { class: 'iv-array__stage' },
    picker ? h('div', { class: 'iv-array__corner' }, picker) : null,
    h('div', { class: 'iv-array__top' }, sliders.cols.el),
    h('div', { class: 'iv-array__left' }, sliders.rows.el),
    board,
    side ? h('div', { class: 'iv-array__side' }, side) : null,
  );
  const root = h('div', { class: `iv-array iv-array--${p.skin}`, 'data-testid': 'iv-array', style: { '--rows-max': R, '--cols-max': C } }, eq, stage, tools.childElementCount ? tools : null, text);
  host.append(root);
  paintItems(first.item ?? p.item);

  /** Atingerea pe desen întinde dreptunghiul până la căsuța atinsă (pe careul întors, după locul de pe ecran). */
  function tap(e) {
    const r = board.getBoundingClientRect();
    const col = Math.floor(((e.clientX - r.left) / r.width) * C);
    const row = Math.floor(((e.clientY - r.top) / r.height) * R);
    // la fracția dintr-o mulțime, atingerea colorează farfuriile până la cea atinsă; altfel întinde dreptunghiul
    if (row >= 0 && col >= 0 && row < R && col < C) dispatch(p.mark ? { mark: row } : { tap: [row, col] });
  }

  /** „Numără”: rândurile se aprind pe rând, cu numărătoarea de la capăt și un ton care urcă. */
  function count() {
    stopCount();
    for (let i = 0; i < state.rows; i++) {
      timers.push(
        setTimeout(() => {
          for (const s of slots) if (shownRow(s) === i && s.el.classList.contains('is-on')) pop(s.el, 'is-bump');
          if (totals[i]) pop(totals[i], 'is-bump');
          play('tap', { step: Math.min(5, i) });
        }, i * 420),
      );
    }
  }
  function stopCount() {
    timers.forEach(clearTimeout);
    timers = [];
  }
  const shownRow = (s) => (state.flipped ? s.c : s.r);
  const shownCol = (s) => (state.flipped ? s.r : s.c);

  function render(next, { hidden = [] } = {}) {
    const changedItem = next.item !== state.item;
    state = next;
    const t = logic.texts(p, state, hidden);
    sliders.rows.set(state.rows);
    sliders.cols.set(state.cols);
    if (sliders.cut) {
      sliders.cut.setRange(1, state.rows - 1);
      sliders.cut.set(state.cut);
    }
    if (sliders.marked) {
      sliders.marked.setRange(1, state.rows);
      sliders.marked.set(state.marked);
    }
    root.style.setProperty('--rows', state.rows);
    root.style.setProperty('--cols', state.cols);
    if (state.cut) root.style.setProperty('--cut', state.cut);
    root.classList.toggle('is-flipped', Boolean(state.flipped));
    if (state.item) board.dataset.item = state.item;
    if (changedItem && state.item) paintItems(state.item);
    if (picker) {
      picker.innerHTML = ITEM_ICONS[state.item];
      picker.setAttribute('aria-label', `Obiectele: ${ITEMS[state.item].unit[1]}. Apasă ca să le schimbi.`);
      picker.title = 'Schimbă obiectele';
    }

    const lit = p.skin === 'table' ? litCells(state.lit) : null;
    for (const s of slots) {
      const [r, c] = [shownRow(s), shownCol(s)];
      const inside = r < state.rows && c < state.cols;
      if (p.skin === 'table') {
        const on = lit.has(`${s.r + 1},${s.c + 1}`);
        s.el.classList.toggle('is-lit', on);
        s.el.classList.toggle('is-in', inside);
        s.el.classList.toggle('is-sel', s.r === state.rows - 1 && s.c === state.cols - 1);
        s.el.classList.toggle('is-todo', state.lit.includes('intoarse') && !on);
        s.el.textContent = s.r === state.rows - 1 && s.c === state.cols - 1 && hidden.includes('product') ? '?' : String((s.r + 1) * (s.c + 1));
      } else {
        s.el.classList.toggle('is-on', inside);
        if (p.skin === 'split') s.el.classList.toggle('is-bottom', s.r >= state.cut);
      }
    }
    trays.forEach((tray, r) => {
      tray.classList.toggle('is-on', r < state.rows);
      tray.classList.toggle('is-marked', Boolean(p.mark) && r < state.marked);
    });
    totals.forEach((li, r) => {
      li.classList.toggle('is-on', r < state.rows);
      li.textContent = r < state.rows ? String(t.totals[r]) : '';
    });
    if (cutLine) cutLine.classList.add('is-on');
    for (const [id, b] of Object.entries(toggles)) b.setAttribute('aria-pressed', String(state.lit.includes(id)));

    // calculul: factorii în culorile glisoarelor (rândurile / grupele, apoi câte în fiecare)
    if (t.markup) eq.innerHTML = md(keepMath(t.equation));
    else if (p.skin === 'split') eq.textContent = t.equation;
    else {
      const [a, b] = factorsOf(state.rows, state.cols);
      const [ta, tb] = factorsOf('rows', 'cols');
      const tone = (v, which) => h('span', { class: `iv-f iv-f--${which}` }, String(v));
      const result = t.equation.split('=').pop().trim();
      eq.replaceChildren(tone(a, ta), '\u00a0×\u00a0', tone(b, tb), `\u00a0=\u00a0${result}`);
    }
    reading.textContent = t.reading;
    sum.textContent = t.sum ?? '';
    sum.hidden = !t.sum;
    parts.hidden = !t.parts;
    if (t.parts) {
      parts.replaceChildren(
        ...t.parts.map((text, i) => h('span', { class: 'iv-part' }, h('span', { 'aria-hidden': 'true', html: emojiHTML(i ? SPLIT_ITEMS.bottom : SPLIT_ITEMS.top) }), text)),
      );
    }
    extra.textContent = t.extra ?? '';
    extra.hidden = !t.extra;
  }

  return {
    render,
    destroy() {
      stopCount();
      root.remove();
    },
  };
}
