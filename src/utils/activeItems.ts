import type { BodySlot, Character } from '../types';
import { SLOT_CAPACITY } from '../data/itemLabels';
import { inventoryOf } from './inventory';

type Item = ReturnType<typeof inventoryOf>[number];

export interface WornItem {
  item: Item;
  /** False when the item sits beyond the capacity of its slot: it stays equipped but has no effect. */
  active: boolean;
}

export const slotCapacity = (slot: BodySlot) => SLOT_CAPACITY[slot] ?? 1;

/**
 * Equipped items in inventory order, flagged active or not. Each slot holds one active item
 * (two for rings); items with no slot are always active. The engine and the slot overview
 * both read this, so what the sheet shows and what the numbers use cannot diverge.
 */
export function wornItems(char: Character): WornItem[] {
  const used = new Map<BodySlot, number>();
  return inventoryOf(char).filter(i => i.equipped).map(item => {
    if (item.slot === 'none') return { item, active: true };
    const count = used.get(item.slot) ?? 0;
    used.set(item.slot, count + 1);
    return { item, active: count < slotCapacity(item.slot) };
  });
}

export const activeItems = (char: Character): Item[] => wornItems(char).filter(w => w.active).map(w => w.item);

/** Ids of equipped items that are inactive because their slot is full. */
export const inactiveItemIds = (char: Character): Set<string> =>
  new Set(wornItems(char).filter(w => !w.active).map(w => w.item.id));
