// fill — completare de casete în șabloane: [[a]] marchează o casetă.
//
// Layout-uri:
//   inline / steps : rows: ['27 + 42 = [[a]]', { t:'7 zeci [[b]] 70', calc:'70 [[b]] 70', label? }]
//   table          : head: ['', 'Vineri', …], rows: [['Pepeni', '26', '[[a]]'], …], checks?: ['26 + 35 = [[b]]']
//   tree           : trees: [{ top:'47', left:'[[a]]', right:'[[b]]' }]           (verifică: left + right = top)
//   chain          : chains: [{ start:'25', steps:[{ op:'+18', out:'[[a]]' }, …] }] (verifică fiecare pas)
//   column         : rows: ['347 + 285 = [[a]][[b]][[c]]', '3[[g]]7 + [[h]]85 = 632'] — calcul în scris, o casetă pe cifră;
//                    cifrele se calculează (cele ascunse în termeni se caută și trebuie să fie unice); căsuțele „ține minte”
//                    se salvează sub cheile ~<rând>.<loc> și nu se notează
//   pyramid        : pyramids: [{ rows: [['[[c]]'], ['[[a]]', '[[b]]'], ['125', '140', '86']] }] — fiecare cărămidă e suma celor
//                    două de sub ea; valorile se calculează și trebuie să fie unice
//
// Casete (blanks): { a: { kind:'number', answer | expr, search?, feedback? }, b: { kind:'relation' },
//                    c: { kind:'sign', answer:'−' }, d: { kind:'select', options:[…], answer }, e: { kind:'text', answer, accept? } }
// Semnele <, >, = se deduc automat din rând. Rândurile „pure” (doar numere și semne) sunt verificate automat.
// Răspuns: { [blankId]: valoare }

import { calc, hasRelation, holds, isPureMath, relation } from '../../core/expr.js';
import { coloane, LOCURI, searchNumbers } from '../../core/rules.js';
import { plain } from '../../core/markup.js';
import { sameText } from '../../core/ro.js';
import { countAnswered, feedbackFor, isBlank, makeResult } from '../_shared.js';

const BLANK = /\[\[(\w+)\]\]/g;
const KINDS = ['number', 'relation', 'sign', 'select', 'text'];
const LAYOUTS = ['inline', 'steps', 'table', 'tree', 'chain', 'column', 'pyramid'];
const COMPUTED = ['column', 'pyramid']; // valorile casetelor se calculează din șablon

export const kindOf = (blank) => blank?.kind ?? 'number';
export const blanksIn = (tpl) => [...String(tpl ?? '').matchAll(BLANK)].map((m) => m[1]);
const normSign = (s) => String(s ?? '').replace(/[−–]/g, '-').trim();
const rowOf = (r) => (typeof r === 'string' ? { t: r } : r);

// ——— Calculul în scris (layout 'column') ———

const NUM_TOKEN = /^(?:\d|\[\[\w+\]\])+$/;
const MAX_HIDDEN = 6; // cifre ascunse în termenii unui rând: 10^6 încercări cel mult

/** Celulele unui număr din șablon: '3[[g]]7' → [{ d: 3 }, { id: 'g' }, { d: 7 }] */
const cellsOf = (num) => [...num.matchAll(/\d|\[\[(\w+)\]\]/g)].map((m) => (m[1] ? { id: m[1] } : { d: Number(m[0]) }));
const valueOfCells = (cells, vals) => cells.reduce((n, c) => n * 10 + (c.id ? vals[c.id] : c.d), 0);

