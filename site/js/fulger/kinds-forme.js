// Jocuri fulger: tipurile cu figuri, fără calcule (șiruri, intruși, analogii, tabele). Întrebarea are modul `figure`:
//   { kind, mode: 'figure', key, prompt, figure?, solved?, choices: [id, …], options: { id: desen }, answer: id }
// `figure` e desenul întrebării (de exemplu șirul cu caseta „?”), `solved` același desen rezolvat, arătat după răspuns. Variantele sunt
// desene din banca vizuală (`{ v: 'glyph', … }`), iar id-ul unei variante e cheia ei canonică. Culoarea nu e niciodată singurul
// indiciu: variantele diferă între ele și fără culori. Regulile fiecărui tip, cu răspunsul găsit independent, sunt în
// tests/fulger-forme.rules.js.

import { axesCount, canonical, COLORS, FILLS, glyphKey, isAxis, linesFor, normRot, ROTS, SHAPES, SIZES } from '../core/forme.js';
import { cellsKey, connected, freeKey, isChiral, isCubeNet, mirror, normalize, orientations, polyominoes, rotations, size } from '../core/grile.js';
import { int, pickOne, shuffle, withChoices } from './rand.js';

const MODELE = 'mat.log.modele';
const CLASIFICARE = 'mat.log.clasificare';
const FIGURI = 'mat.geo.figuri';
const ANALOGII = 'mat.log.analogii';
const COMPUNERE = 'mat.geo.compunere';
const ROTIRE = 'mat.geo.rotire';
const SIMETRIE = 'mat.geo.simetrie';
const CORPURI = 'mat.geo.corpuri';
const NUMARARE = 'mat.geo.numarare-figuri';
const DESFASURARI = 'mat.geo.desfasurari';
const POZITII = 'mat.geo.pozitii';
const INTERIOR = 'mat.geo.interior-exterior';
const TRASEE = 'mat.geo.trasee';
const COORDONATE = 'mat.geo.coordonate';

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

/**
 * Id-ul fără culoare și fără mărime: variantele care diferă doar prin una dintre ele au aici același id. Mărimea nu poate deosebi
 * variantele, pentru că desenul întrebării și variantele au scări diferite (pe telefon, o figură „mare” din șir iese mai mică decât
 * o variantă „mică”).
 */
