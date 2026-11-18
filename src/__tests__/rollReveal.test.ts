import { describe, it, expect } from 'vitest';
import type { Character } from '../types';
import { deriveStats } from '../utils/derivedStats';
import { SPIN_3D_MS, SPIN_MS, bonusEntries, buildTimeline, shouldUse3D, partsMatch, rollOutcome, rollParts, showDice } from '../utils/rollReveal';

const char = {
  id: 'c', name: 'T', race: 'human', alignment: 'NG',
  baseAbilityScores: { str: 14, dex: 14, con: 12, int: 10, wis: 10, cha: 10 }, abilityIncreases: [],
  classes: [{ classId: 'fighter', level: 5, favoredClassBonus: [] }], totalLevel: 5,
  hitPointsRolled: [], currentHp: 10, tempHp: 0, nonLethalDamage: 0,
  skills: [], feats: [], traits: [], knownSpells: [], preparedSpells: [], spellSlots: [],
  weaponAttacks: [], equipment: [], copper: 0, silver: 0, gold: 0, platinum: 0, experience: 0, notes: '',
  effects: [{ id: 'e', name: 'Resistenza', modifiers: [{ target: { kind: 'save', save: 'ref' }, type: 'resistance', value: 1 }] }],
} as unknown as Character;

describe('rollParts', () => {
  it('sums to the stat total, without zero entries', () => {
    const stats = deriveStats(char);
    const parts = rollParts(stats.saves.ref);
    expect(parts.reduce((s, p) => s + p.value, 0)).toBe(stats.saves.ref.total);
    expect(parts.some(p => p.label === 'Resistenza' && p.value === 1)).toBe(true);
    expect(parts.every(p => p.value !== 0)).toBe(true);
  });
  it('partsMatch rejects an inconsistent breakdown', () => {
    expect(partsMatch([{ label: 'a', value: 3 }, { label: 'b', value: 1 }], 4)).toBe(true);
    expect(partsMatch([{ label: 'a', value: 3 }], 4)).toBe(false);
    expect(partsMatch(undefined, 0)).toBe(false);
    expect(partsMatch([], 0)).toBe(false);
  });
});

describe('rollOutcome', () => {
  it('classifies a single d20', () => {
    expect(rollOutcome([20], 20)).toBe('crit');
    expect(rollOutcome([1], 20)).toBe('fumble');
    expect(rollOutcome([19], 20, 19)).toBe('threat');
    expect(rollOutcome([19], 20)).toBeNull();
    expect(rollOutcome([18], 20, 19)).toBeNull();
    expect(rollOutcome([20, 3], 20)).toBeNull();
    expect(rollOutcome([6], 6)).toBeNull();
  });
});

describe('showDice', () => {
  it('shows up to five dice', () => {
    expect(showDice(5)).toBe(true);
    expect(showDice(6)).toBe(false);
  });
});

describe('timeline', () => {
  it('the spin lasts as long as asked (3D throw), 700 ms by default', () => {
    const d = { dice: [14], parts: undefined, modifier: 0 };
    expect(buildTimeline(d).find(x => x.kind === 'spin')?.ms).toBe(SPIN_MS);
    expect(buildTimeline(d, { spinMs: SPIN_3D_MS }).find(x => x.kind === 'spin')?.ms).toBe(1300);
  });
  const base = { dice: [14], parts: [{ label: 'Base', value: 5 }, { label: 'Forza', value: 4 }, { label: 'Benedizione', value: 1 }], modifier: 10 };
  it('spin, land, one step per bonus, then the total', () => {
    expect(buildTimeline(base).map(s => s.kind)).toEqual(['spin', 'land', 'bonus', 'bonus', 'bonus', 'total']);
  });
  it('skips the spin above five dice', () => {
    const many = { dice: [1, 2, 3, 4, 5, 6], parts: undefined, modifier: 2 };
    expect(buildTimeline(many).map(s => s.kind)).toEqual(['land', 'bonus', 'total']);
  });
  it('inconsistent parts fall back to a single unnamed bonus; +0 has none', () => {
    expect(bonusEntries({ parts: [{ label: 'a', value: 1 }], modifier: 5 })).toEqual([{ label: '', value: 5 }]);
    expect(bonusEntries({ parts: undefined, modifier: 0 })).toEqual([]);
    expect(buildTimeline({ dice: [3], parts: undefined, modifier: 0 }).map(s => s.kind)).toEqual(['spin', 'land', 'total']);
  });
});

describe('shouldUse3D', () => {
  it('3D only for up to five dice, with motion allowed and the scene ready', () => {
    expect(shouldUse3D(false, 1, true)).toBe(true);
    expect(shouldUse3D(false, 5, true)).toBe(true);
    expect(shouldUse3D(false, 6, true)).toBe(false);
    expect(shouldUse3D(true, 1, true)).toBe(false);
    expect(shouldUse3D(false, 1, false)).toBe(false);
  });
});
