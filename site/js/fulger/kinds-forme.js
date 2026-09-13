// Jocuri fulger: tipurile cu figuri, fără calcule (șiruri, intruși, analogii, tabele). Întrebarea are modul `figure`:
//   { kind, mode: 'figure', key, prompt, figure?, solved?, choices: [id, …], options: { id: desen }, answer: id }
// `figure` e desenul întrebării (de exemplu șirul cu caseta „?”), `solved` același desen rezolvat, arătat după răspuns. Variantele sunt
// desene din banca vizuală (`{ v: 'glyph', … }`), iar id-ul unei variante e cheia ei canonică. Culoarea nu e niciodată singurul
// indiciu: variantele diferă între ele și fără culori. Regulile fiecărui tip, cu răspunsul găsit independent, sunt în
// tests/fulger-forme.rules.js.

import { canonical, COLORS, FILLS, glyphKey, normRot, ROTS, SHAPES, SIZES } from '../core/forme.js';
import { int, pickOne, shuffle } from './rand.js';

const MODELE = 'mat.log.modele';
const CLASIFICARE = 'mat.log.clasificare';
const FIGURI = 'mat.geo.figuri';
const ANALOGII = 'mat.log.analogii';

// figuri ușor de deosebit și de numit
const EASY = ['patrat', 'cerc', 'triunghi', 'stea', 'inima', 'cruce', 'romb', 'semicerc', 'casa'];
// figuri la care fiecare sfert de rotire se vede (forme diferite: două triunghiuri într-o întrebare s-ar încurca)
const TURNING = [{ shape: 'sageata' }, { shape: 'semicerc' }, { shape: 'casa' }, { shape: 'triunghi' }];
// unitățile care se repetă: AB, AAB, ABB, ABC
const UNITS = [[0, 1], [0, 0, 1], [0, 1, 1], [0, 1, 2]];

const paint = (rand, n) => shuffle(rand, COLORS).slice(0, n);

/** O figură ca desen, doar cu câmpurile care contează (obiectul rămâne același după JSON). */
function glyph(g) {
  const spec = { v: 'glyph', shape: g.shape };
  if (g.variant) spec.variant = g.variant;
  spec.fill = g.fill ?? 'plin';
  spec.color = g.color ?? 'albastru'; // și la „gol”, unde nu se vede: o figură golită, apoi umplută, își păstrează culoarea
  spec.size = g.size ?? 'mare';
  spec.rot = normRot(g.rot ?? 0);
  if (g.flip) spec.flip = true;
  if (g.count) spec.count = g.count;
  if (g.axis) spec.axis = g.axis;
  return spec;
}

const cellOf = ({ v, ...g }) => g;

/** Id-ul unei variante: cheia canonică a figurii (două variante care arată la fel au același id). */
export function artId(spec) {
  if (spec.v === 'glyph') return `${glyphKey(spec)}${spec.axis ? `|${spec.axis}` : ''}`;
  if (spec.emoji) return `emoji:${spec.emoji}`;
  if (spec.text !== undefined) return `text:${spec.text}`;
  const { v, ...params } = spec;
  return `${v}:${JSON.stringify(params)}`;
}

/** Id-ul fără culoare: două variante care diferă doar prin culoare au același id aici. */
export const bareId = (spec) => (spec.v === 'glyph' ? artId({ ...spec, color: 'albastru' }) : artId(spec));

/**
 * Întrebarea cu figuri: răspunsul și primii 3 distractori diferiți de el și între ei chiar și fără culori, în ordinea dată (greșelile
 * tipice întâi), amestecați, cu răspunsul pe o poziție la întâmplare. Întoarce null când nu sunt destui (generatorul reîncearcă).
 */
export function figureQuestion(kind, rand, { prompt, figure = null, solved = null, key, answer, distractors }) {
  const seen = new Set([bareId(answer)]);
  const picked = [];
  for (const d of distractors) {
    if (!d || picked.length === 3 || seen.has(bareId(d))) continue;
    seen.add(bareId(d));
    picked.push(d);
  }
  if (picked.length < 3) return null;
  const specs = shuffle(rand, picked);
  specs.splice(int(rand, 0, 3), 0, answer);
  const choices = specs.map(artId);
  return {
    kind,
    mode: 'figure',
    key: `${kind}:${key}`,
    prompt,
    ...(figure && { figure }),
    ...(solved && { solved }),
    choices,
    options: Object.fromEntries(specs.map((s, i) => [choices[i], s])),
    answer: artId(answer),
  };
}

