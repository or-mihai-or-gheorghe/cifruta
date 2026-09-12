// route — atinge stațiile în ordine pe o hartă de linii (tramvai, metrou, autobuz) sau de drumuri cu ramificații.
// { type:'route', map:{ w, h, stops:[{ id, label, x, y, side? }], lines:[{ id, label, color, stops:[ids] }],
//                       segments?:[{ a, b, n }], unit?:'pași', unitOne?:'pas', transfer?:5 },
//   from, to,
//   rules?:{ via?, avoid?, maxStops?, maxChanges?, maxTotal?, lines? }  ← ce trebuie să respecte un drum bun
//   key?:[ids]  ← drumul cerut: singurul cel mai scurt dintre drumurile bune (se poate combina cu rules) }
// Lungimea unui drum: suma segmentelor (sau numărul de pași, fără segments) + `transfer` la fiecare schimbare de linie.
// Răspuns: [stopId, …], începând cu `from`; null până la a doua stație.
// Credit: cu key → 1 pentru drumul cerut, 0,5 pentru alt drum bun, 0 altfel; doar cu rules → 1 sau 0.

import { plain } from '../../core/markup.js';
import { cantitate, singularOf } from '../../core/ro.js';
import { checkIds, makeResult } from '../_shared.js';

const MAX_STOPS = 12;

export const stopsById = (map) => Object.fromEntries((map?.stops ?? []).map((s) => [s.id, s]));
const labelOf = (map, id) => plain(String(stopsById(map)[id]?.label ?? id));
export const isWeighted = (map) => Array.isArray(map?.segments) && map.segments.length > 0;
const quantity = (map, n) => (map?.unit ? cantitate(n, map.unitOne ?? singularOf(map.unit), map.unit) : String(n));

/** Lungimea unui segment: din `segments`, sau 1 când harta nu are lungimi (NaN dacă lipsește). */
export function weightOf(map, a, b) {
  if (!isWeighted(map)) return 1;
  const s = map.segments.find((x) => (x.a === a && x.b === b) || (x.a === b && x.b === a));
  return s ? Number(s.n) : NaN;
}

/** Lungimea unui drum: segmentele plus timpul de schimbare la fiecare schimbare de linie. */
export function costOf(map, path) {
  let total = 0;
  for (let i = 0; i + 1 < path.length; i++) total += weightOf(map, path[i], path[i + 1]);
  return total + changesOf(map, path) * Number(map?.transfer ?? 0);
}

/** Vecinii fiecărei stații și liniile care leagă două stații consecutive. */
export function adjacency(map) {
  const next = {};
  const edgeLines = {};
  for (const line of map?.lines ?? []) {
    const stops = line.stops ?? [];
    for (let i = 0; i + 1 < stops.length; i++) {
      const [a, b] = [stops[i], stops[i + 1]];
      (next[a] ??= new Set()).add(b);
      (next[b] ??= new Set()).add(a);
      (edgeLines[`${a}|${b}`] ??= new Set()).add(line.id);
      (edgeLines[`${b}|${a}`] ??= new Set()).add(line.id);
    }
  }
  return { next, edgeLines };
}

export const isAdjacent = (map, a, b) => adjacency(map).next[a]?.has(b) ?? false;

/** Cel mai mic număr de schimbări de linie de-a lungul unui drum. */
export function changesOf(map, path) {
  const { edgeLines } = adjacency(map);
  let current = null;
  let changes = 0;
  for (let i = 0; i + 1 < path.length; i++) {
    const lines = edgeLines[`${path[i]}|${path[i + 1]}`] ?? new Set();
    if (current === null) current = new Set(lines);
    else {
      const both = [...current].filter((l) => lines.has(l));
      if (both.length) current = new Set(both);
      else {
        changes++;
        current = new Set(lines);
      }
    }
  }
  return changes;
}

/** Liniile folosite de un drum (cel puțin una pe fiecare pas). */
const linesUsed = (map, path) => {
  const { edgeLines } = adjacency(map);
  const used = new Set();
  for (let i = 0; i + 1 < path.length; i++) for (const l of edgeLines[`${path[i]}|${path[i + 1]}`] ?? []) used.add(l);
  return used;
};

