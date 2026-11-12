import type {
  ActiveEffect, Character, ConsumableForm, CustomClassDefinition, EquipmentItem, SpellDefinition, SpellItem,
} from '../types';
import { getEffectPreset, presetModifiersAt } from '../data/effectPresets';
import { SPELL_EFFECT_LINKS } from '../data/spellEffectLinks';
import { addEffect, removeEffect } from './characterStatus';
import { normalizeItem, type ItemInput } from './inventory';

/** Highest spell level each form can hold. */
export const FORM_LIMITS: Record<ConsumableForm, number> = { potion: 3, wand: 4, scroll: 9 };
const FORM_BASE_PRICE: Record<ConsumableForm, number> = { potion: 50, scroll: 25, wand: 750 };
const FORM_WEIGHT_KG: Record<ConsumableForm, number> = { potion: 0, scroll: 0, wand: 0.1 };
export const FORM_LABELS: Record<ConsumableForm, string> = { potion: 'Pozione', scroll: 'Pergamena', wand: 'Bacchetta' };
export const MAX_WAND_CHARGES = 50;

/** Readable names for spell lists, including classes the app has no definition for. */
export const LIST_LABELS: Record<string, string> = {
  alchemist: 'Alchimista', arcanist: 'Arcanista', bard: 'Bardo', bloodrager: 'Sangue di furia', cleric: 'Chierico',
  druid: 'Druido', hunter: 'Cacciatore', inquisitor: 'Inquisitore', investigator: 'Investigatore', magus: 'Magus',
  medium: 'Medium', mesmerist: 'Mesmerista', occultist: 'Occultista', oracle: 'Oracolo', paladin: 'Paladino',
  psychic: 'Psichico', ranger: 'Ranger', shaman: 'Sciamano', skald: 'Scaldo', sorcerer: 'Stregone',
  spiritualist: 'Spiritualista', summoner: 'Evocatore', warpriest: 'Sacerdote guerriero', witch: 'Strega', wizard: 'Mago',
};
export const listLabel = (classId: string) => LIST_LABELS[classId] ?? classId;

/** Lowest caster level able to cast a spell of that level (full progression). */
export const minCasterLevel = (spellLevel: number) => (spellLevel <= 1 ? 1 : 2 * spellLevel - 1);

/** Class lists on which the spell fits the form, lowest level first. */
export function availableLists(spell: Pick<SpellDefinition, 'levels'>, form: ConsumableForm): Array<{ classId: string; level: number }> {
  return Object.entries(spell.levels ?? {})
    .filter(([, level]) => level <= FORM_LIMITS[form])
    .map(([classId, level]) => ({ classId, level }))
    .sort((a, b) => a.level - b.level || listLabel(a.classId).localeCompare(listLabel(b.classId)));
}

/** List price in gp: base × spell level × caster level (level 0 counts as ½). */
export const spellItemPrice = (form: ConsumableForm, spellLevel: number, casterLevel: number) =>
  FORM_BASE_PRICE[form] * (spellLevel === 0 ? 0.5 : spellLevel) * casterLevel;

/** Saving throw DC of the item, independent of the owner. */
export const spellItemDc = (spellLevel: number) => 10 + spellLevel + Math.floor(spellLevel / 2);

export const spellItemName = (form: ConsumableForm, spellName: string, casterLevel: number) =>
  `${FORM_LABELS[form]} di ${spellName} (LI ${casterLevel})`;

export class ConsumableError extends Error {}

/** Builds the inventory entry; `amount` is the quantity (potions, scrolls) or the charges (wands). */
export function createSpellItem(
  spell: Pick<SpellDefinition, 'id' | 'name'>, form: ConsumableForm, classId: string, spellLevel: number,
  casterLevel: number, amount: number,
): ItemInput {
  if (spellLevel > FORM_LIMITS[form]) {
    throw new ConsumableError(`${FORM_LABELS[form]}: incantesimi fino al ${FORM_LIMITS[form]}° livello.`);
  }
  const cl = Math.max(minCasterLevel(spellLevel), Math.floor(casterLevel || 0));
  const count = Math.max(1, Math.floor(amount || 1));
  const spellItem: SpellItem = { form, spellId: spell.id, spellName: spell.name, classId, spellLevel, casterLevel: cl };
  if (form === 'wand') {
    spellItem.charges = Math.min(count, MAX_WAND_CHARGES);
    spellItem.maxCharges = MAX_WAND_CHARGES;
  }
  return {
    name: spellItemName(form, spell.name, cl),
    quantity: form === 'wand' ? 1 : count,
    notes: '', equipped: false, kind: 'consumable', slot: 'none',
    priceGp: spellItemPrice(form, spellLevel, cl),
    weightKg: FORM_WEIGHT_KG[form],
    spellItem,
  };
}

