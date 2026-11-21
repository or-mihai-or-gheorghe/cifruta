#!/usr/bin/env node
// La publicare (GitHub Actions): pune versiunea în adresele modulelor și ale foilor de stil (`?v=<commit>`). GitHub Pages lasă
// browserul să țină fiecare fișier 10 minute (max-age=600); fără versiune, o pagină nouă putea cere o funcție nouă dintr-un modul
// vechi, încă în cache, și arăta „Ceva nu a mers” (v0.22.0: „storage.js does not provide an export named getLessons”). Cu versiunea
// în adrese, fiecare publicare are alte adrese, deci modulele unei versiuni nu se amestecă cu ale alteia.
// Rulează doar pe pachetul publicat, niciodată pe site/ din git. Folosire: node tools/versiune.mjs <folder> <versiune>

import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Importurile relative ale unui modul: `from './a.js'`, `import './b.js'`, `import('./c.js')`, `import(`../t/${x}/v.js`)`. */
const JS_IMPORT = /(\b(?:from|import)\s*\(?\s*)(['"`])(\.{1,2}\/[^'"`?\n]+?\.js)\2/g;
/** Scriptul și foaia de stil din index.html. */
const HTML_ASSET = /\b(src|href)="((?:js|css)\/[^"?]+\.(?:js|css))"/g;
/** Foile de stil importate din main.css. */
const CSS_IMPORT = /(@import\s+url\()(['"])([^'"?]+\.css)\2\)/g;

/** Textul unui fișier, cu versiunea pusă în adresele lui (cele care au deja „?”, ca testele cu `?v=`, rămân neatinse). */
export function versioned(kind, text, version) {
  const q = `?v=${version}`;
  if (kind === 'js') return text.replace(JS_IMPORT, (m, lead, quote, path) => `${lead}${quote}${path}${q}${quote}`);
  if (kind === 'html') return text.replace(HTML_ASSET, (m, attr, path) => `${attr}="${path}${q}"`);
  if (kind === 'css') return text.replace(CSS_IMPORT, (m, lead, quote, path) => `${lead}${quote}${path}${q}${quote})`);
  return text;
}

/** Importurile relative rămase fără versiune (după rescriere trebuie să nu fie niciuna). */
export const unversioned = (text) => [...text.matchAll(JS_IMPORT)].map((m) => m[3]);

const walk = (dir) => readdirSync(dir).flatMap((name) => (statSync(join(dir, name)).isDirectory() ? walk(join(dir, name)) : [join(dir, name)]));

function main([root, version]) {
  if (!root || !/^[\w.-]+$/.test(version ?? '')) {
    console.error('Folosire: node tools/versiune.mjs <folder> <versiune>');
    process.exit(1);
  }
  let changed = 0;
  for (const file of walk(root)) {
    const kind = file.endsWith('.js') ? 'js' : file.endsWith('index.html') ? 'html' : file.endsWith('.css') ? 'css' : null;
    if (!kind) continue;
    const before = readFileSync(file, 'utf8');
    const after = versioned(kind, before, version);
    if (after === before) continue;
    writeFileSync(file, after);
    changed++;
    if (kind === 'js' && unversioned(after).length) {
      console.error(`::error::${file}: importuri fără versiune: ${unversioned(after).join(', ')}`);
      process.exit(1);
    }
  }
  const index = readFileSync(join(root, 'index.html'), 'utf8');
  if (!index.includes(`js/app.js?v=${version}`)) {
    console.error('::error::index.html nu încarcă js/app.js cu versiunea');
    process.exit(1);
  }
  console.log(`Versiunea ${version} e în adresele din ${changed} fișiere.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
