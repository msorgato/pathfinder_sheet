/// <reference types="node" />
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Character, EquipmentItem, ItemDefinition } from '../types';
import { deriveStats } from '../utils/derivedStats';
import { attackFromItem, itemFromCatalog } from '../utils/inventory';
import { getEffectPreset } from '../data/effectPresets';

const catalogue = JSON.parse(readFileSync(join(__dirname, '../../public/data/items.json'), 'utf-8')) as { items: ItemDefinition[] };
const defs = new Map(catalogue.items.map(i => [i.id, i]));
function make(id: string, over: Partial<EquipmentItem> = {}, itemId = id): EquipmentItem {
  const def = defs.get(id);
  if (!def) throw new Error(`missing catalogue entry ${id}`);
  return { ...itemFromCatalog(def), id: itemId, ...over };
}
const worn = (id: string, over: Partial<EquipmentItem> = {}, itemId = id) => make(id, { equipped: true, ...over }, itemId);

function hero(over: Partial<Character> & { dex?: number; str?: number; classId?: string } = {}): Character {
  const { dex = 10, str = 14, classId = 'fighter', ...rest } = over;
  return {
    id: 'c', name: 'T', race: 'human', alignment: 'NG',
    baseAbilityScores: { str, dex, con: 12, int: 10, wis: 10, cha: 10 }, abilityIncreases: [],
    classes: [{ classId, level: 5, favoredClassBonus: [] }], totalLevel: 5,
    hitPointsRolled: [], currentHp: 10, tempHp: 0, nonLethalDamage: 0,
    skills: [], feats: [], traits: [], knownSpells: [], preparedSpells: [], spellSlots: [],
    weaponAttacks: [], equipment: [], copper: 0, silver: 0, gold: 0, platinum: 0, experience: 0, notes: '',
    ...rest,
  } as Character;
}

describe('worn magic items', () => {
  it('cloak of resistance +2 raises every save; carried it does nothing', () => {
    const free = deriveStats(hero());
    const d = deriveStats(hero({ equipment: [worn('mantello-della-resistenza-2')] }));
    for (const s of ['fort', 'ref', 'will'] as const) {
      expect(d.saves[s].total - free.saves[s].total).toBe(2);
      expect(d.saves[s].applied).toContainEqual({ source: 'Mantello della Resistenza +2', type: 'resistance', value: 2 });
    }
    const carried = deriveStats(hero({ equipment: [make('mantello-della-resistenza-2')] }));
    expect(carried.saves.fort.total).toBe(free.saves.fort.total);
  });

  it('does not stack with Resistenza (same type)', () => {
    const p = getEffectPreset('resistenza')!;
    const d = deriveStats(hero({
      equipment: [worn('mantello-della-resistenza-2')], effects: [{ id: 'e', name: p.name, modifiers: p.modifiers }],
    }));
    const free = deriveStats(hero());
    expect(d.saves.will.total - free.saves.will.total).toBe(2);
    expect(d.saves.will.suppressed).toHaveLength(1);
  });

  it('belt of giant strength +4: Str 14 → 18, attack and damage up by 2', () => {
    const free = deriveStats(hero());
    const d = deriveStats(hero({ equipment: [worn('cintura-della-forza-del-gigante-4')] }));
    expect(d.scores.str).toBe(18);
    expect(d.attack.melee.total - free.attack.melee.total).toBe(2);
    expect(d.cmb.total - free.cmb.total).toBe(2);
  });

  it('belt and Forza del toro do not stack', () => {
    const p = getEffectPreset('forza-del-toro')!;
    const d = deriveStats(hero({
      equipment: [worn('cintura-della-forza-del-gigante-4')], effects: [{ id: 'e', name: p.name, modifiers: p.modifiers }],
    }));
    expect(d.scores.str).toBe(18);
    expect(d.abilityStats.str.suppressed).toHaveLength(1);
  });

  it('bracers +2 do not stack with a worn chain shirt', () => {
    const free = deriveStats(hero());
    const d = deriveStats(hero({ equipment: [worn('bracciali-dell-armatura-2'), worn('giaco-di-maglia')] }));
    expect(d.ac.total - free.ac.total).toBe(4);
    expect(d.ac.suppressed).toHaveLength(1);
  });

  it('two rings of protection are both active', () => {
    const ring = (id: string, n: number) => worn('anello-di-protezione-1', {
      modifiers: [{ target: { kind: 'ac' }, type: 'deflection', value: n }],
    }, id);
    const free = deriveStats(hero());
    const d = deriveStats(hero({ equipment: [ring('r1', 1), ring('r2', 2)] }));
    expect(d.ac.total - free.ac.total).toBe(2);
    expect(d.ac.suppressed).toHaveLength(1);
  });

  it('a third ring is inactive and its modifiers do not apply', () => {
    const ring = (id: string, n: number) => worn('anello-di-protezione-1', {
      modifiers: [{ target: { kind: 'ac' }, type: 'untyped', value: n }],
    }, id);
    const free = deriveStats(hero());
    const d = deriveStats(hero({ equipment: [ring('r1', 1), ring('r2', 1), ring('r3', 10)] }));
    expect(d.ac.total - free.ac.total).toBe(2);
  });

  it('items without a preset have no modifiers', () => {
    const free = deriveStats(hero());
    const d = deriveStats(hero({ equipment: [worn('anello-della-caduta-morbida')] }));
    expect(d.ac.total).toBe(free.ac.total);
    expect(d.saves.fort.total).toBe(free.saves.fort.total);
  });

  it('modifiers added by hand to any item apply when it is worn', () => {
    const boots = worn('corda', { slot: 'feet', modifiers: [{ target: { kind: 'skill', skillId: 'acrobatics' }, type: 'competence', value: 3 }] });
    const free = deriveStats(hero());
    expect(deriveStats(hero({ equipment: [boots] })).skills.acrobatics.total - free.skills.acrobatics.total).toBe(3);
  });
});

