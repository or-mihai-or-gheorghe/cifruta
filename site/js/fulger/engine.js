// Calcul fulger: motorul unei runde (pur, fără DOM). Alege întrebările după amestecul nivelului, verifică răspunsurile și
// socotește alunele (viteză doar în serie × serie), pauzele după greșeli, bonusul de precizie, stelele și medaliile.
// Interfața (js/fulger/view.js) și simularea din tests/fulger.test.js folosesc aceleași funcții.

import config from '../../data/fulger.js';
import { newSeed, seededRandom } from '../core/rng.js';
import { KINDS } from './kinds.js';

export const levelConfig = (id) => config.levels.find((l) => l.id === id) ?? null;

export const isCorrect = (q, given) =>
  q.mode === 'sort'
    ? Array.isArray(given) && given.length === q.answer.length && given.every((v, i) => v === q.answer[i])
    : given === q.answer;

/** Treapta seriei atinse, cu răspunsul curent inclus: { from, mult, label, turbo } sau null. */
export const streakTier = (streak) => config.streak.filter((t) => streak >= t.from).at(-1) ?? null;

export const TURBO_FROM = config.streak.find((t) => t.turbo)?.from ?? Infinity;

/** Treapta de viteză ({ id, upTo, mult, label } sau null); contează doar când răspunsul continuă o serie. */
export function speedTier(kind, ms, streak) {
  if (streak < 2) return null;
  return config.speed.find((s) => ms <= KINDS[kind].fastMs * s.upTo) ?? null;
}

/** Alunele unui răspuns corect, cu defalcarea pentru rezultate. `streak` include răspunsul curent. */
export function scoreAnswer({ kind, ms, streak }) {
  const base = KINDS[kind].points;
  const speed = speedTier(kind, ms, streak);
  const withSpeed = Math.round(base * (speed?.mult ?? 1));
  const alune = Math.round(base * (speed?.mult ?? 1) * (streakTier(streak)?.mult ?? 1));
  return { alune, base, speedExtra: withSpeed - base, streakExtra: alune - withSpeed, speed: speed?.id ?? null };
}

/** Cât stau butoanele blocate după un răspuns. O greșeală mai rapidă decât cititul (nu la sortări) primește pauza lungă. */
export function pauseAfter({ kind, correct, ms }) {
  if (correct) return { pauseMs: config.feedbackMs, guarded: false };
  const { fastMs, mode } = KINDS[kind];
  const guarded = mode !== 'sort' && ms < Math.max(config.guard.minMs, config.guard.below * fastMs);
  return { pauseMs: guarded ? Math.max(config.guard.pauseMinMs, fastMs) : config.cooldownMs, guarded };
}

/** Pragul de serie sărbătorit (începutul fiecărei trepte, apoi din 5 în 5): { label, mult, turbo } sau null. */
export function milestone(streak) {
  const tier = config.streak.find((t) => t.from === streak);
  if (tier) return { label: tier.label, mult: tier.mult, turbo: Boolean(tier.turbo) };
  const top = config.streak.at(-1);
  if (streak > top.from && streak % config.milestones.every === 0) {
    return { label: config.milestones.labels[streak] ?? config.milestones.later, mult: top.mult, turbo: Boolean(top.turbo) };
  }
  return null;
}

/** Bonusul de precizie de la final, în alune. */
export function precisionBonus(answered, correct, alune) {
  const { minAnswers, perfect, high } = config.precision;
  if (answered < minAnswers) return 0;
  if (correct === answered) return Math.round(alune * perfect);
  return correct / answered >= high.from ? Math.round(alune * high.bonus) : 0;
}

export const starsFor = (level, total) => (levelConfig(level)?.stars ?? []).filter((s) => total >= s).length;

