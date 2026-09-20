// Jocuri fulger: pagina jocului (#/fulger) cu temele desfășurate (titlul, explicația, „Ce exersăm” și nivelurile fiecărei teme),
// runda (#/fulger/<temă>/<nivel>) și rezultatele ei. #/fulger/<temă> e aceeași pagină, derulată la temă; rutele de dinainte de
// teme (#/fulger/<nivel>) duc la tema în care au intrat rezultatele vechi.

import concepts, { GRADES } from '../../data/concepts.js';
import config from '../../data/fulger.js';
import { boardLink } from '../components/board-link.js';
import { clearHistoryButton } from '../components/history.js';
import { backLink, callout, chip, confetti, levelInfo, levelPill, mascot, stars } from '../components/ui.js';
import { countUp, h, pop, prefersReducedMotion } from '../core/dom.js';
import { seededRandom } from '../core/rng.js';
import { cantitate, formatDateTime, formatNumber } from '../core/ro.js';
import { redirect, refresh } from '../core/router.js';
import { play } from '../core/sound.js';
import { clearFulger, getFulger, saveFulgerRound } from '../core/storage.js';
import { artHTML, artName, aspect, isChart, promptHTML, promptSpoken } from '../fulger/art.js';
import { levelConfig, nextStar, playableTopics, practiceFor, starsFor, topicConfig, topicStars, topicTotal } from '../fulger/engine.js';
import { isDrawn, KINDS } from '../fulger/kinds.js';
import { medalCatalog, medalsAfterRound, medalsWon, metalCount, metalOf } from '../fulger/medals.js';
import { LEGACY_TOPIC, LEVEL_IDS, recordKey } from '../fulger/records.js';
import { mountArena } from '../fulger/view.js';
import { emojiHTML } from '../visuals/emoji.js';
import { visualSVG } from '../visuals/index.js';

const alune = (n) => cantitate(n, 'alună', 'alune');
const levelLabel = (id) => levelInfo(id)?.label ?? id;

export default function fulger(container, [first, second] = []) {
  if (!first) return gamePage(container);
  if (LEVEL_IDS.includes(first)) return redirect(`fulger/${LEGACY_TOPIC}/${first}`);
  const topic = topicConfig(first);
  if (!topic) return redirect('fulger');
  if (!second) return gamePage(container, topic);
  const lvl = levelConfig(topic.id, second); // null și la o temă „în curând”
  return lvl ? roundPage(container, topic, lvl) : redirect(`fulger/${topic.id}`);
}

// ——— Pagina jocului: temele desfășurate ———

const HOW = [
  ['cronometru', '2 minute', 'Răspunde corect la cât mai multe întrebări.'],
  ['foc', 'Serii', 'Corect de mai multe ori la rând: alunele cresc de 1,5, de 2, apoi de 3 ori.'],
  ['fulger', 'Fulgere', 'Repede și în serie: alune duble.'],
];

function hero(title, text) {
  return h(
    'section',
    { class: 'fg-hub__hero anim-fade-up' },
    h('div', { class: 'fg-hub__bolt', 'aria-hidden': 'true', html: emojiHTML('fulger') }),
    h('div', { class: 'l-stack l-stack--sm' }, h('h1', { class: 'fg-hub__title' }, title), h('p', { class: 'fg-hub__text' }, text)),
    h('div', { class: 'fg-hub__mascot', 'aria-hidden': 'true', html: visualSVG({ v: 'mascot', mood: 'sarbatoreste' }) }),
  );
}

const howTo = () =>
  h(
    'ul',
    { class: 'fg-how' },
    HOW.map(([icon, title, text]) =>
      h('li', { class: 'fg-how__item' }, h('span', { class: 'fg-how__icon', 'aria-hidden': 'true', html: emojiHTML(icon) }), h('span', {}, h('strong', { class: 'fg-how__title' }, title), h('span', { class: 'fg-how__text' }, text))),
    ),
  );

/** Iconița, titlul și programa unei teme (h2 la o temă de jucat, h3 la temele „în curând”), plus ce stă alături. */
function topicHead(topic, heading, extra = null) {
  return h(
    'div',
    { class: 'fg-topic__head' },
    h('span', { class: 'c-card__icon', 'aria-hidden': 'true', html: emojiHTML(topic.icon ?? 'calcul') }),
    h('div', { class: 'fg-topic__name' }, h(heading, { class: 'fg-topic__title', id: `fg-tema-${topic.id}` }, topic.title), h('span', { class: 'u-small u-muted' }, `Programa: ${GRADES[topic.grade]}`)),
    extra,
  );
}

