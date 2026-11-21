// Învață: widgeturile lecțiilor. Logica (pură) se importă static, deci și din Node, în teste; vederile se încarcă doar în pagină.

import array from './widgets/array/logic.js';
import imparte from './widgets/imparte/logic.js';
import jumps from './widgets/jumps/logic.js';
import parts from './widgets/parts/logic.js';
import wall from './widgets/wall/logic.js';

export const WIDGETS = { array, imparte, jumps, parts, wall };

export const VIEWS = {
  array: () => import('./widgets/array/view.js'),
  imparte: () => import('./widgets/imparte/view.js'),
  jumps: () => import('./widgets/jumps/view.js'),
  parts: () => import('./widgets/parts/view.js'),
  wall: () => import('./widgets/wall/view.js'),
};
