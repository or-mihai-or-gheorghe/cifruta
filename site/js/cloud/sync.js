// Sincronizarea profilului care joacă. Scrierile anunțate de core/storage.js (onWrite) intră în coada profilului imediat, chiar
// înainte ca Firebase să se încarce sau fără internet. Când contul e confirmat, startSync aduce datele din cloud (îmbinate cu coada)
// și trimite coada. Ce nu ajunge (fără internet, limita de frecvență a clasamentului) rămâne în cifruta:p:<uid>:<pid>:pending și
// se reia: la revenirea internetului, după o pauză, la activarea următoare. Tot ce ține împreună (încercare + contor + stelele pe
// teste, rundă + stare + contor, intrările unei teme + totalul ei + lista clasamentelor) se scrie într-o tranzacție. Clasamentele se
// calculează din starea completă din cloud (state/fulger, state/tests), nu doar din ce e în browser. Starea Jocuri fulger se
// normalizează la fiecare citire (chei „temă:nivel”, js/fulger/records.js), așa că datele de dinainte de teme se migrează singure.

import config from '../../data/fulger.js';
import { currentProfile, getAttempt, getFulger, getScoped, listAttempts, onWrite, readScopeData, setScoped, writeScopeData } from '../core/storage.js';
import { LEGACY_TOPIC, LEVEL_IDS, normalizeFulger } from '../fulger/records.js';
import {
  dequeue, enqueue, entryId, fromCloudAttempt, fulgerCandidates, isRetiredBoard, mergeAttempts, mergeFulger, mergeFulgerState, pruneBoards,
  roundId, sameData, starsTotal, TESTS_BOARD, toCloudAttempt, toCloudRound, withAttemptStars, withRetired, withWeekBest,
} from './logic.js';

const RETRY_MS = [20_000, 100_000, 300_000]; // a doua încercare trece de limita de 90 s a clasamentului
const MAX_TRIES = 5; // o operație refuzată de atâtea ori (date invalide) se scoate, ca să nu blocheze coada
const COUNTED = new Set(['permission-denied', 'invalid-argument', 'failed-precondition', 'out-of-range', 'not-found']);
const GONE = 'cifruta/gone';

/** Temele jucabile (fără engine.js, ca pornirea să nu încarce generatoarele de întrebări). */
const playableTopicIds = () => config.topics.filter((t) => !t.soon && t.levels?.length).map((t) => t.id);

let ctx = null; // { db, f, uid, pid, blocked(), onProfile(changes), onGone() }
let running = null;
let timer = 0;
let failures = 0;
let status = { syncing: false, error: null, lastSync: null };
const listeners = new Set();

function refs({ db, f, uid, pid }) {
  const base = ['users', uid, 'profiles', pid];
  return {
    profile: () => f.doc(db, ...base),
    attempts: () => f.collection(db, ...base, 'attempts'),
    attempt: (id) => f.doc(db, ...base, 'attempts', id),
    rounds: () => f.collection(db, ...base, 'fulger'),
    round: (id) => f.doc(db, ...base, 'fulger', id),
    state: () => f.doc(db, ...base, 'state', 'fulger'),
    tests: () => f.doc(db, ...base, 'state', 'tests'),
    entry: (board) => f.doc(db, 'leaderboards', board, 'entries', entryId(uid, pid)),
  };
}

const chunks = (list, size) => Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, (i + 1) * size));

async function deleteAll({ db, f }, docRefs) {
  for (const part of chunks(docRefs, 400)) {
    const batch = f.writeBatch(db);
    for (const ref of part) batch.delete(ref);
    await batch.commit();
  }
}

// ——— starea, pentru pagina contului ———

export const syncStatus = () => ({ ...status, pending: currentProfile() ? getScoped('pending', []).length : 0 });

export function onSyncChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function setStatus(changes) {
  status = { ...status, ...changes };
  const snapshot = syncStatus();
  for (const fn of listeners) fn(snapshot);
}

