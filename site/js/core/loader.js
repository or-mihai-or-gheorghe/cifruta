// Încărcarea catalogului și a testelor.

import catalog from '../../data/catalog.js';
import { normalizeTest } from './spec.js';

export { catalog };

export const allTests = () =>
  catalog.sections.flatMap((section) =>
    section.groups.flatMap((group) => group.tests.map((test) => ({ ...test, section, group }))),
  );

export const findTest = (id) => allTests().find((t) => t.id === id) ?? null;

export const findSection = (id) => catalog.sections.find((s) => s.id === id) ?? null;

export async function loadTest(id) {
  const entry = findTest(id);
  if (!entry || !entry.file) throw new Error(`Testul „${id}” nu există.`);
  // ?v= forțează descărcarea versiunii noi după publicare (GitHub Pages ține fișierele în cache)
  const mod = await import(`../../data/${entry.file}?v=${entry.version}`);
  return normalizeTest(mod.default);
}
