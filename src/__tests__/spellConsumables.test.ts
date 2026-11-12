/// <reference types="node" />
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Character, EquipmentItem, SpellDefinition } from '../types';
import { EFFECT_PRESETS, getEffectPreset, presetModifiersAt } from '../data/effectPresets';
import { SPELL_EFFECT_LINKS } from '../data/spellEffectLinks';
import { deriveStats } from '../utils/derivedStats';
import {
  availableLists, createSpellItem, minCasterLevel, refreshSpellItem, remaining, spellItemDc, spellItemPrice,
  undoConsumable, useConsumable, usability, usabilityLabel,
} from '../utils/spellConsumables';

const spells = (JSON.parse(readFileSync(join(__dirname, '../../public/data/spells.json'), 'utf-8')) as { spells: SpellDefinition[] }).spells;
const spellById = new Map(spells.map(s => [s.id, s]));
const spell = (id: string) => {
  const s = spellById.get(id);
  if (!s) throw new Error(`missing spell ${id}`);
  return s;
};

function hero(classId = 'wizard', level = 5, equipment: EquipmentItem[] = []): Character {
  return {
    id: 'c', name: 'T', race: 'human', alignment: 'NG',
    baseAbilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }, abilityIncreases: [],
    classes: [{ classId, level, favoredClassBonus: [] }], totalLevel: level,
    hitPointsRolled: [], currentHp: 10, tempHp: 0, nonLethalDamage: 0,
    skills: [], feats: [], traits: [], knownSpells: [], preparedSpells: [], spellSlots: [],
    weaponAttacks: [], equipment, copper: 0, silver: 0, gold: 0, platinum: 0, experience: 0, notes: '',
  } as Character;
}
const asItem = (input: ReturnType<typeof createSpellItem>, id = 'i1'): EquipmentItem => ({ ...input, id });
const apply = (c: Character, patch: Partial<Character>) => ({ ...c, ...patch }) as Character;

describe('presets at a caster level', () => {
  const at = (id: string, cl: number) => presetModifiersAt(getEffectPreset(id)!, cl);
  it('Scudo della fede scales', () => {
    expect(at('scudo-della-fede', 1)[0].value).toBe(2);
    expect(at('scudo-della-fede', 6)[0].value).toBe(3);
    expect(at('scudo-della-fede', 30)[0].value).toBe(5);
  });
  it('Pelle coriacea scales', () => {
    expect(at('pelle-coriacea', 3)[0].value).toBe(2);
    expect(at('pelle-coriacea', 12)[0].value).toBe(5);
  });
  it('presets without scaling are unchanged', () => {
    expect(at('forza-del-toro', 9)).toEqual(getEffectPreset('forza-del-toro')!.modifiers);
  });
});

describe('spell to preset links', () => {
  it('every link points at an existing spell and preset', () => {
    Object.entries(SPELL_EFFECT_LINKS).forEach(([spellId, presetId]) => {
      expect(spellById.has(spellId), spellId).toBe(true);
      expect(EFFECT_PRESETS.some(p => p.id === presetId), presetId).toBe(true);
    });
  });
  it('links Benedizione, Anatema, Lentezza and Scudo', () => {
    ['benedizione', 'anatema', 'lentezza', 'scudo'].forEach(id => expect(SPELL_EFFECT_LINKS[id]).toBe(id));
    expect(spell('scudo').levels.wizard).toBe(1);
  });
  it('does not link the Ira spell to the barbarian rage', () => {
    expect(SPELL_EFFECT_LINKS.ira).toBeUndefined();
  });
});

describe('spell database', () => {
  it('has the base spells that used to be only mythic', () => {
    expect(spell('dardo_incantato').levels.wizard).toBe(1);
    expect(spell('palla_di_fuoco').levels.wizard).toBe(3);
    expect(spell('guarigione').levels.cleric).toBe(6);
    expect(spell('sonno').levels.wizard).toBe(1);
    expect(spells.length).toBe(new Set(spells.map(sp => sp.id)).size);
  });
  it('a scroll of Palla di Fuoco is priced at 25 × 3 × 5', () => {
    expect(createSpellItem(spell('palla_di_fuoco'), 'scroll', 'wizard', 3, 5, 1).priceGp).toBe(375);
  });
});

describe('creation and computed values', () => {
  it('prices, DC and names', () => {
    expect(spellItemPrice('potion', 1, 1)).toBe(50);
    expect(spellItemPrice('scroll', 3, 5)).toBe(375);
    expect(spellItemPrice('wand', 1, 1)).toBe(750);
    expect(spellItemPrice('scroll', 0, 1)).toBe(12.5);
    expect(spellItemDc(3)).toBe(14);
    const potion = createSpellItem(spell('cura_ferite_leggere'), 'potion', 'cleric', 1, 1, 3);
    expect(potion).toMatchObject({ name: 'Pozione di Cura Ferite Leggere (LI 1)', quantity: 3, kind: 'consumable', priceGp: 50 });
  });
  it('default caster level', () => {
    expect([0, 1, 2, 3, 4].map(minCasterLevel)).toEqual([1, 1, 3, 5, 7]);
    expect(createSpellItem(spell('armatura_magica'), 'scroll', 'wizard', 3, 1, 1).spellItem?.casterLevel).toBe(5);
  });
  it('wands hold at most 50 charges', () => {
    const wand = createSpellItem(spell('armatura_magica'), 'wand', 'wizard', 1, 1, 200);
    expect(wand.spellItem).toMatchObject({ charges: 50, maxCharges: 50 });
    expect(wand.quantity).toBe(1);
  });
  it('form limits exclude lists above the limit', () => {
    const s = { levels: { wizard: 4, cleric: 2 } };
    expect(availableLists(s, 'potion').map(l => l.classId)).toEqual(['cleric']);
    expect(availableLists({ levels: { wizard: 4 } }, 'potion')).toEqual([]);
    expect(() => createSpellItem({ id: 'x', name: 'X' }, 'potion', 'wizard', 4, 7, 1)).toThrow();
  });
  it('refresh recomputes name and price when the caster level changes', () => {
    const item = createSpellItem(spell('armatura_magica'), 'scroll', 'wizard', 1, 1, 1);
    const next = refreshSpellItem(item, { casterLevel: 4 });
    expect(next).toMatchObject({ name: 'Pergamena di Armatura Magica (LI 4)', priceGp: 100 });
  });
});