describe('enhanced armor and shields', () => {
  it('heavy wooden shield +2 gives +4 to AC', () => {
    const free = deriveStats(hero());
    const d = deriveStats(hero({ equipment: [worn('scudo-pesante-di-legno', { enhancement: 2 })] }));
    expect(d.ac.total - free.ac.total).toBe(4);
    expect(d.ac.applied).toContainEqual({ source: 'Scudo Pesante di Legno +2', type: 'shield', value: 4 });
  });

  it('chainmail +1: +7 armor and a check penalty of −4', () => {
    const d = deriveStats(hero({ equipment: [worn('cotta-di-maglia', { enhancement: 1 })] }));
    expect(d.ac.applied.find(e => e.type === 'armor')?.value).toBe(7);
    expect(d.armorCheckPenalty).toBe(-4);
  });

  it('mithral chain shirt: Dex cap +6 and no check penalty', () => {
    const d = deriveStats(hero({ dex: 18, equipment: [worn('giaco-di-maglia', { material: 'mithral' })] }));
    expect(d.armorCheckPenalty).toBe(0);
    expect(d.ac.applied.some(e => e.source.startsWith('Limite Des'))).toBe(false); // Dex +4 under the cap of +6
    expect(d.ac.total).toBe(10 + 4 + 4);
  });

  it('mithral breastplate keeps a human at 9 m but still needs medium armor proficiency', () => {
    expect(deriveStats(hero({ equipment: [worn('corazza-di-piastre', { material: 'mithral' })] })).speed.total).toBe(9);
    expect(deriveStats(hero({ equipment: [worn('corazza-di-piastre')] })).speed.total).toBe(6);
    const wizard = deriveStats(hero({ classId: 'wizard', equipment: [worn('corazza-di-piastre', { material: 'mithral' })] }));
    expect(wizard.warnings.some(w => w.includes('non competente'))).toBe(true);
  });

  it('shadow armor: +5 competence to Furtività named after the armor', () => {
    const free = deriveStats(hero());
    const d = deriveStats(hero({ equipment: [worn('giaco-di-maglia', { enhancement: 1, abilities: ['ombra'] })] }));
    const stealth = d.skills.stealth;
    expect(stealth.applied).toContainEqual({ source: 'Giaco di Maglia +1 Ombra', type: 'competence', value: 5 });
    expect(stealth.total - free.skills.stealth.total).toBe(5 - 1); // minus the armor check penalty (−2 +1 masterwork)
  });
});

