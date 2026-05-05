import type { AbilityKey } from '../types';

export type AgeCategory = 'middle' | 'old' | 'venerable';

interface AgeThresholds {
  middle: number;
  old: number;
  venerable: number;
}

const THRESHOLDS: Record<string, AgeThresholds> = {
  human:      { middle: 35,  old: 53,  venerable: 70  },
  elf:        { middle: 175, old: 263, venerable: 350 },
  dwarf:      { middle: 125, old: 188, venerable: 250 },
  gnome:      { middle: 100, old: 150, venerable: 200 },
  halfling:   { middle: 50,  old: 75,  venerable: 100 },
  'half-elf': { middle: 62,  old: 93,  venerable: 125 },
  'half-orc': { middle: 30,  old: 45,  venerable: 60  },
};

// Cumulative totals per category (each stage already includes prior stages).
// middle = -1/-1/-1 phys, +1/+1/+1 ment
// old    = middle + (-2/-2/-2 phys, +1/+1/+1 ment) → -3/-3/-3, +2/+2/+2
// venerable = old + (-3/-3/-3 phys, +1/+1/+1 ment) → -6/-6/-6, +3/+3/+3
export const AGE_MODIFIERS: Record<AgeCategory, Partial<Record<AbilityKey, number>>> = {
  middle:    { str: -1, dex: -1, con: -1, int: 1, wis: 1, cha: 1 },
  old:       { str: -3, dex: -3, con: -3, int: 2, wis: 2, cha: 2 },
  venerable: { str: -6, dex: -6, con: -6, int: 3, wis: 3, cha: 3 },
};

export const AGE_CATEGORY_LABELS: Record<AgeCategory, string> = {
  middle:    "Mezz'età",
  old:       'Vecchiaia',
  venerable: 'Venerabile',
};

export function getAgeCategory(raceId: string, age: number): AgeCategory | null {
  const t = THRESHOLDS[raceId];
  if (!t) return null;
  if (age >= t.venerable) return 'venerable';
  if (age >= t.old) return 'old';
  if (age >= t.middle) return 'middle';
  return null;
}

export function getAgeThresholds(raceId: string): AgeThresholds | null {
  return THRESHOLDS[raceId] ?? null;
}
