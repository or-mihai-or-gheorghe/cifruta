// Jocuri fulger: jocurile pe viteză (date, fără funcții). Generatoarele întrebărilor sunt în js/fulger/kinds.js (calcule) și
// js/fulger/kinds-forme.js (figuri). Jocul e împărțit pe teme; fiecare temă are cele 3 niveluri, cu amestecul de tipuri și pragurile de stele.
// Pragurile de stele sunt calibrate prin simulare (tests/fulger.test.js): un copil rapid ia 3 stele, unul bun 2,
// unul încet dar sigur 1, iar atingerile la întâmplare niciuna.

export default {
  durationMs: 120000,
  sprintMs: 10000, // ultimele secunde: „Sprint final!”
  inputDelayMs: 150, // atingerile contează la puțin timp după ce apare întrebarea
  feedbackMs: 450, // după un răspuns corect, până la întrebarea următoare
  cooldownMs: 1000, // după o greșeală
  // o greșeală mai rapidă decât cititul (sub 40% din timpul „fulger”, minimum 0,8 s; nu la sortări)
  // primește o pauză cât timpul „fulger” (minimum 3 s)
  guard: { below: 0.4, minMs: 800, pauseMinMs: 3000 },
  // viteza contează doar în serie: până la timpul „fulger” ×2, până la dublul lui ×1,5
  speed: [
    { id: 'fulger', upTo: 1, mult: 2, label: 'Fulger!' },
    { id: 'rapid', upTo: 2, mult: 1.5, label: 'Rapid!' },
  ],
  streak: [
    { from: 3, mult: 1.5, label: 'Bravo!' },
    { from: 5, mult: 2, label: 'Super!' },
    { from: 10, mult: 3, label: 'TURBO!', turbo: true },
  ],
  // după Turbo, seria se sărbătorește din 5 în 5
  milestones: { every: 5, labels: { 15: 'Senzațional!', 20: 'De neoprit!' }, later: 'Legendar!' },
  // la final, cu cel puțin 10 răspunsuri: toate corecte +20%, cel puțin 90% corecte +10%
  precision: { minAnswers: 10, perfect: 0.2, high: { from: 0.9, bonus: 0.1 } },
  warmupCount: 3, // primele întrebări vin din tipurile de încălzire ale nivelului
  noRepeat: 12, // o întrebare nu revine printre ultimele 12
  keepRounds: 60, // rundele păstrate, din toate temele
  // Id-ul unei teme publicate nu se mai schimbă: intră în cheile recordurilor („temă:nivel”) și în id-urile clasamentelor, iar temele
  // jucabile apar și în firestore.rules (fulgerTopics). Temele `soon` n-au niveluri: se văd pe carduri „în curând”.
  topics: [
    {
      id: 'adunari-scaderi-100',
      title: 'Adunări și scăderi până la 100',
      short: 'Până la 100',
      text: 'Adunări și scăderi cu și fără trecere peste ordin, comparări și ordonări de numere.',
      icon: 'calcul',
      grade: 1,
      concepts: ['mat.op.fara-trecere', 'mat.op.cu-trecere', 'mat.nr100.comparare', 'mat.nr100.ordonare', 'mat.op.comparare-expresii'],
      levels: [
        {
          id: 'usor',
          warmup: ['add-1c', 'cmp-20'],
          mix: [
            { kind: 'add-1c', weight: 3 },
            { kind: 'add-1c-2c', weight: 2 },
            { kind: 'sub-20-fara', weight: 2 },
            { kind: 'cmp-20', weight: 2 },
            { kind: 'sort-3-20', weight: 1 },
          ],
          stars: [30, 80, 175],
        },
        {
          id: 'intermediar',
          warmup: ['add-1c-2c', 'cmp-100', 'sub-20-cu'],
          mix: [
            { kind: 'sub-20-cu', weight: 2 },
            { kind: 'add-100-fara', weight: 2 },
            { kind: 'sub-100-fara', weight: 2 },
            { kind: 'add-3op-1c', weight: 2 },
            { kind: 'cmp-100', weight: 1.5 },
            { kind: 'sort-4-100', weight: 1.5 },
            { kind: 'add-1c-2c', weight: 1 },
            { kind: 'cmp-20', weight: 0.5 },
            { kind: 'sort-3-20', weight: 0.5 },
          ],
          stars: [35, 95, 215],
        },
        {
          id: 'avansat',
          warmup: ['add-100-fara', 'cmp-100'],
          mix: [
            { kind: 'add-100-cu', weight: 2 },
            { kind: 'sub-100-cu', weight: 2 },
            { kind: 'add-3op-100', weight: 2 },
            { kind: 'cmp-expr', weight: 1.5 },
            { kind: 'sort-4-dir', weight: 1.5 },
            { kind: 'add-100-fara', weight: 1 },
            { kind: 'sub-100-fara', weight: 0.5 },
            { kind: 'cmp-100', weight: 0.5 },
            { kind: 'sort-4-100', weight: 0.5 },
          ],
          stars: [35, 100, 235],
        },
      ],
    },
    {
      id: 'numere-1000',
      title: 'Numere până la 1000',
      short: 'Până la 1000',
      text: 'Comparări, ordonări și calcule fără trecere cu numere de trei cifre.',
      icon: 'cuburi',
      grade: 2,
      concepts: ['mat.nr1000.comparare', 'mat.nr1000.ordonare', 'mat.op1000.fara-trecere'],
      soon: true,
    },
    {
      id: 'inmultirea',
      title: 'Înmulțirea',
      short: 'Înmulțirea',
      text: 'Înmulțirea ca adunare repetată de termeni egali.',
      icon: 'zar',
      grade: 2,
      concepts: ['mat.op.inmultire'],
      soon: true,
    },
    {
      id: 'impartirea',
      title: 'Împărțirea',
      short: 'Împărțirea',
      text: 'Împărțirea în părți egale, ca scădere repetată.',
      icon: 'bomboane',
      grade: 2,
      concepts: ['mat.op.impartire'],
      soon: true,
    },
    {
      id: 'ecuatii',
      title: 'Ecuații simple',
      short: 'Ecuații',
      text: 'Aflarea numărului necunoscut, de exemplu □ + 7 = 15.', // spații nedespărțite: exemplul stă pe un rând
      icon: 'puzzle',
      grade: 1,
      concepts: ['mat.op.necunoscut'],
      soon: true,
    },
  ],
  // stat: rounds (runde jucate) · bestStreak · fast (fulgere într-o rundă) · perfect (răspunsuri, dacă sunt toate corecte)
  //       · levels3 (nivelurile temei rundei cu recordul la 3 stele)
  medals: [
    { id: 'prima-cursa', title: 'Prima cursă', text: 'Termini o rundă.', icon: 'steag', stat: 'rounds', gte: 1 },
    { id: 'in-flacari', title: 'În flăcări', text: '10 răspunsuri corecte la rând.', icon: 'foc', stat: 'bestStreak', gte: 10 },
    { id: 'de-neoprit', title: 'De neoprit', text: '20 de răspunsuri corecte la rând.', icon: 'racheta', stat: 'bestStreak', gte: 20 },
    { id: 'fulgerul', title: 'Fulgerul', text: '10 fulgere într-o singură rundă.', icon: 'fulger', stat: 'fast', gte: 10 },
    { id: 'fara-gres', title: 'Fără greș', text: 'Cel puțin 15 răspunsuri, toate corecte.', icon: 'tinta', stat: 'perfect', gte: 15 },
    { id: 'campionul', title: 'Campionul', text: '3 stele la toate nivelurile unei teme.', icon: 'trofeu', stat: 'levels3', gte: 3 },
  ],
};