/** Un rând de calcul în scris: '347 + 285 = [[a]][[b]][[c]]' → { op, terms: [celule…], result: celule } sau null. */
export function parseColumn(tpl) {
  const sides = String(tpl).replace(/[−–]/g, '-').trim().split('=');
  if (sides.length !== 2) return null;
  const left = sides[0].trim().split(/\s+/);
  const right = sides[1].trim();
  if (left.length < 3 || left.length % 2 === 0 || !NUM_TOKEN.test(right)) return null;
  const nums = left.filter((_, i) => i % 2 === 0);
  const ops = left.filter((_, i) => i % 2 === 1);
  if (!nums.every((n) => NUM_TOKEN.test(n)) || !ops.every((o) => o === ops[0] && (o === '+' || o === '-'))) return null;
  return { op: ops[0], terms: nums.map(cellsOf), result: cellsOf(right) };
}

/** Toate completările unui rând (cel mult `limit`): cifrele ascunse din termeni se încearcă toate, rezultatul se calculează. */
function solveColumn(row, limit = 2) {
  const ids = [...new Set(row.terms.flat().filter((c) => c.id).map((c) => c.id))];
  const leading = new Set(row.terms.filter((t) => t.length > 1 && t[0].id).map((t) => t[0].id));
  const solutions = [];
  const vals = {};
  for (let k = 0; k < 10 ** ids.length && solutions.length < limit; k++) {
    let ok = true;
    for (let i = 0, x = k; i < ids.length; i++, x = Math.floor(x / 10)) {
      vals[ids[i]] = x % 10;
      if (vals[ids[i]] === 0 && leading.has(ids[i])) ok = false;
    }
    if (!ok) continue;
    const nums = row.terms.map((t) => valueOfCells(t, vals));
    const result = row.op === '+' ? nums.reduce((s, n) => s + n, 0) : nums[0] - nums[1];
    const digits = String(result);
    if (result < 0 || digits.length !== row.result.length) continue;
    const sol = { ...vals };
    if (row.result.every((c, i) => (c.id ? ((sol[c.id] = Number(digits[i])), true) : c.d === Number(digits[i])))) solutions.push(sol);
  }
  return solutions;
}

const columnCache = new WeakMap();

/** Rândurile unui calcul în scris, cu soluția (când e unică): { index, label, tpl, op, terms, result, solution, solutions }. */
export function columnRows(part) {
  if (columnCache.has(part)) return columnCache.get(part);
  const rows = (part.rows ?? []).map((r, index) => {
    const row = rowOf(r);
    const parsed = parseColumn(row.t);
    if (!parsed) return { index, label: row.label, tpl: String(row.t), invalid: true };
    const hidden = parsed.terms.flat().filter((c) => c.id).length;
    const solutions = hidden <= MAX_HIDDEN ? solveColumn(parsed) : [];
    return { index, label: row.label, tpl: String(row.t), ...parsed, hidden, solutions, solution: solutions.length === 1 ? solutions[0] : null };
  });
  columnCache.set(part, rows);
  return rows;
}

/** Numerele unui rând rezolvat (termenii), pentru coloanele lui. */
export const columnNumbers = (row) => row.terms.map((t) => valueOfCells(t, row.solution ?? {}));

function columnErrors(part) {
  const errors = [];
  const blanks = part.blanks ?? {};
  for (const row of columnRows(part)) {
    const where = `fill: „${row.tpl}”`;
    if (row.invalid) {
      errors.push(`${where} nu e un calcul pe coloane (de forma 347 + 285 = [[a]][[b]][[c]])`);
      continue;
    }
    if (row.op === '-' && row.terms.length !== 2) errors.push(`${where}: la scădere sunt exact doi termeni`);
    if (row.op === '+' && row.terms.length > 3) errors.push(`${where}: la adunare sunt cel mult trei termeni`);
    if (![...row.terms, row.result].flat().some((c) => c.id)) errors.push(`${where}: nicio casetă`);
    if ([...row.terms, row.result].some((t) => t.length > 1 && t[0].d === 0)) errors.push(`${where}: un număr începe cu 0`);
    if (row.hidden > MAX_HIDDEN) errors.push(`${where}: cel mult ${MAX_HIDDEN} cifre ascunse în termeni`);
    else if (row.solutions.length !== 1) {
      errors.push(`${where} are ${row.solutions.length ? 'mai multe completări' : 'nicio completare'} (trebuie exact una)`);
    }
    for (const c of [...row.terms, row.result].flat().filter((x) => x.id)) {
      const b = blanks[c.id];
      if (!b) continue;
      if (kindOf(b) !== 'number' || b.expr !== undefined || b.search) errors.push(`fill.${c.id}: o cifră din calculul pe coloane are doar \`answer\` (opțional)`);
      if (row.solution && b.answer !== undefined && Number(b.answer) !== row.solution[c.id]) {
        errors.push(`fill.${c.id}: cifra calculată este ${row.solution[c.id]}, nu ${b.answer}`);
      }
    }
  }
  return errors;
}

