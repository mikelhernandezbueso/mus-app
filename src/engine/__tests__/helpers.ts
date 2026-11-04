import { DEFAULT_RULES, type Rules } from '../types';
import { parseHand } from '../cards';
export const R8: Rules = { ...DEFAULT_RULES };
export const R4: Rules = { ...DEFAULT_RULES, variant: '4reyes' };
export const R8real: Rules = { ...DEFAULT_RULES, real31: true };
export const H = parseHand;