export const bareId = (spec) => (spec.v === 'glyph' ? artId({ ...spec, color: 'albastru', size: 'mare' }) : artId(spec));

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
  // mărimea nu e o schimbare de ales: desenul analogiei și variantele au scări diferite; rămâne doar în verificarea unicității
  { id: 'mic', group: 'size', pick: false, apply: (g) => ({ ...g, size: 'mic' }) },
  { id: 'mare', group: 'size', pick: false, apply: (g) => ({ ...g, size: 'mare' }) },
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
        const hollow = rand() < 0.4;
        const q = sequence('sir-simplu', rand, {
          full,
          // distractori: ultima figură repetată, figura de după, uneori figura bună dar goală, celelalte figuri (niciodată doar mai mică)
          distractors: [full[shown - 1], at(offset + shown + 1), hollow && { ...full[shown], fill: 'gol' }, ...[0, 1, 2, 3].map(item)],
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
        // a doua însușire: umplerea sau orientarea; nu mărimea, pentru că șirul și variantele sunt desenate la scări diferite
        const second = pickOne(rand, ['fill', 'fill', 'rot']);
        const shapeUnit = pickOne(rand, UNITS);
        const L = shapeUnit.length;
        const attrUnit = pickOne(rand, UNITS.filter((u) => u.length === L));
        const shift = int(rand, 0, L - 1);
        const pool = second === 'rot' ? shuffle(rand, TURNING) : shuffle(rand, EASY).map((shape) => ({ shape }));
        const values = second === 'fill' ? shuffle(rand, FILLS) : shuffle(rand, [0, 90, 180, 270]);
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
          // distractori: vecinii casetei, figura bună cu altă umplere, celelalte figuri (niciodată doar mai mică)
          distractors: [full[slot - 1], full[slot + 1], item(u, full[slot].fill === 'plin' ? other : 'plin'), ...[0, 1, 2, 3].map((x) => item(x))],
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
  'piesa-lipsa': {
    label: 'Piesa care umple golul',
    points: 2,
    fastMs: 5000,
    mode: 'figure',
    concepts: [COMPUNERE],
    generate(rand) {
      for (;;) {
        const n = pickOne(rand, [3, 4, 4]);
        const piece = pickOne(rand, orientations(pickOne(rand, polyominoes(n))));
        const { rows, cols, hole } = board(rand, piece);
        const [boardColor, color] = paint(rand, 2);
        // distractori: piesa cu o căsuță lipsă sau în plus (așezată la fel), apoi piese diferite cu tot atâtea căsuțe, care nu intră oricum
        // le-ai roti sau întoarce; niciodată aceeași piesă rotită
        const smaller = shuffle(rand, piece).map((cell) => piece.filter((x) => x !== cell)).filter(connected);
        const bigger = shuffle(rand, around(piece)).map((cell) => [...piece, cell]);
        const others = shuffle(rand, polyominoes(n).filter((p) => freeKey(p) !== freeKey(piece))).map((p) => pickOne(rand, orientations(p)));
        const options = [smaller[0], bigger[0], ...others, smaller[1], bigger[1]].filter(Boolean).map(normalize);
        const box = boxFor([piece, ...options]);
        const q = figureQuestion('piesa-lipsa', rand, {
          prompt: 'Ce piesă umple golul?',
          figure: boardArt(rows, cols, hole, boardColor),
          key: `${rows}x${cols}:${hole.map(([r, c]) => `${r}.${c}`).join(' ')}`,
          answer: pieceArt(piece, box, color),
          distractors: options.map((p) => pieceArt(p, box, color)),
        });
        if (q) return q;
      }
    },
  },
  'piesa-rotita': {
    label: 'Piesa rotită care umple golul',
    points: 3,
    fastMs: 7000,
    mode: 'figure',
    concepts: [COMPUNERE, ROTIRE],
    generate(rand) {
      for (;;) {
        const n = pickOne(rand, [4, 5, 5]);
        const base = pickOne(rand, polyominoes(n));
        const turns = rotations(base);
        if (turns.length < 2) continue; // pătratul arată la fel oricum l-ai roti
        const piece = pickOne(rand, turns);
        const answer = pickOne(rand, turns.filter((t) => cellsKey(t) !== cellsKey(piece)));
        const { rows, cols, hole } = board(rand, piece);
        const [boardColor, color] = paint(rand, 2);
        // distractori: piese diferite cu tot atâtea căsuțe, rotite la întâmplare (niciuna nu intră, nici întoarsă); fără imaginea în oglindă
        const others = shuffle(rand, polyominoes(n).filter((p) => freeKey(p) !== freeKey(base))).map((p) => pickOne(rand, orientations(p)));
        const box = boxFor([answer, ...others]);
        const q = figureQuestion('piesa-rotita', rand, {
          prompt: 'Ce piesă umple golul, dacă o rotești?',
          figure: boardArt(rows, cols, hole, boardColor),
          key: `${rows}x${cols}:${hole.map(([r, c]) => `${r}.${c}`).join(' ')}>${cellsKey(answer)}`,
          answer: pieceArt(answer, box, color),
          distractors: others.map((p) => pieceArt(p, box, color)),
        });
        if (q) return q;
      }
    },
  },
  'rotita-oglinda': {
    label: 'Aceeași piesă, doar rotită',
    points: 4,
    fastMs: 8000,
    mode: 'figure',
    concepts: [ROTIRE],
    generate(rand) {
      for (;;) {
        const n = pickOne(rand, [4, 5, 5]);
        const chiral = polyominoes(n).filter(isChiral);
        const base = pickOne(rand, chiral);
        const shown = pickOne(rand, rotations(base));
        const answer = pickOne(rand, rotations(base).filter((t) => cellsKey(t) !== cellsKey(shown)));
        // distractori: imaginea în oglindă, rotită în două feluri, și o altă piesă nesimetrică, rotită
        const mirrors = shuffle(rand, rotations(mirror(base)));
        const other = pickOne(rand, rotations(pickOne(rand, chiral.filter((p) => freeKey(p) !== freeKey(base)))));
        const options = [mirrors[0], mirrors[1], other, mirrors[2]].filter(Boolean);
        const box = boxFor([shown, answer, ...options]);
        const color = pickOne(rand, COLORS);
        const q = figureQuestion('rotita-oglinda', rand, {
          prompt: 'Care e aceeași piesă, doar rotită?',
          figure: pieceArt(shown, box, color),
          key: `${cellsKey(shown)}>${cellsKey(answer)}`,
          answer: pieceArt(answer, box, color),
          distractors: options.map((p) => pieceArt(p, box, color)),
        });
        if (q) return q;
      }
    },
  },
  'simetrie-axa': {
    label: 'Axa de simetrie',
    points: 2,
    fastMs: 4500,
    mode: 'figure',
    concepts: [SIMETRIE],
    generate(rand) {
      for (;;) {
        const g = { ...pickOne(rand, AXIS_SHAPES), rot: pickOne(rand, [0, 90, 180, 270]), fill: pickOne(rand, ['plin', 'plin', 'dungi']), color: pickOne(rand, COLORS) };
        const lines = linesFor(g);
        const axes = shuffle(rand, lines.filter((line) => isAxis(g, line)));
        // distractori: o diagonală care nu e axă (greșeala tipică la dreptunghi), apoi linia mutată de la mijloc sau cealaltă direcție
        const wrong = shuffle(rand, lines.filter((line) => !isAxis(g, line)));
        const ordered = [...wrong.filter((line) => line[0] === 'd').slice(0, 1), ...wrong.filter((line) => line[0] !== 'd'), ...wrong.filter((line) => line[0] === 'd').slice(1)];
        if (!axes.length) continue;
        const spec = glyph(g);
        const q = figureQuestion('simetrie-axa', rand, {
          prompt: 'Care linie e axă de simetrie?',
          key: `${bareId(spec)}|${axes[0]}`,
          answer: { ...spec, axis: axes[0] },
          distractors: ordered.map((axis) => ({ ...spec, axis })),
        });
        if (q) return q;
      }
    },
  },
  'simetrie-jumatate': {
    label: 'Figura completată în oglindă',
    points: 3,
    fastMs: 7000,
    mode: 'figure',
    concepts: [SIMETRIE],
    generate(rand) {
      for (;;) {
        const [rows, cols] = [4, 4];
        const axis = rand() < 0.7 ? 'v' : 'h';
        // prima jumătate: 3–5 dintre cele 8 căsuțe din stânga (sau de sus)
        const spots = Array.from({ length: 8 }, (_, i) => (axis === 'v' ? [Math.floor(i / 2), i % 2] : [i % 2, Math.floor(i / 2)]));
        const half = shuffle(rand, spots).slice(0, int(rand, 3, 5));
        const across = ([r, c]) => (axis === 'v' ? [r, cols - 1 - c] : [rows - 1 - r, c]);
        const shift = ([r, c]) => (axis === 'v' ? [r, c + cols / 2] : [r + rows / 2, c]);
        const turned = ([r, c]) => [rows - 1 - r, cols - 1 - c];
        const second = half.map(across);
        const moved = pickOne(rand, second);
        const target = pickOne(rand, spots.map(across).filter(([r, c]) => !second.some(([a, b]) => a === r && b === c)));
        const color = pickOne(rand, COLORS);
        const art = (cells) => ({ v: 'cell-grid', rows, cols, grid: true, axis, color, cells: sortCells(cells) });
        const q = figureQuestion('simetrie-jumatate', rand, {
          prompt: 'Cum arată figura completată în oglindă?',
          figure: art(half),
          key: `${axis}:${sortCells(half).map(([r, c]) => `${r}.${c}`).join(' ')}`,
          answer: art([...half, ...second]),
          // distractori: copia mutată, fără oglindire; copia răsturnată; oglindirea cu o căsuță greșită
          distractors: [art([...half, ...half.map(shift)]), art([...half, ...half.map(turned)]), art([...half, ...second.filter((x) => x !== moved), target])],
        });
        if (q) return q;
      }
    },
  },
  'axe-cate': {
    label: 'Câte axe de simetrie are figura',
    points: 4,
    fastMs: 7000,
    mode: 'figure',
    concepts: [SIMETRIE],
    generate(rand) {
      for (;;) {
        // întâi numărul de axe (fiecare variantă e răspunsul la fel de des), apoi o figură cu atâtea axe; variantele stau în ordine
        const count = pickOne(rand, [0, 1, 2, 4]);
        const g = { ...pickOne(rand, AXES_BY_COUNT[count]), rot: pickOne(rand, count === 4 ? [0, 45] : [0, 90, 180, 270]), fill: pickOne(rand, FILLS), color: pickOne(rand, COLORS) };
        if (axesCount(g) !== count) continue;
        const spec = glyph(g);
        const options = ['0', '1', '2', '4'].map((text) => ({ text }));
        return {
          kind: 'axe-cate',
          mode: 'figure',
          key: `axe-cate:${bareId(spec)}`,
          prompt: 'Câte axe de simetrie are figura?',
          figure: spec,
          choices: options.map(artId),
          options: Object.fromEntries(options.map((o) => [artId(o), o])),
          answer: artId({ text: String(count) }),
        };
      }
    },
  },
  figura: {
    label: 'Recunoaște figura',
    points: 1,
    fastMs: 3500,
    mode: 'figure',
    concepts: [FIGURI],
    generate(rand) {
      for (;;) {
        const target = pickOne(rand, PROGRAM);
        const color = pickOne(rand, COLORS);
        // distractori: celelalte figuri din programă, desenate și ele neobișnuit (fără pătrat când se cere un dreptunghi: și el e dreptunghi)
        const answer = glyph({ ...unusual(rand, target), color });
        const wrong = shuffle(rand, PROGRAM.filter((s) => s !== target && !(target === 'dreptunghi' && s === 'patrat'))).map((s) => glyph({ ...unusual(rand, s), color }));
        const q = figureQuestion('figura', rand, { prompt: `Care este un ${SHAPES[target].name}?`, key: [answer, ...wrong].map(bareId).join(','), answer, distractors: wrong });
        if (q) return q;
      }
    },
  },
  'figura-capcana': {
    label: 'Figura printre capcane',
    points: 3,
    fastMs: 5500,
    mode: 'figure',
    concepts: [FIGURI],
    generate(rand) {
      for (;;) {
        const target = pickOne(rand, PROGRAM);
        const color = pickOne(rand, COLORS);
        const answer = glyph({ ...unusual(rand, target), color });
        // capcanele seamănă cu figura, dar le lipsește ceva: unghiurile drepte, laturile egale, conturul închis sau laturile drepte
        const traps = shuffle(rand, TRAPS[target]).map((make) => {
          const g = make(rand);
          return g.open ? { ...glyph({ ...g, color }), open: true } : glyph({ ...g, color });
        });
        const q = figureQuestion('figura-capcana', rand, { prompt: `Care este un ${SHAPES[target].name}?`, key: [answer, ...traps].map(bareId).join(','), answer, distractors: traps });
        if (q) return q;
      }
    },
  },
  corpuri: {
    label: 'Corpuri și obiecte',
    points: 2,
    fastMs: 4500,
    mode: 'figure',
    concepts: [CORPURI],
    generate(rand) {
      for (;;) {
        const roll = rand();
        const solidArt = (name) => ({ v: 'solid', name });
        let q;
        if (roll < 0.4) {
          // obiect → corp; capcane: corpul cu care se încurcă și figura plană care seamănă (cerc pentru minge)
          const solid = pickOne(rand, Object.keys(OBJECTS));
          const object = pickOne(rand, OBJECTS[solid]);
          const plane = PLANE_TRAP[solid] ? glyph({ shape: PLANE_TRAP[solid], color: pickOne(rand, COLORS) }) : null;
          const others = shuffle(rand, SOLIDS.filter((s) => s !== solid && s !== TWIN[solid])).map(solidArt);
          q = figureQuestion('corpuri', rand, { prompt: 'Ce formă are obiectul?', figure: { emoji: object }, key: `obiect:${object}`, answer: solidArt(solid), distractors: [solidArt(TWIN[solid]), plane, ...others] });
        } else if (roll < 0.7) {
          // corp → obiect
          const solid = pickOne(rand, Object.keys(OBJECTS));
          const others = [TWIN[solid], ...shuffle(rand, SOLIDS.filter((s) => s !== solid && s !== TWIN[solid]))];
          q = figureQuestion('corpuri', rand, {
            prompt: 'Ce obiect are această formă?',
            figure: solidArt(solid),
            key: `corp:${solid}`,
            answer: { emoji: pickOne(rand, OBJECTS[solid]) },
            distractors: others.map((s) => ({ emoji: pickOne(rand, OBJECTS[s]) })),
          });
        } else {
          // urma lăsată pe nisip de fața de jos (capcana: triunghiul, cum se vede conul din lateral)
          const solid = pickOne(rand, Object.keys(FOOTPRINTS));
          const color = pickOne(rand, COLORS);
          const shapes = shuffle(rand, ['patrat', 'dreptunghi', 'cerc', 'triunghi'].filter((s) => s !== FOOTPRINTS[solid]));
          q = figureQuestion('corpuri', rand, { prompt: 'Ce urmă lasă pe nisip?', figure: solidArt(solid), key: `urma:${solid}`, answer: glyph({ shape: FOOTPRINTS[solid], color }), distractors: shapes.map((shape) => glyph({ shape, color })) });
        }
        if (q) return q;
      }
    },
  },
  'numara-figuri': {
    label: 'Numără figurile',
    points: 3,
    fastMs: 7000,
    mode: 'figure',
    concepts: [NUMARARE],
    generate(rand) {
      const roll = rand();
      let figure;
      let prompt;
      let answer;
      let typical;
      // răspunsul e între 4 și 6, ca să poată sta pe oricare dintre cele 4 locuri ale variantelor (care sunt în ordine crescătoare)
      if (roll < 0.12) {
        // greșelile tipice: doar triunghiurile mici, apoi cele mici și cel mare
        [figure, prompt, answer, typical] = [{ v: 'triangle-fan', cuts: 2 }, 'Câte triunghiuri sunt în desen?', 6, [3, 4]];
      } else if (roll < 0.2) {
        [figure, prompt, answer, typical] = [{ v: 'square-grid', n: 2 }, 'Câte pătrate sunt în desen?', 5, [4, 6]];
      } else if (roll < 0.3) {
        [figure, prompt, answer, typical] = [{ v: 'rect-strip', parts: 3 }, 'Câte dreptunghiuri sunt în desen?', 6, [3, 4]];
      } else {
        // figuri amestecate: cele cerute, unele rotite sau mici, printre figuri care seamănă; culorile nu ajută
        const target = pickOne(rand, ['triunghi', 'patrat', 'cerc']);
        answer = int(rand, 4, 6);
        const wanted = Array.from({ length: answer }, () => unusual(rand, target));
        const others = Array.from({ length: 8 - answer }, () => ({ ...pickOne(rand, LOOKALIKES[target]), rot: pickOne(rand, [0, 90, 180, 270]) }));
        const cells = shuffle(rand, [...wanted, ...others]).map((g) => cellOf(glyph({ ...g, color: pickOne(rand, COLORS) })));
        const turned = wanted.filter((g) => canonical(g).rot !== 0).length;
        figure = { v: 'glyph-cells', cols: 4, cells };
        prompt = `Câte ${SHAPES[target].plural} sunt în desen?`;
        typical = [answer - turned, answer + others.filter((g) => g.shape === CONFUSED[target]).length, answer + 1, answer - 1];
      }
      const options = withChoices(rand, answer, typical, { min: 1, max: 9 }).map((n) => ({ text: String(n) }));
      return {
        kind: 'numara-figuri',
        mode: 'figure',
        key: `numara-figuri:${figure.cells ? figure.cells.map((c) => bareId(glyph(c))).join(',') : JSON.stringify(figure)}`,
        prompt,
        figure,
        choices: options.map(artId),
        options: Object.fromEntries(options.map((o) => [artId(o), o])),
        answer: artId({ text: String(answer) }),
      };
    },
  },
  desfasurare: {
    label: 'Desfășurări',
    points: 4,
    fastMs: 9000,
    mode: 'figure',
    concepts: [DESFASURARI],
    generate(rand) {
      for (;;) {
        if (rand() < 0.4) {
          // desfășurare → corp: variantele sunt mereu cele 4 corpuri care se pot desfășura
          const name = pickOne(rand, NET_SOLIDS);
          const q = figureQuestion('desfasurare', rand, {
            prompt: 'Ce corp obții dacă o pliezi?',
            figure: { v: 'net', name },
            key: `corp:${name}`,
            answer: { v: 'solid', name },
            distractors: NET_SOLIDS.filter((s) => s !== name).map((s) => ({ v: 'solid', name: s })),
          });
          if (q) return q;
          continue;
        }
        // care piesă de 6 căsuțe se pliază într-un cub; celelalte arată plauzibil (fără 2 × 2 căsuțe pline, cel mult 5 pe un rând)
        const fits = (p) => Math.max(...size(p)) <= 5;
        const hexes = polyominoes(6).filter(fits);
        const net = pickOne(rand, orientations(pickOne(rand, hexes.filter(isCubeNet))));
        const wrong = shuffle(rand, hexes.filter((p) => !isCubeNet(p) && !hasBlock(p))).map((p) => pickOne(rand, orientations(p)));
        const box = boxFor([net, ...wrong.slice(0, 3)]);
        const color = pickOne(rand, COLORS);
        const q = figureQuestion('desfasurare', rand, {
          prompt: 'Care se pliază într-un cub?',
          key: `cub:${cellsKey(net)}|${wrong.slice(0, 3).map(cellsKey).join('|')}`,
          answer: pieceArt(net, box, color),
          distractors: wrong.slice(0, 3).map((p) => pieceArt(p, box, color)),
        });
        if (q) return q;
      }
    },
  },
  pozitii: {
    label: 'Stânga, dreapta, sus, jos, între',
    points: 1,
    fastMs: 3500,
    mode: 'figure',
    concepts: [POZITII],
    generate(rand) {
      for (;;) {
        const animals = shuffle(rand, FARM);
        const at = (r, c) => (r >= 0 && r < 3 && c >= 0 && c < 3 ? animals[r * 3 + c] : null);
        const pos = (a) => [Math.floor(animals.indexOf(a) / 3), animals.indexOf(a) % 3];
        const relation = pickOne(rand, ['stanga', 'dreapta', 'sus', 'jos', 'intre']);
        let prompt;
        let answer;
        let distractors;
        if (relation === 'intre') {
          const across = rand() < 0.5; // pe același rând sau pe aceeași coloană
          const line = int(rand, 0, 2);
          const [a, b] = across ? [at(line, 0), at(line, 2)] : [at(0, line), at(2, line)];
          const [mr, mc] = across ? [line, 1] : [1, line];
          answer = at(mr, mc);
          prompt = `Cine este între ${FARM_NAMES[a]} și ${FARM_NAMES[b]}?`;
          // distractori: unul dintre cei doi, vecinii celui din mijloc pe cealaltă direcție
          distractors = shuffle(rand, [a, b]).slice(0, 1).concat(across ? [at(mr - 1, mc), at(mr + 1, mc)] : [at(mr, mc - 1), at(mr, mc + 1)], [a, b]);
        } else {
          // stânga și dreapta din ochii copilului, ca în desen
          const [dr, dc] = { stanga: [0, -1], dreapta: [0, 1], sus: [-1, 0], jos: [1, 0] }[relation];
          const ref = pickOne(rand, animals.filter((x) => at(pos(x)[0] + dr, pos(x)[1] + dc)));
          const [r, c] = pos(ref);
          answer = at(r + dr, c + dc);
          prompt = `Cine este ${{ stanga: 'în stânga', dreapta: 'în dreapta', sus: 'deasupra', jos: 'dedesubtul' }[relation]} ${FARM_GENITIVE[ref]}?`;
          // distractori: vecinul din partea opusă (stânga ↔ dreapta), vecinii de pe diagonală, vecinii pe cealaltă direcție
          distractors = [at(r - dr, c - dc), at(r + dr + dc, c + dc + dr), at(r + dr - dc, c + dc - dr), at(r + dc, c + dr), at(r - dc, c - dr)];
        }
        const q = figureQuestion('pozitii', rand, {
          prompt,
          figure: { v: 'farm-grid', cells: animals.join(',') },
          key: `${animals.join(',')}|${prompt}`,
          answer: { emoji: answer },
          distractors: distractors.filter(Boolean).map((emoji) => ({ emoji })),
        });
        if (q) return q;
      }
    },
  },
  interior: {
    label: 'Înăuntru sau afară',
    points: 2,
    fastMs: 4500,
    mode: 'figure',
    concepts: [INTERIOR],
    generate(rand) {
      for (;;) {
        const n = 5;
        const region = blob(rand, n, int(rand, 8, 12));
        const inRegion = (r, c) => region.some(([a, b]) => a === r && b === c);
        const outside = [];
        for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (!inRegion(r, c)) outside.push([r, c]);
        if (!openToBorder(n, outside)) continue; // o figură cu goluri s-ar citi greșit
        // semnele din afară: întâi cele din „golfuri” (lângă figură pe cel puțin două laturi), care par înăuntru
        const sides = ([r, c]) => [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dr, dc]) => inRegion(r + dr, c + dc)).length;
        const bays = shuffle(rand, outside.filter((cell) => sides(cell) >= 2));
        const rest = shuffle(rand, outside.filter((cell) => sides(cell) === 1));
        const cells = [pickOne(rand, region), ...bays.slice(0, 2), rest[0] ?? bays[2]];
        if (bays.length < 2 || cells.some((x) => !x)) continue;
        const shapes = shuffle(rand, ['cerc', 'triunghi', 'patrat', 'stea']);
        const colors = paint(rand, 4);
        const marks = cells.map(([r, c], i) => ({ r, c, shape: shapes[i], color: colors[i] }));
        const q = figureQuestion('interior', rand, {
          prompt: 'Care semn este în interiorul figurii?',
          figure: { v: 'robot-grid', n, region: sortCells(region), marks: [...marks].sort((a, b) => a.r - b.r || a.c - b.c) },
          key: `${sortCells(region).map(([r, c]) => `${r}.${c}`).join(' ')}|${cells.map(([r, c]) => `${r}.${c}`).join(' ')}`,
          answer: glyph({ shape: shapes[0], color: colors[0] }),
          distractors: marks.slice(1).map((m) => glyph({ shape: m.shape, color: m.color })),
        });
        if (q) return q;
      }
    },
  },
  'robot-scurt': {
    label: 'Drumul robotului, 2–3 pași',
    points: 2,
    fastMs: 5000,
    mode: 'figure',
    concepts: [TRASEE],
    generate: (rand) => robotQuestion('robot-scurt', rand, 4, 2, 3),
  },
  coordonate: {
    label: 'Căsuțe cu litere și cifre',
    points: 2,
    fastMs: 5000,
    mode: 'figure',
    concepts: [COORDONATE],
    generate(rand) {
      for (;;) {
        const n = 4;
        const [r, c] = [int(rand, 0, n - 1), int(rand, 0, n - 1)];
        const code = ([a, b]) => `${'ABCD'[b]}${a + 1}`;
        // capcanele: litera și cifra citite invers, apoi căsuțele vecine
        const around = shuffle(rand, [[r, c - 1], [r, c + 1], [r - 1, c], [r + 1, c]]);
        const others = [[c, r], ...around].filter(([a, b], i, all) => a >= 0 && a < n && b >= 0 && b < n && (a !== r || b !== c) && all.findIndex(([x, y]) => x === a && y === b) === i).slice(0, 3);
        if (others.length < 3) continue;
        const objects = shuffle(rand, FRUITS).slice(0, 4);
        const items = [[r, c], ...others].map(([a, b], i) => ({ r: a, c: b, emoji: objects[i] })).sort((x, y) => x.r - y.r || x.c - y.c);
        const layout = items.map((it) => `${code([it.r, it.c])}`).join(' ');
        const q =
          rand() < 0.5
            ? figureQuestion('coordonate', rand, { prompt: `Ce este în ${code([r, c])}?`, figure: { v: 'robot-grid', n, labels: true, items }, key: `ce:${code([r, c])}|${layout}`, answer: { emoji: objects[0] }, distractors: objects.slice(1).map((emoji) => ({ emoji })) })
            : figureQuestion('coordonate', rand, {
                prompt: 'Unde este obiectul încercuit?',
                figure: { v: 'robot-grid', n, labels: true, items, mark: { r, c } },
                key: `unde:${code([r, c])}|${layout}`,
                answer: { text: code([r, c]) },
                distractors: others.map((cell) => ({ text: code(cell) })),
              });
        if (q) return q;
      }
    },
  },
  'robot-lung': {
    label: 'Drumul robotului, 4–6 pași',
    points: 4,
    fastMs: 8000,
    mode: 'figure',
    concepts: [TRASEE],
    generate: (rand) => robotQuestion('robot-lung', rand, 5, 4, 6),
  },
};