/** A copy of the item with the derived values recomputed after a change to the spell parameters. */
export function refreshSpellItem(item: ItemInput, changes: Partial<SpellItem>): ItemInput {
  if (!item.spellItem) return item;
  const si: SpellItem = { ...item.spellItem, ...changes };
  si.casterLevel = Math.max(minCasterLevel(si.spellLevel), Math.floor(si.casterLevel || 0));
  if (si.form === 'wand') {
    si.maxCharges = MAX_WAND_CHARGES;
    si.charges = Math.min(MAX_WAND_CHARGES, Math.max(0, Math.floor(si.charges ?? 0)));
  }
  return {
    ...item, spellItem: si, name: spellItemName(si.form, si.spellName, si.casterLevel),
    priceGp: spellItemPrice(si.form, si.spellLevel, si.casterLevel),
  };
}

/** Amount left: charges for wands, quantity otherwise. */
export const remaining = (item: EquipmentItem) =>
  item.spellItem?.form === 'wand' ? (item.spellItem.charges ?? 0) : normalizeItem(item).quantity;

export type Usability =
  | { ok: true }
  | { ok: true; check: 'casterLevel'; dc: number }
  | { ok: false; check: 'umd'; dc: number };

/** Class lists the character can cast from: its classes, plus the source list of custom classes. */
function characterLists(char: Character, customClasses: CustomClassDefinition[]): Map<string, number> {
  const lists = new Map<string, number>();
  const add = (id: string | undefined, level: number) => { if (id) lists.set(id, Math.max(lists.get(id) ?? 0, level)); };
  char.classes.forEach(c => {
    add(c.classId, c.level);
    const custom = customClasses.find(x => x.id === c.classId);
    if (custom?.spellcasting?.enabled) add(custom.spellcasting.sourceList, c.level);
  });
  return lists;
}

/** Whether (and how) the character can use a scroll, wand or potion. Checks are shown, not rolled. */
export function usability(char: Character, item: EquipmentItem, customClasses: CustomClassDefinition[] = []): Usability {
  const si = item.spellItem;
  if (!si || si.form === 'potion') return { ok: true };
  const charLevel = characterLists(char, customClasses).get(si.classId);
  if (charLevel === undefined) return { ok: false, check: 'umd', dc: si.form === 'wand' ? 20 : 20 + si.casterLevel };
  if (si.form === 'scroll' && si.casterLevel > charLevel) return { ok: true, check: 'casterLevel', dc: si.casterLevel + 1 };
  return { ok: true };
}

export function usabilityLabel(u: Usability): string | null {
  if (!('check' in u)) return null;
  return u.check === 'umd' ? `Utilizzare Congegni Magici CD ${u.dc}` : `prova di livello dell'incantatore CD ${u.dc}`;
}

export interface ConsumableUndo {
  /** The item as it was, restored in place. */
  item: EquipmentItem;
  index: number;
  effectId?: string;
}

export interface UseResult {
  patch: Pick<Partial<Character>, 'equipment' | 'effects'>;
  undo: ConsumableUndo;
}

/** Uses one dose or charge and applies the linked effect at the item's caster level. Null when nothing is left. */
export function useConsumable(char: Character, itemId: string): UseResult | null {
  const items = char.equipment ?? [];
  const index = items.findIndex(i => i.id === itemId);
  const item = items[index];
  const si = item?.spellItem;
  if (!item || !si || remaining(item) <= 0) return null;

  let equipment: EquipmentItem[];
  if (si.form === 'wand') {
    equipment = items.map(i => (i.id === itemId ? { ...i, spellItem: { ...si, charges: (si.charges ?? 0) - 1 } } : i));
  } else if (normalizeItem(item).quantity <= 1) {
    equipment = items.filter(i => i.id !== itemId);
  } else {
    equipment = items.map(i => (i.id === itemId ? { ...i, quantity: normalizeItem(i).quantity - 1 } : i));
  }

  const preset = getEffectPreset(SPELL_EFFECT_LINKS[si.spellId] ?? '');
  let effects: ActiveEffect[] | undefined;
  let effectId: string | undefined;
  if (preset) {
    const patch = addEffect(char, {
      name: `${si.spellName} (LI ${si.casterLevel})`, presetId: preset.id, modifiers: presetModifiersAt(preset, si.casterLevel),
    });
    // addEffect leaves `note: undefined`, which Firestore rejects
    effects = patch.effects?.map(e => { const { note, ...rest } = e; return note === undefined ? rest : e; });
    effectId = effects?.[effects.length - 1]?.id;
  }
  return { patch: { equipment, ...(effects ? { effects } : {}) }, undo: { item, index, ...(effectId ? { effectId } : {}) } };
}

/** Restores the item (same id, same position) and removes the effect that the use added. */
export function undoConsumable(char: Character, undo: ConsumableUndo): Pick<Partial<Character>, 'equipment' | 'effects'> {
  const items = char.equipment ?? [];
  const equipment = items.some(i => i.id === undo.item.id)
    ? items.map(i => (i.id === undo.item.id ? undo.item : i))
    : [...items.slice(0, undo.index), undo.item, ...items.slice(undo.index)];
  return {
    equipment,
    ...(undo.effectId ? removeEffect(char, undo.effectId) : {}),
  };
}
