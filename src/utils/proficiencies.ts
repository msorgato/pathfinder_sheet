import type {
  ArmorCategory, ArmorProficiency, ArmorStats, Character, ClassDefinition, CustomClassDefinition, EquipmentItem,
  WeaponProficiencies,
} from '../types';
import { getClass } from '../data/classes';
import { getRace } from '../data/races';

/** Proficiencies with the sources that grant them (for display). */
export interface ProficiencySet {
  armor: Map<ArmorProficiency, string[]>;
  groups: Map<'simple' | 'martial', string[]>;
  weapons: Map<string, string[]>;
  /** Proficiency feats still waiting for the owner to choose a weapon. */
  pendingChoices: { featId: string; index: number; featName: string }[];
  /** A class grants the deity's favored weapon. */
  grantsDeityWeapon: boolean;
}

export const ARMOR_PROFICIENCIES: ArmorProficiency[] = ['light', 'medium', 'heavy', 'shield', 'tower'];

export const ARMOR_PROFICIENCY_LABELS: Record<ArmorProficiency, string> = {
  light: 'Armature leggere', medium: 'Armature medie', heavy: 'Armature pesanti', shield: 'Scudi', tower: 'Scudo torre',
};

/** Feats that grant a whole category. */
const CATEGORY_FEATS: Record<string, { armor?: ArmorProficiency; group?: 'simple' | 'martial'; name: string }> = {
  competenza_nelle_armature_leggere: { armor: 'light', name: 'Competenza nelle Armature Leggere' },
  competenza_nelle_armature_medie: { armor: 'medium', name: 'Competenza nelle Armature Medie' },
  competenza_nelle_armature_pesanti: { armor: 'heavy', name: 'Competenza nelle Armature Pesanti' },
  competenza_negli_scudi: { armor: 'shield', name: 'Competenza negli Scudi' },
  competenza_negli_scudi_torre: { armor: 'tower', name: 'Competenza negli Scudi Torre' },
  competenza_nelle_armi_semplici: { group: 'simple', name: 'Competenza nelle Armi Semplici' },
};

/** Feats that grant one chosen weapon per instance. */
export const WEAPON_CHOICE_FEATS: Record<string, { name: string; group: 'martial' | 'exotic' }> = {
  competenza_nelle_armi_da_guerra: { name: 'Competenza nelle Armi da Guerra', group: 'martial' },
  competenza_nelle_armi_esotiche: { name: 'Competenza nelle Armi Esotiche', group: 'exotic' },
};

// ── Class normalization (built-in and custom, including legacy free text) ───

const isArmorProf = (s: string): s is ArmorProficiency => (ARMOR_PROFICIENCIES as string[]).includes(s);

