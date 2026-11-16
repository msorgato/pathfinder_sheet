import { describe, it, expect } from 'vitest';
import { CLASSES } from '../data/classes';
import { casterLevelFor, progressionAllows, PROGRESSION_TABLES } from '../data/spellProgressions';

describe('spell progressions', () => {
  it('every built-in caster declares tables equal to its progression', () => {
    const casters = CLASSES.filter(c => c.spellcasting);
    expect(casters.map(c => c.id).sort()).toEqual(['bard', 'cleric', 'druid', 'paladin', 'ranger', 'sorcerer', 'wizard']);
    casters.forEach(c => {
      const sc = c.spellcasting!;
      const table = PROGRESSION_TABLES[sc.progression][sc.type];
      expect(table, c.id).toBeDefined();
      expect(sc.slots, c.id).toEqual(table!.slots);
      expect(sc.spellsKnown, c.id).toEqual(table!.spellsKnown);
      expect(sc.maxSpellLevel, c.id).toBe(table!.maxSpellLevel);
    });
  });

  it('reduced spontaneous does not exist', () => {
    expect(progressionAllows('reduced', 'spontaneous')).toBe(false);
    expect(progressionAllows('reduced', 'prepared')).toBe(true);
    expect(progressionAllows('medium', 'spontaneous')).toBe(true);
  });

  it('medium prepared uses the bard slots without spells known', () => {
    const t = PROGRESSION_TABLES.medium.prepared!;
    expect(t.slots[5]).toEqual(PROGRESSION_TABLES.medium.spontaneous!.slots[5]);
    expect(t.spellsKnown).toBeUndefined();
    expect(t.maxSpellLevel).toBe(6);
  });

  it('caster level', () => {
    expect(casterLevelFor('reduced', 7)).toBe(4);
    expect(casterLevelFor('reduced', 2)).toBe(0);
    expect(casterLevelFor('full', 7)).toBe(7);
    expect(casterLevelFor('medium', 7)).toBe(7);
  });
});
