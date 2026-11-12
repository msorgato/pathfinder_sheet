/// <reference types="node" />
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { EquipmentItem, ItemDefinition } from '../types';
import { getItemAbility } from '../data/itemAbilities';
import {
  abilityBonusTotal, canAddAbility, computedPrice, displayName, effectiveArmor, effectiveWeapon, isMasterwork, magicBadges,
  setMaterial, withComputedPrice,
} from '../utils/itemEnhancements';
import { itemFromCatalog } from '../utils/inventory';

const catalogue = JSON.parse(readFileSync(join(__dirname, '../../public/data/items.json'), 'utf-8')) as { items: ItemDefinition[] };
const item = (id: string, over: Partial<EquipmentItem> = {}): EquipmentItem => {
  const def = catalogue.items.find(i => i.id === id);
  if (!def) throw new Error(`missing catalogue entry ${id}`);
  return { ...itemFromCatalog(def), ...over };
};
const plain = (id: string) => item(id);

describe('masterwork and enhancement', () => {
  it('enhancement and mithral imply masterwork; cold iron does not', () => {
    expect(isMasterwork(plain('spada-lunga'))).toBe(false);
    expect(isMasterwork(item('spada-lunga', { enhancement: 1 }))).toBe(true);
    expect(isMasterwork(item('giaco-di-maglia', { material: 'mithral' }))).toBe(true);
    expect(isMasterwork(item('spada-lunga', { material: 'cold-iron' }))).toBe(false);
  });

  it('masterwork weapon: +1 to hit and nothing on damage; enhancement does not stack with it', () => {
    expect(effectiveWeapon(item('spada-lunga', { masterwork: true }))).toMatchObject({ attackBonus: 1, damageBonus: 0 });
    expect(effectiveWeapon(item('spada-lunga', { masterwork: true, enhancement: 1 }))).toMatchObject({ attackBonus: 1, damageBonus: 1 });
    expect(effectiveWeapon(item('spada-lunga', { enhancement: 2 }))).toMatchObject({ attackBonus: 2, damageBonus: 2 });
  });

  it('chainmail +1: armor bonus +7 and check penalty −4', () => {
    const base = plain('cotta-di-maglia').armor!;
    expect(effectiveArmor(item('cotta-di-maglia', { enhancement: 1 }))).toMatchObject({ bonus: base.bonus + 1, checkPenalty: base.checkPenalty + 1 });
    expect(effectiveArmor(item('giaco-di-maglia', { enhancement: 1 }))?.bonus).toBe(5);
  });

  it('enhanced shield: heavy wooden shield +2 gives +4', () => {
    expect(effectiveArmor(item('scudo-pesante-di-legno', { enhancement: 2 }))?.bonus).toBe(4);
  });
});

describe('materials', () => {
  it('mithral chain shirt: Dex max +6, check penalty 0, arcane failure 10%', () => {
    expect(effectiveArmor(item('giaco-di-maglia', { material: 'mithral' }))).toMatchObject({ bonus: 4, maxDex: 6, checkPenalty: 0, arcaneFailure: 10 });
  });

  it('the material reduction replaces the masterwork one', () => {
    const base = plain('corazza-di-piastre').armor!;
    expect(effectiveArmor(item('corazza-di-piastre', { material: 'mithral' }))?.checkPenalty).toBe(base.checkPenalty + 3);
    expect(effectiveArmor(item('corazza-di-piastre', { material: 'mithral', enhancement: 1 }))?.checkPenalty).toBe(base.checkPenalty + 3);
  });

  it('mithral medium armor counts as light for speed but stays medium for proficiency', () => {
    const a = effectiveArmor(item('corazza-di-piastre', { material: 'mithral' }))!;
    expect(a.category).toBe('medium');
    expect(a.speedCategory).toBe('light');
    expect(effectiveArmor(item('armatura-completa', { material: 'mithral' }))?.speedCategory).toBe('medium');
  });

  it('darkwood shield: check penalty reduced by 2', () => {
    const base = plain('scudo-pesante-di-legno').armor!;
    expect(effectiveArmor(item('scudo-pesante-di-legno', { material: 'darkwood' }))?.checkPenalty).toBe(Math.min(0, base.checkPenalty + 2));
  });

  it('adamantine armor gets the masterwork reduction', () => {
    const base = plain('cotta-di-maglia').armor!;
    expect(effectiveArmor(item('cotta-di-maglia', { material: 'adamantine' }))?.checkPenalty).toBe(base.checkPenalty + 1);
  });

  it('alchemical silver weapons take −1 on damage, with a note on cold iron', () => {
    expect(effectiveWeapon(item('pugnale', { material: 'alchemical-silver' }))?.materialDamage).toBe(-1);
    expect(effectiveWeapon(item('spada-lunga', { material: 'cold-iron' }))?.notes).toContain('Ferro freddo: supera la RD/ferro freddo');
  });

  it('mithral and darkwood halve the weight and restore it when removed', () => {
    const shirt = plain('giaco-di-maglia');
    const mithral = setMaterial(shirt, 'mithral');
    expect(mithral.weightKg).toBe(shirt.weightKg! / 2);
    expect(setMaterial(mithral, undefined)).toMatchObject({ weightKg: shirt.weightKg });
    expect(setMaterial(mithral, undefined).material).toBeUndefined();
  });
});

