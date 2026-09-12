// slider — axa numerelor (atingi sau tragi direct pe desen) sau termometru (tragi cursorul, lichidul urcă).
// Pe axă, valoarea vine din poziția degetului pe desen; un <input type="range"> ascuns vizual rămâne pentru
// tastatură (săgeți) și cititoarele de ecran. Termometrul folosește slider-ul nativ, vizibil.

import { h } from '../../core/dom.js';
import { play } from '../../core/sound.js';
import { md, plain } from '../../core/markup.js';
import { cantitate, formatNumber, singularOf } from '../../core/ro.js';
import { visualSVG } from '../../visuals/index.js';
import { LINE } from '../../visuals/tools.js';
import { isLocked, setState } from '../_view.js';

export default {
  howto: (part) => (part.skin === 'thermometer' ? 'Trage cursorul până când lichidul ajunge unde trebuie.' : 'Atinge axa sau trage pe ea până la locul potrivit.'),

  mount(el, part, ctx) {
    const { min, max, step = 1 } = part;
    const thermo = part.skin === 'thermometer';
    const qty = (v) => (part.unit ? cantitate(v, singularOf(part.unit), part.unit) : formatNumber(v));
    let answer = {};
    let mode = 'solve';
    const rows = {};

    const art = (value) =>
      thermo
        ? visualSVG({ v: 'thermometer', min, max, minor: part.ticks?.minor ?? step, major: part.ticks?.major ?? 10, ...(value === null || value === undefined ? {} : { value }) })
        : visualSVG({ v: 'number-line', min, max, minor: part.ticks?.minor ?? 10, labels: (part.ticks?.labels ?? [min, max]).join(','), ...(value === null || value === undefined ? {} : { marker: value, icon: part.icon ?? 'racheta' }) });

    for (const item of part.items) {
      const pic = h('div', { class: 'ex-slider__art', html: art(null) });
      const input = h('input', {
        type: 'range',
        class: `ex-slider__range${thermo ? '' : ' u-visually-hidden'}`,
        min: String(min),
        max: String(max),
        step: String(step),
        value: String(min),
        'aria-label': plain(item.label),
        'data-testid': `slider-${item.id}`,
      });
      const row = h(
        'div',
        { class: `ex-slider ${thermo ? 'ex-slider--thermo' : 'ex-slider--line'} is-untouched` },
        h('p', { class: 'ex-slider__label', html: md(item.label) }),
        h('div', { class: 'ex-slider__stage' }, pic, input),
        h('div', { class: 'ex-slider__result' }),
      );
      input.addEventListener('input', () => commit(item.id, Number(input.value)));
      input.addEventListener('change', () => play('place')); // o dată, la eliberare (nu la fiecare pas)
      if (!thermo) followPointer(item.id, pic);
      rows[item.id] = { row, pic, input };
    }
    el.append(h('div', { class: 'l-stack' }, Object.values(rows).map((r) => r.row)));

    function commit(id, value) {
      if (isLocked(mode)) return;
      answer = { ...answer, [id]: value };
      paintItem(id);
      ctx.onChange(answer);
    }

    /** Pe axă: în timpul tragerii se mută doar desenul; răspunsul se salvează când ridici degetul. */
    function followPointer(id, pic) {
      let pointer = null;
      const valueAt = (e) => {
        const svg = pic.querySelector('svg');
        const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM().inverse());
        const raw = min + ((p.x - LINE.x0) / LINE.len) * (max - min);
        return Math.min(max, Math.max(min, min + Math.round((raw - min) / step) * step));
      };
      pic.addEventListener('pointerdown', (e) => {
        if (isLocked(mode) || pointer !== null || !e.isPrimary) return;
        pointer = e.pointerId;
        pic.setPointerCapture(e.pointerId);
        pic.innerHTML = art(valueAt(e));
      });
      pic.addEventListener('pointermove', (e) => {
        if (e.pointerId === pointer) pic.innerHTML = art(valueAt(e));
      });
      pic.addEventListener('pointerup', (e) => {
        if (e.pointerId !== pointer) return;
        pointer = null;
        commit(id, valueAt(e));
        play('place');
      });
      pic.addEventListener('pointercancel', (e) => {
        if (e.pointerId !== pointer) return;
        pointer = null;
        paintItem(id); // gestul a devenit derulare de pagină: revine la valoarea salvată
      });
    }

    function paintItem(id) {
      const r = rows[id];
      const v = answer[id];
      const has = v !== undefined && v !== null;
      r.row.classList.toggle('is-untouched', !has);
      if (has) r.input.value = String(v);
      r.input.setAttribute('aria-valuetext', has ? qty(v) : 'nimic ales');
      r.pic.innerHTML = art(v);
    }

    return {
      get: () => answer,
      set(a) {
        answer = { ...(a ?? {}) };
        for (const id of Object.keys(rows)) paintItem(id);
      },
      mode(m) {
        mode = m;
        for (const r of Object.values(rows)) {
          r.input.disabled = isLocked(m);
          r.row.classList.toggle('is-locked', isLocked(m));
        }
      },
      showResult(res) {
        for (const x of res.items) {
          const r = rows[x.id];
          setState(r.row, x.ok ? 'correct' : 'wrong');
          r.row.querySelector('.ex-slider__result').replaceChildren(
            x.ok
              ? h('span', { class: 'u-small' }, `Ai arătat ${qty(x.given)}.`)
              : h('span', { class: 'u-small' }, x.given === null ? 'Nu ai mutat cursorul. ' : `Ai arătat ${qty(x.given)}. `, h('span', { class: 'ex-expected' }, qty(x.expected))),
          );
        }
      },
      destroy() {},
    };
  },
};
