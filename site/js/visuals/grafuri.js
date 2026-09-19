// Grafuri pentru Jocurile fulger (și pentru teste): harta liniilor (stații cu emoji, linii cu număr și model, minute pe segmente,
// drumuri marcate), insigna unei linii, rețeaua de prieteni, tabloul unui turneu și arborele (sume, alegeri, clasificare,
// crengile veveriței). Aceleași reguli ca în grafice.js: 320 de unități lățime, text de cel puțin 18, emoji de cel puțin 24,
// culoarea nu e singurul indiciu (liniile au numere și modele), iar numele citit de cititorul de ecran spune datele, nu răspunsul.

import { hasEmoji } from './emoji.js';
import { SERIES, SIZE, nameOf, pill, r1, textWidth } from './grafice.js';
import { registerVisual } from './index.js';
import { C, emojiImage, has, st, txt } from './palette.js';

const GROUP = 'Hărți, rețele și arbori';
const arr = (v) => (Array.isArray(v) ? v : []);

/** Culoarea și modelul liniei cu numărul n (1–4): plină, cu liniuțe, cu puncte, liniuță-punct. */
const DASHES = ['', '14 8', '1 10', '16 6 2 6'];
export const lineColor = (n) => SERIES[(n - 1) % SERIES.length];
export const lineDash = (n) => DASHES[(n - 1) % DASHES.length];
const dashAttr = (n) => (lineDash(n) ? ` stroke-dasharray="${lineDash(n)}"` : '');

const byIdOf = (items) => new Map(arr(items).map((s) => [s.id, s]));
const unit = (dx, dy) => {
  const len = Math.hypot(dx, dy) || 1;
  return [dx / len, dy / len];
};
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
/** Perechile vecine de pe o listă de stații. */
const hops = (ids) => ids.slice(1).map((id, i) => [ids[i], id]);

// ——— Harta liniilor ———
// stops: [{ id, emoji, x, y }] · lines: [{ id, n, stops }] · minutes: [{ a, b, n, at? }] · path: [id] (drumul marcat)
// routes: [{ id: 'A' | 'B', path }] (două drumuri de comparat) · mark: [id] (stații evidențiate) · h: înălțimea (implicit 220)
// plain: drumuri, nu linii de transport (gri, fără numere la capete), pentru hărțile unde contează doar minutele
function metroErrors(p) {
  const stops = arr(p.stops);
  const ids = byIdOf(stops);
  const h = Number(p.h) || 220;
  const errors = [];
  if (stops.length < 3 || stops.length > 12) errors.push(`între 3 și 12 stații (acum ${stops.length})`);
  if (ids.size !== stops.length) errors.push('stațiile au id-uri diferite');
  for (const s of stops) {
    if (!hasEmoji(s.emoji)) errors.push(`stația „${s.id}”: emoji necunoscut „${s.emoji}”`);
    if (!(s.x >= 20 && s.x <= 300 && s.y >= 20 && s.y <= h - 20)) errors.push(`stația „${s.id}” iese din desen`);
  }
  const lines = arr(p.lines);
  if (lines.length < 1 || lines.length > 4) errors.push('între 1 și 4 linii');
  if (new Set(lines.map((l) => l.n)).size !== lines.length || lines.some((l) => !(l.n >= 1 && l.n <= 9))) errors.push('liniile au numere diferite, de la 1 la 9');
  const adjacent = new Set();
  for (const l of lines) {
    if (arr(l.stops).length < 2) errors.push(`linia ${l.n} are cel puțin două stații`);
    for (const id of arr(l.stops)) if (!ids.has(id)) errors.push(`linia ${l.n}: stație necunoscută „${id}”`);
    for (const [a, b] of hops(arr(l.stops))) adjacent.add(`${a}|${b}`).add(`${b}|${a}`);
  }
  for (const m of arr(p.minutes)) if (!adjacent.has(`${m.a}|${m.b}`) || !Number.isInteger(m.n) || m.n < 1) errors.push(`minute pe un segment care nu există: ${m.a}–${m.b}`);
  for (const path of [arr(p.path), ...arr(p.routes).map((r) => arr(r.path))]) {
    for (const [a, b] of hops(path)) if (!adjacent.has(`${a}|${b}`)) errors.push(`drum pe un segment care nu există: ${a}–${b}`);
  }
  for (const id of arr(p.mark)) if (!ids.has(id)) errors.push(`stație marcată necunoscută „${id}”`);
  return errors;
}