const LOC = {
  u: { pl: 'unități', one: 'o unitate', gen: 'unităților' },
  z: { pl: 'zeci', one: 'o zece', gen: 'zecilor' },
  s: { pl: 'sute', one: 'o sută', gen: 'sutelor' },
  m: { pl: 'mii', one: 'o mie', gen: 'miilor' },
};
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** Mesajul pentru o greșeală tipică la o cifră a rezultatului (transport uitat, cifra mică din cea mare, împrumut). */
function columnHint(part, id, given) {
  if (!/^\s*\d\s*$/.test(String(given ?? ''))) return null;
  const g = Number(given);
  for (const row of columnRows(part)) {
    if (row.invalid || !row.solution) continue;
    const idx = row.result.findIndex((c) => c.id === id);
    if (idx < 0) continue;
    const cols = coloane(row.op, columnNumbers(row));
    const p = row.result.length - 1 - idx;
    const col = cols[p];
    if (!col || g === col.digit) return null;
    const here = LOC[LOCURI[p]];
    const prev = LOC[LOCURI[p - 1]];
    const next = LOC[LOCURI[p + 1]];
    if (row.op === '+') {
      if (!col.in || (g + col.in) % 10 !== col.digit) return null;
      const before = cols[p - 1];
      const made = col.in === 1 ? `${here.one} nouă` : `${col.in} ${here.pl} noi`;
      const sumBefore = before.digits.reduce((s, d) => s + d, 0) + before.in;
      const lead = `${[...before.digits, ...(before.in ? [before.in] : [])].join(' + ')} = ${sumBefore}: s-a format ${made}.`;
      if (LOCURI[p] === 'm') return `${lead} La mii scrii ${col.digit}.`;
      const sum = col.digits.reduce((s, d) => s + d, 0) + col.in;
      return `${lead} ${col.in === 1 ? 'Adaug-o' : 'Adaugă-le'} la ${here.pl}: ${[...col.digits, col.in].join(' + ')} = ${sum}.`;
    }
    const [top, bottom] = col.digits;
    if (col.in && top === 0 && next) {
      return `La ${here.pl} avem 0: desfacem ${next.one} în 10 ${here.pl}. ${cap(here.one)} a plecat la ${prev.pl}, deci rămân 9: 9 − ${bottom} = ${col.digit}.`;
    }
    const avail = top - col.in;
    if (col.out && next && (g === Math.abs(avail - bottom) || g === Math.abs(top - bottom))) {
      const gave = col.in ? `${cap(here.one)} a plecat la ${prev.pl}, deci rămân ${avail}. ` : '';
      return `${gave}La ${here.pl}, din ${avail} nu putem lua ${bottom}: desfacem ${next.one}. ${avail + 10} − ${bottom} = ${col.digit}.`;
    }
    if (col.in && !col.out && g === (col.digit + 1) % 10) {
      return `La ${here.pl}, ${here.one} a plecat la ${prev.pl}: rămân ${avail}, deci ${avail} − ${bottom} = ${col.digit}.`;
    }
    return null;
  }
  return null;
}

// ——— Piramida numerelor (layout 'pyramid') ———

