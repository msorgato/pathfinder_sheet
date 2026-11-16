/// <reference types="node" />
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import type { Character, CustomClassDefinition, SpellDefinition } from '../types';
import { getClass } from '../data/classes';
import { useDataStore } from '../store/dataStore';
import {
  casterLevel, casterLevelsByList, classSpellList, defaultCustomSpellLevel, resolveSpellcasting, spellLevelFor,
} from '../utils/spellcasting';

const spell = (id: string, levels: Record<string, number>) => ({ id, name: id, levels }) as SpellDefinition;
const SPELLS = [
  spell('armatura_magica', { wizard: 1, sorcerer: 1 }),
  spell('cura_ferite_leggere', { cleric: 1, bard: 1, druid: 1, paladin: 1 }),
  spell('palla_di_fuoco', { wizard: 3, sorcerer: 3 }),
  spell('dito_della_morte', { wizard: 7, cleric: 8 }),
  spell('guarigione', { cleric: 6, druid: 7 }),
  spell('senza_liste', {}),
];

const custom = (spellcasting: CustomClassDefinition['spellcasting'], id = 'mistico'): CustomClassDefinition => ({
  id, name: 'Mistico', description: '', hitDie: 8, status: 'published', armorProficiencies: [], weaponProficiencies: '',
  skillsPerLevel: 2, classSkills: [], bab: [], saves: { fort: [], ref: [], will: [] }, features: [], spellcasting,
  createdAt: 0, updatedAt: 0,
});

const hero = (classes: Array<[string, number]>): Character => ({
  id: 'c', classes: classes.map(([classId, level]) => ({ classId, level, favoredClassBonus: [] })),
} as unknown as Character);

describe('resolveSpellcasting', () => {
  it('a built-in class gives its own model', () => {
    const sc = resolveSpellcasting(getClass('wizard'))!;
    expect(sc).toMatchObject({ classId: 'wizard', ability: 'int', type: 'prepared', usesSpellbook: true, progression: 'full', maxSpellLevel: 9 });
    expect(resolveSpellcasting(getClass('fighter'))).toBeNull();
  });

  it('a complete custom class gives its own model', () => {
    const sc = resolveSpellcasting(custom({ enabled: true, ability: 'wis', type: 'prepared', school: 'divine', progression: 'medium', sourceList: 'cleric' }))!;
    expect(sc).toMatchObject({ ability: 'wis', type: 'prepared', school: 'divine', progression: 'medium', maxSpellLevel: 6, sourceList: 'cleric' });
    expect(sc.slots[5]).toBeDefined();
  });

  it('an old custom class with only a source list inherits from the sorcerer', () => {
    const sc = resolveSpellcasting(custom({ enabled: true, sourceList: 'sorcerer' }))!;
    expect(sc).toMatchObject({ ability: 'cha', type: 'spontaneous', school: 'arcane', progression: 'full', maxSpellLevel: 9 });
    expect(sc.spellsKnown).toBeDefined();
  });

  it('incomplete or disabled custom classes do not cast', () => {
    expect(resolveSpellcasting(custom({ enabled: true, customSpells: ['palla_di_fuoco'] }))).toBeNull();
    expect(resolveSpellcasting(custom({ enabled: true, ability: 'int' }))).toBeNull();
    expect(resolveSpellcasting(custom({ enabled: false, sourceList: 'wizard' }))).toBeNull();
    expect(resolveSpellcasting(custom(undefined))).toBeNull();
  });

  it('reduced + spontaneous is not valid', () => {
    expect(resolveSpellcasting(custom({ enabled: true, ability: 'cha', type: 'spontaneous', progression: 'reduced' }))).toBeNull();
  });
});