function describe(err) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'Fără internet: rezultatele se trimit când revine conexiunea.';
  if (err?.code === 'permission-denied') return 'Serverul a refuzat o salvare. Reîncerc mai târziu.';
  return 'Nu am putut trimite rezultatele. Reîncerc mai târziu.';
}

// ——— coada: se scrie oricând scopul e un profil, se trimite doar cu sincronizarea pornită ———

function add(op) {
  setScoped('pending', enqueue(getScoped('pending', []), op));
}

function schedule(ms = 800) {
  clearTimeout(timer);
  timer = setTimeout(() => flush(), ms);
}

function onStorageWrite(e) {
  if (!currentProfile()) return; // fără cont nu se înregistrează nimic
  if (e.type === 'attempt') {
    add({ type: 'attempt', id: e.attempt.id });
    if (e.created) add({ type: 'stars' });
  } else if (e.type === 'history-clear') {
    add({ type: 'clear-attempts', id: e.testIds ? e.testIds.join(',') : '*', testIds: e.testIds ?? null });
    add({ type: 'stars' });
  } else if (e.type === 'fulger-round') {
    add({ type: 'round', id: roundId(e.round) });
    add({ type: 'board', id: e.round.topic ?? LEGACY_TOPIC }); // o singură operație pe temă: nivelurile și totalul, împreună
  } else if (e.type === 'fulger-clear') {
    add({ type: 'clear-fulger' });
  } else return;
  setStatus({});
  if (ctx) schedule();
}

onWrite(onStorageWrite);

const onOnline = () => flush();

// activarea în curs (aducerea din cloud și operația `boards`); flush() o așteaptă, ca numărul salvărilor rămase să fie cel real
let activation = Promise.resolve();

/** Pornește sincronizarea profilului activ (scopul din storage trebuie să fie deja al lui); true dacă datele locale s-au schimbat. */
export async function startSync(context) {
  stopSync();
  ctx = context;
  const mine = ctx;
  addEventListener('online', onOnline);
  failures = 0;
  let changed = false;
  activation = (async () => {
    try {
      changed = await pull(mine);
    } catch (err) {
      if (ctx === mine) setStatus({ syncing: false, error: describe(err) });
    }
    if (ctx === mine) add({ type: 'boards' }); // o dată pe activare: clasamentele se aliniază cu starea completă (alte dispozitive, reveniri, teme)
  })();
  await activation;
  if (ctx === mine) flush();
  return changed;
}

export function stopSync() {
  if (typeof removeEventListener === 'function') removeEventListener('online', onOnline);
  clearTimeout(timer);
  ctx = null;
  running = null;
  setStatus({ syncing: false, error: null });
}

/** Rezultatele din browser ale profilului (de exemplu, cele mutate de fără cont) intră în coadă și pleacă spre cloud. */
export function uploadAll() {
  const p = currentProfile();
  if (!p) return;
  const { attempts, fulger } = readScopeData(p);
  for (const a of attempts) add({ type: 'attempt', id: a.id });
  for (const r of fulger.rounds) add({ type: 'round', id: roundId(r) });
  add({ type: 'boards' });
  setStatus({});
  if (ctx) schedule(0);
}

/** Intrările în clasamente, din nou (după ce profilul revine în clasament). */
export function requestBoards() {
  if (!currentProfile()) return;
  add({ type: 'boards' });
  if (ctx) schedule(0);
}

/** Trimite coada; întoarce câte operații au rămas. Cu `timeout`, nu așteaptă mai mult (trimiterea continuă în fundal). */
export function flush({ timeout = 0 } = {}) {
  if (!ctx) return Promise.resolve(syncStatus().pending);
  const c = ctx;
  const job = (running ??= activation.then(() => (ctx === c ? drain(c) : syncStatus().pending)).finally(() => {
    if (running === job) running = null;
  }));
  if (!timeout) return job;
  return Promise.race([job, new Promise((resolve) => setTimeout(resolve, timeout))]).then(() => syncStatus().pending);
}

