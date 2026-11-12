/// <reference types="node" />
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

vi.mock('../lib/firebase', () => ({ auth: { currentUser: null }, db: {} }));
vi.mock('../lib/firestoreSync', () => ({ saveDataStore: vi.fn(), loadDataStore: vi.fn() }));

import type { Character, EquipmentItem, ItemDefinition } from '../types';
import { CLASSES } from '../data/classes';
import { RACES } from '../data/races';
import {
  armorFromText, classProficiencies, computeProficiencies, isProficientArmor, isProficientWeapon, weaponsFromText,
} from '../utils/proficiencies';
import { itemFromCatalog } from '../utils/inventory';

const catalogue = JSON.parse(readFileSync(join(__dirname, '../../public/data/items.json'), 'utf-8')) as { items: ItemDefinition[] };
const items = new Map(catalogue.items.map(i => [i.id, i]));
const weaponIds = new Set(catalogue.items.filter(i => i.kind === 'weapon').map(i => i.id));
const item = (id: string): EquipmentItem => itemFromCatalog(items.get(id)!);

const char = (over: Partial<Character>) => ({
  race: 'human', classes: [], feats: [], ...over,
}) as unknown as Character;
const cls = (classId: string, level = 1) => ({ classId, level, favoredClassBonus: [] });

describe('built-in data', () => {
  it('every class and race weapon id exists in the catalogue', () => {
    const ids = [
      ...CLASSES.flatMap(c => classProficiencies(c).weapons.weapons),
      ...RACES.flatMap(r => r.weaponFamiliarity ?? []),
    ];
    expect(ids.filter(id => !weaponIds.has(id))).toEqual([]);
  });

  it('Ladro', () => {
    const rogue = classProficiencies(CLASSES.find(c => c.id === 'rogue')!);
    expect(rogue.armor).toEqual(['light']);
    expect(rogue.weapons.groups).toEqual(['simple']);
    expect(rogue.weapons.weapons.sort()).toEqual(['arco-corto', 'arco-corto-composito', 'balestra-a-mano', 'manganello', 'spada-corta', 'stocco']);
  });
});

describe('computeProficiencies', () => {
  it('unions multiclass proficiencies', () => {
    const set = computeProficiencies(char({ classes: [cls('wizard'), cls('fighter')] }));
    expect([...set.armor.keys()].sort()).toEqual(['heavy', 'light', 'medium', 'shield', 'tower']);
    expect([...set.groups.keys()].sort()).toEqual(['martial', 'simple']);
  });

  it('elf weapon familiarity', () => {
    const set = computeProficiencies(char({ race: 'elf', classes: [cls('wizard')] }));
    for (const w of ['spada-lunga', 'stocco', 'arco-lungo', 'arco-corto']) expect(isProficientWeapon(set, item(w))).toBe(true);
    expect(isProficientWeapon(set, item('spadone'))).toBe(false);
  });

  it('exotic weapon feat with a choice', () => {
    const c = char({
      classes: [cls('fighter')], feats: ['competenza_nelle_armi_esotiche'],
      featChoices: [{ featId: 'competenza_nelle_armi_esotiche', index: 0, choice: 'catena-chiodata' }],
    });
    const set = computeProficiencies(c);
    expect(isProficientWeapon(set, item('catena-chiodata'))).toBe(true);
    expect(isProficientWeapon(set, item('spada-bastarda'))).toBe(false);
    expect(set.pendingChoices).toEqual([]);
  });

  it('feat without a choice is pending', () => {
    const set = computeProficiencies(char({ classes: [cls('wizard')], feats: ['competenza_nelle_armi_da_guerra', 'competenza_nelle_armi_da_guerra'] }));
    expect(set.pendingChoices.map(p => p.index)).toEqual([0, 1]);
  });

  it('armor feats, deity weapon and manual additions', () => {
    const set = computeProficiencies(char({
      classes: [cls('cleric')], feats: ['competenza_nelle_armature_pesanti'], deityWeaponId: 'spadone',
      extraProficiencies: { weapons: ['spada-bastarda'] },
    }));
    expect(isProficientArmor(set, items.get('armatura-completa')!.armor!)).toBe(true);
    expect(isProficientWeapon(set, item('spadone'))).toBe(true);
    expect(isProficientWeapon(set, item('spada-bastarda'))).toBe(true);
    expect(set.weapons.get('spada-bastarda')).toEqual(['Aggiunta manuale']);
  });

  it('tower shield needs its own proficiency', () => {
    const set = computeProficiencies(char({ classes: [cls('paladin')] }));
    expect(isProficientArmor(set, items.get('scudo-pesante-di-metallo')!.armor!)).toBe(true);
    expect(isProficientArmor(set, items.get('scudo-torre')!.armor!)).toBe(false);
  });

  it('custom items count as proficient unless flagged', () => {
    const set = computeProficiencies(char({ classes: [cls('wizard')] }));
    const custom = { ...item('spadone'), catalogId: undefined };
    expect(isProficientWeapon(set, custom)).toBe(true);
    expect(isProficientWeapon(set, { ...custom, nonProficient: true })).toBe(false);
  });
});

describe('legacy custom class text', () => {
  it('reads armor text', () => {
    expect(armorFromText(['Leggera', 'Scudi (non a torre)'])).toEqual(['light', 'shield']);
    expect(armorFromText(['Leggera', 'Media', 'Pesante', 'Scudi', 'Scudo a torre'])).toEqual(['light', 'medium', 'heavy', 'shield', 'tower']);
    expect(armorFromText(['Nessuna'])).toEqual([]);
  });
  it('reads weapon text and keeps it in the note', () => {
    expect(weaponsFromText('Semplici e Marziali', weaponIds)).toEqual({ groups: ['simple', 'martial'], weapons: [], note: 'Semplici e Marziali' });
    const w = weaponsFromText('Semplici + balestra a mano, stocco, spada corta', weaponIds);
    expect(w.groups).toEqual(['simple']);
    expect(w.weapons).toEqual(['balestra-a-mano', 'stocco', 'spada-corta']);
    expect(w.note).toContain('balestra a mano');
  });
});
