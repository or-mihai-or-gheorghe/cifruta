// Stocare simplă în localStorage (ciorne, încercări, Calcul fulger). Datele au un „scop”: fără cont, cheile de până acum
// (cifruta:attempts); pentru profilul unui copil, cifruta:p:<uid>:<pid>:attempts. Preferințele (sunetul) sunt comune.
// Scrierile se anunță prin onWrite: cloud/sync.js le pune în coada profilului și le trimite în Firestore.

const PREFIX = 'cifruta:';
let scope = ''; // '' = fără cont; altfel 'p:<uid>:<pid>:'
let profile = null; // { uid, pid } al scopului curent sau null
const listeners = new Set();

const scopeOf = (p) => (p ? `p:${p.uid}:${p.pid}:` : '');

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

const remove = (key) => {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    /* stocare blocată */
  }
};

/** Cheile (fără prefixul cifruta:) care încep cu `start`. */
const keysWith = (start) => {
  try {
    const out = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(PREFIX + start)) out.push(k.slice(PREFIX.length));
    }
    return out;
  } catch {
    return [];
  }
};

function emit(event) {
  for (const fn of listeners) {
    try {
      fn(event);
    } catch (err) {
      console.error(err);
    }
  }
}

/** Alege scopul datelor: null = fără cont, { uid, pid } = profilul unui copil. */
export function setScope(p) {
  scope = scopeOf(p);
  profile = p ? { uid: p.uid, pid: p.pid } : null;
  unsaved = null;
}

/** Profilul scopului curent ({ uid, pid }) sau null fără cont. */
export const currentProfile = () => profile;

