// Învață: progresul lecțiilor (provocările făcute), pe profil, doar în browser (core/storage.js: getLessons / saveLessons).
// Lecția pornește mereu de la prima provocare; bifele rămân. La ieșirea din cont se șterg odată cu copiile profilului.

import { getLessons, saveLessons } from '../core/storage.js';

export const lessonKey = (chapter, lesson) => `${chapter.id}/${lesson.id}`;

/** Provocările făcute dintr-o lecție (doar cele care mai există în date). */
export function doneTasks(chapter, lesson, all = getLessons()) {
  const ids = new Set(lesson.tasks.map((t) => t.id));
  return (all[lessonKey(chapter, lesson)]?.done ?? []).filter((id) => ids.has(id));
}

export const isLessonDone = (chapter, lesson, all = getLessons()) => doneTasks(chapter, lesson, all).length === lesson.tasks.length;

/** Câte lecții dintr-un capitol sunt terminate. */
export const lessonsDone = (chapter, all = getLessons()) => chapter.lessons.filter((l) => isLessonDone(chapter, l, all)).length;

/** Bifează o provocare; întoarce false dacă stocarea nu scrie (progresul rămâne doar în pagină). */
export function markTask(chapter, lesson, taskId, at = new Date().toISOString()) {
  const all = getLessons();
  const key = lessonKey(chapter, lesson);
  all[key] = { done: [...new Set([...(all[key]?.done ?? []), taskId])], at };
  return saveLessons(all);
}
