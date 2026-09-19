// Jocuri fulger: tipurile temei „Hărți și arbori”: hărți de linii (stații, schimbări, minute, drumuri), rețele de prieteni, turnee și
// arbori (sume, alegeri, clasificare, crengile veveriței). Ca la grafice, desenul are datele, `ask` spune ce se întreabă, iar regulile
// din tests/fulger-grafuri.rules.js găsesc singure răspunsul. Stațiile sunt emoji-uri, scrise în cerință cu {{e:nume}}. Hărțile
// pornesc de la machete pe o rețea de 4 × 3 puncte (liniile se întâlnesc doar în stații), cu emoji, minute și numere de linie alese
// la întâmplare și, uneori, oglindite.

import { bracketWins, childrenOf, common, connected, degree, leaves, neighbors, pathSum, pathTo } from '../core/grafuri.js';
import { drawnCompare, drawnSort, numberQuestion, pickQuestion } from './intrebari.js';
import { distinct, int, pickOne, shuffle } from './rand.js';

const HARTA = 'mat.geo.harta-linii';
const DURATA = 'mat.mas.durata';
const O_OP = 'mat.pb.o-operatie';
const COMPARARE = 'mat.nr100.comparare';
const RETELE = 'mat.log.retele';
const ARBORI = 'mat.log.arbori';
const NECUNOSCUT = 'mat.op.necunoscut';
const CLASIFICARE = 'mat.log.clasificare';

const sum = (list) => list.reduce((s, x) => s + x, 0);
const e = (name) => `{{e:${name}}}`;
const pair = (list) => list.slice(1).map((id, i) => [list[i], id]);

// ——— Hărțile ———
const PLACES = ['scoala', 'spital', 'gara', 'castel', 'stadion', 'casa', 'parc', 'muzeu', 'biblioteca', 'circ', 'roata', 'fantana', 'magazin'];
export const PLACE_NAMES = {
  scoala: 'școală', spital: 'spital', gara: 'gară', castel: 'castel', stadion: 'stadion', casa: 'casă', parc: 'parc', muzeu: 'muzeu',
  biblioteca: 'bibliotecă', circ: 'circ', roata: 'roata mare', fantana: 'fântână', magazin: 'magazin',
};
const X = [55, 125, 195, 265];
const Y = [45, 110, 175];
// liniile, ca drumuri pe rețea [coloană, rând]; se ating doar în stații
const MAPS = {
  cruce: [[[0, 1], [1, 1], [2, 1], [3, 1]], [[2, 0], [2, 1], [2, 2]]],
  lungi: [[[0, 0], [1, 0], [2, 0], [3, 0], [3, 1]], [[0, 2], [1, 2], [2, 2], [2, 1], [2, 0]]],
  trei: [[[0, 1], [1, 1], [2, 1], [3, 1]], [[1, 0], [1, 1], [1, 2]], [[3, 0], [3, 1], [3, 2]]],
  stea: [[[0, 1], [1, 1], [2, 1], [3, 1]], [[1, 0], [1, 1], [1, 2]], [[0, 0], [1, 1], [2, 2]], [[0, 2], [1, 1], [2, 0]]],
  bucla: [[[0, 1], [1, 0], [2, 0], [3, 1]], [[0, 1], [1, 2], [2, 2], [3, 1]], [[0, 1], [3, 1]]],
};

/** O hartă din machetă: stații cu emoji diferite, oglindită la întâmplare, cu numerele liniilor amestecate. */
function buildMap(rand, name) {
  const [flipX, flipY] = [rand() < 0.5, rand() < 0.5];
  const lines = MAPS[name].map((l) => l.map(([c, r]) => [flipX ? 3 - c : c, flipY ? 2 - r : r]));
  const points = [...new Set(lines.flat().map((p) => p.join(',')))];
  const places = shuffle(rand, PLACES).slice(0, points.length);
  const idOf = new Map(points.map((p, i) => [p, places[i]]));
  const stops = points.map((p) => {
    const [c, r] = p.split(',').map(Number);
    return { id: idOf.get(p), emoji: idOf.get(p), x: X[c], y: Y[r] };
  });
  const numbers = shuffle(rand, [1, 2, 3, 4]).slice(0, lines.length);
  return { stops, lines: lines.map((l, i) => ({ id: `l${numbers[i]}`, n: numbers[i], stops: l.map((p) => idOf.get(p.join(','))) })) };
}

const metro = (map, extra = {}) => ({ v: 'metro', stops: map.stops, lines: map.lines, h: 220, ...extra });
const station = (id) => ({ emoji: id, alt: PLACE_NAMES[id] });
/** Minutele segmentelor: 1–9 pe fiecare. */
const minutesOf = (rand, lines) => lines.flatMap((l) => pair(l.stops).map(([a, b]) => ({ a, b, n: int(rand, 1, 9) })));
const minuteOf = (minutes, a, b) => minutes.find((m) => (m.a === a && m.b === b) || (m.a === b && m.b === a)).n;

