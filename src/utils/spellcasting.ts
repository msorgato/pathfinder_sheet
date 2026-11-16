import type {
  AbilityKey, Character, CustomClassDefinition, SpellcastingSchool, SpellcastingType, SpellDefinition, SpellProgression,
  SpellSlotTable, SpellsKnownTable,
} from '../types';
import type { AnyClassDefinition } from '../data/classes';
import { CLASSES, getClass, isBuiltinClass } from '../data/classes';
import { casterLevelFor, PROGRESSION_TABLES } from '../data/spellProgressions';

/** How a class casts, whatever its source: built-in, or custom with its (possibly inherited) configuration. */
export interface ResolvedSpellcasting {
  classId: string;
  ability: AbilityKey;
  type: SpellcastingType;
  school: SpellcastingSchool;
  usesSpellbook: boolean;
  progression: SpellProgression;
  slots: SpellSlotTable;
  spellsKnown?: SpellsKnownTable;
  maxSpellLevel: number;
  bonusSpellsFromAbility: boolean;
  /** Custom classes: the list whose spells (at their own level) the class can use. */
  sourceList?: string;
  customSpells: string[];
  customSpellLevels: Record<string, number>;
}

/**
 * Resolves the spellcasting of a class, or null when it does not cast (or its configuration is incomplete).
 * A custom class inherits what it leaves out from the built-in class of its source list.
 */
export function resolveSpellcasting(cls: AnyClassDefinition | undefined): ResolvedSpellcasting | null {
  if (!cls) return null;
  if (isBuiltinClass(cls)) {
    const sc = cls.spellcasting;
    if (!sc) return null;
    return {
      classId: cls.id, ability: sc.ability, type: sc.type, school: sc.school, usesSpellbook: !!sc.usesSpellbook,
      progression: sc.progression, slots: sc.slots, spellsKnown: sc.spellsKnown, maxSpellLevel: sc.maxSpellLevel,
      bonusSpellsFromAbility: sc.bonusSpellsFromAbility, customSpells: [], customSpellLevels: {},
    };
  }
  return resolveCustom(cls);
}

function resolveCustom(cls: CustomClassDefinition): ResolvedSpellcasting | null {
  const own = cls.spellcasting;
  if (!own?.enabled) return null;
  const base = own.sourceList ? CLASSES.find(c => c.id === own.sourceList)?.spellcasting : undefined;
  const ability = own.ability ?? base?.ability;
  const type = own.type ?? base?.type;
  const progression = own.progression ?? base?.progression;
  if (!ability || !type || !progression) return null;
  const table = PROGRESSION_TABLES[progression][type];
  if (!table) return null; // e.g. reduced + spontaneous
  return {
    classId: cls.id, ability, type,
    school: own.school ?? base?.school ?? (ability === 'wis' ? 'divine' : 'arcane'),
    usesSpellbook: type === 'prepared' && (own.usesSpellbook ?? base?.usesSpellbook ?? false),
    progression, slots: table.slots, spellsKnown: table.spellsKnown, maxSpellLevel: table.maxSpellLevel,
    bonusSpellsFromAbility: true,
    sourceList: own.sourceList || undefined,
    customSpells: own.customSpells ?? [], customSpellLevels: own.customSpellLevels ?? {},
  };
}

/** Level proposed for an additional spell: the lowest among its lists (1 when it is on none). */
export function defaultCustomSpellLevel(spell: Pick<SpellDefinition, 'levels'>): number {
  const levels = Object.values(spell.levels ?? {});
  return levels.length ? Math.min(...levels) : 1;
}

/** Level of a spell for the class, or undefined when it is not on its list or above its highest level. */
export function spellLevelFor(sc: ResolvedSpellcasting, spell: Pick<SpellDefinition, 'id' | 'levels'>): number | undefined {
  const level = sc.customSpells.includes(spell.id)
    ? (sc.customSpellLevels[spell.id] ?? defaultCustomSpellLevel(spell))
    : spell.levels[sc.sourceList ?? sc.classId];
  return level === undefined || level > sc.maxSpellLevel ? undefined : level;
}

/** The spells of a class with their level for it: the union of source list and additional spells. */
export function classSpellList<T extends Pick<SpellDefinition, 'id' | 'levels'>>(
  sc: ResolvedSpellcasting, spells: T[],
): Array<{ spell: T; level: number }> {
  const out: Array<{ spell: T; level: number }> = [];
  spells.forEach(spell => {
    const level = spellLevelFor(sc, spell);
    if (level !== undefined) out.push({ spell, level });
  });
  return out;
}

/** Caster level of the character for one of its classes (0 for a class that does not cast). */
export function casterLevel(char: Character, classId: string): number {
  const sc = resolveSpellcasting(getClass(classId));
  const entry = char.classes.find(e => e.classId === classId);
  return sc && entry ? casterLevelFor(sc.progression, entry.level) : 0;
}

/**
 * Spell lists the character casts from, with the caster level for each: a class contributes its own id
 * and, for a custom class, its source list.
 */
export function casterLevelsByList(char: Character, customClasses: CustomClassDefinition[] = []): Map<string, number> {
  const lists = new Map<string, number>();
  const add = (id: string | undefined, cl: number) => { if (id) lists.set(id, Math.max(lists.get(id) ?? -1, cl)); };
  char.classes.forEach(e => {
    const cls = getClass(e.classId) ?? customClasses.find(c => c.id === e.classId);
    const sc = resolveSpellcasting(cls);
    if (!sc) return;
    const cl = casterLevelFor(sc.progression, e.level);
    add(sc.classId, cl);
    add(sc.sourceList, cl);
  });
  return lists;
}
