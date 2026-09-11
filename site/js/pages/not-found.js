import { h } from '../core/dom.js';
import { mascot } from '../components/ui.js';

export default function notFound(container) {
  document.title = 'Pagina nu există — Cifruța';
  container.append(
    h(
      'div',
      { class: 'l-container l-container--narrow l-stack l-stack--lg u-center' },
      mascot('ganditoare', 'Hmm… pagina aceasta nu există. Poate s-a rostogolit ca o alună!', { center: true }),
      h('p', {}, h('a', { class: 'c-btn c-btn--primary c-btn--lg', href: '#/' }, 'Înapoi la teste')),
    ),
  );
}
