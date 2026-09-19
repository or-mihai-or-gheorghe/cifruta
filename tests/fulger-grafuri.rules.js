// Regulile tipurilor cu hărți, rețele și arbori din Jocuri fulger (js/fulger/kinds-grafuri.js), verificate de tests/fulger.test.js pe
// întrebările generate. Fiecare regulă citește desenul (stațiile, liniile, minutele, legăturile, nodurile), află singură răspunsul cu
// codul ei (drumuri prin căutare în adâncime, vecini, sume pe ramuri, fapte despre animale copiate aici), cere să fie unul singur și
// verifică de cine sau de ce vorbește cerința.

import { numberAnswer, pickAnswer, says, solvedOk } from './fulger-grafice.rules.js';

const sum = (list) => list.reduce((s, x) => s + x, 0);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
/** Emoji-urile scrise în cerință ({{e:nume}}), în ordine. */
const tokens = (text) => [...text.matchAll(/\{\{e:([a-z0-9]+)\}\}/g)].map((m) => m[1]);

// numele cu articol, cum le spune cerința (tabel propriu)
const THE = {
  pisica: 'pisica', caine: 'câinele', urs: 'ursul', vulpe: 'vulpea', iepure: 'iepurele', leu: 'leul', tigru: 'tigrul', panda: 'panda',
  maimuta: 'maimuța', pinguin: 'pinguinul', bufnita: 'bufnița', papagal: 'papagalul', liliac: 'liliacul', fluture: 'fluturele',
  albina: 'albina', peste: 'peștele', delfin: 'delfinul', testoasa: 'broasca țestoasă',
};
// faptele sigure, copiate de mână: pene, zboară, înoată, patru picioare (lipsa unui fapt = întrebare nepermisă pentru animal)
const FACTS = {
  pinguin: { 'Are pene?': 'da', 'Zboară?': 'nu', 'Înoată?': 'da', '4 picioare?': 'nu' },
  bufnita: { 'Are pene?': 'da', 'Zboară?': 'da', 'Înoată?': 'nu', '4 picioare?': 'nu' },
  papagal: { 'Are pene?': 'da', 'Zboară?': 'da', 'Înoată?': 'nu', '4 picioare?': 'nu' },
  liliac: { 'Are pene?': 'nu', 'Zboară?': 'da' },
  fluture: { 'Are pene?': 'nu', 'Zboară?': 'da', '4 picioare?': 'nu' },
  albina: { 'Are pene?': 'nu', 'Zboară?': 'da', '4 picioare?': 'nu' },
  peste: { 'Are pene?': 'nu', 'Zboară?': 'nu', 'Înoată?': 'da', '4 picioare?': 'nu' },
  delfin: { 'Are pene?': 'nu', 'Zboară?': 'nu', 'Înoată?': 'da', '4 picioare?': 'nu' },
  testoasa: { 'Are pene?': 'nu', 'Zboară?': 'nu', '4 picioare?': 'da' },
  caine: { 'Are pene?': 'nu', 'Zboară?': 'nu', '4 picioare?': 'da' },
  pisica: { 'Are pene?': 'nu', 'Zboară?': 'nu', '4 picioare?': 'da' },
  urs: { 'Are pene?': 'nu', 'Zboară?': 'nu', '4 picioare?': 'da' },
  vulpe: { 'Are pene?': 'nu', 'Zboară?': 'nu', '4 picioare?': 'da' },
  leu: { 'Are pene?': 'nu', 'Zboară?': 'nu', '4 picioare?': 'da' },
};
const DRINK_NAMES = { lapte: 'lapte', suc: 'suc', apa: 'apă' };

/** Animalul numit în cerință (un singur nume din tabel, întreg). */
const namedIn = (text, ids) => ids.filter((id) => THE[id] && says(text, THE[id]));

// ——— hărțile ———
const segmentsOf = (f) => f.lines.flatMap((l) => l.stops.slice(1).map((id, i) => [l.stops[i], id]));
const isSegment = (f, a, b) => segmentsOf(f).some(([x, y]) => (x === a && y === b) || (x === b && y === a));
const minutesOf = (f, a, b) => f.minutes.find((m) => (m.a === a && m.b === b) || (m.a === b && m.b === a))?.n;
const pathMinutes = (f, path) => sum(path.slice(1).map((id, i) => minutesOf(f, path[i], id)));