describe('usability', () => {
  const scroll = (cl = 1) => asItem(createSpellItem(spell('armatura_magica'), 'scroll', 'wizard', 1, cl, 1));
  it('a wizard reads a wizard scroll', () => {
    expect(usability(hero('wizard'), scroll())).toEqual({ ok: true });
  });
  it('a fighter needs Utilizzare Congegni Magici for a wand', () => {
    const wand = asItem(createSpellItem(spell('cura_ferite_leggere'), 'wand', 'cleric', 1, 1, 10));
    const u = usability(hero('fighter'), wand);
    expect(u).toEqual({ ok: false, check: 'umd', dc: 20 });
    expect(usabilityLabel(u)).toBe('Utilizzare Congegni Magici CD 20');
  });
  it('a scroll of another list adds the caster level to the DC', () => {
    expect(usability(hero('fighter'), scroll(5))).toEqual({ ok: false, check: 'umd', dc: 25 });
  });
  it('a scroll above the character level asks for a caster level check', () => {
    expect(usability(hero('wizard', 1), scroll(5))).toEqual({ ok: true, check: 'casterLevel', dc: 6 });
  });
  it('potions are always usable', () => {
    const potion = asItem(createSpellItem(spell('cura_ferite_leggere'), 'potion', 'cleric', 1, 1, 1));
    expect(usability(hero('fighter'), potion)).toEqual({ ok: true });
  });
  it('custom classes count through their source list', () => {
    const custom = { id: 'x', spellcasting: { enabled: true, sourceList: 'wizard' } } as never;
    expect(usability(hero('x'), scroll(), [custom])).toEqual({ ok: true });
  });
});

describe('using consumables', () => {
  const potion = (n: number, id = 'sof') => asItem(createSpellItem(spell('scudo_della_fede'), 'potion', 'cleric', 1, 6, n), id);

  it('drinks one of three, removes the last, keeps the order', () => {
    let c = hero('cleric', 5, [potion(3)]);
    c = apply(c, useConsumable(c, 'sof')!.patch);
    expect(c.equipment[0].quantity).toBe(2);
    c = apply(c, useConsumable(c, 'sof')!.patch);
    c = apply(c, useConsumable(c, 'sof')!.patch);
    expect(c.equipment).toHaveLength(0);
    expect(useConsumable(c, 'sof')).toBeNull();
  });

  it('a wand keeps its empty state at 0 charges', () => {
    const wand = asItem(createSpellItem(spell('cura_ferite_leggere'), 'wand', 'cleric', 1, 1, 1), 'w');
    let c = hero('cleric', 5, [wand]);
    c = apply(c, useConsumable(c, 'w')!.patch);
    expect(c.equipment[0].spellItem?.charges).toBe(0);
    expect(remaining(c.equipment[0])).toBe(0);
    expect(useConsumable(c, 'w')).toBeNull();
  });

  it('Scudo della fede at caster level 6 grants +3 deflection', () => {
    const c0 = hero('cleric', 5, [potion(1)]);
    const base = deriveStats(c0).ac.total;
    const used = useConsumable(c0, 'sof')!;
    const c1 = apply(c0, used.patch);
    expect(c1.effects?.[0]).toMatchObject({ name: 'Scudo della Fede (LI 6)', presetId: 'scudo-della-fede' });
    expect(deriveStats(c1).ac.total).toBe(base + 3);
  });

  it('a spell without a preset changes only the quantity', () => {
    const cure = asItem(createSpellItem(spell('cura_ferite_leggere'), 'potion', 'cleric', 1, 1, 2), 'c');
    const c0 = hero('cleric', 5, [cure]);
    const used = useConsumable(c0, 'c')!;
    expect(used.patch.effects).toBeUndefined();
    expect(used.undo.effectId).toBeUndefined();
  });

  it('undo restores the dose, the position and removes the effect', () => {
    const other: EquipmentItem = { id: 'o', name: 'Corda', quantity: 1, notes: '', equipped: false };
    const c0 = hero('cleric', 5, [potion(1), other]);
    const used = useConsumable(c0, 'sof')!;
    const c1 = apply(c0, used.patch);
    expect(c1.equipment.map(i => i.id)).toEqual(['o']);
    const c2 = apply(c1, undoConsumable(c1, used.undo));
    expect(c2.equipment.map(i => i.id)).toEqual(['sof', 'o']);
    expect(c2.equipment[0].quantity).toBe(1);
    expect(c2.effects).toHaveLength(0);
  });
});
