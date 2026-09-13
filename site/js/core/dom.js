// Ajutoare DOM mici.

/**
 * h('button', { class: 'c-btn', onClick: fn, 'aria-label': 'x' }, 'Text', copil, [copii])
 * `html` setează innerHTML — doar pentru ieșirea din markup.js / vizuale (deja escapate).
 */
export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props ?? {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k === 'style' && typeof v === 'object') {
      for (const [prop, val] of Object.entries(v)) {
        if (prop.startsWith('--')) el.style.setProperty(prop, val);
        else el.style[prop] = val;
      }
    }
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return el;
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export const clear = (el) => {
  el.replaceChildren();
  return el;
};

export const escapeHTML = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

let uidCounter = 0;
export const uid = (prefix = 'u') => `${prefix}${++uidCounter}`;

export const prefersReducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Rulează o animație scurtă pe element (implicit „pop”) și scoate clasa când se termină. */
export function pop(el, cls = 'anim-pop') {
  if (!el) return;
  el.classList.remove(cls);
  void el.offsetWidth; // repornește animația dacă era în curs
  el.classList.add(cls);
  el.addEventListener('animationend', function onEnd(e) {
    if (e.target !== el) return; // animationend urcă și de la copii (de ex. .ex-state)
    el.classList.remove(cls);
    el.removeEventListener('animationend', onEnd);
  });
}

const counting = new WeakMap(); // ultima numărătoare pornită pe fiecare element

/** Numără de la `from` la `to` în textul elementului (ease-out); sare direct la final la mișcare redusă. */
export function countUp(el, to, ms = 700, from = 0) {
  const token = {};
  counting.set(el, token); // o numărătoare nouă o oprește pe cea veche
  if (prefersReducedMotion() || !(to > from)) {
    el.textContent = String(to);
    return;
  }
  const start = performance.now();
  const tick = (now) => {
    if (counting.get(el) !== token) return;
    const t = Math.min(1, (now - start) / ms);
    el.textContent = String(Math.round(from + (to - from) * (1 - (1 - t) ** 3)));
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