const PYRAMID_RANGE = 1000;
const blankCell = (s) => /^\s*\[\[(\w+)\]\]\s*$/.exec(String(s))?.[1] ?? null;
const pyramidsOf = (part) => (part.pyramids ?? []).map((p) => p?.rows ?? []);

/** Relațiile unei piramide: [stânga, dreapta, deasupra] ca poziții „rând.loc” (rândul 0 e vârful). */
function pyramidRelations(rows) {
  const rel = [];
  for (let r = 0; r + 1 < rows.length; r++) for (let i = 0; i < rows[r].length; i++) rel.push([`${r + 1}.${i}`, `${r + 1}.${i + 1}`, `${r}.${i}`]);
  return rel;
}

/** Completările unei piramide: propagare, apoi încercarea necunoscutei rămase la bază (cel mult una: 0–1000). */
function solvePyramid(rows, limit = 2) {
  const rels = pyramidRelations(rows);
  const start = new Map();
  rows.forEach((row, r) => row.forEach((c, i) => {
    if (!blankCell(c)) start.set(`${r}.${i}`, Number(c));
  }));
  const cells = rows.flatMap((row, r) => row.map((_, i) => `${r}.${i}`));
  const settle = (v) => {
    for (let changed = true; changed;) {
      changed = false;
      for (const [L, R, T] of rels) {
        const [l, r, t] = [v.get(L), v.get(R), v.get(T)];
        const known = [l, r, t].filter((x) => x !== undefined).length;
        if (known === 3 && l + r !== t) return false;
        if (known !== 2) continue;
        if (t === undefined) v.set(T, l + r);
        else if (l === undefined) v.set(L, t - r);
        else v.set(R, t - l);
        changed = true;
      }
    }
    return cells.every((k) => !v.has(k) || (Number.isInteger(v.get(k)) && v.get(k) >= 0 && v.get(k) <= PYRAMID_RANGE));
  };
  const base = rows.length - 1;
  const first = new Map(start);
  if (!settle(first)) return [];
  const open = (rows[base] ?? []).map((_, i) => `${base}.${i}`).filter((k) => !first.has(k));
  if (open.length > 1) return null; // prea multe necunoscute
  const solutions = [];
  const tryAll = (i, v) => {
    if (solutions.length >= limit) return;
    if (i === open.length) {
      const w = new Map(v);
      if (settle(w) && cells.every((k) => w.has(k))) solutions.push(w);
      return;
    }
    for (let x = 0; x <= PYRAMID_RANGE; x++) tryAll(i + 1, new Map(v).set(open[i], x));
  };
  if (open.length) tryAll(0, first);
  else if (cells.every((k) => first.has(k))) solutions.push(first);
  return solutions;
}

const pyramidCache = new WeakMap();

/** Piramidele unei părți, cu valorile fiecărei casete (când soluția e unică). */
export function pyramidInfo(part) {
  if (pyramidCache.has(part)) return pyramidCache.get(part);
  const info = pyramidsOf(part).map((rows) => {
    const shapeOk = rows.length >= 2 && rows.length <= 4 && rows.every((row, r) => Array.isArray(row) && row.length === r + 1);
    const solutions = shapeOk ? solvePyramid(rows) : [];
    const values = {};
    if (solutions?.length === 1) rows.forEach((row, r) => row.forEach((c, i) => {
      const id = blankCell(c);
      if (id) values[id] = solutions[0].get(`${r}.${i}`);
    }));
    return { rows, shapeOk, solutions, values };
  });
  pyramidCache.set(part, info);
  return info;
}

