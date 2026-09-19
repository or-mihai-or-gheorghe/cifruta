// Grafuri mici, pure (Node le poate importa): vecinii și prietenii comuni într-o rețea, arborii dați ca listă de noduri cu părinte
// (copiii, frunzele, drumul de la rădăcină, suma de pe ramuri) și câștigurile unui jucător într-un turneu eliminatoriu.

/** Vecinii lui `id` într-o listă de muchii [[a, b], …]. */
export const neighbors = (edges, id) => edges.flatMap(([a, b]) => (a === id ? [b] : b === id ? [a] : []));
export const degree = (edges, id) => neighbors(edges, id).length;
/** Vecinii comuni ai lui `a` și `b`. */
export const common = (edges, a, b) => neighbors(edges, a).filter((x) => x !== b && neighbors(edges, b).includes(x));

/** Rețeaua e legată: din primul nod se ajunge la toate. */
export function connected(ids, edges) {
  if (!ids.length) return true;
  const seen = new Set([ids[0]]);
  const todo = [ids[0]];
  while (todo.length) for (const n of neighbors(edges, todo.pop())) if (!seen.has(n)) seen.add(n) && todo.push(n);
  return ids.every((id) => seen.has(id));
}

/** Copiii fiecărui nod dintr-un arbore dat ca listă { id, parent? }, în ordinea din listă. */
export function childrenOf(nodes) {
  const kids = new Map(nodes.map((n) => [n.id, []]));
  for (const n of nodes) if (n.parent != null) kids.get(n.parent)?.push(n.id);
  return kids;
}

export const leaves = (nodes) => {
  const kids = childrenOf(nodes);
  return nodes.filter((n) => !kids.get(n.id).length).map((n) => n.id);
};

/** Drumul de la rădăcină la nodul `id` (id-uri). */
export function pathTo(nodes, id) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const path = [];
  for (let n = byId.get(id); n; n = byId.get(n.parent)) path.unshift(n.id);
  return path;
}

/** Suma etichetelor de pe ramurile drumului spre `id` (eticheta ramurii stă pe copil, în `edge`). */
export function pathSum(nodes, id) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  return pathTo(nodes, id).slice(1).reduce((s, x) => s + Number(byId.get(x).edge), 0);
}

/** De câte ori a câștigat jucătorul `p` (apare printre câștigătorii fiecărui tur). */
export const bracketWins = (rounds, p) => rounds.filter((winners) => winners.includes(p)).length;