async function drain(c) {
  if (c.blocked?.()) return syncStatus().pending;
  clearTimeout(timer);
  setStatus({ syncing: true });
  let error = null;
  try {
    if (!getScoped('pulled')) await pull(c);
    const skipped = new Set();
    for (;;) {
      if (ctx !== c) return 0;
      const op = getScoped('pending', []).find((q) => !skipped.has(q.seq));
      if (!op) break;
      try {
        await run(c, op);
        if (ctx !== c) return 0;
        setScoped('pending', dequeue(getScoped('pending', []), op));
      } catch (err) {
        if (ctx !== c) return 0;
        if (err?.code === GONE) {
          c.onGone?.();
          return 0;
        }
        console.warn(`Cifruța: sincronizarea „${op.type}” a eșuat (${err?.code ?? 'fără cod'}): ${err?.message ?? err}`);
        const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
        const tries = (op.tries ?? 0) + (!offline && (COUNTED.has(err?.code) || !err?.code) ? 1 : 0);
        const queue = getScoped('pending', []);
        if (tries >= MAX_TRIES) {
          console.warn('Cifruța: o operație refuzată de mai multe ori se scoate din coadă.', op, err);
          setScoped('pending', dequeue(queue, op));
          continue;
        }
        setScoped('pending', queue.map((q) => (q.seq === op.seq ? { ...q, tries } : q)));
        error = err;
        // clasamentele nu depind de ordine; încercările și rundele da (o ștergere nu trebuie să treacă înaintea unei scrieri mai vechi)
        if (['stars', 'board', 'boards'].includes(op.type) && !offline) {
          skipped.add(op.seq);
          continue;
        }
        break;
      }
    }
  } catch (err) {
    error = err;
  }
  if (ctx !== c) return 0;
  const pending = getScoped('pending', []).length;
  failures = error ? failures + 1 : 0;
  setStatus({ syncing: false, error: error ? describe(error) : null, lastSync: error ? status.lastSync : Date.now() });
  if (error && pending) timer = setTimeout(() => flush(), RETRY_MS[Math.min(failures, RETRY_MS.length) - 1]);
  return pending;
}

function run(c, op) {
  switch (op.type) {
    case 'attempt':
      return pushAttempt(c, op.id);
    case 'clear-attempts':
      return clearAttempts(c, op.testIds);
    case 'stars':
      return pushStars(c);
    case 'round':
      return pushRound(c, op.id);
    case 'board':
      // o operație din coada de dinainte de teme are ca id nivelul
      return pushBoards(c, [LEVEL_IDS.includes(op.id) ? LEGACY_TOPIC : op.id]);
    case 'boards':
      return pushBoards(c, playableTopicIds()).then(() => pushStars(c));
    case 'clear-fulger':
      return clearRounds(c);
    default:
      return Promise.resolve(); // o operație necunoscută (dintr-o versiune mai veche) se scoate din coadă
  }
}

// ——— aducerea ———

async function pull(c) {
  const { f } = c;
  const r = refs(c);
  setStatus({ syncing: true });
  const [attemptsSnap, roundsSnap, stateSnap] = await Promise.all([
    f.getDocs(r.attempts()),
    f.getDocs(f.query(r.rounds(), f.orderBy('at', 'desc'), f.limit(config.keepRounds))),
    f.getDoc(r.state()),
  ]);
  if (ctx !== c) return false;
  const profile = { uid: c.uid, pid: c.pid };
  const pending = getScoped('pending', []);
  const local = readScopeData(profile);
  const cloud = normalizeFulger({ ...(stateSnap.exists() ? stateSnap.data() : {}), rounds: roundsSnap.docs.map((d) => d.data()) });
  const next = {
    attempts: mergeAttempts(local.attempts, attemptsSnap.docs.map((d) => fromCloudAttempt(d.data())), pending),
    fulger: mergeFulger(local.fulger, cloud, pending, config.keepRounds),
  };
  setScoped('pulled', true);
  setStatus({ syncing: false, error: null, lastSync: Date.now() });
  if (sameData(next, local)) return false;
  writeScopeData(profile, next);
  return true;
}