/** O temă de jucat, desfășurată: stelele și totalul ei, explicația, „Ce exersăm” și cele trei niveluri. */
function topicSection(topic, data, medals) {
  const total = topicTotal(topic.id, data.best);
  const score = h(
    'div',
    { class: 'l-cluster fg-topic__score' },
    chip(`${topicStars(topic.id, data.best)} din ${cantitate(topic.levels.length * 3, 'stea', 'stele')}`, '', 'stea'),
    total ? chip(`Total: ${alune(total)}`, '', 'trofeu') : null,
  );
  return h(
    'section',
    { class: 'fg-topic', 'aria-labelledby': `fg-tema-${topic.id}`, 'data-testid': `fg-topic-${topic.id}` },
    topicHead(topic, 'h2', score),
    h('p', { class: 'fg-topic__text' }, topic.text),
    h(
      'div',
      { class: 'fg-topic__learn' },
      h('h3', { class: 'fg-topic__label' }, 'Ce exersăm'),
      h('ul', { class: 'fg-concepts', 'data-testid': 'fg-concepts' }, topic.concepts.map((id) => h('li', {}, chip(concepts[id]?.title ?? id)))),
    ),
    h('div', { class: 'l-grid anim-stagger', style: { '--grid-min': '17.25rem' } }, topic.levels.map((l) => levelCard(topic, l, data, medals))),
  );
}

/** Temele care vin, grupate: titlul, programa și explicația, fără niveluri și fără legături. */
function soonSection(topics) {
  if (!topics.length) return null;
  return h(
    'section',
    { class: 'l-stack l-stack--sm' },
    h('h2', { class: 'fg-h2' }, 'În curând'),
    h(
      'div',
      { class: 'l-grid', style: { '--grid-min': '20rem' } },
      topics.map((t) => h('article', { class: 'c-card c-card--soon fg-soon', 'data-testid': `fg-topic-${t.id}` }, topicHead(t, 'h3'), h('p', { class: 'c-card__text' }, t.text))),
    ),
  );
}

/** #/fulger și #/fulger/<temă>: toate temele pe aceeași pagină; cu o temă dată, pagina se derulează la ea. */
function gamePage(container, focus = null) {
  document.title = 'Jocuri fulger — Cifruța';
  const data = getFulger();
  const playable = playableTopics();
  // medaliile câștigate se calculează o dată, pentru cardurile nivelurilor și pentru raft
  const medals = { catalog: medalCatalog(playable), won: medalsWon(data.best, data.medals, playable) };
  container.append(
    h(
      'div',
      { class: 'l-container l-stack l-stack--lg' },
      backLink('#/', 'Pagina de început'),
      hero('Jocuri fulger', 'Câte întrebări rezolvi în 2 minute? Alege tema și nivelul, strânge alune, fă serii și bate-ți recordul!'),
      howTo(),
      playable.map((t) => topicSection(t, data, medals)),
      playable[0] ? boardLink(`fulger/${playable[0].id}/total/week`, { row: 'center' }) : null,
      medalShelf(data, medals, playable),
      soonSection(config.topics.filter((t) => t.soon)),
      parentsBox(data.rounds),
    ),
  );
  // după primul calcul al paginii, peste derularea la început făcută de router
  const target = focus && container.querySelector(`[data-testid="fg-topic-${focus.id}"]`);
  if (target) requestAnimationFrame(() => target.scrollIntoView({ block: 'start', behavior: 'instant' }));
}

/** O întrebare-exemplu ca plăcuță: 7 + 5, 14 ◻ 17, 12 · 9 · 15 sau o miniatură a desenului (fără desen: cele 4 variante). */
function sample(kind, seed) {
  const q = KINDS[kind].generate(seededRandom(seed));
  if (q.mode === 'figure' || q.figure) {
    const arts = q.figure ? [q.figure] : q.choices.map((c) => q.options[c]);
    return h(
      'li',
      { class: `fg-sample fg-sample--art${q.figure ? '' : ' fg-sample--options'}` },
      arts.map((art) => h('span', { class: 'fg-sample__art', 'aria-hidden': 'true', style: { '--ar': String(aspect(art)) }, html: artHTML(art) })),
      // la comparările și ordonările desenate, cerința e doar legenda rândului de răspuns („Minute:”): se citește numele tipului
      h('span', { class: 'u-visually-hidden' }, q.mode === 'figure' ? promptSpoken(q.prompt) : KINDS[kind].label),
    );
  }
  const content = q.mode === 'choice' ? q.text : q.mode === 'compare' ? [q.left, h('span', { class: 'fg-box', 'aria-label': 'căsuță' }), q.right] : q.numbers.join(' · ');
  return h('li', { class: 'fg-sample' }, content);
}

