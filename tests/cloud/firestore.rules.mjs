// Regulile Firestore, verificate pe emulator: npm run test:rules (pornește emulatorul, rulează acest fișier, îl oprește).
// Nu intră în `npm test`, care rulează fără emulator.

import { readFileSync } from 'node:fs';
import { after, before, beforeEach, test } from 'node:test';

import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, deleteDoc, doc, getDoc, getDocs, increment, serverTimestamp, setDoc, Timestamp, updateDoc, writeBatch } from 'firebase/firestore';

let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-cifruta',
    firestore: { rules: readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8085 },
  });
});
after(async () => {
  await env?.cleanup();
});
beforeEach(async () => {
  await env.clearFirestore();
});

const as = (uid) => env.authenticatedContext(uid, { email: `${uid}@example.com`, email_verified: true }).firestore();
const anon = () => env.unauthenticatedContext().firestore();
const old = Timestamp.fromMillis(Date.now() - 10 * 60 * 1000);

/** Scrie date de pornire fără reguli. */
const seed = (fn) => env.withSecurityRulesDisabled((ctx) => fn(ctx.firestore()));

const TOPIC = 'adunari-scaderi-100';
/** Colecția intrărilor unui clasament Calcul fulger: nivel sau „total”, „all” sau o săptămână. */
const board = (scope, period = 'all') => `leaderboards/fulger-${TOPIC}-${scope}-${period}/entries`;

const profile = (extra = {}) => ({ nickname: 'Ana', avatar: 'veverita', showOnBoards: true, createdAt: old, attempts: 0, rounds: 0, boards: [], ...extra });
const user = (uid, extra = {}) => ({ email: `${uid}@example.com`, name: 'Părinte', createdAt: serverTimestamp(), lastSeenAt: serverTimestamp(), ...extra });

/** Un cont cu consimțământ și profilul p1; `blocked` pune și documentul blocked/{uid}. */
const family = (uid, { consent = true, blocked = false } = {}) =>
  seed(async (db) => {
    await setDoc(doc(db, 'users', uid), { email: `${uid}@example.com`, name: 'Părinte', createdAt: old, lastSeenAt: old, ...(consent ? { consentAt: old } : {}) });
    await setDoc(doc(db, 'users', uid, 'profiles', 'p1'), profile());
    if (blocked) await setDoc(doc(db, 'blocked', uid), { at: old });
  });

const entry = (uid, extra = {}) => ({ uid, pid: 'p1', nickname: 'Ana', avatar: 'veverita', score: 50, correct: 20, bestStreak: 7, updatedAt: serverTimestamp(), ...extra });
const total = (uid, extra = {}) => ({ uid, pid: 'p1', nickname: 'Ana', avatar: 'veverita', score: 5000, levels: 3, updatedAt: serverTimestamp(), ...extra });
const stars = (uid, extra = {}) => ({ uid, pid: 'p1', nickname: 'Ana', avatar: 'veverita', score: 6, tests: 2, updatedAt: serverTimestamp(), ...extra });
const round = { id: 'usor-1', topic: TOPIC, level: 'usor', at: '2026-09-13T10:00:00Z', total: 120, correct: 30, wrong: 2, bestStreak: 12, fast: 9, stars: 2, byKind: {} };

test('reguli: contul se creează doar pentru sine, cu e-mailul din token și fără câmpuri în plus', async () => {
  await assertSucceeds(setDoc(doc(as('ana'), 'users/ana'), user('ana')));
  await assertFails(setDoc(doc(as('bob'), 'users/ana2'), user('bob'))); // documentul altcuiva
  await assertFails(setDoc(doc(as('bob'), 'users/bob'), user('ana'))); // e-mail fals
  await assertFails(setDoc(doc(as('carl'), 'users/carl'), user('carl', { blocked: false })));
  await assertFails(setDoc(doc(anon(), 'users/dan'), user('dan')));
});

