import type { SpellcastingType, SpellProgression, SpellSlotTable, SpellsKnownTable } from '../types';
import { BARD_KNOWN, BARD_SLOTS, PALADIN_SLOTS, SORCERER_KNOWN, SORCERER_SLOTS, WIZARD_SLOTS } from './spellSlots';

export interface ProgressionTable {
  slots: SpellSlotTable;
  /** Spontaneous casters only. */
  spellsKnown?: SpellsKnownTable;
  maxSpellLevel: number;
}

/** [classLevel − 1][spellLevel] rows, as in data/spellSlots, keyed by class level. */
const byLevel = (rows: number[][]): SpellSlotTable => Object.fromEntries(rows.map((s, i) => [i + 1, s]));

/**
 * Tables of each progression and type. The built-in classes keep their own copy;
 * a test checks that the two never diverge. Reduced spontaneous does not exist.
 */
export const PROGRESSION_TABLES: Record<SpellProgression, Partial<Record<SpellcastingType, ProgressionTable>>> = {
  full: {
    prepared: { slots: byLevel(WIZARD_SLOTS), maxSpellLevel: 9 },
    spontaneous: { slots: byLevel(SORCERER_SLOTS), spellsKnown: byLevel(SORCERER_KNOWN), maxSpellLevel: 9 },
  },
  medium: {
    prepared: { slots: byLevel(BARD_SLOTS), maxSpellLevel: 6 },
    spontaneous: { slots: byLevel(BARD_SLOTS), spellsKnown: byLevel(BARD_KNOWN), maxSpellLevel: 6 },
  },
  reduced: {
    prepared: { slots: byLevel(PALADIN_SLOTS), maxSpellLevel: 4 },
  },
};

export const PROGRESSION_LABELS: Record<SpellProgression, string> = {
  full: 'Piena (fino al 9°)', medium: 'Media (fino al 6°)', reduced: 'Ridotta (fino al 4°)',
};

/** Whether the progression exists for the casting type (reduced spontaneous does not). */
export const progressionAllows = (progression: SpellProgression, type: SpellcastingType) =>
  !!PROGRESSION_TABLES[progression][type];

/** Caster level for a class level: the class level, minus 3 for the reduced progression. */
export const casterLevelFor = (progression: SpellProgression, classLevel: number) =>
  progression === 'reduced' ? Math.max(0, classLevel - 3) : classLevel;
