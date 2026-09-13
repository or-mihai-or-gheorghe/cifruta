// Administrarea (#/admin), doar pentru contul marcat în Firestore (admins/{uid}): conturile, profilurile lor, blocarea,
// schimbarea unei porecle nepotrivite și ștergerile. Contul Google însuși se dezactivează din consola Firebase.

import { accountState, connect, firebaseHandles, onAccountChange } from '../cloud/account.js';
import { deleteUserData, listProfiles, listUsers, removeEntries, renameProfile, setBlocked } from '../cloud/admin.js';
import { forgetBoards } from '../cloud/boards.js';
import { cleanNickname, nicknameError } from '../cloud/logic.js';
import { confirmModal } from '../components/modal.js';
import { backLink, callout, chip } from '../components/ui.js';
import { h } from '../core/dom.js';
import { cantitate, formatDateTime } from '../core/ro.js';
import { emojiHTML } from '../visuals/emoji.js';

export default function admin(container) {
  document.title = 'Administrare — Cifruța';
  const root = h('div', { class: 'l-container l-stack l-stack--lg', 'data-testid': 'admin' });
  container.append(root);
  let alive = true;
  let lastKey = null;

  const reload = () => {
    lastKey = null;
    render();
  };

  async function run(status, action, done, failure) {
    status.textContent = '';
    try {
      await action();
      forgetBoards();
      if (done) status.textContent = done;
      return true;
    } catch (err) {
      console.error(err);
      status.textContent = failure;
      return false;
    }
  }

  function profileRow(u, p, box, status) {
    const input = h('input', { type: 'text', class: 'acc-input adm-nick', maxlength: '20', value: p.nickname, 'aria-label': `Porecla nouă pentru ${p.nickname}`, 'data-testid': `admin-nick-${u.uid}-${p.id}` });
    return h(
      'li',
      { class: 'c-history__row', 'data-testid': `admin-profile-${u.uid}-${p.id}` },
      h(
        'span',
        { class: 'l-cluster' },
        h('span', { 'aria-hidden': 'true', html: emojiHTML(p.avatar) }),
        h('strong', {}, p.nickname),
        h('span', { class: 'u-small u-muted' }, [cantitate(p.attempts ?? 0, 'încercare', 'încercări'), cantitate(p.rounds ?? 0, 'rundă', 'runde'), cantitate((p.boards ?? []).length, 'clasament', 'clasamente'), p.showOnBoards ? null : 'ascuns din clasament'].filter(Boolean).join(' · ')),
      ),
      h(
        'span',
        { class: 'l-cluster' },
        h(
          'form',
          {
            class: 'l-cluster',
            onSubmit: async (e) => {
              e.preventDefault();
              const problem = nicknameError(input.value);
              if (problem) {
                status.textContent = problem;
                return;
              }
              if (await run(status, () => renameProfile(firebaseHandles(), u.uid, p.id, cleanNickname(input.value)), 'Porecla a fost schimbată.', 'Nu am putut schimba porecla.')) loadProfiles(u, box, status);
            },
          },
          input,
          h('button', { type: 'submit', class: 'c-btn c-btn--sm', 'data-testid': `admin-rename-${u.uid}-${p.id}` }, 'Redenumește'),
        ),
        h(
          'button',
          {
            type: 'button',
            class: 'c-btn c-btn--sm c-btn--ghost',
            'data-testid': `admin-entries-${u.uid}-${p.id}`,
            onClick: () => run(status, () => removeEntries(firebaseHandles(), u.uid, p), 'Intrările din clasamente au fost șterse.', 'Nu am putut șterge intrările.'),
          },
          'Șterge intrările',
        ),
      ),
    );
  }

  async function loadProfiles(u, box, status) {
    box.replaceChildren(h('p', { class: 'u-muted' }, 'Se încarcă profilurile…'));
    try {
      const profiles = await listProfiles(firebaseHandles(), u.uid);
      if (!alive) return;
      box.replaceChildren(profiles.length ? h('ul', { class: 'c-history' }, profiles.map((p) => profileRow(u, p, box, status))) : h('p', { class: 'u-muted' }, 'Niciun profil.'));
    } catch (err) {
      console.error(err);
      box.replaceChildren();
      status.textContent = 'Nu am putut încărca profilurile.';
    }
  }

  function userCard(u) {
    const box = h('div');
    const status = h('p', { class: 'u-small', role: 'status', 'data-testid': `admin-status-${u.uid}` });
    return h(
      'article',
      { class: 'c-card', 'data-testid': `admin-user-${u.uid}` },
      h(
        'div',
        { class: 'l-cluster l-cluster--between' },
        h('div', {}, h('strong', { class: 'u-break' }, u.email), h('div', { class: 'u-small u-muted' }, [u.name, u.lastSeen ? `ultima vizită: ${formatDateTime(u.lastSeen.toISOString())}` : null].filter(Boolean).join(' · '))),
        u.blocked ? chip('blocat', 'c-chip--soon') : null,
      ),
      h(
        'div',
        { class: 'l-cluster' },
        h('button', { type: 'button', class: 'c-btn c-btn--sm', 'data-testid': `admin-profiles-${u.uid}`, onClick: () => loadProfiles(u, box, status) }, 'Profiluri'),
        h(
          'button',
          {
            type: 'button',
            class: 'c-btn c-btn--sm',
            'data-testid': `admin-block-${u.uid}`,
            onClick: async () => {
              const blocking = !u.blocked;
              if (blocking && !(await confirmModal({ title: `Blochezi ${u.email}?`, text: 'Contul nu mai poate salva rezultate, iar intrările lui ies din clasamente.', confirm: 'Blochează', cancel: 'Renunță' }))) return;
              if (await run(status, () => setBlocked(firebaseHandles(), u.uid, blocking), null, 'Nu am putut schimba blocarea.')) reload();
            },
          },
          u.blocked ? 'Deblochează' : 'Blochează',
        ),
        h(
          'button',
          {
            type: 'button',
            class: 'c-btn c-btn--sm acc-danger',
            'data-testid': `admin-delete-${u.uid}`,
            onClick: async () => {
              if (!(await confirmModal({ title: `Ștergi datele contului ${u.email}?`, text: 'Se șterg profilurile, rezultatele și intrările din clasamente. Nu se poate anula.', confirm: 'Șterge', cancel: 'Renunță' }))) return;
              status.textContent = 'Se șterg datele…';
              if (await run(status, () => deleteUserData(firebaseHandles(), u.uid), null, 'Nu am putut șterge toate datele.')) reload();
            },
          },
          'Șterge datele',
        ),
      ),
      status,
      box,
    );
  }

  async function loadUsers(list) {
    try {
      const users = await listUsers(firebaseHandles());
      if (!alive || !list.isConnected) return;
      list.replaceChildren(h('p', { class: 'u-muted' }, cantitate(users.length, 'cont', 'conturi')), ...users.map(userCard));
    } catch (err) {
      console.error(err);
      if (alive && list.isConnected) list.replaceChildren(callout('bad', 'capcana', 'Nu am putut încărca conturile.'));
    }
  }

  function body(s) {
    if (!s.user) return [callout('idea', 'lacat', 'Intră mai întâi în cont, din <a href="#/profil">contul familiei</a>.')];
    if (s.status === 'error') return [callout('bad', 'capcana', 'Contul nu s-a putut încărca.')];
    if (s.status !== 'ready') return [h('p', { class: 'u-muted' }, 'Se încarcă…')];
    if (!s.admin) return [callout('warn', 'lacat', 'Această pagină e doar pentru administratorul site-ului.')];
    const list = h('div', { class: 'l-stack', 'data-testid': 'admin-users' }, h('p', { class: 'u-muted' }, 'Se încarcă conturile…'));
    loadUsers(list);
    return [
      h('p', { class: 'u-small u-muted' }, 'Blocarea oprește scrierile contului și îi scoate intrările din clasamente. Contul Google însuși se dezactivează din consola Firebase (Authentication → Users).'),
      list,
    ];
  }

  function render() {
    const s = accountState();
    const key = JSON.stringify([s.status, s.user?.uid, s.admin]);
    if (key === lastKey) return;
    lastKey = key;
    root.replaceChildren(backLink('#/profil', 'Contul familiei'), h('h1', {}, 'Administrare'), ...body(s));
  }

  const stop = onAccountChange(render);
  connect();
  render();
  return () => {
    alive = false;
    stop();
  };
}