function levelCard(topic, lvl, data, medals) {
  const best = data.best[recordKey(topic.id, lvl.id)]?.alune ?? null;
  // la calcule, câte un exemplu din fiecare mod; la temele desenate (figuri, grafice, hărți), primele două tipuri din amestec
  const drawnTopic = topic.levels.every((l) => l.mix.every((m) => isDrawn(m.kind)));
  const byMode = drawnTopic ? [] : ['choice', 'compare', 'sort'].map((mode) => lvl.mix.find((m) => KINDS[m.kind].mode === mode)?.kind).filter(Boolean);
  const examples = byMode.length ? byMode : lvl.mix.map((m) => m.kind).slice(0, 2);
  return h(
    'article',
    { class: 'c-card fg-level', 'data-level': lvl.id, 'data-testid': `fg-card-${lvl.id}` },
    h('div', { class: 'fg-level__head' }, levelPill(lvl.id), stars(best === null ? 0 : starsFor(lvl, best))),
    h('ul', { class: 'fg-samples', 'aria-label': 'Exemple de întrebări' }, examples.map((kind, i) => sample(kind, 11 + i))),
    h('p', { class: 'fg-level__best', 'data-testid': `fg-best-${lvl.id}` }, best === null ? chip('Nou!', 'c-chip--soon') : chip(`Record: ${alune(best)}`, '', 'trofeu')),
    levelMedal(topic, lvl, medals),
    h('a', { class: 'c-btn c-btn--primary c-btn--lg fg-level__play', href: `#/fulger/${topic.id}/${lvl.id}`, 'data-testid': `fg-level-${lvl.id}` }, 'Joacă'),
  );
}

/** Medalia nivelului, pe cardul lui: „Cu 3 stele câștigi medalia de bronz.”, apoi „Ai medalia de bronz!”. */
function levelMedal(topic, lvl, { catalog, won }) {
  const m = catalog.find((x) => x.kind === 'topic' && x.topic === topic.id && x.level === lvl.id);
  const metal = metalOf(lvl.id);
  if (!m || !metal) return null;
  const has = won.has(m.id);
  return h(
    'p',
    { class: `fg-level__medal${has ? ' is-won' : ''}`, 'data-metal': metal.id, 'data-testid': `fg-level-medal-${lvl.id}` },
    h('span', { class: 'fg-level__medal-art', 'aria-hidden': 'true', html: visualSVG(m.visual) }),
    has ? `Ai medalia ${metal.of}!` : `Cu ${cantitate(lvl.stars.length, 'stea', 'stele')} câștigi medalia ${metal.of}.`,
  );
}

/**
 * O medalie, pe raft sau la rezultate: desenul, bifa când e câștigată, numele, progresul și starea pentru cititorul de ecran. Pe raft,
 * la o medalie de temă se vede numele scurt al temei (panoul arată metalul); la rezultate se văd titlul, tema și textul.
 */
function medalCard(m, { won, progress = null, detailed = false }) {
  const title = m.kind === 'extra' || detailed ? m.title : [h('span', { class: 'u-visually-hidden' }, `${m.title}: `), m.short];
  return h(
    'li',
    { class: `fg-medal${m.kind === 'extra' ? ' fg-medal--extra' : ''}${won ? ' is-won' : ''}`, 'data-metal': m.metal, 'data-testid': `fg-medal-${m.id}` },
    h('span', { class: 'fg-medal__art', 'aria-hidden': 'true', html: visualSVG(m.visual) }),
    won ? h('span', { class: 'fg-medal__check', 'aria-hidden': 'true' }) : null,
    h('strong', { class: 'fg-medal__title' }, title),
    detailed && m.kind === 'topic' ? h('span', { class: 'fg-medal__sub' }, m.short) : null,
    detailed ? h('span', { class: 'fg-medal__text' }, m.text) : null,
    progress,
    h('span', { class: 'u-visually-hidden' }, won ? 'Câștigată.' : 'Încă necâștigată.'),
  );
}

