// Învață: widgeturile lecțiilor. Logica (pură) se importă static, deci și din Node, în teste; vederile se încarcă doar în pagină.

import array from './widgets/array/logic.js';
import jumps from './widgets/jumps/logic.js';

export const WIDGETS = { array, jumps };

export const VIEWS = {
  array: () => import('./widgets/array/view.js'),
  jumps: () => import('./widgets/jumps/view.js'),
};
