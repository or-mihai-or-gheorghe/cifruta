// Fereastră de confirmare în pagină (dialog nativ), în loc de window.confirm.

import { h } from '../core/dom.js';
import { md } from '../core/markup.js';

export function confirmModal({ title, text, confirm = 'Da', cancel = 'Nu' }) {
  return new Promise((resolve) => {
    const dialog = h(
      'dialog',
      { class: 'c-modal anim-bounce-in', 'aria-labelledby': 'modal-title' },
      h('h2', { id: 'modal-title' }, title),
      text ? h('p', { class: 'u-mt-4', html: md(text) }) : null,
      h(
        'div',
        { class: 'c-modal__actions' },
        h('button', { class: 'c-btn', 'data-testid': 'modal-cancel', onClick: () => close(false) }, cancel),
        h('button', { class: 'c-btn c-btn--primary', 'data-testid': 'modal-confirm', onClick: () => close(true) }, confirm),
      ),
    );
    function close(value) {
      dialog.close();
      dialog.remove();
      resolve(value);
    }
    dialog.addEventListener('cancel', (e) => {
      e.preventDefault();
      close(false);
    });
    document.body.append(dialog);
    dialog.showModal();
  });
}
