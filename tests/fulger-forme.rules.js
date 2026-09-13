// Regulile tipurilor cu figuri din Jocuri fulger (js/fulger/kinds-forme.js), verificate de tests/fulger.test.js pe întrebările generate.
// Fiecare regulă găsește singură răspunsul, din desen și din variante, fără codul generatoarelor, și cere ca el să fie răspunsul
// întrebării (o singură variantă bună). Numele nu se termină în .test.js: fișierul e importat, nu rulat separat.

import { canonical, glyphKey, measure, normRot, outline } from '../site/js/core/forme.js';

const key = (g) => glyphKey(g);
const cellsOf = (q) => q.figure?.cells ?? [];
const optionList = (q) => q.choices.map((id) => q.options[id]);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** Răspunsul are cheia așteptată, e singura variantă cu ea, iar desenul rezolvat îl pune în locul casetei `slot`. */
function answers(q, expected, slot) {
  if (!expected || optionList(q).filter((o) => key(o) === expected).length !== 1 || key(q.options[q.answer]) !== expected) return false;
  if (slot === undefined) return true;
  const [cells, solved] = [cellsOf(q), q.solved?.cells ?? []];
  return q.solved.mark === slot && solved.length === cells.length && key(solved[slot]) === expected && solved.every((c, i) => i === slot || same(c, cells[i]));
}

/** Cea mai mică perioadă a cheilor, cu cel puțin două repetări întregi (0 dacă nu are). */
function period(keys) {
  for (let p = 1; 2 * p <= keys.length; p++) if (keys.every((k, i) => i < p || k === keys[i - p])) return p;
  return 0;
}

/** „Ce urmează?”: o singură casetă, la sfârșit; figurile arătate au o perioadă de cel puțin 2, iar răspunsul e figura de acum o perioadă. */
function nextInPattern(q) {
  const cells = cellsOf(q);
  const slot = cells.length - 1;
  if (!cells[slot]?.slot || cells.filter((c) => c.slot).length !== 1) return null;
  const shown = cells.slice(0, slot);
  const p = period(shown.map(key));
  return p >= 2 ? { shown, slot, expected: key(shown[shown.length - p]) } : null;
}

/** Poziția singurei valori diferite când celelalte trei sunt la fel, altfel -1. */
function single(values) {
  const counts = values.reduce((m, v) => m.set(v, (m.get(v) ?? 0) + 1), new Map());
  const lone = [...counts].find(([, n]) => n === 1);
  return counts.size === 2 && lone ? values.indexOf(lone[0]) : -1;
}

/** Colțurile unei figuri convexe cu laturi drepte; null la figurile cu curbe sau cu colțuri spre interior (stea, cruce, săgeată). */
function corners(g) {
  if (measure(g).curved) return null;
  const pts = outline(g);
  const turns = pts.map((p, i) => {
    const [a, b] = [pts[(i + pts.length - 1) % pts.length], pts[(i + 1) % pts.length]];
    return Math.sign((p[0] - a[0]) * (b[1] - p[1]) - (p[1] - a[1]) * (b[0] - p[0]));
  });
  return turns.every((t) => t === turns[0]) ? pts.length : null;
}

// însușirile după care un copil caută intrusul
const TRAITS = {
  forma: (g) => g.shape,
  umplere: (g) => g.fill ?? 'plin',
  marime: (g) => g.size ?? 'mare',
  rotire: (g) => canonical(g).rot !== 0 || canonical(g).flip,
  curbe: (g) => measure(g).curved,
  colturi: corners,
};

/** Intrușii: 4 variante fără desen, de aceeași culoare; `pointing` = poziția arătată de fiecare însușire (sau -1). */
function intruders(q) {
  if (q.figure || q.choices.length !== 4) return null;
  const figures = optionList(q);
  if (new Set(figures.map((g) => g.color)).size !== 1) return null;
  return { figures, at: q.choices.indexOf(q.answer), pointing: Object.fromEntries(Object.entries(TRAITS).map(([name, trait]) => [name, single(figures.map(trait))])) };
}

// schimbările căutate la analogii: rotiri, oglindire, umplere, mărime
const CHANGES = [
  ...[90, 180, 270].map((d) => (g) => ({ ...g, rot: normRot((g.rot ?? 0) + d) })),
  (g) => ({ ...g, flip: !g.flip }),
  ...['plin', 'gol', 'dungi'].map((fill) => (g) => ({ ...g, fill })),
  ...['mare', 'mic'].map((size) => (g) => ({ ...g, size })),
];

