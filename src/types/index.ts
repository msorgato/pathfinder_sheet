export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

export type AbilityScores = Record<AbilityKey, number>;

export type Alignment =
  | 'LG' | 'NG' | 'CG'
  | 'LN' | 'TN' | 'CN'
  | 'LE' | 'NE' | 'CE';

export type BabProgression = 'full' | 'three-quarters' | 'half';
export type SaveProgression = 'good' | 'poor';
export type SpellcastingType = 'prepared' | 'spontaneous';
export type SpellcastingSchool = 'arcane' | 'divine';
export type SpellSchool =
  | 'Abjuration' | 'Conjuration' | 'Divination' | 'Enchantment'
  | 'Evocation' | 'Illusion' | 'Necromancy' | 'Transmutation' | 'Universal';

export interface ClassFeature {
  level: number;
  name: string;
  description: string;
  type?: 'Ex' | 'Su' | 'Sp';
  choices?: string[];
  choiceType?: 'combat_feat' | 'class_list';
}

export interface ClassFeatureChoice {
  featureName: string;
  choice: string;
}

export interface SpellSlotTable {
  [classLevel: number]: number[]; // index = spell level 0-9
}

export interface SpellsKnownTable {
  [classLevel: number]: number[]; // index = spell level 0-9
}

export interface ClassDefinition {
  id: string;
  name: string;
  description: string;
  hitDie: number;
  bab: BabProgression;
  saves: { fort: SaveProgression; ref: SaveProgression; will: SaveProgression };
  skillsPerLevel: number;
  classSkills: string[];
  features: ClassFeature[];
  spellcasting?: {
    type: SpellcastingType;
    ability: AbilityKey;
    school: SpellcastingSchool;
    slots: SpellSlotTable;
    spellsKnown?: SpellsKnownTable;
    spellList: string[];
    maxSpellLevel: number;
    bonusSpellsFromAbility: boolean;
    usesSpellbook?: boolean;
  };
  armorProficiencies: ArmorProficiency[];
  weaponProficiencies: WeaponProficiencies;
}

// ── Proficiencies ────────────────────────────────────────────────────────────

export type ArmorProficiency = 'light' | 'medium' | 'heavy' | 'shield' | 'tower';
export type WeaponGroup = 'simple' | 'martial' | 'exotic';

export interface WeaponProficiencies {
  /** Whole groups (exotic is only granted per weapon). */
  groups: ('simple' | 'martial')[];
  /** Specific catalogue weapon ids. */
  weapons: string[];
  /** Free text for what is not structured (e.g. migrated custom class text). */
  note?: string;
  /** The class grants the deity's favored weapon (e.g. Chierico). */
  deityWeapon?: boolean;
}

export interface FeatChoice {
  featId: string;
  /** Distinguishes repeated instances of the same feat (0-based). */
  index: number;
  choice: string;
}

export interface ExtraProficiencies {
  armor?: ArmorProficiency[];
  weapons?: string[];
}

export interface RacialTrait {
  name: string;
  description: string;
}

export interface RaceDefinition {
  id: string;
  name: string;
  description: string;
  abilityModifiers: Partial<AbilityScores>;
  selectableBonus?: { count: number; amount: number };
  size: 'Small' | 'Medium' | 'Large';
  speed: number;
  traits: RacialTrait[];
  bonusFeat?: boolean;
  bonusSkillRanks?: number;
  languages: string[];
  bonusLanguages: string[];
  /** Catalogue weapon ids the race is proficient with (weapon familiarity). */
  weaponFamiliarity?: string[];
  /** Speed is never reduced by armor (Nano). */
  armorSpeedUnaffected?: boolean;
}

export interface FeatDefinition {
  id: string;
  name: string;
  description: string;
  prerequisites?: string;
  benefit: string;
  type: 'Combat' | 'General' | 'Metamagic' | 'Item Creation' | 'Teamwork';
  repeatable?: boolean;
}

