// Forme geometrice pentru Jocurile fulger (pur, fără DOM): contururi în cutia 100 × 100, transformări (mărime, rotire, oglindire),
// cheia canonică (două figuri care arată la fel au aceeași cheie), numele pentru cititorul de ecran și măsurători folosite de teste
// (laturi, unghiuri drepte, axe de simetrie). O figură: { shape, variant?, fill: plin|gol|dungi, color, size: mare|mic, rot, flip, open }.

const R = 44; // fiecare contur încape în cercul cu raza 44 din centru, deci rămâne în cutie oricum ar fi rotit
export const ROTS = [0, 45, 90, 135, 180, 225, 270, 315];
export const FILLS = ['plin', 'gol', 'dungi'];
export const COLORS = ['rosu', 'albastru', 'galben', 'verde', 'mov', 'portocaliu'];
export const SIZES = ['mare', 'mic'];

const round = (v) => Math.round(v * 100) / 100;
const rad = (deg) => (deg * Math.PI) / 180;
const polar = (r, deg, cx = 50, cy = 50) => [cx + r * Math.cos(rad(deg)), cy + r * Math.sin(rad(deg))];

/** `n` puncte pe o elipsă, pornind de sus, simetrice față de verticală. */
const ring = (n, rx, ry) => Array.from({ length: n }, (_, i) => [50 + rx * Math.cos(rad(-90 + (360 * i) / n)), 50 + ry * Math.sin(rad(-90 + (360 * i) / n))]);

function heart(n = 48) {
  return Array.from({ length: n }, (_, i) => {
    const t = (2 * Math.PI * i) / n;
    const x = 16 * Math.sin(t) ** 3;
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    return [50 + 2.7 * x, 50 + 2.7 * (y - 2.5)];
  });
}

/** Micșorează conturul, dacă trebuie, ca să încapă în cercul cu raza R. */
function fit(points) {
  const far = Math.max(...points.map(([x, y]) => Math.hypot(x - 50, y - 50)));
  const k = far > R ? R / far : 1;
  return points.map(([x, y]) => [round(50 + (x - 50) * k), round(50 + (y - 50) * k)]);
}

// gender: m/f pentru acordul adjectivelor (la plural toate cer forma de feminin: „cercuri pline”); program: figură din programă;
// curved: are laturi curbe
export const SHAPES = {
  patrat: { name: 'pătrat', plural: 'pătrate', gender: 'm', program: true, points: () => [[19, 19], [81, 19], [81, 81], [19, 81]] },
  dreptunghi: {
    name: 'dreptunghi',
    plural: 'dreptunghiuri',
    gender: 'm',
    program: true,
    points: () => [[8, 30], [92, 30], [92, 70], [8, 70]],
    variants: { ingust: () => [[6, 38], [94, 38], [94, 62], [6, 62]] },
    variantNames: { ingust: ['dreptunghi îngust', 'dreptunghiuri înguste'] },
  },
  triunghi: {
    name: 'triunghi',
    plural: 'triunghiuri',
    gender: 'm',
    program: true,
    points: () => ring(3, 44, 44),
    variants: { ascutit: () => [[50, 6], [70, 94], [30, 94]], dreptunghic: () => [[18, 18], [18, 82], [82, 82]] },
    variantNames: { ascutit: ['triunghi înalt', 'triunghiuri înalte'], dreptunghic: ['triunghi dreptunghic', 'triunghiuri dreptunghice'] },
  },
  cerc: { name: 'cerc', plural: 'cercuri', gender: 'm', program: true, curved: true, points: () => ring(48, 42, 42) },
  semicerc: { name: 'semicerc', plural: 'semicercuri', gender: 'm', program: true, curved: true, points: () => Array.from({ length: 25 }, (_, i) => polar(44, 180 + 7.5 * i, 50, 64)) },
  oval: { name: 'oval', plural: 'ovale', gender: 'm', curved: true, points: () => ring(48, 44, 28) },
  romb: { name: 'romb', plural: 'romburi', gender: 'm', points: () => [[50, 6], [78, 50], [50, 94], [22, 50]] },
  trapez: { name: 'trapez', plural: 'trapeze', gender: 'm', points: () => [[32, 28], [68, 28], [90, 72], [10, 72]] },
  paralelogram: { name: 'paralelogram', plural: 'paralelograme', gender: 'm', points: () => [[28, 30], [90, 30], [72, 70], [10, 70]] },
  sageata: { name: 'săgeată', plural: 'săgeți', gender: 'f', points: () => [[8, 40], [56, 40], [56, 18], [92, 50], [56, 82], [56, 60], [8, 60]] },
  stea: { name: 'stea', plural: 'stele', gender: 'f', points: () => Array.from({ length: 10 }, (_, i) => polar(i % 2 ? 18 : 44, -90 + 36 * i)) },
  inima: { name: 'inimă', plural: 'inimi', gender: 'f', curved: true, points: () => heart() },
  cruce: {
    name: 'cruce',
    plural: 'cruci',
    gender: 'f',
    points: () => [[36, 8], [64, 8], [64, 36], [92, 36], [92, 64], [64, 64], [64, 92], [36, 92], [36, 64], [8, 64], [8, 36], [36, 36]],
  },
  casa: { name: 'casă', plural: 'case', gender: 'f', points: () => [[50, 6], [88, 40], [88, 90], [12, 90], [12, 40]] },
};