/** Toate drumurile simple de la `from` la `to`, pe segmentele liniilor (căutare în adâncime). */
function allPaths(f, from, to) {
  const out = [];
  const walk = (path) => {
    const last = path.at(-1);
    if (last === to) return out.push(path);
    for (const [a, b] of segmentsOf(f)) {
      const next = a === last ? b : b === last ? a : null;
      if (next && !path.includes(next)) walk([...path, next]);
    }
  };
  walk([from]);
  return out;
}

// ——— rețelele și arborii ———
const friendsOf = (f, id) => f.edges.flatMap(([a, b]) => (a === id ? [b] : b === id ? [a] : []));
const kidsOf = (nodes, id) => nodes.filter((n) => n.parent === id);
const rootOf = (nodes) => nodes.find((n) => n.parent === undefined);
const tipsOf = (nodes) => nodes.filter((n) => !kidsOf(nodes, n.id).length);
/** Suma alunelor de pe ramurile de la rădăcină la nodul `id`. */
function nutsTo(nodes, id) {
  let total = 0;
  for (let n = nodes.find((x) => x.id === id); n && n.parent !== undefined; n = nodes.find((x) => x.id === n.parent)) total += n.edge;
  return total;
}

export const MAP_RULES = {
  'linie-statii': (q) => {
    const f = q.figure;
    const { a, b, line } = q.ask;
    const l = f?.lines.find((x) => x.n === line);
    if (f?.v !== 'metro' || f.plain || !l || !same(tokens(q.prompt), [a, b]) || !says(q.prompt, `linia ${line}`) || !solvedOk(q, ['path'])) return false;
    const [i, j] = [l.stops.indexOf(a), l.stops.indexOf(b)];
    return i >= 0 && j >= 0 && i !== j && numberAnswer(q, Math.abs(i - j) - 1);
  },

  'linie-care': (q) => {
    const f = q.figure;
    if (f?.v !== 'metro' || f.plain || !solvedOk(q, ['path'])) return false;
    const [a, b] = tokens(q.prompt);
    const through = f.lines.filter((l) => l.stops.includes(a) && l.stops.includes(b));
    // variantele sunt insignele tuturor liniilor de pe hartă
    const badges = q.choices.map((id) => q.options[id]).every((o) => o.v === 'line-badge' && f.lines.some((l) => l.n === o.n));
    return through.length === 1 && badges && pickAnswer(q, (o) => o.n === through[0].n);
  },

  'linie-ordine': (q) => {
    const f = q.figure;
    if (f?.v !== 'metro' || q.mode !== 'sort' || q.dir !== 'path' || !solvedOk(q, ['path'])) return false;
    const [from] = tokens(q.prompt);
    const l = f.lines.find((x) => says(q.prompt, `Linia ${x.n}`));
    if (!l || !from) return false;
    const stops = l.stops[0] === from ? l.stops : l.stops.at(-1) === from ? [...l.stops].reverse() : null;
    return Boolean(stops) && same(q.answer, stops.slice(1, 1 + q.tiles.length)) && q.tiles.every((t) => q.options[t].emoji === t);
  },

  'linie-schimb': (q) => {
    const f = q.figure;
    if (f?.v !== 'metro' || f.plain || !solvedOk(q, ['path'])) return false;
    const [a, b] = tokens(q.prompt);
    if (f.lines.some((l) => l.stops.includes(a) && l.stops.includes(b))) return false;
    // stațiile în care ajungi de la a fără schimbare și din care ajungi la b fără schimbare
    const via = f.stops.map((s) => s.id).filter((s) => f.lines.some((l) => l.stops.includes(a) && l.stops.includes(s)) && f.lines.some((l) => l.stops.includes(s) && l.stops.includes(b)));
    return via.length === 1 && pickAnswer(q, (o) => o.emoji === via[0]);
  },

  'drum-minute': (q) => {
    const f = q.figure;
    const path = f?.path ?? [];
    if (f?.v !== 'metro' || path.length < 3 || !path.slice(1).every((id, i) => isSegment(f, path[i], id)) || !solvedOk(q)) return false;
    return says(q.prompt, 'minute') && says(q.prompt, 'marcat') && numberAnswer(q, pathMinutes(f, path));
  },

  'drum-scurt': (q) => {
    const f = q.figure;
    if (f?.v !== 'metro' || !f.plain || !solvedOk(q, ['path'])) return false;
    const [from, to] = tokens(q.prompt);
    const totals = allPaths(f, from, to).map((p) => pathMinutes(f, p));
    const best = Math.min(...totals);
    return totals.length >= 2 && totals.filter((t) => t === best).length === 1 && numberAnswer(q, best);
  },

  'drum-compara': (q) => {
    const f = q.figure;
    if (f?.v !== 'metro' || !f.plain || q.mode !== 'compare' || !solvedOk(q) || f.routes?.length !== 2) return false;
    const [A, B] = ['A', 'B'].map((id) => f.routes.find((r) => r.id === id).path);
    if (![A, B].every((p) => p.slice(1).every((id, i) => isSegment(f, p[i], id))) || A[0] !== B[0] || A.at(-1) !== B.at(-1)) return false;
    const [ta, tb] = [pathMinutes(f, A), pathMinutes(f, B)];
    const sides = q.left.length === 1 && q.left[0].text === 'A' && q.right.length === 1 && q.right[0].text === 'B';
    return sides && q.answer === (ta < tb ? '<' : ta > tb ? '>' : '=');
  },

  prieteni: (q) => {
    const f = q.figure;
    if (f?.v !== 'network' || !solvedOk(q, ['markEdges'])) return false;
    const ids = f.nodes.map((n) => n.id);
    const named = namedIn(q.prompt, ids);
    if (q.ask.op === 'degree') return same(named, [q.ask.node]) && numberAnswer(q, friendsOf(f, q.ask.node).length);
    const degrees = ids.map((id) => friendsOf(f, id).length);
    const top = Math.max(...degrees);
    return named.length === 0 && degrees.filter((d) => d === top).length === 1 && pickAnswer(q, (o) => o.emoji === ids[degrees.indexOf(top)]);
  },

  'prieteni-comun': (q) => {
    const f = q.figure;
    if (f?.v !== 'network' || !solvedOk(q, ['markEdges'])) return false;
    const named = namedIn(q.prompt, f.nodes.map((n) => n.id));
    if (named.length !== 2) return false;
    const [a, b] = named;
    const both = friendsOf(f, a).filter((x) => x !== b && friendsOf(f, b).includes(x));
    return both.length === 1 && q.choices.every((id) => ![a, b].includes(q.options[id].emoji)) && pickAnswer(q, (o) => o.emoji === both[0]);
  },

  turneu: (q) => {
    const f = q.figure;
    if (f?.v !== 'bracket' || !solvedOk(q)) return false;
    // fiecare câștigător a jucat meciul lui; turneul se termină cu un campion
    let field = f.players;
    for (const winners of f.rounds) {
      if (winners.length !== field.length / 2 || !winners.every((w, i) => w === field[2 * i] || w === field[2 * i + 1])) return false;
      field = winners;
    }
    if (field.length !== 1) return false;
    const champion = field[0];
    const finalists = f.rounds.at(-2) ?? f.players;
    const named = namedIn(q.prompt, f.players);
    const { op } = q.ask;
    if (op === 'winner') return named.length === 0 && says(q.prompt, 'câștigat') && pickAnswer(q, (o) => o.emoji === champion);
    if (op === 'finalOpponent') {
      const [p] = named;
      return named.length === 1 && finalists.includes(p) && says(q.prompt, 'finală') && pickAnswer(q, (o) => o.emoji === finalists.find((x) => x !== p));
    }
    const [p] = named;
    return named.length === 1 && f.players.length === 8 && numberAnswer(q, f.rounds.filter((r) => r.includes(p)).length);
  },

  'arbore-sume': (q) => sumTreeRule(q, false),
  'arbore-sume-3': (q) => sumTreeRule(q, true),

  'arbore-alegeri': (q) => {
    const f = q.figure;
    if (f?.v !== 'tree' || !solvedOk(q)) return false;
    const root = rootOf(f.nodes);
    if (q.ask.op === 'leaves') return says(q.prompt, 'poate alege') && numberAnswer(q, tipsOf(f.nodes).length);
    const drink = kidsOf(f.nodes, root.id).find((d) => says(q.prompt, DRINK_NAMES[d.emoji]));
    return Boolean(drink) && numberAnswer(q, kidsOf(f.nodes, drink.id).length);
  },

  'arbore-clasificare': (q) => {
    const f = q.figure;
    if (f?.v !== 'tree' || !solvedOk(q)) return false;
    const named = namedIn(q.prompt, Object.keys(FACTS));
    if (named.length !== 1) return false;
    const facts = FACTS[named[0]];
    // coborâm din rădăcină pe ramura „da” sau „nu”; fiecare întrebare din arbore trebuie să aibă răspuns sigur pentru animal
    if (!f.nodes.filter((n) => kidsOf(f.nodes, n.id).length).every((n) => facts[n.text])) return false;
    let node = rootOf(f.nodes);
    while (kidsOf(f.nodes, node.id).length) node = kidsOf(f.nodes, node.id).find((k) => k.edge === facts[node.text]);
    return pickAnswer(q, (o) => o.text === node.text);
  },

  'veverita-drum': (q) => {
    const f = q.figure;
    if (f?.v !== 'tree' || f.style !== 'branch' || q.solved) return false;
    // drumul marcat: de la rădăcină la un capăt, fiecare nod copilul celui dinainte
    const path = f.mark ?? [];
    const ok = path[0] === rootOf(f.nodes).id && path.slice(1).every((id, i) => f.nodes.find((n) => n.id === id)?.parent === path[i]) && tipsOf(f.nodes).some((t) => t.id === path.at(-1));
    return ok && says(q.prompt, 'marcat') && numberAnswer(q, nutsTo(f.nodes, path.at(-1)));
  },

  'veverita-bogat': (q) => {
    const f = q.figure;
    if (f?.v !== 'tree' || f.style !== 'branch' || !solvedOk(q)) return false;
    const tips = tipsOf(f.nodes);
    const sums = tips.map((t) => nutsTo(f.nodes, t.id));
    const top = Math.max(...sums);
    return sums.filter((s) => s === top).length === 1 && pickAnswer(q, (o) => o.emoji === tips[sums.indexOf(top)].emoji);
  },
};

