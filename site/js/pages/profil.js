// Contul familiei (#/profil): intrarea cu Google, acordul părintelui, profilurile copiilor (cine joacă), editarea lor,
// mutarea rezultatelor fără cont și, pentru părinți, sincronizarea, ieșirea din cont și ștergerea datelor.

import {
  accountState, addProfile, anonymousCounts, connect, deleteAccount, giveConsent, moveAnonymousInto, onAccountChange, playAs, removeProfile,
  signIn, signOut, updateProfile,
} from '../cloud/account.js';
import { cloudConfigured } from '../cloud/config.js';
import { AVATARS, nicknameError } from '../cloud/logic.js';
import { onSyncChange, syncStatus } from '../cloud/sync.js';
import { confirmModal } from '../components/modal.js';
import { art, backLink, callout, chip } from '../components/ui.js';
import { escapeHTML, h, uid } from '../core/dom.js';
import { cantitate } from '../core/ro.js';
import { EMOJI, emojiHTML } from '../visuals/emoji.js';

const GOOGLE_G =
  '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';

const keyOf = (s) => JSON.stringify([s.status, s.user?.uid, s.consent, s.admin, s.blocked, s.pid, s.error, s.notice, s.profiles.map((p) => [p.id, p.nickname, p.avatar, p.showOnBoards])]);

function syncText(s) {
  const sync = syncStatus();
  if (!s.pid) return 'Alege cine joacă, ca rezultatele să ajungă în cont.';
  if (s.blocked) return 'Contul e oprit: rezultatele noi rămân în acest browser.';
  const waiting = sync.pending ? `${cantitate(sync.pending, 'salvare', 'salvări')} așteaptă să ajungă în cont.` : '';
  if (sync.error) return `${waiting} ${sync.error}`.trim();
  if (sync.syncing) return 'Se trimit rezultatele…';
  return waiting || (sync.lastSync ? 'Toate rezultatele sunt în cont.' : 'Se pregătește sincronizarea…');
}

