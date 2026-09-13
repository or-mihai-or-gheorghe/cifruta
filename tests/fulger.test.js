import assert from 'node:assert/strict';
import { test } from 'node:test';

import concepts from '../site/data/concepts.js';
import config from '../site/data/fulger.js';
import { calc, relation } from '../site/js/core/expr.js';
import { glyphKey } from '../site/js/core/forme.js';
import { lintText } from '../site/js/core/lint.js';
import { seededRandom } from '../site/js/core/rng.js';
import { trecere } from '../site/js/core/rules.js';
import {
  createRound, levelConfig, medalsFor, milestone, nextStar, pauseAfter, playableTopics, practiceFor, precisionBonus, scoreAnswer, starsFor,
  topicConfig, topicStars, topicTotal,
} from '../site/js/fulger/engine.js';
import { KINDS } from '../site/js/fulger/kinds.js';
import { LEGACY_TOPIC, LEVEL_IDS, normalizeFulger, recordKey, splitKey } from '../site/js/fulger/records.js';
import '../site/js/visuals/all.js';
import { EMOJI } from '../site/js/visuals/emoji.js';
import { visualErrors, visualSVG } from '../site/js/visuals/index.js';
import { SHAPE_RULES } from './fulger-forme.rules.js';

const SEEDS = 500;
const terms = (text) => text.split(/ [+−] /).map(Number);
const inRange = (x, min, max) => Number(x) >= min && Number(x) <= max;
const FARA = 'mat.op.fara-trecere';
const CU = 'mat.op.cu-trecere';

// Regulile fiecărui tip, verificate pe întrebările generate
const RULES = {
  'add-1c': ({ text }) => terms(text).every((x) => inRange(x, 1, 9)),
  'add-1c-2c': ({ text }) => inRange(terms(text)[0], 1, 9) && inRange(terms(text)[1], 10, 20),
  'sub-20-fara': ({ text }) => {
    const [a, b] = terms(text);
    return inRange(a, 11, 19) && inRange(b, 1, 9) && !trecere('-', a, b);
  },
  'cmp-20': ({ left, right }) => inRange(left, 0, 20) && inRange(right, 0, 20),
  'sort-3-20': ({ numbers, dir }) => numbers.length === 3 && dir === 'asc' && numbers.every((x) => inRange(x, 0, 20)),
  'sub-20-cu': ({ text }) => {
    const [a, b] = terms(text);
    return inRange(a, 11, 18) && inRange(b, 2, 9) && trecere('-', a, b);
  },
  'add-100-fara': ({ text, answer }) => {
    const [a, b] = terms(text);
    return answer <= 99 && Math.max(a, b) >= 10 && !trecere('+', a, b);
  },
  'sub-100-fara': ({ text, answer }) => {
    const [a, b] = terms(text);
    return a <= 99 && b >= 1 && answer >= 1 && !trecere('-', a, b);
  },
  'add-3op-1c': ({ text }) => terms(text).length === 3 && terms(text).every((x) => inRange(x, 1, 9)),
  'cmp-100': ({ left, right }) => inRange(left, 0, 100) && inRange(right, 0, 100),
  'sort-4-100': ({ numbers, dir }) => numbers.length === 4 && dir === 'asc' && numbers.every((x) => inRange(x, 0, 100)),
  'add-100-cu': ({ text, answer }) => answer <= 100 && trecere('+', ...terms(text)),
  'sub-100-cu': ({ text, answer }) => terms(text)[0] <= 100 && answer >= 1 && trecere('-', ...terms(text)),
  'add-3op-100': ({ text, answer }) => terms(text).length === 3 && answer <= 100 && terms(text).reduce((s, x) => s + (x % 10), 0) >= 10,
  'cmp-expr': ({ left, right }) =>
    [left, right].some((x) => /[+−]/.test(x)) && Math.abs(calc(left) - calc(right)) <= 3 && [left, right].every((x) => inRange(calc(x), 10, 100)),
  'sort-4-dir': ({ numbers }) => numbers.length === 4 && numbers.every((x) => inRange(x, 0, 100)),
  ...SHAPE_RULES, // tipurile cu figuri: regulile sunt în tests/fulger-forme.rules.js
};