export function metroLabel(p) {
  const ids = byIdOf(p.stops);
  const name = (id) => nameOf(ids.get(id));
  const parts = p.plain
    ? [`hartă cu drumuri: ${arr(p.lines).map((l) => arr(l.stops).map(name).join(', ')).join('; ')}`]
    : [`hartă: ${arr(p.lines).map((l) => `linia ${l.n}: ${arr(l.stops).map(name).join(', ')}`).join('; ')}`];
  if (arr(p.minutes).length) parts.push(`minute: ${p.minutes.map((m) => `${name(m.a)}–${name(m.b)} ${m.n}`).join(', ')}`);
  if (arr(p.path).length) parts.push(`drumul marcat: ${p.path.map(name).join(', ')}`);
  for (const r of arr(p.routes)) parts.push(`drumul ${r.id}: ${arr(r.path).map(name).join(', ')}`);
  return parts.join('; ');
}

registerVisual('metro', {
  group: GROUP,
  defaults: { h: 220 },
  viewBox: (p) => `0 0 320 ${Number(p.h) || 220}`,
  check: metroErrors,
  label: metroLabel,
  render: (p) => {
    const h = Number(p.h) || 220;
    const stops = arr(p.stops);
    const ids = byIdOf(stops);
    const pt = (id) => ids.get(id);
    const onLines = new Map();
    for (const l of arr(p.lines)) for (const id of arr(l.stops)) onLines.set(id, (onLines.get(id) ?? 0) + 1);
    const poly = (path) => arr(path).map((id) => `${pt(id).x},${pt(id).y}`).join(' ');
    let out = `<rect x="2" y="2" width="316" height="${h - 4}" rx="14" fill="${C.cream}" opacity=".55"/>`;
    // drumurile marcate stau sub linii: A cu bandă plină, B cu bandă punctată
    if (arr(p.path).length > 1) out += `<polyline points="${poly(p.path)}" fill="none" stroke="${C.yellow}" stroke-width="20" stroke-linejoin="round" stroke-linecap="round" opacity=".85"/>`;
    for (const r of arr(p.routes)) {
      out += `<polyline points="${poly(r.path)}" fill="none" stroke="${r.id === 'B' ? C.purpleLight : C.yellow}" stroke-width="20" stroke-linejoin="round" stroke-linecap="round"${r.id === 'B' ? ' stroke-dasharray="2 26"' : ''} opacity=".9"/>`;
    }
    for (const l of arr(p.lines)) {
      out += p.plain
        ? `<polyline points="${poly(l.stops)}" fill="none" stroke="${C.coalLight}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>`
        : `<polyline points="${poly(l.stops)}" fill="none" stroke="${lineColor(l.n)}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"${dashAttr(l.n)}/>`;
    }
    for (const m of arr(p.minutes)) {
      const [a, b] = [pt(m.a), pt(m.b)];
      const t = clamp(Number(m.at ?? 0.5), 0.2, 0.8);
      out += pill(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, m.n, SIZE.num);
    }
    for (const s of stops) {
      if ((onLines.get(s.id) ?? 0) > 1) out += `<circle cx="${s.x}" cy="${s.y}" r="22" fill="${C.white}" ${st(2.5)}/>`;
      out += `<circle cx="${s.x}" cy="${s.y}" r="17" fill="${C.white}" ${st(2.5)}/>` + emojiImage(s.emoji, s.x - 13, s.y - 13, 26);
      if (arr(p.mark).includes(s.id)) out += `<circle cx="${s.x}" cy="${s.y}" r="26" fill="none" ${st(3.5)}/>`;
    }
    // numărul liniei la ambele capete, în direcția liniei (drumurile simple n-au numere)
    for (const l of p.plain ? [] : arr(p.lines)) {
      const ss = arr(l.stops).map(pt);
      for (const [end, prev] of [[ss[0], ss[1]], [ss.at(-1), ss.at(-2)]]) {
        const [ux, uy] = unit(end.x - prev.x, end.y - prev.y);
        const bx = r1(clamp(end.x + ux * 32, 15, 305));
        const by = r1(clamp(end.y + uy * 32, 15, h - 15));
        out += `<circle cx="${bx}" cy="${by}" r="14" fill="${C.white}" stroke="${lineColor(l.n)}" stroke-width="4"/>` + txt(bx, by, l.n, { size: SIZE.num });
      }
    }
    for (const r of arr(p.routes)) {
      const path = arr(r.path);
      const i = Math.max(0, Math.floor((path.length - 2) / 2));
      const [a, b] = [pt(path[i]), pt(path[i + 1])];
      const [ux, uy] = unit(b.x - a.x, b.y - a.y);
      const [mx, my] = [r1((a.x + b.x) / 2 - uy * 30), r1((a.y + b.y) / 2 + ux * 30)];
      out += `<circle cx="${mx}" cy="${my}" r="15" fill="${C.ink}"/>` + txt(mx, my, r.id, { size: SIZE.num, fill: C.white });
    }
    return out;
  },
  demos: [
    {
      stops: [
        { id: 'casa', emoji: 'casa', x: 44, y: 70 }, { id: 'parc', emoji: 'parc', x: 124, y: 70 }, { id: 'scoala', emoji: 'scoala', x: 204, y: 70 }, { id: 'gara', emoji: 'gara', x: 276, y: 70 },
        { id: 'spital', emoji: 'spital', x: 124, y: 150 }, { id: 'castel', emoji: 'castel', x: 204, y: 170 },
      ],
      lines: [{ id: 'l1', n: 1, stops: ['casa', 'parc', 'scoala', 'gara'] }, { id: 'l2', n: 2, stops: ['parc', 'spital', 'castel'] }],
      minutes: [{ a: 'casa', b: 'parc', n: 3 }, { a: 'parc', b: 'scoala', n: 4 }, { a: 'scoala', b: 'gara', n: 2 }, { a: 'parc', b: 'spital', n: 5 }, { a: 'spital', b: 'castel', n: 3 }],
      path: ['casa', 'parc', 'spital'],
    },
    {
      stops: [
        { id: 'casa', emoji: 'casa', x: 40, y: 110 }, { id: 'parc', emoji: 'parc', x: 120, y: 50 }, { id: 'muzeu', emoji: 'muzeu', x: 200, y: 50 },
        { id: 'spital', emoji: 'spital', x: 120, y: 170 }, { id: 'circ', emoji: 'circ', x: 200, y: 170 }, { id: 'scoala', emoji: 'scoala', x: 280, y: 110 },
      ],
      lines: [{ id: 'l1', n: 1, stops: ['casa', 'parc', 'muzeu', 'scoala'] }, { id: 'l3', n: 3, stops: ['casa', 'spital', 'circ', 'scoala'] }],
      minutes: [{ a: 'casa', b: 'parc', n: 4 }, { a: 'parc', b: 'muzeu', n: 3 }, { a: 'muzeu', b: 'scoala', n: 5 }, { a: 'casa', b: 'spital', n: 2 }, { a: 'spital', b: 'circ', n: 6 }, { a: 'circ', b: 'scoala', n: 3 }],
      routes: [{ id: 'A', path: ['casa', 'parc', 'muzeu', 'scoala'] }, { id: 'B', path: ['casa', 'spital', 'circ', 'scoala'] }],
    },
  ],
});