export default function profil(container) {
  document.title = 'Contul familiei — Cifruța';
  const root = h('div', { class: 'l-container l-container--narrow l-stack l-stack--lg', 'data-testid': 'account-page' });
  container.append(root);
  let editing = null; // id-ul profilului editat sau 'new'
  let lastKey = null;
  let syncLine = null;

  function render(force = false) {
    const s = accountState();
    const key = keyOf(s) + editing;
    if (!force && key === lastKey) return;
    lastKey = key;
    syncLine = null;
    root.replaceChildren(backLink('#/', 'Înapoi la teste'), ...view(s).filter(Boolean)); // replaceChildren ar scrie „null”
  }

  function view(s) {
    if (!cloudConfigured()) return [h('h1', {}, 'Contul familiei'), callout('idea', 'idee', 'Conturile vor fi disponibile în curând. Până atunci, rezultatele se păstrează în acest browser.')];
    const notice = s.notice ? callout('ok', 'bravo', escapeHTML(s.notice)) : null;
    if (!s.user) return [notice, signInCard(s)];
    if (s.status === 'loading') return [h('h1', {}, 'Contul familiei'), h('p', { class: 'c-card u-center u-muted', 'data-testid': 'account-loading' }, 'Se încarcă contul…')];
    if (s.status === 'error') {
      return [
        h('h1', {}, 'Contul familiei'),
        callout('bad', 'capcana', escapeHTML(s.error ?? 'Contul nu s-a putut încărca.')),
        h('div', { class: 'l-cluster' }, h('button', { type: 'button', class: 'c-btn c-btn--primary', onClick: () => location.reload() }, 'Reîncarcă pagina')),
      ];
    }
    const blocked = s.blocked ? callout('warn', 'capcana', 'Contul a fost oprit de administrator. Rezultatele se păstrează în acest browser, dar nu mai ajung în cont și în clasament.') : null;
    if (!s.consent) return [notice, blocked, consentCard(s), parentsBox(s)];
    return [
      notice,
      h('h1', {}, 'Cine joacă?'),
      blocked,
      s.profiles.length
        ? h('div', { class: 'acc-profiles', 'data-testid': 'profiles' }, s.profiles.map((p) => (editing === p.id ? profileForm(s, p) : profileCard(s, p))), !s.blocked && s.profiles.length < 6 ? addTile(s) : null)
        : profileForm(s, null),
      parentsBox(s),
    ];
  }

  // ——— intrarea ———

  function signInCard(s) {
    return h(
      'section',
      { class: 'c-card acc-signin anim-fade-up', 'data-testid': 'sign-in-card' },
      art({ v: 'mascot', mood: 'vesela', decorative: true }, { cls: 'acc-signin__art anim-float' }),
      h('h1', {}, 'Contul familiei'),
      h(
        'ul',
        { class: 'c-list' },
        h('li', {}, 'Rezultatele copiilor se păstrează în cont și apar pe orice dispozitiv.'),
        h('li', {}, 'Fiecare copil are profilul lui, cu poreclă și avatar.'),
        h('li', {}, 'Clasamentul de la Calcul fulger și stelele de la teste, doar cu porecla.'),
      ),
      h(
        'button',
        {
          type: 'button',
          class: 'c-btn c-btn--lg acc-google',
          'data-testid': 'sign-in',
          onClick: async (e) => {
            const btn = e.currentTarget;
            btn.disabled = true;
            await signIn();
            btn.disabled = false;
          },
        },
        h('span', { class: 'acc-google__g', html: GOOGLE_G }),
        'Intră cu Google',
      ),
      s.error ? callout('bad', 'capcana', escapeHTML(s.error)) : null,
      h('p', { class: 'u-small u-muted' }, 'Contul e pentru părinți. Fără cont, rezultatele rămân doar în acest browser. ', h('a', { href: '#/confidentialitate' }, 'Ce păstrăm și cum ștergi datele'), '.'),
    );
  }

  // ——— acordul părintelui ———

  function consentCard(s) {
    const id = uid('consent');
    const check = h('input', { type: 'checkbox', id, 'data-testid': 'consent-check' });
    const error = h('p', { class: 'acc-error', role: 'alert' });
    const go = h('button', { type: 'submit', class: 'c-btn c-btn--primary', disabled: true, 'data-testid': 'consent-ok' }, 'Continuă');
    check.addEventListener('change', () => {
      go.disabled = !check.checked;
    });
    return h(
      'form',
      {
        class: 'c-card acc-consent',
        'data-testid': 'consent',
        onSubmit: async (e) => {
          e.preventDefault();
          go.disabled = true;
          try {
            await giveConsent();
          } catch {
            error.textContent = 'Nu am putut salva acordul. Verifică internetul și încearcă din nou.';
            go.disabled = false;
          }
        },
      },
      h('h1', {}, `Bun venit${s.user.name ? `, ${s.user.name.split(' ')[0]}` : ''}!`),
      h('p', {}, 'Înainte de primul profil: Cifruța păstrează în cont porecla și avatarul fiecărui copil și rezultatele lui (încercările la teste și rundele de Calcul fulger). În clasament apar doar porecla, avatarul și scorul, și doar pentru cei intrați în cont.'),
      h('label', { class: 'acc-check', for: id }, check, h('span', {}, 'Sunt părintele sau tutorele copiilor care vor juca și sunt de acord ca aceste date să fie păstrate, cum scrie în ', h('a', { href: '#/confidentialitate' }, 'pagina de confidențialitate'), '.')),
      error,
      h('div', { class: 'l-cluster' }, go),
    );
  }

  // ——— profilurile ———

  function profileCard(s, p) {
    const active = p.id === s.pid;
    return h(
      'article',
      { class: `c-card acc-profile${active ? ' is-active' : ''}`, 'data-testid': `profile-${p.id}` },
      h('div', { class: 'acc-profile__avatar', 'aria-hidden': 'true', html: emojiHTML(p.avatar) }),
      h('h2', { class: 'acc-profile__name' }, p.nickname),
      h('p', { class: 'u-small u-muted' }, [cantitate(p.attempts ?? 0, 'încercare', 'încercări'), cantitate(p.rounds ?? 0, 'rundă', 'runde'), p.showOnBoards ? null : 'în afara clasamentului'].filter(Boolean).join(' · ')),
      h(
        'div',
        { class: 'acc-profile__actions' },
        active
          ? chip('Joacă acum', 'c-chip--ok', 'bravo')
          : h(
              'button',
              {
                type: 'button',
                class: 'c-btn c-btn--primary',
                'data-testid': `play-${p.id}`,
                onClick: async (e) => {
                  e.currentTarget.disabled = true;
                  await playAs(p.id);
                },
              },
              `Joacă ca ${p.nickname}`,
            ),
        s.blocked
          ? null
          : h(
              'button',
              {
                type: 'button',
                class: 'c-btn c-btn--sm c-btn--ghost',
                'data-testid': `edit-${p.id}`,
                onClick: () => {
                  editing = p.id;
                  render(true);
                },
              },
              'Editează',
            ),
      ),
    );
  }

  function addTile() {
    if (editing === 'new') return profileForm(accountState(), null);
    return h(
      'button',
      {
        type: 'button',
        class: 'c-card acc-add',
        'data-testid': 'add-profile',
        onClick: () => {
          editing = 'new';
          render(true);
        },
      },
      h('span', { class: 'acc-add__plus', 'aria-hidden': 'true' }, '+'),
      'Adaugă un profil',
    );
  }

  function profileForm(s, profile) {
    const first = !s.profiles.length;
    const id = uid('nick');
    const used = new Set(s.profiles.map((p) => p.avatar));
    let avatar = profile?.avatar ?? AVATARS.find((a) => !used.has(a)) ?? AVATARS[0];
    const nickname = h('input', { type: 'text', id, class: 'acc-input', maxlength: '20', autocomplete: 'off', spellcheck: 'false', 'data-testid': 'profile-nickname' });
    nickname.value = profile?.nickname ?? '';
    const buttons = AVATARS.map((name) =>
      h('button', {
        type: 'button',
        class: 'acc-avatar',
        role: 'radio',
        'aria-checked': String(name === avatar),
        'aria-label': EMOJI[name].label,
        title: EMOJI[name].label,
        'data-testid': `avatar-${name}`,
        html: emojiHTML(name),
        onClick: () => {
          avatar = name;
          for (const b of buttons) b.setAttribute('aria-checked', String(b.dataset.testid === `avatar-${name}`));
        },
      }),
    );
    const boards = h('input', { type: 'checkbox', checked: profile ? profile.showOnBoards : true, 'data-testid': 'profile-boards' });
    const error = h('p', { class: 'acc-error', role: 'alert', 'data-testid': 'profile-error' });
    const save = h('button', { type: 'submit', class: 'c-btn c-btn--primary', 'data-testid': 'profile-save' }, profile ? 'Salvează' : 'Adaugă profilul');
    const cancel = first ? null : h('button', { type: 'button', class: 'c-btn', onClick: () => { editing = null; render(true); } }, 'Renunță');
    const remove = profile
      ? h(
          'button',
          {
            type: 'button',
            class: 'c-btn c-btn--sm c-btn--ghost acc-danger',
            'data-testid': 'profile-delete',
            onClick: async (e) => {
              const ok = await confirmModal({ title: `Ștergi profilul ${profile.nickname}?`, text: 'Se șterg toate rezultatele lui, din cont și din acest browser, și intrările lui din clasament. Nu se poate anula.', confirm: 'Șterge', cancel: 'Păstrează' });
              if (!ok) return;
              const btn = e.target.closest('button');
              btn.disabled = true;
              try {
                await removeProfile(profile.id);
                editing = null;
                render(true);
              } catch {
                error.textContent = 'Nu am putut șterge profilul. Verifică internetul și încearcă din nou.';
                btn.disabled = false;
              }
            },
          },
          'Șterge profilul',
        )
      : null;

    return h(
      'form',
      {
        class: 'c-card acc-form',
        'data-testid': 'profile-form',
        onSubmit: async (e) => {
          e.preventDefault();
          const problem = nicknameError(nickname.value);
          if (problem) {
            error.textContent = problem;
            nickname.focus();
            return;
          }
          save.disabled = true;
          error.textContent = '';
          try {
            if (profile) {
              await updateProfile(profile.id, { nickname: nickname.value, avatar, showOnBoards: boards.checked });
              editing = null;
              render(true);
              return;
            }
            const created = await addProfile({ nickname: nickname.value, avatar, showOnBoards: boards.checked });
            editing = null;
            const anon = anonymousCounts();
            if (accountState().profiles.length === 1 && (anon.attempts || anon.rounds)) {
              const parts = [anon.attempts ? `${cantitate(anon.attempts, 'încercare', 'încercări')} la teste` : null, anon.rounds ? `${cantitate(anon.rounds, 'rundă', 'runde')} de Calcul fulger` : null].filter(Boolean).join(' și ');
              const move = await confirmModal({ title: 'Adaugi rezultatele din acest browser?', text: `Aici sunt salvate fără cont ${parts}. Le adaugi în profilul **${escapeHTML(created.nickname)}**?`, confirm: 'Da, adaugă-le', cancel: 'Nu' });
              if (move) await moveAnonymousInto(created.id);
            }
            await playAs(created.id);
            render(true);
          } catch {
            error.textContent = 'Nu am putut salva profilul. Verifică internetul și încearcă din nou.';
            save.disabled = false;
          }
        },
      },
      h('h2', {}, profile ? `Editează profilul ${profile.nickname}` : first ? 'Primul profil' : 'Profil nou'),
      first ? h('p', { class: 'u-muted' }, 'Un profil pentru fiecare copil. Poți adăuga până la 6.') : null,
      h('label', { class: 'acc-field', for: id }, h('span', { class: 'acc-field__label' }, 'Porecla'), nickname, h('span', { class: 'u-small u-muted' }, 'Porecla apare în clasament: alege una fără numele complet al copilului.')),
      h('fieldset', { class: 'acc-field' }, h('legend', { class: 'acc-field__label' }, 'Avatarul'), h('div', { class: 'acc-avatars', role: 'radiogroup', 'aria-label': 'Avatarul' }, buttons)),
      h('label', { class: 'acc-check' }, boards, h('span', {}, 'Apare în clasament (doar porecla, avatarul și scorul)')),
      error,
      h('div', { class: 'l-cluster' }, save, cancel, remove),
    );
  }

  // ——— pentru părinți ———

  function parentsBox(s) {
    syncLine = h('p', { class: 'u-small', 'data-testid': 'sync-status' }, syncText(s));
    const status = h('p', { class: 'acc-error', role: 'alert' });
    const signOutBtn = h(
      'button',
      {
        type: 'button',
        class: 'c-btn c-btn--sm',
        'data-testid': 'sign-out',
        onClick: async () => {
          signOutBtn.disabled = true;
          let result = await signOut();
          if (!result.ok) {
            const ok = await confirmModal({ title: 'Ieși oricum?', text: `${cantitate(result.pending, 'salvare', 'salvări')} n-au ajuns încă în cont și se pierd dacă ieși acum.`, confirm: 'Ieși oricum', cancel: 'Rămân' });
            if (ok) result = await signOut({ force: true });
          }
          signOutBtn.disabled = false;
        },
      },
      'Ieși din cont',
    );
    const deleteBtn = h(
      'button',
      {
        type: 'button',
        class: 'c-btn c-btn--sm acc-danger',
        'data-testid': 'delete-account',
        onClick: async () => {
          const ok = await confirmModal({ title: 'Ștergi contul?', text: 'Se șterg **toate profilurile**, rezultatele lor, intrările din clasament și contul. Nu se poate anula.', confirm: 'Șterge tot', cancel: 'Păstrează' });
          if (!ok) return;
          deleteBtn.disabled = true;
          status.textContent = 'Se șterg datele…';
          try {
            await deleteAccount();
          } catch (err) {
            status.textContent = err?.code === 'cifruta/reauth'
              ? 'Datele au fost șterse. Google cere să confirmi contul: apasă din nou „Șterge contul și toate datele”.'
              : 'Nu am putut șterge tot. Verifică internetul și încearcă din nou.';
            deleteBtn.disabled = false;
          }
        },
      },
      'Șterge contul și toate datele',
    );
    return h(
      'section',
      { class: 'c-card acc-parents', 'data-testid': 'parents-account' },
      h('h2', {}, 'Pentru părinți'),
      h('p', {}, 'Contul: ', h('strong', { class: 'u-break' }, s.user.email)),
      syncLine,
      h(
        'div',
        { class: 'l-cluster' },
        s.admin ? h('a', { class: 'c-btn c-btn--sm', href: '#/admin', 'data-testid': 'admin-link' }, h('span', { 'aria-hidden': 'true', html: emojiHTML('unelte') }), 'Administrare') : null,
        signOutBtn,
      ),
      h(
        'details',
        { class: 'c-explain' },
        h('summary', {}, 'Ștergerea contului'),
        h('div', { class: 'c-explain__body' }, h('p', { class: 'u-small' }, 'Ștergi profilurile, rezultatele, intrările din clasament și contul. Un singur profil se șterge din „Editează”.'), h('div', { class: 'l-cluster' }, deleteBtn), status),
      ),
      h('p', { class: 'u-small u-muted' }, h('a', { href: '#/confidentialitate' }, 'Ce păstrăm și cum ștergi datele')),
    );
  }

  const stopAccount = onAccountChange(() => render());
  const stopSync = onSyncChange(() => {
    if (syncLine) syncLine.textContent = syncText(accountState());
  });
  connect();
  render(true);
  return () => {
    stopAccount();
    stopSync();
  };
}