/** Un șir de figuri cu caseta „?” în locul figurii `slot`; varianta rezolvată are figura găsită încercuită. */
function sequence(kind, rand, { full, slot = full.length - 1, prompt = 'Ce urmează?', distractors }) {
  const specs = full.map(glyph);
  const cells = specs.map(cellOf);
  return figureQuestion(kind, rand, {
    prompt,
    figure: { v: 'glyph-cells', cols: cells.length, cells: cells.map((c, i) => (i === slot ? { slot: true } : c)) },
    solved: { v: 'glyph-cells', cols: cells.length, cells, mark: slot },
    key: specs.map((s, i) => (i === slot ? '?' : bareId(s))).join(','),
    answer: specs[slot],
    distractors: distractors.filter(Boolean).map(glyph),
  });
}

// ——— intrușii ———

// familiile pentru intrusul după formă: membrii (cu variante) și intrușii potriviți (fără pătrat printre dreptunghiuri: și el e dreptunghi)
const FAMILIES = [
  { members: [{ shape: 'triunghi' }, { shape: 'triunghi', variant: 'ascutit' }, { shape: 'triunghi', variant: 'dreptunghic' }], intruders: ['patrat', 'cerc', 'semicerc', 'casa', 'romb'] },
  { members: [{ shape: 'patrat' }], intruders: ['romb', 'triunghi', 'cerc', 'trapez'] },
  { members: [{ shape: 'dreptunghi' }, { shape: 'dreptunghi', variant: 'ingust' }], intruders: ['paralelogram', 'oval', 'trapez', 'triunghi'] },
  { members: [{ shape: 'cerc' }], intruders: ['oval', 'semicerc', 'patrat'] },
  { members: [{ shape: 'semicerc' }], intruders: ['triunghi', 'cerc', 'oval'] },
];
const CURVED = Object.keys(SHAPES).filter((s) => SHAPES[s].curved);
const STRAIGHT = ['patrat', 'dreptunghi', 'triunghi', 'romb', 'trapez', 'casa', 'stea', 'cruce'];
const QUADS = ['patrat', 'dreptunghi', 'romb', 'trapez', 'paralelogram'];
const CORNERS = { triunghi: 3, patrat: 4, dreptunghi: 4, romb: 4, trapez: 4, paralelogram: 4, casa: 5 }; // figurile convexe

// însușirile după care un copil poate căuta intrusul (culoarea e aceeași la toate figurile unei întrebări)
const TRAITS = {
  forma: (g) => g.shape,
  umplere: (g) => g.fill,
  marime: (g) => g.size,
  rotire: (g) => canonical(g).rot !== 0 || canonical(g).flip,
  curbe: (g) => Boolean(SHAPES[g.shape].curved),
  colturi: (g) => CORNERS[g.shape] ?? null,
};

/** Poziția singurei valori diferite când celelalte sunt la fel („3 la fel + 1”), altfel -1. */
export function oddIndex(list) {
  return list.findIndex((v, i) => {
    const rest = list.filter((_, j) => j !== i);
    return v !== rest[0] && rest.every((w) => w === rest[0]);
  });
}

/** 4 valori fără tiparul „3 la fel + 1 diferit”, care ar arăta alt intrus. */
function noOdd(rand, values) {
  for (;;) {
    const list = Array.from({ length: 4 }, () => pickOne(rand, values));
    if (oddIndex(list) < 0) return list;
  }
}

/** Intrusul (ultima figură) e singurul: `criterion` îl arată, însușirile `free` îl arată tot pe el sau pe nimeni, restul pe nimeni. */
function onlyIntruder(figures, criterion, free) {
  const last = figures.length - 1;
  return Object.entries(TRAITS).every(([name, trait]) => {
    const odd = oddIndex(figures.map(trait));
    return name === criterion ? odd === last : free.includes(name) ? odd < 0 || odd === last : odd < 0;
  });
}