// ——— poziții și trasee (folosite doar în generatoare, deci pot sta după tipuri) ———

const FARM = ['gaina', 'pisica', 'rata', 'caine', 'cal', 'oaie', 'porc', 'vaca', 'iepure'];
const FARM_NAMES = { gaina: 'găină', pisica: 'pisică', rata: 'rață', caine: 'câine', cal: 'cal', oaie: 'oaie', porc: 'porc', vaca: 'vacă', iepure: 'iepure' };
const FARM_GENITIVE = { gaina: 'găinii', pisica: 'pisicii', rata: 'raței', caine: 'câinelui', cal: 'calului', oaie: 'oii', porc: 'porcului', vaca: 'vacii', iepure: 'iepurelui' };
const FRUITS = ['mar', 'para', 'cirese', 'pepene', 'banana', 'strugure', 'portocala'];
const STEP = { d: [0, 1], s: [0, -1], j: [1, 0], u: [-1, 0] };
const BACK = { d: 's', s: 'd', j: 'u', u: 'j' };

/** O figură legată din k căsuțe, crescută la întâmplare din mijlocul rețelei. */
function blob(rand, n, k) {
  const mid = Math.floor(n / 2);
  const cells = [[mid, mid]];
  while (cells.length < k) {
    const [r, c] = pickOne(rand, cells);
    const [dr, dc] = pickOne(rand, [[1, 0], [-1, 0], [0, 1], [0, -1]]);
    if (r + dr >= 0 && r + dr < n && c + dc >= 0 && c + dc < n && !cells.some(([a, b]) => a === r + dr && b === c + dc)) cells.push([r + dr, c + dc]);
  }
  return cells;
}

