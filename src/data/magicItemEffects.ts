import type { AbilityKey, Modifier } from '../types';

/**
 * Modifiers that come ready-made when a catalogue magic item is added to the inventory.
 * The player can edit or remove them. Items where the player chooses the abilities
 * (Cintura della Potenza Fisica, Fascia della Prodezza Mentale) have no preset.
 */
export interface ItemEffectPreset {
  id: string;
  /** Matches the catalogue id (without the "m-" prefix); the first group is the bonus N, when any. */
  pattern: RegExp;
  modifiers: (n: number) => Modifier[];
}

const ability = (a: AbilityKey, n: number): Modifier => ({ target: { kind: 'ability', ability: a }, type: 'enhancement', value: n });
const skill = (skillId: string, n: number): Modifier => ({ target: { kind: 'skill', skillId }, type: 'competence', value: n });

export const ITEM_EFFECT_PRESETS: ItemEffectPreset[] = [
  { id: 'mantello-resistenza', pattern: /^mantello-della-resistenza-(\d)$/,
    modifiers: n => [{ target: { kind: 'save', save: 'all' }, type: 'resistance', value: n }] },
  { id: 'anello-protezione', pattern: /^anello-di-protezione-(\d)$/,
    modifiers: n => [{ target: { kind: 'ac' }, type: 'deflection', value: n }] },
  { id: 'amuleto-armatura-naturale', pattern: /^amuleto-dell-armatura-naturale-(\d)$/,
    modifiers: n => [{ target: { kind: 'ac' }, type: 'natural', value: n }] },
  { id: 'bracciali-armatura', pattern: /^bracciali-dell-armatura-(\d)$/,
    modifiers: n => [{ target: { kind: 'ac' }, type: 'armor', value: n }] },

  { id: 'cintura-forza', pattern: /^cintura-della-forza-del-gigante-(\d)$/, modifiers: n => [ability('str', n)] },
  { id: 'cintura-destrezza', pattern: /^cintura-dell-agilita-(\d)$/, modifiers: n => [ability('dex', n)] },
  { id: 'cintura-costituzione', pattern: /^cintura-del-vigore-(\d)$/, modifiers: n => [ability('con', n)] },
  { id: 'cintura-fisica', pattern: /^cintura-della-perfezione-fisica-(\d)$/,
    modifiers: n => [ability('str', n), ability('dex', n), ability('con', n)] },

  { id: 'fascia-intelligenza', pattern: /^fascia-della-sapienza-(\d)$/, modifiers: n => [ability('int', n)] },
  { id: 'fascia-saggezza', pattern: /^fascia-dell-ispirazione-(\d)$/, modifiers: n => [ability('wis', n)] },
  { id: 'fascia-carisma', pattern: /^fascia-della-seduzione-(\d)$/, modifiers: n => [ability('cha', n)] },
  { id: 'fascia-mentale', pattern: /^fascia-della-superiorita-mentale-(\d)$/,
    modifiers: n => [ability('int', n), ability('wis', n), ability('cha', n)] },

  { id: 'mantello-elfico', pattern: /^mantello-elfico$/, modifiers: () => [skill('stealth', 5)] },
  { id: 'stivali-elfici', pattern: /^stivali-elfici$/, modifiers: () => [skill('stealth', 5)] },
];

/** Preset modifiers for a catalogue item id, or undefined when the item has none. */
export function presetModifiers(catalogId: string): Modifier[] | undefined {
  const id = catalogId.replace(/^m-/, '');
  for (const preset of ITEM_EFFECT_PRESETS) {
    const m = preset.pattern.exec(id);
    if (m) return preset.modifiers(Number(m[1] ?? 0));
  }
  return undefined;
}
