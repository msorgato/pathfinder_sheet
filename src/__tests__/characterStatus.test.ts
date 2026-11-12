import { describe, it, expect } from 'vitest';
import type { Character } from '../types';
import {
  addEffect, applyCondition, removeEffect, restAbilityDamage, setAbilityDamage, setNegativeLevels, toggleEffect,
} from '../utils/characterStatus';

const base = { id: 'c1', conditions: [], effects: [] } as unknown as Character;
const withPatch = (c: Character, patch: Partial<Character>) => ({ ...c, ...patch }) as Character;

describe('conditions', () => {
  it('reapplying a condition updates its note instead of duplicating', () => {
    let c = withPatch(base, applyCondition(base, 'scosso', 'Intimidire'));
    c = withPatch(c, applyCondition(c, 'scosso'));
    expect(c.conditions).toHaveLength(1);
    expect(c.conditions![0]).toMatchObject({ conditionId: 'scosso', note: undefined });
  });
});

describe('effects', () => {
  it('drops zero-value modifiers, toggles and removes', () => {
    let c = withPatch(base, addEffect(base, {
      name: ' Benedizione ',
      modifiers: [
        { target: { kind: 'attack', scope: 'all' }, type: 'morale', value: 1 },
        { target: { kind: 'ac' }, type: 'dodge', value: 0 },
      ],
    }));
    expect(c.effects![0]).toMatchObject({ name: 'Benedizione', modifiers: [{ value: 1 }] });
    c = withPatch(c, toggleEffect(c, c.effects![0].id));
    expect(c.effects![0].disabled).toBe(true);
    c = withPatch(c, removeEffect(c, c.effects![0].id));
    expect(c.effects).toEqual([]);
  });
});

describe('ability damage, drain and rest', () => {
  it('rest heals 1 damage per ability and leaves drain', () => {
    let c = withPatch(base, setAbilityDamage(base, 'con', 3));
    c = withPatch(c, setAbilityDamage(c, 'str', 1));
    c = withPatch(c, { abilityDrain: { str: 2 } });
    const rested = withPatch(c, restAbilityDamage(c));
    expect(rested.abilityDamage).toEqual({ con: 2 });
    expect(rested.abilityDrain).toEqual({ str: 2 });
  });

  it('values are never negative', () => {
    expect(setAbilityDamage(base, 'dex', -2).abilityDamage).toEqual({});
    expect(setNegativeLevels({ temporary: -1, permanent: 2 }).negativeLevels).toEqual({ temporary: 0, permanent: 2 });
  });
});
