// Cifruța în cloud: logica pură (fără Firebase și fără DOM), testată în Node (tests/cloud.test.js).
// Aceleași limite apar și în firestore.rules: poreclă, avatare, profiluri, id-urile clasamentelor.

import { LEGACY_TOPIC, LEVEL_IDS, recordKey } from '../fulger/records.js';

export const AVATARS = ['veverita', 'iepure', 'vulpe', 'urs', 'arici', 'pisica', 'caine', 'rata', 'lup', 'cal', 'oaie', 'gaina'];
export const PROFILE_IDS = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];
export const LEVELS = LEVEL_IDS;
export const TESTS_BOARD = 'teste-stele';
export const QUEUE_MAX = 200;
export const FULGER_MAX = 3000; // scorul maxim al unei intrări pe nivel; totalul unei teme are cel mult 3 × FULGER_MAX

const NICKNAME = /^[\p{L}\p{N} .'-]{2,20}$/u;

/** Porecla curățată: NFC, spații simple, fără spații la margini. */
export const cleanNickname = (s) => String(s ?? '').normalize('NFC').replace(/\s+/g, ' ').trim();

/** Mesajul de eroare pentru o poreclă sau null dacă e bună. */
export function nicknameError(s) {
  const name = cleanNickname(s);
  if (name.length < 2) return 'Porecla are cel puțin 2 litere.';
  if (name.length > 20) return 'Porecla are cel mult 20 de caractere.';
  if (!NICKNAME.test(name)) return 'Porecla poate avea litere, cifre, spații, punct, cratimă și apostrof.';
  return null;
}

/** Primul id de profil liber (p1…p6) sau null când sunt 6. */
export const freeProfileId = (profiles) => PROFILE_IDS.find((id) => !profiles.some((p) => p.id === id)) ?? null;

/** Mesajul pentru o intrare în cont nereușită; null când părintele a închis singur fereastra. */
export function signInError(code) {
  switch (code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
    case 'auth/user-cancelled':
      return null;
    case 'auth/popup-blocked':
      return 'Browserul a oprit fereastra Google. Apasă din nou pe buton.';
    case 'auth/network-request-failed':
      return 'Nu mă pot conecta la Google. Verifică internetul și încearcă din nou.';
    case 'auth/unauthorized-domain':
      return 'Acest site nu e încă autorizat pentru conturi Google.';
    case 'auth/operation-not-supported-in-this-environment':
    case 'auth/web-storage-unsupported':
      return 'Browserul nu permite intrarea în cont (de exemplu, în modul privat). Încearcă alt browser.';
    default:
      return 'Nu am putut intra în cont. Încearcă din nou.';
  }
}

/** Săptămâna ISO a unei date, după ora României: „2026-W37”. */
export function isoWeek(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Bucharest', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const part = (type) => Number(parts.find((p) => p.type === type).value);
  const d = new Date(Date.UTC(part('year'), part('month') - 1, part('day')));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7)); // joia săptămânii hotărăște anul
  const year = d.getUTCFullYear();
  const week = Math.ceil(((d - Date.UTC(year, 0, 1)) / 86400000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

/**
 * Id-ul unui clasament Jocuri fulger: `fulger-<temă>-<usor|intermediar|avansat|total>-<all|AAAA-Wss>`.
 * `fulger-total-<perioadă>` (fără temă) rămâne rezervat pentru super-totalul pe toate temele.
 */
export const fulgerBoard = (topic, scope, period) => `fulger-${topic}-${scope}-${period}`;

export const entryId = (uid, pid) => `${uid}_${pid}`;

/** Locurile dintr-un clasament ordonat descrescător: la scor egal, același loc (1, 2, 2, 4). */
export function rankEntries(entries) {
  let place = 0;
  return entries.map((e, i) => {
    if (i === 0 || e.score !== entries[i - 1].score) place = i + 1;
    return { ...e, place };
  });
}

const RETIRED = /^fulger-(usor|intermediar|avansat)-(all|\d{4}-W\d{2})$/; // clasamentele de dinainte de teme (v0.9)

/** Un clasament Jocuri fulger de dinainte de teme, care nu se mai scrie: intrarea lui se mută în tema veche, apoi se șterge. */
export const isRetiredBoard = (board) => RETIRED.test(board);

/**
 * Lista clasamentelor unui profil: rămân toate, și săptămânile trecute (rezultatele sunt persistente); ies doar clasamentele de
 * dinainte de teme, după ce `withRetired` le-a mutat scorul. `dropped` = intrările de șters.
 */
export function pruneBoards(boards) {
  const all = [...new Set(boards)].sort();
  return { keep: all.filter((b) => !isRetiredBoard(b)), dropped: all.filter(isRetiredBoard) };
}

/**
 * Clasamentele în care se vede acum intrarea unui profil: stelele de la teste, „tot timpul” și săptămâna curentă. Săptămânile trecute
 * nu se afișează, iar cele de dinainte de teme nu se mai scriu: o schimbare doar de avatar le lasă cum sunt.
 */
export const shownBoards = (boards, weekId = isoWeek()) =>
  boards.filter((b) => !isRetiredBoard(b) && (b === TESTS_BOARD || b.endsWith('-all') || b.endsWith(`-${weekId}`)));

/**
 * Intrările din clasamentele de dinainte de teme (`[[clasament, date]]`), mutate în clasamentele temei vechi, pe același nivel și
 * aceeași perioadă; dacă acel clasament e deja printre `wanted`, rămâne scorul mai mare.
 */
export function withRetired(wanted, retired) {
  const out = new Map(wanted);
  for (const [board, data] of retired) {
    const m = board.match(RETIRED);
    if (!m || !(data?.score > 0)) continue;
    const target = fulgerBoard(LEGACY_TOPIC, m[1], m[2]);
    const carried = capEntry(data);
    if (!(out.get(target)?.score >= carried.score)) out.set(target, carried);
  }
  return [...out];
}

/** Stelele de la teste: pentru fiecare test, cea mai bună încercare (0–3 stele), adunate. */
export function testStars(attempts) {
  const best = new Map();
  for (const a of attempts) {
    const stars = Object.values(a.levels ?? {}).filter((l) => l?.star).length;
    best.set(a.testId, Math.max(best.get(a.testId) ?? 0, stars));
  }
  return { stars: [...best.values()].reduce((sum, n) => sum + n, 0), tests: best.size };
}

/** Id-ul unei runde: cel din cloud sau, pentru o rundă din browser, nivelul și momentul (același pe orice dispozitiv). */
export const roundId = (round) => round.id ?? `${round.level}-${Date.parse(round.at) || 0}`;

/** Runda cu cele mai multe alune (la egalitate, prima); null pentru o listă goală. */
export const bestRound = (rounds) => rounds.reduce((best, r) => (!best || r.total > best.total ? r : best), null);

/** Starea Jocuri fulger de pe două dispozitive: recordul cel mai mare pe cheie și medaliile de oriunde, cu prima dată. */
export function mergeFulgerState(a = {}, b = {}) {
  const best = { ...(a.best ?? {}) };
  for (const [key, v] of Object.entries(b.best ?? {})) {
    if (!best[key] || (v?.alune ?? 0) > (best[key].alune ?? 0)) best[key] = v;
  }
  const medals = { ...(a.medals ?? {}) };
  for (const [id, at] of Object.entries(b.medals ?? {})) {
    if (!medals[id] || String(at) < String(medals[id])) medals[id] = at;
  }
  return { best, medals };
}

const bySubmitted = (a, b) => String(a.submittedAt ?? '').localeCompare(String(b.submittedAt ?? ''));
const byAt = (a, b) => String(a.at ?? '').localeCompare(String(b.at ?? ''));

/**
 * Încercările după aducerea din cloud. Cloudul e sursa: o încercare locală rămâne doar dacă așteaptă în coadă (n-a urcat încă),
 * iar o ștergere din coadă ascunde și copiile din cloud ale testelor ei (se șterg acolo când urcă).
 */
export function mergeAttempts(local, cloud, pending = []) {
  const clears = pending.filter((op) => op.type === 'clear-attempts');
  const cleared = (a) => clears.some((op) => !op.testIds || op.testIds.includes(a.testId));
  const waiting = new Set(pending.filter((op) => op.type === 'attempt').map((op) => op.id));
  const byId = new Map(cloud.filter((a) => !cleared(a)).map((a) => [a.id, a]));
  for (const a of local) if (waiting.has(a.id)) byId.set(a.id, a);
  return [...byId.values()].sort(bySubmitted);
}

/**
 * Jocuri fulger după aducerea din cloud (ambele părți deja normalizate): rundele din cloud și cele din coadă; recordurile și medaliile
 * locale contează doar dacă n-au urcat.
 */
export function mergeFulger(local, cloud, pending = [], keep = 30) {
  const cleared = pending.some((op) => op.type === 'clear-fulger');
  const waiting = new Set(pending.filter((op) => op.type === 'round').map((op) => op.id));
  const base = cleared ? { rounds: [], best: {}, medals: {} } : { rounds: cloud.rounds ?? [], best: cloud.best ?? {}, medals: cloud.medals ?? {} };
  const byId = new Map(base.rounds.map((r) => [roundId(r), r]));
  for (const r of local.rounds) if (waiting.has(roundId(r))) byId.set(roundId(r), r);
  const { best, medals } = waiting.size || cleared ? mergeFulgerState(base, local) : base;
  return { best, rounds: [...byId.values()].sort(byAt).slice(-keep), medals };
}

/** Rezultatele din browser (fără cont) adăugate într-un profil: fără dubluri, cu recordurile și medaliile îmbinate. */
export function combineData(target, extra, keep = 30) {
  const attempts = new Map([...extra.attempts, ...target.attempts].map((a) => [a.id, a]));
  const rounds = new Map([...extra.fulger.rounds, ...target.fulger.rounds].map((r) => [roundId(r), r]));
  return {
    attempts: [...attempts.values()].sort(bySubmitted),
    fulger: { ...mergeFulgerState(target.fulger, extra.fulger), rounds: [...rounds.values()].sort(byAt).slice(-keep) },
  };
}

const stable = (value) =>
  JSON.stringify(value, (_, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) : v));

/** Aceleași date, indiferent de ordinea cheilor (Firestore nu păstrează ordinea). */
export const sameData = (a, b) => stable(a) === stable(b);

const ATTEMPT_KEYS = ['id', 'testId', 'testVersion', 'seed', 'startedAt', 'submittedAt', 'activeMs', 'msByExercise', 'score', 'grade',
  'earnedPoints', 'totalPoints', 'levels', 'concepts', 'exercises', 'feeling', 'secondChance'];
const ROUND_KEYS = ['id', 'topic', 'level', 'at', 'total', 'correct', 'wrong', 'bestStreak', 'fast', 'stars', 'byKind'];

const pick = (obj, keys) => Object.fromEntries(keys.filter((k) => obj[k] !== undefined).map((k) => [k, obj[k]]));

/** Încercarea pentru Firestore: doar cheile permise; răspunsurile ca text JSON (Firestore nu acceptă liste în liste). */
export const toCloudAttempt = (attempt) => ({ ...pick(attempt, ATTEMPT_KEYS), answers: JSON.stringify(attempt.answers ?? {}) });

export function fromCloudAttempt(doc) {
  let answers = {};
  try {
    answers = JSON.parse(doc.answers ?? '{}');
  } catch {
    /* un text stricat nu strică istoricul: răspunsurile lipsesc doar la revizuire */
  }
  return { ...doc, answers };
}

export const toCloudRound = (round) => ({ ...pick(round, ROUND_KEYS), id: roundId(round) });

const opKey = (op) => `${op.type}:${op.id ?? ''}`;

/** Coada operațiilor care n-au ajuns în cloud: una pe cheie (cea nouă trece la coadă), cel mult QUEUE_MAX, cu număr de ordine. */
export function enqueue(queue, op) {
  const seq = queue.reduce((max, q) => Math.max(max, q.seq ?? 0), 0) + 1;
  return [...queue.filter((q) => opKey(q) !== opKey(op)), { ...op, seq }].slice(-QUEUE_MAX);
}

/** Scoate operația făcută; dacă a fost pusă din nou între timp (alt `seq`), rămâne pentru următoarea trimitere. */
export const dequeue = (queue, op) => queue.filter((q) => !(opKey(q) === opKey(op) && (op.seq === undefined || q.seq === op.seq)));

// ——— ce se publică în clasamente, din starea completă a profilului (cloud), nu doar din ce e în browser ———

/** Stelele unei încercări: câte niveluri au stea (0–3). */
export const attemptStars = (attempt) => Object.values(attempt.levels ?? {}).filter((l) => l?.star).length;

/** Totalul din state/tests (cele mai multe stele pe fiecare test): { stars, tests }. */
export const starsTotal = (best = {}) => ({ stars: Object.values(best).reduce((sum, n) => sum + (Number(n) || 0), 0), tests: Object.keys(best).length });

/** state/tests după o încercare urcată: testul își păstrează cele mai multe stele; null dacă nu se schimbă nimic. */
export function withAttemptStars(best = {}, attempt) {
  const stars = attemptStars(attempt);
  if ((best[attempt.testId] ?? -1) >= stars) return null;
  return { ...best, [attempt.testId]: stars };
}

/** Cea mai bună rundă a săptămânii pe fiecare temă și nivel (state/fulger.week, cheie „temă:nivel”), după o rundă urcată; null dacă nu se schimbă. */
export function withWeekBest(week = {}, round) {
  const id = isoWeek(new Date(round.at));
  const key = recordKey(round.topic ?? LEGACY_TOPIC, round.level);
  const prev = week[key];
  if (prev && (prev.id > id || (prev.id === id && prev.alune >= round.total))) return null;
  return { ...week, [key]: { id, alune: round.total, correct: round.correct ?? 0, bestStreak: round.bestStreak ?? 0, at: round.at } };
}

const capEntry = (e) => ({ score: Math.min(e.score, FULGER_MAX), correct: Math.min(e.correct ?? 0, 500), bestStreak: Math.min(e.bestStreak ?? 0, 500) });

/**
 * Intrările Jocuri fulger ale unei teme, din starea normalizată (chei „temă:nivel”):
 * - pe fiecare nivel, „tot timpul” din recordul permanent (state.best) și săptămâna curentă din state.week sau din rundele din browser
 *   ale săptămânii (cea mai mare dintre ele): { score, correct, bestStreak };
 * - totalul temei pe fiecare perioadă, suma intrărilor pe niveluri: { score, levels }.
 * Doar scoruri pozitive: [[board, payload], …].
 */
export function fulgerCandidates(topic, { best = {}, week = {} } = {}, rounds = [], weekId = isoWeek()) {
  const out = [];
  const totals = { all: { score: 0, levels: 0 }, [weekId]: { score: 0, levels: 0 } };
  const add = (level, period, entry) => {
    const payload = capEntry(entry);
    out.push([fulgerBoard(topic, level, period), payload]);
    totals[period].score += payload.score;
    totals[period].levels++;
  };
  for (const level of LEVEL_IDS) {
    const key = recordKey(topic, level);
    const ofLevel = rounds.filter((r) => (r.topic ?? LEGACY_TOPIC) === topic && r.level === level && r.total > 0);
    const record = best[key];
    if (record?.alune > 0) {
      // recordurile din v0.9.0 au doar { alune, at }: răspunsurile corecte și seria vin din runda recordului, dacă e în browser
      const same = ofLevel.find((r) => r.total === record.alune);
      add(level, 'all', { score: record.alune, correct: record.correct ?? same?.correct, bestStreak: record.bestStreak ?? same?.bestStreak });
    }
    const local = bestRound(ofLevel.filter((r) => isoWeek(new Date(r.at)) === weekId));
    const saved = week[key]?.id === weekId ? week[key] : null;
    const options = [saved && { score: saved.alune, correct: saved.correct, bestStreak: saved.bestStreak }, local && { score: local.total, correct: local.correct, bestStreak: local.bestStreak }];
    const top = options.filter(Boolean).reduce((a, b) => (!a || b.score > a.score ? b : a), null);
    if (top?.score > 0) add(level, weekId, top);
  }
  for (const [period, total] of Object.entries(totals)) if (total.levels) out.push([fulgerBoard(topic, 'total', period), total]);
  return out;
}
