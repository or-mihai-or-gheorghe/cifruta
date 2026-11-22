// Învață: ecuația pas cu pas (logica, pură), din capitolul „Ecuații cu x”: a × x + b = c sau a × x − b = c. Copilul alege ce devine
// fiecare termen dincolo de egal: întâi b (+ b devine − b, − b devine + b: „trecerea în partea cealaltă”), apoi factorul (× a devine : a:
// împărțirea). Glisorul alege x, iar proba îl verifică pe loc. Cu o poveste (`story`), primul pas e ecuația ei, aleasă dintre trei (cu a
// și b schimbate între ele, cu semnul întors); până atunci ecuația, proba și textul citit nu se arată, ca să nu dea răspunsul. O alegere
// greșită lasă pasul pe loc și spune greșeala tipică. Starea se schimbă doar prin apply(); vederea (view.js) desenează rândurile.

import { cantitate } from '../../../core/ro.js';
import { NBSP, spokenMath } from '../../text.js';

export const QUANTITIES = ['written', 'moved', 'divided', 'x', 'solved'];
/** Glisorul lui x: 11 valori, de la `lo`. */
export const SPAN = 10;

/** „3 × x + 4 = 19” → { a, b, op, c, rest: 15, value: 5 }; null dacă ecuația nu e de forma a × x ± b = c, cu numere naturale. */
export function parseStep(eq) {
  const m = /^(\d+) × x ([+−]) (\d+) = (\d+)$/.exec(String(eq ?? ''));
  if (!m) return null;
  const [a, b, c] = [Number(m[1]), Number(m[3]), Number(m[4])];
  const rest = m[2] === '+' ? c - b : c + b;
  return { a, b, c, op: m[2], rest, value: rest / a };
}

const flip = (op) => (op === '+' ? '−' : '+');
const tight = (text) => text.replace(/ ([+−=<>×:]) /g, `${NBSP}$1${NBSP}`);
const OP_WORDS = { '+': 'plus', '−': 'minus', '×': 'ori', ':': 'împărțit la' };
/** Ordinea variantelor vine din ecuație (aceeași la fiecare montare), ca varianta bună să nu stea mereu pe același loc. */
const turn = (list, seed) => {
  const k = seed % list.length;
  return [...list.slice(k), ...list.slice(0, k)];
};

/**
 * Variantele pasului de acum, fiecare { text, say, ok, why }: ecuația poveștii (cea bună, cu a și b schimbate, cu semnul întors), ce
 * devine b dincolo de egal (cu semnul schimbat sau nu), apoi ce devine factorul (: a, × a sau − a). După împărțire, nicio variantă.
 */
export function choices(s) {
  const e = parseStep(s.eq);
  const term = (op, k, ok, why) => ({ text: `${op} ${k}`, say: `${OP_WORDS[op]} ${k}`, ok, why });
  if (!s.written) {
    const options = [
      { text: s.eq, ok: true, why: null },
      // a și b schimbate între ele; dacă sunt egale, b trecut dincolo cu semnul neschimbat
      { text: e.a !== e.b ? `${e.b} × x ${e.op} ${e.a} = ${e.c}` : `${e.a} × x = ${e.c} ${e.op} ${e.b}`, ok: false, why: 'swap' },
      { text: `${e.a} × x ${flip(e.op)} ${e.b} = ${e.c}`, ok: false, why: 'sign' },
    ].map((o) => ({ ...o, say: spokenMath(o.text) }));
    return turn(options, e.a + e.b + e.c);
  }
  if (!s.moved) return turn([term(flip(e.op), e.b, true, null), term(e.op, e.b, false, 'keep')], e.b + e.c);
  if (!s.divided) return turn([term(':', e.a, true, null), term('×', e.a, false, 'times'), term('−', e.a, false, 'minus')], e.a + e.c);
  return [];
}

/** Întrebarea pasului de acum, deasupra variantelor (după împărțire: glisorul; nimic, după ce proba iese). */
export function prompt(s) {
  const e = parseStep(s.eq);
  if (!s.written) return 'Care ecuație spune povestea?';
  if (!s.moved) return `Ce devine ${e.op} ${e.b} dincolo de egal?`;
  if (!s.divided) return `Ce devine ${e.a} × dincolo de egal?`;
  return s.x === e.value ? '' : `Cât e ${e.rest} : ${e.a}? Pune x pe glisor.`;
}

/** Ce spune Cifruța după o alegere greșită: greșeala tipică, cu motivul. */
const WRONG = {
  swap: () => 'Încă nu: numărul dinaintea lui x spune câte lucruri la fel sunt.',
  sign: () => 'Încă nu: gândește-te dacă în poveste se adaugă ceva sau se ia.',
  keep: (e) =>
    e.op === '+'
      ? `Încă nu: dincolo de egal, + ${e.b} devine − ${e.b}, ca la balanță, unde iei ${e.b} din ambele părți.`
      : `Încă nu: dincolo de egal, − ${e.b} devine + ${e.b}: pui la loc cei ${e.b} în ambele părți.`,
  times: (e) => `Încă nu: ${e.a} × x înseamnă de ${e.a} ori x, deci ca să afli x împarți la ${e.a}.`,
  minus: (e) => `Încă nu: nu scazi ${e.a}. ${e.a} × x înseamnă de ${e.a} ori x, deci împarți la ${e.a}.`,
};