/** Raftul medaliilor: câte un panou pe metal (adică pe nivel), cu medaliile temelor și medaliile în plus. */
function medalShelf(data, { catalog, won }, topics) {
  const teme = (n) => cantitate(n, 'temă', 'teme');
  const progress = (m, have) => {
    if (m.kind === 'extra') return h('span', { class: 'fg-medal__progress' }, won.has(m.id) ? teme(m.count) : `${Math.min(have, m.count)} din ${teme(m.count)}`);
    return stars(starsFor(levelConfig(m.topic, m.level), data.best[recordKey(m.topic, m.level)]?.alune ?? 0), 3);
  };
  return h(
    'section',
    { class: 'fg-shelf l-stack', 'aria-labelledby': 'fg-medalii', 'data-testid': 'fg-medals' },
    h('h2', { class: 'fg-h2', id: 'fg-medalii' }, 'Medaliile tale ', h('span', { 'data-testid': 'fg-medals-count' }, `(${won.size} din ${catalog.length})`)),
    h('p', { class: 'fg-shelf__intro' }, 'Cu 3 stele la un nivel câștigi medalia temei: bronz la Ușor, argint la Intermediar, aur la Avansat. Aceeași medalie la mai multe teme îți aduce medalii în plus.'),
    config.medals.metals.map((metal) => {
      const mine = catalog.filter((m) => m.metal === metal.id);
      const have = metalCount(won, metal.id, topics);
      const card = (m) => medalCard(m, { won: won.has(m.id), progress: progress(m, have) });
      const group = (kind, label) => {
        const list = mine.filter((m) => m.kind === kind);
        return h(
          'div',
          { class: `fg-metal__group fg-metal__group--${kind}` },
          h('h4', { class: 'fg-metal__label', id: `fg-metal-${metal.id}-${kind}` }, label),
          h('ul', { class: 'fg-medals', 'aria-labelledby': `fg-metal-${metal.id}-${kind}` }, list.map(card)),
        );
      };
      return h(
        'section',
        { class: 'fg-metal', 'data-metal': metal.id, 'aria-labelledby': `fg-metal-${metal.id}-titlu`, 'data-testid': `fg-metal-${metal.id}` },
        h(
          'div',
          { class: 'fg-metal__head' },
          h('span', { class: 'fg-metal__art', 'aria-hidden': 'true', html: visualSVG({ v: 'award', metal: metal.id }) }),
          h('h3', { class: 'fg-metal__title', id: `fg-metal-${metal.id}-titlu` }, metal.name),
          levelPill(metal.level),
          chip(`${mine.filter((m) => won.has(m.id)).length} din ${mine.length}`, 'fg-metal__count'),
        ),
        h('div', { class: 'fg-metal__groups' }, group('topic', 'Medaliile temelor'), group('extra', 'Medalii în plus')),
      );
    }),
  );
}

/** „Pentru părinți”: ultimele runde din toate temele, tipurile de exersat și ștergerea rundelor. */
function parentsBox(rounds) {
  const last = rounds.slice(-10).reverse();
  const practice = practiceFor(rounds);
  const title = (r) => `${topicConfig(r.topic)?.short ?? r.topic} · ${levelLabel(r.level)}`;
  return h(
    'details',
    { class: 'c-explain', 'data-testid': 'parents' },
    h('summary', {}, 'Pentru părinți'),
    h(
      'div',
      { class: 'c-explain__body' },
      h('p', { class: 'u-small u-muted' }, 'O stea înseamnă un copil sigur pe răspunsuri, trei stele unul sigur și foarte rapid; atingerile la întâmplare nu ajung la stele.'),
      last.length
        ? h(
            'ul',
            { class: 'c-history' },
            last.map((r) =>
              h(
                'li',
                { class: 'c-history__row' },
                h('span', {}, h('strong', {}, title(r)), ` — ${formatDateTime(r.at)} · ${alune(r.total)} · ${r.correct} corecte din ${r.correct + r.wrong}`),
                stars(r.stars ?? 0),
              ),
            ),
          )
        : h('p', { class: 'u-muted' }, 'Nu există runde salvate.'),
      practice.length ? h('p', {}, h('strong', {}, 'De exersat: '), practice.map((p) => `${p.label} (${p.correct} din ${p.total})`).join(' · ')) : null,
      rounds.length
        ? h('div', { class: 'l-cluster' }, clearHistoryButton({ label: 'Șterge rundele', title: 'Ștergi rundele?', text: 'Se șterg rundele, recordurile și medaliile de la Jocuri fulger, din toate temele.', testid: 'fg-clear', action: clearFulger }))
        : null,
    ),
  );
}

// ——— Runda ———