/** Arborele sumelor: fiecare nod cunoscut e suma copiilor cunoscuți; „?” se află dintr-un pas sau, cu o căsuță goală, din doi. */
function sumTreeRule(q, twoSteps) {
  const f = q.figure;
  if (f?.v !== 'tree' || !says(q.prompt, 'suma') || !solvedOk(q, ['nodes'])) return false;
  const nodes = f.nodes;
  const slots = nodes.filter((n) => n.slot);
  const blanks = nodes.filter((n) => n.blank);
  if (slots.length !== 1 || blanks.length !== (twoSteps ? 1 : 0)) return false;
  const value = new Map(nodes.filter((n) => Number.isInteger(n.value)).map((n) => [n.id, n.value]));
  // ce se poate afla: un nod din copiii lui, sau un copil din părinte minus frați; repetăm până nu se mai schimbă nimic
  for (let changed = true; changed; ) {
    changed = false;
    for (const n of nodes) {
      if (value.has(n.id)) continue;
      const kids = kidsOf(nodes, n.id);
      if (kids.length && kids.every((k) => value.has(k.id))) {
        value.set(n.id, sum(kids.map((k) => value.get(k.id))));
        changed = true;
        continue;
      }
      const parent = nodes.find((p) => p.id === n.parent);
      const sibs = parent ? kidsOf(nodes, parent.id).filter((s) => s.id !== n.id) : [];
      if (parent && value.has(parent.id) && sibs.every((s) => value.has(s.id))) {
        value.set(n.id, value.get(parent.id) - sum(sibs.map((s) => value.get(s.id))));
        changed = true;
      }
    }
  }
  const answer = value.get(slots[0].id);
  // la doi pași, „?” depinde de căsuța goală: e copilul ei
  const chain = !twoSteps || slots[0].parent === blanks[0].id;
  // desenul rezolvat are toate numerele, iar fiecare nod e suma copiilor
  const solved = q.solved.nodes;
  const consistent = solved.every((n) => !kidsOf(solved, n.id).length || n.value === sum(kidsOf(solved, n.id).map((k) => k.value)));
  return chain && consistent && solved.find((n) => n.id === slots[0].id)?.value === answer && answer > 0 && numberAnswer(q, answer);
}
