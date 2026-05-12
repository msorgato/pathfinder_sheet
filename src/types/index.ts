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
  armorProficiencies: string[];
  weaponProficiencies: string;
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
}

export interface EquipmentItem {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'gear' | 'magic' | 'wondrous';
  weight: number;
  value: number;
  quantity: number;
  notes: string;
  equipped: boolean;
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
}

export type WizardStep =
  | 'race'
  | 'class'
  | 'ability-scores'
  | 'skills'
  | 'feats'
  | 'spells'
  | 'details';

// ── Lobby & Chat ─────────────────────────────────────────────────────────────

export interface Lobby {
  id: string;
  code: string;
  name: string;
  ownerId: string;
  ownerName: string;
  createdAt: number; // Unix ms
  isActive: boolean;
}

export interface LobbyMember {
  userId: string;
  displayName: string;
  joinedAt: number; // Unix ms
  lastSeenAt: number; // Unix ms
}

export interface LobbyMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  sentAt: number; // Unix ms
}

export interface LobbyWithUnread extends Lobby {
  unreadCount: number;
  memberCount: number;
}
