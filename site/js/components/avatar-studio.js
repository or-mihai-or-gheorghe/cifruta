// Atelierul avatarului: previzualizarea mare cu numele avatarului, butonul „La întâmplare”, filele (animal, culoare, fundal, pe cap,
// pe față, la gât) și variantele filei deschise, fiecare desenată cu aspectul de acum în care se schimbă doar acea alegere.
// Folosit în formularul profilului (#/profil) și în #/atelier/avatare. Tastatura: săgețile mută între file și între variante
// (alegerea urmează focusul, ca la butoanele radio), Home și End sar la capete.

import { ANIMALS, animalOf, avatarId, avatarLabel, BACKGROUNDS, COLORS, colorWord, lookColor, parseAvatar, randomLook, SLOTS } from '../core/avatar.js';
import { h, pop, uid } from '../core/dom.js';
import { play } from '../core/sound.js';
import { avatarSVG } from '../visuals/avatar.js';

const TABS = [
  { id: 'animal', label: 'Animal', group: 'Animalul' },
  { id: 'culoare', label: 'Culoare', group: 'Culoarea' },
  { id: 'fundal', label: 'Fundal', group: 'Fundalul' },
  { id: 'cap', label: 'Pe cap', group: 'Pe cap' },
  { id: 'fata', label: 'Pe față', group: 'Pe față' },
  { id: 'gat', label: 'La gât', group: 'La gât' },
];

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** Variantele unei file pentru aspectul dat: { testid, name, checked, next }, unde `next` e aspectul cu această alegere. */
function choicesOf(tab, look) {
  if (tab === 'animal') {
    return ANIMALS.map((a) => ({ testid: `avatar-${a.id}`, name: a.label, checked: a.id === look.animal, next: { ...look, animal: a.id } }));
  }
  const slot = SLOTS.find((s) => s.key === tab);
  const animal = animalOf(look.animal);
  let items;
  if (slot.key === 'culoare') {
    // culoarea naturală a animalului e chiar „Naturală”, deci nu apare de două ori
    const colors = COLORS.filter((c) => c.id !== animal.natural).map((c) => ({ id: c.id, value: c.id, name: colorWord(c.id, animal.gender) }));
    items = [{ id: 'natural', value: null, name: 'naturală' }, ...colors];
  } else if (slot.key === 'fundal') {
    items = BACKGROUNDS.map((b) => ({ id: b.id, value: b.id, name: b.label }));
  } else {
    items = [{ id: 'fara', value: null, name: 'fără' }, ...slot.list.map((x) => ({ id: x.id, value: x.id, name: x.label }))];
  }
  const chosen = slot.key === 'culoare' ? lookColor(look) : (look[slot.field] ?? null);
  return items.map((x) => ({ testid: `avatar-${slot.key}-${x.id}`, name: x.name, checked: x.value === chosen, next: { ...look, [slot.field]: x.value } }));
}

/**
 * avatarStudio({ value, tab, onChange, onTab }) → { el, get, tab }
 * `value` = textul avatarului (citit tolerant), `tab` = fila deschisă; `onChange(text, aspect)` la fiecare alegere, `onTab(fila)`.
 */
export function avatarStudio({ value = 'veverita', tab = 'animal', onChange, onTab } = {}) {
  let look = parseAvatar(value);
  let current = TABS.some((t) => t.id === tab) ? tab : 'animal';
  const panelId = uid('avatar-panel');

  const preview = h('div', { class: 'av-preview', 'aria-hidden': 'true', 'data-testid': 'avatar-preview' });
  const name = h('p', { class: 'av-name', 'aria-live': 'polite', 'data-testid': 'avatar-name' });
  const random = h('button', { type: 'button', class: 'c-btn c-btn--sm', 'data-testid': 'avatar-random', onClick: () => update(randomLook(look), true) }, 'La întâmplare');
  const group = h('div', { class: 'av-options', role: 'radiogroup', onKeydown: onChoiceKey });
  const tabs = TABS.map((t) =>
    h(
      'button',
      { type: 'button', role: 'tab', id: uid('avatar-tab'), class: 'c-tab av-tab', 'aria-controls': panelId, 'data-tab': t.id, 'data-testid': `avatar-tab-${t.id}`, onClick: () => open(t.id), onKeydown: onTabKey },
      t.label,
    ),
  );
  const panel = h('div', { class: 'av-panel', role: 'tabpanel', id: panelId }, group);
  const el = h(
    'div',
    { class: 'av-studio', 'data-testid': 'avatar-studio' },
    h('div', { class: 'av-stage' }, preview, h('div', { class: 'av-stage__side' }, name, random)),
    h('div', { class: 'av-controls' }, h('div', { class: 'c-tabs av-tabs', role: 'tablist', 'aria-label': 'Ce schimbi' }, tabs), panel),
  );

  function paintPreview() {
    const id = avatarId(look);
    preview.innerHTML = avatarSVG(id);
    name.textContent = capitalize(avatarLabel(id));
  }

  function paintChoices() {
    const choices = choicesOf(current, look);
    group.setAttribute('aria-label', TABS.find((t) => t.id === current).group);
    group.replaceChildren(
      ...choices.map((choice) =>
        h(
          'button',
          {
            type: 'button',
            class: 'av-option',
            role: 'radio',
            'aria-checked': String(choice.checked),
            tabindex: choice.checked ? '0' : '-1',
            'data-testid': choice.testid,
            onClick: (e) => pick(choice, e.currentTarget),
          },
          h('span', { class: 'av-option__art', 'aria-hidden': 'true', html: avatarSVG(avatarId(choice.next)) }),
          h('span', { class: 'av-option__name' }, capitalize(choice.name)),
        ),
      ),
    );
    if (!choices.some((c) => c.checked)) group.firstElementChild.tabIndex = 0;
  }

  // într-o filă, variantele diferă doar prin alegerea filei, deci miniaturile rămân bune: se schimbă doar bifa (focusul rămâne)
  function pick(choice, button) {
    for (const b of group.children) {
      b.setAttribute('aria-checked', String(b === button));
      b.tabIndex = b === button ? 0 : -1;
    }
    pop(button);
    update(choice.next);
  }

  function update(next, repaint = false) {
    look = next;
    paintPreview();
    if (repaint) paintChoices();
    pop(preview);
    play('tap');
    onChange?.(avatarId(look), { ...look });
  }

  function open(id) {
    current = id;
    for (const b of tabs) {
      const on = b.dataset.tab === id;
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
      b.classList.toggle('is-active', on);
      if (on) panel.setAttribute('aria-labelledby', b.id);
    }
    paintChoices();
    onTab?.(id);
  }

  function onTabKey(e) {
    const i = tabs.indexOf(e.currentTarget);
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    const target = tabs[(next + tabs.length) % tabs.length];
    target.focus();
    open(target.dataset.tab);
  }

  function onChoiceKey(e) {
    const buttons = [...group.children];
    const i = buttons.indexOf(document.activeElement);
    const next = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: buttons.length - 1 }[e.key];
    if (i < 0 || next === undefined) return;
    e.preventDefault();
    const target = buttons[(next + buttons.length) % buttons.length];
    target.focus();
    target.click();
  }

  paintPreview();
  open(current);
  return { el, get: () => avatarId(look), tab: () => current };
}
