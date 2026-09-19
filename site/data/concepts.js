// Dicționarul de concepte (date simple, fără funcții).
// Exercițiile se etichetează cu aceste ID-uri (`concepts: [...]`), pentru rapoarte pe concept acum și în viitor.
// grade: 0 = clasa pregătitoare, 1 = clasa I, 2 = clasa a II-a (conform programei OMEN 3418/2013).
// competencies: codurile competențelor specifice din programă (ex. '1.4', '5.2', '6.3').
// source ⊆ ['manual', 'auxiliar', 'programa', 'standarde', 'en2', 'imbogatire'].
// Descrierea completă, cu surse: docs/curriculum.md

export const DOMAINS = { mat: 'Matematică', med: 'Explorarea mediului' };

export const GRADES = { 0: 'clasa pregătitoare', 1: 'clasa I', 2: 'clasa a II-a' };

export const SOURCES = {
  manual: 'Manualul MEM clasa a II-a (scanare locală)',
  auxiliar: 'Caietul auxiliar MEM clasa a II-a (scanare locală)',
  programa: 'Programa școlară MEM, OMEN 3418/2013',
  standarde: 'Standardele naționale de evaluare 2026 (Anexa 28)',
  en2: 'Evaluarea Națională la finalul clasei a II-a',
  imbogatire: 'Îmbogățire (documentare didactică)',
};