const baseCache = new Map();

/** Conturul de bază al unei forme (varianta ei), potrivit în cutie. */
export function basePoints(shape, variant = null) {
  const id = `${shape}~${variant ?? ''}`;
  if (!baseCache.has(id)) {
    const s = SHAPES[shape];
    if (!s) throw new Error(`formă necunoscută: ${shape}`);
    const make = variant ? s.variants?.[variant] : s.points;
    if (!make) throw new Error(`variantă necunoscută: ${shape}~${variant}`);
    baseCache.set(id, fit(make()));
  }
  return baseCache.get(id);
}

export const normRot = (rot = 0) => ((Math.round(rot) % 360) + 360) % 360;

function transform(points, { size = 'mare', rot = 0, flip = false }) {
  const k = size === 'mic' ? 0.62 : 1;
  const a = rad(normRot(rot));
  const [c, s] = [Math.cos(a), Math.sin(a)];
  return points.map(([x0, y0]) => {
    const x = (flip ? 100 - x0 : x0) - 50;
    const y = y0 - 50;
    return [round(50 + k * (x * c - y * s)), round(50 + k * (x * s + y * c))];
  });
}

/** Conturul unei figuri, după mărime, oglindire (față de verticală) și rotire (în sensul acelor de ceas). */
export const outline = (g) => transform(basePoints(g.shape, g.variant), g);

/** Aceleași puncte, în orice ordine, cu toleranță. */
export function sameSet(a, b, tol = 0.6) {
  if (a.length !== b.length) return false;
  const used = new Array(b.length).fill(false);
  return a.every(([x, y]) => {
    const j = b.findIndex(([u, v], i) => !used[i] && Math.abs(u - x) <= tol && Math.abs(v - y) <= tol);
    if (j < 0) return false;
    used[j] = true;
    return true;
  });
}

const canonCache = new Map();

/** Rotirea și oglindirea „cele mai simple” care dau exact același contur (ex. pătratul rotit cu 90° = pătratul nerotit). */
export function canonical({ shape, variant = null, rot = 0, flip = false, open = false }) {
  const r = normRot(rot);
  if (open) return { rot: r, flip: Boolean(flip) }; // conturul deschis își pierde simetriile
  const id = `${shape}~${variant ?? ''}~${r}~${Boolean(flip)}`;
  if (!canonCache.has(id)) {
    const base = basePoints(shape, variant);
    const target = transform(base, { rot: r, flip });
    let found = { rot: r, flip: Boolean(flip) };
    search: for (const f of [false, true]) {
      for (const candidate of ROTS) {
        if (sameSet(target, transform(base, { rot: candidate, flip: f }))) {
          found = { rot: candidate, flip: f };
          break search;
        }
      }
    }
    canonCache.set(id, found);
  }
  return canonCache.get(id);
}

/**
 * Cheia canonică: două figuri care arată la fel au aceeași cheie (la umplerea „gol”, culoarea nu contează). Cu `count` (1–6), figura
 * e desenată de atâtea ori, micșorată (șirurile care cresc), iar mărimea nu mai contează.
 */
export function glyphKey(g) {
  const { rot, flip } = canonical(g);
  const fill = g.fill ?? 'plin';
  const color = fill === 'gol' ? '-' : (g.color ?? 'albastru');
  const size = g.count ? `x${g.count}` : (g.size ?? 'mare');
  return [`${g.shape}${g.variant ? `~${g.variant}` : ''}`, fill, color, size, `${rot}${flip ? 'f' : ''}${g.open ? 'o' : ''}`].join('.');
}

// [masculin, feminin, plural]; la plural, numele figurilor cer forma de feminin („cercuri pline”)
const COLOR_WORDS = {
  rosu: ['roșu', 'roșie', 'roșii'],
  albastru: ['albastru', 'albastră', 'albastre'],
  galben: ['galben', 'galbenă', 'galbene'],
  verde: ['verde', 'verde', 'verzi'],
  mov: ['mov', 'mov', 'mov'],
  portocaliu: ['portocaliu', 'portocalie', 'portocalii'],
};
const FILL_WORDS = { plin: ['plin', 'plină', 'pline'], gol: ['gol', 'goală', 'goale'], dungi: ['cu dungi', 'cu dungi', 'cu dungi'] };
const TURN_WORDS = {
  45: ['înclinat', 'înclinată'],
  90: ['întors spre dreapta', 'întoarsă spre dreapta'],
  135: ['înclinat', 'înclinată'],
  180: ['răsturnat', 'răsturnată'],
  225: ['înclinat', 'înclinată'],
  270: ['întors spre stânga', 'întoarsă spre stânga'],
  315: ['înclinat', 'înclinată'],
};

