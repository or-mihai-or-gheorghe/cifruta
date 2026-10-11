// chart — graficul cu bare se construiește cu butoane + / − pe fiecare categorie; barele date sunt blocate.
// Ținut apăsat, un buton repetă pasul (la sute, bara nu mai cere zeci de atingeri); valoarea barei se schimbă și din săgeți.

import { h, pop } from '../../core/dom.js';
import { play } from '../../core/sound.js';
import { md, plain } from '../../core/markup.js';
import { visualSVG } from '../../visuals/index.js';
import { emojiHTML } from '../../visuals/emoji.js';
import { expectedTag, feedbackBox, isLocked, setState } from '../_view.js';
import { editable } from './logic.js';

/** Butonul ținut apăsat repetă pasul: după 400 ms, apoi tot mai des (până la ~12 pe secundă); o atingere scurtă rămâne un pas. */
function repeatOnHold(btn, step) {
  let timer = 0;
  let held = false;
  const stop = () => {
    clearTimeout(timer);
    timer = 0;
  };
  const tick = (wait) => {
    timer = setTimeout(() => {
      held = true;
      if (step()) tick(Math.max(80, wait * 0.75));
    }, wait);
  };
  btn.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || btn.disabled) return;
    held = false;
    stop();
    tick(400);
  });
  for (const type of ['pointerup', 'pointercancel', 'pointerleave']) btn.addEventListener(type, stop);
  btn.addEventListener('contextmenu', (e) => e.preventDefault()); // apăsarea lungă nu deschide meniul telefonului
  btn.addEventListener('click', () => {
    if (held) held = false; // pașii s-au făcut cât a fost ținut apăsat
    else step();
  });
  return stop;
}

/** Săgețile schimbă bara cu un pas, Page Up / Page Down cu 5, Home / End o duc la 0 sau la maxim. */
const KEY_STEPS = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 5, PageDown: -5, Home: -Infinity, End: Infinity };

export default {
  howto: () => 'Apasă + și − ca să ridici sau să cobori fiecare bară. Ține apăsat ca să urce sau să coboare repede.',

  mount(el, part, ctx) {
    const free = editable(part);
    let answer = {};
    let mode = 'solve';
    const art = h('div', { class: 'ex-chart__art' });
    const stage = h('div', { class: 'ex-chart__stage' }, art);
    const rows = {};
    const stops = [];
    const controls = h('div', { class: 'ex-chart__controls' }, part.categories.filter((c) => free.includes(c.id)).map((c) => {
      const value = h(
        'span',
        {
          class: 'ex-chart__value',
          role: 'spinbutton',
          tabindex: '0',
          'aria-label': plain(c.label),
          'aria-valuemin': '0',
          'aria-valuemax': String(part.max),
          'aria-valuenow': '0',
          'data-testid': `bar-${c.id}`,
          onKeydown: (e) => {
            if (!(e.key in KEY_STEPS)) return;
            e.preventDefault();
            bump(c.id, KEY_STEPS[e.key]);
          },
        },
        '0',
      );
      const minus = h('button', { type: 'button', class: 'c-btn c-btn--icon ex-chart__btn', 'aria-label': `coboară bara ${plain(c.label)}`, 'data-testid': `bar-${c.id}-minus` }, '−');
      const plus = h('button', { type: 'button', class: 'c-btn c-btn--icon ex-chart__btn', 'aria-label': `ridică bara ${plain(c.label)}`, 'data-testid': `bar-${c.id}-plus` }, '+');
      stops.push(repeatOnHold(minus, () => bump(c.id, -1)), repeatOnHold(plus, () => bump(c.id, 1)));
      const row = h(
        'div',
        { class: 'ex-chart__cat', 'data-id': c.id },
        h('span', { class: 'ex-chart__name' }, c.emoji ? h('span', { class: 'ex-chart__emoji', 'aria-hidden': 'true', html: emojiHTML(c.emoji) }) : null, h('span', { html: md(c.label) })),
        minus,
        value,
        plus,
      );
      rows[c.id] = { row, value };
      return row;
    }));
    const notes = h('div', { class: 'l-stack l-stack--sm' });
    el.append(stage, controls, notes);

    function paint() {
      const vals = part.categories.map((c) => (c.id in (part.given ?? {}) ? part.given[c.id] : (answer[c.id] ?? 0)));
      const hide = free.filter((id) => answer[id] === undefined);
      art.innerHTML = visualSVG({ v: 'bar-chart', ids: part.categories.map((c) => c.id), labels: part.categories.map((c) => plain(c.label)), emojis: part.categories.map((c) => c.emoji ?? ''), values: vals, step: part.step, max: part.max, hide });
      for (const [id, r] of Object.entries(rows)) {
        const v = answer[id] ?? 0;
        r.value.textContent = String(v);
        r.value.setAttribute('aria-valuenow', String(v));
      }
    }

    /** Mută bara cu `steps` pași (±Infinity: la 0 sau la maxim); întoarce true dacă valoarea s-a schimbat. */
    function bump(id, steps) {
      if (isLocked(mode)) return false;
      const was = answer[id] ?? 0;
      const v = Math.max(0, Math.min(part.max, Number.isFinite(steps) ? was + steps * part.step : steps > 0 ? part.max : 0));
      answer = { ...answer, [id]: v };
      paint();
      if (v !== was) {
        play('tap');
        const bar = art.querySelector(`.v-bar-chart__bar[data-id="${id}"]`);
        if (bar) pop(bar);
      }
      ctx.onChange(answer);
      return v !== was;
    }
    paint();

    return {
      get: () => answer,
      set(a) {
        answer = Object.fromEntries(Object.entries(a ?? {}).filter(([id, v]) => free.includes(id) && Number.isInteger(v)));
        paint();
      },
      mode(m) {
        mode = m;
        for (const b of controls.querySelectorAll('button')) b.disabled = isLocked(m);
        for (const r of Object.values(rows)) {
          r.value.tabIndex = isLocked(m) ? -1 : 0;
          r.value.setAttribute('aria-readonly', String(isLocked(m)));
        }
        if (isLocked(m)) for (const stop of stops) stop();
      },
      showResult(res) {
        if (part.key) {
          for (const r of res.items) {
            const row = rows[r.id];
            if (!row) continue;
            row.row.querySelector('.ex-expected')?.remove();
            setState(row.row, r.ok ? 'correct' : 'wrong');
            if (!r.ok) row.row.append(expectedTag(String(r.expected)));
          }
          return;
        }
        const r = res.items[0];
        setState(stage, r.ok ? 'correct' : 'wrong');
        notes.replaceChildren(...(r.feedback ? [feedbackBox(r.feedback)] : []));
      },
      destroy() {
        for (const stop of stops) stop();
      },
    };
  },
};