test('reguli: datele contului le văd proprietarul și adminul; blocarea o pune și o scoate doar adminul', async () => {
  await family('ana');
  await seed((db) => setDoc(doc(db, 'admins/root'), {}));
  await assertFails(setDoc(doc(as('ana'), 'blocked/ana'), { at: serverTimestamp() }));
  await assertFails(updateDoc(doc(as('ana'), 'users/ana'), { blocked: true }));
  await assertSucceeds(updateDoc(doc(as('ana'), 'users/ana'), { lastSeenAt: serverTimestamp() }));
  await assertFails(getDoc(doc(as('bob'), 'users/ana')));
  await assertFails(getDoc(doc(anon(), 'users/ana')));
  await assertSucceeds(getDoc(doc(as('root'), 'users/ana')));
  await assertSucceeds(setDoc(doc(as('root'), 'blocked/ana'), { at: serverTimestamp() }));
  await assertFails(setDoc(doc(as('root'), 'blocked/bob'), { at: old })); // momentul trebuie să fie cel al scrierii
  await assertSucceeds(getDoc(doc(as('ana'), 'blocked/ana'))); // își vede blocarea
  await assertFails(getDoc(doc(as('bob'), 'blocked/ana')));
  await assertSucceeds(getDocs(collection(as('root'), 'blocked')));
  await assertFails(updateDoc(doc(as('root'), 'users/ana'), { email: 'altul@example.com' }));
  await assertFails(getDocs(collection(as('ana'), 'users')));
  await assertSucceeds(getDocs(collection(as('root'), 'users')));
  await assertSucceeds(deleteDoc(doc(as('root'), 'blocked/ana')));
  await assertSucceeds(getDoc(doc(as('root'), 'admins/root')));
  await assertFails(getDoc(doc(as('ana'), 'admins/root')));
  await assertFails(setDoc(doc(as('ana'), 'admins/ana'), {}));
});

test('reguli: profilurile cer consimțământ, cel mult 6, poreclă și avatar valide', async () => {
  await seed((db) => setDoc(doc(db, 'users/ana'), { email: 'ana@example.com', name: 'Părinte', createdAt: old, lastSeenAt: old }));
  const db = as('ana');
  const p = { ...profile(), createdAt: serverTimestamp() };
  await assertFails(setDoc(doc(db, 'users/ana/profiles/p1'), p)); // fără consimțământ
  await assertSucceeds(updateDoc(doc(db, 'users/ana'), { consentAt: serverTimestamp() }));
  await assertSucceeds(setDoc(doc(db, 'users/ana/profiles/p1'), p));
  await assertFails(setDoc(doc(db, 'users/ana/profiles/p7'), p));
  await assertFails(setDoc(doc(db, 'users/ana/profiles/p2'), { ...p, nickname: '<b>' }));
  await assertFails(setDoc(doc(db, 'users/ana/profiles/p2'), { ...p, avatar: 'dragon' }));
  await assertFails(setDoc(doc(db, 'users/ana/profiles/p2'), { ...p, extra: 1 }));
  await assertSucceeds(updateDoc(doc(db, 'users/ana/profiles/p1'), { nickname: 'Ana Maria', attempts: increment(1) }));
  await assertFails(getDoc(doc(as('bob'), 'users/ana/profiles/p1')));
});

test('reguli: încercările, rundele (cu temă) și starea le scrie doar proprietarul, cu chei și limite', async () => {
  await family('ana');
  const db = as('ana');
  const attempt = { id: 'recap-c1-t1-1', testId: 'recap-c1-t1', score: 90, answers: '{}', activeMs: 600000, feeling: null };
  await assertSucceeds(setDoc(doc(db, 'users/ana/profiles/p1/attempts/recap-c1-t1-1'), attempt));
  await assertFails(setDoc(doc(db, 'users/ana/profiles/p1/attempts/a2'), { ...attempt, score: 101 }));
  await assertFails(setDoc(doc(db, 'users/ana/profiles/p1/attempts/a3'), { ...attempt, hacked: true }));
  await assertFails(setDoc(doc(as('bob'), 'users/ana/profiles/p1/attempts/a4'), attempt));
  await assertFails(getDoc(doc(as('bob'), 'users/ana/profiles/p1/attempts/recap-c1-t1-1')));
  await assertSucceeds(setDoc(doc(db, 'users/ana/profiles/p1/fulger/usor-1'), round));
  const { topic, ...untopical } = round;
  await assertSucceeds(setDoc(doc(db, 'users/ana/profiles/p1/fulger/usor-2'), untopical)); // o filă de dinainte de teme
  await assertFails(setDoc(doc(db, 'users/ana/profiles/p1/fulger/usor-3'), { ...round, topic: 'inmultirea' })); // temă „în curând”
  await assertFails(setDoc(doc(db, 'users/ana/profiles/p1/fulger/usor-4'), { ...round, topic: 7 }));
  await assertFails(setDoc(doc(db, 'users/ana/profiles/p1/fulger/usor-5'), { ...round, total: 5000 }));
  await assertFails(setDoc(doc(db, 'users/ana/profiles/p1/fulger/usor-6'), { ...round, level: 'expert' }));
  await assertSucceeds(setDoc(doc(db, 'users/ana/profiles/p1/state/fulger'), { best: { [`${TOPIC}:usor`]: { alune: 120 } }, medals: {}, week: { [`${TOPIC}:usor`]: { id: '2026-W37', alune: 120 } } }));
  await assertSucceeds(setDoc(doc(db, 'users/ana/profiles/p1/state/tests'), { best: { 'recap-c1-t1': 3 } }));
  await assertFails(setDoc(doc(db, 'users/ana/profiles/p1/state/tests'), { best: {}, extra: 1 }));
  await assertFails(setDoc(doc(db, 'users/ana/profiles/p1/state/altceva'), { best: {}, medals: {} }));
});