export interface SkillDefinition {
  id: string;
  name: string;
  ability: AbilityKey;
  trainedOnly: boolean;
  armorCheckPenalty: boolean;
}

export interface SpellDefinition {
  id: string;
  name: string;
  school: SpellSchool;
  subSchool?: string;
  descriptor?: string;
  levels: Record<string, number>; // classId -> spell level
  castingTime: string;
  components: string;
  range: string;
  duration: string;
  savingThrow: string;
  spellResistance: string;
  description: string;
}

// ── Character data ──────────────────────────────────────────────────────────

export interface CharacterClassEntry {
  classId: string;
  level: number;
  archetypes?: string[];
  favoredClassBonus: Array<'hp' | 'skill'>; // one per level
}

export interface SkillRank {
  skillId: string;
  ranks: number;
  misc: number;
}

export interface PreparedSpell {
  spellId: string;
  classId: string;
  spellLevel: number;
  slot: number;
  metamagic?: string[];
  used: boolean;
}

export interface KnownSpell {
  spellId: string;
  classId: string;
  spellLevel: number;
}

export interface SpellSlotStatus {
  classId: string;
  spellLevel: number;
  total: number;
  used: number;
}

export type AttackType = 'melee' | 'ranged';

export interface WeaponAttack {
  id: string;
  name: string;
  damageDiceCount: number;
  damageDieType: number;
  abilityKey: 'str' | 'dex';
  attackType: AttackType;
  notes?: string;
  /** Linked inventory weapon: name, dice, critical, type and handedness come from it. */
  itemId?: string;
  /** Lowest natural roll that threatens a critical (default 20). */
  critRange?: number;
  /** Critical multiplier (default 2). */
  critMult?: number;
  twoHanded?: boolean;
}

// ── Items ────────────────────────────────────────────────────────────────────

export type ItemKind = 'weapon' | 'armor' | 'shield' | 'ammo' | 'gear' | 'magic' | 'consumable';

export type ConsumableForm = 'potion' | 'scroll' | 'wand';

/** A potion, scroll or wand made from a spell. */
export interface SpellItem {
  form: ConsumableForm;
  spellId: string;
  /** Snapshot of the spell name, kept if the spell is later renamed or removed. */
  spellName: string;
  /** Class list chosen for the spell (sets the spell level). */
  classId: string;
  spellLevel: number;
  casterLevel: number;
  /** Wands only. */
  charges?: number;
  maxCharges?: number;
}

export type MaterialId = 'mithral' | 'adamantine' | 'cold-iron' | 'alchemical-silver' | 'darkwood';

export type BodySlot =
  | 'armor' | 'shield' | 'head' | 'headband' | 'eyes' | 'neck' | 'shoulders' | 'chest'
  | 'body' | 'belt' | 'wrists' | 'hands' | 'ring' | 'feet' | 'none';

export interface Dice {
  count: number;
  die: number;
}

export type DamageType = 'C' | 'P' | 'T';
export type WeaponHandedness = 'light' | 'one-handed' | 'two-handed' | 'ranged';

export interface WeaponStats {
  group: WeaponGroup;
  handedness: WeaponHandedness;
  damage: { small: Dice | null; medium: Dice | null };
  /** Lowest natural roll that threatens (19 = 19–20). */
  critRange: number;
  critMult: number;
  /** Range increment in meters. */
  rangeM?: number;
  damageTypes: DamageType[];
  special: string[];
}

export type ArmorCategory = 'light' | 'medium' | 'heavy' | 'shield' | 'tower';

export interface ArmorStats {
  category: ArmorCategory;
  bonus: number;
  /** Maximum Dexterity bonus; null = no limit. */
  maxDex: number | null;
  /** Armor check penalty (0 or negative). */
  checkPenalty: number;
  /** Arcane spell failure chance in percent. */
  arcaneFailure: number;
  metal: boolean;
}