function pyramidErrors(part) {
  const errors = [];
  const info = pyramidInfo(part);
  if (!info.length) return ['fill: lipsește lista „pyramids”'];
  for (const [n, p] of info.entries()) {
    const where = `fill: piramida ${n + 1}`;
    if (!p.shapeOk) {
      errors.push(`${where}: 2–4 rânduri, de sus în jos, cu 1, 2, 3… cărămizi`);
      continue;
    }
    for (const c of p.rows.flat()) if (!blankCell(c) && !/^\s*\d+\s*$/.test(String(c))) errors.push(`${where}: „${c}” nu e număr sau casetă`);
    if (p.solutions === null) errors.push(`${where}: prea multe necunoscute la bază (cel mult una care nu se poate afla din celelalte)`);
    else if (p.solutions.length !== 1) errors.push(`${where} are ${p.solutions.length ? 'mai multe completări' : 'nicio completare'} (trebuie exact una, cu numere 0–1000)`);
    for (const [id, v] of Object.entries(p.values)) {
      const b = part.blanks?.[id];
      if (b && (kindOf(b) !== 'number' || b.expr !== undefined || b.search)) errors.push(`fill.${id}: o cărămidă are doar \`answer\` (opțional)`);
      if (b?.answer !== undefined && Number(b.answer) !== v) errors.push(`fill.${id}: valoarea calculată este ${v}, nu ${b.answer}`);
    }
  }
  return errors;
}

/** Toate șabloanele afișate, în ordinea din layout. */
export function templatesOf(part) {
  switch (part.layout ?? 'inline') {
    case 'inline':
    case 'steps':
      return (part.rows ?? []).map((r) => String(rowOf(r).t ?? ''));
    case 'table':
      return (part.rows ?? []).flat().map(String);
    case 'tree':
      return (part.trees ?? []).flatMap((t) => [t.top, t.left, t.right].map(String));
    case 'chain':
      return (part.chains ?? []).flatMap((c) => [String(c.start), ...c.steps.map((s) => String(s.out))]);
    case 'column':
      return (part.rows ?? []).map((r) => String(rowOf(r).t ?? ''));
    case 'pyramid':
      return pyramidsOf(part).flat(2).map(String);
    default:
      return [];
  }
}

const dots = (tpl) => plain(String(tpl).replace(BLANK, '…')).replace(/…+/g, '…').replace(/\s+/g, ' ').trim();
const TERM_ROLE = { '+': ['primului termen', 'celui de-al doilea termen', 'celui de-al treilea termen'], '-': ['descăzutului', 'scăzătorului'] };

/**
 * Eticheta unei casete pentru cititorul de ecran (blank.label are prioritate): șablonul ei, cu casetele
 * înlocuite prin „…” — „40 + 8 = …”; în tabel, capul rândului și al coloanei; în arbore, „zeci din 47”.
 */
export function blankLabel(part, id) {
  const blank = part.blanks?.[id];
  if (blank?.label) return blank.label;
  const has = (tpl) => blanksIn(tpl).includes(id);
  switch (part.layout ?? 'inline') {
    case 'inline':
    case 'steps':
      for (const r of part.rows ?? []) {
        const row = rowOf(r);
        if (has(row.t)) return `${row.label ? `${plain(row.label)}: ` : ''}${dots(row.t)}`;
      }
      break;
    case 'table':
      for (const row of part.rows ?? []) {
        const ci = row.findIndex(has);
        if (ci < 0) continue;
        const heads = [ci > 0 ? row[0] : '', part.head?.[ci] ?? ''].map((t) => plain(String(t)).trim()).filter(Boolean);
        return heads.join(', ') || dots(row[ci]);
      }
      break;
    case 'tree': {
      const [left, right] = part.labels ?? ['partea stângă', 'partea dreaptă'];
      for (const t of part.trees ?? []) {
        if (has(t.top)) return `întregul din ${dots(t.left)} și ${dots(t.right)}`;
        if (has(t.left)) return `${plain(left)} din ${dots(t.top)}`;
        if (has(t.right)) return `${plain(right)} din ${dots(t.top)}`;
      }
      break;
    }
    case 'chain':
      for (const c of part.chains ?? []) {
        if (has(c.start)) return 'începutul lanțului';
        let prev = String(c.start);
        for (const st of c.steps) {
          if (has(st.out)) return `${dots(prev)} ${plain(st.op)} = …`;
          prev = String(st.out);
        }
      }
      break;
    case 'column':
      for (const row of columnRows(part)) {
        if (row.invalid) continue;
        const where = (cells, role) => {
          const i = cells.findIndex((c) => c.id === id);
          return i < 0 ? null : `cifra ${LOC[LOCURI[cells.length - 1 - i]].gen} ${role}`;
        };
        const found = where(row.result, 'rezultatului') ?? row.terms.map((t, k) => where(t, TERM_ROLE[row.op][k])).find(Boolean);
        if (found) return `${row.label ? `${plain(row.label)}, ` : ''}${found}: ${dots(row.tpl)}`;
      }
      break;
    case 'pyramid':
      for (const rows of pyramidsOf(part)) {
        for (const [r, row] of rows.entries()) {
          const i = row.findIndex((c) => blankCell(c) === id);
          if (i < 0) continue;
          if (r + 1 < rows.length) return `cărămida de deasupra lui ${dots(rows[r + 1][i])} și ${dots(rows[r + 1][i + 1])}`;
          return `cărămida ${i + 1} din rândul de jos`;
        }
      }
      break;
    default:
      break;
  }
  return '';
}

