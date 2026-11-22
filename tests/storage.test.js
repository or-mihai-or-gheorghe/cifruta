import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  addAttempt, clearAccountCopies, clearFulger, clearHistory, clearScopeData, GAME_KEEP, getAttempt, getDraft, getFulger, getGames, getLessons, getScoped, isUnsaved,
  lastAttempt, listAttempts, listDrafts, mergeGames, mergeLessons, moveDrafts, moveGames, moveLessons, onWrite, readGames, readLessons, readScopeData, saveDraft,
  saveFulgerRound, saveGameRound, saveLessons, setScope, setScoped, updateAttempt, writeScopeData,
} from '../site/js/core/storage.js';
import { formatDateTime } from '../site/js/core/ro.js';

/** Un localStorage de test; cu `full: true` orice scriere aruncă (spațiu plin sau stocare blocată). */
function fakeStorage({ full = false } = {}) {
  const map = new Map();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      if (full) throw new Error('QuotaExceededError');
      map.set(k, String(v));
    },
    removeItem: (k) => map.delete(k),
    get length() {
      return map.size;
    },
    key: (i) => [...map.keys()][i] ?? null,
  };
}

test('storage: încercarea rămâne în memorie când stocarea nu scrie', () => {
  globalThis.localStorage = fakeStorage();
  assert.equal(addAttempt({ id: 'a1', testId: 't', score: 50 }), true);
  assert.equal(lastAttempt('t').id, 'a1');
  assert.ok(!isUnsaved(lastAttempt('t')));

  globalThis.localStorage = fakeStorage({ full: true });
  assert.equal(addAttempt({ id: 'a2', testId: 't', score: 80 }), false);
  assert.equal(lastAttempt('t').id, 'a2');
  assert.ok(isUnsaved(lastAttempt('t')));
  assert.equal(listAttempts('t').length, 1); // stocarea e goală, încercarea vine din memorie
  assert.equal(lastAttempt('altul'), null);
  updateAttempt('a2', { feeling: 'vesel' });
  assert.equal(getAttempt('a2').feeling, 'vesel');
  clearHistory(['t']);
  assert.equal(lastAttempt('t'), null);
  delete globalThis.localStorage;
});

test('storage: ciornele se listează și se șterg odată cu istoricul', () => {
  globalThis.localStorage = fakeStorage();
  saveDraft('t1', { testId: 't1', current: 2 });
  saveDraft('t2', { testId: 't2', current: 0 });
  assert.deepEqual(listDrafts().map((d) => d.testId).sort(), ['t1', 't2']);
  clearHistory(['t1']);
  assert.deepEqual(listDrafts().map((d) => d.testId), ['t2']);
  clearHistory();
  assert.deepEqual(listDrafts(), []);
  delete globalThis.localStorage;
});

test('storage: calcul fulger păstrează recordul pe temă și nivel, ultimele runde și medaliile', () => {
  globalThis.localStorage = fakeStorage();
  const empty = { best: {}, rounds: [], medals: {} };
  assert.deepEqual(getFulger(), empty);
  const round = (level, total, at) => ({ topic: 'adunari-scaderi-100', level, total, at });
  assert.deepEqual(saveFulgerRound(round('usor', 50, 't1'), { keep: 2, medals: ['bronz:adunari-scaderi-100'] }), { saved: true, record: true, previous: null });
  assert.deepEqual(saveFulgerRound(round('usor', 40, 't2'), { keep: 2, medals: ['bronz:adunari-scaderi-100'] }), { saved: true, record: false, previous: 50 });
  assert.deepEqual(saveFulgerRound(round('usor', 60, 't3'), { keep: 2 }), { saved: true, record: true, previous: 50 });
  assert.deepEqual(saveFulgerRound(round('avansat', 0, 't4'), { keep: 2 }), { saved: true, record: false, previous: null });
  const data = getFulger();
  assert.deepEqual(data.best, { 'adunari-scaderi-100:usor': { alune: 60, at: 't3' } });
  assert.deepEqual(data.rounds.map((r) => r.at), ['t3', 't4']);
  assert.deepEqual(data.medals, { 'bronz:adunari-scaderi-100': 't1' }); // medalia păstrează data primei câștigări
  clearHistory(); // istoricul testelor nu atinge jocul
  assert.equal(getFulger().rounds.length, 2);
  clearFulger();
  assert.deepEqual(getFulger(), empty);

  globalThis.localStorage = fakeStorage({ full: true });
  assert.equal(saveFulgerRound(round('usor', 10, 't5')).saved, false);
  delete globalThis.localStorage;
});

