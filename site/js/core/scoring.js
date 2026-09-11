// Punctajul: fiecare exercițiu are puncte (implicit după nivel); credit parțial pe item;
// subpunctele unui exercițiu valorează egal (sau după `weight`), oricâte casete ar avea fiecare;
// scor final = 10 din oficiu + 90 × puncte obținute / puncte totale.

import config from '../../data/scoring.js';
import { getLogic } from './registry.js';

const levelById = Object.fromEntries(config.levels.map((l) => [l.id, l]));
const EPS = 1e-9; // 3 × 1 + 3 × 0,6 = 4,8 din 6 dă 0,7999999999999999 în virgulă mobilă

/** Pragul e atins (80% pentru stea), cu toleranță pentru rotunjirile din calcul. */
export const reached = (fraction, threshold) => fraction >= threshold - EPS;

export const pointsOf = (exercise) => exercise.points ?? levelById[exercise.level]?.points ?? 1;

export function evaluateExercise(exercise, answers = {}) {
  const parts = {};
  let earned = 0;
  let total = 0;
  for (const part of exercise.parts) {
    const res = getLogic(part.type).evaluate(part, answers?.[part.id] ?? null);
    parts[part.id] = res;
    const weight = part.weight ?? 1;
    earned += weight * (res.total ? res.earned / res.total : 0);
    total += weight;
  }
  const fraction = total ? earned / total : 0;
  const points = pointsOf(exercise);
  return { parts, earned, total, fraction, points, earnedPoints: points * fraction };
}

export const gradeFor = (score) => config.grades.find((g) => score >= g.min);

export function scoreTest(test, answers = {}) {
  const exercises = {};
  const levels = {};
  const concepts = {};
  let got = 0;
  let max = 0;
  for (const ex of test.exercises) {
    const r = evaluateExercise(ex, answers?.[ex.id] ?? {});
    exercises[ex.id] = r;
    got += r.earnedPoints;
    max += r.points;
    const lvl = (levels[ex.level] ??= { earned: 0, total: 0 });
    lvl.earned += r.earnedPoints;
    lvl.total += r.points;
    for (const c of ex.concepts ?? []) {
      const con = (concepts[c] ??= { earned: 0, total: 0 });
      con.earned += r.earnedPoints;
      con.total += r.points;
    }
  }
  for (const lvl of Object.values(levels)) {
    lvl.fraction = lvl.total ? lvl.earned / lvl.total : 0;
    lvl.star = reached(lvl.fraction, config.starAt);
  }
  const score = Math.round(config.oficiu + (100 - config.oficiu) * (max ? got / max : 0) + EPS);
  return { score, grade: gradeFor(score), earnedPoints: got, totalPoints: max, exercises, levels, concepts };
}

/** Câte „întrebări” are o parte și la câte s-a răspuns (pentru harta de progres). */
export function progressOf(exercise, answers = {}) {
  let done = 0;
  let count = 0;
  for (const part of exercise.parts) {
    const logic = getLogic(part.type);
    count += logic.count(part);
    done += logic.answered(part, answers?.[part.id] ?? null);
  }
  return { done, count };
}