/** Toate căsuțele din afară ajung la marginea rețelei prin căsuțe din afară (figura nu are goluri). */
function openToBorder(n, outside) {
  const has = (r, c) => outside.some(([a, b]) => a === r && b === c);
  const seen = new Set(outside.filter(([r, c]) => r === 0 || c === 0 || r === n - 1 || c === n - 1).map(([r, c]) => `${r}.${c}`));
  const queue = outside.filter(([r, c]) => seen.has(`${r}.${c}`));
  while (queue.length) {
    const [r, c] = queue.pop();
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      if (has(r + dr, c + dc) && !seen.has(`${r + dr}.${c + dc}`)) {
        seen.add(`${r + dr}.${c + dc}`);
        queue.push([r + dr, c + dc]);
      }
    }
  }
  return seen.size === outside.length;
}

/**
 * Robotul pleacă dintr-o căsuță și face `min`–`max` pași (fără să se întoarcă imediat și fără să iasă din rețea); fructele stau în căsuța
 * de sosire și în căsuțele greșelilor tipice: fără ultimul pas, stânga ↔ dreapta, sus ↔ jos, un pas în plus, fără ultimii doi pași.
 */
function robotQuestion(kind, rand, n, min, max) {
  for (;;) {
    const start = [int(rand, 0, n - 1), int(rand, 0, n - 1)];
    const program = [];
    let [r, c] = start;
    for (let i = int(rand, min, max); i > 0; i--) {
      const [m, [dr, dc]] = pickOne(rand, Object.entries(STEP).filter(([step, [a, b]]) => r + a >= 0 && r + a < n && c + b >= 0 && c + b < n && step !== BACK[program.at(-1)]));
      program.push(m);
      [r, c] = [r + dr, c + dc];
    }
    const walk = (moves) => moves.reduce(([a, b], m) => [a + STEP[m][0], b + STEP[m][1]], start);
    const swap = (pairs) => program.map((m) => pairs[m] ?? m);
    const key = ([a, b]) => `${a}.${b}`;
    const cells = [];
    for (const cell of [[r, c], walk(program.slice(0, -1)), walk(swap({ d: 's', s: 'd' })), walk(swap({ j: 'u', u: 'j' })), walk([...program, program.at(-1)]), walk(program.slice(0, -2))]) {
      if (cell[0] >= 0 && cell[0] < n && cell[1] >= 0 && cell[1] < n && key(cell) !== key(start) && !cells.some((x) => key(x) === key(cell))) cells.push(cell);
    }
    if (cells.length < 4 || key(cells[0]) !== key([r, c])) continue;
    const fruits = shuffle(rand, FRUITS).slice(0, 4);
    const items = cells.slice(0, 4).map(([a, b], i) => ({ r: a, c: b, emoji: fruits[i] })).sort((x, y) => x.r - y.r || x.c - y.c);
    const figure = { v: 'robot-grid', n, robot: { r: start[0], c: start[1] }, program: program.join(''), items };
    const q = figureQuestion(kind, rand, {
      prompt: 'Câte o căsuță pe săgeată. Unde se oprește?',
      figure,
      // după răspuns: drumul pas cu pas și căsuța de sosire încercuită
      solved: { ...figure, path: program.map((_, i) => walk(program.slice(0, i + 1))), mark: { r, c } },
      key: `${key(start)}|${program.join('')}|${cells.slice(0, 4).map(key).join(' ')}`,
      answer: { emoji: fruits[0] },
      distractors: fruits.slice(1).map((emoji) => ({ emoji })),
    });
    if (q) return q;
  }
}

