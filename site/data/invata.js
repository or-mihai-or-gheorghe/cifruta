// Învață: capitolele, lecțiile și provocările (date JSON, fără funcții). Fiecare lecție are în centru un widget din
// js/invata/registry.js, cu parametrii lui (`widget`), scopul lecției și ce înseamnă desenul (`goal`, caseta „Ce învățăm”), indicația
// Cifruței pentru glisoare și butoane (`intro`), 3–4 provocări și „Ce am aflat” (`notes`). Provocările:
//   want    — o stare a widgetului („Arată 4 × 6.” → { rows: 4, cols: 6 });
//   collect — mai multe soluții diferite, după `by`, cel puțin `need`;
//   pick    — o alegere (numere, fracții „n/d” sau desene din bancă), cu răspunsul calculat de regula `rule` (js/invata/logic.js,
//             PICK_RULES), un indiciu (`hint`) după o variantă greșită și, la nevoie, desenul despre care se întreabă (`show`);
//             `hide` ascunde o mărime cât e activă provocarea, ca răspunsul să nu stea scris pe ecran.
// tests/invata.test.js verifică totul: provocările se pot rezolva din interfață, în ordine, iar textele sunt corecte.
// Id-urile capitolelor, ale lecțiilor și ale provocărilor sunt permanente: stau în progresul salvat (`cifruta:invata`).

