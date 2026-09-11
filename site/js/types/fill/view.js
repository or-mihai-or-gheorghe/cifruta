// fill — casete de completat în șabloane; layout-uri inline, steps, table, tree, chain.

import { h } from '../../core/dom.js';
import { md } from '../../core/markup.js';
import { feedbackBox, isLocked, setState } from '../_view.js';
import { kindOf } from './logic.js';

const BLANK = /\[\[(\w+)\]\]/g;
const SEGMENTS = { relation: ['<', '=', '>'], sign: ['+', '−'] };
const SEGMENT_LABELS = { '<': 'mai mic decât', '=': 'egal cu', '>': 'mai mare decât', '+': 'plus', '−': 'minus' };
const niceMinus = (s) => String(s).replace(/-/g, '−');

export default {
  howto: (part) => {
    const kinds = new Set(Object.values(part.blanks ?? {}).map(kindOf));
    const typing = kinds.has('number') || kinds.has('text');
    const signs = [kinds.has('relation') && '<, = sau >', kinds.has('sign') && '+ sau −'].filter(Boolean).join(', ');
    if (typing && signs) return `Scrie numerele în căsuțe și atinge semnele potrivite (${signs}).`;
    if (signs) return `Atinge semnul potrivit: ${signs}.`;
    if (kinds.has('select')) return 'Atinge varianta potrivită.';
    return 'Atinge o căsuță și scrie numărul.';
  },

  mount(el, part, ctx) {
    const blanks = part.blanks ?? {};
    let answer = {};
    let mode = 'solve';
    const widgets = {}; // blankId → { wrap, set(value), lock(bool) }
    const feedbackArea = h('div', { class: 'l-stack l-stack--sm' });

    function change(id, value) {
      answer = { ...answer, [id]: value };
      if (value === '' || value === null) delete answer[id];
      ctx.onChange(answer);
    }

    function numberWidget(id, blank) {
      const digits = String(blank.answer ?? blank.expr ?? '00').length > 3 ? 3 : Math.max(2, String(blank.answer ?? '').length);
      const input = h('input', {
        class: 'ex-blank',
        type: kindOf(blank) === 'text' ? 'text' : 'text',
        inputmode: kindOf(blank) === 'text' ? 'text' : 'numeric',
        pattern: kindOf(blank) === 'text' ? null : '[0-9]*',
        maxlength: kindOf(blank) === 'text' ? '20' : String(blank.maxDigits ?? 3),
        autocomplete: 'off',
        spellcheck: 'false',
        'aria-label': blank.label ?? 'căsuță',
        'data-testid': `blank-${id}`,
        style: { '--digits': kindOf(blank) === 'text' ? 6 : digits },
      });
      input.addEventListener('input', () => {
        if (kindOf(blank) !== 'text') input.value = input.value.replace(/\D/g, '');
        input.classList.toggle('has-value', input.value !== '');
        change(id, input.value);
      });
      const wrap = h('span', { class: 'ex-blank-wrap' }, input);
      return {
        wrap,
        set(v) {
          input.value = v === undefined || v === null ? '' : String(v);
          input.classList.toggle('has-value', input.value !== '');
        },
        lock(l) {
          input.readOnly = l;
          input.tabIndex = l ? -1 : 0;
        },
      };
    }

    function segmentWidget(id, blank) {
      const values = kindOf(blank) === 'select' ? blank.options.map(String) : SEGMENTS[kindOf(blank)];
      const group = h('span', { class: `ex-seg${kindOf(blank) === 'select' ? ' ex-seg--words' : ''}`, role: 'radiogroup', 'aria-label': blank.label ?? 'alege' });
      const buttons = values.map((v) =>
        h(
          'button',
          {
            type: 'button',
            class: 'ex-seg__btn',
            role: 'radio',
            'aria-checked': 'false',
            'aria-label': SEGMENT_LABELS[v] ?? v,
            'data-testid': `seg-${id}-${v}`,
            'data-value': v,
            onClick: () => {
              if (isLocked(mode)) return;
              const selected = group.dataset.value === v ? '' : v;
              paint(selected);
              change(id, selected);
            },
          },
          v,
        ),
      );
      group.append(...buttons);
      const paint = (v) => {
        group.dataset.value = v ?? '';
        group.classList.toggle('has-value', !!v);
        for (const b of buttons) {
          const on = b.dataset.value === niceMinus(v ?? '');
          b.classList.toggle('is-selected', on);
          b.setAttribute('aria-checked', String(on));
        }
      };
      return {
        wrap: h('span', { class: 'ex-blank-wrap' }, group),
        set: (v) => paint(v === undefined || v === null ? '' : niceMinus(v)),
        lock: (l) => buttons.forEach((b) => { b.disabled = l; }),
      };
    }

    for (const [id, blank] of Object.entries(blanks)) {
      widgets[id] = ['relation', 'sign', 'select'].includes(kindOf(blank)) ? segmentWidget(id, blank) : numberWidget(id, blank);
    }

    /** Șablon → fragmente de text (mini-markup) și casete. */
    function renderTemplate(tpl, cls = 'ex-tpl') {
      const out = h('span', { class: cls });
      let last = 0;
      for (const m of String(tpl).matchAll(BLANK)) {
        if (m.index > last) out.append(h('span', { html: md(niceMinus(tpl.slice(last, m.index))) }));
        out.append(widgets[m[1]]?.wrap ?? h('span', {}, m[0]));
        last = m.index + m[0].length;
      }
      if (last < tpl.length) out.append(h('span', { html: md(niceMinus(tpl.slice(last))) }));
      return out;
    }

    const layout = part.layout ?? 'inline';
    let body;
    if (layout === 'inline' || layout === 'steps') {
      body = h(
        layout === 'steps' ? 'ol' : 'div',
        { class: `ex-rows${layout === 'steps' ? ' ex-rows--steps' : ''}` },
        (part.rows ?? []).map((r) => {
          const row = typeof r === 'string' ? { t: r } : r;
          return h(layout === 'steps' ? 'li' : 'div', { class: 'ex-row' }, row.label ? h('span', { class: 'ex-row__label', html: md(row.label) }) : null, renderTemplate(row.t));
        }),
      );
    } else if (layout === 'table') {
      body = h(
        'div',
        { class: 'ex-table-wrap' },
        h(
          'table',
          { class: 'ex-table' },
          part.head ? h('thead', {}, h('tr', {}, part.head.map((c) => h('th', { scope: 'col', html: md(String(c)) })))) : null,
          h('tbody', {}, part.rows.map((row) => h('tr', {}, row.map((cell, i) => (i === 0 && part.head ? h('th', { scope: 'row' }, renderTemplate(String(cell))) : h('td', {}, renderTemplate(String(cell)))))))),
        ),
      );
    } else if (layout === 'tree') {
      const [leftLabel, rightLabel] = part.labels ?? [];
      body = h(
        'div',
        { class: 'ex-trees' },
        part.trees.map((t) =>
          h(
            'div',
            { class: 'ex-tree' },
            h('div', { class: 'ex-tree__top' }, renderTemplate(String(t.top), 'ex-tpl ex-tree__node')),
            h('div', { class: 'ex-tree__lines', 'aria-hidden': 'true', html: '<svg viewBox="0 0 100 30" preserveAspectRatio="none"><path d="M50 2 L20 28 M50 2 L80 28" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>' }),
            h('div', { class: 'ex-tree__leaf' }, renderTemplate(String(t.left), 'ex-tpl ex-tree__node'), leftLabel ? h('span', { class: 'ex-tree__label ex-tree__label--z' }, leftLabel) : null),
            h('div', { class: 'ex-tree__leaf' }, renderTemplate(String(t.right), 'ex-tpl ex-tree__node'), rightLabel ? h('span', { class: 'ex-tree__label ex-tree__label--u' }, rightLabel) : null),
          ),
        ),
      );
    } else if (layout === 'chain') {
      body = h(
        'div',
        { class: 'ex-chains' },
        part.chains.map((c) =>
          h(
            'div',
            { class: 'ex-chain' },
            h('span', { class: 'ex-chain__node' }, renderTemplate(String(c.start))),
            c.steps.flatMap((s) => [
              h('span', { class: 'ex-chain__arrow' }, h('span', { class: 'ex-chain__op' }, niceMinus(s.op)), h('span', { class: 'ex-chain__line', 'aria-hidden': 'true' })),
              h('span', { class: 'ex-chain__node' }, renderTemplate(String(s.out))),
            ]),
          ),
        ),
      );
    }
    el.append(body, feedbackArea);

    return {
      get: () => answer,
      set(a) {
        answer = { ...(a ?? {}) };
        for (const [id, w] of Object.entries(widgets)) w.set(answer[id]);
      },
      mode(m) {
        mode = m;
        for (const w of Object.values(widgets)) w.lock(isLocked(m));
      },
      showResult(res) {
        const notes = [];
        for (const r of res.items) {
          const w = widgets[r.id];
          if (!w) continue;
          w.wrap.querySelector('.ex-expected')?.remove();
          setState(w.wrap, r.ok ? 'correct' : 'wrong');
          if (!r.ok) w.wrap.append(h('span', { class: 'ex-expected', 'aria-label': `corect: ${r.expected}` }, niceMinus(r.expected)));
          if (r.feedback) notes.push(r.feedback);
        }
        feedbackArea.replaceChildren(...notes.map((n) => feedbackBox(n)));
      },
      destroy() {},
    };
  },
};