const slugify = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/['’]/g, '-').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** Reads legacy armor text such as "Leggera, Media, Scudi (non a torre)". */
export function armorFromText(entries: string[]): ArmorProficiency[] {
  const out = new Set<ArmorProficiency>();
  for (const raw of entries) {
    const t = raw.toLowerCase();
    if (isArmorProf(t)) { out.add(t); continue; }
    if (/nessun/.test(t)) continue;
    if (/legger/.test(t)) out.add('light');
    if (/medi/.test(t)) out.add('medium');
    if (/pesant/.test(t)) out.add('heavy');
    const noTower = /non\s+a?\s*torre|tranne.*torre|eccetto.*torre/.test(t);
    if (/scud/.test(t)) out.add('shield');
    if (/torre/.test(t) && !noTower) out.add('tower');
  }
  return ARMOR_PROFICIENCIES.filter(p => out.has(p));
}

/** Reads legacy weapon text such as "Semplici + spada corta, stocco". Unknown parts stay in the note. */
export function weaponsFromText(text: string, knownWeaponIds?: Set<string>): WeaponProficiencies {
  const t = text.toLowerCase();
  const groups: ('simple' | 'martial')[] = [];
  if (/semplic/.test(t)) groups.push('simple');
  if (/guerra|marzial/.test(t)) groups.push('martial');
  const weapons = knownWeaponIds
    ? [...new Set(text.split(/[,+;]|\s+e\s+/).map(p => slugify(p)).filter(id => knownWeaponIds.has(id)))]
    : [];
  return { groups, weapons, ...(text.trim() ? { note: text.trim() } : {}) };
}

/** Structured proficiencies of any class definition. */
export function classProficiencies(
  cls: ClassDefinition | CustomClassDefinition,
  knownWeaponIds?: Set<string>,
): { armor: ArmorProficiency[]; weapons: WeaponProficiencies } {
  const armor = armorFromText(cls.armorProficiencies ?? []);
  const wp = cls.weaponProficiencies;
  const weapons = typeof wp === 'string' ? weaponsFromText(wp, knownWeaponIds) : (wp ?? { groups: [], weapons: [] });
  return { armor, weapons };
}

const GROUP_TEXT = { simple: 'semplici', martial: 'da guerra' } as const;

/** Readable summary of a class's proficiencies (weapon ids resolved with `nameOf`). */
export function proficiencySummary(
  cls: ClassDefinition | CustomClassDefinition,
  nameOf: (weaponId: string) => string,
): { armor: string; weapons: string } {
  const { armor, weapons } = classProficiencies(cls);
  const armorText = armor.length ? armor.map(a => ARMOR_PROFICIENCY_LABELS[a]).join(', ') : 'Nessuna';
  const parts = [
    ...(weapons.groups.length ? [`armi ${weapons.groups.map(g => GROUP_TEXT[g]).join(' e ')}`] : []),
    ...weapons.weapons.map(nameOf),
    ...(weapons.deityWeapon ? ['arma preferita della divinità'] : []),
  ];
  // Legacy text is only shown when nothing could be structured from it.
  const weaponText = parts.length ? parts.join(', ') : (weapons.note ?? 'Nessuna');
  return { armor: armorText, weapons: weaponText.charAt(0).toUpperCase() + weaponText.slice(1) };
}

// ── Character proficiencies ──────────────────────────────────────────────────

function add<K>(map: Map<K, string[]>, key: K, source: string) {
  const list = map.get(key) ?? [];
  if (!list.includes(source)) list.push(source);
  map.set(key, list);
}

export function computeProficiencies(char: Character): ProficiencySet {
  const set: ProficiencySet = {
    armor: new Map(), groups: new Map(), weapons: new Map(), pendingChoices: [], grantsDeityWeapon: false,
  };

  for (const entry of char.classes ?? []) {
    const cls = getClass(entry.classId);
    if (!cls) continue;
    const { armor, weapons } = classProficiencies(cls);
    armor.forEach(a => add(set.armor, a, cls.name));
    weapons.groups.forEach(g => add(set.groups, g, cls.name));
    weapons.weapons.forEach(w => add(set.weapons, w, cls.name));
    if (weapons.deityWeapon) set.grantsDeityWeapon = true;
  }

  const race = getRace(char.race);
  race?.weaponFamiliarity?.forEach(w => add(set.weapons, w, `${race.name} (familiarità)`));

  const featCount = new Map<string, number>();
  for (const featId of char.feats ?? []) {
    const index = featCount.get(featId) ?? 0;
    featCount.set(featId, index + 1);
    const cat = CATEGORY_FEATS[featId];
    if (cat?.armor) add(set.armor, cat.armor, cat.name);
    if (cat?.group) add(set.groups, cat.group, cat.name);
    const choiceFeat = WEAPON_CHOICE_FEATS[featId];
    if (choiceFeat) {
      const choice = char.featChoices?.find(fc => fc.featId === featId && fc.index === index)?.choice;
      if (choice) add(set.weapons, choice, choiceFeat.name);
      else set.pendingChoices.push({ featId, index, featName: choiceFeat.name });
    }
  }

  if (set.grantsDeityWeapon && char.deityWeaponId) add(set.weapons, char.deityWeaponId, 'Arma preferita della divinità');

  char.extraProficiencies?.armor?.forEach(a => add(set.armor, a, 'Aggiunta manuale'));
  char.extraProficiencies?.weapons?.forEach(w => add(set.weapons, w, 'Aggiunta manuale'));

  return set;
}

/**
 * Items without a catalogue id (custom or legacy) count as proficient unless
 * the owner flags them, to avoid false penalties on unusual weapons.
 */
export function isProficientWeapon(set: ProficiencySet, item: EquipmentItem): boolean {
  if (item.nonProficient) return false;
  const w = item.weapon;
  if (!w || !item.catalogId) return true;
  if (set.weapons.has(item.catalogId)) return true;
  return w.group !== 'exotic' && set.groups.has(w.group);
}

const ARMOR_NEEDS: Record<ArmorCategory, ArmorProficiency> = {
  light: 'light', medium: 'medium', heavy: 'heavy', shield: 'shield', tower: 'tower',
};

export function isProficientArmor(set: ProficiencySet, armor: ArmorStats, item?: EquipmentItem): boolean {
  if (item?.nonProficient) return false;
  return set.armor.has(ARMOR_NEEDS[armor.category]);
}
