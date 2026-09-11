// fill — completare de casete în șabloane: [[a]] marchează o casetă.
//
// Layout-uri:
//   inline / steps : rows: ['27 + 42 = [[a]]', { t:'7 zeci [[b]] 70', calc:'70 [[b]] 70', label? }]
//   table          : head: ['', 'Vineri', …], rows: [['Pepeni', '26', '[[a]]'], …], checks?: ['26 + 35 = [[b]]']
//   tree           : trees: [{ top:'47', left:'[[a]]', right:'[[b]]' }]           (verifică: left + right = top)
//   chain          : chains: [{ start:'25', steps:[{ op:'+18', out:'[[a]]' }, …] }] (verifică fiecare pas)
//
// Casete (blanks): { a: { kind:'number', answer | expr, search?, feedback? }, b: { kind:'relation' },
//                    c: { kind:'sign', answer:'−' }, d: { kind:'select', options:[…], answer }, e: { kind:'text', answer, accept? } }
// Semnele <, >, = se deduc automat din rând. Rândurile „pure” (doar numere și semne) sunt verificate automat.
// Răspuns: { [blankId]: valoare }

import { calc, hasRelation, holds, isPureMath, relation } from '../../core/expr.js';
import { searchNumbers } from '../../core/rules.js';
import { sameText } from '../../core/ro.js';
import { countAnswered, feedbackFor, isBlank, makeResult } from '../_shared.js';

const BLANK = /\[\[(\w+)\]\]/g;
const KINDS = ['number', 'relation', 'sign', 'select', 'text'];
const LAYOUTS = ['inline', 'steps', 'table', 'tree', 'chain'];

export const kindOf = (blank) => blank?.kind ?? 'number';
export const blanksIn = (tpl) => [...String(tpl ?? '').matchAll(BLANK)].map((m) => m[1]);
const normSign = (s) => String(s ?? '').replace(/[−–]/g, '-').trim();
const rowOf = (r) => (typeof r === 'string' ? { t: r } : r);

/** Toate șabloanele afișate, în ordinea din layout. */
export function templatesOf(part) {
  switch (part.layout ?? 'inline') {
    case 'inline':
    case 'steps':
      return (part.rows ?? []).map((r) => String(rowOf(r).t ?? ''));
    case 'table':
      return (part.rows ?? []).flat().map(String);
    case 'tree':
      return (part.trees ?? []).flatMap((t) => [t.top, t.left, t.right].map(String));
    case 'chain':
      return (part.chains ?? []).flatMap((c) => [String(c.start), ...c.steps.map((s) => String(s.out))]);
    default:
      return [];
  }
}

const PLACEHOLDER = { number: '1', relation: '=', sign: '+' };

function isCheckable(tpl, blanks) {
  const ids = blanksIn(tpl);
  if (ids.some((id) => !PLACEHOLDER[kindOf(blanks[id])])) return false;
  const probe = String(tpl).replace(BLANK, (m, id) => PLACEHOLDER[kindOf(blanks[id])]);
  try {
    return isPureMath(probe) && hasRelation(probe);
  } catch {
    return false;
  }
}

/** Relațiile care trebuie să fie adevărate cu răspunsurile corecte. */
export function checksOf(part) {
  const blanks = part.blanks ?? {};
  const out = [];
  const layout = part.layout ?? 'inline';
  if (layout === 'inline' || layout === 'steps') {
    for (const r of part.rows ?? []) {
      const row = rowOf(r);
      if (row.calc === false) continue;
      if (row.calc) out.push(row.calc);
      else if (isCheckable(row.t, blanks)) out.push(row.t);
    }
  }
  if (layout === 'tree') for (const t of part.trees ?? []) out.push(`${t.left} + ${t.right} = ${t.top}`);
  if (layout === 'chain') {
    for (const c of part.chains ?? []) {
      let prev = String(c.start);
      for (const s of c.steps) {
        out.push(`${prev} ${s.op} = ${s.out}`);
        prev = String(s.out);
      }
    }
  }
  for (const extra of part.checks ?? []) out.push(extra);
  return out;
}

function substitute(tpl, values, blanks) {
  return String(tpl).replace(BLANK, (m, id) => {
    const v = values[id];
    if (v === undefined || v === null) throw new Error(`caseta [[${id}]] nu are valoare`);
    return kindOf(blanks[id]) === 'sign' ? normSign(v) : String(v);
  });
}

/** Răspunsurile corecte pentru fiecare casetă (cu semnele <, >, = deduse). */
export function keyOf(part) {
  const blanks = part.blanks ?? {};
  const key = {};
  for (const [id, b] of Object.entries(blanks)) {
    const kind = kindOf(b);
    if (kind === 'number') key[id] = b.answer ?? (b.expr !== undefined ? calc(b.expr) : undefined);
    else if (b.answer !== undefined) key[id] = b.answer;
  }
  const checks = checksOf(part);
  for (const [id, b] of Object.entries(blanks)) {
    if (kindOf(b) !== 'relation' || key[id] !== undefined) continue;
    const src = checks.find((s) => blanksIn(s).includes(id));
    if (!src) continue;
    const [left, right] = src.split(`[[${id}]]`);
    try {
      key[id] = relation(calc(substitute(left, key, blanks)), calc(substitute(right, key, blanks)));
    } catch {
      /* raportat de validate */
    }
  }
  return key;
}