/** Trecerea peste ordin a unui calcul din text: pe coloane la doi termeni, prin suma unităților la trei. */
function carries(text) {
  const t = terms(text);
  return t.length === 2 ? trecere(text.includes('−') ? '-' : '+', t[0], t[1]) : t.reduce((s, x) => s + (x % 10), 0) >= 10;
}

/** Un răspuns greșit la întâmplare. */
function wrongAnswer(q, rand) {
  const pick = (list) => list[Math.floor(rand() * list.length)];
  if (q.choices) return pick(q.choices.filter((c) => c !== q.answer));
  if (q.mode === 'compare') return pick(['<', '=', '>'].filter((r) => r !== q.answer));
  return [...q.answer].reverse();
}

/** O atingere la întâmplare: o variantă (număr sau figură), un semn sau o ordine oarecare a plăcilor. */
function guessAnswer(q, rand) {
  if (q.choices) return q.choices[Math.floor(rand() * q.choices.length)];
  if (q.mode === 'compare') return ['<', '=', '>'][Math.floor(rand() * 3)];
  const order = [...q.numbers];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

test('fulger: fiecare tip generează întrebări corecte, în limitele lui, cu conceptele potrivite (500 de semințe)', () => {
  assert.deepEqual(Object.keys(RULES).sort(), Object.keys(KINDS).sort(), 'fiecare tip are regulile lui în test');
  for (const [id, kind] of Object.entries(KINDS)) {
    assert.ok(kind.concepts?.length && kind.concepts.every((c) => concepts[c]), `${id}: concepte din data/concepts.js`);
    const positions = [0, 0, 0, 0];
    const relations = { '<': 0, '=': 0, '>': 0 };
    const dirs = new Set();
    const carry = { cu: 0, fara: 0 };
    for (let seed = 1; seed <= SEEDS; seed++) {
      const q = kind.generate(seededRandom(seed));
      const where = `${id} (sămânța ${seed}): ${JSON.stringify(q)}`;
      assert.ok(q.kind === id && q.mode === kind.mode && q.key, where);
      assert.ok(RULES[id](q), `${where} încalcă regulile tipului`);
      if (q.mode === 'figure') {
        // cerința scurtă, 4 variante diferite chiar și fără culori, desene valide, iar întrebarea rămâne aceeași după JSON
        assert.ok(q.prompt && q.prompt.length <= 40 && !lintText(q.prompt).length, `${where}: cerința`);
        assert.ok(q.choices.length === 4 && new Set(q.choices).size === 4 && q.choices.includes(q.answer), `${where}: variantele`);
        assert.deepEqual(Object.keys(q.options).sort(), [...q.choices].sort(), `${where}: desenele variantelor`);
        for (const spec of [q.figure, q.solved, ...Object.values(q.options)].filter(Boolean)) {
          if (!spec.v) assert.ok(spec.emoji ? EMOJI[spec.emoji] : typeof spec.text === 'string', `${where}: variantă fără desen`);
          else assert.ok(!visualErrors(spec).length && !/NaN|undefined/.test(visualSVG(spec)), `${where}: desenul ${JSON.stringify(spec)}`);
        }
        const bare = q.choices.map((c) => q.options[c]).map((o) => (o.v === 'glyph' ? `${glyphKey({ ...o, color: 'albastru' })}|${o.axis ?? ''}` : JSON.stringify(o)));
        assert.equal(new Set(bare).size, 4, `${where}: două variante diferă doar prin culoare`);
        assert.deepEqual(JSON.parse(JSON.stringify(q)), q, `${where}: întrebarea se schimbă după JSON`);
        positions[q.choices.indexOf(q.answer)]++;
      } else if (q.mode === 'choice') {
        assert.equal(q.answer, calc(q.text), where);
        assert.equal(new Set(q.choices).size, 4, where);
        assert.ok(q.choices.includes(q.answer) && q.choices.every((c) => Number.isInteger(c) && c >= 0), where);
        assert.deepEqual(q.choices, [...q.choices].sort((a, b) => a - b), where);
        positions[q.choices.indexOf(q.answer)]++;
        carry[carries(q.text) ? 'cu' : 'fara']++;
      } else if (q.mode === 'compare') {
        assert.equal(q.answer, relation(calc(q.left), calc(q.right)), where);
        relations[q.answer]++;
      } else {
        assert.equal(new Set(q.numbers).size, q.numbers.length, where);
        assert.deepEqual(q.answer, [...q.numbers].sort((a, b) => (q.dir === 'asc' ? a - b : b - a)), where);
        assert.notDeepEqual(q.numbers, q.answer, `${where}: plăcile stau deja în ordine`);
        dirs.add(q.dir);
      }
    }
    if (kind.mode === 'choice' || kind.mode === 'figure') {
      assert.ok(positions.every((n) => n >= SEEDS * 0.15 && n <= SEEDS * 0.35), `${id}: răspunsul corect pe pozițiile 1–4: ${positions}`);
    }
    if (kind.mode === 'choice') {
      // „fără trecere” doar dacă nu apare niciodată trecerea, „cu trecere” doar dacă apare mereu, amândouă dacă apar amândouă
      assert.deepEqual([kind.concepts.includes(FARA), kind.concepts.includes(CU)], [carry.fara > 0, carry.cu > 0], `${id}: etichetele de trecere față de ${JSON.stringify(carry)}`);
    }
    if (kind.mode === 'compare') assert.ok(Object.values(relations).every((n) => n >= SEEDS * 0.1), `${id}: semnele ${JSON.stringify(relations)}`);
    if (id === 'sort-4-dir') assert.deepEqual([...dirs].sort(), ['asc', 'desc']);
  }
});

test('fulger: alunele cresc cu viteza (doar în serie) și cu seria', () => {
  const alune = (kind, ms, streak) => scoreAnswer({ kind, ms, streak }).alune;
  assert.equal(alune('add-1c', 500, 1), 1); // primul răspuns din serie: fără bonus de viteză
  assert.equal(alune('add-1c', 2000, 2), 2); // fulger ×2
  assert.equal(alune('add-1c', 5000, 2), 2); // rapid: 1 × 1,5 = 1,5 → 2
  assert.equal(alune('add-1c', 7000, 2), 1);
  assert.equal(alune('add-1c', 2000, 3), 3); // ×2 × 1,5
  assert.equal(alune('sub-100-cu', 7000, 10), 30); // 5 × 2 × 3
  assert.equal(alune('sub-100-cu', 12000, 5), 15); // 5 × 1,5 × 2
  assert.deepEqual(scoreAnswer({ kind: 'add-100-cu', ms: 6000, streak: 6 }), { alune: 16, base: 4, speedExtra: 4, streakExtra: 8, speed: 'fulger' });
});

test('fulger: pauzele după greșeli; ghicitul prea rapid primește pauza lungă', () => {
  assert.deepEqual(pauseAfter({ kind: 'add-1c', correct: true, ms: 300 }), { pauseMs: config.feedbackMs, guarded: false });
  assert.deepEqual(pauseAfter({ kind: 'add-1c', correct: false, ms: 2000 }), { pauseMs: 1000, guarded: false });
  assert.deepEqual(pauseAfter({ kind: 'add-1c', correct: false, ms: 1100 }), { pauseMs: 3000, guarded: true }); // sub 1,2 s
  assert.deepEqual(pauseAfter({ kind: 'add-100-cu', correct: false, ms: 2500 }), { pauseMs: 7000, guarded: true }); // sub 2,8 s
  assert.deepEqual(pauseAfter({ kind: 'cmp-20', correct: false, ms: 900 }), { pauseMs: 3000, guarded: true }); // sub 1 s
  assert.deepEqual(pauseAfter({ kind: 'sort-4-dir', correct: false, ms: 300 }), { pauseMs: 1000, guarded: false });
});

test('fulger: pragurile de serie și Turbo', () => {
  assert.equal(milestone(2), null);
  assert.equal(milestone(3).label, 'Bravo!');
  assert.equal(milestone(5).label, 'Super!');
  assert.deepEqual([milestone(10).label, milestone(10).turbo], ['TURBO!', true]);
  assert.equal(milestone(12), null);
  assert.equal(milestone(15).label, 'Senzațional!');
  assert.equal(milestone(20).label, 'De neoprit!');
  assert.equal(milestone(35).label, 'Legendar!');
});

test('fulger: runda e deterministă, începe cu încălzirea și nu repetă întrebările recente', () => {
  const keys = (seed) => {
    const round = createRound({ topic: LEGACY_TOPIC, level: 'intermediar', seed });
    return Array.from({ length: 40 }, () => round.answer(round.next().answer, 2000).question.key);
  };
  assert.deepEqual(keys(42), keys(42));
  assert.notDeepEqual(keys(42), keys(43));
  for (const topic of playableTopics()) {
    for (const lvl of topic.levels) {
      const round = createRound({ topic: topic.id, level: lvl.id, seed: 7 });
      const recent = [];
      for (let i = 0; i < 1500; i++) {
        const q = round.next();
        if (i < config.warmupCount) assert.ok(lvl.warmup.includes(q.kind), `${topic.id}/${lvl.id}: încălzirea începe cu ${q.kind}`);
        assert.ok(!recent.includes(q.key), `${topic.id}/${lvl.id}: ${q.key} revine printre ultimele ${config.noRepeat} întrebări`);
        recent.push(q.key);
        if (recent.length > config.noRepeat) recent.shift();
        round.answer(q.answer, 1000);
      }
    }
  }
  assert.throws(() => createRound({ topic: LEGACY_TOPIC, level: 'nu-exista' }));
  assert.throws(() => createRound({ topic: 'nu-exista', level: 'usor' }));
  const soon = config.topics.find((t) => t.soon);
  assert.throws(() => createRound({ topic: soon.id, level: 'usor' }), 'o temă „în curând” nu se joacă');
});

test('fulger: rezumatul adună alunele, seria cea mai lungă și bonusul de precizie', () => {
  const round = createRound({ topic: LEGACY_TOPIC, level: 'usor', seed: 3 });
  const rand = seededRandom(9);
  const results = Array.from({ length: 12 }, (_, i) => {
    const q = round.next();
    return round.answer(i === 4 ? wrongAnswer(q, rand) : q.answer, 1500);
  });
  const s = round.summary();
  assert.deepEqual([s.topic, s.level], [LEGACY_TOPIC, 'usor']);
  assert.deepEqual([s.answered, s.correct, s.wrong, s.bestStreak], [12, 11, 1, 7]);
  assert.deepEqual([results[4].correct, results[4].streak, results[5].streak], [false, 0, 1]);
  assert.equal(s.alune, results.reduce((sum, r) => sum + r.alune, 0));
  assert.equal(s.base + s.speedBonus + s.streakBonus, s.alune);
  assert.equal(s.precisionBonus, Math.round(s.alune * 0.1)); // 11 din 12 corecte
  assert.equal(s.total, s.alune + s.precisionBonus);
  assert.equal(s.stars, starsFor(levelConfig(LEGACY_TOPIC, 'usor'), s.total));
  assert.equal(Object.values(s.byKind).reduce((n, k) => n + k.total, 0), 12);
  assert.equal(s.mistakes.length, 1); // greșelile, pentru „Greșelile tale”
  assert.equal(s.mistakes[0].question.key, results[4].question.key);
  assert.notDeepEqual(s.mistakes[0].given, results[4].question.answer);
});

test('fulger: bonusul de precizie și stelele', () => {
  const usor = levelConfig(LEGACY_TOPIC, 'usor');
  assert.equal(precisionBonus(9, 9, 100), 0); // prea puține răspunsuri
  assert.equal(precisionBonus(10, 10, 100), 20);
  assert.equal(precisionBonus(10, 9, 100), 10);
  assert.equal(precisionBonus(10, 8, 100), 0);
  assert.equal(starsFor(usor, 29), 0);
  assert.equal(starsFor(usor, 30), 1);
  assert.equal(starsFor(levelConfig(LEGACY_TOPIC, 'avansat'), 235), 3);
  assert.deepEqual(nextStar(usor, 29), { index: 0, at: 30 });
  assert.deepEqual(nextStar(usor, 80), { index: 2, at: 175 });
  assert.equal(nextStar(usor, 175), null);
});

test('fulger: temele și nivelurile trimit doar la tipuri, concepte, iconițe și statistici cunoscute', () => {
  const stats = new Set(['rounds', 'bestStreak', 'fast', 'perfect', 'levels3']);
  const reserved = new Set([...LEVEL_IDS, 'total', 'all']);
  const ids = config.topics.map((t) => t.id);
  assert.equal(new Set(ids).size, ids.length, 'id-urile temelor sunt unice');
  const used = new Set();
  for (const topic of config.topics) {
    assert.match(topic.id, /^[a-z0-9]+(-[a-z0-9]+)*$/, topic.id);
    assert.ok(!topic.id.split('-').some((s) => reserved.has(s)), `${topic.id}: un segment rezervat ar încurca rutele și clasamentele`);
    assert.ok(topic.title && topic.short && topic.text && [0, 1, 2].includes(topic.grade), `${topic.id}: titlu, nume scurt, descriere, clasă`);
    assert.ok(!topic.icon || EMOJI[topic.icon], `${topic.id}: iconița ${topic.icon}`);
    assert.ok(topic.concepts?.length && topic.concepts.every((c) => concepts[c]), `${topic.id}: concepte din data/concepts.js`);
    assert.equal(Boolean(topic.soon), !topic.levels, `${topic.id}: „în curând” exact când n-are niveluri`);
    if (topic.soon) continue;
    assert.deepEqual(topic.levels.map((l) => l.id), LEVEL_IDS, `${topic.id}: nivelurile`);
    const kinds = new Set();
    for (const lvl of topic.levels) {
      for (const { kind, weight } of lvl.mix) {
        assert.ok(KINDS[kind] && weight > 0, `${topic.id}/${lvl.id}: ${kind}`);
        kinds.add(kind);
        used.add(kind);
      }
      for (const kind of lvl.warmup) assert.ok(lvl.mix.some((m) => m.kind === kind), `${topic.id}/${lvl.id}: încălzirea ${kind} nu e în amestec`);
      assert.ok(lvl.stars.length === 3 && lvl.stars.every((s, i) => i === 0 || s > lvl.stars[i - 1]), `${topic.id}/${lvl.id}: pragurile de stele cresc`);
    }
    const fromKinds = [...new Set([...kinds].flatMap((k) => KINDS[k].concepts))].sort();
    assert.deepEqual(fromKinds, [...topic.concepts].sort(), `${topic.id}: conceptele temei sunt conceptele tipurilor ei`);
  }
  assert.ok(topicConfig(LEGACY_TOPIC) && !topicConfig(LEGACY_TOPIC).soon, 'tema rezultatelor de dinainte de teme se poate juca');
  assert.deepEqual(Object.keys(KINDS).filter((k) => !used.has(k)), [], 'fiecare tip e folosit într-o temă');
  for (const m of config.medals) assert.ok(EMOJI[m.icon] && stats.has(m.stat), `${m.id}: ${m.icon} / ${m.stat}`);
});

test('fulger: recordurile de dinainte de teme intră în tema lor; normalizarea e idempotentă', () => {
  const key = (level) => recordKey(LEGACY_TOPIC, level);
  const legacy = {
    best: { usor: { alune: 77, at: 'a' }, [key('usor')]: { alune: 50, at: 'b' }, avansat: { alune: 10, at: 'c' } },
    rounds: [{ level: 'usor', at: 'a', total: 77 }, { topic: 'alta', level: 'usor', at: 'd', total: 5 }],
    medals: { 'prima-cursa': 'a' },
    week: { usor: { id: '2026-W37', alune: 30 }, [key('usor')]: { id: '2026-W38', alune: 10 } },
  };
  const n = normalizeFulger(legacy);
  assert.deepEqual(Object.keys(n.best).sort(), [key('avansat'), key('usor')]);
  assert.equal(n.best[key('usor')].alune, 77); // aceeași înregistrare în ambele forme: câștigă recordul mai mare
  assert.deepEqual(n.rounds.map((r) => r.topic), [LEGACY_TOPIC, 'alta']);
  assert.equal(n.week[key('usor')].id, '2026-W38'); // la săptămână rămâne cea mai nouă
  assert.deepEqual(n.medals, { 'prima-cursa': 'a' });
  assert.deepEqual(normalizeFulger(n), n);
  assert.deepEqual(normalizeFulger(), { best: {}, rounds: [], medals: {} });
  assert.deepEqual(splitKey(key('avansat')), { topic: LEGACY_TOPIC, level: 'avansat' });
  assert.deepEqual(splitKey('usor'), { topic: LEGACY_TOPIC, level: 'usor' });
});

test('fulger: medaliile comune temelor, totalul și stelele unei teme, tipurile de exersat', () => {
  const topic = topicConfig(LEGACY_TOPIC);
  const summary = (extra) => ({ topic: LEGACY_TOPIC, ...extra });
  assert.deepEqual(medalsFor(summary({ answered: 16, wrong: 0, bestStreak: 16, fast: 11 }), { rounds: 1, best: {} }), ['prima-cursa', 'in-flacari', 'fulgerul', 'fara-gres']);
  const best = Object.fromEntries(topic.levels.map((l) => [recordKey(LEGACY_TOPIC, l.id), { alune: l.stars.at(-1) }]));
  assert.deepEqual(medalsFor(summary({ answered: 5, wrong: 2, bestStreak: 21, fast: 0 }), { rounds: 4, best }), ['prima-cursa', 'in-flacari', 'de-neoprit', 'campionul']);
  const elsewhere = Object.fromEntries(topic.levels.map((l) => [recordKey('alta-tema', l.id), { alune: 9999 }]));
  assert.ok(!medalsFor(summary({ answered: 5, wrong: 2, bestStreak: 1, fast: 0 }), { rounds: 4, best: elsewhere }).includes('campionul'), 'recordurile altei teme nu fac „Campionul” aici');
  assert.equal(topicTotal(LEGACY_TOPIC, best), topic.levels.reduce((sum, l) => sum + l.stars.at(-1), 0));
  assert.deepEqual([topicStars(LEGACY_TOPIC, best), topicStars(LEGACY_TOPIC, {}), topicTotal(LEGACY_TOPIC, {})], [9, 0, 0]);
  const rounds = [
    { byKind: { 'sub-100-cu': { correct: 2, total: 6, ms: 1 }, 'add-1c': { correct: 9, total: 10, ms: 1 } } },
    { byKind: { 'sub-100-cu': { correct: 1, total: 1, ms: 1 } } },
  ];
  assert.deepEqual(practiceFor(rounds).map((p) => [p.kind, p.correct, p.total]), [['sub-100-cu', 3, 7]]);
});

// Profiluri de copii: timpul de gândire e o fracțiune din timpul „fulger” al tipului de întrebare
const honest = (accuracy, [lo, hi]) => (q, rand) => ({
  ms: KINDS[q.kind].fastMs * (lo + rand() * (hi - lo)),
  given: rand() < accuracy ? q.answer : wrongAnswer(q, rand),
});
const guesser = (ms) => (q, rand) => ({ ms: q.mode === 'sort' ? (ms * q.numbers.length) / 2 : ms, given: guessAnswer(q, rand) });

/** O rundă întreagă cu motorul real; timpul curge ca în interfață: întârzierea de la apariție, gândirea, pauza. */
function playRound(topic, level, seed, decide) {
  const round = createRound({ topic, level, seed });
  const rand = seededRandom(seed * 7 + 1);
  for (let t = 0; ; ) {
    const q = round.next();
    const { ms, given } = decide(q, rand);
    if (t + config.inputDelayMs + ms > config.durationMs) return round.summary();
    t += config.inputDelayMs + ms + round.answer(given, ms).pauseMs;
  }
}

test('fulger: pragurile de stele se potrivesc cu copiii simulați (mediana a 200 de runde, pe fiecare temă și nivel)', () => {
  for (const topic of playableTopics()) {
    for (const { id, stars: [one, two, three] } of topic.levels) {
      const median = (decide) => Array.from({ length: 200 }, (_, i) => playRound(topic.id, id, 101 + i, decide).total).sort((a, b) => a - b)[100];
      const m = {
        rapid: median(honest(0.95, [0.6, 1.1])),
        bun: median(honest(0.9, [0.9, 1.8])),
        incet: median(honest(0.9, [1.6, 3])),
        ghicitRepede: median(guesser(450)),
        ghicitLent: median(guesser(900)),
      };
      const where = `${topic.id}/${id}: ${JSON.stringify(m)}, praguri ${one}/${two}/${three}`;
      assert.ok(m.rapid >= three && m.bun >= two && m.incet >= one, where);
      assert.ok(m.ghicitRepede < one && m.ghicitLent < one, where);
    }
  }
});
