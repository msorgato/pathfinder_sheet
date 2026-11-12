/// <reference types="node" />
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

vi.mock('../lib/firebase', () => ({ auth: { currentUser: null }, db: {} }));
vi.mock('../lib/firestoreSync', () => ({ saveDataStore: vi.fn(), loadDataStore: vi.fn() }));

import type { ItemDefinition } from '../types';
import { useDataStore, getCatalogItem } from '../store/dataStore';
import { parseCrit, parseDice, parsePrice, parseTables, slug } from '../../scripts/import-items';

const catalogue = JSON.parse(readFileSync(join(__dirname, '../../public/data/items.json'), 'utf-8')) as { items: ItemDefinition[] };
const byId = new Map(catalogue.items.map(i => [i.id, i]));
const get = (id: string) => {
  const item = byId.get(id);
  if (!item) throw new Error(`missing catalogue entry ${id}`);
  return item;
};

describe('item catalogue (public/data/items.json)', () => {
  it('has unique ids', () => {
    expect(byId.size).toBe(catalogue.items.length);
  });

  it('contains every category', () => {
    const kinds = new Set(catalogue.items.map(i => i.kind));
    expect([...kinds].sort()).toEqual(['ammo', 'armor', 'gear', 'shield', 'weapon']);
    const groups = new Set(catalogue.items.flatMap(i => (i.weapon ? [i.weapon.group] : [])));
    expect([...groups].sort()).toEqual(['exotic', 'martial', 'simple']);
  });

  it('Spada Lunga', () => {
    const w = get('spada-lunga');
    expect(w.weapon).toMatchObject({
      group: 'martial', handedness: 'one-handed', critRange: 19, critMult: 2, damageTypes: ['T'],
      damage: { small: { count: 1, die: 6 }, medium: { count: 1, die: 8 } },
    });
    expect(w.priceGp).toBe(15);
    expect(w.url).toContain('/wiki/Armi/Spada_Lunga');
  });

  it('Spadone and Arco Lungo', () => {
    expect(get('spadone').weapon).toMatchObject({ handedness: 'two-handed', damage: { medium: { count: 2, die: 6 } }, critRange: 19 });
    expect(get('arco-lungo').weapon).toMatchObject({ handedness: 'ranged', critMult: 3, rangeM: 30 });
  });

  it('Armatura Completa', () => {
    expect(get('armatura-completa').armor).toEqual({
      category: 'heavy', bonus: 9, maxDex: 1, checkPenalty: -6, arcaneFailure: 35, metal: true,
    });
  });

  it('Giaco di Maglia and Scudo Torre', () => {
    expect(get('giaco-di-maglia').armor).toMatchObject({ category: 'light', bonus: 4, maxDex: 4, checkPenalty: -2 });
    expect(get('scudo-torre')).toMatchObject({ kind: 'shield', armor: { category: 'tower', bonus: 4, maxDex: 2, checkPenalty: -10 } });
    expect(get('scudo-pesante-di-legno').armor).toMatchObject({ category: 'shield', maxDex: null, metal: false });
  });

  it('gear and ammunition', () => {
    expect(get('corda')).toMatchObject({ kind: 'gear' });
    expect(get('frecce')).toMatchObject({ kind: 'ammo', name: 'Frecce (20)', priceGp: 1 });
    expect(get('serratura-o-lucchetto-media')).toMatchObject({ priceGp: 40 });
  });
});

describe('import script parsers', () => {
  it('parses prices, dice and criticals', () => {
    expect(parsePrice('1.100 mo')).toBe(1100);
    expect(parsePrice('5 ma')).toBe(0.5);
    expect(parsePrice('—')).toBe(0);
    expect(parseDice('1d6/1d6')).toEqual({ count: 1, die: 6 });
    expect(parseDice('—')).toBeNull();
    expect(parseCrit('18–20/x2')).toEqual({ critRange: 18, critMult: 2 });
    expect(parseCrit('x3')).toEqual({ critRange: 20, critMult: 3 });
  });

  it('builds stable slugs', () => {
    expect(slug("Colpo Senz'Armi")).toBe('colpo-senz-armi');
    expect(slug('Bastone dell’Autorità')).toBe('bastone-dell-autorita');
  });

  it('expands rowspans', () => {
    const rows = parseTables('{|\n|-\n| rowspan="2" | A\n| 1\n|-\n| 2\n|}')[0];
    expect(rows.map(r => r.map(c => c.text))).toEqual([['A', '1'], ['A', '2']]);
  });
});

describe('data store', () => {
  it('loads the catalogue with the built-in data', async () => {
    const files: Record<string, unknown> = {
      '/data/spells.json': { spells: [] },
      '/data/feats.json': { feats: [] },
      '/data/items.json': catalogue,
    };
    vi.stubGlobal('fetch', vi.fn(async (url: string) => ({ json: async () => files[url] })));
    await useDataStore.getState().loadBuiltinData();
    expect(useDataStore.getState().builtinItems.length).toBe(catalogue.items.length);
    expect(getCatalogItem('spada-lunga')?.name).toBe('Spada Lunga');
    vi.unstubAllGlobals();
  });
});