// ——— Rețelele de prieteni ———
export const ANIMALS = [
  { id: 'pisica', emoji: 'pisica', name: 'pisică', the: 'pisica' },
  { id: 'caine', emoji: 'caine', name: 'câine', the: 'câinele' },
  { id: 'urs', emoji: 'urs', name: 'urs', the: 'ursul' },
  { id: 'vulpe', emoji: 'vulpe', name: 'vulpe', the: 'vulpea' },
  { id: 'iepure', emoji: 'iepure', name: 'iepure', the: 'iepurele' },
  { id: 'leu', emoji: 'leu', name: 'leu', the: 'leul' },
  { id: 'tigru', emoji: 'tigru', name: 'tigru', the: 'tigrul' },
  { id: 'panda', emoji: 'panda', name: 'panda', the: 'panda' },
  { id: 'maimuta', emoji: 'maimuta', name: 'maimuță', the: 'maimuța' },
  { id: 'pinguin', emoji: 'pinguin', name: 'pinguin', the: 'pinguinul' },
];
const animal = (id) => ANIMALS.find((a) => a.id === id);
const animalOption = (id) => ({ emoji: id, alt: animal(id).name });
// așezările nodurilor și legăturile posibile (fără linii care trec prin alt nod)
const NETWORKS = [
  {
    at: [[60, 50], [160, 50], [260, 50], [60, 160], [160, 160], [260, 160]],
    edges: [[0, 1], [1, 2], [3, 4], [4, 5], [0, 3], [1, 4], [2, 5], [0, 4], [2, 4]],
  },
  {
    at: [[160, 105], [160, 30], [247, 84], [213, 184], [107, 184], [73, 84]],
    edges: [[1, 2], [2, 3], [3, 4], [4, 5], [5, 1], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5]],
  },
];

/** O rețea legată de 6 animale, cu 6–8 prietenii alese dintre cele posibile. */
function buildNetwork(rand) {
  for (;;) {
    const layout = pickOne(rand, NETWORKS);
    const ids = shuffle(rand, ANIMALS.map((a) => a.id)).slice(0, layout.at.length);
    const count = int(rand, 6, Math.min(8, layout.edges.length));
    const edges = shuffle(rand, layout.edges).slice(0, count).map(([a, b]) => [ids[a], ids[b]]);
    if (!connected(ids, edges)) continue;
    return { ids, edges, nodes: ids.map((id, i) => ({ id, emoji: id, name: animal(id).name, x: layout.at[i][0], y: layout.at[i][1] })) };
  }
}

// ——— Arborii ———
const FRUITS = ['mar', 'para', 'cirese', 'lamaie', 'portocala', 'banana', 'capsuni', 'strugure'];
const FRUIT_NAMES = { mar: 'măr', para: 'pară', cirese: 'cireșe', lamaie: 'lămâie', portocala: 'portocală', banana: 'banană', capsuni: 'căpșuni', strugure: 'struguri' };
const DRINKS = [
  { id: 'lapte', name: 'lapte' },
  { id: 'suc', name: 'suc' },
  { id: 'apa', name: 'apă' },
];
const SNACKS = ['mar', 'para', 'biscuit', 'paine', 'branza', 'prajitura', 'sandvis', 'banana'];

/**
 * Faptele sigure pentru clasificare (doar ce nu se poate discuta; animalele cu răspuns îndoielnic lipsesc sau n-au întrebarea).
 * pene · zboară · înoată · patru picioare
 */
export const FACTS = {
  pinguin: { the: 'pinguinul', pene: true, zboara: false, inoata: true, patru: false },
  bufnita: { the: 'bufnița', pene: true, zboara: true, inoata: false, patru: false },
  papagal: { the: 'papagalul', pene: true, zboara: true, inoata: false, patru: false },
  liliac: { the: 'liliacul', pene: false, zboara: true },
  fluture: { the: 'fluturele', pene: false, zboara: true, patru: false },
  albina: { the: 'albina', pene: false, zboara: true, patru: false },
  peste: { the: 'peștele', pene: false, zboara: false, inoata: true, patru: false },
  delfin: { the: 'delfinul', pene: false, zboara: false, inoata: true, patru: false },
  testoasa: { the: 'broasca țestoasă', pene: false, zboara: false, patru: true },
  caine: { the: 'câinele', pene: false, zboara: false, patru: true },
  pisica: { the: 'pisica', pene: false, zboara: false, patru: true },
  urs: { the: 'ursul', pene: false, zboara: false, patru: true },
  vulpe: { the: 'vulpea', pene: false, zboara: false, patru: true },
  leu: { the: 'leul', pene: false, zboara: false, patru: true },
};
export const QUESTIONS = { pene: 'Are pene?', zboara: 'Zboară?', inoata: 'Înoată?', patru: '4 picioare?' };
const LETTERS = ['A', 'B', 'C', 'D'];

