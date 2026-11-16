import { describe, it, expect } from 'vitest';
import type { ActiveEffect, Character, FeatDefinition, EquipmentItem } from '../types';
import { checkPrerequisites } from '../utils/prerequisiteChecker';
import { permanentAbilityScores, computeSpellSlots } from '../utils/calculations';
import { getClass } from '../data/classes';
import { resolveSpellcasting } from '../utils/spellcasting';

const feat = (prerequisites: string) => ({ id: 'f', name: 'F', prerequisites } as unknown as FeatDefinition);

function hero(over: Partial<Character> = {}): Character {
  return {
    id: 'c', name: 'T', race: 'human', alignment: 'NG',
    baseAbilityScores: { str: 12, dex: 15, con: 12, int: 10, wis: 10, cha: 10 }, abilityIncreases: [],
    classes: [{ classId: 'fighter', level: 5, favoredClassBonus: [] }], totalLevel: 5,
    hitPointsRolled: [], currentHp: 10, tempHp: 0, nonLethalDamage: 0,
    skills: [], feats: [], traits: [], knownSpells: [], preparedSpells: [], spellSlots: [],
    weaponAttacks: [], equipment: [], copper: 0, silver: 0, gold: 0, platinum: 0, experience: 0, notes: '',
    ...over,
  } as Character;
}

describe('feat prerequisites use the base ability scores', () => {
  it('a magic belt does not satisfy Forza 13', () => {
    const belt = {
      id: 'b', name: 'Cintura della Forza del Gigante +2', quantity: 1, notes: '', equipped: true, kind: 'magic', slot: 'belt',
      modifiers: [{ target: { kind: 'ability', ability: 'str' }, type: 'enhancement', value: 2 }],
    } as EquipmentItem;
    expect(checkPrerequisites(feat('Forza 13'), hero({ equipment: [belt] }), []).met).toBe(false);
  });

  it('an active effect does not count either', () => {
    const effect = { id: 'e', name: 'Forza del toro', modifiers: [{ target: { kind: 'ability', ability: 'str' }, type: 'enhancement', value: 4 }] } as unknown as ActiveEffect;
    expect(checkPrerequisites(feat('Forza 13'), hero({ effects: [effect] }), []).met).toBe(false);
  });

  it('a level increase does', () => {
    expect(checkPrerequisites(feat('Forza 13'), hero({ abilityIncreases: [{ str: 1 }] }), []).met).toBe(true);
  });

  it('ability damage does not remove the prerequisite', () => {
    expect(checkPrerequisites(feat('Destrezza 15'), hero({ abilityDamage: { dex: 4 } }), []).met).toBe(true);
  });

  it('permanentAbilityScores matches the base scores', () => {
    expect(permanentAbilityScores(hero({ abilityIncreases: [{ str: 1 }] })).str).toBe(13 + 0); // human has no fixed bonus
  });
});

describe('spell slots by progression', () => {
  const slots = (id: string, level: number, score: number) => {
    const sc = resolveSpellcasting(getClass(id))!;
    return computeSpellSlots(sc, level, score).map(s => s.total);
  };
  it('built-in casters of 5th level are unchanged', () => {
    expect(slots('wizard', 5, 10)).toEqual([4, 3, 2, 1]);
    expect(slots('sorcerer', 5, 10)).toEqual([6, 6, 4]);
    expect(slots('bard', 5, 10)).toEqual([6, 4, 2]);
    expect(slots('paladin', 5, 10)).toEqual([1]);
  });
  it('bonus spells come from the ability score', () => {
    expect(slots('wizard', 1, 18)).toEqual([3, 2 + 0]);
  });
});