function roundPage(container, topic, lvl) {
  document.title = `Jocuri fulger · ${topic.short} · ${levelLabel(lvl.id)} — Cifruța`;
  document.body.classList.add('is-game');
  const pending = new Set(); // opririle numărătorii de la rezultate
  let arena = mountArena(container, {
    topic: topic.id,
    topicTitle: topic.short,
    level: lvl.id,
    best: getFulger().best[recordKey(topic.id, lvl.id)]?.alune ?? null,
    onEnd(summary) {
      arena?.destroy();
      arena = null;
      document.body.classList.remove('is-game');
      container.replaceChildren();
      window.scrollTo(0, 0);
      results(container, topic, lvl, summary, pending);
    },
  });
  if (new URLSearchParams(location.search).has('debug')) window.__dbg = { fulger: arena.debug };
  return () => {
    arena?.destroy();
    for (const stop of pending) stop();
    document.body.classList.remove('is-game');
    delete window.__dbg;
  };
}

// ——— Rezultatele ———

const STAR_WORDS = ['prima', 'a doua', 'a treia'];

/** De ce lipsește bonusul de precizie (null când s-a câștigat). */
function precisionHint(summary) {
  const { minAnswers, high } = config.precision;
  if (summary.precisionBonus) return null;
  const ratio = `${Math.round(high.from * 10)} din 10 corecte`;
  return summary.answered < minAnswers ? `de la ${minAnswers} răspunsuri, cu ${ratio}` : `cu ${ratio}`;
}

/** „Încă 12 alune și prinzi a doua stea.”: ținta pentru runda următoare. */
function targetLine(lvl, summary) {
  const next = nextStar(lvl, summary.total);
  if (!next || !summary.answered) return null;
  return h('p', { class: 'fg-target', 'data-testid': 'fg-next-star' }, `Încă ${alune(next.at - summary.total)} și prinzi ${STAR_WORDS[next.index]} stea.`);
}

/** Pasul următor în temă: după 3 stele, nivelul următor; fără nicio stea (din cel puțin 5 răspunsuri), nivelul mai ușor. */
function suggestion(topic, lvl, summary) {
  const i = topic.levels.indexOf(lvl);
  const target = summary.stars === 3 ? topic.levels[i + 1] : summary.stars === 0 && summary.answered >= 5 ? topic.levels[i - 1] : null;
  if (!target) return null;
  return h('a', { class: `c-btn c-btn--lg${summary.stars === 3 ? ' c-btn--accent' : ''}`, href: `#/fulger/${topic.id}/${target.id}`, 'data-testid': 'fg-suggest' }, `Încearcă nivelul ${levelLabel(target.id)}`);
}

/** Miniatura unui desen din „Greșelile tale” (o variantă-text rămâne text, scrisă întreg: „miercuri”, „10 iunie”). */
const mistakeArt = (spec, cls = 'fg-mistake__art') =>
  spec.v || spec.emoji ? h('span', { class: cls, 'aria-hidden': 'true', style: { '--ar': String(aspect(spec)) }, html: artHTML(spec) }) : h('span', {}, spec.alt ?? spec.text);
/** Desenul întrebării la „Greșelile tale”: graficele și hărțile ies mai mari, ca să se poată citi. */
const mistakeFigure = (spec) => mistakeArt(spec, `fg-mistake__fig${isChart(spec) ? ' fg-mistake__fig--chart' : ''}`);
const SEPARATORS = { asc: ' < ', desc: ' > ', path: ' → ' };

