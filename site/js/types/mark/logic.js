// mark — atinge (colorează) elementele care respectă o condiție.
// O culoare:  { type:'mark', itemVisual:{ v:'shell' }, items:[{ id, n:14 }, …], rule:{ rule:'parity', even:true } }
//             (sau key:['s1','s3'], sau item.mark: true)
// Mai multe culori: { type:'mark', palette:[{ id:'verde', label:'nu se termină' }, { id:'rosu', label:'se termină' }],
//                     items:[{ id, text, visual?, color:'verde' }] }
// Credit (o culoare): (atinse corect − atinse greșit) / câte trebuiau atinse, minim 0.
// Răspuns: o culoare → [id, …]; mai multe culori → { [itemId]: colorId }

import { check } from '../../core/rules.js';
import { checkIds, countAnswered, isBlank } from '../_shared.js';

const byRule = (part) => part.items.filter((it) => check(part.rule, part.rule.of ? it : it.n)).map((it) => it.id);

export function keyOf(part) {
  if (part.palette) return Object.fromEntries(part.items.filter((it) => it.color).map((it) => [it.id, it.color]));
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