// ——— figuri și corpuri (folosite doar în generatoare, deci pot sta după tipuri) ———

const PROGRAM = ['patrat', 'dreptunghi', 'triunghi', 'cerc', 'semicerc'];

/** Figura cerută, desenată neobișnuit: rotită, alungită sau mică. */
function unusual(rand, shape) {
  if (shape === 'patrat') return { shape, rot: pickOne(rand, [0, 45, 45]), size: pickOne(rand, SIZES) };
  if (shape === 'dreptunghi') return { shape, variant: rand() < 0.5 ? 'ingust' : null, rot: pickOne(rand, [0, 45, 90, 135]) };
  if (shape === 'triunghi') return { shape, variant: pickOne(rand, [null, 'ascutit', 'dreptunghic']), rot: pickOne(rand, ROTS) };
  if (shape === 'cerc') return { shape, size: pickOne(rand, SIZES) };
  return { shape, rot: pickOne(rand, [0, 90, 180, 270]) };
}

const TRAPS = {
  patrat: [(rand) => ({ shape: 'romb', rot: pickOne(rand, [0, 90]) }), (rand) => ({ shape: 'trapez', rot: pickOne(rand, [0, 180]) }), (rand) => ({ shape: 'dreptunghi', rot: pickOne(rand, [0, 90]) }), (rand) => ({ shape: 'patrat', rot: pickOne(rand, [0, 45]), open: true })],
  dreptunghi: [(rand) => ({ shape: 'paralelogram', rot: pickOne(rand, [0, 90]) }), (rand) => ({ shape: 'trapez', rot: pickOne(rand, [0, 90]) }), () => ({ shape: 'romb', rot: 90 }), (rand) => ({ shape: 'dreptunghi', rot: pickOne(rand, [0, 90]), open: true })],
  triunghi: [(rand) => ({ shape: 'triunghi', rot: pickOne(rand, [0, 90, 180]), open: true }), (rand) => ({ shape: 'casa', rot: pickOne(rand, [0, 180]) }), () => ({ shape: 'trapez' }), (rand) => ({ shape: 'semicerc', rot: pickOne(rand, [0, 180]) })],
  cerc: [(rand) => ({ shape: 'oval', rot: pickOne(rand, [0, 90]) }), (rand) => ({ shape: 'semicerc', rot: pickOne(rand, [0, 90, 180, 270]) }), () => ({ shape: 'inima' })],
  semicerc: [() => ({ shape: 'cerc' }), (rand) => ({ shape: 'oval', rot: pickOne(rand, [0, 90]) }), (rand) => ({ shape: 'triunghi', rot: pickOne(rand, [0, 180]) }), (rand) => ({ shape: 'semicerc', rot: pickOne(rand, [0, 90, 180, 270]), open: true })],
};

