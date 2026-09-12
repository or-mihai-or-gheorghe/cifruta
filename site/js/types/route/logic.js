// route — atinge stațiile în ordine pe o hartă de linii (tramvai, metrou, autobuz).
// { type:'route', map:{ w, h, stops:[{ id, label, x, y, side? }], lines:[{ id, label, color, stops:[ids] }] },
//   from:'gara', to:'teatru', key:['gara','piata','teatru']            ← drumul cerut (trebuie să fie singurul cel mai scurt)
//   sau rules:{ via?:[ids], avoid?:[ids], maxStops?:n, maxChanges?:n, lines?:[lineIds] }  ← orice drum care respectă regulile
// Răspuns: [stopId, …], începând cu `from`; null până la a doua stație.
// Credit: cu key → 1 pentru drumul cerut, 0,5 pentru alt drum bun (mai lung), 0 altfel; cu rules → 1 sau 0.

import { plain } from '../../core/markup.js';
import { cantitate } from '../../core/ro.js';
import { checkIds, makeResult } from '../_shared.js';

const MAX_STOPS = 12;

export const stopsById = (map) => Object.fromEntries((map?.stops ?? []).map((s) => [s.id, s]));
const labelOf = (map, id) => plain(String(stopsById(map)[id]?.label ?? id));

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
  if (r.lines?.length) {
    const allowed = new Set(r.lines);
    const bad = [...linesUsed(map, path)].filter((l) => !allowed.has(l));
    if (bad.length && ![...linesUsed(map, path)].some((l) => allowed.has(l))) return 'Folosește doar liniile cerute.';
  }
  return null;
}

/** Drumurile bune pentru exercițiu (respectă regulile), ordonate: cele mai scurte primele, apoi alfabetic. */
export function validPaths(part) {
  return simplePaths(part.map, part.from, part.to)
    .filter((p) => violation(part, p) === null)
    .sort((a, b) => a.length - b.length || a.join().localeCompare(b.join()));
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
    if (Boolean(part.key) === Boolean(part.rules)) errors.push('route: exact unul dintre `key` și `rules`');
    if (map.stops.length > MAX_STOPS) errors.push(`route: cel mult ${MAX_STOPS} stații pe hartă`);
    if (errors.length) return errors;
    const all = simplePaths(map, part.from, part.to);
    if (!all.length) errors.push('route: nu există niciun drum de la plecare la sosire');
    if (part.key) {
      const bad = violation({ ...part, rules: undefined }, part.key);
      if (bad) errors.push(`route.key: ${bad}`);
      else {
        const shortest = Math.min(...all.map((p) => p.length));
        const shortestPaths = all.filter((p) => p.length === shortest);
        if (part.key.length !== shortest) errors.push(`route.key: există un drum mai scurt (${shortest} stații)`);
        else if (shortestPaths.length > 1) errors.push(`route.key: sunt ${shortestPaths.length} drumuri la fel de scurte — folosește rules`);
      }
    } else {
      for (const id of [...(part.rules.via ?? []), ...(part.rules.avoid ?? [])]) if (!ids.has(id)) errors.push(`route.rules: stație necunoscută „${id}”`);
      for (const l of part.rules.lines ?? []) if (!map.lines.some((x) => x.id === l)) errors.push(`route.rules: linie necunoscută „${l}”`);
      if (!errors.length && !validPaths(part).length) errors.push('route: niciun drum nu respectă regulile');
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
        feedback = 'Ai ajuns! Există însă un drum cu mai puține stații.';
      }
    }
    return makeResult([{ id: 'path', ok: credit === 1, credit, expected, given: given.length ? given : null, feedback }]);
  },
};