// ——— Insigna unei linii (varianta „Ce linie…?”): numărul și mostra liniei ———
registerVisual('line-badge', {
  group: GROUP,
  viewBox: '0 0 72 40',
  check: (p) => (Number.isInteger(p.n) && p.n >= 1 && p.n <= 9 ? [] : ['n este numărul liniei (1–9)']),
  label: (p) => `linia ${p.n}`,
  render: (p) =>
    `<line x1="30" y1="20" x2="66" y2="20" stroke="${lineColor(p.n)}" stroke-width="7" stroke-linecap="round"${dashAttr(p.n)}/>` +
    `<circle cx="20" cy="20" r="16" fill="${C.white}" stroke="${lineColor(p.n)}" stroke-width="4"/>` + txt(20, 20.5, p.n, { size: SIZE.num }),
  demos: [{ n: 1 }, { n: 2 }, { n: 3 }, { n: 4 }],
});

// ——— Rețeaua de prieteni: animale legate prin linii ———
// nodes: [{ id, emoji, name?, x, y }] · edges: [[a, b]] · mark: [id] · markEdges: [[a, b]]
registerVisual('network', {
  group: GROUP,
  viewBox: '0 0 320 210',
  check: (p) => {
    const nodes = arr(p.nodes);
    const ids = byIdOf(nodes);
    const errors = [];
    if (nodes.length < 3 || nodes.length > 7) errors.push(`între 3 și 7 noduri (acum ${nodes.length})`);
    for (const n of nodes) {
      if (!hasEmoji(n.emoji)) errors.push(`nodul „${n.id}”: emoji necunoscut`);
      if (!(n.x >= 24 && n.x <= 296 && n.y >= 24 && n.y <= 186)) errors.push(`nodul „${n.id}” iese din desen`);
    }
    const seen = new Set();
    for (const [a, b] of arr(p.edges)) {
      if (!ids.has(a) || !ids.has(b) || a === b) errors.push(`legătură greșită ${a}–${b}`);
      const key = [a, b].sort().join('|');
      if (seen.has(key)) errors.push(`legătură repetată ${a}–${b}`);
      seen.add(key);
    }
    return errors;
  },
  label: (p) => {
    const ids = byIdOf(p.nodes);
    return `rețea de prieteni: ${arr(p.edges).map(([a, b]) => `${nameOf(ids.get(a))}–${nameOf(ids.get(b))}`).join(', ')}`;
  },
  render: (p) => {
    const ids = byIdOf(p.nodes);
    const marked = new Set(arr(p.markEdges).map((e) => [...e].sort().join('|')));
    let out = '';
    for (const [a, b] of arr(p.edges)) {
      const [u, v] = [ids.get(a), ids.get(b)];
      const hot = marked.has([a, b].sort().join('|'));
      out += `<line x1="${u.x}" y1="${u.y}" x2="${v.x}" y2="${v.y}" stroke="${hot ? SERIES[0] : C.coalLight}" stroke-width="${hot ? 7 : 3}" stroke-linecap="round"/>`;
    }
    for (const n of arr(p.nodes)) {
      out += `<circle cx="${n.x}" cy="${n.y}" r="22" fill="${C.cream}" ${st(2.5)}/>` + emojiImage(n.emoji, n.x - 15, n.y - 15, 30);
      if (arr(p.mark).includes(n.id)) out += `<circle cx="${n.x}" cy="${n.y}" r="28" fill="none" ${st(3.5)}/>`;
    }
    return out;
  },
  demos: [
    {
      nodes: [
        { id: 'pisica', emoji: 'pisica', x: 60, y: 50 }, { id: 'caine', emoji: 'caine', x: 160, y: 40 }, { id: 'urs', emoji: 'urs', x: 260, y: 60 },
        { id: 'vulpe', emoji: 'vulpe', x: 80, y: 160 }, { id: 'iepure', emoji: 'iepure', x: 190, y: 150 }, { id: 'panda', emoji: 'panda', x: 280, y: 165 },
      ],
      edges: [['pisica', 'caine'], ['caine', 'urs'], ['pisica', 'vulpe'], ['caine', 'iepure'], ['vulpe', 'iepure'], ['iepure', 'panda'], ['urs', 'iepure']],
      mark: ['iepure'],
    },
  ],
});

