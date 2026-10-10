// fill — casete de completat în șabloane; layout-uri inline, steps, table, tree, chain, column (calcul în scris), pyramid.

import { h, pop } from '../../core/dom.js';
import { play } from '../../core/sound.js';
import { md } from '../../core/markup.js';
import { LOCURI, marcajeTrecere } from '../../core/rules.js';
import { expectedTag, feedbackBox, isLocked, setState } from '../_view.js';
import { blankLabel, columnNumbers, columnRows, keyOf, kindOf } from './logic.js';

const PLACE_LETTER = { u: 'U', z: 'Z', s: 'S', m: 'M' };
const PLACE_NAME = { u: 'unități', z: 'zeci', s: 'sute', m: 'mii' };
const capFirst = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const BLANK = /\[\[(\w+)\]\]/g;
const SEGMENTS = { relation: ['<', '=', '>'], sign: ['+', '−'] };
const SEGMENT_LABELS = { '<': 'mai mic decât', '=': 'egal cu', '>': 'mai mare decât', '+': 'plus', '−': 'minus' };
// „-” devine „−” tipografic, dar nu în token-uri precum {{v:ten-frame}}
const niceMinus = (s) => String(s).replace(/\{\{.*?\}\}|-/g, (m) => (m === '-' ? '−' : m));