// figurile care seamănă cu cele numărate, și cea care se încurcă cel mai des cu ele
const LOOKALIKES = {
  triunghi: [{ shape: 'casa' }, { shape: 'trapez' }, { shape: 'semicerc' }, { shape: 'romb' }],
  patrat: [{ shape: 'romb' }, { shape: 'dreptunghi' }, { shape: 'trapez' }, { shape: 'cerc' }],
  cerc: [{ shape: 'oval' }, { shape: 'semicerc' }, { shape: 'inima' }, { shape: 'patrat' }],
};
const CONFUSED = { triunghi: 'trapez', patrat: 'romb', cerc: 'oval' };

// obiectele au în numele lor doar obiectul, nu corpul (fără „cub de gheață”)
const SOLIDS = ['cub', 'cuboid', 'cilindru', 'sfera', 'con'];
// și doar obiecte cu forma limpede în desen (fără cutie, care arată ca un cub, fără baterie și petardă)
const OBJECTS = { cub: ['zar'], cuboid: ['carte'], cilindru: ['conserva'], sfera: ['minge', 'glob', 'baschet'], con: ['inghetata'] };
const TWIN = { cub: 'cuboid', cuboid: 'cub', cilindru: 'con', con: 'cilindru', sfera: 'cilindru' };
const PLANE_TRAP = { cub: 'patrat', cuboid: 'dreptunghi', cilindru: null, sfera: 'cerc', con: 'triunghi' };
const FOOTPRINTS = { cub: 'patrat', cuboid: 'dreptunghi', cilindru: 'cerc', con: 'cerc' };
const NET_SOLIDS = ['cub', 'cuboid', 'cilindru', 'con'];