export const SHAPE_RULES = {
  'sir-simplu': (q) => {
    const s = nextInPattern(q);
    return Boolean(s) && s.shown.length >= 5 && s.shown.every((c) => (c.fill ?? 'plin') === 'plin' && (c.size ?? 'mare') === 'mare' && canonical(c).rot === 0) && answers(q, s.expected, s.slot);
  },
  'sir-doua': (q) => {
    const s = nextInPattern(q);
    const varies = (f) => new Set(s.shown.map(f)).size > 1;
    return Boolean(s) && varies((c) => c.shape) && [(c) => c.fill ?? 'plin', (c) => c.size ?? 'mare', (c) => canonical(c).rot].some(varies) && answers(q, s.expected, s.slot);
  },
  'sir-lipsa': (q) => {
    const cells = cellsOf(q);
    const slot = cells.findIndex((c) => c.slot);
    if (slot < 1 || slot > cells.length - 2 || cells.filter((c) => c.slot).length !== 1) return false;
    const keys = cells.map((c) => (c.slot ? null : key(c)));
    // toate perioadele potrivite cu figurile arătate; fiecare dă o figură pentru casetă, iar toate trebuie să dea aceeași
    const found = new Set();
    let smallest = 0;
    for (let p = 1; 2 * p <= cells.length; p++) {
      if (!keys.every((k, i) => k === null || keys.every((m, j) => m === null || (i - j) % p !== 0 || m === k))) continue;
      smallest ||= p;
      const hit = keys.find((k, j) => k !== null && (j - slot) % p === 0);
      if (hit) found.add(hit);
    }
    return smallest >= 2 && found.size === 1 && answers(q, [...found][0], slot);
  },
  'sir-rotire': (q) => {
    const cells = cellsOf(q);
    const slot = cells.length - 1;
    if (!cells[slot]?.slot || cells.filter((c) => c.slot).length !== 1 || slot < 3) return false;
    const shown = cells.slice(0, slot);
    const last = shown.at(-1);
    let expected;
    if (shown.every((c) => c.count)) {
      // crește sau scade cu câte o figură; formele (cu culorile lor) sunt la fel sau alternează
      const d = shown[1].count - shown[0].count;
      const alt = shown[0].shape !== shown[1].shape;
      const model = (i) => shown[alt ? i % 2 : 0];
      const ok = Math.abs(d) === 1 && shown.every((c, i) => (i === 0 || c.count - shown[i - 1].count === d) && c.shape === model(i).shape && c.color === model(i).color);
      if (!ok || last.count + d < 1) return false;
      expected = key({ ...model(slot), count: last.count + d });
    } else {
      // aceeași figură, rotită cu același pas (un sfert sau o optime), fără o simetrie care să ascundă rotirea
      const d = normRot(shown[1].rot - shown[0].rot);
      const ok = [45, 90, 270, 315].includes(d) && shown.every((c, i) => key({ ...c, rot: 0 }) === key({ ...shown[0], rot: 0 }) && canonical(c).rot === normRot(c.rot) && !canonical(c).flip && (i === 0 || normRot(c.rot - shown[i - 1].rot) === d));
      if (!ok) return false;
      expected = key({ ...last, rot: normRot(last.rot + d) });
    }
    return answers(q, expected, slot);
  },
  'intrus-forma': (q) => {
    const s = intruders(q);
    if (!s) return false;
    const { figures, at, pointing: p } = s;
    const members = figures.filter((_, i) => i !== at);
    // intrusul se vede doar după formă; trei figuri din familie, cel puțin două rotite (nu se poate la cerc); fără pătrat printre dreptunghiuri
    return p.forma === at && [p.umplere, p.marime, p.rotire].every((i) => i < 0) && [p.curbe, p.colturi].every((i) => i < 0 || i === at)
      && (members[0].shape === 'cerc' || members.filter((g) => TRAITS.rotire(g)).length >= 2) && !(members[0].shape === 'dreptunghi' && figures[at].shape === 'patrat');
  },
  'intrus-insusire': (q) => {
    const s = intruders(q);
    if (!s) return false;
    const { at, pointing: p } = s;
    const criteria = [p.umplere, p.marime, p.curbe, p.colturi];
    return p.forma < 0 && p.rotire < 0 && criteria.includes(at) && criteria.every((i) => i < 0 || i === at);
  },
  analogie: (q) => {
    const cells = cellsOf(q);
    if (q.figure?.cols !== 3 || cells.length !== 6 || !cells[1].sep || !cells[4].sep || !cells[5].slot) return false;
    const [A, B, C] = [cells[0], cells[2], cells[3]];
    // toate schimbările care duc A în B trebuie să ducă C în aceeași figură, diferită de C
    const results = new Set(CHANGES.filter((t) => key(t(A)) === key(B)).map((t) => key(t(C))));
    return results.size === 1 && A.shape !== C.shape && !results.has(key(C)) && answers(q, [...results][0], 5);
  },
  matrice: (q) => {
    const cells = cellsOf(q);
    const slot = cells.findIndex((c) => c.slot);
    if (q.figure?.cols !== 3 || cells.length !== 9 || cells.filter((c) => c.slot).length !== 1) return false;
    const known = cells.flatMap((c, i) => (c.slot ? [] : [{ c, row: Math.floor(i / 3), col: i % 3 }]));
    const [sr, sc] = [Math.floor(slot / 3), slot % 3];
    // valoarea unei însușiri în casetă: după rând, după coloană sau ca pătrat latin (fiecare valoare o dată pe rând și pe coloană)
    const infer = (attr) => {
      const values = new Set(known.map(({ c }) => attr(c)));
      const rows = [0, 1, 2].map((i) => known.filter((k) => k.row === i).map(({ c }) => attr(c)));
      const cols = [0, 1, 2].map((i) => known.filter((k) => k.col === i).map(({ c }) => attr(c)));
      const constant = (lines) => lines.every((l) => l.every((v) => v === l[0]));
      const distinct = (lines) => lines.every((l) => new Set(l).size === l.length);
      const guesses = new Set();
      if (constant(rows)) guesses.add(rows[sr][0]);
      if (constant(cols)) guesses.add(cols[sc][0]);
      if (distinct(rows) && distinct(cols)) {
        const missing = [...values].filter((v) => !rows[sr].includes(v) && !cols[sc].includes(v));
        if (missing.length === 1) guesses.add(missing[0]);
      }
      return values.size === 3 && guesses.size === 1 ? [...guesses][0] : undefined;
    };
    const [shape, fill] = [infer((c) => c.shape), infer((c) => c.fill ?? 'plin')];
    const model = known.find(({ c }) => c.shape === shape)?.c;
    // culoarea merge cu forma, deci nu e un indiciu separat
    if (!model || !fill || !known.every(({ c }) => c.shape !== shape || c.color === model.color)) return false;
    return answers(q, key({ ...model, fill }), slot);
  },
};