// ——— Turneul: tablou eliminatoriu cu 4 sau 8 jucători ———
// players: [emoji] (în ordinea meciurilor din primul tur) · rounds: [[câștigătorii turului 1], [turului 2], …, [campionul]]
// Câștigătorul urcă pe linie plină și groasă, cel care pierde rămâne pe linie punctată.
function bracketMatches(p) {
  const matches = [];
  let field = arr(p.players);
  for (const winners of arr(p.rounds)) {
    arr(winners).forEach((w, i) => matches.push({ a: field[2 * i], b: field[2 * i + 1], w }));
    field = arr(winners);
  }
  return matches;
}

registerVisual('bracket', {
  group: GROUP,
  viewBox: (p) => (arr(p.players).length === 8 ? '0 0 320 216' : '0 0 320 190'),
  check: (p) => {
    const players = arr(p.players);
    const errors = [];
    if (![4, 8].includes(players.length)) errors.push('4 sau 8 jucători');
    if (new Set(players).size !== players.length) errors.push('jucători diferiți');
    for (const e of players) if (!hasEmoji(e)) errors.push(`emoji necunoscut „${e}”`);
    const rounds = arr(p.rounds);
    let field = players;
    rounds.forEach((winners, r) => {
      if (arr(winners).length !== field.length / 2) errors.push(`turul ${r + 1} are ${field.length / 2} câștigători`);
      arr(winners).forEach((w, i) => {
        if (w !== field[2 * i] && w !== field[2 * i + 1]) errors.push(`turul ${r + 1}: „${w}” n-a jucat meciul ${i + 1}`);
      });
      field = arr(winners);
    });
    if (field.length !== 1) errors.push('turneul se termină cu un campion');
    return errors;
  },
  label: (p) => `turneu: ${bracketMatches(p).map((m) => `${nameOf({ emoji: m.a })} cu ${nameOf({ emoji: m.b })}, câștigă: ${nameOf({ emoji: m.w })}`).join('; ')}`,
  render: (p) => {
    const players = arr(p.players);
    const eight = players.length === 8;
    // pozițiile jucătorilor și ale câștigătorilor pe tururi; la 8, tabloul are două jumătăți, cu finala la mijloc
    const cols = eight
      ? [
          [[28, 26], [28, 78], [28, 138], [28, 190], [292, 26], [292, 78], [292, 138], [292, 190]],
          [[78, 52], [78, 164], [242, 52], [242, 164]],
          [[118, 108], [202, 108]],
          [[160, 108]],
        ]
      : [
          [[36, 28], [36, 74], [36, 118], [36, 164]],
          [[146, 51], [146, 141]],
          [[252, 96]],
        ];
    const nodes = [players, ...arr(p.rounds)];
    const marked = new Set(arr(p.mark));
    let out = '';
    // legăturile: de la fiecare jucător la nodul meciului lui (colț drept), câștigătorul cu linie plină
    for (let r = 1; r < nodes.length; r++) {
      nodes[r].forEach((w, i) => {
        const [tx, ty] = cols[r][i];
        for (const k of [2 * i, 2 * i + 1]) {
          const [fx, fy] = cols[r - 1][k];
          const win = nodes[r - 1][k] === w;
          const mid = r1((fx + tx) / 2);
          out += `<polyline points="${fx},${fy} ${mid},${fy} ${mid},${ty} ${tx},${ty}" fill="none" stroke="${win ? C.ink : C.grayDark}" stroke-width="${win ? 3.5 : 2}"${win ? '' : ' stroke-dasharray="5 5"'} stroke-linejoin="round" stroke-linecap="round"/>`;
        }
      });
    }
    nodes.forEach((row, r) =>
      row.forEach((e, i) => {
        const [x, y] = cols[r][i];
        const final = r === nodes.length - 1;
        out += `<circle cx="${x}" cy="${y}" r="${final ? 20 : 17}" fill="${final ? C.yellowLight : C.white}" ${st(final ? 3 : 2.5)}/>` + emojiImage(e, x - 13, y - 13, 26);
        if (marked.has(e) && r === 0) out += `<circle cx="${x}" cy="${y}" r="23" fill="none" ${st(3.5)}/>`;
      }),
    );
    out += eight ? emojiImage('trofeu', 146, 150, SIZE.emoji) : emojiImage('trofeu', 282, 82, SIZE.emoji);
    return out;
  },
  demos: [
    { players: ['urs', 'vulpe', 'iepure', 'pisica'], rounds: [['urs', 'pisica'], ['pisica']] },
    { players: ['urs', 'vulpe', 'iepure', 'pisica', 'caine', 'panda', 'leu', 'tigru'], rounds: [['vulpe', 'iepure', 'caine', 'tigru'], ['vulpe', 'tigru'], ['tigru']], mark: ['vulpe'] },
  ],
});

