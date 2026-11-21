// Învață: widgeturile lecțiilor. Logica (pură) se importă static, deci și din Node, în teste; vederile se încarcă doar în pagină.

import array from './widgets/array/logic.js';
import balanta from './widgets/balanta/logic.js';
import bare from './widgets/bare/logic.js';
import imparte from './widgets/imparte/logic.js';
import jumps from './widgets/jumps/logic.js';
import masina from './widgets/masina/logic.js';
import parts from './widgets/parts/logic.js';
import wall from './widgets/wall/logic.js';

export const WIDGETS = { array, balanta, bare, imparte, jumps, masina, parts, wall };

export const VIEWS = {
  array: () => import('./widgets/array/view.js'),
  balanta: () => import('./widgets/balanta/view.js'),
  bare: () => import('./widgets/bare/view.js'),
  imparte: () => import('./widgets/imparte/view.js'),
  jumps: () => import('./widgets/jumps/view.js'),
  masina: () => import('./widgets/masina/view.js'),
  parts: () => import('./widgets/parts/view.js'),
  wall: () => import('./widgets/wall/view.js'),
};