export default {
  chapters: [
    {
      id: 'inmultirea',
      title: 'Înmulțirea',
      short: 'Înmulțirea',
      icon: 'zar',
      grade: 2,
      text: 'Grupe egale, rânduri și coloane, sărituri pe axă și trucurile care fac tabla înmulțirii mai scurtă.',
      practice: 'inmultirea',
      lessons: [
        {
          id: 'grupe-egale',
          title: 'Grupe egale',
          icon: 'mar',
          goal: 'Fiecare farfurie e o grupă, cu la fel de multe mere. Când grupele sunt egale, nu mai aduni de mai multe ori același număr: înmulțești.',
          intro: 'Glisorul din stânga pune farfurii, cel de sus pune mere pe fiecare farfurie. „Numără” le numără farfurie cu farfurie.',
          concepts: ['mat.op.inmultire'],
          widget: { w: 'array', skin: 'plates', rows: 2, cols: 3, item: 'mar' },
          tasks: [
            { id: 'trei-farfurii', ask: 'Pune 3 farfurii cu câte 2 mere.', want: { rows: 3, cols: 2 } },
            { id: 'suma-cinci', ask: 'Arată cu farfurii adunarea 5 + 5 + 5 + 5.', want: { rows: 4, cols: 5 } },
            { id: 'douasprezece', ask: 'Așază 12 mere, la fel pe fiecare farfurie, în 3 feluri.', collect: { product: 12 }, by: ['rows', 'cols'], need: 3 },
          ],
          notes: [
            'Când aduni de mai multe ori același număr, **înmulțești**: 5 + 5 + 5 + 5 = 4 × 5.',
            '4 × 5 se citește „4 ori 5”: de 4 ori câte 5.',
          ],
        },
        {
          id: 'randuri-coloane',
          title: 'Rânduri și coloane',
          icon: 'stea',
          goal: 'Fără farfurii, merele rămân în rânduri egale și fac un dreptunghi. Înmulțirea îl numără repede: câte rânduri × câte pe fiecare rând.',
          intro: 'Glisorul din stânga alege rândurile, cel de sus câte stau pe rând; poți și atinge un punct. „Întoarce” răstoarnă dreptunghiul, iar butonul din colț schimbă obiectele.',
          concepts: ['mat.op.inmultire', 'mat.op.inmultire-proprietati'],
          widget: { w: 'array', skin: 'grid', rows: 3, cols: 4, item: 'mar', flip: true },
          tasks: [
            { id: 'doi-sapte', ask: 'Arată 2 rânduri cu câte 7 mere.', want: { rows: 2, cols: 7 } },
            { id: 'patru-sase', ask: 'Arată 4 × 6.', want: { rows: 4, cols: 6 } },
            { id: 'intoarce', ask: 'Apasă „Întoarce” ca să faci din el 6 × 4.', want: { rows: 6, cols: 4 } },
            { id: 'douazeci-patru', ask: 'Găsește toate dreptunghiurile cu 24 de obiecte.', collect: { product: 24 }, by: ['rows', 'cols'], need: 4 },
          ],
          notes: [
            'În 4 × 6 = 24, 4 și 6 sunt **factorii**, iar 24 este **produsul**.',
            'Ordinea factorilor nu schimbă produsul: 4 × 6 = 6 × 4.',
            'La capătul rândurilor numeri din 6 în 6: 6, 12, 18, 24.',
          ],
        },
        {
          id: 'sarituri',
          title: 'Sărituri pe axă',
          icon: 'veverita',
          goal: 'Înmulțirea e și o numărătoare din n în n: 4 sărituri de câte 3 ajung la 3, 6, 9, 12, adică la 4 × 3.',
          intro: 'Glisorul de sus alege cât de lungă e o săritură, cel de jos câte sărituri face veverița. „Sari!” arată săriturile pe rând.',
          concepts: ['mat.op.inmultire', 'mat.op.tabla-inmultirii'],
          widget: { w: 'jumps', step: 2, count: 3 },
          tasks: [
            { id: 'trei-cinci', ask: 'Fă 3 sărituri de câte 5.', want: { count: 3, step: 5 } },
            { id: 'din-patru', ask: 'Numără din 4 în 4 până la 28.', want: { step: 4, end: 28 } },
            { id: 'optsprezece', ask: 'Fă sărituri egale până la 18, în 2 feluri.', collect: { end: 18 }, by: ['step', 'count'], need: 2 },
          ],
          notes: [
            '3 sărituri de câte 5: 5 + 5 + 5 = 3 × 5 = 15.',
            'Când numeri din 4 în 4, spui tabla lui 4: 4, 8, 12, 16, 20…',
          ],
        },
        {
          id: 'spargem-dreptunghiul',
          title: 'Spargem dreptunghiul',
          icon: 'para',
          goal: 'Un calcul greu se face din două ușoare: 7 × 6 înseamnă 5 × 6 și încă 2 × 6. Așa afli și calculele pe care nu le știi pe de rost.',
          intro: 'Glisoarele din stânga și de sus fac dreptunghiul, iar glisorul din dreapta mută tăietura: deasupra ei sunt mere, dedesubt pere.',
          concepts: ['mat.op.tabla-inmultirii', 'mat.op.inmultire-proprietati'],
          widget: { w: 'array', skin: 'split', rows: 4, cols: 3, cut: 2 },
          tasks: [
            { id: 'sapte-sase', ask: 'Arată 7 × 6, tăiat după 5 rânduri.', want: { rows: 7, cols: 6, cut: 5 } },
            { id: 'sapte-opt', ask: 'Cât face 7 × 8? Taie-l după 5 rânduri.', pick: [54, 56, 63], rule: 'produs', of: [7, 8], hide: ['product'], hint: 'Încă nu. Adună bucățile: 5 × 8 = 40 și 2 × 8 = 16.' },
            { id: 'sase-noua', ask: 'Arată 6 × 9 din două bucăți egale.', want: { rows: 6, cols: 9, cut: 3 } },
          ],
          notes: [
            '7 × 6 = 5 × 6 + 2 × 6 = 30 + 12 = 42.',
            'Un calcul greu se face din două ușoare: de 5 ori, apoi încă puțin.',
          ],
        },
        {
          id: 'harta-tablei',
          title: 'Harta tablei înmulțirii',
          icon: 'harta',
          goal: 'Tabla înmulțirii are 100 de calcule, dar pe multe le știi deja, cu câteva trucuri. Vezi cât de puține îți mai rămân de învățat.',
          intro: 'Glisoarele aleg un rând și o coloană: unde se întâlnesc, afli produsul. Fiecare buton aprinde calculele știute cu un truc.',
          concepts: ['mat.op.tabla-inmultirii', 'mat.op.inmultire-proprietati'],
          widget: { w: 'array', skin: 'table', rows: 2, cols: 3 },
          tasks: [
            { id: 'sase-sapte', ask: 'Găsește pe hartă 6 × 7.', want: { rows: 6, cols: 7 } },
            { id: 'usoare', ask: 'Aprinde × 2, × 5 și × 10: pe ele le știi!', want: { x2: true, x5: true, x10: true } },
            { id: 'toate', ask: 'Aprinde și × 1, pătratele și „Întoarse”.', want: { known: 70 } },
          ],
          notes: [
            'Știi deja 70 de căsuțe din 100. Cele 30 rămase sunt doar 15 calcule, plus întoarsele lor.',
            'Un calcul nou se află din unul știut: 6 × 7 = 5 × 7 + 7 = 42.',
          ],
        },
      ],
    },
    {
      id: 'fractiile',
      title: 'Fracțiile',
      short: 'Fracțiile',
      icon: 'prajitura',
      grade: 2,
      text: 'Jumătatea și sfertul, apoi fracții până la zecimi: numărătorul și numitorul, fracția dintr-o mulțime, fracții egale și compararea lor.',
      lessons: [
        {
          id: 'parti-egale',
          title: 'Părți egale',
          icon: 'prajitura',
          goal: 'Când tai un întreg în părți egale, fiecare parte e o fracție: o parte din 2 e o jumătate, o parte din 4 e un sfert.',
          intro: 'Alege ce tai (pizza, ciocolata sau napolitana) și, cu glisorul, în câte părți egale. Atinge o bucată ca s-o colorezi.',
          concepts: ['mat.fractii.jumatate-sfert'],
          widget: { w: 'parts', shape: 'circle', parts: 1, min: 1, max: 4, shapes: ['circle', 'bar', 'square'] },
          tasks: [
            { id: 'pizza-doi', ask: 'Taie pizza în 2 părți egale.', want: { shape: 'circle', parts: 2 } },
            {
              id: 'care-jumatati',
              ask: 'Care desen arată două jumătăți?',
              pick: [
                { v: 'fraction', shape: 'circle', parts: 2, sizes: [1, 2] },
                { v: 'fraction', shape: 'bar', parts: 3 },
                { v: 'fraction', shape: 'square', parts: 2, cut: 'diagonal' },
              ],
              rule: 'jumatati',
              hint: 'Încă nu. Jumătățile sunt două bucăți la fel de mari.',
            },
            { id: 'un-sfert', ask: 'Taie ciocolata în 4 părți egale și colorează una.', want: { shape: 'bar', parts: 4, on: 1 } },
            {
              id: 'care-sferturi',
              ask: 'Care desen arată sferturi?',
              pick: [
                { v: 'fraction', shape: 'square', parts: 4, cut: 'grid' },
                { v: 'fraction', shape: 'bar', parts: 4, sizes: [1, 1, 2, 2] },
                { v: 'fraction', shape: 'circle', parts: 3 },
              ],
              rule: 'sferturi',
              hint: 'Încă nu. Sferturile sunt patru bucăți la fel de mari.',
            },
          ],
          notes: [
            'O **jumătate** e o parte din 2 părți egale; un **sfert** e o parte din 4 părți egale.',
            'Părțile trebuie să fie la fel de mari, dar pot avea forme diferite: și două triunghiuri fac jumătăți.',
          ],
        },
        {
          id: 'jumatate-sfert',
          title: 'Jumătatea și sfertul',
          icon: 'ciocolata',
          goal: 'Un sfert e jumătate dintr-o jumătate. Tai napolitana în două, apoi fiecare jumătate încă o dată, și vezi că două sferturi fac o jumătate.',
          intro: 'Sub desen alegi în câte bucăți tai: întreg, jumătăți, sferturi sau optimi; fiecare treaptă taie fiecare bucată în două. Atinge o bucată ca s-o colorezi.',
          concepts: ['mat.fractii.jumatate-sfert', 'mat.fractii.egale'],
          widget: { w: 'parts', shape: 'square', parts: 1, cut: true, shapes: ['square', 'circle'] },
          tasks: [
            { id: 'o-jumatate', ask: 'Taie napolitana în jumătăți și colorează una.', want: { parts: 2, on: 1 } },
            { id: 'doua-sferturi', ask: 'Taie acum în sferturi. Uită-te la partea colorată!', want: { parts: 4, on: 2 } },
            { id: 'un-sfert', ask: 'Lasă colorat doar un sfert.', want: { parts: 4, on: 1 } },
            { id: 'trei-sferturi', ask: 'Colorează trei sferturi.', want: { value: '3/4' } },
          ],
          notes: [
            'Un **sfert** e jumătate dintr-o jumătate: tai jumătatea încă o dată în două.',
            'Două sferturi fac o jumătate, iar patru sferturi fac un întreg.',
            'În clasa a III-a, jumătatea se mai numește **doime**, iar sfertul **pătrime**.',
          ],
        },
        {
          id: 'numarator-numitor',
          title: 'Numărătorul și numitorul',
          icon: 'biscuit',
          goal: 'O fracție are două numere: jos, numitorul spune în câte părți egale tai întregul; sus, numărătorul spune câte părți iei.',
          intro: 'Glisorul de sus alege în câte părți tai, cel de jos câte bucăți colorezi; poți și atinge bucățile.',
          concepts: ['mat.fractii.numarator-numitor'],
          widget: { w: 'parts', shape: 'bar', parts: 2, min: 1, max: 10, shapes: ['bar', 'circle', 'square'], labels: true },
          tasks: [
            { id: 'doua-treimi', ask: 'Colorează {{f:2/3}}.', want: { parts: 3, on: 2 } },
            { id: 'cinci-optimi', ask: 'Colorează {{f:5/8}}.', want: { parts: 8, on: 5 } },
            { id: 'un-intreg', ask: 'Taie în 6 părți și colorează tot întregul.', want: { parts: 6, on: 6 } },
            {
              id: 'ce-fractie',
              ask: 'Ce fracție e colorată?',
              show: { v: 'fraction', shape: 'circle', parts: 5, on: [0, 1, 2] },
              pick: ['3/5', '2/5', '3/8'],
              rule: 'valoare',
              of: [3, 5],
              hint: 'Încă nu. Numără bucățile colorate, apoi toate bucățile.',
            },
          ],
          notes: [
            'În {{f:3/5}}, **numitorul** 5 spune în câte părți egale tai, iar **numărătorul** 3, câte părți iei.',
            'Când iei toate părțile, ai un întreg: {{f:6/6}}.',
          ],
        },
        {
          id: 'din-multime',
          title: 'Fracția dintr-o mulțime',
          icon: 'mar',
          goal: 'O fracție se ia și dintr-un grup de obiecte: jumătate din 8 mere înseamnă să le împarți pe 2 farfurii egale și să iei una.',
          intro: 'Glisorul din stânga alege pe câte farfurii împarți merele, cel de sus câte stau pe fiecare. Atinge farfuriile pe care le iei.',
          concepts: ['mat.fractii.din-multime'],
          widget: { w: 'array', skin: 'plates', mark: true, rows: 2, cols: 2, item: 'mar' },
          tasks: [
            { id: 'jumatate-opt', ask: 'Arată jumătate din 8 mere.', want: { rows: 2, product: 8, marked: 1 } },
            { id: 'sfert-doisprezece', ask: 'Arată un sfert din 12 mere.', want: { rows: 4, product: 12, marked: 1 } },
            { id: 'doua-treimi-noua', ask: 'Arată {{f:2/3}} din 9 mere.', want: { rows: 3, product: 9, marked: 2 } },
          ],
          notes: [
            'Ca să afli {{f:2/3}} din 9, împarți cele 9 mere pe 3 farfurii egale (câte 3) și iei 2 farfurii: 6 mere.',
            'Jumătate din 8 înseamnă 8 mere pe 2 farfurii egale: 4 pe fiecare.',
          ],
        },
        {
          id: 'zidul-fractiilor',
          title: 'Zidul fracțiilor',
          icon: 'cuburi',
          goal: 'Pe zid, fiecare rând e același întreg, tăiat în tot mai multe bucăți. Vezi ce fracții sunt egale și care e mai mare.',
          intro: 'Glisorul din stânga alege rândul, cel de sus câte bucăți iei; poți și atinge o cărămidă. Linia arată unde se termină fracția.',
          concepts: ['mat.fractii.egale', 'mat.fractii.comparare'],
          widget: { w: 'wall', den: 3, num: 1 },
          tasks: [
            { id: 'o-doime', ask: 'Arată {{f:1/2}} pe zid.', want: { den: 2, num: 1 } },
            { id: 'zecimi', ask: 'Pe rândul zecimilor, arată fracția egală cu {{f:1/2}}.', want: { den: 10, num: 5 }, hide: ['same'] },
            { id: 'sesimi', ask: 'Pe rândul șesimilor, arată fracția egală cu {{f:2/3}}.', want: { den: 6, num: 4 }, hide: ['same'] },
            { id: 'mai-mare', ask: 'Care fracție e mai mare?', pick: ['1/5', '1/3'], rule: 'mai-mare', hint: 'Încă nu. Uită-te pe zid: care bucată e mai lungă?' },
          ],
          notes: [
            '{{f:1/2}} = {{f:2/4}} = {{f:3/6}} = {{f:4/8}} = {{f:5/10}}: aceeași lungime pe zid.',
            'Cu cât tai întregul în mai multe bucăți, cu atât bucățile sunt mai mici: {{f:1/3}} e mai mare decât {{f:1/5}}.',
          ],
        },
      ],
    },
    {
      id: 'impartirea',
      title: 'Împărțirea',
      icon: 'calcul',
      soon: true,
      text: 'Împărțirea în grupe egale și legătura ei cu înmulțirea.',
    },
  ],
};