/** Numele figurii pentru cititorul de ecran: „stea mică, galbenă, cu dungi”; cu `count`: „3 cercuri, roșii, pline”. */
export function glyphName(g) {
  const s = SHAPES[g.shape];
  const count = Number(g.count) || 0;
  const i = count > 1 ? 2 : s.gender === 'f' ? 1 : 0;
  const { rot, flip } = canonical(g);
  const fill = g.fill ?? 'plin';
  const [name, plural] = g.variant ? s.variantNames[g.variant] : [s.name, s.plural];
  const parts = [count ? `${count} ${count > 1 ? plural : name}` : `${name}${g.size === 'mic' ? ` ${i ? 'mică' : 'mic'}` : ''}`];
  if (fill !== 'gol') parts.push(COLOR_WORDS[g.color ?? 'albastru'][i]);
  parts.push(FILL_WORDS[fill][i]);
  if (rot && !count) parts.push(TURN_WORDS[rot][i]);
  if (flip) parts.push('în oglindă');
  if (g.open) parts.push(i ? 'deschisă' : 'deschis');
  return parts.join(', ');
}

/** Laturile și unghiurile unui contur fără curbe; `curved: true` pentru cerc, semicerc, oval, inimă. */
export function measure(g) {
  if (SHAPES[g.shape].curved) return { curved: true, vertices: null, sides: null, rightAngles: null, equalSides: null };
  const pts = outline(g);
  const n = pts.length;
  const sides = pts.map((p, i) => Math.hypot(pts[(i + 1) % n][0] - p[0], pts[(i + 1) % n][1] - p[1]));
  const angles = pts.map((p, i) => {
    const [a, b] = [pts[(i + n - 1) % n], pts[(i + 1) % n]];
    const [ux, uy, vx, vy] = [a[0] - p[0], a[1] - p[1], b[0] - p[0], b[1] - p[1]];
    const cos = (ux * vx + uy * vy) / (Math.hypot(ux, uy) * Math.hypot(vx, vy));
    return (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
  });
  return {
    curved: false,
    vertices: n,
    sides,
    rightAngles: angles.filter((x) => Math.abs(x - 90) < 2).length,
    equalSides: sides.every((x) => Math.abs(x - sides[0]) < 1),
  };
}

/** Marginile conturului: [xMin, xMax, yMin, yMax]. */
export function bounds(g) {
  const pts = outline(g);
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  return [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
}

export const AXES = ['v', 'h', 'd1', 'd2'];
export const LINES = [...AXES, 'v-off', 'h-off'];

/** Linia candidată (două capete) prin centrul cutiei figurii: verticală, orizontală, diagonalele cutiei sau o linie deplasată. */
export function axisLine(g, kind) {
  const [x0, x1, y0, y1] = bounds(g);
  const [cx, cy] = [(x0 + x1) / 2, (y0 + y1) / 2];
  const out = 5;
  const diag = ([ax, ay], [bx, by]) => {
    const len = Math.hypot(bx - ax, by - ay);
    const [ux, uy] = [(bx - ax) / len, (by - ay) / len];
    return [[round(ax - ux * out), round(ay - uy * out)], [round(bx + ux * out), round(by + uy * out)]];
  };
  switch (kind) {
    case 'v':
      return [[round(cx), round(y0 - out)], [round(cx), round(y1 + out)]];
    case 'h':
      return [[round(x0 - out), round(cy)], [round(x1 + out), round(cy)]];
    case 'd1':
      return diag([x0, y0], [x1, y1]);
    case 'd2':
      return diag([x0, y1], [x1, y0]);
    case 'v-off':
      return [[round(cx + (x1 - x0) * 0.24), round(y0 - out)], [round(cx + (x1 - x0) * 0.24), round(y1 + out)]];
    case 'h-off':
      return [[round(x0 - out), round(cy + (y1 - y0) * 0.24)], [round(x1 + out), round(cy + (y1 - y0) * 0.24)]];
    default:
      throw new Error(`linie necunoscută: ${kind}`);
  }
}

function reflect([x, y], [[x1, y1], [x2, y2]]) {
  const [dx, dy] = [x2 - x1, y2 - y1];
  const t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);
  return [2 * (x1 + t * dx) - x, 2 * (y1 + t * dy) - y];
}

/** Linia e axă de simetrie: conturul oglindit față de ea se suprapune peste el însuși. */
export function isAxis(g, kind) {
  const pts = outline(g);
  const line = axisLine(g, kind);
  return sameSet(pts.map((p) => reflect(p, line)), pts, 0.9);
}

/** Câte dintre liniile verticală, orizontală și diagonalele cutiei sunt axe de simetrie. */
export const axesCount = (g) => AXES.filter((kind) => isAxis(g, kind)).length;