// ——— analogiile ———

// schimbările unei figuri; `pick: false` = folosită doar ca să verificăm că nicio altă schimbare nu explică analogia
const CHANGES = [
  { id: 'gol', group: 'fill', pick: true, apply: (g) => ({ ...g, fill: 'gol' }) },
  { id: 'plin', group: 'fill', pick: true, apply: (g) => ({ ...g, fill: 'plin' }) },
  { id: 'dungi', group: 'fill', pick: true, apply: (g) => ({ ...g, fill: 'dungi' }) },
  { id: 'mic', group: 'size', pick: true, apply: (g) => ({ ...g, size: 'mic' }) },
  { id: 'mare', group: 'size', pick: true, apply: (g) => ({ ...g, size: 'mare' }) },
  { id: 'dreapta', group: 'turn', pick: true, apply: (g) => ({ ...g, rot: normRot(g.rot + 90) }) },
  { id: 'stanga', group: 'turn', pick: true, apply: (g) => ({ ...g, rot: normRot(g.rot - 90) }) },
  { id: 'rasturnat', group: 'turn', pick: true, apply: (g) => ({ ...g, rot: normRot(g.rot + 180) }) },
  { id: 'oglinda', group: 'turn', pick: false, apply: (g) => ({ ...g, flip: !g.flip }) },
];
const changed = (t, spec) => glyph(t.apply(spec));

/** Aceeași figură, rotită cu un sfert (sau cu o optime, la săgeată) la fiecare pas. */
function turning(rand) {
  const base = pickOne(rand, TURNING);
  const eighth = base.shape === 'sageata' && rand() < 0.3;
  const step = (eighth ? 45 : 90) * (rand() < 0.5 ? 1 : -1);
  const start = eighth ? int(rand, 0, 7) * 45 : int(rand, 0, 3) * 90;
  const color = pickOne(rand, COLORS);
  const shown = int(rand, 4, 5);
  const at = (i) => ({ ...base, color, rot: start + i * step });
  // distractori: nerotită (ultima figură), rotită în sens invers, rotită cu doi pași
  return sequence('sir-rotire', rand, { full: Array.from({ length: shown + 1 }, (_, i) => at(i)), distractors: [at(shown - 1), at(shown - 2), at(shown + 1)] });
}

/** Un șir care crește sau scade cu câte o figură; formele pot și alterna. */
function growing(rand) {
  const up = rand() < 0.6;
  const shown = int(rand, 3, 4);
  const first = up ? int(rand, 1, 6 - shown) : int(rand, shown + 1, 6);
  const d = up ? 1 : -1;
  const shapes = shuffle(rand, ['cerc', 'patrat', 'triunghi', 'stea', 'inima']).slice(0, 3);
  const colors = paint(rand, 3);
  const period = rand() < 0.5 ? 1 : 2;
  const at = (i, count = first + i * d) => ({ shape: shapes[i % period], color: colors[i % period], count });
  const full = Array.from({ length: shown + 1 }, (_, i) => at(i));
  const answer = full[shown];
  const other = (u) => ({ ...answer, shape: shapes[u], color: colors[u] });
  const distractors = [
    { ...answer, count: answer.count - d }, // nu mai crește
    period === 2 ? other((shown + 1) % 2) : other(1), // numărul bun, forma greșită
    { ...answer, count: answer.count + d }, // un pas în plus
    other(2),
  ];
  return sequence('sir-rotire', rand, { full, distractors: distractors.filter((g) => g.count >= 1 && g.count <= 6) });
}

