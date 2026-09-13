import assert from 'node:assert/strict';
import { test } from 'node:test';

import { addAttempt, clearFulger, clearHistory, getAttempt, getFulger, isUnsaved, lastAttempt, listAttempts, listDrafts, saveDraft, saveFulgerRound, updateAttempt } from '../site/js/core/storage.js';
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

test('storage: calcul fulger păstrează recordul pe nivel, ultimele runde și medaliile', () => {
  globalThis.localStorage = fakeStorage();
  const empty = { best: {}, rounds: [], medals: {} };
  assert.deepEqual(getFulger(), empty);
  const round = (level, total, at) => ({ level, total, at });
  assert.deepEqual(saveFulgerRound(round('usor', 50, 't1'), { keep: 2, medals: ['prima-cursa'] }), { saved: true, record: true, previous: null });
  assert.deepEqual(saveFulgerRound(round('usor', 40, 't2'), { keep: 2, medals: ['prima-cursa'] }), { saved: true, record: false, previous: 50 });
  assert.deepEqual(saveFulgerRound(round('usor', 60, 't3'), { keep: 2 }), { saved: true, record: true, previous: 50 });
  assert.deepEqual(saveFulgerRound(round('avansat', 0, 't4'), { keep: 2 }), { saved: true, record: false, previous: null });
  const data = getFulger();
  assert.deepEqual(data.best, { usor: { alune: 60, at: 't3' } });
  assert.deepEqual(data.rounds.map((r) => r.at), ['t3', 't4']);
  assert.deepEqual(data.medals, { 'prima-cursa': 't1' }); // medalia păstrează data primei câștigări
  clearHistory(); // istoricul testelor nu atinge jocul
  assert.equal(getFulger().rounds.length, 2);
  clearFulger();
  assert.deepEqual(getFulger(), empty);

  globalThis.localStorage = fakeStorage({ full: true });
  assert.equal(saveFulgerRound(round('usor', 10, 't5')).saved, false);
  delete globalThis.localStorage;
});

test('ro: formatDateTime', () => {
  const s = formatDateTime('2026-09-12T14:05:00');
  assert.ok(s.includes('2026') && s.includes('14:05'), s);
  assert.equal(formatDateTime('nu-e-dată'), '');
});
