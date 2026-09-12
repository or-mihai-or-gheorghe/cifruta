// Catalogul site-ului: secțiuni → subsecțiuni (grupuri) → teste.
// status: 'publicat' (se poate deschide) sau 'in-curand' (apare ca previzualizare).

export default {
  sections: [
    {
      id: 'recapitulare',
      title: 'Recapitulare: clasa I',
      subtitle: 'Tot ce am învățat în clasa I, pregătit pentru clasa a II-a',
      icon: 'veverita',
      color: 'brand',
      groups: [
        {
          id: 'recap-c1',
          title: 'Recapitularea cunoștințelor din clasa I',
          tests: [
            {
              id: 'recap-c1-t1',
              file: 'tests/recap-c1/t1-amintiri-din-vacanta.js',
              version: 2,
              theme: 'mare',
              title: 'Amintiri din vacanță',
              subtitle: 'Numerele până la 100 · adunări și scăderi · corpul omenesc',
              estMin: 45,
              exercises: 11,
            },
            {
              id: 'recap-c1-t2',
              file: 'tests/recap-c1/t2-la-piata-cu-bunica.js',
              version: 2,
              theme: 'piata',
              title: 'La piață cu bunica',
              subtitle: 'Adunări și scăderi cu trecere peste ordin · măsurări · plantele',
              estMin: 45,
              exercises: 11,
            },
            {
              id: 'recap-c1-t3',
              file: 'tests/recap-c1/t3-calatorie-in-spatiu.js',
              version: 2,
              theme: 'spatiu',
              title: 'Călătorie în spațiu',
              subtitle: 'Șiruri · termenul necunoscut · axa numerelor · figuri și corpuri',
              estMin: 45,
              exercises: 11,
            },
            {
              id: 'recap-c1-t4',
              file: 'tests/recap-c1/t4-o-zi-la-ferma.js',
              version: 2,
              theme: 'ferma',
              title: 'O zi la fermă',
              subtitle: 'Test de sinteză: numere, operații, probleme, măsurări și natură',
              estMin: 45,
              exercises: 11,
            },
          ],
        },
      ],
    },
    {
      id: 'numere-0-1000',
      title: 'Numerele de la 0 la 1000',
      subtitle: 'Formare, citire, scriere, comparare, ordonare · Corpul omenesc',
      icon: 'calcul',
      color: 'usor',
      groups: [
        {
          id: 'u1-viata',
          title: 'Numerele până la 1000 în viața de zi cu zi',
          tests: [
            {
              id: 'u1-t1',
              file: 'tests/numere-1000/t1-lista-de-cumparaturi.js',
              version: 1,
              theme: 'magazin',
              title: 'Lista de cumpărături',
              subtitle: 'Prețuri de 3 cifre · rotunjire · bani de 100, 200, 500 · meniu sănătos',
              estMin: 45,
              exercises: 11,
            },
            {
              id: 'u1-t2',
              file: 'tests/numere-1000/t2-prin-oras.js',
              version: 1,
              theme: 'oras',
              title: 'Prin oraș: tramvai, metrou, autobuz',
              subtitle: 'Harta liniilor · trasee · pare și impare · călători',
              estMin: 45,
              exercises: 11,
            },
          ],
        },
      ],
    },
    {
      id: 'adunare-scadere-1000',
      title: 'Adunarea și scăderea până la 1000',
      subtitle: 'Fără și cu trecere peste ordin · Pământul',
      icon: 'planeta',
      color: 'intermediar',
      groups: [
        { id: 'u2-operatii', title: 'Adunarea și scăderea 0–1000', tests: [], soon: true },
        { id: 'u2-pamant', title: 'Pământul: uscat, apă, aer, relief', tests: [], soon: true },
      ],
    },
    {
      id: 'logica',
      title: 'Provocări de logică',
      subtitle: 'Ghicitori, indicii, modele și drumuri',
      icon: 'idee',
      color: 'avansat',
      groups: [{ id: 'logica-1', title: 'Gândește ca un detectiv', tests: [], soon: true }],
    },
    {
      // secțiune ascunsă: demonstrația tuturor tipurilor, folosită de atelier și de testele E2E
      id: 'atelier',
      hidden: true,
      title: 'Atelier',
      subtitle: 'Demonstrație pentru autori',
      icon: 'calcul',
      color: 'brand',
      groups: [
        {
          id: 'demo',
          title: 'Toate tipurile de exerciții',
          tests: [{ id: 'demo', file: 'demo.js', version: 1, theme: 'mare', title: 'Toate tipurile de exerciții', subtitle: 'Pagina de atelier pentru autori', estMin: 45, exercises: 19 }],
        },
      ],
    },
  ],
};