describe('enhanced weapons', () => {
  const sword = (over: Partial<EquipmentItem> = {}) => make('spada-lunga', over, 'sword');
  const resolve = (item: EquipmentItem, ch: Parameters<typeof hero>[0] = {}) => {
    const atk = attackFromItem(item);
    const c = hero({ equipment: [item], weaponAttacks: [atk], ...ch });
    return deriveStats(c).weaponAttack(atk);
  };
  const base = resolve(sword());

  it('longsword +1: +1 to hit and +1 damage (1d8+3 with Str 16)', () => {
    const r = resolve(sword({ enhancement: 1 }), { str: 16 });
    const plain = resolve(sword(), { str: 16 });
    expect(r.toHit.total - plain.toHit.total).toBe(1);
    expect(r.damage.total - plain.damage.total).toBe(1);
    expect(r.damage.total).toBe(3 + 1);
    expect(r.attack.name).toBe('Spada Lunga +1');
  });

  it('masterwork longsword: +1 to hit and nothing on damage', () => {
    const r = resolve(sword({ masterwork: true }));
    expect(r.toHit.total - base.toHit.total).toBe(1);
    expect(r.damage.total).toBe(base.damage.total);
  });

  it('enhancement and masterwork do not add up', () => {
    const r = resolve(sword({ enhancement: 2, masterwork: true }));
    expect(r.toHit.total - base.toHit.total).toBe(2);
  });

  it('the bonus only applies to the linked attack', () => {
    const magic = sword({ enhancement: 2 });
    const a = attackFromItem(magic);
    const other = { ...attackFromItem(make('pugnale', {}, 'dagger')), id: 'other' };
    const d = deriveStats(hero({ equipment: [magic, make('pugnale', {}, 'dagger')], weaponAttacks: [a, other] }));
    const plainDagger = deriveStats(hero({ equipment: [make('pugnale', {}, 'dagger')], weaponAttacks: [other] })).weaponAttack(other);
    expect(d.weaponAttack(other).toHit.total).toBe(plainDagger.toHit.total);
  });

  it('flaming: an extra 1d6 fire roll', () => {
    const r = resolve(sword({ enhancement: 1, abilities: ['infuocata'] }));
    expect(r.extraDice).toEqual([{ count: 1, die: 6, label: 'fuoco' }]);
    expect(r.attack.name).toBe('Spada Lunga +1 Infuocata');
  });

  it('keen: threat range 17–20', () => {
    expect(resolve(sword({ enhancement: 1, abilities: ['affilata'] })).critRange).toBe(17);
    expect(base.critRange).toBe(19);
  });

  it('alchemical silver −1 damage, cold iron note', () => {
    const dagger = (over: Partial<EquipmentItem>) => make('pugnale', over, 'dagger');
    expect(resolve(dagger({ material: 'alchemical-silver' })).damage.total - resolve(dagger({})).damage.total).toBe(-1);
    expect(resolve(sword({ material: 'cold-iron' })).notes).toContain('Ferro freddo: supera la RD/ferro freddo');
  });

  it('enhancement competes with other enhancement bonuses instead of adding', () => {
    const magic = sword({ enhancement: 1 });
    const atk = attackFromItem(magic);
    const withEffect = deriveStats(hero({
      equipment: [magic], weaponAttacks: [atk],
      effects: [{ id: 'e', name: 'Arma magica', modifiers: [{ target: { kind: 'attack', scope: 'all' }, type: 'enhancement', value: 3 }] }],
    })).weaponAttack(atk);
    expect(withEffect.toHit.total - base.toHit.total).toBe(3);
    expect(withEffect.toHit.suppressed).toHaveLength(1);
  });
});