test('reguli: un cont blocat citește, dar nu mai scrie, nici după ce își șterge și își recreează contul', async () => {
  await family('ana', { blocked: true });
  const db = as('ana');
  await assertSucceeds(getDoc(doc(db, 'users/ana/profiles/p1')));
  await assertFails(setDoc(doc(db, 'users/ana/profiles/p1/fulger/usor-1'), round));
  await assertFails(setDoc(doc(db, `${board('usor')}/ana_p1`), entry('ana')));
  await assertFails(deleteDoc(doc(db, 'blocked/ana')));
  await assertSucceeds(deleteDoc(doc(db, 'users/ana')));
  await assertSucceeds(setDoc(doc(db, 'users/ana'), user('ana')));
  await assertFails(setDoc(doc(db, 'users/ana/profiles/p1/fulger/usor-1'), round));
  await assertFails(setDoc(doc(db, `${board('usor')}/ana_p1`), entry('ana')));
  await assertSucceeds(deleteDoc(doc(db, 'users/ana/profiles/p1'))); // ștergerea propriilor date rămâne permisă
});

test('reguli: clasamentul îl văd doar autentificații; o intrare e a contului, cu porecla profilului, într-un clasament al unei teme', async () => {
  await family('ana');
  await family('bob');
  const ana = as('ana');
  await assertFails(getDocs(collection(anon(), board('usor'))));
  await assertSucceeds(getDocs(collection(as('bob'), board('usor'))));
  await assertSucceeds(setDoc(doc(ana, `${board('usor')}/ana_p1`), entry('ana')));
  await assertSucceeds(setDoc(doc(ana, `${board('usor', '2026-W37')}/ana_p1`), entry('ana')));
  await assertFails(setDoc(doc(ana, `${board('expert')}/ana_p1`), entry('ana')));
  await assertFails(setDoc(doc(ana, 'leaderboards/fulger-usor-all/entries/ana_p1'), entry('ana'))); // clasament de dinainte de teme
  await assertFails(setDoc(doc(ana, 'leaderboards/fulger-inmultirea-usor-all/entries/ana_p1'), entry('ana'))); // temă „în curând”
  await assertFails(setDoc(doc(ana, 'leaderboards/fulger-total-all/entries/ana_p1'), total('ana'))); // super-totalul, rezervat
  await assertFails(setDoc(doc(ana, `${board('intermediar')}/bob_p1`), entry('bob'))); // în numele altuia
  await assertFails(setDoc(doc(ana, `${board('intermediar')}/ana_p1`), entry('ana', { nickname: 'Campionul' })));
  await assertFails(setDoc(doc(ana, `${board('avansat')}/ana_p1`), entry('ana', { score: 4000 })));
  await assertFails(setDoc(doc(ana, `${board('avansat')}/ana_p1`), entry('ana', { updatedAt: old })));
  await assertFails(setDoc(doc(ana, `${board('avansat')}/ana_p1`), entry('ana', { levels: 1 }))); // câmpul totalului pe un nivel
  await assertFails(setDoc(doc(ana, 'leaderboards/teste-stele/entries/ana_p1'), stars('ana', { correct: 1 })));
});

