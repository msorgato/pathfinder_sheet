import { describe, it, expect } from 'vitest';
import { MATERIALS, MATERIAL_IDS, materialCost, materialNote, materialsFor } from '../data/materials';
import { ITEM_ABILITIES, abilitiesFor, getItemAbility } from '../data/itemAbilities';

describe('materials', () => {
  it('mithral, adamantine and darkwood are masterwork; cold iron and silver are not', () => {
    const masterwork = MATERIAL_IDS.filter(id => MATERIALS[id].masterwork).sort();
    expect(masterwork).toEqual(['adamantine', 'darkwood', 'mithral']);
  });

  it('is offered only for what it can be made of', () => {
    expect(materialsFor('shield').map(m => m.id).sort()).toEqual(['darkwood', 'mithral']);
    expect(materialsFor('armor').map(m => m.id).sort()).toEqual(['adamantine', 'mithral']);
    expect(materialsFor('weapon')).toHaveLength(5);
  });

  it('costs match the source tables', () => {
    expect(materialCost('mithral', { target: 'armor', armorCategory: 'light', weightKg: 12.5 })).toBe(1000);
    expect(materialCost('mithral', { target: 'armor', armorCategory: 'medium', weightKg: 15 })).toBe(4000);
    expect(materialCost('mithral', { target: 'armor', armorCategory: 'heavy', weightKg: 25 })).toBe(9000);
    expect(materialCost('mithral', { target: 'shield', armorCategory: 'shield', weightKg: 3 })).toBe(1000);
    expect(materialCost('mithral', { target: 'weapon', weightKg: 2 })).toBe(2000);
    expect(materialCost('adamantine', { target: 'weapon', weightKg: 2 })).toBe(3000);
    expect(materialCost('adamantine', { target: 'armor', armorCategory: 'medium', weightKg: 15 })).toBe(10000);
    expect(materialCost('alchemical-silver', { target: 'weapon', handedness: 'light', weightKg: 1 })).toBe(20);
    expect(materialCost('alchemical-silver', { target: 'weapon', handedness: 'one-handed', weightKg: 2 })).toBe(90);
    expect(materialCost('alchemical-silver', { target: 'weapon', handedness: 'two-handed', weightKg: 4 })).toBe(180);
    expect(materialCost('darkwood', { target: 'shield', armorCategory: 'shield', weightKg: 5 })).toBe(100);
  });

  it('cold iron doubles the price and surcharges the first enhancement', () => {
    expect(MATERIALS['cold-iron']).toMatchObject({ doublesPrice: true, enhancementSurcharge: 2000 });
  });

  it('mithral armor: max Dex +2, ACP −3, ASF −10%, lighter for speed, half weight', () => {
    expect(MATERIALS.mithral).toMatchObject({
      maxDexBonus: 2, acpReduction: { armor: 3 }, arcaneFailureReduction: 10, lighterForSpeed: true, weightFactor: 0.5,
    });
  });

  it('notes depend on the item', () => {
    expect(materialNote('adamantine', 'armor', 'heavy')).toBe('Adamantio: RD 3/—');
    expect(materialNote('cold-iron', 'weapon')).toBe('Ferro freddo: supera la RD/ferro freddo');
    expect(materialNote('darkwood', 'shield')).toBeUndefined();
  });
});

describe('item abilities', () => {
  it('has unique ids', () => {
    expect(new Set(ITEM_ABILITIES.map(a => a.id)).size).toBe(ITEM_ABILITIES.length);
  });

  it('has either a bonus equivalent or a flat cost', () => {
    for (const a of ITEM_ABILITIES) {
      expect([a.id, a.bonus !== undefined, a.costGp !== undefined]).toEqual([a.id, a.bonus !== undefined, a.bonus === undefined]);
      expect(a.applies.length).toBeGreaterThan(0);
    }
  });

  it('key abilities match the source tables', () => {
    expect(getItemAbility('infuocata')).toMatchObject({ bonus: 1, extraDice: { count: 1, die: 6, label: 'fuoco' } });
    expect(getItemAbility('affilata')).toMatchObject({ bonus: 1, keen: true });
    expect(getItemAbility('velocita')?.bonus).toBe(3);
    expect(getItemAbility('ombra')).toMatchObject({ costGp: 3750 });
    expect(getItemAbility('ombra')?.modifiers?.[0]).toEqual({ target: { kind: 'skill', skillId: 'stealth' }, type: 'competence', value: 5 });
    expect(getItemAbility('fortificazione-moderata')?.bonus).toBe(3);
  });

  it('is filtered by what it applies to', () => {
    expect(abilitiesFor('melee').some(a => a.id === 'infuocata')).toBe(true);
    expect(abilitiesFor('ranged').some(a => a.id === 'affilata')).toBe(false);
    expect(abilitiesFor('armor').some(a => a.id === 'ombra')).toBe(true);
    expect(abilitiesFor('shield').some(a => a.id === 'ombra')).toBe(false);
    expect(abilitiesFor('shield').some(a => a.id === 'guardia')).toBe(true);
  });
});
