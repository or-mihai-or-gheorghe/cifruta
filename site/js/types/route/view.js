// route — harta liniilor cu butoane peste stații; atingi stațiile în ordine, din aproape în aproape.

import { h, pop } from '../../core/dom.js';
import { play } from '../../core/sound.js';
import { plain } from '../../core/markup.js';
import { visualSVG } from '../../visuals/index.js';
import { expectedTag, feedbackBox, isLocked, setState } from '../_view.js';
import { adjacency, stopsById } from './logic.js';

export default {
  howto: () => 'Atinge locurile de pe hartă în ordine, din aproape în aproape. Atinge ultimul loc ca să te întorci.',

  mount(el, part, ctx) {
    const map = part.map;
    const byId = stopsById(map);
    const { next } = adjacency(map);
    const w = Number(map.w ?? 320);
    const hgt = Number(map.h ?? 200);
    const linesOf = (id) => map.lines.filter((l) => l.stops.includes(id)).map((l) => plain(String(l.label ?? l.id)));
    const name = (id) => plain(String(byId[id]?.label ?? id));
    let mode = 'solve';
    let path = [part.from];

    const art = h('div', { class: 'ex-route__art' });
    const live = h('p', { class: 'u-visually-hidden', 'aria-live': 'polite' });
    const stage = h('div', { class: 'ex-route__stage', style: { aspectRatio: `${w} / ${hgt}` } }, art);
    const buttons = {};
    for (const s of map.stops) {
      buttons[s.id] = h('button', {
        type: 'button',
        class: 'ex-route__stop',
        'aria-pressed': 'false',
        'aria-label': `Stația ${name(s.id)}, ${[...new Set(linesOf(s.id))].join(' și ')}`,
        'data-testid': `stop-${s.id}`,
        style: { left: `${(Number(s.x) / w) * 100}%`, top: `${(Number(s.y) / hgt) * 100}%` },
        onClick: () => tap(s.id),
      });
      stage.append(buttons[s.id]);
    }
    const undo = h('button', { type: 'button', class: 'c-btn c-btn--sm', 'data-testid': 'route-undo', onClick: () => step(-1) }, '← Un pas înapoi');
    const reset = h('button', { type: 'button', class: 'c-btn c-btn--sm c-btn--ghost', 'data-testid': 'route-reset', onClick: () => restart() }, 'De la început');
    const notes = h('div', { class: 'l-stack l-stack--sm' });
    el.append(stage, h('div', { class: 'ex-route__tools' }, undo, reset), live, notes);

    const describe = () => `Traseu: ${path.map(name).join(' → ')} (${path.length} ${path.length === 1 ? 'stație' : 'stații'})`;

    function render() {
      art.innerHTML = visualSVG({ v: 'route-map', ...map, path: path.length > 1 ? path : [], from: part.from, to: part.to });
      const last = path[path.length - 1];
      for (const [id, btn] of Object.entries(buttons)) {
        const on = path.includes(id);
        btn.setAttribute('aria-pressed', String(on));
        btn.classList.toggle('is-marked', on);
        btn.classList.toggle('is-last', id === last && path.length > 1);
        btn.classList.toggle('is-next', !on && !isLocked(mode) && (next[last]?.has(id) ?? false));
      }
      undo.disabled = isLocked(mode) || path.length < 2;
      reset.disabled = isLocked(mode) || path.length < 2;
    }

    function commit() {
      render();
      live.textContent = describe();
      ctx.onChange(path.length >= 2 ? [...path] : null);
    }

    function tap(id) {
      if (isLocked(mode)) return;
      const last = path[path.length - 1];
      if (id === last) {
        if (path.length > 1) step(-1);
        return;
      }
      if (path.includes(id)) {
        play('tap');
        live.textContent = `${name(id)} este deja pe traseu. ${describe()}`;
        return;
      }
      if (!next[last]?.has(id)) {
        play('no');
        live.textContent = `Între ${name(last)} și ${name(id)} nu e nicio linie. ${describe()}`;
        return;
      }
      path = [...path, id];
      pop(buttons[id]);
      play('place');
      commit();
    }

    function step(n) {
      if (isLocked(mode) || path.length < 2) return;
      path = path.slice(0, path.length + n);
      play('tap');
      commit();
      buttons[path[path.length - 1]].focus({ preventScroll: true });
    }

    function restart() {
      if (isLocked(mode) || path.length < 2) return;
      path = [part.from];
      play('tap');
      commit();
    }

    render();

    return {
      get: () => (path.length >= 2 ? [...path] : null),
      set(a) {
        path = Array.isArray(a) && a[0] === part.from && a.every((id) => byId[id]) ? [...new Set(a)] : [part.from];
        render();
      },
      mode(m) {
        mode = m;
        for (const b of Object.values(buttons)) b.disabled = isLocked(m);
        render();
      },
      showResult(res) {
        const r = res.items[0];
        setState(stage, r.ok ? 'correct' : 'wrong');
        notes.replaceChildren(
          ...(r.feedback ? [feedbackBox(r.feedback)] : []),
          ...(!r.ok && r.expected ? [expectedTag(r.expected.map(name).join(' → '))] : []),
        );
      },
      destroy() {},
    };
  },
};
