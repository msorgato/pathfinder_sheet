import type { BodySlot, Character, Dice, EquipmentItem, ItemDefinition, ItemKind, WeaponAttack } from '../types';

/** Pure state transitions for the inventory, coins and weapon-linked attacks. */

const newId = () =>
  (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

export type InventoryPatch = Pick<Partial<Character>, 'equipment' | 'weaponAttacks' | 'copper' | 'silver' | 'gold' | 'platinum'>;
export type CreatureSize = 'Small' | 'Medium' | 'Large';

// ── Normalization ────────────────────────────────────────────────────────────

const LEGACY_KIND: Record<NonNullable<EquipmentItem['type']>, ItemKind> = {
  weapon: 'weapon', armor: 'armor', gear: 'gear', magic: 'gear', wondrous: 'gear',
};

export function defaultSlot(kind: ItemKind): BodySlot {
  if (kind === 'armor') return 'armor';
  if (kind === 'shield') return 'shield';
  return 'none';
}

/** Reads any stored item (including the previous minimal format) as a complete item. */
export function normalizeItem(raw: EquipmentItem): EquipmentItem & { kind: ItemKind; slot: BodySlot; priceGp: number; weightKg: number } {
  const kind: ItemKind = raw.kind ?? (raw.type ? LEGACY_KIND[raw.type] : 'gear');
  return {
    ...raw,
    name: raw.name ?? 'Oggetto',
    quantity: Number.isFinite(raw.quantity) ? Math.max(0, raw.quantity) : 1,
    notes: raw.notes ?? '',
    equipped: !!raw.equipped,
    kind,
    slot: raw.slot ?? defaultSlot(kind),
    priceGp: raw.priceGp ?? raw.value ?? 0,
    weightKg: raw.weightKg ?? raw.weight ?? 0,
  };
}

export const inventoryOf = (char: Character) => (char.equipment ?? []).map(normalizeItem);

// ── Coins ────────────────────────────────────────────────────────────────────

type Coin = 'copper' | 'silver' | 'gold' | 'platinum';
const COINS: { key: Coin; cp: number }[] = [
  { key: 'copper', cp: 1 }, { key: 'silver', cp: 10 }, { key: 'gold', cp: 100 }, { key: 'platinum', cp: 1000 },
];

const coinCount = (char: Character, key: Coin) => Math.max(0, Math.floor(char[key] ?? 0));

/** Total value of the coins in copper pieces. */
export const totalCopper = (char: Character) => COINS.reduce((sum, c) => sum + coinCount(char, c.key) * c.cp, 0);

/** Gold pieces (decimal) → copper pieces, rounded to the nearest copper. */
export const gpToCopper = (gp: number) => Math.round(gp * 100);

/** "12 mo 5 ma" style label for an amount in copper pieces. */
export function formatCopper(cp: number): string {
  const parts: string[] = [];
  let rest = Math.max(0, Math.round(cp));
  for (const [cpv, label] of [[100, 'mo'], [10, 'ma'], [1, 'mr']] as const) {
    const n = Math.floor(rest / cpv);
    rest -= n * cpv;
    if (n) parts.push(`${n} ${label}`);
  }
  return parts.join(' ') || '0 mo';
}

export class InvalidPriceError extends Error {}

/**
 * Pays `priceCp` from the character's coins: smaller coins are spent first, and a
 * larger coin is broken only when needed, with change returned in smaller coins.
 * No denomination ever becomes negative. Throws on a negative, non-integer or
 * unaffordable price (the UI is expected to prevent these).
 */
export function payCoins(char: Character, priceCp: number): Pick<Character, Coin> {
  if (!Number.isInteger(priceCp) || priceCp < 0) throw new InvalidPriceError('Prezzo non valido');
  if (priceCp > totalCopper(char)) throw new InvalidPriceError('Monete insufficienti');
  const coins = Object.fromEntries(COINS.map(c => [c.key, coinCount(char, c.key)])) as Record<Coin, number>;
  let rest = priceCp;
  for (const c of COINS) {
    const take = Math.min(coins[c.key], Math.floor(rest / c.cp));
    coins[c.key] -= take;
    rest -= take * c.cp;
  }
  if (rest > 0) {
    // Every coin left is worth more than `rest`: break the smallest one.
    const breakIdx = COINS.findIndex(c => coins[c.key] > 0);
    coins[COINS[breakIdx].key] -= 1;
    let change = COINS[breakIdx].cp - rest;
    for (let i = breakIdx - 1; i >= 0; i--) {
      const n = Math.floor(change / COINS[i].cp);
      coins[COINS[i].key] += n;
      change -= n * COINS[i].cp;
    }
  }
  return coins;
}

// ── Items ────────────────────────────────────────────────────────────────────

/** A new inventory item copied from a catalogue entry. */
export function itemFromCatalog(def: ItemDefinition, quantity = 1): EquipmentItem {
  return {
    id: newId(),
    name: def.name,
    quantity: Math.max(1, Math.floor(quantity)),
    notes: '',
    equipped: false,
    catalogId: def.id,
    kind: def.kind,
    slot: defaultSlot(def.kind),
    priceGp: def.priceGp,
    weightKg: def.weightKg,
    ...(def.weapon ? { weapon: structuredClone(def.weapon) } : {}),
    ...(def.armor ? { armor: structuredClone(def.armor) } : {}),
  };
}

export type ItemInput = Omit<EquipmentItem, 'id'>;

/** Blank custom item. */
export const emptyItemInput = (): ItemInput => ({
  name: '', quantity: 1, notes: '', equipped: false, kind: 'gear', slot: 'none', priceGp: 0, weightKg: 0,
});

function cleanItem(input: ItemInput): ItemInput {
  return {
    ...input,
    name: input.name.trim() || 'Oggetto',
    notes: input.notes?.trim() ?? '',
    quantity: Math.max(0, Math.floor(input.quantity || 0)),
    priceGp: Math.max(0, input.priceGp ?? 0),
    weightKg: Math.max(0, input.weightKg ?? 0),
  };
}

export function addItem(char: Character, input: ItemInput): InventoryPatch {
  return { equipment: [...(char.equipment ?? []), { ...cleanItem(input), id: newId() }] };
}

/** Adds the item and pays `paidCp` (the price agreed at the table, not necessarily the list price). */
export function purchaseItem(char: Character, input: ItemInput, paidCp: number): InventoryPatch {
  return { ...payCoins(char, paidCp), ...addItem(char, input) };
}

/** Attack fields derived from a weapon, for the given wielder size. */
export function attackFieldsFromItem(item: EquipmentItem, size: CreatureSize = 'Medium'): Partial<WeaponAttack> {
  const w = item.weapon;
  if (!w) return { name: item.name };
  const dice: Dice = (size === 'Small' ? w.damage.small : w.damage.medium) ?? w.damage.medium ?? { count: 1, die: 1 };
  const ranged = w.handedness === 'ranged';
  return {
    name: item.name,
    damageDiceCount: dice.count,
    damageDieType: dice.die,
    critRange: w.critRange,
    critMult: w.critMult,
    attackType: ranged ? 'ranged' : 'melee',
    abilityKey: ranged ? 'dex' : 'str',
    twoHanded: w.handedness === 'two-handed',
  };
}

/** Creates an attack linked to an inventory weapon. */
export function attackFromItem(item: EquipmentItem, size: CreatureSize = 'Medium'): WeaponAttack {
  return {
    id: newId(), damageDiceCount: 1, damageDieType: 4, abilityKey: 'str', attackType: 'melee',
    ...attackFieldsFromItem(item, size),
    name: item.name,
    itemId: item.id,
  } as WeaponAttack;
}

/** Updates an item; linked attacks receive the new weapon data (kept as their last known stats). */
export function updateItem(char: Character, id: string, input: ItemInput, size: CreatureSize = 'Medium'): InventoryPatch {
  const updated = { ...cleanItem(input), id };
  const equipment = (char.equipment ?? []).map(i => (i.id === id ? updated : i));
  const linked = (char.weaponAttacks ?? []).some(a => a.itemId === id);
  return {
    equipment,
    ...(linked ? {
      weaponAttacks: char.weaponAttacks.map(a => (a.itemId === id ? { ...a, ...attackFieldsFromItem(updated, size) } : a)),
    } : {}),
  };
}

/** Removes an item; linked attacks stay, unlinked, with the item's last known stats. */
export function removeItem(char: Character, id: string): InventoryPatch {
  const linked = (char.weaponAttacks ?? []).some(a => a.itemId === id);
  return {
    equipment: (char.equipment ?? []).filter(i => i.id !== id),
    ...(linked ? {
      weaponAttacks: char.weaponAttacks.map(a => {
        if (a.itemId !== id) return a;
        const { itemId: _drop, ...rest } = a;
        void _drop;
        return rest;
      }),
    } : {}),
  };
}

export function setQuantity(char: Character, id: string, quantity: number): InventoryPatch {
  return {
    equipment: (char.equipment ?? []).map(i => (i.id === id ? { ...i, quantity: Math.max(0, Math.floor(quantity || 0)) } : i)),
  };
}

/** Toggles worn/carried. Only one armor and one shield can be worn: equipping one unequips the other. */
export function toggleEquipped(char: Character, id: string): InventoryPatch {
  const items = char.equipment ?? [];
  const target = items.find(i => i.id === id);
  if (!target) return {};
  const kind = normalizeItem(target).kind;
  const equipping = !target.equipped;
  const exclusive = equipping && (kind === 'armor' || kind === 'shield');
  return {
    equipment: items.map(i => {
      if (i.id === id) return { ...i, equipped: equipping };
      if (exclusive && i.equipped && normalizeItem(i).kind === kind) return { ...i, equipped: false };
      return i;
    }),
  };
}

// ── Weight ───────────────────────────────────────────────────────────────────

/** 50 coins weigh 0.5 kg. */
export const COIN_WEIGHT_KG = 0.01;

export function totalWeight(char: Character): { items: number; coins: number; total: number } {
  const items = inventoryOf(char).reduce((sum, i) => sum + i.weightKg * i.quantity, 0);
  const coins = COINS.reduce((sum, c) => sum + coinCount(char, c.key), 0) * COIN_WEIGHT_KG;
  const round = (n: number) => Math.round(n * 100) / 100;
  return { items: round(items), coins: round(coins), total: round(items + coins) };
}