const PLACEHOLDER = { number: '1', relation: '=', sign: '+' };

function isCheckable(tpl, blanks) {
  const ids = blanksIn(tpl);
  if (ids.some((id) => !PLACEHOLDER[kindOf(blanks[id])])) return false;
  const probe = String(tpl).replace(BLANK, (m, id) => PLACEHOLDER[kindOf(blanks[id])]);
  try {
    return isPureMath(probe) && hasRelation(probe);
  } catch {
    return false;
  }
}

/** Relațiile care trebuie să fie adevărate cu răspunsurile corecte. */
export function checksOf(part) {
  const blanks = part.blanks ?? {};
  const out = [];
  const layout = part.layout ?? 'inline';
  if (layout === 'inline' || layout === 'steps') {
    for (const r of part.rows ?? []) {
      const row = rowOf(r);
      if (row.calc === false) continue;
      if (row.calc) out.push(row.calc);
      else if (isCheckable(row.t, blanks)) out.push(row.t);
    }
  }
  if (layout === 'column') for (const row of columnRows(part)) if (!row.invalid) out.push(row.tpl);
  if (layout === 'pyramid') {
    for (const rows of pyramidsOf(part)) {
      for (let r = 0; r + 1 < rows.length; r++) {
        for (let i = 0; i < rows[r].length; i++) out.push(`${rows[r + 1][i]} + ${rows[r + 1][i + 1]} = ${rows[r][i]}`);
      }
    }
  }
  if (layout === 'tree') for (const t of part.trees ?? []) out.push(`${t.left} + ${t.right} = ${t.top}`);
  if (layout === 'chain') {
    for (const c of part.chains ?? []) {
      let prev = String(c.start);
      for (const s of c.steps) {
        out.push(`${prev} ${s.op} = ${s.out}`);
        prev = String(s.out);
      }
    }
  }
  for (const extra of part.checks ?? []) out.push(extra);
  return out;
}

function substitute(tpl, values, blanks) {
  return String(tpl).replace(BLANK, (m, id) => {
    const v = values[id];
    if (v === undefined || v === null) throw new Error(`caseta [[${id}]] nu are valoare`);
    return kindOf(blanks[id]) === 'sign' ? normSign(v) : String(v);
  });
}