test('storage: rezultatele Calcul fulger de dinainte de teme se citesc în tema lor și se rescriu în forma nouă', () => {
  globalThis.localStorage = fakeStorage();
  localStorage.setItem('cifruta:fulger', JSON.stringify({ best: { usor: { alune: 77, at: 'v' } }, rounds: [{ level: 'usor', total: 77, at: 'v' }], medals: { 'prima-cursa': 'v' } }));
  const data = getFulger();
  assert.deepEqual(data.best, { 'adunari-scaderi-100:usor': { alune: 77, at: 'v' } });
  assert.equal(data.rounds[0].topic, 'adunari-scaderi-100');
  assert.deepEqual(data.medals, { 'prima-cursa': 'v' });
  // o rundă nouă din tema aceasta vede recordul vechi; o rundă fără temă (dintr-o filă veche) intră tot aici
  assert.deepEqual(saveFulgerRound({ topic: 'adunari-scaderi-100', level: 'usor', total: 70, at: 'w' }), { saved: true, record: false, previous: 77 });
  assert.deepEqual(saveFulgerRound({ level: 'usor', total: 90, at: 'x' }), { saved: true, record: true, previous: 77 });
  const raw = JSON.parse(localStorage.getItem('cifruta:fulger'));
  assert.deepEqual(Object.keys(raw.best), ['adunari-scaderi-100:usor']);
  assert.ok(raw.rounds.length === 3 && raw.rounds.every((r) => r.topic === 'adunari-scaderi-100'));
  delete globalThis.localStorage;
});

test('storage: fiecare profil are datele lui, iar scrierile se anunță', () => {
  globalThis.localStorage = fakeStorage();
  setScope(null);
  const events = [];
  const stop = onWrite((e) => events.push(e.type));
  const ana = { uid: 'u1', pid: 'p1' };
  addAttempt({ id: 'a1', testId: 't', score: 50 });
  saveDraft('t', { current: 1 });

  setScope(ana);
  assert.equal(listAttempts().length, 0);
  assert.equal(getDraft('t'), null);
  addAttempt({ id: 'b1', testId: 't', score: 70 });
  updateAttempt('b1', { feeling: 'vesel' });
  saveFulgerRound({ level: 'usor', total: 10, at: 'x' });
  setScoped('pending', [{ type: 'attempt', id: 'b1' }]);
  assert.equal(getFulger().best['adunari-scaderi-100:usor'].alune, 10);

  setScope(null);
  assert.deepEqual(listAttempts().map((a) => a.id), ['a1']);
  assert.equal(getFulger().rounds.length, 0);
  assert.equal(getScoped('pending'), null);
  assert.equal(readScopeData(ana).attempts[0].feeling, 'vesel');

  moveDrafts(null, ana); // ciornele fără cont intră în profil
  assert.equal(getDraft('t'), null);
  writeScopeData(ana, { attempts: [...readScopeData(ana).attempts, ...readScopeData(null).attempts], fulger: readScopeData(ana).fulger });
  clearScopeData(null);
  assert.equal(listAttempts().length, 0);
  setScope(ana);
  assert.equal(getDraft('t').current, 1);
  assert.deepEqual(listAttempts().map((a) => a.id), ['b1', 'a1']);
  clearFulger();

  setScope(null);
  clearAccountCopies('u1'); // la ieșirea din cont
  assert.equal(readScopeData(ana).attempts.length, 0);
  stop();
  addAttempt({ id: 'c1', testId: 't', score: 1 });
  assert.deepEqual(events, ['attempt', 'attempt', 'attempt', 'fulger-round', 'fulger-clear']);
  delete globalThis.localStorage;
});

test('storage: progresul din Învață e pe profil, se mută la prima intrare în cont și pleacă odată cu profilul', () => {
  globalThis.localStorage = fakeStorage();
  setScope(null);
  const events = [];
  const stop = onWrite((e) => events.push(e.type));
  const ana = { uid: 'u1', pid: 'p1' };
  saveLessons({ 'inmultirea/grupe-egale': { done: ['a', 'b'], at: '2026-11-20T10:00:00Z' }, 'inmultirea/sarituri': { done: ['x'], at: '2026-11-20T11:00:00Z' } });
  setScope(ana);
  assert.deepEqual(getLessons(), {});
  saveLessons({ 'inmultirea/grupe-egale': { done: ['c'], at: '2026-11-21T09:00:00Z' } });
  assert.equal(Object.keys(readLessons(null)).length, 2, 'fără cont: două lecții începute (pentru întrebarea despre mutare)');
  setScope(null);
  moveLessons(null, ana); // înainte de clearScopeData(null), ca în moveAnonymousInto
  clearScopeData(null);
  assert.deepEqual(getLessons(), {});
  setScope(ana);
  assert.deepEqual(getLessons(), {
    'inmultirea/grupe-egale': { done: ['c', 'a', 'b'], at: '2026-11-21T09:00:00Z' },
    'inmultirea/sarituri': { done: ['x'], at: '2026-11-20T11:00:00Z' },
  });
  clearScopeData(ana); // la ștergerea profilului
  assert.deepEqual(getLessons(), {});
  // datele stricate din browser se citesc tolerant
  localStorage.setItem('cifruta:p:u1:p1:invata', JSON.stringify({ a: { done: 'x' }, b: { done: ['ok', 3] }, c: null }));
  assert.deepEqual(getLessons(), { b: { done: ['ok'], at: '' } });
  assert.deepEqual(mergeLessons([], 'x'), {});
  setScope(null);
  stop();
  assert.deepEqual(events, [], 'progresul din Învață nu se anunță: nu urcă în cont');
  delete globalThis.localStorage;
});

