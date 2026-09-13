import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import {
  AVATARS, bestRound, cleanNickname, combineData, dequeue, enqueue, entryId, freeProfileId, fromCloudAttempt, fulgerBoards, isoWeek,
  mergeAttempts, mergeFulger, mergeFulgerState, nicknameError, pruneBoards, QUEUE_MAX, roundId, sameData, signInError, testStars,
  toCloudAttempt, toCloudRound, rankEntries,
} from '../site/js/cloud/logic.js';
import { EMOJI } from '../site/js/visuals/emoji.js';

test('cloud: locurile din clasament împart locul la scor egal', () => {
  assert.deepEqual(rankEntries([{ score: 90 }, { score: 80 }, { score: 80 }, { score: 70 }]).map((e) => e.place), [1, 2, 2, 4]);
  assert.deepEqual(rankEntries([]), []);
});

test('cloud: porecla se curăță și se validează', () => {
  assert.equal(cleanNickname('  Veverița   Ana '), 'Veverița Ana');
  for (const ok of ['Ana', 'Ștefan-Ioan', "D'Artagnan 2", 'Mara M.']) assert.equal(nicknameError(ok), null, ok);
  assert.match(nicknameError('A'), /cel puțin 2/);
  assert.match(nicknameError('x'.repeat(21)), /cel mult 20/);
  assert.match(nicknameError('<b>Ana</b>'), /litere/);
});

test('cloud: săptămâna ISO se socotește după ora României', () => {
  assert.equal(isoWeek(new Date('2026-09-13T12:00:00Z')), '2026-W37'); // duminică
  assert.equal(isoWeek(new Date('2026-09-13T21:30:00Z')), '2026-W38'); // luni, 00:30 în România
  assert.equal(isoWeek(new Date('2026-12-31T12:00:00Z')), '2026-W53');
  assert.equal(isoWeek(new Date('2027-01-01T12:00:00Z')), '2026-W53'); // vineri: săptămâna anului trecut
  assert.equal(isoWeek(new Date('2027-01-04T12:00:00Z')), '2027-W01');
  assert.deepEqual(fulgerBoards('usor', new Date('2026-09-13T12:00:00Z')), ['fulger-usor-all', 'fulger-usor-2026-W37']);
  assert.equal(entryId('abc', 'p2'), 'abc_p2');
});

test('cloud: un profil își păstrează intrările din ultimele două săptămâni ale fiecărui nivel', () => {
  const { keep, dropped } = pruneBoards(['fulger-usor-2026-W30', 'fulger-usor-all', 'teste-stele', 'fulger-usor-2026-W37', 'fulger-usor-2026-W36', 'fulger-avansat-2026-W30', 'fulger-usor-all']);
  assert.deepEqual(dropped, ['fulger-usor-2026-W30']);
  assert.deepEqual(keep, ['fulger-avansat-2026-W30', 'fulger-usor-2026-W36', 'fulger-usor-2026-W37', 'fulger-usor-all', 'teste-stele']);
});

test('cloud: stelele de la teste iau cea mai bună încercare a fiecărui test', () => {
  const attempt = (testId, stars) => ({ testId, levels: { usor: { star: stars > 0 }, intermediar: { star: stars > 1 }, avansat: { star: stars > 2 } } });
  assert.deepEqual(testStars([]), { stars: 0, tests: 0 });
  assert.deepEqual(testStars([attempt('t1', 1), attempt('t1', 3), attempt('t2', 2), attempt('t1', 0)]), { stars: 5, tests: 2 });
});

test('cloud: starea Calcul fulger de pe două dispozitive se îmbină', () => {
  const a = { best: { usor: { alune: 50, at: 'a' }, avansat: { alune: 10, at: 'b' } }, medals: { 'prima-cursa': '2026-09-01', fulgerul: '2026-09-05' } };
  const b = { best: { usor: { alune: 40, at: 'c' }, intermediar: { alune: 70, at: 'd' } }, medals: { 'prima-cursa': '2026-08-30', 'in-flacari': '2026-09-02' } };
  assert.deepEqual(mergeFulgerState(a, b), {
    best: { usor: { alune: 50, at: 'a' }, avansat: { alune: 10, at: 'b' }, intermediar: { alune: 70, at: 'd' } },
    medals: { 'prima-cursa': '2026-08-30', fulgerul: '2026-09-05', 'in-flacari': '2026-09-02' },
  });
  assert.deepEqual(mergeFulgerState(), { best: {}, medals: {} });
});

