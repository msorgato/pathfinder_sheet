/** Die values, labels and mesh specs: no dependency on three, so they load with the app. */

/** Which die of a roll a mesh is: a normal die, or the tens / units die of a d100. */
export type DieRole = 'normal' | 'tens' | 'units';

/** Number of faces of the solid used for a die type (d100 uses d10 solids). */
export const dieSides = (dieType: number): 4 | 6 | 8 | 10 | 12 | 20 => {
  switch (dieType) {
    case 4: return 4;
    case 6: return 6;
    case 8: return 8;
    case 10: case 100: return 10;
    case 12: return 12;
    case 20: return 20;
    default: return 6;
  }
};

/** Label printed on each face, in the order of `logicalFaces`. */
export function faceLabels(dieType: number, role: DieRole = 'normal'): string[] {
  const sides = dieSides(dieType);
  if (dieType === 100 && role === 'tens') return Array.from({ length: 10 }, (_, i) => (i === 0 ? '00' : String(i * 10)));
  if (dieType === 100 && role === 'units') return Array.from({ length: 10 }, (_, i) => String(i));
  return Array.from({ length: sides }, (_, i) => String(i + 1));
}

/** Index of the face that shows `value` (for a d100, `value` is the tens or the units of the roll). */
export function faceIndexForValue(dieType: number, role: DieRole, value: number): number {
  const label = dieType === 100 && role === 'tens' && value === 0 ? '00' : String(value);
  return faceLabels(dieType, role).indexOf(label);
}

/** Splits a d100 result into the tens die (00–90) and the units die (0–9); 100 is 00 and 0. */
export function splitPercentile(value: number): { tens: number; units: number } {
  const v = value === 100 ? 0 : value;
  return { tens: Math.floor(v / 10) * 10, units: v % 10 };
}


export interface DieSpec { dieType: number; role: DieRole; value: number }

/** The meshes a roll needs: one per die, two (tens and units) for each d100. */
export function meshSpecs(dice: number[], dieType: number): DieSpec[] {
  if (dieType === 100) {
    return dice.flatMap(v => {
      const { tens, units } = splitPercentile(v);
      return [{ dieType, role: 'tens' as const, value: tens }, { dieType, role: 'units' as const, value: units }];
    });
  }
  return dice.map(value => ({ dieType, role: 'normal' as const, value }));
}