export const MAP_KINDS = {
  // ——— Ușor ———
  'linie-statii': {
    label: 'Hărți: câte stații sunt între două stații',
    points: 1,
    fastMs: 5000,
    mode: 'figure',
    promptMax: 60,
    concepts: [HARTA],
    generate(rand) {
      // răspunsul întâi (0–3, variantele fixe 0, 1, 2, 3), apoi două stații de pe aceeași linie de 5 stații, la distanța potrivită
      const answer = int(rand, 0, 3);
      const map = buildMap(rand, 'lungi');
      const line = pickOne(rand, map.lines);
      const i = int(rand, 0, line.stops.length - 2 - answer);
      const j = i + answer + 1;
      const [a, b] = rand() < 0.5 ? [line.stops[i], line.stops[j]] : [line.stops[j], line.stops[i]];
      const figure = metro(map);
      return numberQuestion('linie-statii', rand, {
        prompt: `Câte stații sunt între ${e(a)} și ${e(b)} pe linia ${line.n}?`,
        figure,
        solved: { ...figure, path: line.stops.slice(i, j + 1), mark: line.stops.slice(i + 1, j) },
        key: `${map.stops.map((s) => s.id).join(',')}:${line.n}:${a}:${b}`,
        answer,
        fixed: [0, 1, 2, 3],
        ask: { op: 'between', a, b, line: line.n },
      });
    },
  },

  'linie-care': {
    label: 'Hărți: ce linie merge între două stații',
    points: 2,
    fastMs: 5000,
    mode: 'figure',
    promptMax: 60,
    concepts: [HARTA],
    generate(rand) {
      for (;;) {
        const map = buildMap(rand, 'stea');
        const line = pickOne(rand, map.lines);
        const [i, j] = distinct(rand, 2, 0, line.stops.length - 1).sort((x, y) => x - y);
        const [a, b] = rand() < 0.5 ? [line.stops[i], line.stops[j]] : [line.stops[j], line.stops[i]];
        const figure = metro(map);
        const q = pickQuestion('linie-care', rand, {
          prompt: `Ce linie merge de la ${e(a)} la ${e(b)}?`,
          figure,
          solved: { ...figure, path: line.stops.slice(i, j + 1), mark: [a, b] },
          key: `${map.stops.map((s) => s.id).join(',')}:${map.lines.map((l) => l.n).join('')}:${a}:${b}`,
          answer: { v: 'line-badge', n: line.n },
          distractors: map.lines.filter((l) => l !== line).map((l) => ({ v: 'line-badge', n: l.n })),
          ask: { op: 'lineThrough', a, b },
        });
        if (q) return q;
      }
    },
  },

  prieteni: {
    label: 'Rețele: câți prieteni, cine are cei mai mulți',
    points: 1,
    fastMs: 4500,
    mode: 'figure',
    promptMax: 60,
    concepts: [RETELE],
    generate(rand) {
      for (;;) {
        const net = buildNetwork(rand);
        const figure = { v: 'network', nodes: net.nodes, edges: net.edges };
        const key = `${net.ids.join(',')}:${net.edges.map((x) => x.join('-')).join(',')}`;
        if (rand() < 0.6) {
          const x = pickOne(rand, net.ids);
          const d = degree(net.edges, x);
          return numberQuestion('prieteni', rand, {
            prompt: `Câți prieteni are ${animal(x).the}?`,
            figure,
            solved: { ...figure, mark: [x], markEdges: net.edges.filter((ed) => ed.includes(x)) },
            key: `d:${key}:${x}`,
            answer: d,
            typical: [d + 1, d - 1, net.edges.length],
            min: 0,
            max: 7,
            ask: { op: 'degree', node: x },
          });
        }
        const degrees = net.ids.map((id) => degree(net.edges, id));
        const top = Math.max(...degrees);
        if (degrees.filter((d) => d === top).length !== 1) continue;
        const best = net.ids[degrees.indexOf(top)];
        const second = [...net.ids].filter((id) => id !== best).sort((p, q) => degree(net.edges, q) - degree(net.edges, p));
        const q = pickQuestion('prieteni', rand, {
          prompt: 'Cine are cei mai mulți prieteni?',
          figure,
          solved: { ...figure, mark: [best], markEdges: net.edges.filter((ed) => ed.includes(best)) },
          key: `m:${key}`,
          answer: animalOption(best),
          distractors: second.map(animalOption),
          ask: { op: 'maxDegree' },
        });
        if (q) return q;
      }
    },
  },

  'veverita-drum': {
    label: 'Veverița pe crengi: alunele de pe un drum',
    points: 2,
    fastMs: 6000,
    mode: 'figure',
    promptMax: 60,
    concepts: [ARBORI, O_OP],
    generate(rand) {
      const depth = rand() < 0.5 ? 2 : 3;
      const tree = squirrelTree(rand, depth);
      // drumul marcat merge până la capătul cel mai înalt (la 3 niveluri: trei crengi de adunat)
      const tip = pickOne(rand, leaves(tree.nodes).filter((id) => id.length === depth + 1));
      const path = pathTo(tree.nodes, tip);
      const answer = pathSum(tree.nodes, tip);
      const edges = path.slice(1).map((id) => tree.nodes.find((n) => n.id === id).edge);
      return numberQuestion('veverita-drum', rand, {
        prompt: 'Câte alune strânge pe drumul marcat?',
        figure: { v: 'tree', grow: 'up', style: 'branch', nodes: tree.nodes, mark: path },
        key: `${tree.nodes.map((n) => `${n.id}${n.edge ?? n.emoji}`).join(',')}:${tip}`,
        answer,
        typical: [answer - edges.at(-1), answer - edges[0], edges.length, answer + 1, answer - 1],
        ask: { op: 'pathSum', to: tip },
      });
    },
  },

  'arbore-alegeri': {
    label: 'Arborele alegerilor: câte meniuri',
    points: 2,
    fastMs: 6000,
    mode: 'figure',
    promptMax: 60,
    concepts: [ARBORI],
    generate(rand) {
      for (;;) {
        const drinks = shuffle(rand, DRINKS).slice(0, int(rand, 2, 3));
        const counts = drinks.map(() => int(rand, 1, 4));
        const total = sum(counts);
        if (total < 3 || total > 8) continue;
        const nodes = [{ id: 'r', emoji: 'veverita' }];
        drinks.forEach((d, i) => {
          nodes.push({ id: d.id, parent: 'r', emoji: d.id === 'apa' ? 'apa' : d.id });
          shuffle(rand, SNACKS).slice(0, counts[i]).forEach((s) => nodes.push({ id: `${d.id}-${s}`, parent: d.id, emoji: s }));
        });
        const figure = { v: 'tree', nodes };
        const key = nodes.map((n) => n.emoji).join(',');
        if (rand() < 0.6) {
          const kinds = new Set(nodes.filter((n) => n.parent && n.parent !== 'r').map((n) => n.emoji)).size;
          return numberQuestion('arbore-alegeri', rand, {
            prompt: 'Câte meniuri poate alege Cifruța?',
            figure,
            solved: { ...figure, mark: leaves(nodes) },
            key: `t:${key}`,
            answer: total,
            typical: [drinks.length + kinds, drinks.length, Math.max(...counts), total + 1, total - 1],
            max: 12,
            ask: { op: 'leaves' },
          });
        }
        const i = int(rand, 0, drinks.length - 1);
        return numberQuestion('arbore-alegeri', rand, {
          prompt: `Câte meniuri au ${drinks[i].name}?`,
          figure,
          solved: { ...figure, mark: childrenOf(nodes).get(drinks[i].id) },
          key: `c:${key}:${i}`,
          answer: counts[i],
          typical: [total, total - counts[i], counts[i] + 1, counts[i] - 1],
          max: 12,
          ask: { op: 'leavesUnder', node: drinks[i].id },
        });
      }
    },
  },

  // ——— Intermediar ———
  'linie-ordine': {
    label: 'Hărți: stațiile în ordinea drumului',
    points: 3,
    fastMs: 8000,
    mode: 'sort',
    drawn: true,
    promptMax: 24,
    concepts: [HARTA],
    generate(rand) {
      const map = buildMap(rand, 'lungi');
      const line = pickOne(rand, map.lines);
      const stops = rand() < 0.5 ? [...line.stops] : [...line.stops].reverse();
      const count = int(rand, 3, 4);
      const start = stops[0];
      const next = stops.slice(1, 1 + count);
      const figure = metro(map);
      return drawnSort('linie-ordine', rand, {
        prompt: `Linia ${line.n}, de la ${e(start)}:`,
        dir: 'path',
        figure,
        solved: { ...figure, path: stops.slice(0, 1 + count), mark: next },
        items: next.map((id, i) => ({ id, spec: station(id), value: i })),
        key: `${map.stops.map((s) => s.id).join(',')}:${line.n}:${start}:${count}`,
        ask: { op: 'order', line: line.n, from: start },
      });
    },
  },

  'linie-schimb': {
    label: 'Hărți: unde schimbi linia',
    points: 3,
    fastMs: 6500,
    mode: 'figure',
    promptMax: 60,
    concepts: [HARTA],
    generate(rand) {
      for (;;) {
        const map = buildMap(rand, pickOne(rand, ['cruce', 'lungi', 'trei']));
        const [l1, l2] = shuffle(rand, map.lines).slice(0, 2);
        const shared = l1.stops.filter((s) => l2.stops.includes(s));
        if (shared.length !== 1) continue;
        const [t] = shared;
        const a = pickOne(rand, l1.stops.filter((s) => s !== t));
        const b = pickOne(rand, l2.stops.filter((s) => s !== t));
        if (map.lines.some((l) => l.stops.includes(a) && l.stops.includes(b))) continue;
        const path = (line, from, to) => {
          const [i, j] = [line.stops.indexOf(from), line.stops.indexOf(to)];
          return i <= j ? line.stops.slice(i, j + 1) : line.stops.slice(j, i + 1).reverse();
        };
        const figure = metro(map);
        const ends = map.lines.flatMap((l) => [l.stops[0], l.stops.at(-1)]);
        const others = shuffle(rand, [...new Set([...ends, ...map.stops.map((s) => s.id)])].filter((s) => s !== t && s !== a && s !== b));
        const q = pickQuestion('linie-schimb', rand, {
          prompt: `Unde schimbi linia, de la ${e(a)} la ${e(b)}?`,
          figure,
          solved: { ...figure, path: [...path(l1, a, t), ...path(l2, t, b).slice(1)], mark: [t] },
          key: `${map.stops.map((s) => s.id).join(',')}:${a}:${b}`,
          answer: station(t),
          distractors: others.map(station),
          ask: { op: 'transfer', a, b },
        });
        if (q) return q;
      }
    },
  },

  'drum-minute': {
    label: 'Hărți: câte minute durează un drum',
    points: 3,
    fastMs: 7000,
    mode: 'figure',
    promptMax: 60,
    concepts: [HARTA, DURATA, O_OP],
    generate(rand) {
      for (;;) {
        const map = buildMap(rand, pickOne(rand, ['lungi', 'cruce']));
        const minutes = minutesOf(rand, map.lines);
        const line = pickOne(rand, map.lines);
        const stops = rand() < 0.5 ? line.stops : [...line.stops].reverse();
        const from = int(rand, 0, stops.length - 3);
        const to = int(rand, from + 2, Math.min(stops.length - 1, from + 4));
        const path = stops.slice(from, to + 1);
        const parts = pair(path).map(([a, b]) => minuteOf(minutes, a, b));
        const answer = sum(parts);
        const figure = metro(map, { minutes, path });
        return numberQuestion('drum-minute', rand, {
          prompt: 'Câte minute durează drumul marcat?',
          figure,
          solved: { ...figure, mark: path },
          key: `${map.stops.map((s) => s.id).join(',')}:${minutes.map((m) => m.n).join('')}:${path.join('-')}`,
          answer,
          typical: [answer - parts.at(-1), answer - parts[0], path.length, answer + 1, answer - 1],
          ask: { op: 'minutes' },
        });
      }
    },
  },

  'prieteni-comun': {
    label: 'Rețele: prietenul comun',
    points: 3,
    fastMs: 6500,
    mode: 'figure',
    promptMax: 60,
    concepts: [RETELE],
    generate(rand) {
      for (;;) {
        const net = buildNetwork(rand);
        const [x, y] = shuffle(rand, net.ids).slice(0, 2);
        const both = common(net.edges, x, y);
        if (both.length !== 1) continue;
        const [z] = both;
        const figure = { v: 'network', nodes: net.nodes, edges: net.edges };
        const onlyOne = [...neighbors(net.edges, x), ...neighbors(net.edges, y)].filter((n) => n !== z && n !== x && n !== y);
        const rest = net.ids.filter((n) => ![x, y, z].includes(n));
        const q = pickQuestion('prieteni-comun', rand, {
          prompt: `Cine e prieten și cu ${animal(x).the}, și cu ${animal(y).the}?`,
          figure,
          solved: { ...figure, mark: [z], markEdges: [[x, z], [y, z]] },
          key: `${net.ids.join(',')}:${net.edges.map((ed) => ed.join('-')).join(',')}:${x}:${y}`,
          answer: animalOption(z),
          distractors: [...new Set([...shuffle(rand, onlyOne), ...shuffle(rand, rest)])].map(animalOption),
          ask: { op: 'common', a: x, b: y },
        });
        if (q) return q;
      }
    },
  },

  turneu: {
    label: 'Turneul: cine a câștigat, cu cine a jucat',
    points: 2,
    fastMs: 6500,
    mode: 'figure',
    promptMax: 60,
    concepts: [RETELE],
    generate(rand) {
      for (;;) {
        const eight = rand() < 0.6;
        const players = shuffle(rand, ANIMALS.map((a) => a.id)).slice(0, eight ? 8 : 4);
        const rounds = [];
        let field = players;
        while (field.length > 1) {
          field = Array.from({ length: field.length / 2 }, (_, i) => field[2 * i + (rand() < 0.5 ? 0 : 1)]);
          rounds.push(field);
        }
        const figure = { v: 'bracket', players, rounds };
        const champion = rounds.at(-1)[0];
        const finalists = eight ? rounds[1] : rounds[0];
        const runnerUp = finalists.find((p) => p !== champion);
        const key = `${players.join(',')}:${rounds.flat().join(',')}`;
        const variant = eight ? pickOne(rand, ['winner', 'final', 'wins', 'wins']) : pickOne(rand, ['winner', 'final']);
        if (variant === 'wins') {
          // răspunsul întâi (0–3, variantele fixe), apoi un jucător cu atâtea victorii
          const wins = int(rand, 0, 3);
          const p = pickOne(rand, players.filter((x) => bracketWins(rounds, x) === wins));
          return numberQuestion('turneu', rand, {
            prompt: `Câte meciuri a câștigat ${animal(p).the}?`,
            figure,
            solved: { ...figure, mark: [p] },
            key: `w:${key}:${p}`,
            answer: wins,
            fixed: [0, 1, 2, 3],
            ask: { op: 'wins', player: p },
          });
        }
        const semis = (eight ? rounds[0] : players).filter((p) => !finalists.includes(p));
        if (variant === 'winner') {
          const q = pickQuestion('turneu', rand, {
            prompt: 'Cine a câștigat turneul?',
            figure,
            solved: { ...figure, mark: [champion] },
            key: `c:${key}`,
            answer: animalOption(champion),
            distractors: [runnerUp, ...shuffle(rand, semis)].map(animalOption),
            ask: { op: 'winner' },
          });
          if (q) return q;
          continue;
        }
        const [who, other] = rand() < 0.5 ? [champion, runnerUp] : [runnerUp, champion];
        const q = pickQuestion('turneu', rand, {
          prompt: `Cu cine a jucat ${animal(who).the} în finală?`,
          figure,
          solved: { ...figure, mark: [who, other] },
          key: `f:${key}:${who}`,
          answer: animalOption(other),
          distractors: shuffle(rand, players.filter((p) => p !== who && p !== other)).map(animalOption),
          ask: { op: 'finalOpponent', player: who },
        });
        if (q) return q;
      }
    },
  },

  'arbore-sume': {
    label: 'Arborele sumelor: numărul lipsă',
    points: 3,
    fastMs: 7000,
    mode: 'figure',
    promptMax: 60,
    concepts: [ARBORI, NECUNOSCUT],
    generate(rand) {
      for (;;) {
        const tree = sumTree(rand, rand() < 0.4 ? 1 : 2);
        if (!tree) continue;
        // un singur „?”, oriunde: se află dintr-un singur pas (suma copiilor sau părintele minus fratele)
        const target = pickOne(rand, tree.map((n) => n.id));
        const answer = tree.find((n) => n.id === target).value;
        const nodes = tree.map((n) => (n.id === target ? { id: n.id, ...(n.parent && { parent: n.parent }), slot: true } : n));
        const parentOf = tree.find((n) => n.id === target).parent;
        const sibling = tree.find((n) => n.parent === parentOf && n.id !== target && parentOf);
        return numberQuestion('arbore-sume', rand, {
          prompt: 'Fiecare număr e suma celor de sub el. Cât e „?”?',
          figure: { v: 'tree', nodes },
          solved: { v: 'tree', nodes: tree, mark: [target] },
          key: `${tree.map((n) => n.value).join(',')}:${target}`,
          answer,
          typical: [answer + 10, answer - 10, sibling ? tree.find((n) => n.id === parentOf).value + sibling.value : answer + 5, sibling?.value ?? answer - 5],
          ask: { op: 'sumTree' },
        });
      }
    },
  },

  'arbore-clasificare': {
    label: 'Arborele întrebărilor: unde ajunge animalul',
    points: 3,
    fastMs: 7000,
    mode: 'figure',
    promptMax: 60,
    concepts: [ARBORI, CLASIFICARE],
    generate(rand) {
      // litera întâi (fiecare căsuță la fel de des), apoi întrebările și un animal care ajunge acolo
      const letter = int(rand, 0, 3);
      for (;;) {
        const [q1, q2, q3] = shuffle(rand, Object.keys(QUESTIONS)).slice(0, 3);
        const [yes1, yes2] = [letter < 2, letter % 2 === 0];
        const asks = [q1, letter < 2 ? q2 : q3];
        const fits = Object.entries(FACTS).filter(([, f]) => f[q1] === yes1 && f[asks[1]] === yes2 && f[q2] !== undefined && f[q3] !== undefined);
        if (!fits.length) continue;
        const [who] = pickOne(rand, fits);
        const nodes = [
          { id: 'q', text: QUESTIONS[q1] },
          { id: 'q1', parent: 'q', edge: 'da', text: QUESTIONS[q2] },
          { id: 'q2', parent: 'q', edge: 'nu', text: QUESTIONS[q3] },
          { id: 'A', parent: 'q1', edge: 'da', text: 'A' },
          { id: 'B', parent: 'q1', edge: 'nu', text: 'B' },
          { id: 'C', parent: 'q2', edge: 'da', text: 'C' },
          { id: 'D', parent: 'q2', edge: 'nu', text: 'D' },
        ];
        const figure = { v: 'tree', nodes };
        return numberQuestion('arbore-clasificare', rand, {
          prompt: `Unde ajunge ${FACTS[who].the}?`,
          figure,
          solved: { ...figure, mark: ['q', letter < 2 ? 'q1' : 'q2', LETTERS[letter]] },
          key: `${q1}${q2}${q3}:${who}`,
          answer: LETTERS[letter],
          fixed: LETTERS,
          ask: { op: 'classify', animal: who },
        });
      }
    },
  },

  // ——— Avansat ———
  'drum-scurt': {
    label: 'Hărți: cel mai scurt drum, în minute',
    points: 5,
    fastMs: 11000,
    mode: 'figure',
    promptMax: 60,
    concepts: [HARTA, DURATA, O_OP],
    generate(rand) {
      for (;;) {
        const map = buildMap(rand, 'bucla');
        const [top, bottom, direct] = map.lines;
        const minutes = [
          ...pair(top.stops).map(([a, b]) => ({ a, b, n: int(rand, 1, 7) })),
          ...pair(bottom.stops).map(([a, b]) => ({ a, b, n: int(rand, 1, 7) })),
          { a: direct.stops[0], b: direct.stops[1], n: int(rand, 6, 18) },
        ];
        const routes = [top.stops, bottom.stops, direct.stops];
        const totals = routes.map((r) => sum(pair(r).map(([a, b]) => minuteOf(minutes, a, b))));
        const best = Math.min(...totals);
        if (totals.filter((x) => x === best).length !== 1) continue;
        const [from, to] = [top.stops[0], top.stops.at(-1)];
        const figure = metro(map, { minutes, plain: true });
        return numberQuestion('drum-scurt', rand, {
          prompt: `Câte minute ține cel mai scurt drum de la ${e(from)} la ${e(to)}?`,
          figure,
          solved: { ...figure, path: routes[totals.indexOf(best)], mark: [from, to] },
          key: `${map.stops.map((s) => s.id).join(',')}:${minutes.map((m) => m.n).join(',')}`,
          answer: best,
          typical: [...totals.filter((x) => x !== best), best + 1, best - 1],
          ask: { op: 'shortest', from, to },
        });
      }
    },
  },

  'drum-compara': {
    label: 'Hărți: compară două drumuri, în minute',
    points: 4,
    fastMs: 9000,
    mode: 'compare',
    drawn: true,
    promptMax: 24,
    concepts: [HARTA, DURATA, COMPARARE],
    generate(rand) {
      const rel = pickOne(rand, ['<', '=', '>']);
      for (;;) {
        const map = buildMap(rand, 'bucla');
        map.lines = map.lines.slice(0, 2);
        map.stops = map.stops.filter((s) => map.lines.some((l) => l.stops.includes(s.id)));
        const [top, bottom] = map.lines;
        const minutes = minutesOf(rand, map.lines);
        const total = (r) => sum(pair(r.stops).map(([a, b]) => minuteOf(minutes, a, b)));
        const [ta, tb] = [total(top), total(bottom)];
        if ((ta < tb ? '<' : ta > tb ? '>' : '=') !== rel) continue;
        const figure = metro(map, { minutes, plain: true, routes: [{ id: 'A', path: top.stops }, { id: 'B', path: bottom.stops }] });
        return drawnCompare('drum-compara', {
          prompt: 'Minute:',
          figure,
          solved: { ...figure, mark: [top.stops[0], top.stops.at(-1)] },
          left: [{ text: 'A' }],
          right: [{ text: 'B' }],
          lv: ta,
          rv: tb,
          key: `${map.stops.map((s) => s.id).join(',')}:${minutes.map((m) => m.n).join(',')}`,
          ask: { op: 'cmpRoutes' },
        });
      }
    },
  },

  'arbore-sume-3': {
    label: 'Arborele sumelor în doi pași',
    points: 5,
    fastMs: 10000,
    mode: 'figure',
    promptMax: 60,
    concepts: [ARBORI, NECUNOSCUT],
    generate(rand) {
      for (;;) {
        const tree = sumTree(rand, 2);
        if (!tree) continue;
        // „?” pe o frunză, iar părintele ei e o căsuță goală: întâi părintele (rădăcina minus fratele lui), apoi frunza
        const leaf = pickOne(rand, tree.filter((n) => n.id.length === 2));
        const parent = tree.find((n) => n.id === leaf.parent);
        const uncle = tree.find((n) => n.parent === 'r' && n.id !== parent.id);
        const sib = tree.find((n) => n.parent === parent.id && n.id !== leaf.id);
        const nodes = tree.map((n) => (n.id === leaf.id ? { id: n.id, parent: n.parent, slot: true } : n.id === parent.id ? { id: n.id, parent: 'r', blank: true } : n));
        const answer = leaf.value;
        return numberQuestion('arbore-sume-3', rand, {
          prompt: 'Fiecare număr e suma celor de sub el. Cât e „?”?',
          figure: { v: 'tree', nodes },
          solved: { v: 'tree', nodes: tree, mark: [leaf.id, parent.id] },
          key: `${tree.map((n) => n.value).join(',')}:${leaf.id}`,
          answer,
          typical: [parent.value, tree[0].value - sib.value, tree[0].value - uncle.value - sib.value + 10, answer + 10, answer - 10].filter((x) => x !== answer),
          ask: { op: 'sumTree' },
        });
      }
    },
  },

  'veverita-bogat': {
    label: 'Veverița pe crengi: drumul cu cele mai multe alune',
    points: 5,
    fastMs: 11000,
    mode: 'figure',
    promptMax: 60,
    concepts: [ARBORI, O_OP],
    generate(rand) {
      for (;;) {
        const tree = squirrelTree(rand, 2);
        const tips = leaves(tree.nodes);
        const sums = tips.map((t) => pathSum(tree.nodes, t));
        const top = Math.max(...sums);
        if (sums.filter((s) => s === top).length !== 1) continue;
        const best = tips[sums.indexOf(top)];
        // drumul lacom: la fiecare ramificație, creanga cu mai multe alune
        const kids = childrenOf(tree.nodes);
        let greedy = 'r';
        while (kids.get(greedy).length) greedy = kids.get(greedy).reduce((p, c) => (tree.byId[c].edge > tree.byId[p].edge ? c : p));
        if (greedy === best && rand() < 0.6) continue; // de cele mai multe ori, drumul lacom nu e cel mai bogat
        const fruitOf = (id) => ({ emoji: tree.byId[id].emoji, alt: FRUIT_NAMES[tree.byId[id].emoji] });
        const q = pickQuestion('veverita-bogat', rand, {
          prompt: 'Pe ce drum strânge cele mai multe alune?',
          figure: { v: 'tree', grow: 'up', style: 'branch', nodes: tree.nodes },
          solved: { v: 'tree', grow: 'up', style: 'branch', nodes: tree.nodes, mark: pathTo(tree.nodes, best) },
          key: tree.nodes.map((n) => n.edge ?? n.emoji).join(','),
          answer: fruitOf(best),
          distractors: [greedy, ...tips].filter((t) => t !== best).map(fruitOf),
          ask: { op: 'richest' },
        });
        if (q) return q;
      }
    },
  },
};