export const SHAPE_KINDS = {
  'sir-simplu': {
    label: 'Ce urmează într-un șir',
    points: 1,
    fastMs: 3500,
    mode: 'figure',
    concepts: [MODELE],
    generate(rand) {
      for (;;) {
        const unit = pickOne(rand, UNITS);
        const shapes = shuffle(rand, EASY).slice(0, 4);
        const colors = paint(rand, 4);
        const item = (u) => ({ shape: shapes[u], color: colors[u] });
        const at = (i) => item(unit[i % unit.length]);
        const offset = int(rand, 0, unit.length - 1);
        const shown = unit.length === 2 ? int(rand, 5, 6) : 6;
        const full = Array.from({ length: shown + 1 }, (_, i) => at(offset + i));
        const small = rand() < 0.4;
        const q = sequence('sir-simplu', rand, {
          full,
          // distractori: ultima figură repetată, figura de după, figura bună dar mică, celelalte figuri
          distractors: [full[shown - 1], at(offset + shown + 1), small && { ...full[shown], size: 'mic' }, ...[0, 1, 2, 3].map(item)],
        });
        if (q) return q;
      }
    },
  },
  'sir-doua': {
    label: 'Șiruri după două însușiri',
    points: 2,
    fastMs: 5000,
    mode: 'figure',
    concepts: [MODELE],
    generate(rand) {
      for (;;) {
        const second = pickOne(rand, ['fill', 'fill', 'size', 'rot']); // a doua însușire: umplerea, mărimea sau orientarea
        const shapeUnit = pickOne(rand, UNITS);
        const L = shapeUnit.length;
        const attrUnit = pickOne(rand, UNITS.filter((u) => u.length === L && (second !== 'size' || Math.max(...u) < 2)));
        const shift = int(rand, 0, L - 1);
        const pool = second === 'rot' ? shuffle(rand, TURNING) : shuffle(rand, EASY).map((shape) => ({ shape }));
        const values = second === 'fill' ? shuffle(rand, FILLS) : second === 'size' ? shuffle(rand, ['mare', 'mic']) : shuffle(rand, [0, 90, 180, 270]);
        const colors = paint(rand, 4);
        const make = (s, a) => ({ ...pool[s], color: colors[s], [second]: values[a] });
        const at = (i) => make(shapeUnit[i % L], attrUnit[(i + shift) % L]);
        const offset = int(rand, 0, L - 1);
        const shown = L === 2 ? int(rand, 5, 6) : 6;
        const full = Array.from({ length: shown + 1 }, (_, i) => at(offset + i));
        const [s, a] = [shapeUnit[(offset + shown) % L], attrUnit[(offset + shown + shift) % L]];
        const used = [...new Set(attrUnit)];
        const q = sequence('sir-doua', rand, {
          full,
          distractors: [
            ...[...used, ...values.keys()].filter((x) => x !== a).map((x) => make(s, x)).slice(0, 1), // forma bună, cealaltă însușire greșită
            ...[0, 1, 2, 3].filter((x) => x !== s).map((x) => make(x, a)).slice(0, 1), // însușirea bună, forma greșită
            full[shown - 1],
            at(offset + shown + 1),
            ...[...values.keys()].filter((x) => x !== a).map((x) => make(s, x)),
          ],
        });
        if (q) return q;
      }
    },
  },
  'sir-lipsa': {
    label: 'Ce lipsește dintr-un șir',
    points: 2,
    fastMs: 5000,
    mode: 'figure',
    concepts: [MODELE],
    generate(rand) {
      for (;;) {
        const unit = pickOne(rand, UNITS);
        const withFill = rand() < 0.4; // figurile A și C pline, B golită sau cu dungi
        const shapes = shuffle(rand, EASY).slice(0, 4);
        const colors = paint(rand, 4);
        const other = pickOne(rand, ['gol', 'dungi']);
        const item = (u, fill = withFill && u === 1 ? other : 'plin') => ({ shape: shapes[u], color: colors[u], fill });
        const at = (i) => item(unit[i % unit.length]);
        const offset = int(rand, 0, unit.length - 1);
        const full = Array.from({ length: 7 }, (_, i) => at(offset + i));
        const slot = int(rand, 1, 5);
        const u = unit[(offset + slot) % unit.length];
        const q = sequence('sir-lipsa', rand, {
          full,
          slot,
          prompt: 'Ce lipsește?',
          // distractori: vecinii casetei, figura bună cu altă umplere sau mică, celelalte figuri
          distractors: [full[slot - 1], full[slot + 1], withFill && item(u, u === 1 ? 'plin' : other), { ...full[slot], size: 'mic' }, ...[0, 1, 2, 3].map((x) => item(x))],
        });
        if (q) return q;
      }
    },
  },
  'sir-rotire': {
    label: 'Șiruri care se rotesc sau cresc',
    points: 3,
    fastMs: 6000,
    mode: 'figure',
    concepts: [MODELE],
    generate(rand) {
      for (;;) {
        const q = rand() < 0.65 ? turning(rand) : growing(rand);
        if (q) return q;
      }
    },
  },
  'intrus-forma': {
    label: 'Intrusul după formă',
    points: 2,
    fastMs: 4500,
    mode: 'figure',
    concepts: [CLASIFICARE, FIGURI],
    generate(rand) {
      for (;;) {
        const family = pickOne(rand, FAMILIES);
        const color = pickOne(rand, COLORS);
        const fills = noOdd(rand, FILLS);
        const sizes = noOdd(rand, SIZES);
        // trei figuri din familie, rotite neobișnuit, și intrusul; umplerea, mărimea și rotirea nu-l dau de gol
        const figures = [0, 1, 2, 3].map((i) => ({
          ...(i < 3 ? pickOne(rand, family.members) : { shape: pickOne(rand, family.intruders) }),
          rot: pickOne(rand, ROTS),
          fill: fills[i],
          size: sizes[i],
          color,
        }));
        const turned = figures.slice(0, 3).filter((g) => TRAITS.rotire(g)).length;
        if ((family.members[0].shape !== 'cerc' && turned < 2) || !onlyIntruder(figures, 'forma', ['curbe', 'colturi'])) continue;
        const specs = figures.map(glyph);
        const q = figureQuestion('intrus-forma', rand, { prompt: 'Găsește intrusul!', key: specs.map(bareId).sort().join(','), answer: specs[3], distractors: specs.slice(0, 3) });
        if (q) return q;
      }
    },
  },
  'intrus-insusire': {
    label: 'Intrusul după o însușire',
    points: 3,
    fastMs: 6000,
    mode: 'figure',
    concepts: [CLASIFICARE, FIGURI],
    generate(rand) {
      for (;;) {
        // criteriul: umplerea, mărimea, laturile curbe sau numărul de colțuri; formele sunt toate diferite
        const criterion = pickOne(rand, ['umplere', 'marime', 'curbe', 'colturi']);
        let shapes;
        if (criterion === 'curbe') {
          const [curved, straight] = [shuffle(rand, CURVED), shuffle(rand, STRAIGHT)];
          shapes = rand() < 0.5 ? [...curved.slice(0, 3), straight[0]] : [...straight.slice(0, 3), curved[0]];
        } else if (criterion === 'colturi') {
          shapes = [...shuffle(rand, QUADS).slice(0, 3), pickOne(rand, ['triunghi', 'casa'])];
        } else {
          shapes = shuffle(rand, [...EASY, 'dreptunghi', 'trapez', 'oval']).slice(0, 4);
        }
        const odd = (values) => {
          const [a, b] = shuffle(rand, values);
          return [a, a, a, b];
        };
        const fills = criterion === 'umplere' ? odd(FILLS) : noOdd(rand, FILLS);
        const sizes = criterion === 'marime' ? odd(SIZES) : noOdd(rand, SIZES);
        const color = pickOne(rand, COLORS);
        const figures = shapes.map((shape, i) => ({ shape, fill: fills[i], size: sizes[i], color }));
        if (!onlyIntruder(figures, criterion, ['umplere', 'marime', 'curbe', 'colturi'].filter((t) => t !== criterion))) continue;
        const specs = figures.map(glyph);
        const q = figureQuestion('intrus-insusire', rand, { prompt: 'Găsește intrusul!', key: specs.map(bareId).sort().join(','), answer: specs[3], distractors: specs.slice(0, 3) });
        if (q) return q;
      }
    },
  },
  analogie: {
    label: 'Analogii cu figuri',
    points: 3,
    fastMs: 7000,
    mode: 'figure',
    concepts: [ANALOGII],
    generate(rand) {
      for (;;) {
        const change = pickOne(rand, CHANGES.filter((t) => t.pick));
        const [a, c] = shuffle(rand, change.group === 'turn' ? TURNING : EASY.map((shape) => ({ shape }))).slice(0, 2);
        const [colorA, colorC] = paint(rand, 2);
        const fill = pickOne(rand, FILLS.filter((f) => f !== change.id));
        const size = change.id === 'mare' ? 'mic' : 'mare';
        const A = glyph({ ...a, color: colorA, fill, size });
        const C = glyph({ ...c, color: colorC, fill, size });
        const [B, D] = [changed(change, A), changed(change, C)];
        // schimbarea se vede pe ambele figuri, iar orice schimbare care duce A în B duce C în aceeași figură
        if (bareId(A) === bareId(B) || bareId(C) === bareId(D)) continue;
        if (new Set(CHANGES.filter((t) => bareId(changed(t, A)) === bareId(B)).map((t) => bareId(changed(t, C)))).size !== 1) continue;
        const siblings = shuffle(rand, CHANGES.filter((t) => t.pick && t.group === change.group && t !== change));
        const others = shuffle(rand, CHANGES.filter((t) => t.pick && t.group !== change.group));
        const top = [cellOf(A), { sep: '→' }, cellOf(B), cellOf(C), { sep: '→' }];
        const q = figureQuestion('analogie', rand, {
          prompt: 'Se schimbă la fel. Ce urmează?',
          figure: { v: 'glyph-cells', cols: 3, cells: [...top, { slot: true }] },
          solved: { v: 'glyph-cells', cols: 3, cells: [...top, cellOf(D)], mark: 5 },
          key: `${bareId(A)}>${bareId(B)}|${bareId(C)}`,
          answer: D,
          // distractori: altă schimbare de același fel, uneori C neschimbată sau o copie a lui B, apoi alte schimbări
          distractors: [rand() < 0.35 && C, ...siblings.map((t) => changed(t, C)), rand() < 0.2 && B, ...others.map((t) => changed(t, C))],
        });
        if (q) return q;
      }
    },
  },
  matrice: {
    label: 'Tabele cu reguli',
    points: 4,
    fastMs: 8000,
    mode: 'figure',
    concepts: [CLASIFICARE, ANALOGII],
    generate(rand) {
      for (;;) {
        const shapes = shuffle(rand, EASY).slice(0, 4);
        const colors = paint(rand, 4);
        const fills = shuffle(rand, FILLS);
        // obișnuit: rândurile după formă, coloanele după umplere; pătrat latin: fiecare formă o dată pe rând și pe coloană, umplerea după rând
        const latin = rand() < 0.4;
        const [pr, pc] = [shuffle(rand, [0, 1, 2]), shuffle(rand, [0, 1, 2])];
        const item = (s, f) => ({ shape: shapes[s], color: colors[s], fill: fills[f] });
        const grid = Array.from({ length: 9 }, (_, i) => {
          const [r, c] = [Math.floor(i / 3), i % 3];
          return latin ? item((pr[r] + pc[c]) % 3, r) : item(r, c);
        });
        const slot = rand() < 0.5 ? 8 : int(rand, 0, 7);
        const [r, c] = [Math.floor(slot / 3), slot % 3];
        const [s, f] = [shapes.indexOf(grid[slot].shape), fills.indexOf(grid[slot].fill)];
        const neighbors = [c > 0 && grid[slot - 1], c < 2 && grid[slot + 1], r > 0 && grid[slot - 3], r < 2 && grid[slot + 3]].filter(Boolean);
        const specs = grid.map(glyph);
        const q = figureQuestion('matrice', rand, {
          prompt: 'Ce lipsește din tabel?',
          figure: { v: 'glyph-cells', cols: 3, frame: true, cells: specs.map((g, i) => (i === slot ? { slot: true } : cellOf(g))) },
          solved: { v: 'glyph-cells', cols: 3, frame: true, cells: specs.map(cellOf), mark: slot },
          key: specs.map((g, i) => (i === slot ? '?' : bareId(g))).join(','),
          answer: specs[slot],
          // distractori: umplerea greșită, forma greșită, un vecin, apoi celelalte
          distractors: [item(s, (f + 1) % 3), item((s + 1) % 3, f), ...shuffle(rand, neighbors), item(s, (f + 2) % 3), item(3, f)].map(glyph),
        });
        if (q) return q;
      }
    },
  },
};
