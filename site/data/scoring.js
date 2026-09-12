// Configurarea punctajului și a calificativelor (date, fără funcții).

export default {
  oficiu: 10,
  levels: [
    { id: 'usor', label: 'Ușor', standard: 'De bază', points: 2, icon: 'lvl-usor' },
    { id: 'intermediar', label: 'Intermediar', standard: 'Consolidat', points: 3, icon: 'lvl-intermediar' },
    { id: 'avansat', label: 'Avansat', standard: 'Avansat', points: 4, icon: 'lvl-avansat' },
  ],
  grades: [
    { min: 90, code: 'FB', label: 'Foarte bine', message: 'Excelent! Ai lucrat cu mare atenție.' },
    { min: 70, code: 'B', label: 'Bine', message: 'Foarte frumos! Mai privim împreună câteva exerciții.' },
    { min: 50, code: 'S', label: 'Suficient', message: 'Ești pe drumul cel bun. Hai să vedem ce mai exersăm.' },
    { min: 0, code: 'EX', label: 'Mai exersăm!', message: 'Încă nu, dar fiecare greșeală ne învață ceva. Mai încercăm!' },
  ],
  starAt: 0.8, // o stea pe nivel la cel puțin 80%
  practiceBelow: 0.7, // concepte „de exersat” sub 70%
  confettiAt: 90,
  estMin: 45, // durata exactă a unui test, în minute (suma estMin a exercițiilor)
};
