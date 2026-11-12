/// <reference types="node" />
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Character, EquipmentItem, ItemDefinition } from '../types';
import { deriveStats } from '../utils/derivedStats';
import { attackFromItem, itemFromCatalog, removeItem } from '../utils/inventory';
import { getEffectPreset } from '../data/effectPresets';

const catalogue = JSON.parse(readFileSync(join(__dirname, '../../public/data/items.json'), 'utf-8')) as { items: ItemDefinition[] };
const defs = new Map(catalogue.items.map(i => [i.id, i]));
const worn = (id: string): EquipmentItem => ({ ...itemFromCatalog(defs.get(id)!), id, equipped: true });
const carried = (id: string): EquipmentItem => ({ ...itemFromCatalog(defs.get(id)!), id });

function hero(over: Partial<Character> & { dex?: number; str?: number; classId?: string; level?: number } = {}): Character {
  const { dex = 10, str = 16, classId = 'fighter', level = 5, ...rest } = over;
  return {
    id: 'c', name: 'T', race: 'human', alignment: 'NG',
    baseAbilityScores: { str, dex, con: 12, int: 10, wis: 10, cha: 10 }, abilityIncreases: [],
    classes: [{ classId, level, favoredClassBonus: [] }], totalLevel: level,
    hitPointsRolled: [], currentHp: 10, tempHp: 0, nonLethalDamage: 0,
    skills: [], feats: [], traits: [], knownSpells: [], preparedSpells: [], spellSlots: [],
    weaponAttacks: [], equipment: [], copper: 0, silver: 0, gold: 0, platinum: 0, experience: 0, notes: '',
    ...rest,
  } as Character;
}

describe('armor and shields in AC', () => {
  it('chain shirt and heavy wooden shield (Dex +1)', () => {
    const d = deriveStats(hero({ dex: 12, equipment: [worn('giaco-di-maglia'), worn('scudo-pesante-di-legno')] }));
    expect([d.ac.total, d.touch.total, d.flatFooted.total]).toEqual([17, 11, 16]);
    expect(d.ac.applied).toContainEqual({ source: 'Giaco di Maglia', type: 'armor', value: 4 });
  });

  it('studded leather (Dex +2)', () => {
    const d = deriveStats(hero({ dex: 14, equipment: [worn('armatura-di-cuoio-borchiato')] }));
    expect([d.ac.total, d.touch.total, d.flatFooted.total]).toEqual([15, 12, 13]);
  });

  it('carried armor has no effect', () => {
    const d = deriveStats(hero({ dex: 12, equipment: [carried('armatura-completa')] }));
    expect(d.ac.total).toBe(11);
    expect(d.armorCheckPenalty).toBe(0);
  });

  it('worn armor does not stack with Armatura magica', () => {
    const p = getEffectPreset('armatura-magica')!;
    const d = deriveStats(hero({
      equipment: [worn('giaco-di-maglia')], effects: [{ id: 'e', name: p.name, modifiers: p.modifiers }],
    }));
    expect(d.ac.total).toBe(14);
    expect(d.ac.suppressed).toHaveLength(1);
  });

  it('caps Dexterity in AC and CMD but not in Reflex', () => {
    const free = deriveStats(hero({ dex: 18 }));
    const d = deriveStats(hero({ dex: 18, equipment: [worn('corazza-di-piastre')] }));
    expect(d.ac.total).toBe(10 + 3 + 6);
    expect(d.ac.applied).toContainEqual({ source: 'Limite Des (Corazza di Piastre)', value: -1 });
    expect(d.cmd.total).toBe(free.cmd.total - 1);
    expect(d.saves.ref.total).toBe(free.saves.ref.total);
    expect(d.initiative.total).toBe(free.initiative.total);
  });
});

describe('armor check penalty', () => {
  it('sums armor and shield on the skills that have it', () => {
    const free = deriveStats(hero());
    const d = deriveStats(hero({ equipment: [worn('cotta-di-maglia'), worn('scudo-pesante-di-metallo')] }));
    expect(d.armorCheckPenalty).toBe(-7);
    expect(d.skills.acrobatics.total - free.skills.acrobatics.total).toBe(-7);
    expect(d.skills.climb.total - free.skills.climb.total).toBe(-7);
    expect(d.skills.diplomacy.total).toBe(free.skills.diplomacy.total);
    expect(d.attack.melee.total).toBe(free.attack.melee.total);
  });

  it('non-proficient armor also hits attacks and every Str/Dex skill', () => {
    const free = deriveStats(hero({ classId: 'wizard' }));
    const d = deriveStats(hero({ classId: 'wizard', equipment: [worn('cotta-di-maglia')] }));
    expect(d.attack.melee.total - free.attack.melee.total).toBe(-5);
    expect(d.attack.ranged.total - free.attack.ranged.total).toBe(-5);
    expect(d.skills.acrobatics.total - free.skills.acrobatics.total).toBe(-5);
    expect(d.skills.diplomacy.total).toBe(free.skills.diplomacy.total);
    expect(d.warnings.some(w => w.includes('non competente'))).toBe(true);
  });
});