test('cloud: aducerea încercărilor păstrează ce n-a urcat și respectă ștergerile din coadă', () => {
  const a = (id, testId, submittedAt, extra = {}) => ({ id, testId, submittedAt, score: 50, ...extra });
  const cloud = [a('c1', 't1', '2026-09-01'), a('c2', 't2', '2026-09-03'), a('shared', 't1', '2026-09-02', { feeling: null })];
  const local = [a('shared', 't1', '2026-09-02', { feeling: 'vesel' }), a('gone', 't2', '2026-08-30'), a('new', 't3', '2026-09-04')];
  let pending = enqueue([], { type: 'attempt', id: 'new' });
  assert.deepEqual(mergeAttempts(local, cloud, pending).map((x) => x.id), ['c1', 'shared', 'c2', 'new']); // „gone” s-a șters în altă parte
  assert.equal(mergeAttempts(local, cloud, pending).find((x) => x.id === 'shared').feeling, null);
  pending = enqueue(pending, { type: 'attempt', id: 'shared' });
  assert.equal(mergeAttempts(local, cloud, pending).find((x) => x.id === 'shared').feeling, 'vesel');
  pending = enqueue(pending, { type: 'clear-attempts', id: 't1', testIds: ['t1'] });
  assert.deepEqual(mergeAttempts(local, cloud, pending).map((x) => x.id), ['shared', 'c2', 'new']);
  assert.deepEqual(mergeAttempts([], cloud, enqueue([], { type: 'clear-attempts', id: '*', testIds: null })), []);
});

test('cloud: aducerea rundelor păstrează rundele din coadă, iar ștergerea din coadă ignoră cloudul', () => {
  const r = (at, total) => ({ level: 'usor', at, total });
  const first = r('2026-09-01T10:00:00.000Z', 50);
  const cloud = { rounds: [{ ...first, id: roundId(first) }], best: { usor: { alune: 50, at: 'x' } }, medals: { m1: '2026-09-01' } };
  const local = { rounds: [first, r('2026-09-05T10:00:00.000Z', 80)], best: { usor: { alune: 80, at: 'y' } }, medals: { m2: '2026-09-05' } };
  assert.deepEqual(mergeFulger(local, cloud, []), cloud); // fără coadă, cloudul are dreptate
  const merged = mergeFulger(local, cloud, enqueue([], { type: 'round', id: roundId(local.rounds[1]) }));
  assert.deepEqual(merged.rounds.map((x) => x.total), [50, 80]);
  assert.equal(merged.best.usor.alune, 80);
  assert.deepEqual(Object.keys(merged.medals).sort(), ['m1', 'm2']);
  assert.deepEqual(mergeFulger(local, cloud, enqueue([], { type: 'clear-fulger' })), { best: local.best, rounds: [], medals: local.medals });
});

test('cloud: rezultatele fără cont intră într-un profil fără dubluri', () => {
  const round = (day, total) => ({ level: 'usor', at: `2026-09-0${day}T00:00:00Z`, total });
  const target = { attempts: [{ id: 'a1', submittedAt: '2' }], fulger: { rounds: [round(2, 5)], best: { usor: { alune: 5, at: 'b' } }, medals: {} } };
  const extra = { attempts: [{ id: 'a0', submittedAt: '1' }, { id: 'a1', submittedAt: '2', stale: true }], fulger: { rounds: [round(1, 9), round(2, 5)], best: { usor: { alune: 9, at: 'a' } }, medals: { m: 'a' } } };
  const out = combineData(target, extra);
  assert.deepEqual(out.attempts.map((a) => a.id), ['a0', 'a1']);
  assert.equal(out.attempts[1].stale, undefined);
  assert.deepEqual(out.fulger.rounds.map((r) => r.total), [9, 5]);
  assert.equal(out.fulger.best.usor.alune, 9);
  assert.deepEqual(out.fulger.medals, { m: 'a' });
});