/**
 * Crengile veveriței: rădăcina (veverița), două niveluri de câte două ramuri, alune 1–9 pe fiecare, fructe la capete. Cu `depth` 3 se
 * mai desparte o singură creangă (5 fructe): cu 8 fructe, pastilele crengilor surori s-ar atinge, iar desenul ar ieși prea mic.
 */
function squirrelTree(rand, depth) {
  const fruits = shuffle(rand, FRUITS);
  const nodes = [{ id: 'r', emoji: 'veverita' }];
  const split = (p) =>
    ['s', 'd'].map((side) => {
      const id = `${p}${side}`;
      nodes.push({ id, parent: p, edge: int(rand, 1, 9) });
      return id;
    });
  const level = split('r').flatMap(split);
  if (depth === 3) split(pickOne(rand, level));
  leaves(nodes).forEach((id, i) => Object.assign(nodes.find((n) => n.id === id), { emoji: fruits[i] }));
  return { nodes, byId: Object.fromEntries(nodes.map((n) => [n.id, n])) };
}

/** Arborele sumelor: frunze 2–30, fiecare nod e suma copiilor, rădăcina cel mult 100 (null dacă trece). */
function sumTree(rand, depth) {
  if (depth === 1) {
    const [a, b] = [int(rand, 5, 45), int(rand, 5, 45)];
    return [{ id: 'r', value: a + b }, { id: 'a', parent: 'r', value: a }, { id: 'b', parent: 'r', value: b }];
  }
  const g = Array.from({ length: 4 }, () => int(rand, 2, 30));
  const [a, b] = [g[0] + g[1], g[2] + g[3]];
  if (a + b > 100) return null;
  return [
    { id: 'r', value: a + b },
    { id: 'a', parent: 'r', value: a },
    { id: 'b', parent: 'r', value: b },
    { id: 'a1', parent: 'a', value: g[0] },
    { id: 'a2', parent: 'a', value: g[1] },
    { id: 'b1', parent: 'b', value: g[2] },
    { id: 'b2', parent: 'b', value: g[3] },
  ];
}