// ——— Arborele: sume, alegeri, clasificare (da / nu), crengile veveriței ———
// nodes: [{ id, parent?, edge? (eticheta ramurii de la părinte), value? | emoji? | text? | slot? }] · grow: 'down' | 'up'
// style: 'plain' | 'branch' (crengi maro, cu veverița la trunchi) · mark: [id] (drumul evidențiat: nodurile și ramurile spre ele)
// loc între două niveluri pentru eticheta ramurii (da / nu, alunele); crengile veveriței n-au căsuțe, deci le ajunge mai puțin
const levelOf = (p) => (p.style === 'branch' ? 60 : 70);
export function treeLayout(nodes) {
  const list = arr(nodes);
  const kids = new Map(list.map((n) => [n.id, []]));
  let root = null;
  for (const n of list) {
    if (has(n.parent)) kids.get(n.parent)?.push(n);
    else root = n;
  }
  const depth = new Map();
  const leaves = [];
  const walk = (n, d) => {
    depth.set(n.id, d);
    const ch = kids.get(n.id);
    if (!ch.length) leaves.push(n.id);
    ch.forEach((c) => walk(c, d + 1));
  };
  if (root) walk(root, 0);
  const x = new Map(leaves.map((id, i) => [id, 12 + (i + 0.5) * (296 / leaves.length)]));
  const place = (n) => {
    const ch = kids.get(n.id);
    if (!ch.length) return;
    ch.forEach(place);
    x.set(n.id, ch.reduce((s, c) => s + x.get(c.id), 0) / ch.length);
  };
  if (root) place(root);
  return { root, kids, depth, x, leaves, levels: Math.max(0, ...depth.values()) + 1 };
}

