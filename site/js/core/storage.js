// Stocare simplă în localStorage (ciorne și încercări). Mai târziu poate fi înlocuită cu un server.

const PREFIX = 'cifruta:';

const read = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(PREFIX + key)) ?? fallback;
  } catch {
    return fallback;
  }
};

const write = (key, value) => localStorage.setItem(PREFIX + key, JSON.stringify(value));

export const getDraft = (testId) => read(`draft:${testId}`, null);
export const saveDraft = (testId, draft) => write(`draft:${testId}`, draft);
export const clearDraft = (testId) => localStorage.removeItem(`${PREFIX}draft:${testId}`);

export const listAttempts = (testId) => read('attempts', []).filter((a) => !testId || a.testId === testId);
export const lastAttempt = (testId) => listAttempts(testId).at(-1) ?? null;

export function addAttempt(attempt) {
  const all = read('attempts', []);
  all.push(attempt);
  write('attempts', all);
}

export function updateAttempt(id, changes) {
  const all = read('attempts', []);
  const i = all.findIndex((a) => a.id === id);
  if (i >= 0) {
    all[i] = { ...all[i], ...changes };
    write('attempts', all);
  }
}

export const bestScore = (testId) =>
  listAttempts(testId).reduce((best, a) => Math.max(best, a.score), -1);
