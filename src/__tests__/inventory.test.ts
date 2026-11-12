import { describe, it, expect } from 'vitest';
import type { Character, EquipmentItem, ItemDefinition } from '../types';
import {
  addItem, attackFromItem, formatCopper, InvalidPriceError, itemFromCatalog, normalizeItem, payCoins,
  purchaseItem, removeItem, setQuantity, toggleEquipped, totalCopper, totalWeight, updateItem,
} from '../utils/inventory';

const base = {
  id: 'c', name: 'T', race: 'human', alignment: 'NG',
  baseAbilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }, abilityIncreases: [],
  classes: [], totalLevel: 1, hitPointsRolled: [], currentHp: 1, tempHp: 0, nonLethalDamage: 0,
  skills: [], feats: [], traits: [], knownSpells: [], preparedSpells: [], spellSlots: [],
  weaponAttacks: [], equipment: [], copper: 0, silver: 0, gold: 0, platinum: 0, experience: 0, notes: '',
} as unknown as Character;
const make = (over: Partial<Character>) => ({ ...base, ...over }) as Character;

const LONGSWORD: ItemDefinition = {
  id: 'spada-lunga', name: 'Spada Lunga', kind: 'weapon', category: 'Armi da guerra a una mano', priceGp: 15, weightKg: 2, url: 'u',
  weapon: { group: 'martial', handedness: 'one-handed', damage: { small: { count: 1, die: 6 }, medium: { count: 1, die: 8 } },
    critRange: 19, critMult: 2, damageTypes: ['T'], special: [] },
};
const GREATSWORD: ItemDefinition = {
  ...LONGSWORD, id: 'spadone', name: 'Spadone', priceGp: 50, weightKg: 4,
  weapon: { ...LONGSWORD.weapon!, handedness: 'two-handed', damage: { small: { count: 1, die: 10 }, medium: { count: 2, die: 6 } } },
};
const armor = (id: string, kind: 'armor' | 'shield' = 'armor'): EquipmentItem => ({
  id, name: id, quantity: 1, notes: '', equipped: false, kind,
  armor: { category: kind === 'shield' ? 'shield' : 'light', bonus: 2, maxDex: null, checkPenalty: 0, arcaneFailure: 0, metal: false },
});

describe('normalizeItem', () => {
  it('reads the legacy format', () => {
    const legacy = { id: 'x', name: 'Corda', type: 'gear', weight: 5, value: 1, quantity: 1, notes: '', equipped: false } as EquipmentItem;
    expect(normalizeItem(legacy)).toMatchObject({ kind: 'gear', slot: 'none', weightKg: 5, priceGp: 1, equipped: false });
  });
  it('maps legacy magic items to gear and armor to the armor slot', () => {
    expect(normalizeItem({ id: 'm', name: 'M', type: 'wondrous', quantity: 1, notes: '', equipped: true } as EquipmentItem).kind).toBe('gear');
    expect(normalizeItem({ id: 'a', name: 'A', type: 'armor', quantity: 1, notes: '', equipped: true } as EquipmentItem).slot).toBe('armor');
  });
});

describe('coins', () => {
  it('pays with change (2 mp → 15 mo leaves 5 mo)', () => {
    const coins = payCoins(make({ platinum: 2 }), 1500);
    expect(coins).toEqual({ copper: 0, silver: 0, gold: 5, platinum: 0 });
    expect(totalCopper(make(coins))).toBe(500);
  });
  it('breaks the smallest larger coin only when needed', () => {
    const coins = payCoins(make({ gold: 1, platinum: 1 }), 10);
    expect(coins).toEqual({ copper: 0, silver: 9, gold: 0, platinum: 1 });
  });
  it('spends small coins first', () => {
    expect(payCoins(make({ copper: 50, silver: 5, gold: 2 }), 120)).toEqual({ copper: 0, silver: 8, gold: 1, platinum: 0 });
  });
  it('never goes below zero', () => {
    expect(() => payCoins(make({ gold: 12 }), 1500)).toThrow(InvalidPriceError);
    expect(() => payCoins(make({ gold: 12 }), -500)).toThrow(InvalidPriceError);
    expect(() => payCoins(make({ gold: 12 }), 1.5)).toThrow(InvalidPriceError);
    const c = payCoins(make({ copper: 3, silver: 1, gold: 1 }), 113);
    expect(Object.values(c).every(v => v >= 0)).toBe(true);
    expect(totalCopper(make(c))).toBe(0);
  });
  it('formats amounts', () => {
    expect(formatCopper(300)).toBe('3 mo');
    expect(formatCopper(1234)).toBe('12 mo 3 ma 4 mr');
  });
});

describe('inventory transitions', () => {
  it('adds a catalogue copy', () => {
    const p = addItem(base, itemFromCatalog(LONGSWORD));
    expect(p.equipment![0]).toMatchObject({ name: 'Spada Lunga', catalogId: 'spada-lunga', priceGp: 15, weapon: { critRange: 19 } });
  });

  it('purchase at a discounted price keeps the list price', () => {
    const char = make({ gold: 20 });
    const p = purchaseItem(char, itemFromCatalog(LONGSWORD), 1000);
    expect(p.gold).toBe(10);
    expect(p.equipment![0].priceGp).toBe(15);
  });

  it('refuses an unaffordable purchase', () => {
    expect(() => purchaseItem(make({ gold: 12 }), itemFromCatalog(LONGSWORD), 1500)).toThrow();
  });

  it('swaps armor and shields exclusively', () => {
    let char = make({ equipment: [armor('a1'), armor('a2'), armor('s1', 'shield')] });
    char = make({ ...char, ...toggleEquipped(char, 'a1') });
    char = make({ ...char, ...toggleEquipped(char, 's1') });
    char = make({ ...char, ...toggleEquipped(char, 'a2') });
    expect(char.equipment.map(i => [i.id, i.equipped])).toEqual([['a1', false], ['a2', true], ['s1', true]]);
  });

  it('linked attacks follow edits and survive removal', () => {
    const item = { ...itemFromCatalog(GREATSWORD), id: 'gs' };
    const atk = attackFromItem(item);
    expect(atk).toMatchObject({ itemId: 'gs', damageDiceCount: 2, damageDieType: 6, twoHanded: true, critRange: 19, attackType: 'melee' });
    let char = make({ equipment: [item], weaponAttacks: [atk] });
    char = make({ ...char, ...updateItem(char, 'gs', { ...item, name: 'Lama del nonno' }) });
    expect(char.weaponAttacks[0].name).toBe('Lama del nonno');
    char = make({ ...char, ...removeItem(char, 'gs') });
    expect(char.equipment).toEqual([]);
    expect(char.weaponAttacks[0]).toMatchObject({ name: 'Lama del nonno', damageDiceCount: 2 });
    expect(char.weaponAttacks[0].itemId).toBeUndefined();
  });

  it('uses small damage for small wielders', () => {
    expect(attackFromItem(itemFromCatalog(LONGSWORD), 'Small')).toMatchObject({ damageDiceCount: 1, damageDieType: 6 });
  });

  it('sets quantity and computes weight', () => {
    const arrows: EquipmentItem = { id: 'f', name: 'Frecce', quantity: 1, notes: '', equipped: false, kind: 'ammo', weightKg: 1.5 };
    let char = make({ equipment: [{ ...itemFromCatalog(LONGSWORD), id: 's' }, arrows], gold: 50 });
    char = make({ ...char, ...setQuantity(char, 'f', 2) });
    expect(totalWeight(char)).toEqual({ items: 5, coins: 0.5, total: 5.5 });
  });
});