const treeHeight = (p) => 60 + levelOf(p) * (treeLayout(p.nodes).levels - 1);

registerVisual('tree', {
  group: GROUP,
  defaults: { grow: 'down', style: 'plain' },
  viewBox: (p) => `0 0 320 ${treeHeight(p)}`,
  check: (p) => {
    const list = arr(p.nodes);
    const ids = byIdOf(list);
    const errors = [];
    if (list.length < 3 || list.length > 16) errors.push(`între 3 și 16 noduri (acum ${list.length})`);
    if (ids.size !== list.length) errors.push('nodurile au id-uri diferite');
    if (list.filter((n) => !has(n.parent)).length !== 1) errors.push('un singur nod fără părinte (rădăcina)');
    for (const n of list) {
      if (has(n.parent) && !ids.has(n.parent)) errors.push(`nodul „${n.id}”: părinte necunoscut`);
      if (n.emoji && !hasEmoji(n.emoji)) errors.push(`nodul „${n.id}”: emoji necunoscut`);
      if (has(n.value) && !(Number.isInteger(n.value) && n.value >= 0)) errors.push(`nodul „${n.id}”: valoare naturală`);
    }
    const { leaves, levels, depth } = treeLayout(list);
    if (depth.size !== list.length) errors.push('toate nodurile se leagă de rădăcină');
    if (leaves.length > 8) errors.push('cel mult 8 frunze');
    if (levels > 4) errors.push('cel mult 4 niveluri');
    return errors;
  },
  label: (p) => {
    const list = arr(p.nodes);
    const ids = byIdOf(list);
    const say = (n) => (n.slot ? 'semnul întrebării' : n.blank ? 'căsuță goală' : has(n.value) ? String(n.value) : has(n.text) ? n.text : n.emoji ? nameOf({ emoji: n.emoji }) : 'ramificație');
    const kind = p.style === 'branch' ? 'crengi' : 'arbore';
    return `${kind}: ${list.filter((n) => has(n.parent)).map((n) => `${say(ids.get(n.parent))} → ${has(n.edge) ? `(${n.edge}) ` : ''}${say(n)}`).join('; ')}`;
  },
  render: (p) => {
    const list = arr(p.nodes);
    const ids = byIdOf(list);
    const { depth, x, levels } = treeLayout(list);
    const level = levelOf(p);
    const h = 60 + level * (levels - 1);
    const branch = p.style === 'branch';
    const y = (id) => (p.grow === 'up' ? h - 30 - depth.get(id) * level : 30 + depth.get(id) * level);
    const marked = new Set(arr(p.mark));
    let out = '';
    // ramurile: întâi banda drumului marcat, apoi ramura, apoi eticheta ei
    for (const n of list) {
      if (!has(n.parent)) continue;
      const [x1, y1, x2, y2] = [r1(x.get(n.parent)), y(n.parent), r1(x.get(n.id)), y(n.id)];
      if (marked.has(n.id) && marked.has(n.parent)) out += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${C.yellow}" stroke-width="${branch ? 20 : 16}" stroke-linecap="round" opacity=".9"/>`;
      out += branch
        ? `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${C.brown}" stroke-width="9" stroke-linecap="round"/>`
        : `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${C.ink}" stroke-width="2.5" stroke-linecap="round"/>`;
    }
    for (const n of list) {
      if (!has(n.parent) || !has(n.edge)) continue;
      out += pill((x.get(n.parent) + x.get(n.id)) / 2, (y(n.parent) + y(n.id)) / 2, n.edge, typeof n.edge === 'number' ? SIZE.num : SIZE.label);
    }
    for (const n of list) {
      const [cx, cy] = [r1(x.get(n.id)), y(n.id)];
      const ring = marked.has(n.id);
      if (n.slot) {
        out += `<rect x="${cx - 24}" y="${cy - 18}" width="48" height="36" rx="8" fill="${C.white}" stroke="${C.ink}" stroke-width="2.5" stroke-dasharray="6 4"/>` + txt(cx, cy, '?', { size: SIZE.big });
      } else if (n.blank) {
        out += `<rect x="${cx - 24}" y="${cy - 18}" width="48" height="36" rx="8" fill="${C.grayLight}" stroke="${C.grayDark}" stroke-width="2" stroke-dasharray="4 4"/>`;
      } else if (has(n.value)) {
        const w = Math.max(48, r1(18 + textWidth(n.value, SIZE.num)));
        out += `<rect x="${r1(cx - w / 2)}" y="${cy - 18}" width="${w}" height="36" rx="8" fill="${C.white}" ${st(ring ? 3.5 : 2.5)}/>` + txt(cx, cy, n.value, { size: SIZE.num });
      } else if (has(n.text)) {
        const w = r1(20 + textWidth(n.text, SIZE.label));
        out += `<rect x="${r1(cx - w / 2)}" y="${cy - 17}" width="${w}" height="34" rx="10" fill="${C.cream}" ${st(ring ? 3.5 : 2)}/>` + txt(cx, cy, n.text, { size: SIZE.label });
      } else if (n.emoji) {
        if (!branch) out += `<circle cx="${cx}" cy="${cy}" r="20" fill="${C.white}" ${st(2)}/>`;
        out += emojiImage(n.emoji, r1(cx - 14), cy - 14, SIZE.emoji);
        if (ring) out += `<circle cx="${cx}" cy="${cy}" r="24" fill="none" ${st(3.5)}/>`;
      }
    }
    // legenda alunelor stă jos, în colțul liber de lângă trunchi (sus sunt capetele crengilor)
    // (text de numere: crengile cu 4 niveluri ies mai mici pe ecran, iar legenda trebuie să se citească la fel)
    if (branch) out += emojiImage('castana', 8, h - 30, SIZE.small) + txt(38, h - 18, 'alune', { size: SIZE.num, anchor: 'start' });
    return out;
  },
  demos: [
    { nodes: [{ id: 'r', value: 50 }, { id: 'a', parent: 'r', value: 20 }, { id: 'b', parent: 'r', slot: true }, { id: 'a1', parent: 'a', value: 12 }, { id: 'a2', parent: 'a', value: 8 }, { id: 'b1', parent: 'b', value: 14 }, { id: 'b2', parent: 'b', value: 16 }] },
    {
      nodes: [
        { id: 'q', text: 'Are pene?' }, { id: 'q1', parent: 'q', edge: 'da', text: 'Zboară?' }, { id: 'q2', parent: 'q', edge: 'nu', text: 'Înoată?' },
        { id: 'A', parent: 'q1', edge: 'da', text: 'A' }, { id: 'B', parent: 'q1', edge: 'nu', text: 'B' }, { id: 'C', parent: 'q2', edge: 'da', text: 'C' }, { id: 'D', parent: 'q2', edge: 'nu', text: 'D' },
      ],
      mark: ['q', 'q1', 'B'],
    },
    {
      grow: 'up',
      style: 'branch',
      nodes: [
        { id: 't', emoji: 'veverita' }, { id: 'l', parent: 't', edge: 3 }, { id: 'r', parent: 't', edge: 5 },
        { id: 'l1', parent: 'l', edge: 4, emoji: 'mar' }, { id: 'l2', parent: 'l', edge: 6, emoji: 'para' }, { id: 'r1', parent: 'r', edge: 2, emoji: 'cirese' }, { id: 'r2', parent: 'r', edge: 1, emoji: 'lamaie' },
      ],
      mark: ['t', 'l', 'l2'],
    },
  ],
});
