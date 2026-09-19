// Jocuri fulger: tipurile temei „Grafice și tabele”. Fiecare întrebare are un desen de date (visuals/grafice.js), un răspuns calculat
// din date și un `ask` declarativ (ce se întreabă, despre ce), din care regulile din tests/fulger-grafice.rules.js găsesc singure
// răspunsul. Numerele de citit sau de adunat merg până la 20 la tipurile ușoare și până la 100 la celelalte (comparările și ordonările
// compară doar înălțimi); valorile stau pe liniile grilei (cu jumătăți doar la `bare-scara`), iar maximul și minimul sunt unice când
// se întreabă de ele. Comparările și ordonările au desenul deasupra
// (`drawn: true`): la ele cerința e o legendă scurtă, iar operanzii stau în rândul de răspuns.

import { cantitate } from '../core/ro.js';
import { DAYS } from '../visuals/grafice.js';
import { CHILD, COUNT_SETS, cate, dateOption, dayOption, DAY_SERIES, MONTHS, multe, NAMES, PAIR_SERIES, VENN_SETS, VOTE, VOTE_SETS, WEEK } from './contexte.js';
import { drawnCompare, drawnSort, numberQuestion, pickQuestion } from './intrebari.js';
import { distinct, int, pickOne, shuffle } from './rand.js';

const BARE = 'mat.log.grafic-bare';
const PICTO = 'mat.log.pictograma';
const TABEL = 'mat.log.tabel';
const VENN = 'mat.log.venn';
const CERC = 'mat.log.diagrama-cerc';
const LINIE = 'mat.log.grafic-linie';
const COMPARARE = 'mat.nr100.comparare';
const ORDONARE = 'mat.nr100.ordonare';
const REPETATA = 'mat.nr100.adunare-repetata';
const MAI_MULT = 'mat.pb.mai-mult-mai-putin';
const O_OP = 'mat.pb.o-operatie';
const NECUNOSCUT = 'mat.op.necunoscut';

const sum = (list) => list.reduce((s, x) => s + x, 0);
const catOf = (it) => ({ id: it.id, emoji: it.emoji, name: it.name });
const catOption = (it) => ({ emoji: it.emoji, alt: it.name });
/** `n` multipli diferiți ai pasului, între un pas și `lines` pași (valorile stau pe liniile grilei). */
const onLines = (rand, n, step, lines, from = 1) => distinct(rand, n, from, lines).map((k) => k * step);

/** Categoriile unui grafic cu bare: fie lucruri numărate (mere, oi), fie voturi pentru un preferat (câinele, înghețata). */
function categories(rand, n) {
  if (rand() < 0.5) {
    const set = pickOne(rand, COUNT_SETS);
    const items = shuffle(rand, set.items).slice(0, n);
    return {
      items,
      unit: set.total,
      value: (it) => `${cate(it.f)} ${it.name} ${set.where}?`,
      sum: (a, b) => `${cate(a.f)} ${a.name} și ${b.name} ${set.where}?`,
      total: `Câte ${set.total[1]} ${set.where} în total?`,
      diff: (a, b) => `Cu ${cate(a.f).toLowerCase()} ${a.name} sunt ${multe(a.f)} decât ${b.name}?`,
      missing: (t, it) => `${set.totalLine(t)} ${cate(it.f)} sunt ${it.name}?`,
      most: set.most,
      least: set.least,
    };
  }
  const set = pickOne(rand, VOTE_SETS);
  const items = shuffle(rand, set.items).slice(0, n);
  return {
    items,
    unit: VOTE,
    value: (it) => `Câte voturi a primit ${it.the}?`,
    sum: (a, b) => `Câte voturi au primit ${a.the} și ${b.the}?`,
    total: 'Câte voturi s-au dat în total?',
    diff: (a, b) => `Cu câte voturi mai mult a primit ${a.the} decât ${b.the}?`,
    missing: (t, it) => `S-au dat ${cantitate(t, 'vot', 'voturi')}. Câte a primit ${it.the}?`,
    most: 'Ce a primit cele mai multe voturi?',
    least: 'Ce a primit cele mai puține voturi?',
  };
}

const barsFigure = ({ cats, values, step, unit, hide, month }) => ({
  v: 'chart-bars',
  cats,
  series: [{ id: 's', values }],
  step,
  unit,
  ...(hide && { hide }),
  ...(month && { month }),
});
const marked = (figure, mark) => ({ ...figure, mark });

/** Valorile unei serii pe zile, pe liniile grilei; `uniqueTop` cere un maxim și un minim unice. */
function dayValues(rand, n, step, lines) {
  return Array.from({ length: n }, () => int(rand, 1, lines) * step);
}

const lineFigure = ({ days, dates, month, series, step, unit }) => ({
  v: 'chart-line',
  ...(days ? { days } : { dates, month }),
  series,
  step,
  unit,
});

// variantele-zi și variantele-dată stau în ordinea din calendar, nu amestecate
const DAY_ORDER = Object.values(DAYS).map(([short]) => short);
const byDay = (o) => DAY_ORDER.indexOf(o.text);
const byDate = (o) => Number(o.text);

const consecutive = (rand, n) => {
  const start = int(rand, 1, 28 - n);
  return Array.from({ length: n }, (_, i) => start + i);
};

