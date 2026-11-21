// Învață: logica lecțiilor (pură; o importă și testele din Node). O provocare se verifică din mărimile widgetului (`derive`), iar
// căutarea în lățime prin acțiunile lui (aceleași ca în interfață) arată că fiecare provocare se poate rezolva atingând ecranul.

import { WIDGETS } from './registry.js';
import { fractionWords } from '../core/ro.js';
import { compareFractions, equalParts, parseFraction } from './fractions.js';

export const widgetOf = (lesson) => WIDGETS[lesson?.widget?.w] ?? null;

/** Parametrii widgetului unei lecții (fără numele lui). */
export function paramsOf(lesson) {
  const { w, ...params } = lesson.widget;
  return params;
}

/** O provocare e îndeplinită când fiecare mărime cerută are valoarea cerută. */
export const matches = (want, derived) => Object.entries(want).every(([k, v]) => derived[k] === v);

/** Cheia unei stări (ordinea câmpurilor și a listelor nu contează). */
const keyOf = (state) => JSON.stringify(Object.keys(state).sort().map((k) => [k, Array.isArray(state[k]) ? [...state[k]].sort() : state[k]]));

/** Stările la care se ajunge din `from`, în ordinea căutării în lățime (cele mai apropiate întâi). */
function* walk(W, params, from, limit) {
  const seen = new Set([keyOf(from)]);
  const queue = [from];
  for (let i = 0; i < queue.length; i++) {
    yield queue[i];
    for (const action of W.actions(params, queue[i])) {
      const next = W.apply(params, queue[i], action);
      const key = keyOf(next);
      if (seen.has(key)) continue;
      if (seen.size >= limit) throw new Error(`peste ${limit} de stări`);
      seen.add(key);
      queue.push(next);
    }
  }
}

/** Cea mai apropiată stare din `from` pentru care `ok(derive(stare))` e adevărat, sau null. */
export function search(W, params, from, ok, { limit = 20000 } = {}) {
  for (const state of walk(W, params, from, limit)) if (ok(W.derive(params, state))) return state;
  return null;
}

/** Toate stările la care se ajunge din `from`. */
export const reachable = (W, params, from = W.initial(params), { limit = 20000 } = {}) => [...walk(W, params, from, limit)];

/** Identitatea unei soluții `collect` (de exemplu „3,8”: 3 rânduri cu câte 8 e alt dreptunghi decât 8 cu câte 3). */
export const solutionKey = (task, derived) => task.by.map((k) => derived[k]).join(',');

/** Soluțiile distincte ale unei provocări `collect`, printre stările date. */
export function collectKeys(W, params, task, states) {
  const keys = new Set();
  for (const s of states) {
    const d = W.derive(params, s);
    if (matches(task.collect, d)) keys.add(solutionKey(task, d));
  }
  return keys;
}

/** Regulile alegerilor: răspunsul se calculează din datele provocării, nu se scrie de mână. */
export const PICK_RULES = {
  /** „Cât face 7 × 8?”: varianta egală cu produsul factorilor din `of`. */
  produs: (task, option) => option === task.of[0] * task.of[1],
  /** „Care desen arată două jumătăți?”: desenul tăiat în 2 părți egale. */
  jumatati: (task, option) => option?.v === 'fraction' && equalParts(option) && Number(option.parts) === 2,
  /** „Care desen arată sferturi?”: desenul tăiat în 4 părți egale. */
  sferturi: (task, option) => option?.v === 'fraction' && equalParts(option) && Number(option.parts) === 4,
  /** „Care e mai mare?”: fracția mai mare decât toate celelalte. */
  'mai-mare': (task, option) => {
    const f = parseFraction(option);
    return Boolean(f) && task.pick.every((other) => other === option || (parseFraction(other) && compareFractions(f, parseFraction(other)) > 0));
  },
  /** „Ce fracție e colorată?”: exact fracția din `of` (3/5, nu și 6/10). */
  valoare: (task, option) => option === `${task.of[0]}/${task.of[1]}`,
};

/** Locurile variantelor corecte ale unei alegeri. */
export const pickCorrect = (task) => task.pick.flatMap((option, i) => (PICK_RULES[task.rule]?.(task, option) ? [i] : []));

/** Ce s-a răspuns, pentru „Bravo!” (mini-markup): „7 × 8 = 56”, „1/3 e mai mare decât 1/5”. */
export function pickAnswer(task) {
  const option = task.pick[pickCorrect(task)[0]];
  if (task.rule === 'produs') return `${task.of[0]} × ${task.of[1]} = ${option}`;
  if (task.rule === 'mai-mare') return `{{f:${option}}} e mai mare decât ${task.pick.filter((o) => o !== option).map((o) => `{{f:${o}}}`).join(' și ')}.`;
  if (task.rule === 'valoare') return `{{f:${option}}}: ${fractionWords(...parseFraction(option))}.`;
  if (task.rule === 'jumatati') return 'Două bucăți la fel de mari: două jumătăți.';
  if (task.rule === 'sferturi') return 'Patru bucăți la fel de mari: patru sferturi.';
  return '';
}