test('cloud: încercările și rundele pentru Firestore păstrează doar cheile permise', () => {
  const attempt = { id: 'recap-c1-t1-1', testId: 'recap-c1-t1', score: 90, answers: { e1: { a: [['x', 'y']] } }, extra: 'nu', feeling: null };
  const cloud = toCloudAttempt(attempt);
  assert.equal(typeof cloud.answers, 'string'); // Firestore nu acceptă liste în liste
  assert.equal('extra' in cloud, false);
  assert.deepEqual(fromCloudAttempt(cloud).answers, attempt.answers);
  assert.deepEqual(fromCloudAttempt({ ...cloud, answers: '{stricat' }).answers, {});
  const round = toCloudRound({ id: 'usor-1', level: 'usor', at: 'x', total: 5, byKind: {}, mistakes: [] });
  assert.deepEqual(Object.keys(round).sort(), ['at', 'byKind', 'id', 'level', 'total']);
  assert.equal(toCloudRound({ level: 'avansat', at: '2026-09-13T10:00:00.000Z', total: 1 }).id, `avansat-${Date.parse('2026-09-13T10:00:00.000Z')}`);
});

test('cloud: mesajele de intrare, date egale în altă ordine, cea mai bună rundă', () => {
  assert.equal(signInError('auth/popup-closed-by-user'), null);
  assert.match(signInError('auth/popup-blocked'), /din nou/);
  assert.match(signInError('ceva/nou'), /Încearcă din nou/);
  assert.ok(sameData({ a: 1, b: { c: [1, { d: 2, e: 3 }] } }, { b: { c: [1, { e: 3, d: 2 }] }, a: 1 }));
  assert.ok(!sameData({ a: [1, 2] }, { a: [2, 1] }));
  assert.equal(roundId({ id: 'x', level: 'usor', at: 'y' }), 'x');
  assert.equal(bestRound([{ total: 5 }, { total: 9, n: 1 }, { total: 9, n: 2 }]).n, 1);
  assert.equal(bestRound([]), null);
});

test('cloud: profilurile libere și coada operațiilor în așteptare', () => {
  assert.equal(freeProfileId([]), 'p1');
  assert.equal(freeProfileId([{ id: 'p1' }, { id: 'p3' }]), 'p2');
  assert.equal(freeProfileId(['p1', 'p2', 'p3', 'p4', 'p5', 'p6'].map((id) => ({ id }))), null);
  let q = enqueue([], { type: 'attempt', id: 'a1' });
  q = enqueue(q, { type: 'clear-fulger' });
  q = enqueue(q, { type: 'attempt', id: 'a1' }); // pusă din nou: trece la coadă, cu număr nou
  assert.deepEqual(q.map((op) => [op.type, op.seq]), [['clear-fulger', 2], ['attempt', 3]]);
  const sent = q[1];
  const again = enqueue(q, { type: 'attempt', id: 'a1' }); // schimbată cât se trimitea
  assert.equal(dequeue(again, sent).length, 2); // rămâne pentru următoarea trimitere
  assert.deepEqual(dequeue(q, sent).map((op) => op.type), ['clear-fulger']);
  for (let i = 0; i < QUEUE_MAX + 5; i++) q = enqueue(q, { type: 'attempt', id: `x${i}` });
  assert.equal(q.length, QUEUE_MAX);
  assert.equal(q.at(-1).id, `x${QUEUE_MAX + 4}`);
});

test('cloud: avatarele există în bancă, iar regulile folosesc aceleași avatare și profiluri', () => {
  const rules = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
  for (const avatar of AVATARS) {
    assert.ok(EMOJI[avatar], `emoji lipsă: ${avatar}`);
    assert.ok(rules.includes(`'${avatar}'`), `avatar lipsă din reguli: ${avatar}`);
  }
  assert.ok(rules.includes("'^p[1-6]$'"));
});

