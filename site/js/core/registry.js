// Registrul tipurilor de exerciții. Un tip nou = folder nou în js/types/<tip>/ (logic.js + view.js) + o linie aici.

import build from '../types/build/logic.js';
import categorize from '../types/categorize/logic.js';
import choice from '../types/choice/logic.js';
import clock from '../types/clock/logic.js';
import fill from '../types/fill/logic.js';
import mark from '../types/mark/logic.js';
import match from '../types/match/logic.js';
import money from '../types/money/logic.js';
import order from '../types/order/logic.js';
import route from '../types/route/logic.js';
import slider from '../types/slider/logic.js';
import truefalse from '../types/truefalse/logic.js';

const LOGIC = { choice, truefalse, fill, slider, match, order, categorize, mark, build, clock, money, route };

export const TYPE_NAMES = Object.keys(LOGIC);

export const hasType = (type) => Object.hasOwn(LOGIC, type);

export function getLogic(type) {
  if (!hasType(type)) throw new Error(`Tip de exercițiu necunoscut: ${type}`);
  return LOGIC[type];
}

/** Partea vizuală (DOM) se încarcă doar când e nevoie. */
export const loadView = async (type) => (await import(`../types/${type}/view.js`)).default;