/** Built-in catalogue entry (public/data/items.json). */
export interface ItemDefinition {
  id: string;
  name: string;
  kind: ItemKind;
  /** Catalogue category label (e.g. "Armi da guerra a una mano"). */
  category: string;
  priceGp: number;
  weightKg: number;
  url: string;
  weapon?: WeaponStats;
  armor?: ArmorStats;
  /** Magic items: body slot, tier (e.g. "Anello minore inferiore") and source book. */
  slot?: BodySlot;
  tier?: string;
  source?: string;
}

/** An item owned by a character (a copy of the catalogue data, freely editable). */
export interface EquipmentItem {
  id: string;
  name: string;
  quantity: number;
  notes: string;
  equipped: boolean;
  catalogId?: string;
  kind?: ItemKind;
  slot?: BodySlot;
  priceGp?: number;
  weightKg?: number;
  weapon?: WeaponStats;
  armor?: ArmorStats;
  /** Owner-set: treat as non-proficient regardless of computed proficiencies. */
  nonProficient?: boolean;
  /** Masterwork quality (implied by enhancement and by special materials). */
  masterwork?: boolean;
  /** Enhancement bonus, 0 to 5. */
  enhancement?: number;
  material?: MaterialId;
  /** Special ability ids (see data/itemAbilities). */
  abilities?: string[];
  /** Modifiers applied while the item is equipped and active. */
  modifiers?: Modifier[];
  /** Price before masterwork/material/enhancement, used to recompute the list price. */
  basePriceGp?: number;
  /** Potion, scroll or wand: the spell and its parameters. */
  spellItem?: SpellItem;
  /** @deprecated legacy format */
  type?: 'weapon' | 'armor' | 'gear' | 'magic' | 'wondrous';
  /** @deprecated legacy format (weight) */
  weight?: number;
  /** @deprecated legacy format (value in gp) */
  value?: number;
}

export interface Character {
  id: string;
  name: string;
  playerName?: string;
  race: string;
  racialAbilityBonus?: Partial<AbilityScores>;
  alignment: Alignment;
  deity?: string;
  gender?: string;
  age?: number;
  height?: string;
  weight?: string;
  hair?: string;
  eyes?: string;
  background?: string;

  baseAbilityScores: AbilityScores;
  abilityIncreases: Partial<AbilityScores>[];

  classes: CharacterClassEntry[];
  totalLevel: number;

  hitPointsRolled: number[];
  currentHp: number;
  tempHp: number;
  nonLethalDamage: number;

  skills: SkillRank[];
  feats: string[];
  traits: string[];

  knownSpells: KnownSpell[];
  preparedSpells: PreparedSpell[];
  spellSlots: SpellSlotStatus[];

  weaponAttacks: WeaponAttack[];
  equipment: EquipmentItem[];
  copper: number;
  silver: number;
  gold: number;
  platinum: number;

  experience: number;
  notes: string;
  accentColor?: string;
  /** Id of the chosen portrait icon (file name in public/icons/classi without extension). */
  portraitIcon?: string;
  classFeatureChoices?: ClassFeatureChoice[];
  /** Choices for feats that need one (e.g. Competenza nelle Armi Esotiche → weapon id). */
  featChoices?: FeatChoice[];
  /** Proficiencies added by the owner (traits, archetypes, house rules). */
  extraProficiencies?: ExtraProficiencies;
  /** Deity's favored weapon (catalogue id), for classes that grant it. */
  deityWeaponId?: string;

  /** Active conditions (e.g. Scosso), by catalogue id. */
  conditions?: ActiveCondition[];
  /** Active effects from spells or other sources (preset copies or custom). */
  effects?: ActiveEffect[];
  /** Ability damage: lowers the modifier by 1 every 2 points, score unchanged. */
  abilityDamage?: Partial<AbilityScores>;
  /** Ability drain: lowers the score itself. */
  abilityDrain?: Partial<AbilityScores>;
  negativeLevels?: NegativeLevels;
}