export default {
  QUANTITIES,
  // nimic de ascuns: la o poveste, ecuația se arată abia după ce copilul o alege
  hideable: () => [],

  check(p) {
    const e = parseStep(p.eq);
    if (!e) return [`ecuație greșită „${p.eq}” (3 × x + 4 = 19 sau 4 × x − 3 = 17)`];
    const errors = [];
    const lo = p.lo ?? 0;
    if (e.a < 2 || e.a > 9) errors.push('factorul lui x e între 2 și 9');
    if (e.b < 1) errors.push('numărul adunat sau scăzut e cel puțin 1');
    if (!Number.isInteger(lo) || lo < 0) errors.push('„lo” e un număr natural');
    if (!(e.rest > 0) || !Number.isInteger(e.value)) errors.push(`x nu e număr natural în „${p.eq}”`);
    else if (e.value < lo || e.value > lo + SPAN) errors.push(`x (${e.value}) nu e pe glisor (${lo}–${lo + SPAN})`);
    if (p.story) {
      const st = p.story;
      if (typeof st.text !== 'string' || !st.text || st.text.length > 120) errors.push('povestea are un text de cel mult 120 de caractere');
      if (typeof st.explain !== 'string' || !st.explain || st.explain.length > 140) errors.push('povestea are o explicație de cel mult 140 de caractere');
      if (typeof st.answer !== 'string' || !st.answer) errors.push('povestea are începutul răspunsului („Un creion costă”)');
      if (!Array.isArray(st.unit) || st.unit.length !== 2 || !st.unit.every((u) => typeof u === 'string' && u)) errors.push('povestea are unitatea, la singular și la plural');
      if (typeof st.icon !== 'string' || !st.icon) errors.push('povestea are o iconiță');
      const texts = choices({ eq: p.eq, written: false }).map((c) => c.text);
      if (new Set(texts).size !== texts.length) errors.push(`variantele ecuației se repetă (${texts.join('; ')})`);
    }
    return errors;
  },

  controls: (p, s) => [{ id: 'x', min: s.lo, max: s.lo + SPAN, axis: 'cols' }],

  initial: (p) => ({ eq: p.eq, story: p.story ?? null, lo: p.lo ?? 0, written: !p.story, moved: false, divided: false, x: p.lo ?? 0, wrong: null }),

  actions(p, s) {
    const list = [];
    for (let v = s.lo; v <= s.lo + SPAN; v++) if (v !== s.x) list.push({ set: 'x', value: v });
    choices(s).forEach((_, i) => list.push({ choose: i }));
    return list;
  },

  apply(p, s, a) {
    if (a.set === 'x') return { ...s, x: Math.min(s.lo + SPAN, Math.max(s.lo, Math.round(a.value))), wrong: null };
    if (a.choose === undefined) return s;
    const c = choices(s)[a.choose];
    if (!c) return s;
    if (!c.ok) return { ...s, wrong: c.why };
    if (!s.written) return { ...s, written: true, wrong: null };
    if (!s.moved) return { ...s, moved: true, wrong: null };
    return { ...s, divided: true, wrong: null };
  },

  derive(p, s) {
    const e = parseStep(s.eq);
    return { written: s.written, moved: s.moved, divided: s.divided, x: s.x, solved: s.divided && s.x === e.value };
  },

  /**
   * Textele: `equation` (rândul de acum, sus; „?” cât timp povestea n-are ecuația aleasă), `lines` (rândurile rezolvării: ecuația, după
   * trecere, după împărțire, proba; null cât nu s-au făcut), `reading` (pasul de făcut sau greșeala), `legend`, `extra` (la final:
   * răspunsul în cuvintele poveștii sau proba) și `spoken`.
   */
  texts(p, s) {
    const e = parseStep(s.eq);
    const shown = s.written;
    const value = e.a * s.x + (e.op === '+' ? e.b : -e.b);
    const sign = value === e.c ? '=' : value < e.c ? '<' : '>';
    const solved = s.divided && s.x === e.value;
    const out = {};
    out.equation = !shown ? '?' : !s.moved ? tight(s.eq) : !s.divided ? tight(`${e.a} × x = ${e.rest}`) : tight(`x = ${e.rest} : ${e.a}${solved ? ` = ${e.value}` : ''}`);
    out.lines = {
      eq: shown ? tight(s.eq) : null,
      moved: s.moved ? tight(`${e.a} × x = ${e.c} ${flip(e.op)} ${e.b} = ${e.rest}`) : null,
      divided: s.divided ? tight(`x = ${e.rest} : ${e.a}${solved ? ` = ${e.value}` : ''}`) : null,
      proba: shown ? tight(`Proba: ${e.a} × ${s.x} ${e.op} ${e.b} ${sign} ${e.c}`) : null,
    };
    out.legend = [['cols', `x = ${s.x}`]];
    // citirea e și începutul lui „Bravo!” („citire: ecuație”), deci spune ce s-a întâmplat, nu întreabă (întrebarea pasului stă
    // deasupra variantelor, `prompt`)
    out.reading = s.wrong
      ? WRONG[s.wrong](e)
      : !shown
        ? 'Citește povestea și alege ecuația ei.'
        : !s.moved
          ? (s.story?.explain ?? 'Ca la balanță: ce iei dintr-o parte iei și din cealaltă.')
          : !s.divided
            ? `${e.op} ${e.b} a trecut dincolo de egal și a devenit ${flip(e.op)} ${e.b}.`
            : solved
              ? 'Proba iese.'
              : `Factorul ${e.a} a trecut dincolo ca împărțire.`;
    if (solved) out.extra = s.story ? `${s.story.answer} ${cantitate(e.value, s.story.unit[0], s.story.unit[1])}.` : `${tight(`Proba: ${e.a} × ${e.value} ${e.op} ${e.b} = ${e.c}`)}.`;
    out.spoken = shown ? `${out.reading} ${spokenMath(out.equation)}` : out.reading;
    return out;
  },
};