export default {
  // ——— 1. Numere naturale 0–100 (clasa I) ———
  'mat.nr100.formare': { domain: 'mat', title: 'Formarea numerelor din zeci și unități', grade: 1, competencies: ['1.1'], source: ['manual', 'auxiliar', 'programa'] },
  'mat.nr100.citire-scriere': { domain: 'mat', title: 'Citirea și scrierea numerelor până la 100', grade: 1, competencies: ['1.1'], source: ['manual', 'auxiliar', 'programa'] },
  'mat.nr100.comparare': { domain: 'mat', title: 'Compararea numerelor (<, >, =)', grade: 1, competencies: ['1.2'], source: ['manual', 'auxiliar', 'programa', 'en2'] },
  'mat.nr100.ordonare': { domain: 'mat', title: 'Ordonarea crescătoare și descrescătoare', grade: 1, competencies: ['1.3'], source: ['manual', 'auxiliar', 'programa'] },
  'mat.nr100.paritate': { domain: 'mat', title: 'Numere pare și numere impare', grade: 1, competencies: ['1.1'], source: ['manual', 'auxiliar', 'programa'] },
  'mat.nr100.vecini': { domain: 'mat', title: 'Vecinii unui număr (predecesor și succesor)', grade: 1, competencies: ['1.1', '1.3'], source: ['manual', 'auxiliar', 'en2'] },
  'mat.nr100.consecutive': { domain: 'mat', title: 'Numere consecutive', grade: 1, competencies: ['1.3'], source: ['manual', 'auxiliar'] },
  'mat.nr100.siruri': { domain: 'mat', title: 'Șiruri de numere după o regulă', grade: 1, competencies: ['1.3', '3.1'], source: ['manual', 'auxiliar', 'programa'] },
  'mat.nr100.axa': { domain: 'mat', title: 'Axa numerelor: poziționare și estimare', grade: 1, competencies: ['1.3'], source: ['auxiliar', 'programa', 'imbogatire'] },
  'mat.nr100.rotunjire': { domain: 'mat', title: 'Rotunjirea la zeci', grade: 1, competencies: ['1.3'], source: ['auxiliar', 'programa'] },
  'mat.nr100.conditii': { domain: 'mat', title: 'Numere care îndeplinesc condiții (intervale, cifre)', grade: 1, competencies: ['1.2', '4.1'], source: ['manual', 'auxiliar', 'programa'] },
  'mat.nr100.valoare-pozitionala': { domain: 'mat', title: 'Valoarea cifrei după locul ei (40 și 4)', grade: 1, competencies: ['1.1'], source: ['imbogatire'] },
  'mat.nr100.estimare': { domain: 'mat', title: 'Estimarea unei cantități („cam câte?”)', grade: 1, competencies: ['1.3'], source: ['programa', 'imbogatire'] },
  'mat.nr100.prietenii-lui-10': { domain: 'mat', title: 'Perechi de numere care fac 10 și 100', grade: 1, competencies: ['1.4'], source: ['imbogatire'] },
  'mat.nr100.adunare-repetata': { domain: 'mat', title: 'Numărarea din 2 în 2, din 5 în 5, din 10 în 10', grade: 1, competencies: ['1.5'], source: ['programa', 'imbogatire'] },

  // ——— Numere naturale 0–1000 (clasa a II-a) ———
  'mat.nr1000.formare': { domain: 'mat', title: 'Formarea numerelor din sute, zeci și unități', grade: 2, competencies: ['1.1'], source: ['manual', 'auxiliar', 'programa'] },
  'mat.nr1000.citire-scriere': { domain: 'mat', title: 'Scrierea numerelor până la 1000 cu cifre și cu litere', grade: 2, competencies: ['1.1'], source: ['manual', 'auxiliar', 'programa'] },
  'mat.nr1000.comparare': { domain: 'mat', title: 'Compararea numerelor până la 1000', grade: 2, competencies: ['1.2'], source: ['manual', 'auxiliar', 'programa'] },
  'mat.nr1000.ordonare': { domain: 'mat', title: 'Ordonarea numerelor până la 1000', grade: 2, competencies: ['1.3'], source: ['manual', 'auxiliar', 'programa'] },
  'mat.nr1000.paritate': { domain: 'mat', title: 'Numere pare și impare până la 1000', grade: 2, competencies: ['1.1'], source: ['manual', 'auxiliar'] },
  'mat.nr1000.rotunjire': { domain: 'mat', title: 'Rotunjirea la sute', grade: 2, competencies: ['1.3'], source: ['manual', 'auxiliar', 'programa'] },
  'mat.nr1000.rasturnat': { domain: 'mat', title: 'Răsturnatul unui număr (opțional)', grade: 2, competencies: ['1.1'], source: ['auxiliar', 'imbogatire'] },
  'mat.nr1000.vecini': { domain: 'mat', title: 'Vecinii numerelor până la 1000', grade: 2, competencies: ['1.1', '1.3'], source: ['manual', 'auxiliar'] },
  'mat.nr1000.consecutive': { domain: 'mat', title: 'Numere consecutive până la 1000', grade: 2, competencies: ['1.3'], source: ['manual', 'auxiliar'] },
  'mat.nr1000.siruri': { domain: 'mat', title: 'Șiruri cu pas (+3, −5, +10, +100) până la 1000', grade: 2, competencies: ['1.3', '3.1'], source: ['manual', 'auxiliar', 'programa'] },
  'mat.nr1000.axa': { domain: 'mat', title: 'Axa numerelor 0–1000: poziționare și estimare', grade: 2, competencies: ['1.3'], source: ['manual', 'programa'] },
  'mat.nr1000.conditii': { domain: 'mat', title: 'Numere care îndeplinesc condiții (cifre, intervale)', grade: 2, competencies: ['1.2', '4.1'], source: ['manual', 'auxiliar'] },
  'mat.nr1000.valoare-pozitionala': { domain: 'mat', title: 'Valoarea cifrei după loc (403: zecile sunt 0)', grade: 2, competencies: ['1.1'], source: ['manual', 'imbogatire'] },
  'mat.fractii.jumatate-sfert': { domain: 'mat', title: 'Jumătatea și sfertul (felii egale)', grade: 2, competencies: ['1.1'], source: ['programa'] },

  // ——— 2. Adunare și scădere ———
  'mat.op.fara-trecere': { domain: 'mat', title: 'Adunări și scăderi până la 100, fără trecere peste ordin', grade: 1, competencies: ['1.4'], source: ['manual', 'auxiliar', 'programa', 'standarde'] },
  'mat.op.cu-trecere': { domain: 'mat', title: 'Adunări și scăderi până la 100, cu trecere peste ordin', grade: 1, competencies: ['1.4'], source: ['manual', 'auxiliar', 'programa', 'standarde'] },
  'mat.op.proprietati': { domain: 'mat', title: 'Schimbarea ordinii termenilor, gruparea și rolul lui 0', grade: 1, competencies: ['1.4'], source: ['manual', 'auxiliar', 'programa'] },
  'mat.op.necunoscut': { domain: 'mat', title: 'Aflarea termenului necunoscut', grade: 1, competencies: ['1.4', '5.2'], source: ['manual', 'auxiliar', 'programa'] },
  'mat.op.balanta': { domain: 'mat', title: 'Semnul „=” ca o balanță în echilibru', grade: 1, competencies: ['1.4', '1.6'], source: ['manual', 'programa', 'imbogatire'] },
  'mat.op.proba': { domain: 'mat', title: 'Proba adunării și a scăderii (operația inversă)', grade: 1, competencies: ['1.4'], source: ['manual', 'auxiliar', 'programa', 'en2'] },
  'mat.op.lanturi': { domain: 'mat', title: 'Lanțuri de operații', grade: 1, competencies: ['1.4'], source: ['manual', 'auxiliar'] },
  'mat.op.semne': { domain: 'mat', title: 'Semnele care lipsesc (+ sau −)', grade: 1, competencies: ['1.4', '1.6'], source: ['auxiliar'] },
  'mat.op.comparare-expresii': { domain: 'mat', title: 'Compararea expresiilor fără a calcula', grade: 1, competencies: ['1.2', '1.4'], source: ['manual', 'auxiliar', 'programa'] },
  'mat.op.greseala': { domain: 'mat', title: 'Găsește greșeala dintr-un calcul', grade: 1, competencies: ['1.4', '4.2'], source: ['auxiliar', 'imbogatire'] },
  'mat.op.strategii': { domain: 'mat', title: 'Strategii de calcul mental (completare la 10, numere rotunde)', grade: 1, competencies: ['1.4'], source: ['manual', 'imbogatire'] },
  'mat.op.familii': { domain: 'mat', title: 'Familii de operații (7 + 5, 5 + 7, 12 − 5, 12 − 7)', grade: 1, competencies: ['1.4'], source: ['imbogatire'] },
  'mat.op.terminologie': { domain: 'mat', title: 'Termeni: termen, sumă, total, diferență', grade: 1, competencies: ['1.6'], source: ['manual', 'auxiliar', 'programa'] },
  'mat.op1000.fara-trecere': { domain: 'mat', title: 'Adunări și scăderi până la 1000, fără trecere peste ordin', grade: 2, competencies: ['1.4'], source: ['manual', 'auxiliar', 'programa', 'standarde'] },
  'mat.op1000.cu-trecere': { domain: 'mat', title: 'Adunări și scăderi până la 1000, cu trecere peste ordin', grade: 2, competencies: ['1.4'], source: ['manual', 'auxiliar', 'en2'] },
  'mat.op1000.reconstituire': { domain: 'mat', title: 'Reconstituirea calculelor cu cifre lipsă', grade: 2, competencies: ['1.4'], source: ['auxiliar'] },
  'mat.op.inmultire': { domain: 'mat', title: 'Înmulțirea ca adunare repetată de termeni egali', grade: 2, competencies: ['1.5'], source: ['programa', 'en2'] },
  'mat.op.impartire': { domain: 'mat', title: 'Împărțirea ca scădere repetată', grade: 2, competencies: ['1.5'], source: ['programa', 'en2'] },

  // ——— 3. Rezolvarea problemelor ———
  'mat.pb.o-operatie': { domain: 'mat', title: 'Probleme care se rezolvă printr-o operație', grade: 1, competencies: ['5.2'], source: ['manual', 'auxiliar', 'programa'] },
  'mat.pb.doua-operatii': { domain: 'mat', title: 'Probleme care se rezolvă prin două operații', grade: 1, competencies: ['5.2'], source: ['manual', 'auxiliar', 'programa'] },
  'mat.pb.mai-mult-mai-putin': { domain: 'mat', title: 'Probleme „cu … mai mult / cu … mai puțin”', grade: 1, competencies: ['5.2'], source: ['manual', 'auxiliar'] },
  'mat.pb.doua-moduri': { domain: 'mat', title: 'Rezolvarea unei probleme în mai multe moduri', grade: 1, competencies: ['5.2'], source: ['manual', 'programa'] },
  'mat.pb.mersul-invers': { domain: 'mat', title: 'Mersul invers („Mă gândesc la un număr”)', grade: 1, competencies: ['5.2', '4.1'], source: ['manual', 'auxiliar', 'imbogatire'] },
  'mat.pb.capcana-limbaj': { domain: 'mat', title: 'Capcana de limbaj în problemele de comparare', grade: 1, competencies: ['5.2'], source: ['imbogatire'] },
  'mat.pb.decizie': { domain: 'mat', title: 'Decizii argumentate („Da/Nu, pentru că…”)', grade: 1, competencies: ['5.2', '4.2'], source: ['programa', 'en2'] },
  'mat.pb.plan': { domain: 'mat', title: 'Rezolvarea cu plan (Ce știm? Ce aflăm?)', grade: 1, competencies: ['5.2'], source: ['manual'] },
  'mat.pb.date-lipsa': { domain: 'mat', title: 'Date în plus și date care lipsesc', grade: 1, competencies: ['5.2'], source: ['imbogatire'] },
  'mat.pb.compunere': { domain: 'mat', title: 'Compunerea și schimbarea problemelor', grade: 1, competencies: ['5.2'], source: ['manual', 'auxiliar', 'programa'] },

  // ——— 4. Geometrie și orientare în spațiu ———
  'mat.geo.figuri': { domain: 'mat', title: 'Figuri plane: pătrat, dreptunghi, triunghi, cerc, semicerc', grade: 1, competencies: ['2.2'], source: ['manual', 'programa', 'en2'] },
  'mat.geo.corpuri': { domain: 'mat', title: 'Corpuri: cub, cuboid, cilindru, sferă, con', grade: 1, competencies: ['2.2'], source: ['manual', 'programa'] },
  'mat.geo.numarare-figuri': { domain: 'mat', title: 'Numărarea figurilor dintr-un desen compus', grade: 2, competencies: ['2.2'], source: ['manual', 'programa'] },
  'mat.geo.desfasurari': { domain: 'mat', title: 'Desfășurări: cub, cuboid, cilindru, con', grade: 2, competencies: ['2.2'], source: ['programa'] },
  'mat.geo.pozitii': { domain: 'mat', title: 'Poziții: stânga, dreapta, sus, jos, între', grade: 1, competencies: ['2.1'], source: ['programa', 'en2'] },
  'mat.geo.interior-exterior': { domain: 'mat', title: 'Interior, exterior, frontieră', grade: 1, competencies: ['2.1'], source: ['programa'] },
  'mat.geo.harta-linii': { domain: 'mat', title: 'Hărți de linii: stații, schimbări, drumuri', grade: 2, competencies: ['2.1', '5.1'], source: ['imbogatire'] },
  'mat.geo.trasee': { domain: 'mat', title: 'Trasee pe rețea cu săgeți', grade: 1, competencies: ['2.1'], source: ['imbogatire'] },
  'mat.geo.simetrie': { domain: 'mat', title: 'Axa de simetrie', grade: 2, competencies: ['2.2'], source: ['programa'] },
  'mat.geo.coordonate': { domain: 'mat', title: 'Rând și coloană (coordonate)', grade: 2, competencies: ['2.1'], source: ['programa'] },
  'mat.geo.compunere': { domain: 'mat', title: 'Compunerea figurilor din piese (piesa care lipsește)', grade: 2, competencies: ['2.2'], source: ['programa'] },
  'mat.geo.rotire': { domain: 'mat', title: 'Figuri rotite și figuri în oglindă', grade: 2, competencies: ['2.2'], source: ['imbogatire'] },

  // ——— 5. Măsurări, timp și bani ———
  'mat.mas.unitati': { domain: 'mat', title: 'Alegerea unității de măsură potrivite', grade: 1, competencies: ['6.4'], source: ['manual', 'programa', 'en2'] },
  'mat.mas.lungime': { domain: 'mat', title: 'Lungimea: centimetrul și rigla', grade: 1, competencies: ['6.1', '6.4'], source: ['programa', 'imbogatire'] },
  'mat.mas.capacitate': { domain: 'mat', title: 'Capacitatea: litrul și unități nonstandard', grade: 1, competencies: ['6.1', '6.4'], source: ['manual', 'programa'] },
  'mat.mas.masa': { domain: 'mat', title: 'Masa: kilogramul și gramul', grade: 2, competencies: ['6.4'], source: ['programa'] },
  'mat.mas.termometru': { domain: 'mat', title: 'Citirea termometrului', grade: 1, competencies: ['5.1', '3.1'], source: ['programa', 'imbogatire'] },
  'mat.mas.ceas': { domain: 'mat', title: 'Ceasul: ora fixă și jumătatea de oră', grade: 1, competencies: ['6.2'], source: ['manual', 'programa', 'en2'] },
  'mat.mas.durata': { domain: 'mat', title: 'Durata unor activități', grade: 1, competencies: ['6.2'], source: ['manual', 'programa', 'en2'] },
  'mat.mas.calendar': { domain: 'mat', title: 'Zilele săptămânii, lunile, anul', grade: 1, competencies: ['6.2'], source: ['manual', 'programa'] },
  'mat.mas.bani': { domain: 'mat', title: 'Banii: bancnote, monede, plata exactă și restul', grade: 1, competencies: ['6.3'], source: ['manual', 'auxiliar', 'programa'] },
  'mat.mas.buget': { domain: 'mat', title: 'Buget și decizii de cumpărare („Îmi ajung banii?”)', grade: 1, competencies: ['6.3', '5.2'], source: ['programa', 'en2'] },
  'mat.mas.minute': { domain: 'mat', title: 'Minutele și sfertul de oră', grade: 2, competencies: ['6.2'], source: ['programa'] },
  'mat.mas.bani-mari': { domain: 'mat', title: 'Bancnotele de 100, 200 și 500 de lei', grade: 2, competencies: ['6.3'], source: ['programa'] },
  'mat.mas.distanta': { domain: 'mat', title: 'Distanțe în kilometri', grade: 2, competencies: ['6.4'], source: ['programa', 'imbogatire'] },
  'mat.mas.orar': { domain: 'mat', title: 'Orare și mersul trenurilor (plecare, sosire, durată)', grade: 2, competencies: ['6.2'], source: ['programa', 'imbogatire'] },

  // ——— 6. Date și logică ———
  'mat.log.tabel': { domain: 'mat', title: 'Citirea datelor dintr-un tabel', grade: 1, competencies: ['5.1'], source: ['manual', 'programa', 'en2'] },
  'mat.log.grafic-bare': { domain: 'mat', title: 'Grafice cu bare', grade: 2, competencies: ['5.1'], source: ['programa'] },
  'mat.log.pictograma': { domain: 'mat', title: 'Pictograme cu legendă (1 simbol = 2, 5, 10)', grade: 2, competencies: ['5.1'], source: ['programa', 'imbogatire'] },
  'mat.log.ghicitori': { domain: 'mat', title: 'Ghicitori cu numere („Cine sunt eu?”)', grade: 1, competencies: ['4.1', '1.2'], source: ['auxiliar', 'imbogatire'] },
  'mat.log.simboluri': { domain: 'mat', title: 'Simboluri cu valori (fructe, stele)', grade: 1, competencies: ['1.4', '4.1'], source: ['auxiliar'] },
  'mat.log.ordonare-indicii': { domain: 'mat', title: 'Ordonare după indicii („înainte”, „după”)', grade: 1, competencies: ['4.1'], source: ['imbogatire'] },
  'mat.log.clasificare': { domain: 'mat', title: 'Clasificare după unul sau două criterii', grade: 1, competencies: ['5.1', '4.1'], source: ['programa'] },
  'mat.log.si-sau-nu': { domain: 'mat', title: 'Cuvintele „și”, „sau”, „nu”', grade: 1, competencies: ['4.1'], source: ['programa'] },
  'mat.log.modele': { domain: 'mat', title: 'Modele care se repetă și modele care cresc', grade: 1, competencies: ['3.1'], source: ['programa', 'en2'] },
  'mat.log.adevarat-fals': { domain: 'mat', title: 'Afirmații adevărate sau false', grade: 1, competencies: ['4.2'], source: ['manual', 'auxiliar'] },
  'mat.log.venn': { domain: 'mat', title: 'Diagrama Venn', grade: 2, competencies: ['5.1'], source: ['programa'] },
  'mat.log.diagrama-cerc': { domain: 'mat', title: 'Cercul cu felii egale (o felie = un număr)', grade: 2, competencies: ['5.1'], source: ['imbogatire'] },
  'mat.log.grafic-linie': { domain: 'mat', title: 'Grafice în timp, pe zile și pe date', grade: 2, competencies: ['5.1'], source: ['imbogatire'] },
  'mat.log.arbori': { domain: 'mat', title: 'Arbori: ramuri, alegeri, sume, clasificări', grade: 2, competencies: ['5.1', '4.1'], source: ['imbogatire'] },
  'mat.log.retele': { domain: 'mat', title: 'Rețele și turnee: puncte legate prin linii', grade: 2, competencies: ['4.1'], source: ['imbogatire'] },
  'mat.log.analogii': { domain: 'mat', title: 'Analogii cu figuri și tabele cu reguli', grade: 2, competencies: ['3.1'], source: ['imbogatire'] },

  // ——— 7. Explorarea mediului ———
  'med.corp.organe': { domain: 'med', title: 'Organele interne și rolul lor', grade: 1, competencies: ['3.1'], source: ['manual', 'auxiliar', 'programa'] },
  'med.corp.simturi': { domain: 'med', title: 'Simțurile', grade: 0, competencies: ['3.1'], source: ['programa'] },
  'med.corp.igiena': { domain: 'med', title: 'Igiena și sănătatea', grade: 0, competencies: ['3.2'], source: ['manual', 'programa'] },
  'med.corp.miscare-odihna': { domain: 'med', title: 'Mișcare, odihnă și somn', grade: 2, competencies: ['3.2'], source: ['manual', 'programa'] },
  'med.plante.parti': { domain: 'med', title: 'Părțile plantei și rolul lor', grade: 1, competencies: ['3.1'], source: ['manual', 'programa'] },
  'med.plante.nevoi': { domain: 'med', title: 'De ce au nevoie plantele ca să crească', grade: 0, competencies: ['3.1'], source: ['auxiliar', 'programa'] },
  'med.soare': { domain: 'med', title: 'Soarele: sursă de lumină și căldură', grade: 1, competencies: ['3.1', '4.2'], source: ['programa'] },
  'med.apa.transformari': { domain: 'med', title: 'Transformările apei (înghețare, topire, evaporare)', grade: 1, competencies: ['3.1', '4.2'], source: ['programa', 'imbogatire'] },
  'med.pamant-soare-luna': { domain: 'med', title: 'Pământul, Soarele și Luna', grade: 0, competencies: ['3.1'], source: ['auxiliar', 'programa'] },
  'med.animale.domestice-salbatice': { domain: 'med', title: 'Animale domestice și animale sălbatice', grade: 0, competencies: ['5.1', '3.1'], source: ['manual', 'imbogatire'] },
  'med.energie.surse': { domain: 'med', title: 'Surse de energie care nu se termină și care se termină', grade: 1, competencies: ['3.1', '3.2'], source: ['auxiliar', 'programa'] },
  'med.anotimpuri': { domain: 'med', title: 'Anotimpurile', grade: 0, competencies: ['6.2', '3.1'], source: ['programa'] },
  'med.energie.forme': { domain: 'med', title: 'Forme de energie: lumina, căldura, electricitatea', grade: 1, competencies: ['3.1'], source: ['programa'] },
  'med.caderea-libera': { domain: 'med', title: 'Căderea liberă a obiectelor', grade: 1, competencies: ['3.1', '4.2'], source: ['programa'] },
  'med.sunete': { domain: 'med', title: 'Cum se produc și se aud sunetele', grade: 1, competencies: ['3.1'], source: ['programa'] },
  'med.reutilizare': { domain: 'med', title: 'Reutilizarea materialelor și economisirea energiei', grade: 1, competencies: ['3.2'], source: ['manual', 'programa'] },
  'med.alimentatie': { domain: 'med', title: 'Alimentația sănătoasă', grade: 2, competencies: ['3.2'], source: ['manual'] },
  'med.sanatate.virusuri': { domain: 'med', title: 'Boli provocate de virusuri și prevenirea lor', grade: 2, competencies: ['3.2'], source: ['manual', 'programa'] },
  'med.pamant.alcatuire': { domain: 'med', title: 'Pământul: uscat, apă, atmosferă', grade: 2, competencies: ['3.1'], source: ['manual'] },
  'med.relief': { domain: 'med', title: 'Formele de relief: munți, dealuri, câmpii', grade: 2, competencies: ['3.1'], source: ['manual', 'programa'] },
  'med.medii-de-viata': { domain: 'med', title: 'Medii de viață', grade: 2, competencies: ['3.1'], source: ['programa', 'en2'] },
  'med.planete': { domain: 'med', title: 'Planetele și succesiunea zi–noapte', grade: 2, competencies: ['3.1'], source: ['auxiliar', 'programa'] },
  'med.magneti': { domain: 'med', title: 'Magneții', grade: 2, competencies: ['3.1'], source: ['programa'] },
};
