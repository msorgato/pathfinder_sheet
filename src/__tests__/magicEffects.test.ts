/// <reference types="node" />
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ItemDefinition } from '../types';
import { ITEM_EFFECT_PRESETS, presetModifiers } from '../data/magicItemEffects';
import { itemFromCatalog } from '../utils/inventory';

const catalogue = JSON.parse(readFileSync(join(__dirname, '../../public/data/items.json'), 'utf-8')) as { items: ItemDefinition[] };
const byId = new Map(catalogue.items.map(i => [i.id, i]));
const get = (id: string) => {
  const item = byId.get(id);
  if (!item) throw new Error(`missing catalogue entry ${id}`);
  return item;
};

describe('item effect presets', () => {
  it('every preset matches at least one catalogue entry', () => {
    const unused = ITEM_EFFECT_PRESETS.filter(p => !catalogue.items.some(i => p.pattern.test(i.id.replace(/^m-/, ''))));
    expect(unused.map(p => p.id)).toEqual([]);
  });

  it('Mantello della Resistenza +3 gives +3 resistance to all saves', () => {
    expect(presetModifiers('mantello-della-resistenza-3')).toEqual([
      { target: { kind: 'save', save: 'all' }, type: 'resistance', value: 3 },
    ]);
  });

  it('belts and headbands boost the right abilities', () => {
    const abilities = (id: string) => (presetModifiers(id) ?? []).map(m => (m.target.kind === 'ability' ? m.target.ability : '?'));
    expect(abilities('cintura-della-forza-del-gigante-4')).toEqual(['str']);
    expect(abilities('cintura-dell-agilita-2')).toEqual(['dex']);
    expect(abilities('cintura-del-vigore-6')).toEqual(['con']);
    expect(abilities('cintura-della-perfezione-fisica-4')).toEqual(['str', 'dex', 'con']);
    expect(abilities('fascia-della-sapienza-2')).toEqual(['int']);
    expect(abilities('fascia-dell-ispirazione-2')).toEqual(['wis']);
    expect(abilities('fascia-della-seduzione-4')).toEqual(['cha']);
    expect(abilities('fascia-della-superiorita-mentale-6')).toEqual(['int', 'wis', 'cha']);
  });

  it('AC items use their own bonus types', () => {
    expect(presetModifiers('anello-di-protezione-1')?.[0]).toMatchObject({ type: 'deflection', value: 1 });
    expect(presetModifiers('amuleto-dell-armatura-naturale-2')?.[0]).toMatchObject({ type: 'natural', value: 2 });
    expect(presetModifiers('bracciali-dell-armatura-3')?.[0]).toMatchObject({ type: 'armor', value: 3 });
  });

  it('items where the player chooses the abilities have no preset', () => {
    expect(presetModifiers('cintura-della-potenza-fisica-4')).toBeUndefined();
    expect(presetModifiers('fascia-della-prodezza-mentale-2')).toBeUndefined();
    expect(presetModifiers('spada-lunga')).toBeUndefined();
  });

  it('is copied into the inventory item together with the slot', () => {
    const cloak = itemFromCatalog(get('mantello-della-resistenza-3'));
    expect(cloak).toMatchObject({ kind: 'magic', slot: 'shoulders', priceGp: 9000 });
    expect(cloak.modifiers).toHaveLength(1);
    // a copy: editing it does not touch the preset
    cloak.modifiers![0].value = 9;
    expect(presetModifiers('mantello-della-resistenza-3')?.[0].value).toBe(3);
    expect(itemFromCatalog(get('spada-lunga')).modifiers).toBeUndefined();
  });
});