/** O greșeală: operația sau desenul, cu răspunsul corect evidențiat, și ce a ales copilul. */
function mistake({ question: q, given }) {
  const ok = (text) => h('strong', { class: 'fg-mistake__ok' }, text);
  const prompt = h('span', { class: 'fg-mistake__prompt', html: promptHTML(q.prompt) });
  if (q.figure && q.mode !== 'figure') {
    // comparare sau ordonare pe un desen: desenul rezolvat, comparația sau ordinea corectă, ce a ales copilul
    const shown = mistakeFigure(q.solved ?? q.figure);
    if (q.mode === 'compare') {
      const side = (list) => list.flatMap((spec, i) => (i ? [' + ', mistakeArt(spec)] : [mistakeArt(spec)]));
      const spoken = (list) => list.map(artName).join(' plus ');
      return h(
        'li',
        { class: 'fg-mistake fg-mistake--figure' },
        h(
          'span',
          { class: 'fg-mistake__line' },
          prompt,
          shown,
          ok([...side(q.left), ` ${q.answer} `, ...side(q.right), h('span', { class: 'u-visually-hidden' }, ` Răspunsul corect: ${spoken(q.left)} ${q.answer} ${spoken(q.right)}.`)]),
        ),
        h('span', { class: 'fg-mistake__note' }, `ai ales ${given}`),
      );
    }
    const name = (id) => artName(q.options[id]);
    const order = q.answer.flatMap((id, i) => (i ? [SEPARATORS[q.dir], mistakeArt(q.options[id])] : [mistakeArt(q.options[id])]));
    return h(
      'li',
      { class: 'fg-mistake fg-mistake--figure' },
      h('span', { class: 'fg-mistake__line' }, prompt, shown, ok([...order, h('span', { class: 'u-visually-hidden' }, ` Răspunsul corect: ${q.answer.map(name).join(', ')}.`)])),
      h('span', { class: 'fg-mistake__note' }, `ai atins ${name(given.at(-1))} în loc de ${name(q.answer[given.length - 1])}`),
    );
  }
  if (q.mode === 'figure') {
    const right = q.options[q.answer];
    const chosen = q.options[given];
    return h(
      'li',
      { class: 'fg-mistake fg-mistake--figure' },
      h(
        'span',
        { class: 'fg-mistake__line' },
        prompt,
        q.solved || q.figure ? mistakeFigure(q.solved ?? q.figure) : null,
        ok([mistakeArt(right), h('span', { class: 'u-visually-hidden' }, ` Răspunsul corect: ${artName(right)}.`)]),
      ),
      chosen ? h('span', { class: 'fg-mistake__note' }, 'ai ales ', mistakeArt(chosen), h('span', { class: 'u-visually-hidden' }, artName(chosen))) : null,
    );
  }
  const [line, note] =
    q.mode === 'choice'
      ? [[q.text, ' = ', ok(String(q.answer))], `ai ales ${given}`]
      : q.mode === 'compare'
        ? [[q.left, ' ', ok(q.answer), ' ', q.right], `ai ales ${given}`]
        : [[ok(q.answer.join(q.dir === 'asc' ? ' < ' : ' > '))], `ai atins ${given.at(-1)} în loc de ${q.answer[given.length - 1]}`];
  return h('li', { class: 'fg-mistake' }, h('span', { class: 'fg-mistake__line' }, line), h('span', { class: 'fg-mistake__note' }, note));
}

/** „Greșelile tale”: ultimele 5, ca rezultatul să învețe ceva, nu doar să numere. */
function mistakesSection(summary) {
  if (!summary.mistakes.length) return null;
  const shown = summary.mistakes.slice(-5);
  const more = summary.mistakes.length - shown.length;
  return h(
    'section',
    { class: 'fg-mistakes', 'data-testid': 'fg-mistakes' },
    h('h2', { class: 'fg-h2' }, summary.mistakes.length === 1 ? 'Greșeala ta' : 'Greșelile tale'),
    h('p', { class: 'u-small u-muted' }, 'Uită-te la răspunsul corect: data viitoare îl știi.'),
    h('ul', { class: 'fg-mistakes__list' }, shown.map(mistake)),
    more ? h('p', { class: 'u-small u-muted' }, `și încă ${cantitate(more, 'greșeală', 'greșeli')}`) : null,
  );
}

