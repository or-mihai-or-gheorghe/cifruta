// Structura unui test: normalizare (forma scurtă a exercițiilor) și validare completă.

import config from '../../data/scoring.js';
import { trace } from './expr.js';
import { findNonJSON, lintText, NEGATION, walkTexts, WORD_LIMITS } from './lint.js';
import { markupErrors, plain } from './markup.js';
import { getLogic, hasType } from './registry.js';
import { wordCount } from './ro.js';
import { trecere } from './rules.js';
import { hasVisual, visualErrors } from '../visuals/index.js';

const LEVEL_IDS = config.levels.map((l) => l.id);
const CU_TRECERE = ['mat.op.cu-trecere', 'mat.op1000.cu-trecere'];
const FARA_TRECERE = ['mat.op.fara-trecere', 'mat.op1000.fara-trecere'];
const EXERCISE_KEYS = new Set(['id', 'level', 'estMin', 'points', 'concepts', 'title', 'context', 'explain', 'parts']);

/** Un exercițiu cu o singură parte poate fi scris fără `parts`: câmpurile părții stau direct pe exercițiu. */
export function normalizeExercise(ex) {
  if (ex.parts) return ex;
  const out = {};
  const part = { id: 'a' };
  for (const [k, v] of Object.entries(ex)) (EXERCISE_KEYS.has(k) ? out : part)[k] = v;
  return { ...out, parts: [part] };
}

export const normalizeTest = (test) => ({ ...test, exercises: (test.exercises ?? []).map(normalizeExercise) });