/** Piesa are un pătrat de 2 × 2 căsuțe pline (se vede imediat că nu se pliază). */
const hasBlock = (p) => p.some(([r, c]) => [[r, c + 1], [r + 1, c], [r + 1, c + 1]].every(([a, b]) => p.some(([x, y]) => x === a && y === b)));

// ——— simetrii (folosite doar în generatoare, deci pot sta după tipuri) ———

// figuri cu una sau două axe când sunt rotite cu câte un sfert (axele cad pe liniile desenate: mijloacele și diagonalele cutiei)
const AXIS_SHAPES = [
  { shape: 'dreptunghi' },
  { shape: 'dreptunghi', variant: 'ingust' },
  { shape: 'triunghi', variant: 'ascutit' },
  { shape: 'triunghi', variant: 'dreptunghic' },
  { shape: 'trapez' },
  { shape: 'casa' },
  { shape: 'inima' },
  { shape: 'semicerc' },
  { shape: 'sageata' },
  { shape: 'romb' },
  { shape: 'oval' },
];

// figurile după numărul axelor (fără triunghiul echilateral, steaua și cercul, care au 3, 5 sau oricâte axe)
const AXES_BY_COUNT = {
  0: [{ shape: 'paralelogram' }],
  1: [{ shape: 'trapez' }, { shape: 'casa' }, { shape: 'inima' }, { shape: 'semicerc' }, { shape: 'sageata' }, { shape: 'triunghi', variant: 'ascutit' }, { shape: 'triunghi', variant: 'dreptunghic' }],
  2: [{ shape: 'dreptunghi' }, { shape: 'dreptunghi', variant: 'ingust' }, { shape: 'romb' }, { shape: 'oval' }],
  4: [{ shape: 'patrat' }, { shape: 'cruce' }],
};