test('reguli: totalul temei are doar câmpurile lui, cel mult 9000 pe cel mult 3 niveluri; scorul doar crește, cel mult o dată la 90 s', async () => {
  await family('ana');
  const ana = as('ana');
  const all = doc(ana, `${board('total')}/ana_p1`);
  await assertFails(setDoc(all, total('ana', { score: 9001 })));
  await assertFails(setDoc(all, total('ana', { levels: 0 })));
  await assertFails(setDoc(all, total('ana', { levels: 4 })));
  await assertFails(setDoc(all, total('ana', { correct: 1 })));
  await assertSucceeds(setDoc(all, total('ana')));
  await assertFails(setDoc(all, total('ana', { score: 6000 }))); // prea curând
  await seed((db) => setDoc(doc(db, `${board('total', '2026-W37')}/ana_p1`), total('ana', { updatedAt: old })));
  const week = doc(ana, `${board('total', '2026-W37')}/ana_p1`);
  await assertFails(setDoc(week, total('ana', { score: 4000 })));
  await assertSucceeds(setDoc(week, total('ana', { score: 6000 })));
});

test('reguli: profilul ieșit din clasament nu mai scrie intrări', async () => {
  await family('ana');
  await seed((db) => updateDoc(doc(db, 'users/ana/profiles/p1'), { showOnBoards: false }));
  await assertFails(setDoc(doc(as('ana'), 'leaderboards/teste-stele/entries/ana_p1'), stars('ana')));
  await assertFails(setDoc(doc(as('ana'), `${board('total')}/ana_p1`), total('ana')));
});

test('reguli: la Calcul fulger scorul doar crește, cel mult o dată la 90 s; porecla nouă trece în același lot', async () => {
  await family('ana');
  await seed(async (db) => {
    await setDoc(doc(db, `${board('usor')}/ana_p1`), entry('ana', { updatedAt: old }));
    await setDoc(doc(db, `${board('usor', '2026-W37')}/ana_p1`), entry('ana', { updatedAt: Timestamp.now() }));
    await setDoc(doc(db, `${board('total', '2026-W37')}/ana_p1`), total('ana', { updatedAt: Timestamp.now() }));
  });
  const ana = as('ana');
  await assertFails(setDoc(doc(ana, `${board('usor')}/ana_p1`), entry('ana', { score: 40 })));
  await assertSucceeds(setDoc(doc(ana, `${board('usor')}/ana_p1`), entry('ana', { score: 60 })));
  await assertFails(setDoc(doc(ana, `${board('usor', '2026-W37')}/ana_p1`), entry('ana', { score: 70 }))); // prea curând
  const batch = writeBatch(ana);
  batch.update(doc(ana, 'users/ana/profiles/p1'), { nickname: 'Ana Maria' });
  batch.update(doc(ana, `${board('usor', '2026-W37')}/ana_p1`), { nickname: 'Ana Maria', updatedAt: serverTimestamp() });
  batch.update(doc(ana, `${board('total', '2026-W37')}/ana_p1`), { nickname: 'Ana Maria', updatedAt: serverTimestamp() });
  await assertSucceeds(batch.commit());
});

test('reguli: stelele de la teste pot și scădea, dar nu mai des de o dată la 5 s', async () => {
  await family('ana');
  await seed((db) => setDoc(doc(db, 'leaderboards/teste-stele/entries/ana_p1'), stars('ana', { updatedAt: old })));
  const ana = as('ana');
  await assertSucceeds(setDoc(doc(ana, 'leaderboards/teste-stele/entries/ana_p1'), stars('ana', { score: 3 })));
  await assertFails(setDoc(doc(ana, 'leaderboards/teste-stele/entries/ana_p1'), stars('ana', { score: 4 })));
});

test('reguli: adminul redenumește și șterge; fiecare își poate șterge doar intrările proprii', async () => {
  await family('ana');
  await family('bob');
  await seed(async (db) => {
    await setDoc(doc(db, 'admins/root'), {});
    await setDoc(doc(db, `${board('usor')}/ana_p1`), entry('ana', { updatedAt: old }));
    await setDoc(doc(db, `${board('usor')}/bob_p1`), entry('bob', { updatedAt: old }));
  });
  const root = as('root');
  await assertFails(deleteDoc(doc(as('ana'), `${board('usor')}/bob_p1`)));
  await assertSucceeds(deleteDoc(doc(as('ana'), `${board('usor')}/ana_p1`)));
  await assertFails(updateDoc(doc(as('ana'), `${board('usor')}/bob_p1`), { nickname: 'Hoțul' }));
  await assertSucceeds(updateDoc(doc(root, `${board('usor')}/bob_p1`), { nickname: 'Bob' }));
  await assertFails(updateDoc(doc(root, `${board('usor')}/bob_p1`), { score: 3000 }));
  await assertSucceeds(updateDoc(doc(root, 'users/bob/profiles/p1'), { nickname: 'Bob' }));
  await assertSucceeds(getDocs(collection(root, 'users/bob/profiles/p1/attempts')));
  await assertFails(getDocs(collection(as('ana'), 'users/bob/profiles/p1/attempts')));
  await assertSucceeds(deleteDoc(doc(root, `${board('usor')}/bob_p1`)));
  await assertSucceeds(deleteDoc(doc(root, 'users/bob/profiles/p1')));
});