export function validateTest(raw, { concepts } = {}) {
  const errors = [];
  const warnings = [];
  const test = normalizeTest(raw);

  if (test.schema !== 1) errors.push('schema trebuie să fie 1');
  if (!test.id) errors.push('lipsește id');
  if (!test.title) errors.push('lipsește title');
  if (!Number.isInteger(test.version)) errors.push('version trebuie să fie un număr întreg');
  if (!test.exercises.length) errors.push('testul nu are exerciții');
  for (const p of findNonJSON(raw)) errors.push(`${p}: valoare care nu poate fi salvată ca JSON`);

  const exIds = new Set();
  let levelIndex = 0;
  let totalMin = 0;
  for (const ex of test.exercises) {
    const where = `exercițiul ${ex.id}`;
    if (!ex.id || exIds.has(ex.id)) errors.push(`${where}: id lipsă sau duplicat`);
    exIds.add(ex.id);
    const li = LEVEL_IDS.indexOf(ex.level);
    if (li < 0) errors.push(`${where}: nivel necunoscut „${ex.level}”`);
    else if (li < levelIndex) errors.push(`${where}: nivelurile trebuie să crească (ușor → intermediar → avansat)`);
    else levelIndex = li;
    if (!(ex.estMin > 0)) errors.push(`${where}: lipsește estMin`);
    else totalMin += ex.estMin;
    if (!ex.title) errors.push(`${where}: lipsește titlul`);
    if (!ex.concepts?.length) errors.push(`${where}: lipsesc conceptele`);
    for (const c of ex.concepts ?? []) if (concepts && !concepts[c]) errors.push(`${where}: concept necunoscut „${c}”`);
    if (!ex.explain?.idea) warnings.push(`${where}: lipsește explicația (explain.idea)`);
    const checkVisual = (spec, path) => {
      if (!spec) return;
      if (!hasVisual(spec.v)) errors.push(`${path}: desen necunoscut „${spec.v}”`);
      else for (const e of visualErrors(spec)) errors.push(`${path}: ${e}`);
    };
    checkVisual(ex.context?.visual, `${where}.context.visual`);

    const partIds = new Set();
    const ops = []; // adunările și scăderile din exercițiu, pentru etichetele „cu / fără trecere”
    for (const part of ex.parts) {
      const pw = `${where}.${part.id}`;
      if (!part.id || partIds.has(part.id)) errors.push(`${pw}: id lipsă sau duplicat`);
      partIds.add(part.id);
      if (part.weight !== undefined && !(typeof part.weight === 'number' && part.weight > 0)) errors.push(`${pw}: weight trebuie să fie un număr pozitiv`);
      if (part.concepts !== undefined) {
        if (!Array.isArray(part.concepts) || !part.concepts.length) errors.push(`${pw}: concepts trebuie să fie o listă nevidă`);
        else for (const c of part.concepts) if (!ex.concepts?.includes(c)) errors.push(`${pw}: conceptul „${c}” nu e printre conceptele exercițiului`);
      }
      if (!hasType(part.type)) {
        errors.push(`${pw}: tip necunoscut „${part.type}”`);
        continue;
      }
      checkVisual(part.visual, `${pw}.visual`);
      checkVisual(part.itemVisual, `${pw}.itemVisual`);
      for (const list of ['items', 'bins', 'left', 'right', 'categories']) {
        for (const it of Array.isArray(part[list]) ? part[list] : []) checkVisual(it?.visual, `${pw}.${list}.${it?.id}.visual`);
      }
      for (const it of Array.isArray(part.items) ? part.items : []) {
        for (const o of Array.isArray(it?.options) ? it.options : []) checkVisual(o?.visual, `${pw}.${it.id}.${o?.id}.visual`);
      }
      const logic = getLogic(part.type);
      let partErrors;
      try {
        partErrors = logic.validate(part);
      } catch (e) {
        partErrors = [`eroare la validare: ${e.message}`];
      }
      errors.push(...partErrors.map((e) => `${pw}: ${e}`));
      if (partErrors.length) continue;
      for (const src of logic.expressions?.(part) ?? []) {
        try {
          ops.push(...trace(src));
        } catch {
          /* expresiile greșite sunt raportate de validarea tipului */
        }
      }

      const full = logic.evaluate(part, logic.solution(part));
      if (full.earned !== full.total) errors.push(`${pw}: soluția nu primește punctaj maxim (${full.earned}/${full.total})`);
      if (logic.evaluate(part, logic.empty(part)).earned !== 0) errors.push(`${pw}: răspunsul gol primește puncte`);

      const limit = WORD_LIMITS[ex.level];
      const words = part.prompt ? wordCount(plain(part.prompt)) : 0;
      if (limit && words > limit) warnings.push(`${pw}: enunț de ${words} cuvinte (recomandat ≤ ${limit})`);
      if (part.type === 'truefalse') {
        for (const it of part.items) if (NEGATION.test(it.text)) warnings.push(`${pw}.${it.id}: evită negațiile în afirmațiile A/F`);
      }
    }

    // când subpunctele își declară conceptele, fiecare concept al exercițiului trebuie să fie exersat de cel puțin unul
    if (ex.parts.some((p) => Array.isArray(p.concepts))) {
      const covered = new Set(ex.parts.flatMap((p) => p.concepts ?? ex.concepts ?? []));
      for (const c of ex.concepts ?? []) if (!covered.has(c)) errors.push(`${where}: conceptul „${c}” nu e exersat de niciun subpunct`);
    }

    const tagged = (ids) => ids.some((c) => ex.concepts?.includes(c));
    const carried = ops.filter((o) => trecere(o.op, o.a, o.b));
    if (tagged(CU_TRECERE) && !carried.length) errors.push(`${where}: e etichetat „cu trecere”, dar niciun calcul nu are trecere peste ordin`);
    if (tagged(FARA_TRECERE) && !tagged(CU_TRECERE) && carried.length) {
      const { op, a, b } = carried[0];
      errors.push(`${where}: e etichetat „fără trecere”, dar ${a} ${op === '-' ? '−' : '+'} ${b} are trecere peste ordin`);
    }
  }

  if (test.exercises.length && totalMin !== config.estMin) {
    errors.push(`durata estimată este ${totalMin} min, dar un test trebuie să dureze exact ${config.estMin} min`);
  }

  walkTexts(raw, (text, path) => {
    for (const e of lintText(text)) errors.push(`${path}: ${e}`);
    for (const e of markupErrors(text)) errors.push(`${path}: ${e}`);
  });

  return { errors, warnings, totalMin };
}
