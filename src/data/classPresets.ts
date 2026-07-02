/** BAB progressions: index 0 = level 1, length 20 */
export const BAB_PRESETS = {
  full: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20],
  threeQuarters: [0,1,2,3,3,4,5,6,6,7,8,9,9,10,11,12,12,13,14,15],
  half: [0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10],
} as const;

/** Saving throw progressions: index 0 = level 1, length 20 */
export const SAVES_PRESETS = {
  good: [2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12],
  poor: [0,0,1,1,1,2,2,2,3,3,3,4,4,4,5,5,5,6,6,6],
} as const;

export const EMPTY_20 = Array(20).fill(0) as number[];