/** Ce poate ascunde o provocare din widgetul ei (doar unde toate desenele și textele chiar ascund mărimea). */
export const hideable = (W, params) => W.hideable?.(params) ?? [];

export const taskKind = (t) => (t.want ? 'want' : t.collect ? 'collect' : t.pick ? 'pick' : null);

const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Greșelile unei lecții (testele cer o listă goală):
 * - widgetul există și parametrii lui sunt buni;
 * - provocările au id-uri unice și folosesc doar mărimi ale widgetului;
 * - fiecare `want` se poate atinge din interfață, iar starea lăsată de provocarea dinainte nu o rezolvă deja;
 * - fiecare `collect` are cel puțin `need` soluții;
 * - fiecare `pick` are o regulă cunoscută și exact o variantă corectă.
 */
export function lessonErrors(lesson) {
  const W = widgetOf(lesson);
  if (!W) return [`widget necunoscut „${lesson?.widget?.w}”`];
  const params = paramsOf(lesson);
  const bad = W.check(params);
  if (bad.length) return bad.map((e) => `widget: ${e}`);
  const errors = [];
  const all = reachable(W, params);
  let state = W.initial(params);
  const ids = new Set();
  (lesson.tasks ?? []).forEach((t, i) => {
    const at = `provocarea ${t.id ?? i + 1}`;
    if (!ID.test(t.id ?? '') || ids.has(t.id)) errors.push(`${at}: id lipsă, greșit sau repetat`);
    ids.add(t.id);
    const kind = taskKind(t);
    if (!kind) return errors.push(`${at}: îi lipsește want, collect sau pick`);
    for (const k of [...Object.keys(t.want ?? {}), ...Object.keys(t.collect ?? {}), ...(t.by ?? [])]) {
      if (!W.QUANTITIES.includes(k)) errors.push(`${at}: „${k}” nu e o mărime a widgetului`);
    }
    for (const k of t.hide ?? []) if (!hideable(W, params).includes(k)) errors.push(`${at}: „${k}” nu se poate ascunde aici`);
    if (kind === 'want') {
      if (matches(t.want, W.derive(params, state))) errors.push(`${at}: e deja rezolvată de starea de dinainte`);
      const found = search(W, params, state, (d) => matches(t.want, d));
      if (found) state = found;
      else errors.push(`${at}: nu se poate rezolva din interfață`);
    } else if (kind === 'collect') {
      const keys = collectKeys(W, params, t, all);
      if (!Array.isArray(t.by) || !t.by.length) errors.push(`${at}: „by” spune ce face două soluții diferite`);
      if (!Number.isInteger(t.need) || t.need < 2 || keys.size < t.need) errors.push(`${at}: are ${keys.size} soluții, cere ${t.need} (cel puțin 2)`);
      const found = search(W, params, state, (d) => matches(t.collect, d));
      if (found) state = found;
    } else {
      if (!PICK_RULES[t.rule]) errors.push(`${at}: regulă necunoscută „${t.rule}”`);
      else if (pickCorrect(t).length !== 1) errors.push(`${at}: are ${pickCorrect(t).length} variante corecte, nu una`);
      if (new Set(t.pick.map((o) => JSON.stringify(o))).size !== t.pick.length) errors.push(`${at}: variante repetate`);
    }
  });
  if (!ID.test(lesson.id ?? '')) errors.push(`id greșit „${lesson.id}”`);
  return errors;
}

/** Capitolele cu lecții (celelalte apar „în curând”). */
export const playableChapters = (data) => data.chapters.filter((c) => !c.soon);

/** „Ce învățăm”: conceptele lecțiilor unui capitol, în ordinea primei apariții. */
export const chapterConcepts = (chapter) => [...new Set((chapter.lessons ?? []).flatMap((l) => l.concepts))];

/** Capitolul și lecția după id-uri (null dacă nu există sau dacă e „în curând”). */
export function findLesson(data, chapterId, lessonId) {
  const chapter = playableChapters(data).find((c) => c.id === chapterId);
  if (!chapter) return null;
  const index = lessonId === undefined ? -1 : chapter.lessons.findIndex((l) => l.id === lessonId);
  return { chapter, lesson: index >= 0 ? chapter.lessons[index] : null, index };
}