test('storage: rundele jocurilor din Învață (tabla în 2 minute): recordul, ultimele runde, mutarea în profil, fără să urce în cont', () => {
  globalThis.localStorage = fakeStorage();
  setScope(null);
  const events = [];
  const stop = onWrite((e) => events.push(e.type));
  const key = 'inmultirea/tabla-in-2-minute';
  const round = (day, correct, wrong = 1) => ({ at: `2026-11-${String(day).padStart(2, '0')}T10:00:00Z`, correct, wrong, bestStreak: 3 });
  assert.deepEqual(saveGameRound(key, round(1, 0)), { saved: true, record: false, previous: null }, 'fără niciun corect nu e record');
  assert.deepEqual(saveGameRound(key, round(2, 12)), { saved: true, record: true, previous: null }, 'primul record');
  assert.deepEqual(saveGameRound(key, round(3, 9)), { saved: true, record: false, previous: 12 });
  assert.deepEqual(saveGameRound(key, round(4, 15)), { saved: true, record: true, previous: 12 }, 'record nou');
  assert.deepEqual(getGames()[key].best, { correct: 15, at: '2026-11-04T10:00:00Z' });
  for (let d = 5; d <= 30; d++) saveGameRound(key, round(d, 10));
  assert.equal(getGames()[key].rounds.length, GAME_KEEP, `se păstrează ultimele ${GAME_KEEP} runde`);
  assert.equal(getGames()[key].best.correct, 15, 'recordul rămâne și când runda lui iese din listă');
  // la primul profil: rundele fără cont se unesc cu cele ale profilului (recordul mai mare, fiecare rundă o dată), apoi pleacă
  const ana = { uid: 'u1', pid: 'p1' };
  setScope(ana);
  saveGameRound(key, round(30, 20));
  assert.equal(readGames(null)[key].rounds.length, GAME_KEEP, 'fără cont: rundele, pentru întrebarea despre mutare');
  setScope(null);
  moveGames(null, ana);
  clearScopeData(null);
  assert.deepEqual(getGames(), {});
  setScope(ana);
  const moved = getGames()[key];
  assert.equal(moved.best.correct, 20);
  assert.equal(moved.rounds.length, GAME_KEEP);
  assert.equal(new Set(moved.rounds.map((r) => r.at)).size, GAME_KEEP, 'runda din aceeași clipă apare o singură dată');
  assert.equal(moved.rounds.at(-1).correct, 20, 'la aceeași dată rămâne runda profilului');
  clearScopeData(ana); // la ștergerea profilului
  assert.deepEqual(getGames(), {});
  // datele stricate din browser se citesc tolerant; cheia nu se încurcă cu progresul lecțiilor (`invata`)
  localStorage.setItem('cifruta:p:u1:p1:invata-jocuri', JSON.stringify({ a: { best: { correct: -1 }, rounds: [{ at: 'x', correct: 2, wrong: 0 }, { correct: 'mult' }] }, b: null }));
  assert.deepEqual(getGames(), { a: { best: null, rounds: [{ at: 'x', correct: 2, wrong: 0, bestStreak: 0 }] } });
  assert.deepEqual(getLessons(), {});
  assert.deepEqual(mergeGames('x', [1]), {});
  setScope(null);
  stop();
  assert.deepEqual(events, [], 'rundele jocurilor din Învață nu se anunță: nu urcă în cont');
  delete globalThis.localStorage;
});

test('sesiunea contului se citește sincron și dă scopul profilului care joacă', async () => {
  globalThis.localStorage = fakeStorage();
  const { readSession, sessionProfile, writeSession } = await import('../site/js/cloud/session.js');
  assert.equal(readSession(), null);
  writeSession({ uid: 'u1', email: 'a@exemplu.ro', pid: 'p2', nickname: 'Ana', avatar: 'vulpe' });
  assert.deepEqual(sessionProfile(), { uid: 'u1', pid: 'p2' });
  writeSession({ uid: 'u1', pid: null });
  assert.equal(sessionProfile(), null); // în cont, dar fără profil ales: rezultatele rămân cele fără cont
  localStorage.setItem('cifruta:session', '{stricat');
  assert.equal(readSession(), null);
  writeSession(null);
  assert.equal(localStorage.getItem('cifruta:session'), null);
  delete globalThis.localStorage;
});

test('ro: formatDateTime', () => {
  const s = formatDateTime('2026-09-12T14:05:00');
  assert.ok(s.includes('2026') && s.includes('14:05'), s);
  assert.equal(formatDateTime('nu-e-dată'), '');
});
