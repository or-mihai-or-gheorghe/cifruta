import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  addAttempt, clearAccountCopies, clearFulger, clearHistory, clearScopeData, getAttempt, getDraft, getFulger, getScoped, isUnsaved, lastAttempt,
  listAttempts, listDrafts, moveDrafts, onWrite, readScopeData, saveDraft, saveFulgerRound, setScope, setScoped, updateAttempt, writeScopeData,
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