// ——— trimiterea ———

async function readProfile(tx, r) {
  const snap = await tx.get(r.profile());
  if (!snap.exists()) throw Object.assign(new Error('Profilul nu mai există.'), { code: GONE });
  return snap.data();
}

const dataOf = (snap) => (snap.exists() ? snap.data() : {});

/**
 * state/tests.best. Documentul lipsește la profilurile ale căror încercări au urcat înainte de v0.9.1: atunci se reface din încercările
 * din browser (după aducere, aceleași cu cele din cloud), ca stelele lor să nu dispară din clasament.
 */
const testsBest = (snap) => (snap.exists() ? (snap.data().best ?? {}) : listAttempts().reduce((best, a) => withAttemptStars(best, a) ?? best, {}));

async function pushAttempt(c, id) {
  const attempt = getAttempt(id);
  if (!attempt) return; // ștearsă între timp
  const r = refs(c);
  await c.f.runTransaction(c.db, async (tx) => {
    const profile = await readProfile(tx, r);
    const existing = await tx.get(r.attempt(id));
    const tests = await tx.get(r.tests());
    tx.set(r.attempt(id), toCloudAttempt(attempt));
    if (!existing.exists()) tx.update(r.profile(), { attempts: (profile.attempts ?? 0) + 1 });
    const saved = testsBest(tests);
    const best = withAttemptStars(saved, attempt) ?? saved;
    if (best !== saved || !tests.exists()) tx.set(r.tests(), { best });
  });
}

async function clearAttempts(c, testIds) {
  const { f } = c;
  const r = refs(c);
  const snaps = testIds
    ? await Promise.all(chunks(testIds, 30).map((ids) => f.getDocs(f.query(r.attempts(), f.where('testId', 'in', ids)))))
    : [await f.getDocs(r.attempts())];
  const docs = snaps.flatMap((s) => s.docs);
  await deleteAll(c, docs.map((d) => d.ref));
  await f.runTransaction(c.db, async (tx) => {
    const profile = await readProfile(tx, r);
    const tests = await tx.get(r.tests());
    const best = { ...(dataOf(tests).best ?? {}) };
    for (const id of testIds ?? Object.keys(best)) delete best[id];
    if (docs.length) tx.update(r.profile(), { attempts: Math.max(0, (profile.attempts ?? 0) - docs.length) });
    tx.set(r.tests(), { best });
  });
}

async function pushRound(c, id) {
  const local = getFulger();
  const round = local.rounds.find((x) => roundId(x) === id);
  if (!round) return;
  const r = refs(c);
  await c.f.runTransaction(c.db, async (tx) => {
    const profile = await readProfile(tx, r);
    const existing = await tx.get(r.round(id));
    const cloud = normalizeFulger(dataOf(await tx.get(r.state())));
    const week = withWeekBest(cloud.week, round) ?? cloud.week ?? {};
    tx.set(r.round(id), toCloudRound(round));
    tx.set(r.state(), { ...mergeFulgerState(cloud, local), week }); // scrisă înapoi normalizată: documentul vechi se migrează
    if (!existing.exists()) tx.update(r.profile(), { rounds: (profile.rounds ?? 0) + 1 });
  });
}

async function clearRounds(c) {
  const r = refs(c);
  const snap = await c.f.getDocs(r.rounds());
  await deleteAll(c, [...snap.docs.map((d) => d.ref), r.state()]);
  await c.f.runTransaction(c.db, async (tx) => {
    await readProfile(tx, r);
    tx.update(r.profile(), { rounds: 0 });
  });
}

const entryBase = (c, profile) => ({ uid: c.uid, pid: c.pid, nickname: profile.nickname, avatar: profile.avatar, updatedAt: c.f.serverTimestamp() });

/**
 * Jocuri fulger, pe temele date: pe fiecare nivel „tot timpul” din recordul permanent și săptămâna din cea mai bună rundă a ei, plus
 * totalul temei pe ambele perioade; scorul doar crește. Clasamentele săptămânilor trecute rămân; în aceeași tranzacție, intrările de
 * dinainte de teme se mută cu scorul lor în tema veche și se șterg.
 */
