import type { ArmorCategory, ArmorStats, EquipmentItem, MaterialId, Modifier, WeaponStats } from '../types';
import { getItemAbility } from '../data/itemAbilities';
import type { AbilityTarget, ExtraDice, ItemAbility } from '../data/itemAbilities';
import { MATERIALS, materialCost, materialNote } from '../data/materials';
import type { MaterialTarget } from '../data/materials';

/** Masterwork, enhancement, special materials and abilities of weapons, armor and shields. */

export const MAX_ENHANCEMENT = 5;
/** Enhancement plus the bonus equivalents of the abilities can reach +10. */
export const MAX_TOTAL_BONUS = 10;

const MASTERWORK_COST = { weapon: 300, armor: 150 } as const;
const ENHANCEMENT_UNIT = { weapon: 2000, armor: 1000 } as const;

type Enhanceable = Pick<EquipmentItem, 'kind' | 'weapon' | 'armor' | 'masterwork' | 'enhancement' | 'material' | 'abilities'>;

export const materialTargetOf = (item: Pick<EquipmentItem, 'kind'>): MaterialTarget | null =>
  item.kind === 'weapon' ? 'weapon' : item.kind === 'armor' ? 'armor' : item.kind === 'shield' ? 'shield' : null;

export const abilityTargetOf = (item: Pick<EquipmentItem, 'kind' | 'weapon'>): AbilityTarget | null => {
  if (item.kind === 'weapon') return item.weapon?.handedness === 'ranged' ? 'ranged' : 'melee';
  if (item.kind === 'armor') return 'armor';
  if (item.kind === 'shield') return 'shield';
  return null;
};

export const enhancementOf = (item: Pick<EquipmentItem, 'enhancement'>) =>
  Math.max(0, Math.min(MAX_ENHANCEMENT, Math.floor(item.enhancement ?? 0)));

const abilitiesOf = (item: Pick<EquipmentItem, 'abilities'>): ItemAbility[] =>
  (item.abilities ?? []).flatMap(id => { const a = getItemAbility(id); return a ? [a] : []; });

/** Sum of the bonus equivalents of the item's abilities (flat-cost abilities count 0). */
export const abilityBonusTotal = (item: Pick<EquipmentItem, 'abilities'>) =>
  abilitiesOf(item).reduce((sum, a) => sum + (a.bonus ?? 0), 0);

/** Enhancement plus ability bonus equivalents. */
export const totalBonus = (item: Pick<EquipmentItem, 'enhancement' | 'abilities'>) => enhancementOf(item) + abilityBonusTotal(item);

/** Enhanced items are always masterwork; so are mithral, adamantine and darkwood. */
export function isMasterwork(item: Pick<EquipmentItem, 'masterwork' | 'enhancement' | 'material'>): boolean {
  return !!item.masterwork || enhancementOf(item) > 0 || (!!item.material && MATERIALS[item.material].masterwork);
}

/** Whether `ability` can be added to the item right now (needs an enhancement bonus, fits the +10 cap). */
export function canAddAbility(item: Enhanceable, ability: ItemAbility): boolean {
  const target = abilityTargetOf(item);
  return !!target && ability.applies.includes(target)
    && enhancementOf(item) > 0
    && !(item.abilities ?? []).includes(ability.id)
    && totalBonus(item) + (ability.bonus ?? 0) <= MAX_TOTAL_BONUS;
}

// ── Armor ────────────────────────────────────────────────────────────────────

export interface EffectiveArmor extends ArmorStats {
  /** Category used for speed (mithral counts as one lighter). Proficiency uses `category`. */
  speedCategory: ArmorCategory;
}

const LIGHTER: Record<ArmorCategory, ArmorCategory> = { light: 'light', medium: 'light', heavy: 'medium', shield: 'shield', tower: 'tower' };

/** Armor or shield statistics with enhancement, masterwork and material applied. Never stored. */
export function effectiveArmor(item: Enhanceable): EffectiveArmor | null {
  const base = item.armor;
  const target = materialTargetOf(item);
  if (!base || (target !== 'armor' && target !== 'shield')) return null;
  const mat = item.material ? MATERIALS[item.material] : undefined;
  // The material's reduction replaces (does not add to) the masterwork one.
  const reduction = Math.max(mat?.acpReduction?.[target] ?? 0, isMasterwork(item) ? 1 : 0);
  return {
    ...base,
    bonus: base.bonus + enhancementOf(item),
    maxDex: base.maxDex === null ? null : base.maxDex + (mat?.maxDexBonus ?? 0),
    checkPenalty: Math.min(0, base.checkPenalty + reduction),
    arcaneFailure: Math.max(0, base.arcaneFailure - (mat?.arcaneFailureReduction ?? 0)),
    speedCategory: mat?.lighterForSpeed ? LIGHTER[base.category] : base.category,
  };
}

/** Modifiers granted by the armor's or shield's special abilities. */
export function armorAbilityModifiers(item: Enhanceable): Modifier[] {
  return abilitiesOf(item).flatMap(a => a.modifiers ?? []);
}

// ── Weapons ──────────────────────────────────────────────────────────────────

