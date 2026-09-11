// Evaluator de expresii cu numere întregi, fără eval.
// Operații: + − × : ( )  ·  Relații: < > = ≤ ≥ ≠ (pot fi înlănțuite: 36 < 38 < 40).
// Identificatorii (litere sau simboluri precum ⭐ 🌙) se citesc din `env`.

const OPS = { '+': '+', '-': '-', '−': '-', '–': '-', '×': '*', '·': '*', '*': '*', ':': '/', '÷': '/', '/': '/' };
const RELS = { '<': '<', '>': '>', '=': '=', '≤': '<=', '≥': '>=', '≠': '!=' };
const COMPARE = {
  '<': (a, b) => a < b,
  '>': (a, b) => a > b,
  '=': (a, b) => a === b,
  '<=': (a, b) => a <= b,
  '>=': (a, b) => a >= b,
  '!=': (a, b) => a !== b,
};

const isDigit = (c) => c >= '0' && c <= '9';
const isSpace = (c) => /\s/.test(c);
const isSpecial = (c) => Object.hasOwn(OPS, c) || Object.hasOwn(RELS, c) || c === '(' || c === ')';

export function tokenize(src) {
  const s = String(src).normalize('NFC').replace(/️/g, '');
  const out = [];
  for (let i = 0; i < s.length; ) {
    const c = s[i];
    if (isSpace(c)) { i++; continue; }
    if (isDigit(c)) {
      let j = i;
      while (j < s.length && isDigit(s[j])) j++;
      out.push({ t: 'num', v: Number(s.slice(i, j)) });
      i = j;
      continue;
    }
    const two = s.slice(i, i + 2);
    if (two === '<=' || two === '>=' || two === '!=') { out.push({ t: 'rel', v: two }); i += 2; continue; }
    if (Object.hasOwn(RELS, c)) { out.push({ t: 'rel', v: RELS[c] }); i++; continue; }
    if (Object.hasOwn(OPS, c)) { out.push({ t: 'op', v: OPS[c] }); i++; continue; }
    if (c === '(' || c === ')') { out.push({ t: c }); i++; continue; }
    let j = i;
    while (j < s.length && !isSpace(s[j]) && !isDigit(s[j]) && !isSpecial(s[j])) j++;
    out.push({ t: 'id', v: s.slice(i, j) });
    i = j;
  }
  return out;
}

// onOp(op, a, b) e anunțat la fiecare adunare sau scădere, cu operanzii ei (pentru trace)
function parser(tokens, env, onOp) {
  let pos = 0;
  const peek = () => tokens[pos];
  const next = () => tokens[pos++];

  function factor() {
    const tok = next();
    if (!tok) throw new Error('Expresie incompletă');
    if (tok.t === 'num') return tok.v;
    if (tok.t === 'id') {
      if (!Object.hasOwn(env, tok.v)) throw new Error(`Valoare necunoscută: ${tok.v}`);
      return Number(env[tok.v]);
    }
    if (tok.t === '(') {
      const v = sum();
      if (next()?.t !== ')') throw new Error('Lipsește paranteza de închidere');
      return v;
    }
    if (tok.t === 'op' && tok.v === '-') return -factor();
    if (tok.t === 'op' && tok.v === '+') return factor();
    throw new Error(`Simbol neașteptat: ${tok.v ?? tok.t}`);
  }

  function term() {
    let v = factor();
    while (peek()?.t === 'op' && (peek().v === '*' || peek().v === '/')) {
      const op = next().v;
      const r = factor();
      if (op === '*') v *= r;
      else {
        if (r === 0 || v % r !== 0) throw new Error('Împărțire neexactă');
        v /= r;
      }
    }
    return v;
  }

  function sum() {
    let v = term();
    while (peek()?.t === 'op' && (peek().v === '+' || peek().v === '-')) {
      const op = next().v;
      const r = term();
      onOp?.(op, v, r);
      v = op === '+' ? v + r : v - r;
    }
    return v;
  }

  return { sum, peek, next, done: () => pos >= tokens.length };
}

/** Valoarea unei expresii fără relații: calc("38 + 7") → 45 */
export function calc(src, env = {}) {
  const p = parser(tokenize(src), env);
  const v = p.sum();
  if (!p.done()) throw new Error(`Expresie invalidă: ${src}`);
  return v;
}

/** Adevărul unei relații (sau lanț de relații): holds("23 + 16 = 16 + 23") → true */
export function holds(src, env = {}) {
  const p = parser(tokenize(src), env);
  let left = p.sum();
  let seen = false;
  let ok = true;
  while (p.peek()?.t === 'rel') {
    const rel = p.next().v;
    const right = p.sum();
    ok = ok && COMPARE[rel](left, right);
    left = right;
    seen = true;
  }
  if (!p.done() || !seen) throw new Error(`Relație invalidă: ${src}`);
  return ok;
}

/** Adunările și scăderile dintr-o expresie sau relație, în ordinea calculului: trace("45 − 15 − 12") → [{ op:'-', a:45, b:15 }, { op:'-', a:30, b:12 }] */
export function trace(src, env = {}) {
  const ops = [];
  const p = parser(tokenize(src), env, (op, a, b) => ops.push({ op, a, b }));
  p.sum();
  while (p.peek()?.t === 'rel') {
    p.next();
    p.sum();
  }
  if (!p.done()) throw new Error(`Expresie invalidă: ${src}`);
  return ops;
}

export const relation = (a, b) => (a < b ? '<' : a > b ? '>' : '=');

export const hasRelation = (src) => tokenize(src).some((t) => t.t === 'rel');

/** true dacă textul conține doar numere, operații, relații și paranteze (se poate calcula direct) */
export const isPureMath = (src) => tokenize(src).every((t) => t.t !== 'id');