export const CHART_KINDS = {
  // ——— Ușor ———
  pictograma: {
    label: 'Pictograme: citește și compară',
    points: 1,
    fastMs: 4000,
    mode: 'figure',
    promptMax: 60,
    concepts: [PICTO],
    generate(rand) {
      for (;;) {
        const values = distinct(rand, 3, 1, 8);
        // doar „cele mai multe”: o variantă din afara desenului are 0, deci la „cele mai puține” ar fi și ea un răspuns bun
        const variant = pickOne(rand, ['value', 'value', 'most']);
        const byNames = rand() < 0.5;
        if (byNames) {
          const fruit = pickOne(rand, COUNT_SETS[0].items);
          const names = shuffle(rand, NAMES.flat()).slice(0, 3);
          const rows = names.map((n) => ({ id: n.toLowerCase(), name: n }));
          const figure = { v: 'chart-picto', rows, values, symbol: fruit.emoji, each: 1, unit: [fruit.sg, fruit.name] };
          if (variant === 'value') {
            const i = int(rand, 0, 2);
            return numberQuestion('pictograma', rand, {
              prompt: `Câte ${fruit.name} a cules ${names[i]}?`,
              figure,
              solved: marked(figure, [rows[i].id]),
              key: `n:${fruit.id}:${names.join(',')}:${values.join(',')}:${i}`,
              answer: values[i],
              typical: [...values.filter((_, j) => j !== i), values[i] + 1, values[i] - 1],
              min: 0,
              max: 12,
              ask: { op: 'value', row: rows[i].id },
            });
          }
          const i = values.indexOf(Math.max(...values));
          const others = rows.filter((_, j) => j !== i).map((r) => ({ text: r.name }));
          const extra = shuffle(rand, NAMES.flat().filter((n) => !names.includes(n)))[0];
          return pickQuestion('pictograma', rand, {
            prompt: `Cine a cules cele mai multe ${fruit.name}?`,
            figure,
            solved: marked(figure, [rows[i].id]),
            key: `nmost:${fruit.id}:${names.join(',')}:${values.join(',')}`,
            answer: { text: rows[i].name },
            distractors: [...others, { text: extra }],
            ask: { op: 'max' },
          });
        }
        const set = pickOne(rand, COUNT_SETS);
        const items = shuffle(rand, set.items).slice(0, 3);
        const figure = { v: 'chart-picto', rows: items.map(catOf), values, each: 1, unit: set.total };
        if (variant === 'value') {
          const i = int(rand, 0, 2);
          return numberQuestion('pictograma', rand, {
            prompt: `${cate(items[i].f)} ${items[i].name} ${set.where}?`,
            figure,
            solved: marked(figure, [items[i].id]),
            key: `c:${items.map((x) => x.id).join(',')}:${values.join(',')}:${i}`,
            answer: values[i],
            typical: [...values.filter((_, j) => j !== i), values[i] + 1, values[i] - 1],
            min: 0,
            max: 12,
            ask: { op: 'value', row: items[i].id },
          });
        }
        const i = values.indexOf(Math.max(...values));
        const outside = shuffle(rand, set.items.filter((x) => !items.includes(x)))[0];
        const q = pickQuestion('pictograma', rand, {
          prompt: set.most,
          figure,
          solved: marked(figure, [items[i].id]),
          key: `cmost:${items.map((x) => x.id).join(',')}:${values.join(',')}`,
          answer: catOption(items[i]),
          distractors: [...items.filter((_, j) => j !== i).map(catOption), catOption(outside)],
          ask: { op: 'max' },
        });
        if (q) return q;
      }
    },
  },

  'bare-citire': {
    label: 'Grafice cu bare: citește o bară',
    points: 1,
    fastMs: 4500,
    mode: 'figure',
    promptMax: 60,
    concepts: [BARE],
    generate(rand) {
      for (;;) {
        const n = int(rand, 3, 4);
        const ctx = categories(rand, n);
        const step = pickOne(rand, [1, 2]);
        const values = onLines(rand, n, step, 7);
        const figure = barsFigure({ cats: ctx.items.map(catOf), values, step, unit: ctx.unit });
        const variant = pickOne(rand, ['value', 'value', 'value', 'most', 'least']);
        if (variant === 'value') {
          const i = int(rand, 0, n - 1);
          return numberQuestion('bare-citire', rand, {
            prompt: ctx.value(ctx.items[i]),
            figure,
            solved: marked(figure, [{ cat: ctx.items[i].id }]),
            key: `v:${ctx.items.map((x) => x.id).join(',')}:${values.join(',')}:${i}`,
            answer: values[i],
            typical: [...values.filter((_, j) => j !== i), values[i] - step, values[i] + step],
            max: 20,
            ask: { op: 'value', cat: ctx.items[i].id },
          });
        }
        const pick = variant === 'most' ? Math.max(...values) : Math.min(...values);
        const i = values.indexOf(pick);
        const q = pickQuestion('bare-citire', rand, {
          prompt: variant === 'most' ? ctx.most : ctx.least,
          figure,
          solved: marked(figure, [{ cat: ctx.items[i].id }]),
          key: `${variant}:${ctx.items.map((x) => x.id).join(',')}:${values.join(',')}`,
          answer: catOption(ctx.items[i]),
          distractors: ctx.items.filter((_, j) => j !== i).map(catOption),
          ask: { op: variant === 'most' ? 'max' : 'min' },
        });
        if (q) return q;
      }
    },
  },

  'grafic-compara': {
    label: 'Compară două valori de pe grafic',
    points: 1,
    fastMs: 4000,
    mode: 'compare',
    drawn: true,
    promptMax: 24,
    concepts: [BARE, LINIE, COMPARARE],
    generate(rand) {
      const rel = pickOne(rand, ['<', '=', '>']);
      const roll = rand();
      // două valori cu relația aleasă: egale sau diferite, cu cea mai mare în stânga sau în dreapta
      const pair = (lo, hi) => {
        if (rel === '=') {
          const v = int(rand, lo, hi);
          return [v, v];
        }
        const [x, y] = distinct(rand, 2, lo, hi).sort((a, b) => a - b);
        return rel === '<' ? [x, y] : [y, x];
      };
      if (roll < 0.4) {
        const n = int(rand, 3, 4);
        const ctx = categories(rand, n);
        const step = pickOne(rand, [1, 2, 5]);
        const [a, b] = [0, 1];
        const [va, vb] = pair(1, 7);
        const rest = distinct(rand, n - 2, 1, 7);
        const values = [va, vb, ...rest].map((k) => k * step);
        const order = shuffle(rand, ctx.items.map((_, i) => i));
        const items = order.map((i) => ctx.items[i]);
        const vals = order.map((i) => values[i]);
        const [ia, ib] = [order.indexOf(a), order.indexOf(b)];
        const figure = barsFigure({ cats: items.map(catOf), values: vals, step, unit: ctx.unit });
        return drawnCompare('grafic-compara', {
          prompt: 'Compară:',
          figure,
          solved: marked(figure, [{ cat: items[ia].id }, { cat: items[ib].id }]),
          left: [catOption(items[ia])],
          right: [catOption(items[ib])],
          lv: vals[ia],
          rv: vals[ib],
          key: `b:${items.map((x) => x.id).join(',')}:${vals.join(',')}:${ia}${ib}`,
          ask: { op: 'cmp', a: [{ cat: items[ia].id }], b: [{ cat: items[ib].id }] },
        });
      }
      if (roll < 0.65) {
        const ctx = pickOne(rand, DAY_SERIES);
        const step = pickOne(rand, ctx.steps);
        const values = dayValues(rand, 5, step, 6);
        const [da, db] = shuffle(rand, [0, 1, 2, 3, 4]).slice(0, 2);
        const [va, vb] = pair(1, 6).map((k) => k * step);
        values[da] = va;
        values[db] = vb;
        const figure = lineFigure({ days: WEEK, series: [{ id: 's', values }], step, unit: ctx.unit });
        return drawnCompare('grafic-compara', {
          prompt: 'Compară zilele:',
          figure,
          solved: marked(figure, [{ x: WEEK[da] }, { x: WEEK[db] }]),
          left: [dayOption(WEEK[da])],
          right: [dayOption(WEEK[db])],
          lv: va,
          rv: vb,
          key: `z:${ctx.id}:${values.join(',')}:${da}${db}`,
          ask: { op: 'cmp', a: [{ x: WEEK[da] }], b: [{ x: WEEK[db] }] },
        });
      }
      if (roll < 0.85) {
        const ctx = pickOne(rand, PAIR_SERIES);
        const [na, nb] = pickOne(rand, NAMES);
        const month = pickOne(rand, MONTHS);
        const dates = consecutive(rand, 5);
        const step = pickOne(rand, ctx.steps);
        const [sa, sb] = [dayValues(rand, 5, step, 6), dayValues(rand, 5, step, 6)];
        const d = int(rand, 0, 4);
        const [va, vb] = pair(1, 6).map((k) => k * step);
        sa[d] = va;
        sb[d] = vb;
        const series = [{ id: 'a', name: na, values: sa }, { id: 'b', name: nb, values: sb }];
        const figure = lineFigure({ dates, month, series, step, unit: ctx.unit });
        return drawnCompare('grafic-compara', {
          prompt: `Pe ${dates[d]} ${month}:`,
          figure,
          solved: marked(figure, [{ s: 'a', x: dates[d] }, { s: 'b', x: dates[d] }]),
          left: [{ text: na }],
          right: [{ text: nb }],
          lv: va,
          rv: vb,
          key: `d:${ctx.id}:${sa.join(',')}|${sb.join(',')}:${d}`,
          ask: { op: 'cmp', a: [{ s: 'a', x: dates[d] }], b: [{ s: 'b', x: dates[d] }] },
        });
      }
      // sume: două bare față de una
      const ctx = categories(rand, 3);
      const step = pickOne(rand, [1, 2]);
      const [left, right] = pair(3, 7);
      const x = int(rand, 1, left - 1);
      const values = [x, left - x, right].map((k) => k * step);
      const order = shuffle(rand, [0, 1, 2]);
      const items = order.map((i) => ctx.items[i]);
      const vals = order.map((i) => values[i]);
      const [ia, ib, ic] = [order.indexOf(0), order.indexOf(1), order.indexOf(2)];
      const figure = barsFigure({ cats: items.map(catOf), values: vals, step, unit: ctx.unit });
      return drawnCompare('grafic-compara', {
        prompt: 'Compară:',
        figure,
        solved: marked(figure, [{ cat: items[ia].id }, { cat: items[ib].id }, { cat: items[ic].id }]),
        left: [catOption(items[ia]), catOption(items[ib])],
        right: [catOption(items[ic])],
        lv: vals[ia] + vals[ib],
        rv: vals[ic],
        key: `s:${items.map((i) => i.id).join(',')}:${vals.join(',')}:${ia}${ib}${ic}`,
        ask: { op: 'cmp', a: [{ cat: items[ia].id }, { cat: items[ib].id }], b: [{ cat: items[ic].id }] },
      });
    },
  },

  tabel: {
    label: 'Tabele cu numere și bețișoare',
    points: 2,
    fastMs: 5000,
    mode: 'figure',
    promptMax: 60,
    concepts: [TABEL],
    generate(rand) {
      if (rand() < 0.5) {
        const set = pickOne(rand, VOTE_SETS);
        const items = shuffle(rand, set.items).slice(0, 3);
        const values = distinct(rand, 3, 3, 19);
        const figure = { v: 'chart-table', cols: ['Preferat', 'Voturi'], rows: items.map((it, i) => ({ id: it.id, emoji: it.emoji, name: it.name, cells: [{ tally: values[i] }] })) };
        const i = int(rand, 0, 2);
        return numberQuestion('tabel', rand, {
          prompt: `Câte voturi a primit ${items[i].the}?`,
          figure,
          solved: { ...figure, mark: [{ r: items[i].id, c: 0 }] },
          key: `t:${items.map((x) => x.id).join(',')}:${values.join(',')}:${i}`,
          answer: values[i],
          typical: [values[i] - 5, values[i] + 5, values[i] - 1, values[i] + 1, ...values],
          max: 25,
          ask: { op: 'value', row: items[i].id, col: 0 },
        });
      }
      const names = shuffle(rand, NAMES.flat()).slice(0, 3);
      const days = WEEK.slice(0, 3);
      const grid = names.map(() => distinct(rand, 3, 1, 9));
      const figure = { v: 'chart-table', cols: ['', ...days.map((d) => DAYS[d][0])], rows: names.map((n, r) => ({ id: n.toLowerCase(), name: n, cells: grid[r] })) };
      const [r, c] = [int(rand, 0, 2), int(rand, 0, 2)];
      return numberQuestion('tabel', rand, {
        prompt: `Câte cărți a citit ${names[r]} ${DAYS[days[c]][1]}?`,
        figure,
        solved: { ...figure, mark: [{ r: names[r].toLowerCase(), c }] },
        key: `g:${names.join(',')}:${grid.flat().join(',')}:${r}${c}`,
        answer: grid[r][c],
        typical: [...grid[r], ...grid.map((row) => row[c]), grid[c]?.[r]].filter((x) => x !== undefined),
        min: 0,
        max: 12,
        ask: { op: 'value', row: names[r].toLowerCase(), col: c },
      });
    },
  },

  'grafic-ordine': {
    label: 'Ordonează după grafic',
    points: 3,
    fastMs: 7000,
    mode: 'sort',
    drawn: true,
    promptMax: 24,
    concepts: [BARE, LINIE, ORDONARE],
    generate(rand) {
      const n = rand() < 0.6 ? 3 : 4;
      const dir = rand() < 0.7 ? 'desc' : 'asc';
      const prompt = dir === 'desc' ? 'De la cel mai mare:' : 'De la cel mai mic:';
      if (rand() < 0.6) {
        const ctx = categories(rand, n);
        const step = pickOne(rand, [1, 2, 5]);
        const values = onLines(rand, n, step, 7);
        const figure = barsFigure({ cats: ctx.items.map(catOf), values, step, unit: ctx.unit });
        return drawnSort('grafic-ordine', rand, {
          prompt,
          dir,
          figure,
          solved: marked(figure, ctx.items.map((it) => ({ cat: it.id }))),
          items: ctx.items.map((it, i) => ({ id: it.id, spec: catOption(it), value: values[i] })),
          key: `b:${dir}:${values.join(',')}`,
          ask: { op: 'order', dir, cats: ctx.items.map((it) => it.id) },
        });
      }
      const ctx = pickOne(rand, DAY_SERIES);
      const step = pickOne(rand, ctx.steps);
      const values = onLines(rand, 5, step, 6);
      const picked = shuffle(rand, [0, 1, 2, 3, 4]).slice(0, n).sort((a, b) => a - b);
      const figure = lineFigure({ days: WEEK, series: [{ id: 's', values }], step, unit: ctx.unit });
      return drawnSort('grafic-ordine', rand, {
        prompt,
        dir,
        figure,
        solved: marked(figure, picked.map((i) => ({ x: WEEK[i] }))),
        items: picked.map((i) => ({ id: WEEK[i], spec: dayOption(WEEK[i]), value: values[i] })),
        key: `z:${ctx.id}:${dir}:${values.join(',')}:${picked.join('')}`,
        ask: { op: 'order', dir, xs: picked.map((i) => WEEK[i]) },
      });
    },
  },

  // ——— Intermediar ———
  'pictograma-legenda': {
    label: 'Pictograme cu legendă (1 simbol = 2, 5, 10)',
    points: 2,
    fastMs: 6500,
    mode: 'figure',
    promptMax: 60,
    concepts: [PICTO, REPETATA],
    generate(rand) {
      for (;;) {
        const each = pickOne(rand, [2, 5, 10]);
        const fruit = pickOne(rand, COUNT_SETS[0].items);
        const names = shuffle(rand, NAMES.flat()).slice(0, 3);
        const counts = distinct(rand, 3, 1, 8);
        const values = counts.map((k) => k * each);
        const rows = names.map((n) => ({ id: n.toLowerCase(), name: n }));
        const figure = { v: 'chart-picto', rows, values, symbol: fruit.emoji, each, unit: [fruit.sg, fruit.name] };
        if (rand() < 0.6) {
          const i = int(rand, 0, 2);
          return numberQuestion('pictograma-legenda', rand, {
            prompt: `Câte ${fruit.name} a cules ${names[i]}?`,
            figure,
            solved: marked(figure, [rows[i].id]),
            key: `v:${fruit.id}:${each}:${names.join(',')}:${counts.join(',')}:${i}`,
            answer: values[i],
            typical: [counts[i], values[i] - each, values[i] + each, ...values.filter((_, j) => j !== i)],
            ask: { op: 'value', row: rows[i].id },
          });
        }
        const [i, j] = shuffle(rand, [0, 1, 2]).slice(0, 2).sort((a, b) => a - b);
        if (values[i] + values[j] > 100) continue;
        return numberQuestion('pictograma-legenda', rand, {
          prompt: `Câte ${fruit.name} au cules ${names[i]} și ${names[j]}?`,
          figure,
          solved: marked(figure, [rows[i].id, rows[j].id]),
          key: `s:${fruit.id}:${each}:${names.join(',')}:${counts.join(',')}:${i}${j}`,
          answer: values[i] + values[j],
          typical: [counts[i] + counts[j], values[i] + values[j] - each, values[i] + values[j] + each, Math.abs(values[i] - values[j])],
          ask: { op: 'sum', rows: [rows[i].id, rows[j].id] },
        });
      }
    },
  },

  'bare-scara': {
    label: 'Grafice cu bare din 5 în 5 și din 10 în 10',
    points: 2,
    fastMs: 6000,
    mode: 'figure',
    promptMax: 60,
    concepts: [BARE],
    generate(rand) {
      const step = pickOne(rand, [5, 10]);
      const half = step === 10; // din 10 în 10, unele bare se opresc la jumătatea dintre linii
      const lines = step === 10 ? 7 : 6;
      const n = 4;
      const units = distinct(rand, n, half ? 1 : 2, half ? 2 * lines - 1 : lines);
      const values = units.map((k) => k * (half ? 5 : step));
      const i = int(rand, 0, n - 1);
      if (rand() < 0.5) {
        const ctx = pickOne(rand, DAY_SERIES.filter((c) => !c.f || c.id === 'inghetate'));
        const days = WEEK.slice(0, n);
        const figure = barsFigure({ cats: days.map((d) => ({ id: d, text: DAYS[d][0], name: DAYS[d][1] })), values, step, unit: ctx.unit });
        return numberQuestion('bare-scara', rand, {
          prompt: ctx.value(DAYS[days[i]][1]),
          figure,
          solved: marked(figure, [{ cat: days[i] }]),
          key: `z:${ctx.id}:${step}:${values.join(',')}:${i}`,
          answer: values[i],
          typical: [values[i] - 5, values[i] + 5, values[i] - step, values[i] + step, values[i] / (half ? 5 : step)],
          ask: { op: 'value', cat: days[i] },
        });
      }
      const ctx = categories(rand, n);
      const figure = barsFigure({ cats: ctx.items.map(catOf), values, step, unit: ctx.unit });
      return numberQuestion('bare-scara', rand, {
        prompt: ctx.value(ctx.items[i]),
        figure,
        solved: marked(figure, [{ cat: ctx.items[i].id }]),
        key: `c:${ctx.items.map((x) => x.id).join(',')}:${step}:${values.join(',')}:${i}`,
        answer: values[i],
        typical: [values[i] - 5, values[i] + 5, values[i] - step, values[i] + step],
        ask: { op: 'value', cat: ctx.items[i].id },
      });
    },
  },

  'bare-diferenta': {
    label: 'Cu cât e mai mult? (grafice cu bare)',
    points: 3,
    fastMs: 7000,
    mode: 'figure',
    promptMax: 60,
    concepts: [BARE, MAI_MULT],
    generate(rand) {
      const n = int(rand, 3, 4);
      const ctx = categories(rand, n);
      const step = pickOne(rand, [1, 2, 5, 10]);
      const values = onLines(rand, n, step, 7);
      const [i, j] = shuffle(rand, ctx.items.map((_, k) => k)).slice(0, 2).sort((a, b) => values[b] - values[a]);
      const [a, b] = [values[i], values[j]];
      const figure = barsFigure({ cats: ctx.items.map(catOf), values, step, unit: ctx.unit });
      return numberQuestion('bare-diferenta', rand, {
        prompt: ctx.diff(ctx.items[i], ctx.items[j]),
        figure,
        solved: marked(figure, [{ cat: ctx.items[i].id }, { cat: ctx.items[j].id }]),
        key: `${ctx.items.map((x) => x.id).join(',')}:${values.join(',')}:${i}${j}`,
        answer: a - b,
        typical: [a + b, a, b, a - b + step, a - b - step],
        max: 100,
        ask: { op: 'diff', a: [{ cat: ctx.items[i].id }], b: [{ cat: ctx.items[j].id }] },
      });
    },
  },

  'bare-suma': {
    label: 'Câte în total? (grafice cu bare)',
    points: 3,
    fastMs: 8000,
    mode: 'figure',
    promptMax: 60,
    concepts: [BARE, O_OP],
    generate(rand) {
      for (;;) {
        const n = int(rand, 3, 4);
        const ctx = categories(rand, n);
        const step = pickOne(rand, [1, 2, 5, 10]);
        const values = onLines(rand, n, step, 7);
        const figure = barsFigure({ cats: ctx.items.map(catOf), values, step, unit: ctx.unit });
        if (rand() < 0.5) {
          const [i, j] = shuffle(rand, ctx.items.map((_, k) => k)).slice(0, 2);
          const answer = values[i] + values[j];
          if (answer > 100) continue;
          return numberQuestion('bare-suma', rand, {
            prompt: ctx.sum(ctx.items[i], ctx.items[j]),
            figure,
            solved: marked(figure, [{ cat: ctx.items[i].id }, { cat: ctx.items[j].id }]),
            key: `2:${ctx.items.map((x) => x.id).join(',')}:${values.join(',')}:${i}${j}`,
            answer,
            typical: [Math.abs(values[i] - values[j]), answer - 10, answer + 10, answer + step, answer - step],
            ask: { op: 'sum', cats: [ctx.items[i].id, ctx.items[j].id] },
          });
        }
        const answer = sum(values);
        if (answer > 100) continue;
        return numberQuestion('bare-suma', rand, {
          prompt: ctx.total,
          figure,
          solved: marked(figure, ctx.items.map((it) => ({ cat: it.id }))),
          key: `t:${ctx.items.map((x) => x.id).join(',')}:${values.join(',')}`,
          answer,
          typical: [...values.map((v) => answer - v), answer - 10, answer + 10, answer + step],
          ask: { op: 'sum', cats: ctx.items.map((it) => it.id) },
        });
      }
    },
  },

  'cerc-felii': {
    label: 'Cercul cu felii: câți au ales',
    points: 2,
    fastMs: 6500,
    mode: 'figure',
    promptMax: 60,
    concepts: [CERC, REPETATA],
    generate(rand) {
      for (;;) {
        const set = pickOne(rand, VOTE_SETS);
        const g = int(rand, 3, 4);
        const items = shuffle(rand, set.items).slice(0, g);
        const total = int(rand, g + 1, 8);
        // feliile: câte cel puțin una, restul împărțite la întâmplare
        const slices = items.map(() => 1);
        for (let k = g; k < total; k++) slices[int(rand, 0, g - 1)]++;
        const each = pickOne(rand, [1, 2, 2, 5, 5, 10]);
        const figure = { v: 'chart-pie', groups: items.map((it, i) => ({ id: it.id, emoji: it.emoji, name: it.name, n: slices[i] })), each, unit: CHILD };
        const variant = pickOne(rand, ['value', 'value', 'most', 'total']);
        if (variant === 'value') {
          const i = int(rand, 0, g - 1);
          const answer = slices[i] * each;
          return numberQuestion('cerc-felii', rand, {
            prompt: `Câți copii au ales ${items[i].the}?`,
            figure,
            solved: marked(figure, [items[i].id]),
            key: `v:${items.map((x) => x.id).join(',')}:${slices.join(',')}:${each}:${i}`,
            answer,
            typical: [slices[i], answer - each, answer + each, ...slices.filter((_, j) => j !== i).map((s) => s * each)],
            ask: { op: 'value', group: items[i].id },
          });
        }
        if (variant === 'total') {
          const answer = total * each;
          return numberQuestion('cerc-felii', rand, {
            prompt: 'Câți copii au răspuns în total?',
            figure,
            solved: marked(figure, items.map((it) => it.id)),
            key: `t:${items.map((x) => x.id).join(',')}:${slices.join(',')}:${each}`,
            answer,
            typical: [total, answer - each, answer + each, g * each],
            ask: { op: 'total' },
          });
        }
        const top = Math.max(...slices);
        if (slices.filter((s) => s === top).length !== 1) continue;
        const i = slices.indexOf(top);
        const outside = shuffle(rand, set.items.filter((x) => !items.includes(x)))[0];
        const q = pickQuestion('cerc-felii', rand, {
          prompt: 'Ce au ales cei mai mulți copii?',
          figure,
          solved: marked(figure, [items[i].id]),
          key: `m:${items.map((x) => x.id).join(',')}:${slices.join(',')}:${each}`,
          answer: catOption(items[i]),
          distractors: [...items.filter((_, j) => j !== i).map(catOption), outside && catOption(outside)],
          ask: { op: 'max' },
        });
        if (q) return q;
      }
    },
  },

  'timp-grafic': {
    label: 'Grafice în timp: citește și compară zilele',
    points: 2,
    fastMs: 6500,
    mode: 'figure',
    promptMax: 60,
    concepts: [LINIE, MAI_MULT],
    generate(rand) {
      for (;;) {
        const ctx = pickOne(rand, DAY_SERIES);
        const step = pickOne(rand, ctx.steps);
        const values = dayValues(rand, 5, step, 6);
        const figure = lineFigure({ days: WEEK, series: [{ id: 's', values }], step, unit: ctx.unit });
        const variant = pickOne(rand, ['value', 'extreme', 'diff', 'above']);
        const base = `${ctx.id}:${values.join(',')}`;
        if (variant === 'value') {
          const i = int(rand, 0, 4);
          return numberQuestion('timp-grafic', rand, {
            prompt: ctx.value(DAYS[WEEK[i]][1]),
            figure,
            solved: marked(figure, [{ x: WEEK[i] }]),
            key: `v:${base}:${i}`,
            answer: values[i],
            typical: [values[i - 1], values[i + 1], values[i] - step, values[i] + step].filter((x) => x !== undefined),
            ask: { op: 'value', x: WEEK[i] },
          });
        }
        if (variant === 'extreme') {
          const most = rand() < 0.6;
          const pick = most ? Math.max(...values) : Math.min(...values);
          if (values.filter((v) => v === pick).length !== 1) continue;
          const i = values.indexOf(pick);
          const q = pickQuestion('timp-grafic', rand, {
            prompt: most ? ctx.most : ctx.least,
            figure,
            solved: marked(figure, [{ x: WEEK[i] }]),
            key: `${most ? 'max' : 'min'}:${base}`,
            answer: dayOption(WEEK[i]),
            distractors: shuffle(rand, WEEK.filter((_, j) => j !== i)).map(dayOption),
            order: byDay,
            ask: { op: most ? 'max' : 'min' },
          });
          if (q) return q;
          continue;
        }
        if (variant === 'diff') {
          const [i, j] = shuffle(rand, [0, 1, 2, 3, 4]).slice(0, 2).sort((a, b) => values[b] - values[a]);
          if (values[i] === values[j]) continue;
          const d = values[i] - values[j];
          return numberQuestion('timp-grafic', rand, {
            prompt: ctx.diff(DAYS[WEEK[i]][1], DAYS[WEEK[j]][1]),
            figure,
            solved: marked(figure, [{ x: WEEK[i] }, { x: WEEK[j] }]),
            key: `d:${base}:${i}${j}`,
            answer: d,
            typical: [values[i], values[j], values[i] + values[j], d + step, d - step],
            ask: { op: 'diff', a: [{ x: WEEK[i] }], b: [{ x: WEEK[j] }] },
          });
        }
        // peste un prag aflat între liniile grilei, ca să nu fie „egal cu pragul”
        const k = (int(rand, 1, 5) + 0) * step;
        if (values.includes(k)) continue;
        const count = values.filter((v) => v > k).length;
        return numberQuestion('timp-grafic', rand, {
          prompt: ctx.above(k),
          figure,
          solved: marked(figure, WEEK.filter((_, i) => values[i] > k).map((x) => ({ x }))),
          key: `a:${base}:${k}`,
          answer: count,
          typical: [5 - count, values.filter((v) => v >= k).length, count + 1, count - 1],
          min: 0,
          max: 5,
          ask: { op: 'countAbove', k },
        });
      }
    },
  },

  // ——— Avansat ———
  'bare-duble': {
    label: 'Grafice cu bare duble: grupe și serii',
    points: 4,
    fastMs: 9000,
    mode: 'figure',
    promptMax: 60,
    concepts: [BARE, MAI_MULT, O_OP],
    generate(rand) {
      for (;;) {
        const [na, nb] = pickOne(rand, NAMES);
        const fruits = shuffle(rand, COUNT_SETS[0].items).slice(0, 4);
        const step = pickOne(rand, [1, 2]);
        const sa = fruits.map(() => int(rand, 1, 7) * step);
        const sb = fruits.map(() => int(rand, 1, 7) * step);
        const figure = { v: 'chart-bars', cats: fruits.map(catOf), series: [{ id: 'a', name: na, values: sa }, { id: 'b', name: nb, values: sb }], step, unit: ['fruct', 'fructe'] };
        const variant = pickOne(rand, ['sum', 'diff', 'equal']);
        const base = `${na}:${fruits.map((f) => f.id).join(',')}:${sa.join(',')}|${sb.join(',')}`;
        if (variant === 'sum') {
          const i = int(rand, 0, 3);
          const answer = sa[i] + sb[i];
          return numberQuestion('bare-duble', rand, {
            prompt: `Câte ${fruits[i].name} au cules ${na} și ${nb} împreună?`,
            figure,
            solved: marked(figure, [{ cat: fruits[i].id, s: 'a' }, { cat: fruits[i].id, s: 'b' }]),
            key: `s:${base}:${i}`,
            answer,
            typical: [Math.abs(sa[i] - sb[i]), sa[i], sb[i], answer + step, answer - step],
            ask: { op: 'sum', refs: [{ cat: fruits[i].id, s: 'a' }, { cat: fruits[i].id, s: 'b' }] },
          });
        }
        if (variant === 'diff') {
          const i = int(rand, 0, 3);
          if (sa[i] === sb[i]) continue;
          const [first, second, fs, ss] = sa[i] > sb[i] ? [na, nb, 'a', 'b'] : [nb, na, 'b', 'a'];
          const hi = Math.max(sa[i], sb[i]);
          const lo = Math.min(sa[i], sb[i]);
          return numberQuestion('bare-duble', rand, {
            prompt: `Cu câte ${fruits[i].name} a cules ${first} mai mult decât ${second}?`,
            figure,
            solved: marked(figure, [{ cat: fruits[i].id, s: fs }, { cat: fruits[i].id, s: ss }]),
            key: `d:${base}:${i}`,
            answer: hi - lo,
            typical: [hi + lo, hi, lo, hi - lo + step],
            ask: { op: 'diff', a: [{ cat: fruits[i].id, s: fs }], b: [{ cat: fruits[i].id, s: ss }] },
          });
        }
        const equal = fruits.map((_, i) => sa[i] === sb[i]);
        if (equal.filter(Boolean).length !== 1) continue;
        const i = equal.indexOf(true);
        const q = pickQuestion('bare-duble', rand, {
          prompt: `La ce fruct au cules la fel de multe?`,
          figure,
          solved: marked(figure, [{ cat: fruits[i].id, s: 'a' }, { cat: fruits[i].id, s: 'b' }]),
          key: `e:${base}`,
          answer: catOption(fruits[i]),
          distractors: fruits.filter((_, j) => j !== i).map(catOption),
          ask: { op: 'equalCat' },
        });
        if (q) return q;
      }
    },
  },

  'bare-lipsa': {
    label: 'Bara ascunsă: află din total',
    points: 4,
    fastMs: 9000,
    mode: 'figure',
    promptMax: 60,
    concepts: [BARE, NECUNOSCUT],
    generate(rand) {
      for (;;) {
        const n = int(rand, 3, 4);
        const ctx = categories(rand, n);
        const step = pickOne(rand, [1, 2, 5]);
        const values = onLines(rand, n, step, 6);
        const total = sum(values);
        if (total > 100) continue;
        const i = int(rand, 0, n - 1);
        // grila are mereu 7 linii: cu scara făcută după valori, bara ascunsă cea mai înaltă ar fi ajuns chiar la ultima linie
        const open = { ...barsFigure({ cats: ctx.items.map(catOf), values, step, unit: ctx.unit }), max: 7 * step };
        const figure = { ...open, hide: ctx.items[i].id };
        const shown = total - values[i];
        return numberQuestion('bare-lipsa', rand, {
          prompt: ctx.missing(total, ctx.items[i]),
          figure,
          solved: marked(open, [{ cat: ctx.items[i].id }]),
          key: `${ctx.items.map((x) => x.id).join(',')}:${values.join(',')}:${i}`,
          answer: values[i],
          typical: [shown, values[i] + step, values[i] - step, values[i] + 10, values[i] - 10],
          ask: { op: 'missing', total, cat: ctx.items[i].id },
        });
      }
    },
  },

  'timp-doua-serii': {
    label: 'Două serii în timp: pe date, cine și cât',
    points: 4,
    fastMs: 10000,
    mode: 'figure',
    promptMax: 60,
    concepts: [LINIE, MAI_MULT, O_OP],
    generate(rand) {
      for (;;) {
        const ctx = pickOne(rand, PAIR_SERIES);
        const [na, nb] = shuffle(rand, pickOne(rand, NAMES));
        const month = pickOne(rand, MONTHS);
        const dates = consecutive(rand, 5);
        const step = pickOne(rand, ctx.steps);
        const sa = dayValues(rand, 5, step, 6);
        const sb = dayValues(rand, 5, step, 6);
        const figure = lineFigure({ dates, month, series: [{ id: 'a', name: na, values: sa }, { id: 'b', name: nb, values: sb }], step, unit: ctx.unit });
        const base = `${ctx.id}:${na}:${dates[0]}${month}:${sa.join(',')}|${sb.join(',')}`;
        const variant = pickOne(rand, ['sum', 'diff', 'diff', 'dayMore', 'countDays', 'dayEqual']);
        const dateOpts = (i) => dateOption(dates[i], month);
        if (variant === 'sum') {
          const i = int(rand, 0, 4);
          const answer = sa[i] + sb[i];
          if (answer > 100) continue;
          return numberQuestion('timp-doua-serii', rand, {
            prompt: ctx.sum(na, nb, `${dates[i]} ${month}`),
            figure,
            solved: marked(figure, [{ s: 'a', x: dates[i] }, { s: 'b', x: dates[i] }]),
            key: `s:${base}:${i}`,
            answer,
            typical: [Math.abs(sa[i] - sb[i]), sa[i], sb[i], answer + step, answer - step],
            ask: { op: 'sum', refs: [{ s: 'a', x: dates[i] }, { s: 'b', x: dates[i] }] },
          });
        }
        if (variant === 'diff') {
          const i = int(rand, 0, 4);
          if (sa[i] <= sb[i]) continue;
          return numberQuestion('timp-doua-serii', rand, {
            prompt: ctx.diff(na, nb, `${dates[i]} ${month}`),
            figure,
            solved: marked(figure, [{ s: 'a', x: dates[i] }, { s: 'b', x: dates[i] }]),
            key: `d:${base}:${i}`,
            answer: sa[i] - sb[i],
            typical: [sa[i] + sb[i], sa[i], sb[i], sa[i] - sb[i] + step, sa[i] - sb[i] - step, sa[i] - sb[i] - 2 * step],
            ask: { op: 'diff', a: [{ s: 'a', x: dates[i] }], b: [{ s: 'b', x: dates[i] }] },
          });
        }
        if (variant === 'dayMore') {
          const k = int(rand, 1, 3) * step;
          const hits = dates.map((_, i) => sa[i] - sb[i] === k);
          if (hits.filter(Boolean).length !== 1) continue;
          const i = hits.indexOf(true);
          const reverse = dates.findIndex((_, j) => sb[j] - sa[j] === k);
          const q = pickQuestion('timp-doua-serii', rand, {
            prompt: ctx.dayMore(na, nb, k),
            figure,
            solved: marked(figure, [{ s: 'a', x: dates[i] }, { s: 'b', x: dates[i] }]),
            key: `m:${base}:${k}`,
            answer: dateOpts(i),
            distractors: [reverse >= 0 ? dateOpts(reverse) : null, ...shuffle(rand, dates.map((_, j) => j).filter((j) => j !== i && j !== reverse)).map(dateOpts)],
            order: byDate,
            ask: { op: 'dayMore', a: 'a', b: 'b', k },
          });
          if (q) return q;
          continue;
        }
        if (variant === 'countDays') {
          const count = dates.filter((_, i) => sa[i] > sb[i]).length;
          const equal = dates.filter((_, i) => sa[i] === sb[i]).length;
          return numberQuestion('timp-doua-serii', rand, {
            prompt: ctx.countDays(na, nb),
            figure,
            solved: marked(figure, dates.flatMap((d, i) => (sa[i] > sb[i] ? [{ s: 'a', x: d }] : []))),
            key: `c:${base}`,
            answer: count,
            typical: [5 - count - equal, count + equal, count + 1, count - 1],
            min: 0,
            max: 5,
            ask: { op: 'countDays', a: 'a', b: 'b' },
          });
        }
        const equal = dates.map((_, i) => sa[i] === sb[i]);
        if (equal.filter(Boolean).length !== 1) continue;
        const i = equal.indexOf(true);
        const q = pickQuestion('timp-doua-serii', rand, {
          prompt: ctx.dayEqual,
          figure,
          solved: marked(figure, [{ s: 'a', x: dates[i] }, { s: 'b', x: dates[i] }]),
          key: `e:${base}`,
          answer: dateOpts(i),
          distractors: shuffle(rand, dates.map((_, j) => j).filter((j) => j !== i)).map(dateOpts),
          order: byDate,
          ask: { op: 'dayEqual' },
        });
        if (q) return q;
      }
    },
  },

  'timp-total': {
    label: 'Grafice în timp: totaluri și creșteri',
    points: 5,
    fastMs: 11000,
    mode: 'figure',
    promptMax: 60,
    concepts: [LINIE, O_OP],
    generate(rand) {
      for (;;) {
        const month = pickOne(rand, MONTHS);
        const dates = consecutive(rand, 5);
        const variant = pickOne(rand, ['firstN', 'growth', 'maxTotal']);
        if (variant === 'firstN') {
          const ctx = pickOne(rand, PAIR_SERIES);
          const name = pickOne(rand, NAMES)[int(rand, 0, 1)];
          const step = pickOne(rand, ctx.steps);
          const values = dayValues(rand, 5, step, 6);
          const n = int(rand, 2, 4);
          const answer = sum(values.slice(0, n));
          if (answer > 100) continue;
          const figure = lineFigure({ dates, month, series: [{ id: 'a', name, values }], step, unit: ctx.unit });
          return numberQuestion('timp-total', rand, {
            prompt: ctx.firstN(name, n),
            figure,
            solved: marked(figure, dates.slice(0, n).map((x) => ({ s: 'a', x }))),
            key: `f:${ctx.id}:${name}:${dates[0]}${month}:${values.join(',')}:${n}`,
            answer,
            typical: [sum(values.slice(0, n - 1)), sum(values.slice(0, n + 1)), values[n - 1], sum(values), answer + step, answer - step],
            ask: { op: 'firstN', s: 'a', n },
          });
        }
        if (variant === 'growth') {
          // fasolea crește în fiecare zi cu 0, 2 sau 4 centimetri (valorile stau pe liniile grilei, din 2 în 2)
          const heights = [int(rand, 1, 3) * 2];
          for (let i = 1; i < 5; i++) heights.push(heights[i - 1] + pickOne(rand, [0, 2, 2, 4]));
          if (heights[4] > 14) continue;
          const [from, to] = [int(rand, 0, 2), int(rand, 3, 4)];
          const answer = heights[to] - heights[from];
          if (answer === 0) continue;
          const figure = lineFigure({ dates, month, series: [{ id: 'a', name: 'fasolea', values: heights }], step: 2, unit: ['centimetru', 'centimetri'] });
          return numberQuestion('timp-total', rand, {
            prompt: `Cât a crescut fasolea de pe ${dates[from]} pe ${dates[to]} ${month}?`,
            figure,
            solved: marked(figure, [{ s: 'a', x: dates[from] }, { s: 'a', x: dates[to] }]),
            key: `g:${dates[0]}${month}:${heights.join(',')}:${from}${to}`,
            answer,
            typical: [heights[to], heights[from], answer + 2, answer - 2],
            max: 30,
            ask: { op: 'growth', s: 'a', from: dates[from], to: dates[to] },
          });
        }
        const ctx = pickOne(rand, PAIR_SERIES);
        const [na, nb] = pickOne(rand, NAMES);
        const step = pickOne(rand, ctx.steps);
        const sa = dayValues(rand, 5, step, 6);
        const sb = dayValues(rand, 5, step, 6);
        const totals = sa.map((v, i) => v + sb[i]);
        const top = Math.max(...totals);
        if (top > 100 || totals.filter((t) => t === top).length !== 1) continue;
        const i = totals.indexOf(top);
        const figure = lineFigure({ dates, month, series: [{ id: 'a', name: na, values: sa }, { id: 'b', name: nb, values: sb }], step, unit: ctx.unit });
        // greșelile tipice: ziua în care unul singur a avut cel mai mult
        const ia = sa.indexOf(Math.max(...sa));
        const ib = sb.indexOf(Math.max(...sb));
        const q = pickQuestion('timp-total', rand, {
          prompt: ctx.dayMaxTotal,
          figure,
          solved: marked(figure, [{ s: 'a', x: dates[i] }, { s: 'b', x: dates[i] }]),
          key: `m:${ctx.id}:${na}:${dates[0]}${month}:${sa.join(',')}|${sb.join(',')}`,
          answer: dateOption(dates[i], month),
          distractors: [ia, ib, ...shuffle(rand, [0, 1, 2, 3, 4])].filter((j) => j !== i).map((j) => dateOption(dates[j], month)),
          order: byDate,
          ask: { op: 'dayMaxTotal' },
        });
        if (q) return q;
      }
    },
  },

  venn: {
    label: 'Două cercuri: și, doar, în total',
    points: 3,
    fastMs: 8000,
    mode: 'figure',
    promptMax: 60,
    concepts: [VENN],
    generate(rand) {
      const set = pickOne(rand, VENN_SETS);
      const counts = { a: int(rand, 2, 12), ab: int(rand, 1, 9), b: int(rand, 2, 12) };
      const figure = { v: 'venn', a: set.a, b: set.b, counts };
      const region = pickOne(rand, ['ab', 'a', 'A', 'all']);
      const { a, ab, b } = counts;
      const cases = {
        ab: [`Câți copii ${set.verb} și ${set.a.name}, și ${set.b.name}?`, ab, [a, b, a + ab]],
        a: [`Câți copii ${set.verb} doar ${set.a.name}?`, a, [a + ab, ab, a + b]],
        A: [`Câți copii ${set.verb} ${set.a.name}?`, a + ab, [a, a + ab + b, ab]],
        all: ['Câți copii sunt în total?', a + ab + b, [a + 2 * ab + b, a + b, a + ab + b + 1]],
      };
      const [prompt, answer, typical] = cases[region];
      return numberQuestion('venn', rand, {
        prompt,
        figure,
        solved: { ...figure, mark: region },
        key: `${set.id}:${a},${ab},${b}:${region}`,
        answer,
        typical,
        ask: { op: 'venn', region },
      });
    },
  },
};