/** Răspunsurile corecte pentru fiecare casetă (cu semnele <, >, = deduse). */
export function keyOf(part) {
  const blanks = part.blanks ?? {};
  const key = {};
  for (const [id, b] of Object.entries(blanks)) {
    const kind = kindOf(b);
    if (kind === 'number') key[id] = b.answer ?? (b.expr !== undefined ? calc(b.expr) : undefined);
    else if (b.answer !== undefined) key[id] = b.answer;
  }
  // la calculul în scris și la piramidă, valorile se calculează din șablon (au prioritate față de un `answer` greșit)
  if (part.layout === 'column') for (const row of columnRows(part)) Object.assign(key, row.solution ?? {});
  if (part.layout === 'pyramid') for (const p of pyramidInfo(part)) Object.assign(key, p.values);
  const checks = checksOf(part);
  for (const [id, b] of Object.entries(blanks)) {
    if (kindOf(b) !== 'relation' || key[id] !== undefined) continue;
    const src = checks.find((s) => blanksIn(s).includes(id));
    if (!src) continue;
    const [left, right] = src.split(`[[${id}]]`);
    try {
      key[id] = relation(calc(substitute(left, key, blanks)), calc(substitute(right, key, blanks)));
    } catch {
      /* raportat de validate */
    }
  }
  return key;
}

function matches(blank, given, expected) {
  if (isBlank(given) || expected === undefined) return false;
  if (typeof given !== 'string' && typeof given !== 'number') return false; // o casetă are un singur răspuns
  switch (kindOf(blank)) {
    case 'number':
      return /^\s*\d+\s*$/.test(String(given)) && Number(given) === Number(expected);
    case 'sign':
      return normSign(given) === normSign(expected);
    case 'text':
      return [expected, ...(blank.accept ?? [])].some((t) => sameText(given, t, { ignoreDiacritics: blank.ignoreDiacritics }));
    default:
      return String(given) === String(expected);
  }
}

const ADDITION = /^\s*\[\[(\w+)\]\]\s*\+\s*\[\[(\w+)\]\]\s*=/;