describe('special abilities', () => {
  it('flaming adds 1d6 fire, keen widens the threat range', () => {
    const w = effectiveWeapon(item('spada-lunga', { enhancement: 1, abilities: ['infuocata'] }))!;
    expect(w.extraDice).toEqual([{ count: 1, die: 6, label: 'fuoco' }]);
    expect(effectiveWeapon(item('spada-lunga', { enhancement: 1, abilities: ['affilata'] }))?.stats.critRange).toBe(17);
    expect(effectiveWeapon(item('scimitarra', { enhancement: 1, abilities: ['affilata'] }))?.stats.critRange).toBe(15);
  });

  it('respects the +10 cap and needs an enhancement bonus', () => {
    const flaming = getItemAbility('infuocata')!;
    expect(canAddAbility(plain('spada-lunga'), flaming)).toBe(false);
    expect(canAddAbility(item('spada-lunga', { enhancement: 1 }), flaming)).toBe(true);
    const loaded = item('spada-lunga', { enhancement: 5, abilities: ['velocita', 'sacra'] }); // 5 + 3 + 2 = 10
    expect(abilityBonusTotal(loaded)).toBe(5);
    expect(canAddAbility(loaded, flaming)).toBe(false);
    expect(canAddAbility(item('spada-lunga', { enhancement: 1, abilities: ['infuocata'] }), flaming)).toBe(false);
  });

  it('only offers abilities that fit the item', () => {
    const ombra = getItemAbility('ombra')!;
    expect(canAddAbility(item('giaco-di-maglia', { enhancement: 1 }), ombra)).toBe(true);
    expect(canAddAbility(item('scudo-pesante-di-legno', { enhancement: 1 }), ombra)).toBe(false);
    expect(canAddAbility(item('spada-lunga', { enhancement: 1 }), ombra)).toBe(false);
    expect(canAddAbility(item('arco-lungo', { enhancement: 1 }), getItemAbility('affilata')!)).toBe(false);
  });
});

describe('computed price', () => {
  it('longsword +1: 2,315 mo', () => {
    expect(computedPrice({ ...item('spada-lunga', { enhancement: 1 }), basePriceGp: 15 })).toBe(2315);
  });

  it('flaming longsword +1: 8,315 mo', () => {
    expect(computedPrice({ ...item('spada-lunga', { enhancement: 1, abilities: ['infuocata'] }), basePriceGp: 15 })).toBe(8315);
  });

  it('mithral chain shirt: 1,100 mo (masterwork included)', () => {
    expect(computedPrice({ ...item('giaco-di-maglia', { material: 'mithral' }), basePriceGp: 100 })).toBe(1100);
  });

  it('cold iron longsword +1: 4,330 mo, surcharge only once', () => {
    expect(computedPrice({ ...item('spada-lunga', { material: 'cold-iron', enhancement: 1 }), basePriceGp: 15 })).toBe(4330);
    expect(computedPrice({ ...item('spada-lunga', { material: 'cold-iron', enhancement: 1, abilities: ['infuocata'] }), basePriceGp: 15 }))
      .toBe(30 + 300 + 4 * 2000 + 2000);
  });

  it('armor +1 costs 1,000 per squared bonus; flat-cost abilities add their price', () => {
    expect(computedPrice({ ...item('giaco-di-maglia', { enhancement: 1 }), basePriceGp: 100 })).toBe(100 + 150 + 1000);
    expect(computedPrice({ ...item('giaco-di-maglia', { enhancement: 1, abilities: ['ombra'] }), basePriceGp: 100 })).toBe(100 + 150 + 1000 + 3750);
  });

  it('withComputedPrice remembers the plain price and restores it', () => {
    const sword = plain('spada-lunga');
    const magic = withComputedPrice({ ...sword, enhancement: 1 });
    expect(magic).toMatchObject({ priceGp: 2315, basePriceGp: 15 });
    const upgraded = withComputedPrice({ ...magic, enhancement: 2 });
    expect(upgraded).toMatchObject({ priceGp: 15 + 300 + 8000, basePriceGp: 15 });
    const back = withComputedPrice({ ...upgraded, enhancement: 0 });
    expect(back.priceGp).toBe(15);
    expect(back.basePriceGp).toBeUndefined();
  });

  it('does not touch items that cannot be enhanced', () => {
    const rope = plain('corda');
    expect(withComputedPrice(rope)).toBe(rope);
  });
});

describe('names and badges', () => {
  it('shows enhancement, abilities and material', () => {
    expect(displayName({ name: 'Spada Lunga', enhancement: 1, abilities: ['infuocata'] })).toBe('Spada Lunga +1 Infuocata');
    expect(displayName({ name: 'Giaco di Maglia', material: 'mithral' })).toBe('Giaco di Maglia in Mithral');
    expect(displayName({ name: 'Spada Lunga' })).toBe('Spada Lunga');
    expect(magicBadges({ masterwork: true })).toEqual(['perfetto']);
    expect(magicBadges({ enhancement: 2, material: 'mithral' })).toEqual(['+2', 'Mithral']);
  });
});
