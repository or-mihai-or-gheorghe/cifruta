// Învață: capitolele, lecțiile și provocările (date JSON, fără funcții). Fiecare lecție are în centru un widget din
// js/invata/registry.js, cu parametrii lui (`widget`), o indicație a Cifruței (`intro`, începe cu verbul), 3–4 provocări și
// „Ce am aflat” (`notes`). Provocările:
//   want    — o stare a widgetului („Arată 4 × 6.” → { rows: 4, cols: 6 });
//   collect — mai multe soluții diferite, după `by`, cel puțin `need`;
//   pick    — o alegere, cu răspunsul calculat de regula `rule` (js/invata/logic.js, PICK_RULES); `hide` ascunde o mărime cât e
//             activă provocarea, ca răspunsul să nu stea scris pe ecran.
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
          intro: 'Mută glisoarele: câte farfurii pui și câte mere pe fiecare?',
          concepts: ['mat.op.inmultire'],
          widget: { w: 'array', skin: 'plates', rows: 2, cols: 3, item: 'mar' },
          tasks: [
            { id: 'trei-farfurii', ask: 'Pune 3 farfurii cu câte 2 mere.', want: { rows: 3, cols: 2 } },
            { id: 'suma-cinci', ask: 'Arată 5 + 5 + 5 + 5.', want: { rows: 4, cols: 5 } },
            { id: 'douasprezece', ask: 'Așază 12 mere pe farfurii egale, în 3 feluri.', collect: { product: 12 }, by: ['rows', 'cols'], need: 3 },
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
          intro: 'Trage de glisoare: cel de sus pune mai multe pe rând, cel din stânga adaugă rânduri.',
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
          intro: 'Alege cât de lungă e o săritură și câte sărituri face veverița.',
          concepts: ['mat.op.inmultire', 'mat.op.tabla-inmultirii'],
          widget: { w: 'jumps', step: 2, count: 3 },
          tasks: [
            { id: 'trei-cinci', ask: 'Fă 3 sărituri de câte 5.', want: { count: 3, step: 5 } },
            { id: 'din-patru', ask: 'Numără din 4 în 4 până la 28.', want: { step: 4, end: 28 } },
            { id: 'optsprezece', ask: 'Ajungi la 18 din sărituri egale, în 2 feluri.', collect: { end: 18 }, by: ['step', 'count'], need: 2 },
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
          intro: 'Taie dreptunghiul în două bucăți ușoare, apoi adună-le.',
          concepts: ['mat.op.tabla-inmultirii', 'mat.op.inmultire-proprietati'],
          widget: { w: 'array', skin: 'split', rows: 4, cols: 3, cut: 2 },
          tasks: [
            { id: 'sapte-sase', ask: 'Arată 7 × 6, tăiat după 5 rânduri.', want: { rows: 7, cols: 6, cut: 5 } },
            { id: 'sapte-opt', ask: 'Cât face 7 × 8? Taie-l după 5 rânduri.', pick: [54, 56, 63], rule: 'produs', of: [7, 8], hide: ['product'] },
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
          intro: 'Alege un rând și o coloană: unde se întâlnesc, afli produsul.',
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
      icon: 'prajitura',
      soon: true,
      text: 'Jumătatea și sfertul, apoi fracții până la zecimi, fracții egale și compararea lor.',
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