export default {
  type: 'fill',

  validate(part) {
    const errors = [];
    const blanks = part.blanks ?? {};
    const layout = part.layout ?? 'inline';
    if (!LAYOUTS.includes(layout)) return [`fill: layout necunoscut „${layout}”`];
    const all = templatesOf(part).flatMap(blanksIn);
    const used = new Set(all);
    for (const id of used) {
      const times = all.filter((x) => x === id).length;
      if (times > 1) errors.push(`fill: caseta [[${id}]] apare de ${times} ori; fiecare casetă apare o singură dată (relațiile se scriu în checks)`);
    }
    if (!used.size) errors.push('fill: nicio casetă [[x]] în șabloane');
    for (const id of used) if (!blanks[id]) errors.push(`fill: caseta [[${id}]] nu este definită în „blanks”`);
    if (layout === 'column') errors.push(...columnErrors(part));
    if (layout === 'pyramid') errors.push(...pyramidErrors(part));
    const computed = COMPUTED.includes(layout);
    for (const [id, b] of Object.entries(blanks)) {
      const kind = kindOf(b);
      if (!used.has(id)) errors.push(`fill: caseta „${id}” nu apare în șabloane`);
      if (!KINDS.includes(kind)) errors.push(`fill.${id}: tip de casetă necunoscut „${kind}”`);
      if (kind === 'number' && !computed && b.answer === undefined && b.expr === undefined) errors.push(`fill.${id}: lipsește answer sau expr`);
      if (kind === 'sign' && !['+', '-', '−'].includes(b.answer)) errors.push(`fill.${id}: semnul trebuie să fie + sau −`);
      if (kind === 'select' && !(b.options ?? []).map(String).includes(String(b.answer))) errors.push(`fill.${id}: răspunsul nu e printre opțiuni`);
      if (kind === 'text' && !b.answer) errors.push(`fill.${id}: lipsește answer`);
    }
    if (errors.length) return errors;

    let key;
    try {
      key = keyOf(part);
    } catch (e) {
      return [`fill: nu pot calcula răspunsurile (${e.message})`];
    }
    for (const [id, b] of Object.entries(blanks)) {
      if (key[id] === undefined) errors.push(`fill.${id}: nu pot deduce răspunsul`);
      // mesajele se arată doar la răspunsuri greșite: unul legat de răspunsul corect nu apare niciodată
      for (const fb of b.feedback ?? []) if (String(fb.if).replace(/−/g, '-') === String(key[id]).replace(/−/g, '-')) errors.push(`fill.${id}: mesajul pentru „${fb.if}” e legat chiar de răspunsul corect`);
      if (kindOf(b) === 'number' && b.answer !== undefined && b.expr !== undefined && calc(b.expr) !== b.answer) {
        errors.push(`fill.${id}: ${b.expr} = ${calc(b.expr)}, nu ${b.answer}`);
      }
      if (b.search) {
        const found = searchNumbers(b.search);
        const pick = b.search.pick ?? 'unique';
        const want = pick === 'max' ? Math.max(...found) : pick === 'min' ? Math.min(...found) : found.length === 1 ? found[0] : NaN;
        if (want !== key[id]) errors.push(`fill.${id}: căutarea dă [${found.join(', ')}] (${pick}), nu ${key[id]}`);
      }
    }
    for (const src of checksOf(part)) {
      try {
        if (!holds(substitute(src, key, blanks))) errors.push(`fill: relația „${substitute(src, key, blanks)}” este falsă`);
      } catch (e) {
        errors.push(`fill: nu pot verifica „${src}” (${e.message})`);
        continue;
      }
      const signs = blanksIn(src).filter((id) => kindOf(blanks[id]) === 'sign');
      if (signs.length) {
        let solutions = 0;
        for (let mask = 0; mask < 2 ** signs.length; mask++) {
          const trial = { ...key };
          signs.forEach((id, i) => { trial[id] = mask & (1 << i) ? '-' : '+'; });
          if (holds(substitute(src, trial, blanks))) solutions++;
        }
        if (solutions !== 1) errors.push(`fill: „${src}” are ${solutions} variante corecte de semne (trebuie una)`);
      }
    }
    return errors;
  },

  /** Calculele exercițiului, cu răspunsurile corecte în casete (pentru verificarea „cu/fără trecere”). */
  expressions(part) {
    const blanks = part.blanks ?? {};
    const key = keyOf(part);
    const out = checksOf(part).map((src) => substitute(src, key, blanks));
    for (const b of Object.values(blanks)) if (b.expr !== undefined) out.push(String(b.expr));
    return out;
  },

  count: (part) => Object.keys(part.blanks ?? {}).length,
  answered: (part, ans) => countAnswered(Object.keys(part.blanks ?? {}), ans),
  empty: () => ({}),
  solution: (part) => keyOf(part),

  evaluate(part, ans) {
    const blanks = part.blanks ?? {};
    const key = keyOf(part);
    const given = ans ?? {};
    const ok = {};
    const column = part.layout === 'column';
    for (const [id, b] of Object.entries(blanks)) ok[id] = matches(b, given[id], key[id]) && (!column || /^\s*\d\s*$/.test(String(given[id])));
    // la adunare, termenii pot fi scriși în orice ordine: [[a]] + [[b]] = … (nu și la cifrele unui calcul pe coloane)
    for (const tpl of COMPUTED.includes(part.layout) ? [] : templatesOf(part)) {
      const m = ADDITION.exec(tpl);
      if (!m) continue;
      const [, a, b] = m;
      if (ok[a] && ok[b]) continue;
      if (matches(blanks[a], given[a], key[b]) && matches(blanks[b], given[b], key[a])) ok[a] = ok[b] = true;
    }
    return makeResult(
      Object.keys(blanks).map((id) => ({
        id,
        ok: ok[id],
        expected: key[id],
        given: given[id] ?? null,
        feedback: ok[id] ? null : (feedbackFor(blanks[id].feedback, given[id]) ?? (column ? columnHint(part, id, given[id]) : null)),
      })),
    );
  },
};
