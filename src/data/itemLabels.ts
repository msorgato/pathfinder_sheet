import { modifierLabel } from './modifierLabels';
import { effectiveArmor, effectiveWeapon } from '../utils/itemEnhancements';
import type {
  ArmorCategory, BodySlot, DamageType, Dice, EquipmentItem, ItemDefinition, ItemKind, WeaponGroup, WeaponHandedness,
} from '../types';

export const SLOT_LABELS: Record<BodySlot, string> = {
  armor: 'Armatura', shield: 'Scudo', head: 'Testa', headband: 'Fronte', eyes: 'Occhi', neck: 'Collo',
  shoulders: 'Spalle', chest: 'Torace', body: 'Corpo', belt: 'Cintura', wrists: 'Polsi', hands: 'Mani',
  ring: 'Anello', feet: 'Piedi', none: 'Senza slot',
};

/** Display order of the body slots. */
export const SLOT_ORDER: BodySlot[] = [
  'armor', 'shield', 'head', 'headband', 'eyes', 'neck', 'shoulders', 'chest', 'body', 'belt', 'wrists', 'hands', 'ring', 'feet', 'none',
];

/** How many items each slot holds at once (informational in this change). */
export const SLOT_CAPACITY: Partial<Record<BodySlot, number>> = { ring: 2 };

export const KIND_LABELS: Record<ItemKind, string> = {
  weapon: 'Arma', armor: 'Armatura', shield: 'Scudo', ammo: 'Munizioni', gear: 'Equipaggiamento', magic: 'Oggetto magico',
};

export const WEAPON_GROUP_LABELS: Record<WeaponGroup, string> = { simple: 'Semplice', martial: 'Da guerra', exotic: 'Esotica' };

export const HANDEDNESS_LABELS: Record<WeaponHandedness, string> = {
  light: 'Leggera', 'one-handed': 'A una mano', 'two-handed': 'A due mani', ranged: 'A distanza',
};

export const ARMOR_CATEGORY_LABELS: Record<ArmorCategory, string> = {
  light: 'Leggera', medium: 'Media', heavy: 'Pesante', shield: 'Scudo', tower: 'Scudo torre',
};

export const DAMAGE_TYPE_LABELS: Record<DamageType, string> = { C: 'contundente', P: 'perforante', T: 'tagliente' };

const signed = (v: number) => (v >= 0 ? `+${v}` : `${v}`);
export const diceLabel = (d: Dice | null | undefined) => (!d ? '—' : d.die === 1 ? String(d.count) : `${d.count}d${d.die}`);
export const critLabel = (range: number, mult: number) => `${range < 20 ? `${range}–20/` : ''}×${mult}`;

/** Weight in kg with Italian decimals. */
export const kgLabel = (kg: number) => `${kg.toLocaleString('it-IT', { maximumFractionDigits: 2 })} kg`;

/** Price in gold pieces with Italian decimals. */
export const gpLabel = (gp: number) => `${gp.toLocaleString('it-IT', { maximumFractionDigits: 2 })} mo`;

/** "Collo · Oggetto minore inferiore · Manuale di Gioco" for magic items, empty for the others. */
export function magicInfoLabel(item: Pick<ItemDefinition, 'kind' | 'slot' | 'tier' | 'source'>): string {
  if (item.kind !== 'magic') return '';
  return [item.slot ? SLOT_LABELS[item.slot] : '', item.tier ?? '', item.source ?? ''].filter(Boolean).join(' · ');
}

type StatsSource = Pick<EquipmentItem, 'kind' | 'weapon' | 'armor' | 'masterwork' | 'enhancement' | 'material' | 'abilities'>;

/** "+2 resistenza · Tutti i tiri salvezza, …" for the modifiers an item grants when worn. */
export const itemEffectsLabel = (item: Pick<EquipmentItem, 'modifiers'>): string =>
  (item.modifiers ?? []).map(modifierLabel).join(', ');

/** One-line summary of an item's game statistics, with enhancement, abilities and material applied. */
export function itemStatsLabel(item: StatsSource, size: 'Small' | 'Medium' | 'Large' = 'Medium'): string {
  if (item.weapon) {
    const w = effectiveWeapon(item)?.stats ?? item.weapon;
    const dice = size === 'Small' ? w.damage.small : w.damage.medium;
    return [
      diceLabel(dice ?? w.damage.medium),
      critLabel(w.critRange, w.critMult),
      w.damageTypes.join('/'),
      w.rangeM ? `${w.rangeM.toLocaleString('it-IT')} m` : '',
      HANDEDNESS_LABELS[w.handedness].toLowerCase(),
    ].filter(Boolean).join(' · ');
  }
  if (item.armor) {
    const a = effectiveArmor(item) ?? item.armor;
    return [
      `${signed(a.bonus)} ${a.category === 'shield' || a.category === 'tower' ? 'scudo' : 'armatura'}`,
      a.maxDex === null ? '' : `Des max ${signed(a.maxDex)}`,
      a.checkPenalty ? `pen. ${a.checkPenalty}` : '',
      a.arcaneFailure ? `fall. arcano ${a.arcaneFailure}%` : '',
    ].filter(Boolean).join(' · ');
  }
  return '';
}