function matches(blank, given, expected) {
  if (isBlank(given) || expected === undefined) return false;
  switch (kindOf(blank)) {
    case 'number':
      return /^\s*\d+\s*$/.test(String(given)) && Number(given) === Number(expected);
    case 'sign':
      return normSign(given) === normSign(expected);
    case 'text':
      return [expected, ...(blank.accept ?? [])].some((t) => sameText(given, t, { ignoreDiacritics: blank.ignoreDiacritics }));
    default:
      return String(given) === String(expected);
  }
}

const ADDITION = /^\s*\[\[(\w+)\]\]\s*\+\s*\[\[(\w+)\]\]\s*=/;

export default {
  type: 'fill',

  validate(part) {
    const errors = [];
    const blanks = part.blanks ?? {};
    const layout = part.layout ?? 'inline';
    if (!LAYOUTS.includes(layout)) return [`fill: layout necunoscut „${layout}”`];
    const used = new Set(templatesOf(part).flatMap(blanksIn));
    if (!used.size) errors.push('fill: nicio casetă [[x]] în șabloane');
    for (const id of used) if (!blanks[id]) errors.push(`fill: caseta [[${id}]] nu este definită în „blanks”`);
    for (const [id, b] of Object.entries(blanks)) {
      const kind = kindOf(b);
      if (!used.has(id)) errors.push(`fill: caseta „${id}” nu apare în șabloane`);
      if (!KINDS.includes(kind)) errors.push(`fill.${id}: tip de casetă necunoscut „${kind}”`);
      if (kind === 'number' && b.answer === undefined && b.expr === undefined) errors.push(`fill.${id}: lipsește answer sau expr`);
      if (kind === 'sign' && !['+', '-', '−'].includes(b.answer)) errors.push(`fill.${id}: semnul trebuie să fie + sau −`);
      if (kind === 'select' && !(b.options ?? []).map(String).includes(String(b.answer))) errors.push(`fill.${id}: răspunsul nu e printre opțiuni`);
      if (kind === 'text' && !b.answer) errors.push(`fill.${id}: lipsește answer`);
    }
    if (errors.length) return errors;

    let key;
    try {
      key = keyOf(part);
    } catch (e) {
      return [`fill: nu pot calcula răspunsurile (${e.message})`];
    }
    for (const [id, b] of Object.entries(blanks)) {
      if (key[id] === undefined) errors.push(`fill.${id}: nu pot deduce răspunsul`);
      if (kindOf(b) === 'number' && b.answer !== undefined && b.expr !== undefined && calc(b.expr) !== b.answer) {
        errors.push(`fill.${id}: ${b.expr} = ${calc(b.expr)}, nu ${b.answer}`);
      }
      if (b.search) {
        const found = searchNumbers(b.search);
        const pick = b.search.pick ?? 'unique';
        const want = pick === 'max' ? Math.max(...found) : pick === 'min' ? Math.min(...found) : found.length === 1 ? found[0] : NaN;
        if (want !== key[id]) errors.push(`fill.${id}: căutarea dă [${found.join(', ')}] (${pick}), nu ${key[id]}`);
      }
    }
    for (const src of checksOf(part)) {
      try {
        if (!holds(substitute(src, key, blanks))) errors.push(`fill: relația „${substitute(src, key, blanks)}” este falsă`);
      } catch (e) {
        errors.push(`fill: nu pot verifica „${src}” (${e.message})`);
        continue;
      }
      const signs = blanksIn(src).filter((id) => kindOf(blanks[id]) === 'sign');
      if (signs.length) {
        let solutions = 0;
        for (let mask = 0; mask < 2 ** signs.length; mask++) {
          const trial = { ...key };
          signs.forEach((id, i) => { trial[id] = mask & (1 << i) ? '-' : '+'; });
          if (holds(substitute(src, trial, blanks))) solutions++;
        }
        if (solutions !== 1) errors.push(`fill: „${src}” are ${solutions} variante corecte de semne (trebuie una)`);
      }
    }
    return errors;
  },

  count: (part) => Object.keys(part.blanks ?? {}).length,
  answered: (part, ans) => countAnswered(Object.keys(part.blanks ?? {}), ans),
  empty: () => ({}),
  solution: (part) => keyOf(part),

  evaluate(part, ans) {
    const blanks = part.blanks ?? {};
    const key = keyOf(part);
    const given = ans ?? {};
    const ok = {};
    for (const [id, b] of Object.entries(blanks)) ok[id] = matches(b, given[id], key[id]);
    // la adunare, termenii pot fi scriși în orice ordine: [[a]] + [[b]] = …
    for (const tpl of templatesOf(part)) {
      const m = ADDITION.exec(tpl);
      if (!m) continue;
      const [, a, b] = m;
      if (ok[a] && ok[b]) continue;
      const g = [Number(given[a]), Number(given[b])].sort((x, y) => x - y);
      const k = [Number(key[a]), Number(key[b])].sort((x, y) => x - y);
      if (!isBlank(given[a]) && !isBlank(given[b]) && g[0] === k[0] && g[1] === k[1]) ok[a] = ok[b] = true;
    }
    return makeResult(
      Object.keys(blanks).map((id) => ({
        id,
        ok: ok[id],
        expected: key[id],
        given: given[id] ?? null,
        feedback: ok[id] ? null : feedbackFor(blanks[id].feedback, given[id]),
      })),
    );
  },
};
