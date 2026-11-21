// Învață: textele calculelor (pur, fără DOM). Spațiile nedespărțite țin calculul pe un rând; într-o sumă lungă rândul se poate rupe
// doar după „+”, ca niciun termen să nu rămână singur pe rândul următor fără semnul lui.

export const NBSP = ' ';

/**
 * Convenția factorilor: „3 × 4” = „de 3 ori câte 4” = 4 + 4 + 4 (întâi câte grupe, apoi câte în grupă). Nu e încă verificată cu
 * manualul (docs/STARE.md): dacă manualul scrie invers, se schimbă doar aici.
 */
export const GROUPS_FIRST = true;

/** Factorii unui produs, după convenție: câte grupe și câte în fiecare grupă → [primul factor, al doilea]. */
export const factorsOf = (groups, each) => (GROUPS_FIRST ? [groups, each] : [each, groups]);

/** „3 × 4”. */
export const times = (a, b) => `${a}${NBSP}×${NBSP}${b}`;

/** „3 × 4 = 12”; un rezultat ascuns se scrie „?”. */
export const equation = (a, b, result) => `${times(a, b)}${NBSP}=${NBSP}${result}`;

/** Suma a `n` termeni egali: „4 + 4 + 4 = 12” (cu un singur termen nu e sumă: null). */
export function repeatedSum(term, n, result) {
  if (n < 2) return null;
  return `${Array(n).fill(term).join(`${NBSP}+ `)}${NBSP}=${NBSP}${result}`;
}

/** Textul pentru cititorul de ecran: semnele devin cuvinte. */
export const spokenMath = (text) =>
  String(text ?? '')
    .replace(/ /g, ' ')
    // „24 : 6” se citește „24 împărțit la 6”, dar „Proba: 4 × 6” rămâne cum e (două puncte lipite de cuvânt)
    .replace(/(?<=[\d□?]) : (?=[\d□?])/g, ' împărțit la ')
    .replace(/□/g, 'căsuța')
    .replace(/×/g, 'ori')
    .replace(/=/g, 'egal')
    .replace(/\+/g, 'plus')
    .replace(/−/g, 'minus')
    .replace(/\?/g, 'cât')
    .replace(/\s+/g, ' ')
    .trim();

/** Un text al lecției (cerință, indicație, „Ce am aflat”) cu calculele ținute pe un rând: „6 × 7 = 42” și „24 : 6 = 4” nu se rup, o sumă
 *  se rupe doar după „+”. Textele din date se scriu cu spații obișnuite (două puncte lipite de cuvânt, ca în „Proba:”, nu se ating). */
export const keepMath = (text) =>
  String(text ?? '')
    .replace(/(\S) ([×=:]) (?=\S)/g, `$1${NBSP}$2${NBSP}`)
    .replace(/(\S) ([+−]) (?=\S)/g, `$1${NBSP}$2 `);
