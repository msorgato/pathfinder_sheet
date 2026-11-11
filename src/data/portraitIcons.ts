import type { Character } from '../types';

export interface PortraitIcon {
  id: string;
  name: string;
}

/** Icons available in public/icons/classi (id = file name without extension). */
export const PORTRAIT_ICONS: PortraitIcon[] = [
  { id: 'alchimista', name: 'Alchimista' },
  { id: 'antipaladino', name: 'Antipaladino' },
  { id: 'arcanista', name: 'Arcanista' },
  { id: 'attaccabrighe', name: 'Attaccabrighe' },
  { id: 'barbaro', name: 'Barbaro' },
  { id: 'bardo', name: 'Bardo' },
  { id: 'cacciatore', name: 'Cacciatore' },
  { id: 'cavaliere', name: 'Cavaliere' },
  { id: 'chierico', name: 'Chierico' },
  { id: 'cineta', name: 'Cineta' },
  { id: 'convocatore', name: 'Convocatore' },
  { id: 'druido', name: 'Druido' },
  { id: 'fattucchiere', name: 'Fattucchiere' },
  { id: 'guerriero', name: 'Guerriero' },
  { id: 'inquisitore', name: 'Inquisitore' },
  { id: 'intrepido', name: 'Intrepido' },
  { id: 'investigatore', name: 'Investigatore' },
  { id: 'iracondo', name: 'Iracondo' },
  { id: 'ladro', name: 'Ladro' },
  { id: 'mago', name: 'Mago' },
  { id: 'magus', name: 'Magus' },
  { id: 'medium', name: 'Medium' },
  { id: 'mesmerista', name: 'Mesmerista' },
  { id: 'monaco', name: 'Monaco' },
  { id: 'morfico', name: 'Morfico' },
  { id: 'ninja', name: 'Ninja' },
  { id: 'occultista', name: 'Occultista' },
  { id: 'oracolo', name: 'Oracolo' },
  { id: 'paladino', name: 'Paladino' },
  { id: 'parapsichico', name: 'Parapsichico' },
  { id: 'pistolero', name: 'Pistolero' },
  { id: 'predatore', name: 'Predatore' },
  { id: 'ranger', name: 'Ranger' },
  { id: 'sacerdote-guerriero', name: 'Sacerdote Guerriero' },
  { id: 'samurai', name: 'Samurai' },
  { id: 'scaldo', name: 'Scaldo' },
  { id: 'sciamano', name: 'Sciamano' },
  { id: 'spiritista', name: 'Spiritista' },
  { id: 'stregone', name: 'Stregone' },
  { id: 'vigilante', name: 'Vigilante' },
];

/** Default portrait icon for each built-in class id. */
export const CLASS_ICON_BY_CLASS_ID: Record<string, string> = {
  barbarian: 'barbaro',
  bard: 'bardo',
  cleric: 'chierico',
  druid: 'druido',
  fighter: 'guerriero',
  monk: 'monaco',
  paladin: 'paladino',
  ranger: 'ranger',
  rogue: 'ladro',
  sorcerer: 'stregone',
  wizard: 'mago',
};

const ICON_IDS = new Set(PORTRAIT_ICONS.map(i => i.id));

export const isPortraitIcon = (id: string | undefined): id is string => !!id && ICON_IDS.has(id);

export const portraitIconUrl = (id: string) => `/icons/classi/${id}.svg`;

/** Icon used when the player has not chosen one: the primary class icon, if any. */
export function defaultPortraitIcon(char: Pick<Character, 'classes'>): string | undefined {
  const classId = char.classes[0]?.classId;
  const icon = classId ? CLASS_ICON_BY_CLASS_ID[classId] : undefined;
  return isPortraitIcon(icon) ? icon : undefined;
}

/** Chosen icon → primary class icon → undefined (caller shows the name initial). */
export function resolvePortraitIcon(char: Pick<Character, 'classes' | 'portraitIcon'>): string | undefined {
  return isPortraitIcon(char.portraitIcon) ? char.portraitIcon : defaultPortraitIcon(char);
}