test('cloud: stelele pe teste și recordurile săptămânii vin din starea completă, nu din ultimele runde', async () => {
  const { fulgerCandidates, starsTotal, withAttemptStars, withWeekBest } = await import('../site/js/cloud/logic.js');
  const attempt = (testId, stars) => ({ testId, levels: { usor: { star: stars > 0 }, intermediar: { star: stars > 1 }, avansat: { star: stars > 2 } } });
  let best = withAttemptStars({}, attempt('t1', 3));
  best = withAttemptStars(best, attempt('t2', 3)); // alt test, de pe alt dispozitiv
  assert.equal(withAttemptStars(best, attempt('t1', 1)), null); // o încercare mai slabă nu schimbă nimic
  assert.deepEqual(starsTotal(best), { stars: 6, tests: 2 });
  assert.deepEqual(starsTotal(withAttemptStars(best, attempt('t3', 0))), { stars: 6, tests: 3 });

  const r = (day, total) => ({ level: 'usor', at: `2026-09-${day}T10:00:00.000Z`, total, correct: total / 10, bestStreak: 5 });
  let week = withWeekBest({}, r(14, 100)); // luni: 2026-W38
  assert.equal(week.usor.id, '2026-W38');
  assert.equal(withWeekBest(week, r(15, 90)), null);
  week = withWeekBest(week, r(16, 150));
  assert.equal(week.usor.alune, 150);
  assert.equal(withWeekBest(week, r(10, 500)), null); // o rundă întârziată din săptămâna trecută nu înlocuiește săptămâna curentă
  assert.equal(withWeekBest(week, r(21, 20)).usor.alune, 20); // săptămână nouă

  const state = { best: { usor: { alune: 500, correct: 60, bestStreak: 30 } }, week };
  assert.deepEqual(fulgerCandidates('usor', state, [r(16, 100)], '2026-W38'), [
    ['fulger-usor-all', { score: 500, correct: 60, bestStreak: 30 }], // recordul, deși runda lui nu mai e în browser
    ['fulger-usor-2026-W38', { score: 150, correct: 15, bestStreak: 5 }],
  ]);
  assert.deepEqual(fulgerCandidates('usor', { best: {} }, [r(21, 40)], '2026-W39'), [['fulger-usor-2026-W39', { score: 40, correct: 4, bestStreak: 5 }]]);
  assert.deepEqual(fulgerCandidates('avansat', state, [r(16, 100)], '2026-W38'), []);
});

test('cloud: scrierile unui profil intră în coadă înainte ca sincronizarea să pornească', async () => {
  const map = new Map();
  globalThis.localStorage = { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k), get length() { return map.size; }, key: (i) => [...map.keys()][i] ?? null };
  const storage = await import('../site/js/core/storage.js');
  await import('../site/js/cloud/sync.js');
  storage.setScope(null);
  storage.addAttempt({ id: 'anon-1', testId: 't1', score: 50 });
  assert.equal(storage.getScoped('pending'), null); // fără cont nu se înregistrează nimic
  storage.setScope({ uid: 'u1', pid: 'p1' });
  assert.deepEqual(storage.currentProfile(), { uid: 'u1', pid: 'p1' });
  storage.addAttempt({ id: 'a1', testId: 't1', score: 80 });
  storage.saveFulgerRound({ level: 'usor', at: '2026-09-13T10:00:00.000Z', total: 50, correct: 10, wrong: 0, bestStreak: 10, fast: 2, stars: 1, byKind: {} });
  assert.deepEqual(storage.getScoped('pending').map((op) => op.type), ['attempt', 'stars', 'round', 'board']);
  assert.deepEqual(storage.getFulger().best.usor, { alune: 50, at: '2026-09-13T10:00:00.000Z', correct: 10, bestStreak: 10 });
  storage.setScope(null);
  delete globalThis.localStorage;
});