const sortCells = (cells) => [...cells].sort((a, b) => a[0] - b[0] || a[1] - b[1]);

// ——— piese pe tablă (folosite doar în generatoare, deci pot sta după tipuri) ———

const place = (piece, r0, c0) => piece.map(([r, c]) => [r + r0, c + c0]);

/** Căsuțele vecine piesei, pe laturi, din afara ei. */
function around(piece) {
  const out = new Map();
  for (const [r, c] of piece) {
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      if (!piece.some(([pr, pc]) => pr === r + dr && pc === c + dc)) out.set(`${r + dr}.${c + dc}`, [r + dr, c + dc]);
    }
  }
  return [...out.values()];
}

/** O tablă de 3–5 rânduri și 4–5 coloane, cu golul piesei așezat la întâmplare. */
function board(rand, piece) {
  const [ph, pw] = size(piece);
  const rows = int(rand, Math.max(3, ph), Math.max(4, ph));
  const cols = int(rand, Math.max(4, pw), 5);
  return { rows, cols, hole: place(piece, int(rand, 0, rows - ph), int(rand, 0, cols - pw)) };
}

/** Cutia pătrată comună pieselor dintr-o întrebare. */
const boxFor = (pieces) => Math.max(...pieces.flatMap((p) => size(p)));

const boardArt = (rows, cols, hole, color) => ({
  v: 'cell-grid',
  rows,
  cols,
  grid: true,
  color,
  cells: Array.from({ length: rows * cols }, (_, i) => [Math.floor(i / cols), i % cols]).filter(([r, c]) => !hole.some(([hr, hc]) => hr === r && hc === c)),
  holes: hole,
});

function pieceArt(piece, box, color) {
  const cells = normalize(piece);
  const [rows, cols] = size(cells);
  return { v: 'cell-grid', rows, cols, box, color, cells };
}