export interface EffectiveWeapon {
  stats: WeaponStats;
  /** Bonus to attack rolls from enhancement or masterwork (they do not add up). */
  attackBonus: number;
  /** Enhancement bonus to damage. */
  damageBonus: number;
  /** Flat damage modifier from the material (alchemical silver −1). */
  materialDamage: number;
  extraDice: ExtraDice[];
  notes: string[];
}

/** Weapon statistics with enhancement, abilities and material applied. Never stored. */
export function effectiveWeapon(item: Enhanceable): EffectiveWeapon | null {
  const base = item.weapon;
  if (!base) return null;
  const abilities = abilitiesOf(item);
  const keen = abilities.some(a => a.keen);
  const critRange = keen ? 21 - 2 * (21 - base.critRange) : base.critRange;
  const mat = item.material ? MATERIALS[item.material] : undefined;
  const target = materialTargetOf(item) ?? 'weapon';
  const matNote = item.material ? materialNote(item.material, target) : undefined;
  return {
    stats: { ...base, critRange },
    attackBonus: Math.max(enhancementOf(item), isMasterwork(item) ? 1 : 0),
    damageBonus: enhancementOf(item),
    materialDamage: mat?.damageModifier ?? 0,
    extraDice: abilities.flatMap(a => (a.extraDice ? [a.extraDice] : [])),
    notes: [...(matNote ? [matNote] : []), ...abilities.flatMap(a => (a.note ? [a.note] : []))],
  };
}

// ── Price and weight ─────────────────────────────────────────────────────────

const round2 = (n: number) => Math.round(n * 100) / 100;

/** List price from the price of the plain item, following the PF1 rules. Undefined for items that cannot be enhanced. */
export function computedPrice(item: Enhanceable & Pick<EquipmentItem, 'basePriceGp' | 'priceGp' | 'weightKg'>): number | undefined {
  const target = materialTargetOf(item);
  if (!target) return undefined;
  const kind = target === 'weapon' ? 'weapon' : 'armor';
  const mat = item.material ? MATERIALS[item.material] : undefined;
  const bonus = totalBonus(item);
  let price = item.basePriceGp ?? item.priceGp ?? 0;

  if (mat?.doublesPrice) price *= 2;
  if (isMasterwork(item) && !mat?.masterwork) price += MASTERWORK_COST[kind];
  if (item.material) {
    const original = (item.weightKg ?? 0) / (mat?.weightFactor || 1);
    price += materialCost(item.material, {
      target,
      armorCategory: item.armor?.category,
      handedness: item.weapon?.handedness,
      weightKg: original,
    });
  }
  if (bonus > 0) {
    price += bonus * bonus * ENHANCEMENT_UNIT[kind];
    price += mat?.enhancementSurcharge ?? 0;
  }
  price += abilitiesOf(item).reduce((sum, a) => sum + (a.costGp ?? 0), 0);
  return round2(price);
}

/**
 * Returns the item with its list price recomputed. The price of the plain item is remembered in
 * `basePriceGp` the first time the item gets magical properties, so later edits stay reversible.
 */
export function withComputedPrice<T extends Omit<EquipmentItem, 'id'>>(item: T): T {
  const hasMagic = !!item.masterwork || enhancementOf(item) > 0 || !!item.material || (item.abilities?.length ?? 0) > 0;
  if (!hasMagic) {
    // Back to a plain item: restore the remembered base price.
    if (item.basePriceGp === undefined) return item;
    const { basePriceGp, ...rest } = item;
    return { ...rest, priceGp: basePriceGp } as T;
  }
  const withBase = { ...item, basePriceGp: item.basePriceGp ?? item.priceGp ?? 0 };
  const price = computedPrice(withBase);
  return price === undefined ? item : { ...withBase, priceGp: price };
}

/** Changes the material and rescales the weight (mithral and darkwood weigh half). */
export function setMaterial<T extends Omit<EquipmentItem, 'id'>>(item: T, material: MaterialId | undefined): T {
  const oldFactor = item.material ? MATERIALS[item.material].weightFactor : 1;
  const newFactor = material ? MATERIALS[material].weightFactor : 1;
  const original = (item.weightKg ?? 0) / oldFactor;
  const next = { ...item, material, weightKg: round2(original * newFactor) } as T;
  if (!material) delete next.material;
  return next;
}

/** Name with enhancement, abilities and material, e.g. "Spada Lunga +1 Infuocata in Mithral". */
export function displayName(item: Pick<EquipmentItem, 'name' | 'enhancement' | 'abilities' | 'material'>): string {
  const enh = enhancementOf(item);
  const abilities = abilitiesOf(item).map(a => a.name);
  return [
    item.name,
    enh > 0 ? `+${enh}` : '',
    ...abilities,
    item.material ? `in ${MATERIALS[item.material].name}` : '',
  ].filter(Boolean).join(' ');
}

/** Short badges for the magical properties ("perfetta", "+1", "Mithral"…). */
export function magicBadges(item: Pick<EquipmentItem, 'masterwork' | 'enhancement' | 'material' | 'abilities'>): string[] {
  const enh = enhancementOf(item);
  return [
    enh > 0 ? `+${enh}` : isMasterwork(item) ? 'perfetto' : '',
    item.material ? MATERIALS[item.material].name : '',
    ...abilitiesOf(item).map(a => a.name),
  ].filter(Boolean);
}