async function pushBoards(c, topics) {
  const local = getFulger();
  const r = refs(c);
  const boards = await c.f.runTransaction(c.db, async (tx) => {
    const profile = await readProfile(tx, r);
    const cloud = normalizeFulger(dataOf(await tx.get(r.state())));
    const { best } = mergeFulgerState(cloud, local);
    const retired = [];
    for (const board of (profile.boards ?? []).filter(isRetiredBoard)) retired.push([board, dataOf(await tx.get(r.entry(board)))]);
    const candidates = topics.flatMap((topic) => fulgerCandidates(topic, { best, week: cloud.week }, local.rounds));
    const wanted = profile.showOnBoards ? withRetired(candidates, retired) : [];
    if (!wanted.length && !retired.length) return null;
    const entries = [];
    for (const [board] of wanted) entries.push(await tx.get(r.entry(board)));
    const writes = wanted.filter(([, top], i) => !entries[i].exists() || top.score > entries[i].data().score);
    const { keep, dropped } = pruneBoards([...(profile.boards ?? []), ...writes.map(([board]) => board)]);
    if (!writes.length && !dropped.length) return null;
    for (const [board, top] of writes) tx.set(r.entry(board), { ...entryBase(c, profile), ...top });
    for (const board of dropped) tx.delete(r.entry(board));
    if (!sameData(keep, profile.boards ?? [])) tx.update(r.profile(), { boards: keep });
    return keep;
  });
  if (boards) c.onProfile?.({ boards });
}

/** Stelele de la teste, din state/tests (toate încercările profilului, de pe orice dispozitiv; refăcut dacă lipsește); la 0 stele intrarea dispare. */
async function pushStars(c) {
  const r = refs(c);
  const boards = await c.f.runTransaction(c.db, async (tx) => {
    const profile = await readProfile(tx, r);
    const saved = await tx.get(r.tests());
    const entry = await tx.get(r.entry(TESTS_BOARD));
    const best = testsBest(saved);
    if (!saved.exists() && Object.keys(best).length) tx.set(r.tests(), { best });
    if (!profile.showOnBoards) return null;
    const { stars, tests } = starsTotal(best);
    const had = entry.exists();
    if (had ? entry.data().score === stars && entry.data().tests === tests : stars === 0) return null;
    let next = profile.boards ?? [];
    if (stars === 0) {
      tx.delete(r.entry(TESTS_BOARD));
      next = next.filter((b) => b !== TESTS_BOARD);
    } else {
      tx.set(r.entry(TESTS_BOARD), { ...entryBase(c, profile), score: Math.min(stars, 1000), tests: Math.min(tests, 1000) });
      next = [...new Set([...next, TESTS_BOARD])].sort(); // clasamentele de dinainte de teme rămân pentru `boards`, care le mută
    }
    if (!sameData(next, profile.boards ?? [])) tx.update(r.profile(), { boards: next });
    return next;
  });
  if (boards) c.onProfile?.({ boards });
}

// ——— ștergerea unui profil (proprietarul sau adminul) ———

/** Șterge din cloud un profil cu tot ce ține de el: intrările din clasamente, încercările, rundele, starea și profilul. */
export async function deleteProfileCloud({ db, f }, uid, pid, boards = []) {
  const base = ['users', uid, 'profiles', pid];
  const [attempts, rounds] = await Promise.all([f.getDocs(f.collection(db, ...base, 'attempts')), f.getDocs(f.collection(db, ...base, 'fulger'))]);
  await deleteAll({ db, f }, [
    ...boards.map((board) => f.doc(db, 'leaderboards', board, 'entries', entryId(uid, pid))),
    ...attempts.docs.map((d) => d.ref),
    ...rounds.docs.map((d) => d.ref),
    f.doc(db, ...base, 'state', 'fulger'),
    f.doc(db, ...base, 'state', 'tests'),
    f.doc(db, ...base),
  ]);
}
