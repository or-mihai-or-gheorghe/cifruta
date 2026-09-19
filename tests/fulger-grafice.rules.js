// Regulile tipurilor cu grafice din Jocuri fulger (js/fulger/kinds-grafice.js), verificate de tests/fulger.test.js pe întrebările
// generate. Fiecare regulă citește datele din desen și `ask` (ce se întreabă), calculează singură răspunsul, cere să fie unul singur și
// verifică de ce e vorba în cerință (numele, zilele, datele, pragul), cu tabelele ei, fără codul generatoarelor.

const optionList = (q) => q.choices.map((id) => q.options[id]);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const sum = (list) => list.reduce((s, x) => s + x, 0);
const escape = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Cuvântul apare întreg în text (fără să fie bucată din alt cuvânt). */
export const says = (text, word) => new RegExp(`(^|[^\\p{L}])${escape(word)}([^\\p{L}]|$)`, 'u').test(text);
const REL = (a, b) => (a < b ? '<' : a > b ? '>' : '=');

// numele articulate ale preferatelor (cerința spune „câinele”, desenul are „câine”)
const THE = {
  caine: 'câinele', pisica: 'pisica', iepure: 'iepurele', urs: 'ursul', vulpe: 'vulpea', leu: 'leul',
  inghetata: 'înghețata', prajitura: 'prăjitura', ciocolata: 'ciocolata', gogoasa: 'gogoașa', biscuit: 'biscuitul',
  fotbal: 'fotbalul', baschet: 'baschetul', inot: 'înotul', dans: 'dansul', alergare: 'alergarea',
};
const DAY = { luni: ['Lu', 'luni'], marti: ['Ma', 'marți'], miercuri: ['Mi', 'miercuri'], joi: ['Jo', 'joi'], vineri: ['Vi', 'vineri'] };

/** Numele cu care cerința poate numi o categorie a desenului: pluralul (mere) sau forma articulată (câinele). */
const namesOf = (cat) => [cat.name, THE[cat.id]].filter(Boolean);
const mentions = (text, cat) => namesOf(cat).some((n) => says(text, n));

/** Cerința numește exact categoriile întrebate dintre cele din desen (nu pe altele). */
function mentionsOnly(text, cats, asked) {
  return cats.every((c) => mentions(text, c) === asked.includes(c.id));
}

/** Variantele numerice: patru numere diferite, crescătoare; răspunsul e `expected` și apare o singură dată. */
export function numberAnswer(q, expected) {
  const nums = optionList(q).map((o) => Number(o.text));
  return (
    Number.isInteger(expected) &&
    nums.every(Number.isInteger) &&
    nums.every((n, i) => i === 0 || n > nums[i - 1]) &&
    Number(q.options[q.answer].text) === expected
  );
}

/** Exact o variantă îndeplinește condiția, iar ea e răspunsul. */
export function pickAnswer(q, test) {
  const good = q.choices.filter((id) => test(q.options[id]));
  return good.length === 1 && good[0] === q.answer;
}

/** Desenul rezolvat e desenul întrebării cu marcaje (și, la bara ascunsă, fără ascundere). */
export function solvedOk(q, drop = []) {
  if (!q.solved || q.solved.v !== q.figure.v || !q.solved.mark) return false;
  const keys = new Set([...Object.keys(q.figure), ...Object.keys(q.solved)]);
  return [...keys].every((k) => k === 'mark' || drop.includes(k) || same(q.figure[k], q.solved[k]));
}

// ——— valorile din desene ———
const seriesOf = (f, s) => f.series.find((x) => x.id === (s ?? f.series[0].id));
const barValue = (f, cat, s) => seriesOf(f, s).values[f.cats.findIndex((c) => c.id === cat)];
const xsOf = (f) => (f.days ?? f.dates).map(String);
const lineValue = (f, x, s) => seriesOf(f, s).values[xsOf(f).indexOf(String(x))];
const refValue = (f, r) => (r.cat !== undefined ? barValue(f, r.cat, r.s) : lineValue(f, r.x, r.s));
const pictoValue = (f, row) => f.values[f.rows.findIndex((r) => r.id === row)];
const cellValue = (f, row, col) => {
  const c = f.rows.find((r) => r.id === row).cells[col];
  return typeof c === 'number' ? c : c.tally;
};