function results(container, topic, lvl, summary, pending) {
  const key = recordKey(topic.id, lvl.id);
  const before = getFulger();
  const at = new Date().toISOString();
  const last = before.rounds.filter((r) => r.topic === topic.id && r.level === lvl.id).at(-1)?.total ?? null;
  let saved = null;
  let earned = [];
  if (summary.answered > 0) {
    // se anunță doar medaliile noi; se salvează toate cele câștigate (și cele deduse din recordurile de dinainte), ca să urce cu runda
    const medals = medalsAfterRound(before, key, summary.total);
    earned = medals.fresh;
    const round = { topic: topic.id, level: lvl.id, at, total: summary.total, correct: summary.correct, wrong: summary.wrong, bestStreak: summary.bestStreak, fast: summary.fast, stars: summary.stars, byKind: summary.byKind };
    saved = saveFulgerRound(round, { keep: config.keepRounds, medals: medals.unsaved });
  }
  const reduced = prefersReducedMotion();
  const record = Boolean(saved?.record);
  const gain = last !== null ? summary.total - last : 0;

  const rows = [
    { icon: 'bravo', label: 'Răspunsuri corecte', value: summary.correct, suffix: ` din ${summary.answered}` },
    { nut: true, label: 'Alune din răspunsuri', value: summary.base },
    { icon: 'fulger', label: 'Bonus viteză', value: summary.speedBonus, prefix: '+' },
    { icon: 'foc', label: 'Bonus serie', value: summary.streakBonus, prefix: '+' },
    { icon: 'tinta', label: 'Bonus precizie', value: summary.precisionBonus, prefix: '+', hint: precisionHint(summary) },
  ].map((r) => {
    const num = h('span', {}, reduced ? String(r.value) : '0');
    const el = h(
      'li',
      { class: `fg-tally__row${reduced ? ' is-in' : ''}` },
      h(
        'span',
        { class: 'fg-tally__label' },
        h('span', { class: 'fg-tally__icon', 'aria-hidden': 'true', html: r.nut ? visualSVG({ v: 'alune', n: 1 }) : emojiHTML(r.icon) }),
        r.label,
        r.hint ? h('small', { class: 'u-muted' }, `(${r.hint})`) : null,
      ),
      h('span', { class: 'fg-tally__value' }, r.prefix ?? '', num, r.suffix ?? ''),
    );
    return { ...r, el, num };
  });
  const totalNum = h('span', { 'data-testid': 'fg-total' }, reduced ? String(summary.total) : '0');
  const total = h('div', { class: 'fg-total' }, h('span', { class: 'fg-total__art', 'aria-hidden': 'true', html: visualSVG({ v: 'alune', n: 3 }) }), totalNum, h('span', { class: 'u-visually-hidden' }, ' alune'));
  const starBox = stars(reduced ? summary.stars : 0, 3, { label: `${summary.stars} din 3 stele` });
  // în numărătoare: panglica are locul rezervat în card; mascota și medaliile stau sub butoane și apar pe rând
  const ribbon = record ? h('div', { class: `fg-ribbon${reduced ? '' : ' is-waiting'}`, 'data-testid': 'fg-record' }, saved.previous === null ? 'Primul tău record!' : 'Record nou!') : null;
  const medalEls = earned.map((m) => {
    const el = medalCard(m, { won: true, detailed: true });
    el.hidden = !reduced;
    return el;
  });
  const medalBox = medalEls.length
    ? h('section', { class: 'l-stack l-stack--sm fg-new-medals', hidden: !reduced, 'data-testid': 'fg-new-medals' }, h('h2', { class: 'fg-h2' }, medalEls.length === 1 ? 'Medalie nouă!' : 'Medalii noi!'), h('ul', { class: 'fg-medals' }, medalEls))
    : null;
  const reveal = (el) => {
    if (!el || !(el.hidden || el.classList.contains('is-waiting'))) return;
    el.hidden = false;
    el.classList.remove('is-waiting');
    el.classList.add('is-in');
  };

  const [mood, message] =
    summary.answered === 0
      ? ['incurajeaza', 'Timpul a trecut fără răspunsuri. Apasă „Mai joc o dată” când ești gata!']
      : record && saved.previous !== null
        ? ['sarbatoreste', `Record nou! Ai strâns ${alune(summary.total)}.`]
        : summary.stars === 3
          ? ['sarbatoreste', 'Trei stele! Ești fulgerul Cifruței!']
          : summary.stars > 0
            ? ['vesela', `Bravo! Ai prins ${cantitate(summary.stars, 'stea', 'stele')}.`]
            : gain > 0
              ? ['incurajeaza', `Ai strâns cu ${alune(gain)} mai mult decât data trecută!`]
              : ['incurajeaza', 'Fiecare rundă te face mai rapid. Mai încercăm?'];

  const again = h('button', { type: 'button', class: 'c-btn c-btn--primary c-btn--lg fg-again', 'data-testid': 'fg-again', onClick: () => refresh() }, 'Mai joc o dată');
  const kindRows = Object.entries(summary.byKind).map(([kind, k]) =>
    h('tr', {}, h('td', {}, KINDS[kind].label), h('td', {}, `${k.correct} din ${k.total}`), h('td', {}, `${formatNumber(k.ms / k.total / 1000)} s`)),
  );
  const card = h(
    'section',
    { class: 'fg-score-card', 'data-level': lvl.id, 'data-testid': 'fg-results' },
    h('h1', { class: 'fg-score-card__title' }, 'Gata, timpul a expirat!'),
    h('p', { class: 'u-small u-muted' }, topic.title),
    levelPill(lvl.id),
    h('ol', { class: 'fg-tally' }, rows.map((r) => r.el)),
    total,
    starBox,
    targetLine(lvl, summary),
    ribbon,
    !record && saved?.previous ? h('p', { class: 'u-muted' }, `Recordul tău: ${alune(saved.previous)}`) : null,
  );
  const buddy = mascot(mood, message, { center: true });
  buddy.classList.add('fg-results__buddy');
  buddy.hidden = !reduced;
  const mistakesBox = mistakesSection(summary);
  if (mistakesBox) mistakesBox.hidden = !reduced;
  container.append(
    h(
      'div',
      { class: 'l-container l-container--narrow l-stack l-stack--lg fg-results' },
      card,
      saved && !saved.saved ? callout('warn', 'capcana', 'Runda nu s-a putut salva în acest browser (stocare plină sau blocată).') : null,
      h('div', { class: 'l-cluster l-cluster--center' }, again, suggestion(topic, lvl, summary) ?? h('a', { class: 'c-btn c-btn--lg', href: `#/fulger/${topic.id}`, 'data-testid': 'fg-levels' }, 'Alt nivel')),
      summary.answered ? boardLink(`fulger/${topic.id}/${lvl.id}/week`, { row: 'center' }) : null,
      buddy,
      medalBox,
      summary.answered
        ? h(
            'div',
            { class: 'l-cluster l-cluster--center' },
            chip(`Cea mai lungă serie: ${summary.bestStreak}`, '', 'foc'),
            chip(cantitate(summary.fast, 'fulger', 'fulgere'), '', 'fulger'),
            last !== null ? chip(`Data trecută: ${alune(last)}`, '', 'steag') : null,
          )
        : null,
      mistakesBox,
      summary.answered
        ? h(
            'details',
            { class: 'c-explain', 'data-testid': 'parents' },
            h('summary', {}, 'Pentru părinți'),
            h(
              'div',
              { class: 'c-explain__body' },
              h('p', { class: 'u-small u-muted' }, 'Pe tipuri de întrebări: răspunsurile corecte și timpul mediu de gândire (fără pauze).'),
              h('div', { class: 'fg-table-wrap' }, h('table', { class: 'fg-table' }, h('thead', {}, h('tr', {}, h('th', {}, 'Întrebări'), h('th', {}, 'Corecte'), h('th', {}, 'Timp mediu'))), h('tbody', {}, kindRows))),
            ),
          )
        : null,
    ),
  );

  if (reduced) {
    again.focus({ preventScroll: true });
    return;
  }

  // numărătoarea de arcade: rândurile, totalul, stelele, recordul, medaliile; o atingere sare direct la final
  const ids = [];
  let t = 300;
  const step = (fn, gap) => {
    ids.push(setTimeout(fn, t));
    t += gap;
  };
  for (const r of rows) {
    step(() => {
      r.el.classList.add('is-in');
      countUp(r.num, r.value, 320);
      if (r.value > 0) play('tap');
    }, 380);
  }
  step(() => {
    countUp(totalNum, summary.total, 800);
    pop(total, 'anim-pop');
  }, 950);
  for (let i = 0; i < summary.stars; i++) {
    step(() => {
      starBox.children[i].classList.add('is-on', 'is-stamped');
      play('star');
    }, 320);
  }
  step(() => reveal(buddy), 350);
  if (ribbon) {
    step(() => {
      reveal(ribbon);
      play('win');
      confetti({ count: 90 });
    }, 550);
  }
  // medalia unei teme se întoarce ca o carte; o medalie în plus (aceeași medalie la mai multe teme) vine cu fanfară și confetti
  for (const [i, el] of medalEls.entries()) {
    const extra = earned[i].kind === 'extra';
    step(() => {
      reveal(medalBox);
      reveal(el);
      play(extra ? 'combo' : 'level');
      if (extra) confetti({ count: 50 });
    }, extra ? 650 : 450);
  }
  step(() => end(), 0);

  function end() {
    stop();
    for (const r of rows) {
      r.el.classList.add('is-in');
      countUp(r.num, r.value, 0, r.value);
    }
    countUp(totalNum, summary.total, 0, summary.total);
    [...starBox.children].forEach((s, i) => s.classList.toggle('is-on', i < summary.stars));
    for (const el of [ribbon, buddy, mistakesBox, medalBox, ...medalEls]) reveal(el);
    again.focus({ preventScroll: true });
  }
  function skip(e) {
    if (e.type === 'keydown' && !['Enter', ' ', 'Escape'].includes(e.key)) return;
    if (e.type === 'keydown') e.preventDefault();
    end();
  }
  function stop() {
    for (const id of ids) clearTimeout(id);
    container.removeEventListener('pointerdown', skip);
    document.removeEventListener('keydown', skip);
    pending.delete(stop);
  }
  container.addEventListener('pointerdown', skip);
  document.addEventListener('keydown', skip);
  pending.add(stop);
}
