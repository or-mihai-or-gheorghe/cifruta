// Confidențialitate: ce păstrează Cifruța când un părinte intră în cont, unde, cine vede și cum se șterg datele.

import { h } from '../core/dom.js';
import { backLink, mascot } from '../components/ui.js';

const ISSUES = 'https://github.com/or-mihai-or-gheorghe/cifruta/issues';

const SECTIONS = [
  {
    title: 'Fără cont',
    items: [
      'Toate testele și Jocurile fulger merg fără cont.',
      'Rezultatele rămân doar în acest browser. Nu folosim reclame, cookie-uri de urmărire sau statistici de vizitare.',
    ],
  },
  {
    title: 'Contul familiei',
    items: [
      'Intră în cont doar un părinte sau un tutore, cu contul lui Google. Copiii nu au conturi.',
      'La primul profil, părintele confirmă că este părintele sau tutorele copilului și că este de acord cu această pagină. În România, pentru copiii sub 16 ani e nevoie de acordul părintelui.',
      'Din contul Google păstrăm e-mailul și numele. Mai păstrăm data creării contului, a ultimei vizite și a acordului.',
      'Pentru fiecare copil se aleg o poreclă și un avatar desenat (un animal, cu o culoare, un fundal și accesorii alese dintr-o listă). Nu cerem numele real, vârsta, școala sau fotografii.',
      'Pentru fiecare profil păstrăm rezultatele: încercările la teste (cu răspunsurile date), rundele de la Jocuri fulger, recordurile și medaliile.',
    ],
  },
  {
    title: 'Unde stau datele',
    items: [
      'Rezultatele stau în Google Cloud Firestore, în centre de date din Europa. Intrarea în cont o face Firebase Authentication, un serviciu Google.',
      'Folosim datele doar ca să arătăm rezultatele pe orice dispozitiv și clasamentul. Nu le vindem și nu le dăm altcuiva.',
    ],
  },
  {
    title: 'Cine vede ce',
    items: [
      'Rezultatele unui profil le vede doar părintele care l-a creat.',
      'Clasamentul îl văd doar cei intrați în cont. Arată porecla, avatarul și scorul, fără e-mailuri sau nume.',
      'Un profil poate ieși oricând din clasament, din pagina contului. Intrările lui se șterg atunci.',
      'Administratorul site-ului vede conturile ca să oprească abuzurile: poate schimba o poreclă nepotrivită, poate scoate intrări din clasament și poate bloca un cont.',
    ],
  },
  {
    title: 'Cum ștergi datele',
    items: [
      '„Șterge profilul” șterge un copil, cu toate rezultatele lui.',
      '„Șterge contul și toate datele” șterge profilurile, rezultatele, intrările din clasament și contul.',
      '„Ieși din cont” șterge din browser copiile rezultatelor. În cont, rezultatele rămân.',
      ['Pentru întrebări sau dacă nu mai ai acces la cont, scrie-ne pe ', h('a', { href: ISSUES, target: '_blank', rel: 'noopener' }, 'pagina proiectului'), '.'],
    ],
  },
];

export default function confidentialitate(container) {
  document.title = 'Confidențialitate — Cifruța';
  container.append(
    h(
      'div',
      { class: 'l-container l-container--narrow l-stack l-stack--lg', 'data-testid': 'privacy' },
      backLink('#/', 'Înapoi la teste'),
      h('h1', {}, 'Confidențialitate'),
      mascot('vesela', 'Pe scurt: **fără cont**, nimic nu pleacă din browser. **Cu cont**, păstrăm doar ce trebuie pentru rezultate și clasament.'),
      SECTIONS.map((s) => h('section', { class: 'c-card' }, h('h2', { class: 'c-card__title' }, s.title), h('ul', { class: 'c-list' }, s.items.map((item) => h('li', {}, item))))),
      h('p', { class: 'u-small u-muted' }, 'Ultima actualizare: septembrie 2026.'),
    ),
  );
}