// ── Modifiers, conditions and effects ────────────────────────────────────────

export type BonusType =
  | 'alchemical' | 'armor' | 'circumstance' | 'competence' | 'deflection' | 'dodge'
  | 'enhancement' | 'inherent' | 'insight' | 'luck' | 'morale' | 'natural' | 'profane'
  | 'racial' | 'resistance' | 'sacred' | 'shield' | 'size' | 'trait' | 'untyped';

export type AttackScope = 'all' | 'melee' | 'ranged';
export type SaveKey = 'fort' | 'ref' | 'will';

export type ModifierTarget =
  | { kind: 'ability'; ability: AbilityKey }
  | { kind: 'attack'; scope: AttackScope }
  | { kind: 'damage'; scope: AttackScope }
  | { kind: 'save'; save: 'all' | SaveKey }
  | { kind: 'skill'; skillId: string /* 'all' or a skill id */ }
  | { kind: 'ac' }
  | { kind: 'abilityCheck' }
  | { kind: 'initiative' }
  | { kind: 'cmb' }
  | { kind: 'cmd' };

export interface Modifier {
  target: ModifierTarget;
  type: BonusType;
  value: number;
}

export interface ActiveCondition {
  id: string;
  conditionId: string;
  note?: string;
}

export interface ActiveEffect {
  id: string;
  name: string;
  presetId?: string;
  modifiers: Modifier[];
  note?: string;
  disabled?: boolean;
}

export interface NegativeLevels {
  temporary: number;
  permanent: number;
}

export type WizardStep =
  | 'race'
  | 'class'
  | 'ability-scores'
  | 'skills'
  | 'feats'
  | 'spells'
  | 'details';

// ── Custom Classes ───────────────────────────────────────────────────────────

export type CustomClassFeatureType = 'Ex' | 'Su' | 'Sp' | 'special';

export type CustomClassStatus = 'draft' | 'published';

export interface CustomClassFeature {
  id: string;
  name: string;
  description: string;
  level: number;
  type: CustomClassFeatureType;
  modifiers?: string;
}

export interface CustomClassSpellcasting {
  enabled: boolean;
  sourceList?: string;
  customSpells?: string[];
}

export interface CustomClassDefinition {
  id: string;
  name: string;
  description: string;
  hitDie: number;
  status: CustomClassStatus;
  /** Structured categories, or legacy free text entries (normalized on read). */
  armorProficiencies: string[];
  /** Structured, or legacy free text (normalized on read). */
  weaponProficiencies: string | WeaponProficiencies;
  skillsPerLevel: number;
  classSkills: string[];
  /** Index 0 = level 1, length 20 */
  bab: number[];
  saves: {
    fort: number[];
    ref: number[];
    will: number[];
  };
  features: CustomClassFeature[];
  spellcasting?: CustomClassSpellcasting;
  createdAt: number;
  updatedAt: number;
  publishedAt?: number;
}

// ── Lobby & Chat ─────────────────────────────────────────────────────────────

export interface Lobby {
  id: string;
  code: string;
  name: string;
  ownerId: string;
  ownerName: string;
  createdAt: number; // Unix ms
  isActive: boolean;
  gmUid?: string;
}

export interface LobbyMember {
  userId: string;
  displayName: string;
  joinedAt: number; // Unix ms
  lastSeenAt: number; // Unix ms
  characterId?: string;
}

export interface RollResultData {
  characterName: string;
  label: string;
  formula: string;
  rolls: number[];
  modifier: number;
  total: number;
  isCrit?: boolean;
  isFumble?: boolean;
}

export interface LobbyMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  sentAt: number; // Unix ms
  type?: 'text' | 'roll';
  rollData?: RollResultData;
  hidden?: boolean;
}

export interface LobbyWithUnread extends Lobby {
  unreadCount: number;
  memberCount: number;
}