/** Toate drumurile simple (fără stații repetate) de la `from` la `to`, de cel mult `limit` stații. */
export function simplePaths(map, from, to, limit = MAX_STOPS) {
  const { next } = adjacency(map);
  const out = [];
  const walk = (path) => {
    const last = path[path.length - 1];
    if (last === to) {
      out.push([...path]);
      return;
    }
    if (path.length >= limit) return;
    for (const n of next[last] ?? []) if (!path.includes(n)) walk([...path, n]);
  };
  if (from !== undefined) walk([from]);
  return out;
}

/** Prima problemă a drumului dat (null dacă e un drum bun pentru exercițiu). */
export function violation(part, path) {
  const map = part.map;
  const known = stopsById(map);
  if (!Array.isArray(path) || path.length < 2) return 'Atinge stațiile pe rând, de la plecare până la sosire.';
  if (path.some((id) => !known[id]) || new Set(path).size !== path.length) return 'Traseul trece de două ori prin aceeași stație.';
  if (path[0] !== part.from) return `Pornește de la stația ${labelOf(map, part.from)}.`;
  for (let i = 0; i + 1 < path.length; i++) {
    if (!isAdjacent(map, path[i], path[i + 1])) return `Între ${labelOf(map, path[i])} și ${labelOf(map, path[i + 1])} nu e nicio linie: mergi din stație în stație.`;
  }
  if (path[path.length - 1] !== part.to) return `Traseul nu ajunge la ${labelOf(map, part.to)}.`;
  const r = part.rules;
  if (!r) return null;
  for (const id of r.via ?? []) if (!path.includes(id)) return `Traseul trebuie să treacă prin ${labelOf(map, id)}.`;
  for (const id of r.avoid ?? []) if (path.includes(id)) return `Traseul nu are voie să treacă prin ${labelOf(map, id)}.`;
  if (r.maxStops !== undefined && path.length > r.maxStops) return `Traseul are ${cantitate(path.length, 'stație', 'stații')}; sunt permise cel mult ${cantitate(r.maxStops, 'stație', 'stații')}.`;
  if (r.maxChanges !== undefined && changesOf(map, path) > r.maxChanges) return r.maxChanges === 0 ? 'Traseul trebuie să rămână pe o singură linie.' : `Ai schimbat linia de prea multe ori (cel mult ${cantitate(r.maxChanges, 'schimbare', 'schimbări')}).`;
  if (r.maxTotal !== undefined && costOf(map, path) > r.maxTotal) return `Traseul are ${quantity(map, costOf(map, path))}; sunt permise cel mult ${quantity(map, r.maxTotal)}.`;
  if (r.lines?.length) {
    const allowed = new Set(r.lines);
    const bad = [...linesUsed(map, path)].filter((l) => !allowed.has(l));
    if (bad.length && ![...linesUsed(map, path)].some((l) => allowed.has(l))) return 'Folosește doar liniile cerute.';
  }
  return null;
}

/** Drumurile bune pentru exercițiu (respectă regulile), ordonate: cele mai scurte (după lungime) primele, apoi alfabetic. */
export function validPaths(part) {
  return simplePaths(part.map, part.from, part.to)
    .filter((p) => violation(part, p) === null)
    .sort((a, b) => costOf(part.map, a) - costOf(part.map, b) || a.length - b.length || a.join().localeCompare(b.join()));
}

export const keyOf = (part) => (part.key ? [...part.key] : (validPaths(part)[0] ?? null));

