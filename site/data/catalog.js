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
          tests: [],
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
        { id: 'u1-numere', title: 'Numerele naturale 0–1000', tests: [], soon: true },
        { id: 'u1-corp', title: 'Corpul omenesc și sănătatea', tests: [], soon: true },
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
  ],
};
