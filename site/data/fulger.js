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
  // primește o pauză cât timpul „fulger” (între 3 și 9 s: la graficele citite încet, timpul „fulger” trece de 9 s)
  guard: { below: 0.4, minMs: 800, pauseMinMs: 3000, pauseMaxMs: 9000 },
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
      id: 'siruri-intrusi',
      title: 'Șiruri și intruși',
      short: 'Șiruri și intruși',
      text: 'Ce urmează într-un șir de figuri, ce lipsește din el, care e intrusul și cum se schimbă o figură. Fără calcule!',
      icon: 'idee',
      grade: 1,
      concepts: ['mat.log.modele', 'mat.log.clasificare', 'mat.geo.figuri', 'mat.log.analogii'],
      levels: [
        {
          id: 'usor',
          warmup: ['sir-simplu', 'intrus-forma'],
          mix: [
            { kind: 'sir-simplu', weight: 3 },
            { kind: 'intrus-forma', weight: 2 },
            { kind: 'sir-lipsa', weight: 2 },
            { kind: 'sir-doua', weight: 1 },
          ],
          stars: [27, 66, 160],
        },
        {
          id: 'intermediar',
          warmup: ['sir-simplu', 'intrus-forma', 'sir-lipsa'],
          mix: [
            { kind: 'sir-doua', weight: 2 },
            { kind: 'sir-lipsa', weight: 2 },
            { kind: 'sir-rotire', weight: 2 },
            { kind: 'intrus-insusire', weight: 2 },
            { kind: 'analogie', weight: 1.5 },
            { kind: 'sir-simplu', weight: 0.5 },
            { kind: 'intrus-forma', weight: 0.5 },
          ],
          stars: [28, 76, 190],
        },
        {
          id: 'avansat',
          warmup: ['sir-doua', 'intrus-insusire'],
          mix: [
            { kind: 'matrice', weight: 2 },
            { kind: 'analogie', weight: 2 },
            { kind: 'sir-rotire', weight: 2 },
            { kind: 'intrus-insusire', weight: 1.5 },
            { kind: 'sir-lipsa', weight: 1 },
            { kind: 'sir-doua', weight: 1 },
          ],
          stars: [29, 77, 200],
        },
      ],
    },
    {
      id: 'puzzle-forme',
      title: 'Puzzle cu forme',
      short: 'Puzzle cu forme',
      text: 'Piesa care completează tabla, piese rotite sau întoarse, axe de simetrie și figuri completate în oglindă.',
      icon: 'puzzle',
      grade: 2,
      concepts: ['mat.geo.compunere', 'mat.geo.rotire', 'mat.geo.simetrie'],
      levels: [
        {
          id: 'usor',
          warmup: ['piesa-lipsa', 'simetrie-axa'],
          mix: [
            { kind: 'piesa-lipsa', weight: 3 },
            { kind: 'simetrie-axa', weight: 3 },
            { kind: 'simetrie-jumatate', weight: 1.5 },
            { kind: 'piesa-rotita', weight: 1 },
          ],
          stars: [27, 74, 175],
        },
        {
          id: 'intermediar',
          warmup: ['piesa-lipsa', 'simetrie-axa'],
          mix: [
            { kind: 'piesa-rotita', weight: 2.5 },
            { kind: 'simetrie-jumatate', weight: 2.5 },
            { kind: 'simetrie-axa', weight: 1.5 },
            { kind: 'piesa-lipsa', weight: 1.5 },
            { kind: 'axe-cate', weight: 1 },
            { kind: 'rotita-oglinda', weight: 1 },
          ],
          stars: [27, 75, 185],
        },
        {
          id: 'avansat',
          warmup: ['piesa-rotita', 'simetrie-jumatate'],
          mix: [
            { kind: 'rotita-oglinda', weight: 2.5 },
            { kind: 'axe-cate', weight: 2 },
            { kind: 'piesa-rotita', weight: 2 },
            { kind: 'simetrie-jumatate', weight: 2 },
            { kind: 'piesa-lipsa', weight: 0.5 },
            { kind: 'simetrie-axa', weight: 0.5 },
          ],
          stars: [28, 77, 205],
        },
      ],
    },
    {
      id: 'figuri-corpuri',
      title: 'Figuri și corpuri',
      short: 'Figuri și corpuri',
      text: 'Recunoaște figurile oricum ar fi așezate, găsește corpurile din jurul tău, numără figurile dintr-un desen și pliază desfășurări.',
      icon: 'echer',
      grade: 2,
      concepts: ['mat.geo.figuri', 'mat.geo.corpuri', 'mat.geo.numarare-figuri', 'mat.geo.desfasurari'],
      levels: [
        {
          id: 'usor',
          warmup: ['figura', 'corpuri'],
          mix: [
            { kind: 'figura', weight: 3 },
            { kind: 'corpuri', weight: 3 },
            { kind: 'figura-capcana', weight: 1 },
            { kind: 'numara-figuri', weight: 1 },
          ],
          stars: [28, 72, 170],
        },
        {
          id: 'intermediar',
          warmup: ['figura', 'corpuri'],
          mix: [
            { kind: 'figura-capcana', weight: 2.5 },
            { kind: 'corpuri', weight: 2 },
            { kind: 'numara-figuri', weight: 2 },
            { kind: 'desfasurare', weight: 1.5 },
            { kind: 'figura', weight: 1 },
          ],
          stars: [29, 78, 195],
        },
        {
          id: 'avansat',
          warmup: ['figura-capcana', 'numara-figuri'],
          mix: [
            { kind: 'desfasurare', weight: 2.5 },
            { kind: 'numara-figuri', weight: 2.5 },
            { kind: 'figura-capcana', weight: 2 },
            { kind: 'corpuri', weight: 1.5 },
            { kind: 'figura', weight: 0.5 },
          ],
          stars: [29, 77, 205],
        },
      ],
    },
    {
      id: 'pozitii-trasee',
      title: 'Poziții și trasee',
      short: 'Poziții și trasee',
      text: 'Stânga, dreapta, sus, jos și între; înăuntru sau afară; drumul unui robot și căsuțele unei rețele cu litere și cifre.',
      icon: 'robot',
      grade: 2,
      concepts: ['mat.geo.pozitii', 'mat.geo.interior-exterior', 'mat.geo.trasee', 'mat.geo.coordonate'],
      levels: [
        {
          id: 'usor',
          warmup: ['pozitii', 'interior'],
          mix: [
            { kind: 'pozitii', weight: 3 },
            { kind: 'interior', weight: 2.5 },
            { kind: 'robot-scurt', weight: 1.5 },
            { kind: 'coordonate', weight: 1 },
          ],
          stars: [27, 66, 160],
        },
        {
          id: 'intermediar',
          warmup: ['pozitii', 'robot-scurt'],
          mix: [
            { kind: 'robot-scurt', weight: 2.5 },
            { kind: 'coordonate', weight: 2.5 },
            { kind: 'interior', weight: 1.5 },
            { kind: 'pozitii', weight: 1.5 },
            { kind: 'robot-lung', weight: 1 },
          ],
          stars: [27, 71, 175],
        },
        {
          id: 'avansat',
          warmup: ['robot-scurt', 'coordonate'],
          mix: [
            { kind: 'robot-lung', weight: 3 },
            { kind: 'coordonate', weight: 2 },
            { kind: 'robot-scurt', weight: 1.5 },
            { kind: 'interior', weight: 1 },
            { kind: 'pozitii', weight: 1 },
          ],
          stars: [27, 75, 200],
        },
      ],
    },
    {
      id: 'grafice-tabele',
      title: 'Grafice și tabele',
      short: 'Grafice',
      text: 'Pictograme, bare, tabele cu bețișoare, cercuri cu felii, grafice în timp și două cercuri: citești, compari, ordonezi, aduni și scazi.',
      icon: 'grafic',
      grade: 2,
      concepts: [
        'mat.log.pictograma', 'mat.log.grafic-bare', 'mat.log.tabel', 'mat.log.diagrama-cerc', 'mat.log.grafic-linie', 'mat.log.venn',
        'mat.nr100.comparare', 'mat.nr100.ordonare', 'mat.nr100.adunare-repetata', 'mat.pb.mai-mult-mai-putin', 'mat.pb.o-operatie',
        'mat.op.necunoscut',
      ],
      levels: [
        {
          id: 'usor',
          warmup: ['pictograma', 'bare-citire'],
          mix: [
            { kind: 'pictograma', weight: 3 },
            { kind: 'bare-citire', weight: 3 },
            { kind: 'grafic-compara', weight: 2 },
            { kind: 'tabel', weight: 1.5 },
            { kind: 'grafic-ordine', weight: 1 },
          ],
          stars: [20, 48, 120],
        },
        {
          id: 'intermediar',
          warmup: ['bare-citire', 'grafic-compara'],
          mix: [
            { kind: 'pictograma-legenda', weight: 2 },
            { kind: 'bare-scara', weight: 2 },
            { kind: 'bare-diferenta', weight: 2 },
            { kind: 'cerc-felii', weight: 2 },
            { kind: 'timp-grafic', weight: 2 },
            { kind: 'bare-suma', weight: 1.5 },
            { kind: 'grafic-ordine', weight: 1.5 },
            { kind: 'tabel', weight: 1 },
            { kind: 'grafic-compara', weight: 1 },
            { kind: 'bare-citire', weight: 0.5 },
            { kind: 'pictograma', weight: 0.5 },
          ],
          stars: [22, 57, 155],
        },
        {
          id: 'avansat',
          warmup: ['bare-diferenta', 'timp-grafic'],
          mix: [
            { kind: 'timp-doua-serii', weight: 2.5 },
            { kind: 'timp-total', weight: 2 },
            { kind: 'bare-duble', weight: 2 },
            { kind: 'venn', weight: 2 },
            { kind: 'bare-lipsa', weight: 1.5 },
            { kind: 'bare-suma', weight: 1 },
            { kind: 'grafic-compara', weight: 0.5 },
            { kind: 'cerc-felii', weight: 0.5 },
            { kind: 'bare-diferenta', weight: 0.5 },
            { kind: 'timp-grafic', weight: 0.5 },
          ],
          stars: [23, 62, 185],
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
      icon: 'proba',
      grade: 1,
      concepts: ['mat.op.necunoscut'],
      soon: true,
    },
  ],
  // Medaliile: 3 stele la un nivel al unei teme aduc medalia metalului acelui nivel; aceeași medalie la mai multe teme aduce medaliile
  // în plus. Id-urile sunt permanente (cifruta:fulger, state/fulger): „<metal>:<temă>” pentru medalia unei teme (o temă jucabilă nouă
  // aduce singură medaliile ei) și „<metal>-<treaptă>” pentru cele în plus; legătura metal–nivel nu se schimbă. Medaliile de dinainte
  // de v0.13.0 (prima-cursa, campionul…) rămân în date, dar nu se mai arată. Logica: js/fulger/medals.js.
  medals: {
    metals: [
      { id: 'bronz', level: 'usor', of: 'de bronz', name: 'Bronz' },
      { id: 'argint', level: 'intermediar', of: 'de argint', name: 'Argint' },
      { id: 'aur', level: 'avansat', of: 'de aur', name: 'Aur' },
    ],
    // aceeași medalie la cel puțin `count` teme; id-ul treptei e și forma desenului (award)
    extras: [
      { id: 'dublu', count: 2, titles: { bronz: 'Bronz dublu', argint: 'Argint dublu', aur: 'Aur dublu' } },
      { id: 'colectie', count: 3, titles: { bronz: 'Colecția de bronz', argint: 'Colecția de argint', aur: 'Colecția de aur' } },
      { id: 'cupa', count: 5, titles: { bronz: 'Cupa de bronz', argint: 'Cupa de argint', aur: 'Cupa de aur' } },
    ],
  },
};