export default {
  type: 'route',

  validate(part) {
    const errors = [];
    const map = part.map;
    if (!map || !Array.isArray(map.stops) || map.stops.length < 2) return ['route: harta are nevoie de cel puțin 2 stații'];
    checkIds(map.stops, 'route.map.stops', errors);
    const ids = new Set(map.stops.map((s) => s.id));
    for (const s of map.stops) if (!Number.isFinite(Number(s.x)) || !Number.isFinite(Number(s.y))) errors.push(`route.map.stops.${s.id}: lipsesc coordonatele x, y`);
    if (!Array.isArray(map.lines) || !map.lines.length) errors.push('route: harta are nevoie de cel puțin o linie');
    checkIds(map.lines ?? [], 'route.map.lines', errors);
    for (const l of map.lines ?? []) {
      if (!Array.isArray(l.stops) || l.stops.length < 2) errors.push(`route.map.lines.${l.id}: o linie are cel puțin 2 stații`);
      for (const id of l.stops ?? []) if (!ids.has(id)) errors.push(`route.map.lines.${l.id}: stație necunoscută „${id}”`);
    }
    if (!ids.has(part.from)) errors.push(`route: stația de plecare „${part.from}” nu există`);
    if (!ids.has(part.to)) errors.push(`route: stația de sosire „${part.to}” nu există`);
    if (part.from === part.to) errors.push('route: plecarea și sosirea trebuie să fie stații diferite');
    if (!part.key && !part.rules) errors.push('route: e nevoie de `key`, de `rules` sau de amândouă');
    if (map.stops.length > MAX_STOPS) errors.push(`route: cel mult ${MAX_STOPS} stații pe hartă`);
    if (isWeighted(map)) {
      for (const s of map.segments) {
        if (!ids.has(s.a) || !ids.has(s.b)) errors.push(`route.map.segments: stație necunoscută în „${s.a}–${s.b}”`);
        else if (!isAdjacent(map, s.a, s.b)) errors.push(`route.map.segments: „${s.a}–${s.b}” nu e segmentul niciunei linii`);
        if (!(Number.isInteger(s.n) && s.n > 0)) errors.push(`route.map.segments: lungimea „${s.a}–${s.b}” trebuie să fie un număr întreg pozitiv`);
      }
      for (const l of map.lines ?? []) {
        for (let i = 0; i + 1 < (l.stops ?? []).length; i++) {
          if (Number.isNaN(weightOf(map, l.stops[i], l.stops[i + 1]))) errors.push(`route.map.segments: lipsește lungimea „${l.stops[i]}–${l.stops[i + 1]}”`);
        }
      }
    }
    if (part.rules) {
      for (const id of [...(part.rules.via ?? []), ...(part.rules.avoid ?? [])]) if (!ids.has(id)) errors.push(`route.rules: stație necunoscută „${id}”`);
      for (const l of part.rules.lines ?? []) if (!(map.lines ?? []).some((x) => x.id === l)) errors.push(`route.rules: linie necunoscută „${l}”`);
    }
    if (errors.length) return errors;
    if (!simplePaths(map, part.from, part.to).length) return ['route: nu există niciun drum de la plecare la sosire'];
    const good = validPaths(part);
    if (!good.length) return ['route: niciun drum nu respectă regulile'];
    if (part.key) {
      const bad = violation(part, part.key);
      if (bad) return [`route.key: ${bad}`];
      const best = costOf(map, good[0]);
      const ties = good.filter((p) => costOf(map, p) === best);
      const what = isWeighted(map) ? quantity(map, best) : cantitate(good[0].length, 'stație', 'stații');
      if (costOf(map, part.key) !== best) errors.push(`route.key: există un drum mai scurt (${what})`);
      else if (ties.length > 1) errors.push(`route.key: sunt ${ties.length} drumuri la fel de scurte`);
    }
    return errors;
  },

  count: () => 1,
  answered: (part, ans) => (Array.isArray(ans) && ans.length >= 2 ? 1 : 0),
  empty: () => null,
  solution: (part) => keyOf(part),

  evaluate(part, ans) {
    const expected = keyOf(part);
    const given = Array.isArray(ans) ? ans.filter((id) => typeof id === 'string') : [];
    let feedback = violation(part, given);
    let credit = 0;
    if (feedback === null) {
      if (!part.key || given.join() === expected.join()) credit = 1;
      else {
        credit = 0.5;
        feedback = isWeighted(part.map)
          ? `Ai ajuns! Drumul tău are ${quantity(part.map, costOf(part.map, given))}, dar există unul mai scurt.`
          : 'Ai ajuns! Există însă un drum cu mai puține stații.';
      }
    }
    return makeResult([{ id: 'path', ok: credit === 1, credit, expected, given: given.length ? given : null, feedback }]);
  },
};
