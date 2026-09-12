// mark — atinge (colorează) elementele care respectă o condiție.
// O culoare:  { type:'mark', itemVisual:{ v:'shell' }, items:[{ id, n:14 }, …], rule:{ rule:'parity', even:true } }
//             (sau key:['s1','s3'], sau item.mark: true)
// Mai multe culori: { type:'mark', palette:[{ id:'verde', label:'nu se termină' }, { id:'rosu', label:'se termină' }],
//                     items:[{ id, text, visual?, color:'verde' }] }
// Reguli de set (sarcini deschise, mai multe soluții): { type:'mark', items:[{ id, text, n:120 }, …],
//   rules:{ count:{ min:3 }, sum:{ max:400 }, include?:[ids], exclude?:[ids], noun?:['produs','produse'], unit?:'lei' } }
//   → orice selecție care respectă regulile ia tot creditul (1 punct), altfel 0 și un mesaj cu prima regulă încălcată.
// Credit (o culoare): (atinse corect − atinse greșit) / câte trebuiau atinse, minim 0.
// Răspuns: o culoare → [id, …]; mai multe culori → { [itemId]: colorId }

import { plain } from '../../core/markup.js';
import { cantitate, singularOf } from '../../core/ro.js';
import { check } from '../../core/rules.js';
import { checkIds, countAnswered, isBlank } from '../_shared.js';

const byRule = (part) => part.items.filter((it) => check(part.rule, part.rule.of ? it : it.n)).map((it) => it.id);

// ——— reguli de set ———
const range = (r) => (typeof r === 'number' ? { min: r, max: r } : { min: r?.min ?? -Infinity, max: r?.max ?? Infinity });
const sumOf = (part, ids) => ids.reduce((s, id) => s + Number(part.items.find((it) => it.id === id)?.n ?? 0), 0);
const nounOf = (part) => part.rules?.noun ?? ['element', 'elemente'];
const nameOf = (part, id) => plain(String(part.items.find((it) => it.id === id)?.text ?? id));
const money = (part, n) => {
  const unit = part.rules?.unit ?? 'lei';
  return cantitate(n, singularOf(unit), unit);
};

/** Prima regulă de set încălcată de selecția `ids` (null dacă selecția e bună). Mesajele sunt pentru copil. */
export function setViolation(part, ids) {
  const r = part.rules ?? {};
  const [one, many] = nounOf(part);
  if (!ids.length) return `Alege cel puțin ${cantitate(Math.max(1, range(r.count).min === -Infinity ? 1 : range(r.count).min), one, many)}.`;
  const c = range(r.count);
  if (ids.length < c.min) return `Ai ales ${cantitate(ids.length, one, many)}; trebuie cel puțin ${cantitate(c.min, one, many)}.`;
  if (ids.length > c.max) return `Ai ales ${cantitate(ids.length, one, many)}; trebuie cel mult ${cantitate(c.max, one, many)}.`;
  if (r.sum !== undefined) {
    const s = range(r.sum);
    const total = sumOf(part, ids);
    if (total > s.max) return `Cele alese fac împreună ${money(part, total)}, mai mult decât ${money(part, s.max)}.`;
    if (total < s.min) return `Cele alese fac împreună ${money(part, total)}, mai puțin decât ${money(part, s.min)}.`;
  }
  for (const id of r.include ?? []) if (!ids.includes(id)) return `Trebuie să alegi și „${nameOf(part, id)}”.`;
  for (const id of r.exclude ?? []) if (ids.includes(id)) return `„${nameOf(part, id)}” nu are voie aici.`;
  return null;
}

/** O selecție care respectă regulile (cea cu cele mai puține elemente, apoi primele din listă); null dacă nu există. */
export function firstValidSet(part) {
  const ids = part.items.map((it) => it.id);
  const n = ids.length;
  const masks = Array.from({ length: 2 ** n - 1 }, (_, i) => i + 1);
  const bits = (m) => m.toString(2).split('1').length - 1;
  masks.sort((a, b) => bits(a) - bits(b) || a - b);
  for (const m of masks) {
    const pick = ids.filter((_, i) => m & (1 << i));
    if (setViolation(part, pick) === null) return pick;
  }
  return null;
}

export function keyOf(part) {
  if (part.palette) return Object.fromEntries(part.items.filter((it) => it.color).map((it) => [it.id, it.color]));
  if (part.rules) return firstValidSet(part) ?? [];
  if (part.key) return [...part.key];
  if (part.rule) return byRule(part);
  return part.items.filter((it) => it.mark === true).map((it) => it.id);
}