/** Pe liniile grilei: multipli ai pasului, cel mult 7 linii. */
const onGrid = (f, values) => values.every((v) => Number.isInteger(v) && v >= 0 && v % f.step === 0) && Math.max(...values) / f.step <= 7;

/** Un singur maxim (sau minim) și indicele lui. */
function extreme(values, op) {
  const pick = op === 'max' ? Math.max(...values) : Math.min(...values);
  return values.filter((v) => v === pick).length === 1 ? values.indexOf(pick) : -1;
}

/** Numele unei zile sau al unei date, cum apare în cerință („marți”, „10 iunie”). */
const spoken = (f, x) => (f.days ? DAY[x][1] : `${x} ${f.month}`);
/** O variantă-zi sau o variantă-dată corespunde lui x. */
const isX = (f, x) => (o) => (f.days ? o.text === DAY[x][0] : o.text === String(x) && o.note === f.month);

// ——— tipurile ———
export const CHART_RULES = {
  pictograma: (q) => {
    const f = q.figure;
    if (f?.v !== 'chart-picto' || f.each !== 1 || !f.values.every((v) => v >= 1 && v <= 8) || !solvedOk(q)) return false;
    const { op, row } = q.ask;
    if (op === 'value') {
      const r = f.rows.find((x) => x.id === row);
      return says(q.prompt, r.name) && f.rows.every((x) => x.id === row || !says(q.prompt, x.name)) && numberAnswer(q, pictoValue(f, row));
    }
    const i = extreme(f.values, op);
    if (i < 0 || !says(q.prompt, op === 'max' ? 'multe' : 'puține')) return false;
    const r = f.rows[i];
    return pickAnswer(q, (o) => (r.emoji ? o.emoji === r.emoji : o.text === r.name));
  },

  'bare-citire': (q) => {
    const f = q.figure;
    const values = f?.series?.[0]?.values ?? [];
    if (f?.v !== 'chart-bars' || f.series.length !== 1 || ![1, 2].includes(f.step) || !onGrid(f, values) || Math.max(...values) > 14 || !solvedOk(q)) return false;
    const { op, cat } = q.ask;
    if (op === 'value') return mentionsOnly(q.prompt, f.cats, [cat]) && numberAnswer(q, barValue(f, cat));
    const i = extreme(values, op);
    return i >= 0 && says(q.prompt, op === 'max' ? 'multe' : 'puține') && pickAnswer(q, (o) => o.emoji === f.cats[i].emoji);
  },

  'grafic-compara': (q) => {
    const f = q.figure;
    if (!f || q.mode !== 'compare' || !solvedOk(q) || q.prompt.length > 24) return false;
    const { a, b } = q.ask;
    const lv = sum(a.map((r) => refValue(f, r)));
    const rv = sum(b.map((r) => refValue(f, r)));
    // laturile arată exact operanzii: emoji-ul categoriei, prescurtarea zilei sau numele seriei
    const shows = (spec, r) =>
      r.cat !== undefined ? spec.emoji === f.cats.find((c) => c.id === r.cat).emoji : r.s !== undefined && f.series.length > 1 ? spec.text === seriesOf(f, r.s).name : spec.text === DAY[r.x][0];
    const sides = q.left.length === a.length && q.right.length === b.length && q.left.every((s, i) => shows(s, a[i])) && q.right.every((s, i) => shows(s, b[i]));
    const dated = f.v === 'chart-line' && f.dates ? says(q.prompt, `${a[0].x} ${f.month}`) : true;
    const values = f.series.flatMap((s) => s.values);
    return sides && dated && onGrid(f, values) && q.answer === REL(lv, rv);
  },

  tabel: (q) => {
    const f = q.figure;
    if (f?.v !== 'chart-table' || !solvedOk(q)) return false;
    const { row, col } = q.ask;
    const r = f.rows.find((x) => x.id === row);
    const tally = typeof r.cells[col] === 'object';
    if (tally) return says(q.prompt, THE[row]) && numberAnswer(q, cellValue(f, row, col));
    // tabelul cu zile: rândul e al copilului, coloana e ziua (capul coloanei, „Ma” pentru marți)
    const day = Object.entries(DAY).find(([, [short]]) => short === f.cols[col + 1]);
    return says(q.prompt, r.name) && day && says(q.prompt, day[1][1]) && numberAnswer(q, cellValue(f, row, col));
  },

  'grafic-ordine': (q) => {
    const f = q.figure;
    if (!f || q.mode !== 'sort' || !solvedOk(q) || q.prompt.length > 24) return false;
    const { dir } = q.ask;
    if (dir !== q.dir || !says(q.prompt, dir === 'desc' ? 'mare' : 'mic')) return false;
    const valueOf = (id) => (f.v === 'chart-bars' ? barValue(f, id) : lineValue(f, id));
    const values = q.tiles.map(valueOf);
    if (new Set(values).size !== values.length || values.some((v) => v === undefined)) return false;
    const order = [...q.tiles].sort((x, y) => (dir === 'asc' ? valueOf(x) - valueOf(y) : valueOf(y) - valueOf(x)));
    // plăcuțele arată ce ordonăm: emoji-ul categoriei sau prescurtarea zilei
    const tilesOk = q.tiles.every((id) => (f.v === 'chart-bars' ? q.options[id].emoji === f.cats.find((c) => c.id === id).emoji : q.options[id].text === DAY[id][0]));
    return tilesOk && same(order, q.answer);
  },

  'pictograma-legenda': (q) => {
    const f = q.figure;
    if (f?.v !== 'chart-picto' || ![2, 5, 10].includes(f.each) || !f.values.every((v) => v % f.each === 0 && v / f.each <= 8) || !solvedOk(q)) return false;
    const { op } = q.ask;
    const asked = op === 'value' ? [q.ask.row] : q.ask.rows;
    const namesOk = f.rows.every((r) => says(q.prompt, r.name) === asked.includes(r.id));
    return namesOk && numberAnswer(q, sum(asked.map((r) => pictoValue(f, r))));
  },

  'bare-scara': (q) => {
    const f = q.figure;
    const values = f?.series?.[0]?.values ?? [];
    if (f?.v !== 'chart-bars' || ![5, 10].includes(f.step) || !values.every((v) => v % 5 === 0) || Math.max(...values) / f.step > 7 || !solvedOk(q)) return false;
    const { cat } = q.ask;
    const c = f.cats.find((x) => x.id === cat);
    const named = DAY[cat] ? says(q.prompt, DAY[cat][1]) : mentionsOnly(q.prompt, f.cats, [cat]);
    return Boolean(c) && named && numberAnswer(q, barValue(f, cat));
  },

  'bare-diferenta': (q) => {
    const f = q.figure;
    if (f?.v !== 'chart-bars' || !onGrid(f, f.series[0].values) || !solvedOk(q)) return false;
    const [a, b] = [q.ask.a[0].cat, q.ask.b[0].cat];
    const [va, vb] = [barValue(f, a), barValue(f, b)];
    // cerința le numește pe amândouă, întâi pe cea mai mare
    const first = namesOf(f.cats.find((c) => c.id === a)).map((n) => q.prompt.indexOf(n)).find((i) => i >= 0);
    const second = namesOf(f.cats.find((c) => c.id === b)).map((n) => q.prompt.lastIndexOf(n)).find((i) => i >= 0);
    return va > vb && mentionsOnly(q.prompt, f.cats, [a, b]) && first < second && numberAnswer(q, va - vb);
  },

  'bare-suma': (q) => {
    const f = q.figure;
    if (f?.v !== 'chart-bars' || !onGrid(f, f.series[0].values) || !solvedOk(q)) return false;
    const { cats } = q.ask;
    const total = sum(cats.map((c) => barValue(f, c)));
    const named = cats.length === f.cats.length ? says(q.prompt, 'total') && f.cats.every((c) => !mentions(q.prompt, c)) : mentionsOnly(q.prompt, f.cats, cats);
    return named && total <= 100 && numberAnswer(q, total);
  },

  'cerc-felii': (q) => {
    const f = q.figure;
    if (f?.v !== 'chart-pie' || !solvedOk(q)) return false;
    const slices = f.groups.map((g) => g.n);
    const { op, group } = q.ask;
    if (op === 'value') {
      const g = f.groups.find((x) => x.id === group);
      return says(q.prompt, THE[group]) && f.groups.every((x) => x.id === group || !says(q.prompt, THE[x.id])) && numberAnswer(q, g.n * f.each);
    }
    if (op === 'total') return says(q.prompt, 'total') && numberAnswer(q, sum(slices) * f.each);
    const i = extreme(slices, 'max');
    return i >= 0 && says(q.prompt, 'mulți') && pickAnswer(q, (o) => o.emoji === f.groups[i].emoji);
  },

  'timp-grafic': (q) => {
    const f = q.figure;
    const values = f?.series?.[0]?.values ?? [];
    if (f?.v !== 'chart-line' || !f.days || f.series.length !== 1 || !onGrid(f, values) || !solvedOk(q)) return false;
    const { op } = q.ask;
    const others = (xs) => f.days.every((d) => xs.includes(d) || !says(q.prompt, DAY[d][1]));
    if (op === 'value') return says(q.prompt, DAY[q.ask.x][1]) && others([q.ask.x]) && numberAnswer(q, lineValue(f, q.ask.x));
    if (op === 'max' || op === 'min') {
      const i = extreme(values, op);
      return i >= 0 && others([]) && pickAnswer(q, isX(f, f.days[i]));
    }
    if (op === 'diff') {
      const [a, b] = [q.ask.a[0].x, q.ask.b[0].x];
      const [va, vb] = [lineValue(f, a), lineValue(f, b)];
      return va > vb && q.prompt.indexOf(DAY[a][1]) < q.prompt.indexOf(DAY[b][1]) && others([a, b]) && numberAnswer(q, va - vb);
    }
    const { k } = q.ask;
    // pragul e între valori: nicio zi nu are exact pragul, deci „peste” nu se poate încurca cu „cel puțin”
    return says(q.prompt, `peste ${k}`) && !values.includes(k) && numberAnswer(q, values.filter((v) => v > k).length);
  },

  'bare-duble': (q) => {
    const f = q.figure;
    if (f?.v !== 'chart-bars' || f.series.length !== 2 || !onGrid(f, f.series.flatMap((s) => s.values)) || !solvedOk(q)) return false;
    const [A, B] = f.series;
    const { op } = q.ask;
    if (op === 'equalCat') {
      const equal = f.cats.filter((c) => barValue(f, c.id, 'a') === barValue(f, c.id, 'b'));
      return equal.length === 1 && says(q.prompt, 'la fel') && pickAnswer(q, (o) => o.emoji === equal[0].emoji);
    }
    const refs = op === 'sum' ? q.ask.refs : [...q.ask.a, ...q.ask.b];
    const cat = refs[0].cat;
    if (!refs.every((r) => r.cat === cat) || !mentionsOnly(q.prompt, f.cats, [cat]) || !says(q.prompt, A.name) || !says(q.prompt, B.name)) return false;
    if (op === 'sum') return numberAnswer(q, barValue(f, cat, 'a') + barValue(f, cat, 'b'));
    const [va, vb] = [barValue(f, cat, q.ask.a[0].s), barValue(f, cat, q.ask.b[0].s)];
    const [first, second] = [seriesOf(f, q.ask.a[0].s).name, seriesOf(f, q.ask.b[0].s).name];
    return va > vb && q.prompt.indexOf(first) < q.prompt.indexOf(second) && numberAnswer(q, va - vb);
  },

  'bare-lipsa': (q) => {
    const f = q.figure;
    if (f?.v !== 'chart-bars' || f.hide !== q.ask.cat || f.series.length !== 1 || !solvedOk(q, ['hide']) || q.solved.hide !== undefined) return false;
    const { total, cat } = q.ask;
    const values = f.series[0].values;
    const shown = sum(f.cats.map((c, i) => (c.id === cat ? 0 : values[i])));
    return onGrid(f, values) && sum(values) === total && total <= 100 && says(q.prompt, String(total)) && mentionsOnly(q.prompt, f.cats, [cat]) && numberAnswer(q, total - shown);
  },

  'timp-doua-serii': (q) => {
    const f = q.figure;
    if (f?.v !== 'chart-line' || !f.dates || f.series.length !== 2 || !onGrid(f, f.series.flatMap((s) => s.values)) || !solvedOk(q)) return false;
    const [A, B] = f.series;
    const { op } = q.ask;
    // cerința îi numește pe amândoi (la „în ce zi au … la fel” pe niciunul)
    if ([A, B].some((s) => says(q.prompt, s.name) !== (op !== 'dayEqual'))) return false;
    const diffs = f.dates.map((d) => lineValue(f, d, 'a') - lineValue(f, d, 'b'));
    const datesSaid = f.dates.filter((d) => says(q.prompt, `${d} ${f.month}`));
    if (op === 'sum' || op === 'diff') {
      const x = (op === 'sum' ? q.ask.refs : q.ask.a)[0].x;
      if (!same(datesSaid, [x])) return false;
      if (op === 'sum') return numberAnswer(q, lineValue(f, x, 'a') + lineValue(f, x, 'b'));
      return lineValue(f, x, 'a') > lineValue(f, x, 'b') && q.prompt.indexOf(A.name) < q.prompt.indexOf(B.name) && numberAnswer(q, diffs[f.dates.indexOf(x)]);
    }
    if (datesSaid.length) return false;
    if (op === 'dayMore') {
      const hits = f.dates.filter((_, i) => diffs[i] === q.ask.k);
      return hits.length === 1 && says(q.prompt, String(q.ask.k)) && pickAnswer(q, isX(f, hits[0]));
    }
    if (op === 'countDays') return numberAnswer(q, diffs.filter((d) => d > 0).length);
    const equal = f.dates.filter((_, i) => diffs[i] === 0);
    return equal.length === 1 && says(q.prompt, 'la fel') && pickAnswer(q, isX(f, equal[0]));
  },

  'timp-total': (q) => {
    const f = q.figure;
    if (f?.v !== 'chart-line' || !f.dates || !onGrid(f, f.series.flatMap((s) => s.values)) || !solvedOk(q)) return false;
    const { op } = q.ask;
    if (op === 'firstN') {
      const values = f.series[0].values;
      const n = q.ask.n;
      return f.series.length === 1 && says(q.prompt, f.series[0].name) && says(q.prompt, `primele ${n} zile`) && numberAnswer(q, sum(values.slice(0, n)));
    }
    if (op === 'growth') {
      const values = f.series[0].values;
      const grows = values.every((v, i) => i === 0 || v >= values[i - 1]);
      const { from, to } = q.ask;
      return grows && says(q.prompt, `pe ${from}`) && says(q.prompt, `pe ${to} ${f.month}`) && from < to && numberAnswer(q, lineValue(f, to) - lineValue(f, from));
    }
    const totals = f.dates.map((d) => lineValue(f, d, 'a') + lineValue(f, d, 'b'));
    const i = extreme(totals, 'max');
    return f.series.length === 2 && i >= 0 && says(q.prompt, 'împreună') && pickAnswer(q, isX(f, f.dates[i]));
  },

  venn: (q) => {
    const f = q.figure;
    if (f?.v !== 'venn' || !same(q.solved, { ...f, mark: q.ask.region })) return false;
    const { a, ab, b } = f.counts;
    const { region } = q.ask;
    const [sayA, sayB] = [says(q.prompt, f.a.name), says(q.prompt, f.b.name)];
    const expected = { ab: ab, a, A: a + ab, all: a + ab + b }[region];
    const wording = {
      ab: sayA && sayB && says(q.prompt, 'și'),
      a: sayA && !sayB && says(q.prompt, 'doar'),
      A: sayA && !sayB && !says(q.prompt, 'doar'),
      all: !sayA && !sayB && says(q.prompt, 'total'),
    }[region];
    return Boolean(wording) && numberAnswer(q, expected);
  },
};