/** Ascultă scrierile (attempt, history-clear, fulger-round, fulger-clear); întoarce funcția de oprire. */
export function onWrite(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Preferințe simple, comune tuturor profilurilor (de ex. sunetele): cifruta:<cheie>. */
export const getPref = (key, fallback = null) => read(key, fallback);
export const setPref = (key, value) => write(key, value);

/** O valoare în scopul curent (de ex. coada operațiilor care n-au ajuns în cloud). */
export const getScoped = (key, fallback = null) => read(scope + key, fallback);
export const setScoped = (key, value) => write(scope + key, value);

export const getDraft = (testId) => read(`${scope}draft:${testId}`, null);
const draftIds = (s = scope) => keysWith(`${s}draft:`).map((k) => k.slice(`${s}draft:`.length));
/** Ciornele începute (testele deschise și neterminate), ca { testId, draft }. */
export const listDrafts = () => draftIds().map((testId) => ({ testId, draft: getDraft(testId) })).filter((d) => d.draft);
export const saveDraft = (testId, draft) => write(`${scope}draft:${testId}`, draft);
export const clearDraft = (testId) => remove(`${scope}draft:${testId}`);

// Ultima încercare care nu a putut fi scrisă (stocare plină sau blocată) rămâne în memorie cât e deschisă pagina,
// ca rezultatele ei să se poată afișa oricum.
let unsaved = null;

export const listAttempts = (testId) => {
  const all = read(`${scope}attempts`, []);
  if (unsaved && !all.some((a) => a.id === unsaved.id)) all.push(unsaved);
  return all.filter((a) => !testId || a.testId === testId);
};
export const lastAttempt = (testId) => listAttempts(testId).at(-1) ?? null;
export const getAttempt = (id) => listAttempts().find((a) => a.id === id) ?? null;
export const isUnsaved = (attempt) => Boolean(attempt && unsaved && attempt.id === unsaved.id);

/** Adaugă o încercare; întoarce false dacă stocarea nu a putut scrie (încercarea rămâne doar în memorie). */
export function addAttempt(attempt) {
  const all = read(`${scope}attempts`, []);
  all.push(attempt);
  const ok = write(`${scope}attempts`, all);
  unsaved = ok ? null : attempt;
  emit({ type: 'attempt', attempt, created: true });
  return ok;
}

export function updateAttempt(id, changes) {
  if (unsaved?.id === id) {
    unsaved = { ...unsaved, ...changes };
    emit({ type: 'attempt', attempt: unsaved, created: false });
    return;
  }
  const all = read(`${scope}attempts`, []);
  const i = all.findIndex((a) => a.id === id);
  if (i >= 0) {
    all[i] = { ...all[i], ...changes };
    write(`${scope}attempts`, all);
    emit({ type: 'attempt', attempt: all[i], created: false });
  }
}

/** Șterge istoricul (încercările și ciornele) testelor date; fără argument, al tuturor testelor. */
export function clearHistory(testIds = null) {
  write(`${scope}attempts`, testIds ? read(`${scope}attempts`, []).filter((a) => !testIds.includes(a.testId)) : []);
  if (unsaved && (!testIds || testIds.includes(unsaved.testId))) unsaved = null;
  for (const id of testIds ?? draftIds()) clearDraft(id);
  emit({ type: 'history-clear', testIds });
}

export const bestScore = (testId) =>
  listAttempts(testId).reduce((best, a) => Math.max(best, a.score), -1);

// ——— Calcul fulger: recordurile pe niveluri, ultimele runde și medaliile (cifruta:[scop]fulger) ———

export function getFulger() {
  const data = read(`${scope}fulger`, {});
  return { best: data.best ?? {}, rounds: data.rounds ?? [], medals: data.medals ?? {} };
}

/** Salvează o rundă terminată și medaliile câștigate acum; întoarce { saved, record, previous }. */
export function saveFulgerRound(round, { keep = 30, medals = [] } = {}) {
  const data = getFulger();
  const previous = data.best[round.level]?.alune ?? null;
  const record = round.total > (previous ?? 0);
  // recordul păstrează și ce trebuie clasamentului „tot timpul”, chiar după ce runda iese din ultimele `keep`
  if (record) data.best[round.level] = { alune: round.total, at: round.at, correct: round.correct, bestStreak: round.bestStreak };
  data.rounds = [...data.rounds, round].slice(-keep);
  for (const id of medals) data.medals[id] ??= round.at;
  const saved = write(`${scope}fulger`, data);
  emit({ type: 'fulger-round', round, state: { best: data.best, medals: data.medals } });
  return { saved, record, previous };
}

export function clearFulger() {
  remove(`${scope}fulger`);
  emit({ type: 'fulger-clear' });
}

// ——— Datele unui scop: sincronizarea, mutarea rezultatelor fără cont, ieșirea din cont ———

/** Încercările și Calcul fulger ale unui scop (fără ciorne). */
export function readScopeData(p = null) {
  const s = scopeOf(p);
  const f = read(`${s}fulger`, {});
  return { attempts: read(`${s}attempts`, []), fulger: { best: f.best ?? {}, rounds: f.rounds ?? [], medals: f.medals ?? {} } };
}

/** Înlocuiește datele unui scop fără să anunțe scrierea (datele vin din cloud). */
export function writeScopeData(p, { attempts, fulger }) {
  const s = scopeOf(p);
  return write(`${s}attempts`, attempts) && write(`${s}fulger`, fulger);
}

/** Mută ciornele dintr-un scop în altul (rezultatele fără cont intră în primul profil). */
export function moveDrafts(from, to) {
  const [a, b] = [scopeOf(from), scopeOf(to)];
  for (const id of draftIds(a)) {
    const draft = read(`${a}draft:${id}`, null);
    if (draft) write(`${b}draft:${id}`, draft);
    remove(`${a}draft:${id}`);
  }
}

/** Șterge datele unui scop: încercări, Calcul fulger, ciorne, coada spre cloud și semnul că s-au adus din cloud. */
export function clearScopeData(p = null) {
  const s = scopeOf(p);
  for (const key of ['attempts', 'fulger', 'pending', 'pulled']) remove(`${s}${key}`);
  for (const id of draftIds(s)) remove(`${s}draft:${id}`);
}

/** Șterge din browser toate copiile profilurilor unui cont (la ieșirea din cont, pe dispozitive folosite de mai mulți). */
export function clearAccountCopies(uid) {
  for (const key of keysWith(`p:${uid}:`)) remove(key);
}