describe('spell list of a class', () => {
  const wizardLike = (extra: Partial<NonNullable<CustomClassDefinition['spellcasting']>> = {}) =>
    resolveSpellcasting(custom({ enabled: true, ability: 'int', type: 'prepared', progression: 'full', sourceList: 'wizard', ...extra }))!;

  it('a built-in class uses its own list', () => {
    const sc = resolveSpellcasting(getClass('cleric'))!;
    expect(classSpellList(sc, SPELLS).map(e => e.spell.id)).toEqual(['cura_ferite_leggere', 'dito_della_morte', 'guarigione']);
    expect(spellLevelFor(sc, SPELLS[4])).toBe(6);
  });

  it('is the union of source list and additional spells', () => {
    const sc = resolveSpellcasting(custom({ enabled: true, ability: 'wis', type: 'prepared', progression: 'full', sourceList: 'cleric', customSpells: ['palla_di_fuoco'], customSpellLevels: { palla_di_fuoco: 3 } }))!;
    const list = Object.fromEntries(classSpellList(sc, SPELLS).map(e => [e.spell.id, e.level]));
    expect(list).toMatchObject({ cura_ferite_leggere: 1, guarigione: 6, palla_di_fuoco: 3 });
    expect(list.armatura_magica).toBeUndefined();
  });

  it('the level of an additional spell prevails over the source list', () => {
    const sc = wizardLike({ customSpells: ['palla_di_fuoco'], customSpellLevels: { palla_di_fuoco: 5 } });
    expect(spellLevelFor(sc, SPELLS[2])).toBe(5);
  });

  it('an additional spell without a level gets the lowest of its lists', () => {
    const sc = resolveSpellcasting(custom({ enabled: true, ability: 'wis', type: 'prepared', progression: 'full', customSpells: ['guarigione'] }))!;
    expect(spellLevelFor(sc, SPELLS[4])).toBe(6);
    expect(defaultCustomSpellLevel(SPELLS[4])).toBe(6);
    expect(defaultCustomSpellLevel(SPELLS[5])).toBe(1);
  });

  it('spells above the highest level are not selectable', () => {
    const sc = wizardLike({ progression: 'reduced' });
    expect(spellLevelFor(sc, SPELLS[3])).toBeUndefined(); // 7th
    expect(spellLevelFor(sc, SPELLS[2])).toBe(3);
    expect(classSpellList(sc, SPELLS).map(e => e.spell.id)).not.toContain('dito_della_morte');
  });
});

describe('caster level', () => {
  it('uses the progression of each class', () => {
    expect(casterLevel(hero([['paladin', 7]]), 'paladin')).toBe(4);
    expect(casterLevel(hero([['paladin', 2]]), 'paladin')).toBe(0);
    expect(casterLevel(hero([['wizard', 7]]), 'wizard')).toBe(7);
    expect(casterLevel(hero([['fighter', 7]]), 'fighter')).toBe(0);
    expect(casterLevel(hero([['wizard', 7]]), 'cleric')).toBe(0);
  });

  it('lists by caster level, with custom classes on their own id and source list', () => {
    const mistico = custom({ enabled: true, ability: 'wis', type: 'prepared', progression: 'reduced', sourceList: 'cleric' });
    useDataStore.setState({ publishedCustomClasses: [mistico] });
    try {
      const lists = casterLevelsByList(hero([['mistico', 8], ['wizard', 3], ['fighter', 5]]));
      expect(lists.get('mistico')).toBe(5);
      expect(lists.get('cleric')).toBe(5);
      expect(lists.get('wizard')).toBe(3);
      expect(lists.has('fighter')).toBe(false);
    } finally {
      useDataStore.setState({ publishedCustomClasses: [] });
    }
  });
});

describe('spell levels are read in one place', () => {
  it('no component reads spell.levels[classId] directly', () => {
    const files: string[] = [];
    const walk = (dir: string) => readdirSync(dir, { withFileTypes: true }).forEach(e => {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p); else if (/\.tsx?$/.test(e.name)) files.push(p);
    });
    walk(join(__dirname, '../components'));
    const offenders = files.filter(f => /\.levels\[|\bin\s+\w+\.levels\b/.test(readFileSync(f, 'utf-8')));
    expect(offenders).toEqual([]);
  });
});
