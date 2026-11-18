import type { RollPart, RollRequest } from '../components/sheet/DiceRoller';
import type { Stat } from './derivedStats';

/** Most dice shown as shapes; above this only the values are listed. */
export const MAX_VISIBLE_DICE = 5;
export const showDice = (count: number) => count <= MAX_VISIBLE_DICE;

/** Breakdown of a stat as named entries (zero entries dropped). Their sum is the stat total. */
export function rollParts(stat: Stat, baseLabel = 'Base'): RollPart[] {
  return [{ label: baseLabel, value: stat.base }, ...stat.applied.map(e => ({ label: e.source, value: e.value }))]
    .filter(p => p.value !== 0);
}

/** True when the named parts add up to the modifier, so they can be shown safely. */
export const partsMatch = (parts: RollPart[] | undefined, modifier: number): parts is RollPart[] =>
  !!parts && parts.length > 0 && parts.reduce((s, p) => s + p.value, 0) === modifier;

export type RollOutcome = 'crit' | 'threat' | 'fumble' | null;

/** Outcome of a single d20; null for any other roll. `critRange` is the weapon's threat range start. */
export function rollOutcome(dice: number[], dieType: number, critRange?: number): RollOutcome {
  if (dieType !== 20 || dice.length !== 1) return null;
  const v = dice[0];
  if (v === 20) return 'crit';
  if (v === 1) return 'fumble';
  if (critRange !== undefined && critRange < 20 && v >= critRange) return 'threat';
  return null;
}

/** Parts of an attack's to-hit; `offset` is the (negative) penalty of an iterative attack. */
export function attackParts(toHit: Stat, offset = 0): RollPart[] {
  const parts = rollParts(toHit, 'BAB e caratteristica');
  return offset === 0 ? parts : [...parts, { label: 'Attacco iterativo', value: offset }];
}

/** d20 roll of a stat (save, skill, ability check, initiative, CMB). */
export const statRoll = (label: string, stat: Stat): RollRequest => ({
  label, numDice: 1, dieType: 20, modifier: stat.total, parts: rollParts(stat),
});

/** d20 attack roll; `offset` is the iterative penalty, `critRange` the weapon's threat range. */
export const attackRoll = (label: string, toHit: Stat, offset = 0, critRange?: number): RollRequest => ({
  label, numDice: 1, dieType: 20, modifier: toHit.total + offset, parts: attackParts(toHit, offset),
  ...(critRange !== undefined ? { critRange } : {}),
});

/** Everything the reveal needs; the result is already decided. */
export interface RevealData {
  id: string;
  label: string;
  dice: number[];
  dieType: number;
  modifier: number;
  total: number;
  parts?: RollPart[];
  critRange?: number;
}

/** Bonuses to show, one by one: the named parts if they add up, else one unnamed entry (none for +0). */
export function bonusEntries(data: Pick<RevealData, 'parts' | 'modifier'>): RollPart[] {
  if (partsMatch(data.parts, data.modifier)) return data.parts;
  return data.modifier === 0 ? [] : [{ label: '', value: data.modifier }];
}

/** The 3D dice are used for up to five dice, when motion is allowed and the 3D scene is ready; otherwise the 2D ones. */
export const shouldUse3D = (reducedMotion: boolean, diceCount: number, ready: boolean) =>
  !reducedMotion && ready && showDice(diceCount);

export type RevealStep = { kind: 'spin' | 'land' | 'bonus' | 'total'; ms: number };

export const SPIN_MS = 700;
/** Duration of the 3D throw. */
export const SPIN_3D_MS = 1300;
export const LAND_MS = 350;
export const BONUS_MS = 150;
export const CLOSE_MS = 1500;

/** Ordered steps of the reveal; with no dice shown the spin is skipped. `ms` is how long a step lasts. */
export function buildTimeline(
  data: Pick<RevealData, 'dice' | 'parts' | 'modifier'>,
  options: { spinMs?: number } = {},
): RevealStep[] {
  const steps: RevealStep[] = [];
  if (showDice(data.dice.length)) steps.push({ kind: 'spin', ms: options.spinMs ?? SPIN_MS });
  steps.push({ kind: 'land', ms: LAND_MS });
  bonusEntries(data).forEach(() => steps.push({ kind: 'bonus', ms: BONUS_MS }));
  steps.push({ kind: 'total', ms: CLOSE_MS });
  return steps;
}
