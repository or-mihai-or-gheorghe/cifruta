// Ajutoare comune pentru logica tipurilor de exerciții (pure, fără DOM).

/** items: [{ id, ok, credit?, expected, given, feedback? }] → { items, earned, total } */
export function makeResult(items) {
  const normalized = items.map((it) => ({ ...it, credit: it.credit ?? (it.ok ? 1 : 0) }));
  return {
    items: normalized,
    earned: normalized.reduce((s, it) => s + it.credit, 0),
    total: normalized.length,
  };
}

export function checkIds(list, label, errors) {
  const seen = new Set();
  for (const x of list ?? []) {
    if (!x || x.id === undefined || x.id === '') errors.push(`${label}: element fără id`);
    else if (seen.has(x.id)) errors.push(`${label}: id duplicat „${x.id}”`);
    seen.add(x?.id);
  }
}

/** Întreg între min și max, inclusiv. Răspunsurile vin din stocare, deci pot avea orice formă. */
export const isInt = (v, min = -Infinity, max = Infinity) => Number.isInteger(v) && v >= min && v <= max;

export const isBlank = (v) => v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0);

export const countAnswered = (ids, ans) => ids.filter((id) => !isBlank(ans?.[id])).length;

/** Mesajul țintit pentru un răspuns greșit anume: feedback: [{ if: 74, text: '…' }] */
export const feedbackFor = (list, given) =>
  isBlank(given) ? null : ((list ?? []).find((f) => String(f.if) === String(given))?.text ?? null);