describe('warnings', () => {
  it('arcane spell failure for a wizard', () => {
    const d = deriveStats(hero({ classId: 'wizard', equipment: [worn('armatura-di-cuoio')] }));
    expect(d.arcaneSpellFailure).toBe(10);
    expect(d.warnings).toContain('Fallimento incantesimi arcani 10% (incantesimi con componenti somatiche).');
  });

  it('no arcane warning for a fighter', () => {
    expect(deriveStats(hero({ equipment: [worn('armatura-di-cuoio')] })).warnings).toEqual([]);
  });

  it('druid in metal armor', () => {
    const d = deriveStats(hero({ classId: 'druid', equipment: [worn('cotta-di-maglia')] }));
    expect(d.warnings.some(w => w.includes('druido perde'))).toBe(true);
    expect(deriveStats(hero({ classId: 'druid', equipment: [worn('armatura-di-pelle')] })).warnings).toEqual([]);
  });

  it('tower shield without proficiency', () => {
    const d = deriveStats(hero({ classId: 'paladin', equipment: [worn('scudo-torre')] }));
    expect(d.warnings.some(w => w.includes('scudi torre'))).toBe(true);
  });
});

describe('speed', () => {
  it('human in heavy armor goes from 9 m to 6 m', () => {
    expect(deriveStats(hero()).speed.total).toBe(9);
    const d = deriveStats(hero({ equipment: [worn('armatura-completa')] }));
    expect(d.speed.total).toBe(6);
    expect(d.speed.applied[0].source).toBe('Armatura Completa');
  });

  it('dwarf keeps 6 m', () => {
    expect(deriveStats(hero({ race: 'dwarf', equipment: [worn('armatura-completa')] })).speed.total).toBe(6);
  });

  it('halfling in medium armor goes from 6 m to 4.5 m', () => {
    expect(deriveStats(hero({ race: 'halfling', equipment: [worn('cotta-di-maglia')] })).speed.total).toBe(4.5);
  });
});

describe('weapon attacks', () => {
  it('two-handed greatsword: 2d6 + 4 with Strength +3', () => {
    const sword = carried('spadone');
    const atk = attackFromItem(sword);
    const r = deriveStats(hero({ equipment: [sword], weaponAttacks: [atk] })).weaponAttack(atk);
    expect(r.attack).toMatchObject({ damageDiceCount: 2, damageDieType: 6, twoHanded: true });
    expect(r.damage.total).toBe(4);
    expect(r.toHit.total).toBe(5 + 3);
    expect([r.critRange, r.critMult]).toEqual([19, 2]);
    expect(r.proficient).toBe(true);
  });

  it('Strength penalty is not multiplied', () => {
    const sword = carried('spadone');
    const atk = attackFromItem(sword);
    expect(deriveStats(hero({ str: 8, equipment: [sword] })).weaponAttack(atk).damage.total).toBe(-1);
  });

  it('wizard with a longsword takes −4', () => {
    const sword = carried('spada-lunga');
    const atk = attackFromItem(sword);
    const r = deriveStats(hero({ classId: 'wizard', level: 1, equipment: [sword] })).weaponAttack(atk);
    expect(r.proficient).toBe(false);
    expect(r.toHit.total).toBe(0 + 3 - 4);
    expect(r.toHit.applied).toContainEqual({ source: 'Non competente', value: -4 });
  });

  it('linked attack follows the item and survives its removal', () => {
    const sword = carried('spada-lunga');
    const atk = attackFromItem(sword);
    const edited = { ...sword, name: 'Lama del nonno', weapon: { ...sword.weapon!, damage: { small: null, medium: { count: 2, die: 4 } } } };
    let char = hero({ equipment: [edited], weaponAttacks: [atk] });
    const r = deriveStats(char).weaponAttack(atk);
    expect(r.attack).toMatchObject({ name: 'Lama del nonno', damageDiceCount: 2, damageDieType: 4 });
    expect(r.linked).toBe(true);
    char = { ...char, ...removeItem(char, sword.id) } as Character;
    const after = deriveStats(char).weaponAttack(char.weaponAttacks[0]);
    expect(after.linked).toBe(false);
    expect(after.proficient).toBe(true);
  });
});