/** O rundă: `next()` dă întrebarea următoare, `answer(given, ms)` o închide, `summary()` face rezumatul. */
export function createRound({ level, seed = newSeed() }) {
  const lvl = levelConfig(level);
  if (!lvl) throw new Error(`fulger: nivel necunoscut „${level}”`);
  const rand = seededRandom(seed);
  const answers = [];
  let question = null;
  let lastKey = null;
  let asked = 0;
  let streak = 0;

  function pickKind() {
    const list = asked < config.warmupCount ? lvl.warmup.map((kind) => ({ kind, weight: 1 })) : lvl.mix;
    let x = rand() * list.reduce((sum, m) => sum + m.weight, 0);
    for (const m of list) if ((x -= m.weight) < 0) return m.kind;
    return list.at(-1).kind;
  }

  return {
    level,
    seed,
    get question() {
      return question;
    },
    get streak() {
      return streak;
    },
    /** Întrebarea următoare (sau una de tipul dat); aceeași întrebare nu vine de două ori la rând. */
    next(kind = null) {
      const id = kind ?? pickKind();
      let q = KINDS[id].generate(rand);
      for (let i = 0; i < 20 && q.key === lastKey; i++) q = KINDS[id].generate(rand);
      question = q;
      lastKey = q.key;
      asked++;
      return q;
    },
    /** Închide întrebarea deschisă; `ms` = timpul de gândire, fără pauze. */
    answer(given, ms) {
      if (!question) throw new Error('fulger: nu e nicio întrebare deschisă');
      const q = question;
      question = null;
      const correct = isCorrect(q, given);
      streak = correct ? streak + 1 : 0;
      const score = correct ? scoreAnswer({ kind: q.kind, ms, streak }) : { alune: 0, base: 0, speedExtra: 0, streakExtra: 0, speed: null };
      answers.push({ kind: q.kind, correct, ms: Math.round(ms), ...score });
      return {
        question: q,
        correct,
        ...score,
        streak,
        tier: streakTier(streak),
        milestone: correct ? milestone(streak) : null,
        turbo: streak >= TURBO_FROM,
        ...pauseAfter({ kind: q.kind, correct, ms }),
      };
    },
    /** Doar pentru depanare (E2E): seria continuă de la `n`. */
    setStreak(n) {
      streak = n;
    },
    summary() {
      const answered = answers.length;
      const correct = answers.filter((a) => a.correct).length;
      const sum = (key) => answers.reduce((s, a) => s + a[key], 0);
      const alune = sum('alune');
      const bonus = precisionBonus(answered, correct, alune);
      const byKind = {};
      let run = 0;
      let bestStreak = 0;
      for (const a of answers) {
        run = a.correct ? run + 1 : 0;
        bestStreak = Math.max(bestStreak, run);
        const k = (byKind[a.kind] ??= { correct: 0, total: 0, ms: 0 });
        k.total++;
        k.correct += a.correct ? 1 : 0;
        k.ms += a.ms;
      }
      const total = alune + bonus;
      return {
        level,
        answered,
        correct,
        wrong: answered - correct,
        alune,
        base: sum('base'),
        speedBonus: sum('speedExtra'),
        streakBonus: sum('streakExtra'),
        precisionBonus: bonus,
        total,
        bestStreak,
        fast: answers.filter((a) => a.speed === 'fulger').length,
        byKind,
        stars: starsFor(level, total),
      };
    },
  };
}

/** Medaliile îndeplinite după o rundă: `rounds` = rundele jucate, `best` = recordurile salvate (cu runda aceasta). */
export function medalsFor(summary, { rounds, best }) {
  const stats = {
    rounds,
    bestStreak: summary.bestStreak,
    fast: summary.fast,
    perfect: summary.wrong === 0 ? summary.answered : 0,
    levels3: config.levels.filter((l) => (best[l.id]?.alune ?? 0) >= l.stars.at(-1)).length,
  };
  return config.medals.filter((m) => (stats[m.stat] ?? 0) >= m.gte).map((m) => m.id);
}

/** Tipurile de exersat, pentru părinți: sub 70% corecte în ultimele runde, din cel puțin 5 răspunsuri. */
export function practiceFor(rounds, { last = 10, minAnswers = 5, below = 0.7 } = {}) {
  const totals = {};
  for (const round of rounds.slice(-last)) {
    for (const [kind, k] of Object.entries(round.byKind ?? {})) {
      const t = (totals[kind] ??= { correct: 0, total: 0 });
      t.correct += k.correct;
      t.total += k.total;
    }
  }
  return Object.entries(totals)
    .filter(([kind, t]) => KINDS[kind] && t.total >= minAnswers && t.correct / t.total < below)
    .map(([kind, t]) => ({ kind, label: KINDS[kind].label, ...t }));
}
