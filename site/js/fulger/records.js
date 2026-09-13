// Calcul fulger: recordurile pe teme (modul pur, fără importuri). Cheile recordurilor și ale celor mai bune runde ale săptămânii sunt
// compuse, „temă:nivel”, și în browser (cifruta:fulger), și în cloud (state/fulger). Datele de dinainte de teme (cheia doar cu nivelul,
// runde fără temă) aparțin temei LEGACY_TOPIC și se normalizează la fiecare citire, fără script de migrare.

export const LEVEL_IDS = ['usor', 'intermediar', 'avansat'];
export const LEGACY_TOPIC = 'adunari-scaderi-100';

export const recordKey = (topic, level) => `${topic}:${level}`;

/** { topic, level } dintr-o cheie compusă sau dintr-una veche (doar nivelul). */
export function splitKey(key) {
  const i = key.lastIndexOf(':');
  return i < 0 ? { topic: LEGACY_TOPIC, level: key } : { topic: key.slice(0, i), level: key.slice(i + 1) };
}

const higher = (a, b) => ((b?.alune ?? 0) > (a?.alune ?? 0) ? b : a);
const laterWeek = (a, b) => (String(b?.id ?? '') > String(a?.id ?? '') || (b?.id === a?.id && (b?.alune ?? 0) > (a?.alune ?? 0)) ? b : a);

function normalizeMap(map, pick) {
  const out = {};
  for (const [key, value] of Object.entries(map ?? {})) {
    const k = LEVEL_IDS.includes(key) ? recordKey(LEGACY_TOPIC, key) : key;
    out[k] = k in out ? pick(out[k], value) : value;
  }
  return out;
}

/**
 * Datele Calcul fulger cu chei compuse și runde cu temă: { best, rounds, medals } (plus `week`, dacă există). Idempotentă: datele deja
 * normalizate ies la fel. Când aceeași înregistrare apare în ambele forme, rămâne recordul mai mare (la săptămână, cea mai nouă).
 */
export function normalizeFulger(data = {}) {
  const out = {
    best: normalizeMap(data?.best, higher),
    rounds: (data?.rounds ?? []).map((r) => (r.topic ? r : { ...r, topic: LEGACY_TOPIC })),
    medals: { ...(data?.medals ?? {}) },
  };
  if (data?.week) out.week = normalizeMap(data.week, laterWeek);
  return out;
}
