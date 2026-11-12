import { describe, it, expect } from 'vitest';
import type { BodySlot, Character, EquipmentItem } from '../types';
import { activeItems, inactiveItemIds, wornItems } from '../utils/activeItems';

const worn = (id: string, slot: BodySlot, equipped = true): EquipmentItem => ({
  id, name: id, quantity: 1, notes: '', equipped, kind: 'magic', slot,
});
const char = (equipment: EquipmentItem[]) => ({ equipment }) as unknown as Character;

describe('activeItems', () => {
  it('two rings are both active, the third is not', () => {
    const c = char([worn('r1', 'ring'), worn('r2', 'ring'), worn('r3', 'ring')]);
    expect(activeItems(c).map(i => i.id)).toEqual(['r1', 'r2']);
    expect([...inactiveItemIds(c)]).toEqual(['r3']);
  });

  it('one item per slot, in inventory order', () => {
    const c = char([worn('n1', 'neck'), worn('n2', 'neck'), worn('h1', 'head')]);
    expect(wornItems(c).map(w => [w.item.id, w.active])).toEqual([['n1', true], ['n2', false], ['h1', true]]);
  });

  it('items with no slot are always active when equipped', () => {
    const c = char([worn('a', 'none'), worn('b', 'none'), worn('c', 'none')]);
    expect(activeItems(c)).toHaveLength(3);
  });

  it('carried items are not worn', () => {
    const c = char([worn('c1', 'neck', false), worn('c2', 'neck')]);
    expect(activeItems(c).map(i => i.id)).toEqual(['c2']);
  });

  it('works without inventory', () => {
    expect(activeItems({} as Character)).toEqual([]);
  });
});