export default {
  type: 'mark',

  validate(part) {
    const errors = [];
    if (!Array.isArray(part.items) || part.items.length < 2) return ['mark: sunt necesare cel puțin 2 elemente'];
    checkIds(part.items, 'mark.items', errors);
    if (part.rules) {
      const r = part.rules;
      if (part.rule || part.key || part.palette || part.items.some((it) => it.mark)) errors.push('mark: `rules` nu se combină cu rule, key, palette sau item.mark');
      if (part.items.length > 12) errors.push('mark: cu reguli de set, cel mult 12 elemente');
      if (r.sum !== undefined && part.items.some((it) => !Number.isFinite(Number(it.n)))) errors.push('mark: regula `sum` cere `n` numeric pe fiecare element');
      for (const id of [...(r.include ?? []), ...(r.exclude ?? [])]) if (!part.items.some((it) => it.id === id)) errors.push(`mark.rules: id necunoscut „${id}”`);
      if (!(range(r.count).min >= 1) && !(r.include?.length)) errors.push('mark.rules: pune count.min ≥ 1 sau include, altfel selecția goală ar fi corectă');
      if (!errors.length && !firstValidSet(part)) errors.push('mark: nicio selecție nu respectă regulile');
      return errors;
    }
    if (part.palette) {
      checkIds(part.palette, 'mark.palette', errors);
      const colors = part.palette.map((p) => p.id);
      for (const it of part.items) if (it.color && !colors.includes(it.color)) errors.push(`mark.${it.id}: culoarea „${it.color}” nu e în paletă`);
      if (!Object.keys(keyOf(part)).length) errors.push('mark: niciun element de colorat');
      return errors;
    }
    const key = keyOf(part);
    if (!key.length) errors.push('mark: niciun element de atins');
    if (key.length === part.items.length) errors.push('mark: toate elementele sunt corecte — nu există capcane');
    if (part.rule && (part.key || part.items.some((it) => it.mark))) {
      const declared = part.key ?? part.items.filter((it) => it.mark).map((it) => it.id);
      const fromRule = byRule(part);
      if ([...declared].sort().join() !== [...fromRule].sort().join()) {
        errors.push(`mark: regula dă ${fromRule.join(', ')}, dar sunt marcate ${declared.join(', ')}`);
      }
    }
    return errors;
  },

  count: (part) => (part.palette ? Object.keys(keyOf(part)).length : 1),
  answered: (part, ans) => (part.palette ? countAnswered(Object.keys(keyOf(part)), ans) : isBlank(ans) ? 0 : 1),
  empty: (part) => (part.palette ? {} : []),
  solution: (part) => keyOf(part),

  evaluate(part, ans) {
    if (part.rules) {
      const known = new Set(part.items.map((it) => it.id));
      const marked = [...new Set((Array.isArray(ans) ? ans : []).filter((id) => known.has(id)))];
      const feedback = setViolation(part, marked);
      const ok = feedback === null;
      const items = part.items.map((it) => ({ id: it.id, ok: marked.includes(it.id) ? ok : true, expected: null, given: marked.includes(it.id) }));
      const [one, many] = nounOf(part);
      const summary = marked.length ? `Ai ales ${cantitate(marked.length, one, many)}${part.rules.sum !== undefined ? `, împreună ${money(part, sumOf(part, marked))}` : ''}.` : null;
      return { items, earned: ok ? 1 : 0, total: 1, feedback, summary };
    }
    const key = keyOf(part);
    if (part.palette) {
      const given = ans ?? {};
      const items = part.items.map((it) => ({ id: it.id, ok: (given[it.id] ?? null) === (key[it.id] ?? null), expected: key[it.id] ?? null, given: given[it.id] ?? null }));
      const targets = Object.keys(key);
      const hits = targets.filter((id) => given[id] === key[id]).length;
      const wrong = Object.keys(given).filter((id) => given[id] && !key[id]).length;
      return { items, earned: Math.max(0, hits - wrong), total: targets.length };
    }
    const marked = new Set(Array.isArray(ans) ? ans : []);
    const inKey = new Set(key);
    const items = part.items.map((it) => ({ id: it.id, ok: marked.has(it.id) === inKey.has(it.id), expected: inKey.has(it.id), given: marked.has(it.id) }));
    const hits = key.filter((id) => marked.has(id)).length;
    const wrong = [...marked].filter((id) => !inKey.has(id)).length;
    return { items, earned: Math.max(0, hits - wrong), total: key.length };
  },
};