export default {
  howto: (part) => {
    if (part.layout === 'column') {
      return part.minte === false
        ? 'Scrie câte o cifră în fiecare căsuță, începând cu unitățile.'
        : 'Scrie câte o cifră în fiecare căsuță, începând cu unitățile. Căsuțele mici de sus sunt pentru „ține minte” și nu se notează.';
    }
    if (part.layout === 'pyramid') return 'Atinge o cărămidă goală și scrie numărul.';
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
    // casetele numerice ale subpunctului au aceeași lățime, ca lățimea să nu trădeze răspunsul (100 printre 42 și 56)
    const key = keyOf(part);
    const digits = Math.max(2, ...Object.keys(blanks).filter((id) => kindOf(blanks[id]) === 'number').map((id) => String(key[id] ?? '').length));
    let answer = {};
    let mode = 'solve';
    const widgets = {}; // blankId → { wrap, set(value), lock(bool) }
    // cititorul de ecran aude șablonul casetei („Căsuță: 40 + 8 = …”), nu doar „căsuță”
    const labelOf = (id, generic) => {
      const label = blankLabel(part, id);
      return label ? (blanks[id].label ? label : `${generic}: ${niceMinus(label)}`) : generic.toLowerCase();
    };
    const feedbackArea = h('div', { class: 'l-stack l-stack--sm' });

    function change(id, value) {
      answer = { ...answer, [id]: value };
      if (value === '' || value === null) delete answer[id];
      ctx.onChange(answer);
    }

    function numberWidget(id, blank) {
      const text = kindOf(blank) === 'text';
      const input = h('input', {
        class: 'ex-blank',
        type: 'text',
        inputmode: text ? 'text' : 'numeric',
        pattern: text ? null : '[0-9]*',
        maxlength: text ? '20' : '4', // până la 1000
        autocomplete: 'off',
        spellcheck: 'false',
        'aria-label': labelOf(id, 'Căsuță'),
        'data-testid': `blank-${id}`,
        style: { '--digits': text ? 6 : digits },
      });
      input.addEventListener('input', () => {
        if (!text) input.value = input.value.replace(/\D/g, '');
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
      const kind = kindOf(blank);
      const values = kind === 'select' ? blank.options.map(String) : SEGMENTS[kind];
      const shown = (v) => (kind === 'sign' ? niceMinus(v) : String(v)); // variantele de la select se compară exact
      const group = h('span', { class: `ex-seg${kind === 'select' ? ' ex-seg--words' : ''}`, role: 'radiogroup', 'aria-label': labelOf(id, 'Alege') });
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
            onClick: (e) => {
              if (isLocked(mode)) return;
              const selected = group.dataset.value === v ? '' : v;
              paint(selected);
              if (selected) {
                pop(e.currentTarget);
                play('tap');
              }
              change(id, selected);
            },
          },
          v,
        ),
      );
      group.append(...buttons);
      const paint = (v) => {
        group.dataset.value = v;
        group.classList.toggle('has-value', v !== '');
        for (const b of buttons) {
          const on = b.dataset.value === v;
          b.classList.toggle('is-selected', on);
          b.setAttribute('aria-checked', String(on));
        }
      };
      return {
        wrap: h('span', { class: 'ex-blank-wrap' }, group),
        set: (v) => paint(v === undefined || v === null ? '' : shown(v)),
        lock: (l) => buttons.forEach((b) => { b.disabled = l; }),
      };
    }

    // ——— calculul în scris: o casetă pe cifră, scrisă de la unități spre stânga ———
    const order = []; // ordinea în care se completează cifrele (coloanele de la dreapta, de sus în jos)
    const inputs = {};
    const focusAt = (k) => {
      const next = inputs[order[k]];
      if (!next) return;
      next.focus();
      next.select?.();
    };

    function digitWidget(id) {
      const label = blankLabel(part, id);
      const input = h('input', {
        class: 'ex-blank ex-blank--digit',
        type: 'text',
        inputmode: 'numeric',
        pattern: '[0-9]*',
        autocomplete: 'off',
        spellcheck: 'false',
        'aria-label': label ? capFirst(label) : 'cifră',
        'data-testid': `blank-${id}`,
      });
      inputs[id] = input;
      const show = (v) => {
        input.value = v === undefined || v === null ? '' : String(v);
        input.classList.toggle('has-value', input.value !== '');
      };
      // o cifră tastată înlocuiește cifra din casetă, iar focusul trece la cifra următoare (spre stânga)
      input.addEventListener('beforeinput', (e) => {
        if (e.inputType !== 'insertText' || !e.data) return;
        e.preventDefault();
        if (isLocked(mode)) return;
        const d = e.data.replace(/\D/g, '').slice(-1);
        if (!d) return;
        show(d);
        change(id, d);
        focusAt(order.indexOf(id) + 1);
      });
      input.addEventListener('input', () => {
        const d = input.value.replace(/\D/g, '').slice(-1);
        show(d);
        change(id, d);
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && input.value === '') {
          e.preventDefault();
          focusAt(order.indexOf(id) - 1);
        }
      });
      input.addEventListener('focus', () => input.select());
      return {
        wrap: h('span', { class: 'ex-blank-wrap ex-blank-wrap--digit' }, input),
        set: show,
        lock(l) {
          input.readOnly = l;
          input.tabIndex = l ? -1 : 0;
        },
      };
    }

    /** Căsuța „ține minte” de deasupra unei coloane: opțională, nu se notează, se păstrează în ciornă sub ~<rând>.<loc>. */
    function helperWidget(key, label) {
      const input = h('input', {
        class: 'ex-minte',
        type: 'text',
        inputmode: 'numeric',
        pattern: '[0-9]*',
        maxlength: '2',
        autocomplete: 'off',
        spellcheck: 'false',
        'aria-label': label,
        'data-testid': `minte-${key.slice(1).replace('.', '-')}`,
      });
      const show = (v) => {
        input.value = v === undefined || v === null ? '' : String(v);
        input.classList.toggle('has-value', input.value !== '');
      };
      input.addEventListener('input', () => {
        show(input.value.replace(/\D/g, '').slice(0, 2));
        change(key, input.value);
      });
      return {
        wrap: h('span', { class: 'ex-minte-wrap' }, input),
        set: show,
        lock(l) {
          input.readOnly = l;
          input.tabIndex = l ? -1 : 0;
        },
        helper: true,
        solution: null,
        input,
      };
    }

    for (const [id, blank] of Object.entries(blanks)) {
      if (part.layout === 'column') widgets[id] = digitWidget(id);
      else widgets[id] = ['relation', 'sign', 'select'].includes(kindOf(blank)) ? segmentWidget(id, blank) : numberWidget(id, blank);
    }

    /** Un calcul în scris: coloanele (M, S, Z, U), căsuțele „ține minte”, termenii, semnul, linia și rezultatul. */
    function renderColumn(row) {
      const cols = Math.max(row.result.length, ...row.terms.map((t) => t.length));
      const places = Array.from({ length: cols }, (_, i) => LOCURI[cols - 1 - i]);
      const cells = [];
      for (const p of places) cells.push(h('span', { class: `ex-col__place c-pv--${p}`, 'aria-hidden': 'true' }, PLACE_LETTER[p]));
      cells.push(h('span', { class: 'ex-col__gap', 'aria-hidden': 'true' }));
      const marks = row.solution ? marcajeTrecere(row.op, columnNumbers(row)) : {};
      for (const p of places) {
        const wanted = part.minte !== false && (row.op === '-' || p !== 'u');
        if (!wanted) {
          cells.push(h('span', { class: 'ex-col__gap', 'aria-hidden': 'true' }));
          continue;
        }
        const key = `~${row.index}.${p}`;
        const w = helperWidget(key, `Ține minte la ${PLACE_NAME[p]} (opțional): ${row.tpl.replace(/\[\[\w+\]\]/g, '…').replace(/…+/g, '…')}`);
        w.solution = marks[p] ?? '';
        widgets[key] = w;
        cells.push(h('span', { class: 'ex-col__cell ex-col__cell--minte' }, w.wrap));
      }
      cells.push(h('span', { class: 'ex-col__gap', 'aria-hidden': 'true' }));
      const line = (list, extra, sign) => {
        const pad = cols - list.length;
        for (let i = 0; i < cols; i++) {
          const c = list[i - pad];
          if (!c) cells.push(h('span', { class: `ex-col__cell ${extra}` }));
          else if (c.id) cells.push(h('span', { class: `ex-col__cell ${extra}` }, widgets[c.id]?.wrap ?? ''));
          else cells.push(h('span', { class: `ex-col__cell ex-col__digit ${extra}`, 'aria-hidden': 'true' }, String(c.d)));
        }
        cells.push(h('span', { class: `ex-col__sign ${extra}`, 'aria-hidden': 'true' }, sign ?? ''));
      };
      row.terms.forEach((t, i) => line(t, '', i === 0 ? (row.op === '-' ? '−' : '+') : ''));
      line(row.result, 'is-result');
      // ordinea de completare: coloanele de la unități spre stânga, în fiecare coloană de sus în jos
      for (let k = 0; k < cols; k++) {
        for (const list of [...row.terms, row.result]) {
          const c = list[list.length - 1 - k];
          if (c?.id) order.push(c.id);
        }
      }
      return h(
        'figure',
        { class: 'ex-col', role: 'group', 'aria-label': `Calcul în scris: ${row.tpl.replace(/\[\[\w+\]\]/g, '…').replace(/…+/g, '…').replace(/-/g, '−')}`, style: { '--cols': cols } },
        row.label ? h('figcaption', { class: 'ex-col__label', html: md(row.label) }) : null,
        h('div', { class: 'ex-col__grid' }, cells),
      );
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
    } else if (layout === 'column') {
      body = h('div', { class: 'ex-cols' }, columnRows(part).filter((row) => !row.invalid).map(renderColumn));
    } else if (layout === 'pyramid') {
      body = h(
        'div',
        { class: 'ex-pyramids' },
        (part.pyramids ?? []).map((p) =>
          h(
            'div',
            { class: 'ex-pyramid' },
            (p.rows ?? []).map((row) => h('div', { class: 'ex-pyramid__row' }, row.map((c) => h('span', { class: 'ex-brick' }, renderTemplate(String(c), 'ex-tpl ex-brick__tpl'))))),
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
        for (const w of Object.values(widgets)) {
          w.lock(isLocked(m));
          // la soluție, căsuțele „ține minte” arată ce se scrie deasupra coloanelor, ca în manual
          if (w.helper) {
            w.wrap.classList.toggle('is-solution', m === 'solution');
            if (m === 'solution') w.set(w.solution);
          }
        }
      },
      showResult(res) {
        const notes = [];
        for (const r of res.items) {
          const w = widgets[r.id];
          if (!w) continue;
          w.wrap.querySelector('.ex-expected')?.remove();
          setState(w.wrap, r.ok ? 'correct' : 'wrong');
          const expected = kindOf(blanks[r.id]) === 'sign' ? niceMinus(r.expected) : String(r.expected);
          if (!r.ok) w.wrap.append(expectedTag(expected));
          if (r.feedback) notes.push(r.feedback);
        }
        feedbackArea.replaceChildren(...[...new Set(notes)].map((n) => feedbackBox(n)));
      },
      destroy() {},
    };
  },
};
