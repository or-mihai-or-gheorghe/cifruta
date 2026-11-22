// Jocuri fulger: „Greșelile tale” de la rezultate (ultimele 5 greșeli, cu răspunsul corect evidențiat și ce a ales copilul), pentru
// rundele din Jocuri fulger (pages/fulger.js) și pentru tabla în 2 minute din Învață (js/invata/game.js).

import { h } from '../core/dom.js';
import { cantitate } from '../core/ro.js';
import { artHTML, artName, aspect, boxParts, isChart, promptHTML } from './art.js';

/** Miniatura unui desen din „Greșelile tale” (o variantă-text rămâne text, scrisă întreg: „miercuri”, „10 iunie”). */
const mistakeArt = (spec, cls = 'fg-mistake__art') =>
  spec.v || spec.emoji
    ? h('span', { class: cls, 'aria-hidden': 'true', style: { '--ar': String(aspect(spec)) }, html: artHTML(spec) })
    : spec.frac
      ? h('span', { html: artHTML(spec) })
      : h('span', {}, spec.alt ?? spec.text);
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
      // la „Care calcul e greșit?”, răspunsul e chiar calculul greșit: alături stă calculul corect
      q.fix ? h('span', { class: 'fg-mistake__note' }, `corect: ${q.fix}`) : null,
      chosen ? h('span', { class: 'fg-mistake__note' }, 'ai ales ', mistakeArt(chosen), h('span', { class: 'u-visually-hidden' }, artName(chosen))) : null,
    );
  }
  // la o ecuație cu căsuța, răspunsul stă chiar în căsuță: „[8] + 7 = 15”
  const box = q.mode === 'choice' && boxParts(q.text);
  const [line, note] = box
    ? [[box[0], ok(String(q.answer)), box[1]], `ai ales ${given}`]
    : q.mode === 'choice'
      ? [[q.text, ' = ', ok(String(q.answer))], `ai ales ${given}`]
      : q.mode === 'compare'
        ? [[q.left, ' ', ok(q.answer), ' ', q.right], `ai ales ${given}`]
        : [[ok(q.answer.join(q.dir === 'asc' ? ' < ' : ' > '))], `ai atins ${given.at(-1)} în loc de ${q.answer[given.length - 1]}`];
  return h('li', { class: 'fg-mistake' }, h('span', { class: 'fg-mistake__line' }, line), h('span', { class: 'fg-mistake__note' }, note));
}

/** „Greșelile tale”: ultimele 5, ca rezultatul să învețe ceva, nu doar să numere. */
export function mistakesSection(summary) {
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