test('reguli: o rundă urcă într-un lot: runda, starea, contorul, intrările temei cu totalul, curățarea celor vechi', async () => {
  await family('ana');
  await seed(async (db) => {
    await setDoc(doc(db, `${board('usor', '2026-W30')}/ana_p1`), entry('ana', { updatedAt: old }));
    await setDoc(doc(db, 'leaderboards/fulger-usor-all/entries/ana_p1'), entry('ana', { updatedAt: old })); // de dinainte de teme
  });
  const ana = as('ana');
  const batch = writeBatch(ana);
  batch.set(doc(ana, 'users/ana/profiles/p1/fulger/usor-1'), round);
  batch.set(doc(ana, 'users/ana/profiles/p1/state/fulger'), { best: { [`${TOPIC}:usor`]: { alune: 120, at: round.at, correct: 30, bestStreak: 12 } }, medals: {}, week: {} });
  batch.update(doc(ana, 'users/ana/profiles/p1'), { rounds: 1, boards: [`fulger-${TOPIC}-total-2026-W37`, `fulger-${TOPIC}-total-all`, `fulger-${TOPIC}-usor-2026-W37`, `fulger-${TOPIC}-usor-all`] });
  batch.set(doc(ana, `${board('usor')}/ana_p1`), entry('ana', { score: 120 }));
  batch.set(doc(ana, `${board('usor', '2026-W37')}/ana_p1`), entry('ana', { score: 120 }));
  batch.set(doc(ana, `${board('total')}/ana_p1`), total('ana', { score: 120, levels: 1 }));
  batch.set(doc(ana, `${board('total', '2026-W37')}/ana_p1`), total('ana', { score: 120, levels: 1 }));
  batch.delete(doc(ana, `${board('usor', '2026-W30')}/ana_p1`));
  batch.delete(doc(ana, 'leaderboards/fulger-usor-all/entries/ana_p1'));
  batch.delete(doc(ana, `${board('usor', '2026-W29')}/ana_p1`)); // nu mai există: ștergerea trece oricum
  await assertSucceeds(batch.commit());
  await assertFails(deleteDoc(doc(ana, `${board('usor', '2026-W29')}/bob_p1`)));
  await assertFails(deleteDoc(doc(anon(), `${board('usor', '2026-W29')}/ana_p1`)));
});

test('reguli: stelele se actualizează într-o tranzacție care doar citește profilul și starea (ca sync.js)', async () => {
  const { runTransaction } = await import('firebase/firestore');
  await family('ana');
  await seed(async (db) => {
    await updateDoc(doc(db, 'users/ana/profiles/p1'), { boards: ['teste-stele'] });
    await setDoc(doc(db, 'users/ana/profiles/p1/state/tests'), { best: { t1: 3, t2: 2 } });
    await setDoc(doc(db, 'leaderboards/teste-stele/entries/ana_p1'), stars('ana', { score: 3, tests: 1, updatedAt: old }));
  });
  const ana = as('ana');
  const update = (score) =>
    runTransaction(ana, async (tx) => {
      const p = await tx.get(doc(ana, 'users/ana/profiles/p1'));
      await tx.get(doc(ana, 'users/ana/profiles/p1/state/tests'));
      await tx.get(doc(ana, 'leaderboards/teste-stele/entries/ana_p1'));
      tx.set(doc(ana, 'leaderboards/teste-stele/entries/ana_p1'), stars('ana', { nickname: p.data().nickname, avatar: p.data().avatar, score, tests: 2 }));
    });
  await assertSucceeds(update(5));
  await assertFails(update(6)); // la mai puțin de 5 s de schimbarea precedentă: sync.js reîncearcă mai târziu
});
