// Mutare prin atingere sau tragere, pentru mouse, touch și tastatură.
// Mod principal: atinge un element (îl „ridici”), apoi atinge locul unde îl pui. Tragerea funcționează în plus.
//
// createDnd(root, { items: '.ex-drag', zones: '.ex-drop', onDrop(item, zone), locked: () => false })

const THRESHOLD = 8;

export function createDnd(root, { items, zones, onDrop, locked = () => false }) {
  let picked = null;
  let press = null; // { item, x, y, id }
  let ghost = null;
  let over = null;
  let suppressClick = false;

  const zoneAt = (x, y) => document.elementFromPoint(x, y)?.closest(zones);

  function pick(item) {
    unpick();
    picked = item;
    item.classList.add('is-picked');
    item.setAttribute('aria-pressed', 'true');
    root.classList.add('has-picked');
  }

  function unpick() {
    if (!picked) return;
    picked.classList.remove('is-picked');
    picked.setAttribute('aria-pressed', 'false');
    picked = null;
    root.classList.remove('has-picked');
  }

  function drop(item, zone) {
    unpick();
    if (item && zone && root.contains(zone)) onDrop(item, zone);
  }

  function setOver(zone) {
    if (over === zone) return;
    over?.classList.remove('is-over');
    over = zone;
    over?.classList.add('is-over');
  }

  function endDrag() {
    ghost?.remove();
    ghost = null;
    press?.item.classList.remove('is-dragging');
    setOver(null);
    press = null;
  }

  function onPointerDown(e) {
    if (locked() || e.button > 0) return;
    const item = e.target.closest(items);
    if (!item || !root.contains(item)) return;
    press = { item, x: e.clientX, y: e.clientY, id: e.pointerId };
  }

  function onPointerMove(e) {
    if (!press || e.pointerId !== press.id) return;
    if (!ghost) {
      if (Math.hypot(e.clientX - press.x, e.clientY - press.y) < THRESHOLD) return;
      const rect = press.item.getBoundingClientRect();
      ghost = press.item.cloneNode(true);
      ghost.classList.add('ex-ghost');
      ghost.removeAttribute('data-testid');
      Object.assign(ghost.style, { width: `${rect.width}px`, height: `${rect.height}px`, left: `${rect.left}px`, top: `${rect.top}px` });
      press.dx = press.x - rect.left;
      press.dy = press.y - rect.top;
      document.body.append(ghost);
      press.item.classList.add('is-dragging');
      press.item.setPointerCapture?.(e.pointerId);
      unpick();
    }
    e.preventDefault();
    ghost.style.left = `${e.clientX - press.dx}px`;
    ghost.style.top = `${e.clientY - press.dy}px`;
    const zone = zoneAt(e.clientX, e.clientY);
    setOver(zone && root.contains(zone) ? zone : null);
    if (e.clientY < 70) scrollBy(0, -14);
    else if (e.clientY > innerHeight - 70) scrollBy(0, 14);
  }

  function onPointerUp(e) {
    if (!press || e.pointerId !== press.id) return;
    if (ghost) {
      const item = press.item;
      const zone = over;
      suppressClick = true;
      setTimeout(() => { suppressClick = false; }, 0);
      endDrag();
      if (zone) drop(item, zone);
    } else {
      press = null;
    }
  }

  function onClick(e) {
    if (suppressClick || locked()) return;
    const item = e.target.closest(items);
    const zone = e.target.closest(zones);
    if (picked && zone && root.contains(zone) && zone !== picked) {
      e.preventDefault();
      drop(picked, zone);
      return;
    }
    if (item && root.contains(item)) {
      e.preventDefault();
      if (picked === item) unpick();
      else pick(item);
    }
  }

  function onKey(e) {
    if (e.key === 'Escape') unpick();
  }

  root.addEventListener('pointerdown', onPointerDown);
  root.addEventListener('click', onClick);
  root.addEventListener('keydown', onKey);
  addEventListener('pointermove', onPointerMove, { passive: false });
  addEventListener('pointerup', onPointerUp);
  addEventListener('pointercancel', endDrag);

  return {
    cancel: unpick,
    destroy() {
      endDrag();
      unpick();
      root.removeEventListener('pointerdown', onPointerDown);
      root.removeEventListener('click', onClick);
      root.removeEventListener('keydown', onKey);
      removeEventListener('pointermove', onPointerMove);
      removeEventListener('pointerup', onPointerUp);
      removeEventListener('pointercancel', endDrag);
    },
  };
}
