// Stocare simplă în localStorage (ciorne și încercări). Mai târziu poate fi înlocuită cu un server.

const PREFIX = 'cifruta:';

const read = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(PREFIX + key)) ?? fallback;
  } catch {
    return fallback;
  }
};

/** Scrie o valoare; întoarce false când stocarea e blocată sau plină (testul continuă, doar nu se salvează). */
const write = (key, value) => {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};

/** Preferințe simple (de ex. sunetele): cifruta:<cheie>. */
export const getPref = (key, fallback = null) => read(key, fallback);
export const setPref = (key, value) => write(key, value);

export const getDraft = (testId) => read(`draft:${testId}`, null);
export const saveDraft = (testId, draft) => write(`draft:${testId}`, draft);
export const clearDraft = (testId) => {
  try {
    localStorage.removeItem(`${PREFIX}draft:${testId}`);
  } catch {
    /* stocare blocată */
  }
};

// Ultima încercare care nu a putut fi scrisă (stocare plină sau blocată) rămâne în memorie cât e deschisă pagina,
// ca rezultatele ei să se poată afișa oricum.
let unsaved = null;

export const listAttempts = (testId) => {
  const all = read('attempts', []);
  if (unsaved && !all.some((a) => a.id === unsaved.id)) all.push(unsaved);
  return all.filter((a) => !testId || a.testId === testId);
};
export const lastAttempt = (testId) => listAttempts(testId).at(-1) ?? null;
export const getAttempt = (id) => listAttempts().find((a) => a.id === id) ?? null;
export const isUnsaved = (attempt) => Boolean(attempt && unsaved && attempt.id === unsaved.id);

/** Adaugă o încercare; întoarce false dacă stocarea nu a putut scrie (încercarea rămâne doar în memorie). */
export function addAttempt(attempt) {
  const all = read('attempts', []);
  all.push(attempt);
  const ok = write('attempts', all);
  unsaved = ok ? null : attempt;
  return ok;
}

export function updateAttempt(id, changes) {
  if (unsaved?.id === id) {
    unsaved = { ...unsaved, ...changes };
    return;
  }
  const all = read('attempts', []);
  const i = all.findIndex((a) => a.id === id);
  if (i >= 0) {
    all[i] = { ...all[i], ...changes };
    write('attempts', all);
  }
}

/** Șterge istoricul (încercările și ciornele) testelor date; fără argument, al tuturor testelor. */
export function clearHistory(testIds = null) {
  write('attempts', testIds ? read('attempts', []).filter((a) => !testIds.includes(a.testId)) : []);
  if (unsaved && (!testIds || testIds.includes(unsaved.testId))) unsaved = null;
  let ids = testIds;
  if (!ids) {
    try {
      ids = Object.keys(localStorage).filter((k) => k.startsWith(`${PREFIX}draft:`)).map((k) => k.slice(PREFIX.length + 'draft:'.length));
    } catch {
      ids = [];
    }
  }
  for (const id of ids) clearDraft(id);
}

export const bestScore = (testId) =>
  listAttempts(testId).reduce((best, a) => Math.max(best, a.score), -1);
