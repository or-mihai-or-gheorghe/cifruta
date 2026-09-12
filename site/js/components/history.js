// Istoricul de rezultate, pentru părinți: rezumatul încercărilor și ștergerea lor (pe test, pe secțiune sau tot).

import { h } from '../core/dom.js';
import { cantitate } from '../core/ro.js';
import { refresh } from '../core/router.js';
import { clearHistory, listAttempts } from '../core/storage.js';
import { confirmModal } from './modal.js';

/** Buton care cere confirmare, apoi șterge istoricul testelor date (null = toate) și reîmprospătează pagina. */
export function clearHistoryButton({ label, text, testIds, testid, cls = 'c-btn c-btn--sm', after = refresh }) {
  return h(
    'button',
    {
      type: 'button',
      class: cls,
      'data-testid': testid,
      onClick: async () => {
        const ok = await confirmModal({ title: 'Ștergi rezultatele?', text: `${text} Nu se poate anula.`, confirm: 'Șterge', cancel: 'Păstrează' });
        if (!ok) return;
        clearHistory(testIds);
        after();
      },
    },
    label,
  );
}

/** Caseta „Pentru părinți”: încercările salvate pentru testele date, cu ștergere pe test și pe tot ansamblul. */
export function historyBox(tests, scope) {
  const rows = tests.map((t) => ({ t, attempts: listAttempts(t.id) })).filter((r) => r.attempts.length);
  const list = rows.length
    ? h(
        'ul',
        { class: 'c-history' },
        rows.map(({ t, attempts }) =>
          h(
            'li',
            { class: 'c-history__row' },
            h('span', {}, h('strong', {}, t.title), ` — ${cantitate(attempts.length, 'încercare', 'încercări')} · cel mai bun scor ${Math.max(...attempts.map((a) => a.score))}`),
            clearHistoryButton({ label: 'Șterge', text: `Se șterg toate încercările la „${t.title}” și ciorna începută.`, testIds: [t.id], testid: `clear-test-${t.id}`, cls: 'c-btn c-btn--sm c-btn--ghost' }),
          ),
        ),
      )
    : h('p', { class: 'u-muted' }, 'Nu există rezultate salvate aici.');
  return h(
    'details',
    { class: 'c-explain', 'data-testid': 'parents' },
    h('summary', {}, 'Pentru părinți'),
    h(
      'div',
      { class: 'c-explain__body' },
      h('p', { class: 'u-small u-muted' }, 'Rezultatele se salvează doar în acest browser. Ștergerea le scoate din istoric și de pe cardurile testelor.'),
      list,
      rows.length ? h('div', { class: 'l-cluster' }, clearHistoryButton(scope)) : null,
    ),
  );
}
