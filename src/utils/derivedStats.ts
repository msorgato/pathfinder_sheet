import type { AbilityKey, BonusType, Character, EquipmentItem, Modifier, SaveKey, WeaponAttack } from '../types';
import { getCondition } from '../data/conditions';
import { SKILLS } from '../data/skills';
import { getClass, isBuiltinClass } from '../data/classes';
import { getRace } from '../data/races';
import { attackFieldsFromItem, inventoryOf } from './inventory';
import { activeItems } from './activeItems';
import { armorAbilityModifiers, displayName, effectiveArmor, effectiveWeapon } from './itemEnhancements';
import type { EffectiveArmor } from './itemEnhancements';
import type { ExtraDice } from '../data/itemAbilities';
import { computeProficiencies, isProficientArmor, isProficientWeapon, type ProficiencySet } from './proficiencies';
import { ABILITY_SHORT } from '../data/modifierLabels';
import {
  abilityMod, effectiveAbilityScores, maxHP, skillTotal, totalBAB, totalSave,
} from './calculations';

// ── Types ────────────────────────────────────────────────────────────────────

export interface SourcedModifier extends Modifier {
  source: string;
}

/** One line of a value's breakdown. `type` is absent for structural entries (e.g. ability changes). */
export interface StatEntry {
  source: string;
  value: number;
  type?: BonusType;
}

export interface Stat {
  /** Value with no conditions, effects, ability damage/drain or negative levels. */
  base: number;
  total: number;
  applied: StatEntry[];
  /** Bonuses ignored by the stacking rules. */
  suppressed: StatEntry[];
}

/** A weapon attack with everything resolved (linked item, proficiency, two-handed damage). */
export interface ResolvedAttack {
  attack: WeaponAttack;
  /** To-hit of the first iteration (BAB included); later iterations subtract 5 each. */
  toHit: Stat;
  /** Flat damage modifier (ability, two-handed, damage modifiers). */
  damage: Stat;
  critRange: number;
  critMult: number;
  proficient: boolean;
  /** The linked inventory item still exists. */
  linked: boolean;
  /** Extra damage dice of the weapon's special abilities, rolled apart. */
  extraDice: ExtraDice[];
  /** Effects of abilities and materials that are not automated. */
  notes: string[];
}

export interface DerivedStats {
  /** Scores before any condition/effect/drain (race, increases, age included). */
  rawScores: Record<AbilityKey, number>;
  /** Effective scores (drain and ability modifiers applied). */
  scores: Record<AbilityKey, number>;
  /** Effective modifiers (ability damage applied: −1 every 2 points). */
  mods: Record<AbilityKey, number>;
  abilityDamage: Record<AbilityKey, number>;
  abilityDrain: Record<AbilityKey, number>;
  /** Breakdown of each effective score. */
  abilityStats: Record<AbilityKey, Stat>;
  bab: number;
  saves: Record<SaveKey, Stat>;
  /** Full to-hit for the global chain (BAB + STR/DEX + modifiers). */
  attack: { melee: Stat; ranged: Stat };
  /** Attack modifiers only (no BAB, no ability), by attack type. */
  attackMods: { melee: Stat; ranged: Stat };
  /** Weapon damage modifiers only (no ability), by attack type. */
  damageMods: { melee: Stat; ranged: Stat };
  ac: Stat;
  touch: Stat;
  flatFooted: Stat;
  cmb: Stat;
  cmd: Stat;
  initiative: Stat;
  skills: Record<string, Stat>;
  abilityChecks: Record<AbilityKey, Stat>;
  maxHp: Stat;
  negativeLevels: number;
  losesDexToAC: boolean;
  /** Non-numeric effects of active conditions on attacks (e.g. "Accecato: 50% di probabilità di mancare"). */
  attackNotes: string[];
  warnings: string[];
  /** Speed in meters (armor reduction applied). */
  speed: Stat;
  /** Total armor check penalty of the worn armor and shield (0 or negative). */
  armorCheckPenalty: number;
  /** Arcane spell failure chance (%) of the worn armor and shield. */
  arcaneSpellFailure: number;
  proficiencies: ProficiencySet;
  /** Resolves a weapon attack (linked item, proficiency, two-handed damage). */
  weaponAttack: (attack: WeaponAttack) => ResolvedAttack;
}

const ABILITIES: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

/** Bonus types that stack with themselves. */
const STACKING_TYPES: BonusType[] = ['dodge', 'circumstance', 'untyped'];

/** AC bonus types that also apply to CMD (PF1 Core Rulebook). */
const CMD_AC_TYPES: BonusType[] = ['circumstance', 'deflection', 'dodge', 'insight', 'luck', 'morale', 'profane', 'sacred'];

// ── Stacking ─────────────────────────────────────────────────────────────────

/**
 * PF1 stacking: penalties always stack; bonuses of the same type do not
 * (only the highest applies), except dodge, circumstance and untyped.
 */
export function stack(mods: SourcedModifier[]): { applied: StatEntry[]; suppressed: StatEntry[] } {
  const applied: StatEntry[] = [];
  const suppressed: StatEntry[] = [];
  const bestByType = new Map<BonusType, SourcedModifier>();

  for (const mod of mods) {
    if (mod.value === 0) continue;
    if (mod.value < 0 || STACKING_TYPES.includes(mod.type)) {
      applied.push({ source: mod.source, type: mod.type, value: mod.value });
      continue;
    }
    const best = bestByType.get(mod.type);
    if (!best) { bestByType.set(mod.type, mod); continue; }
    if (mod.value > best.value) {
      suppressed.push({ source: best.source, type: best.type, value: best.value });
      bestByType.set(mod.type, mod);
    } else {
      suppressed.push({ source: mod.source, type: mod.type, value: mod.value });
    }
  }
  for (const best of bestByType.values()) applied.push({ source: best.source, type: best.type, value: best.value });
  return { applied, suppressed };
}

function makeStat(base: number, structural: StatEntry[], mods: SourcedModifier[]): Stat {
  const { applied, suppressed } = stack(mods);
  const all = [...structural.filter(e => e.value !== 0), ...applied];
  return { base, total: base + all.reduce((s, e) => s + e.value, 0), applied: all, suppressed };
}

const sumStack = (mods: SourcedModifier[]) => stack(mods).applied.reduce((s, e) => s + e.value, 0);

// ── Sources ──────────────────────────────────────────────────────────────────

/** A worn armor or shield; `armor` already has enhancement, masterwork and material applied. */
export interface WornArmor { item: EquipmentItem; armor: EffectiveArmor; proficient: boolean }

/** Active armor and shield (at most one of each counts: the first active one). */
export function wornArmor(char: Character, profs: ProficiencySet = computeProficiencies(char)): WornArmor[] {
  const out: WornArmor[] = [];
  const active = activeItems(char);
  for (const kind of ['armor', 'shield'] as const) {
    const item = active.find(i => i.kind === kind && i.armor);
    const armor = item && effectiveArmor(item);
    if (item && armor) out.push({ item, armor, proficient: isProficientArmor(profs, armor, item) });
  }
  return out;
}

const NON_PROFICIENT_ARMOR_SKILLS = SKILLS.filter(sk => sk.ability === 'str' || sk.ability === 'dex');
const ARMOR_CHECK_SKILLS = SKILLS.filter(sk => sk.armorCheckPenalty);

/** Typed AC bonuses and check penalties from the worn armor and shield. */
function armorModifiers(worn: WornArmor[]): SourcedModifier[] {
  const out: SourcedModifier[] = [];
  for (const { item, armor, proficient } of worn) {
    const source = displayName(item);
    if (armor.bonus) {
      out.push({ source, type: item.kind === 'shield' ? 'shield' : 'armor', value: armor.bonus, target: { kind: 'ac' } });
    }
    const acp = Math.min(0, armor.checkPenalty);
    if (!acp) continue;
    const skills = proficient ? ARMOR_CHECK_SKILLS : NON_PROFICIENT_ARMOR_SKILLS;
    skills.forEach(sk => out.push({ source, type: 'untyped', value: acp, target: { kind: 'skill', skillId: sk.id } }));
    if (!proficient) {
      out.push({ source: `${source} (non competente)`, type: 'untyped', value: acp, target: { kind: 'attack', scope: 'all' } });
    }
  }
  // Abilities of the worn armor and shield (e.g. Ombra: +5 Furtività)
  for (const { item } of worn) {
    armorAbilityModifiers(item).forEach(m => out.push({ ...m, source: displayName(item) }));
  }
  return out;
}

export function totalNegativeLevels(char: Pick<Character, 'negativeLevels'>): number {
  const nl = char.negativeLevels;
  return Math.max(0, (nl?.temporary ?? 0) + (nl?.permanent ?? 0));
}

/** All active modifiers with their source name (conditions, enabled effects, negative levels). */
export function collectModifiers(char: Character, worn: WornArmor[] = wornArmor(char)): SourcedModifier[] {
  const out: SourcedModifier[] = [...armorModifiers(worn)];
  // Modifiers of equipped items; items beyond the capacity of their slot are inactive.
  for (const item of activeItems(char)) {
    item.modifiers?.forEach(m => out.push({ ...m, source: displayName(item) }));
  }
  const seen = new Set<string>();
  let fearApplied = false;

  for (const active of char.conditions ?? []) {
    const def = getCondition(active.conditionId);
    if (!def || seen.has(def.id)) continue;
    seen.add(def.id);
    if (def.group === 'fear') {
      if (fearApplied) continue;
      fearApplied = true;
    }
    def.modifiers.forEach(m => out.push({ ...m, source: def.name }));
  }

  for (const effect of char.effects ?? []) {
    if (effect.disabled) continue;
    effect.modifiers.forEach(m => out.push({ ...m, source: effect.name }));
  }

  const neg = totalNegativeLevels(char);
  if (neg > 0) {
    const source = 'Livelli negativi';
    // CMB gets attack modifiers automatically, so it is not listed here.
    out.push(
      { source, type: 'untyped', value: -neg, target: { kind: 'attack', scope: 'all' } },
      { source, type: 'untyped', value: -neg, target: { kind: 'save', save: 'all' } },
      { source, type: 'untyped', value: -neg, target: { kind: 'skill', skillId: 'all' } },
      { source, type: 'untyped', value: -neg, target: { kind: 'abilityCheck' } },
      { source, type: 'untyped', value: -neg, target: { kind: 'cmd' } },
    );
  }
  return out;
}

export function losesDexToAC(char: Pick<Character, 'conditions'>): boolean {
  return (char.conditions ?? []).some(c => getCondition(c.conditionId)?.losesDexToAC);
}

// ── Derivation ───────────────────────────────────────────────────────────────

export function deriveStats(char: Character): DerivedStats {
  const proficiencies = computeProficiencies(char);
  const worn = wornArmor(char, proficiencies);
  const all = collectModifiers(char, worn);
  const pick = (pred: (m: SourcedModifier) => boolean) => all.filter(pred);

  // Ability scores
  const rawScores = effectiveAbilityScores(char);
  const abilityDamage = {} as Record<AbilityKey, number>;
  const abilityDrain = {} as Record<AbilityKey, number>;
  const scores = {} as Record<AbilityKey, number>;
  const mods = {} as Record<AbilityKey, number>;
  const abilityStats = {} as Record<AbilityKey, Stat>;

  for (const a of ABILITIES) {
    abilityDamage[a] = Math.max(0, char.abilityDamage?.[a] ?? 0);
    abilityDrain[a] = Math.max(0, char.abilityDrain?.[a] ?? 0);
    const structural: StatEntry[] = abilityDrain[a] ? [{ source: 'Risucchio', value: -abilityDrain[a] }] : [];
    const stat = makeStat(rawScores[a], structural, pick(m => m.target.kind === 'ability' && m.target.ability === a));
    stat.total = Math.max(0, stat.total);
    abilityStats[a] = stat;
    scores[a] = stat.total;
    mods[a] = abilityMod(scores[a]) - Math.floor(abilityDamage[a] / 2);
  }

  const rawMod = (a: AbilityKey) => abilityMod(rawScores[a]);
  /** Structural entry for the change in an ability modifier caused by effects, drain or damage. */
  const abilityDelta = (a: AbilityKey, multiplier = 1): StatEntry => ({
    source: `${ABILITY_SHORT[a]} (effetti)`,
    value: (mods[a] - rawMod(a)) * multiplier,
  });

  const lossDex = losesDexToAC(char);
  const bab = totalBAB(char.classes);
  const totalLevel = char.classes.reduce((s, e) => s + e.level, 0);

  // Saves
  const saveAbility: Record<SaveKey, AbilityKey> = { fort: 'con', ref: 'dex', will: 'wis' };
  const saves = {} as Record<SaveKey, Stat>;
  for (const s of ['fort', 'ref', 'will'] as SaveKey[]) {
    const a = saveAbility[s];
    saves[s] = makeStat(
      totalSave(s, char.classes) + rawMod(a),
      [abilityDelta(a)],
      pick(m => m.target.kind === 'save' && (m.target.save === 'all' || m.target.save === s)),
    );
  }

  // Attacks and damage
  const scopeMods = (kind: 'attack' | 'damage', scope: 'melee' | 'ranged') =>
    pick(m => m.target.kind === kind && (m.target.scope === 'all' || m.target.scope === scope));
  const attackMods = {
    melee: makeStat(0, [], scopeMods('attack', 'melee')),
    ranged: makeStat(0, [], scopeMods('attack', 'ranged')),
  };
  const damageMods = {
    melee: makeStat(0, [], scopeMods('damage', 'melee')),
    ranged: makeStat(0, [], scopeMods('damage', 'ranged')),
  };
  const attack = {
    melee: makeStat(bab + rawMod('str'), [abilityDelta('str')], scopeMods('attack', 'melee')),
    ranged: makeStat(bab + rawMod('dex'), [abilityDelta('dex')], scopeMods('attack', 'ranged')),
  };

  // Armor Class
  const acMods = pick(m => m.target.kind === 'ac');
  const positiveDex = Math.max(0, mods.dex);
  const dexLoss: StatEntry = { source: 'Perde il bonus di Des', value: -positiveDex };
  const withoutTypes = (list: SourcedModifier[], types: BonusType[]) => list.filter(m => !types.includes(m.type));
  // Maximum Dexterity bonus of the worn armor/shield (AC and CMD only).
  const caps = worn.filter(w => w.armor.maxDex !== null);
  const dexCap = caps.length ? Math.min(...caps.map(w => w.armor.maxDex as number)) : null;
  const capItem = caps.find(w => w.armor.maxDex === dexCap);
  const capEntry: StatEntry[] = !lossDex && dexCap !== null && positiveDex > Math.max(0, dexCap)
    ? [{ source: `Limite Des (${capItem?.item.name})`, value: Math.max(0, dexCap) - positiveDex }]
    : [];
  const acBase = 10 + rawMod('dex');
  const ac = makeStat(acBase, [abilityDelta('dex'), ...(lossDex ? [dexLoss] : capEntry)], lossDex ? withoutTypes(acMods, ['dodge']) : acMods);
  const touch = makeStat(acBase, [abilityDelta('dex'), ...(lossDex ? [dexLoss] : capEntry)],
    withoutTypes(lossDex ? withoutTypes(acMods, ['dodge']) : acMods, ['armor', 'shield', 'natural']));
  const flatFooted = makeStat(acBase, [abilityDelta('dex'), dexLoss], withoutTypes(acMods, ['dodge']));

  // Combat maneuvers: special size modifier is the opposite of the size modifier to attack.
  const sizeAttack = sumStack(pick(m => m.target.kind === 'attack' && m.target.scope === 'all' && m.type === 'size'));
  const specialSize: StatEntry = { source: 'Taglia (manovre)', value: -sizeAttack };
  const cmb = makeStat(
    bab + rawMod('str'),
    [abilityDelta('str'), specialSize],
    pick(m => (m.target.kind === 'attack' && m.target.scope === 'all' && m.type !== 'size') || m.target.kind === 'cmb'),
  );
  const cmdFromAc = acMods.filter(m => m.type !== 'size'
    && (m.value < 0 || (CMD_AC_TYPES.includes(m.type) && !(lossDex && m.type === 'dodge'))));
  const cmd = makeStat(
    10 + bab + rawMod('str') + rawMod('dex'),
    [abilityDelta('str'), abilityDelta('dex'), ...(lossDex ? [dexLoss] : capEntry), specialSize],
    [...cmdFromAc, ...pick(m => m.target.kind === 'cmd')],
  );

  // Initiative is a Dexterity check.
  const initiative = makeStat(rawMod('dex'), [abilityDelta('dex')],
    pick(m => m.target.kind === 'initiative' || m.target.kind === 'abilityCheck'));

  // Ability checks
  const abilityChecks = {} as Record<AbilityKey, Stat>;
  for (const a of ABILITIES) {
    abilityChecks[a] = makeStat(rawMod(a), [abilityDelta(a)], pick(m => m.target.kind === 'abilityCheck'));
  }

  // Skills
  const classSkills = new Set(char.classes.flatMap(e => getClass(e.classId)?.classSkills ?? []));
  const skills: Record<string, Stat> = {};
  for (const skill of SKILLS) {
    const data = char.skills.find(s => s.skillId === skill.id);
    const base = skillTotal(skill.id, skill.ability, rawScores[skill.ability], data?.ranks ?? 0, classSkills.has(skill.id), data?.misc ?? 0);
    skills[skill.id] = makeStat(base, [abilityDelta(skill.ability)],
      pick(m => m.target.kind === 'skill' && (m.target.skillId === 'all' || m.target.skillId === skill.id)));
  }

  // Hit points
  const negativeLevels = totalNegativeLevels(char);
  const maxHp = makeStat(maxHP(char, rawScores.con), [
    abilityDelta('con', totalLevel),
    { source: 'Livelli negativi', value: -5 * negativeLevels },
  ], []);

  // Warnings
  const warnings: string[] = [];
  const ABILITY_NAME: Record<AbilityKey, string> = {
    str: 'Forza', dex: 'Destrezza', con: 'Costituzione', int: 'Intelligenza', wis: 'Saggezza', cha: 'Carisma',
  };
  for (const a of ABILITIES) {
    if (abilityDamage[a] > 0 && abilityDamage[a] >= scores[a]) {
      warnings.push(a === 'con'
        ? `Danno a Costituzione pari o superiore al punteggio: il personaggio è morto.`
        : `Danno a ${ABILITY_NAME[a]} pari o superiore al punteggio: il personaggio è privo di sensi.`);
    }
    if (abilityDrain[a] > 0 && scores[a] <= 0) {
      warnings.push({
        str: 'Forza 0 per risucchio: il personaggio è indifeso e non può muoversi.',
        dex: 'Destrezza 0 per risucchio: il personaggio è paralizzato.',
        con: 'Costituzione 0 per risucchio: il personaggio è morto.',
        int: 'Intelligenza 0 per risucchio: il personaggio è privo di sensi.',
        wis: 'Saggezza 0 per risucchio: il personaggio è privo di sensi.',
        cha: 'Carisma 0 per risucchio: il personaggio è privo di sensi.',
      }[a]);
    }
  }
  if (negativeLevels > 0 && totalLevel > 0 && negativeLevels >= totalLevel) {
    warnings.push('Livelli negativi pari o superiori ai Dadi Vita: il personaggio è morto.');
  }

  // Armor: check penalty, arcane failure, restrictions
  const armorCheckPenalty = worn.reduce((sum, w) => sum + Math.min(0, w.armor.checkPenalty), 0);
  const arcaneSpellFailure = worn.reduce((sum, w) => sum + Math.max(0, w.armor.arcaneFailure), 0);
  const classDefs = char.classes.map(e => getClass(e.classId)).filter(c => !!c);
  const arcane = classDefs.some(c => isBuiltinClass(c) && c.spellcasting?.school === 'arcane');
  if (arcane && arcaneSpellFailure > 0) {
    warnings.push(`Fallimento incantesimi arcani ${arcaneSpellFailure}% (incantesimi con componenti somatiche).`);
  }
  for (const w of worn) {
    if (!w.proficient) {
      warnings.push(w.armor.category === 'tower'
        ? `${w.item.name}: nessuna competenza negli scudi torre, penalità di armatura anche ai tiri per colpire.`
        : `${w.item.name}: non competente, penalità di armatura ai tiri per colpire e alle prove di For e Des.`);
    }
  }
  if (char.classes.some(e => e.classId === 'druid')) {
    worn.filter(w => w.armor.metal).forEach(w => warnings.push(
      `${w.item.name} è di metallo: il druido perde incantesimi e capacità soprannaturali e magiche mentre lo indossa.`,
    ));
  }

  // Speed (race speed is stored in feet: 30 ft = 9 m)
  const race = getRace(char.race);
  const feet = race?.speed ?? 30;
  const toMeters = (ft: number) => Math.round(ft * 0.3 * 2) / 2;
  const baseSpeed = toMeters(feet);
  const bodyArmor = worn.find(w => w.item.kind === 'armor');
  const slowed = !!bodyArmor && (bodyArmor.armor.speedCategory === 'medium' || bodyArmor.armor.speedCategory === 'heavy')
    && !race?.armorSpeedUnaffected;
  // PF1 armor speed table (feet): 20→15, 30→20, 40→30, 50→35, 60→40…
  const ARMOR_SPEED_FT: Record<number, number> = { 20: 15, 30: 20, 40: 30, 50: 35, 60: 40, 70: 50, 80: 55, 90: 60, 100: 70, 110: 75, 120: 80 };
  const reducedSpeed = toMeters(ARMOR_SPEED_FT[feet] ?? Math.round((feet * 2) / 3 / 5) * 5);
  const speed = makeStat(baseSpeed, slowed && bodyArmor ? [{ source: displayName(bodyArmor.item), value: reducedSpeed - baseSpeed }] : [], []);

  // Weapon attacks
  const items = inventoryOf(char);
  const size = race?.size ?? 'Medium';
  const weaponAttack = (stored: WeaponAttack): ResolvedAttack => {
    const item = stored.itemId ? items.find(i => i.id === stored.itemId) : undefined;
    const atk: WeaponAttack = item ? { ...stored, ...attackFieldsFromItem(item, size), name: displayName(item) } : stored;
    const proficient = item ? isProficientWeapon(proficiencies, item) : true;
    const key = atk.abilityKey;
    const scope = atk.attackType;
    const ew = item ? effectiveWeapon(item) : null;
    // Enhancement (or masterwork) is a typed bonus, so it competes with other enhancement bonuses.
    const weaponAttackMods: SourcedModifier[] = item && ew && ew.attackBonus
      ? [{ source: displayName(item), type: 'enhancement', value: ew.attackBonus, target: { kind: 'attack', scope: 'all' } }] : [];
    const weaponDamageMods: SourcedModifier[] = item && ew ? [
      ...(ew.damageBonus ? [{ source: displayName(item), type: 'enhancement' as const, value: ew.damageBonus, target: { kind: 'damage' as const, scope: 'all' as const } }] : []),
      ...(ew.materialDamage ? [{ source: 'Materiale', type: 'untyped' as const, value: ew.materialDamage, target: { kind: 'damage' as const, scope: 'all' as const } }] : []),
    ] : [];
    const toHit = makeStat(
      bab + rawMod(key),
      [abilityDelta(key), ...(proficient ? [] : [{ source: 'Non competente', value: -4 }])],
      [...scopeMods('attack', scope), ...weaponAttackMods],
    );
    const twoHandedBonus = atk.twoHanded && key === 'str' && mods.str > 0 ? Math.floor(mods.str * 1.5) - mods.str : 0;
    const damage = makeStat(rawMod(key), [abilityDelta(key), { source: 'Due mani (×1,5 FOR)', value: twoHandedBonus }],
      [...scopeMods('damage', scope), ...weaponDamageMods]);
    return {
      attack: atk, toHit, damage, critRange: atk.critRange ?? 20, critMult: atk.critMult ?? 2, proficient, linked: !!item,
      extraDice: ew?.extraDice ?? [], notes: ew?.notes ?? [],
    };
  };

  const seenNotes = new Set<string>();
  const attackNotes = (char.conditions ?? []).flatMap(c => {
    const def = getCondition(c.conditionId);
    if (!def?.attackNote || seenNotes.has(def.id)) return [];
    seenNotes.add(def.id);
    return [`${def.name}: ${def.attackNote}`];
  });

  return {
    rawScores, scores, mods, abilityDamage, abilityDrain, abilityStats, bab, saves,
    attack, attackMods, damageMods, ac, touch, flatFooted, cmb, cmd, initiative,
    skills, abilityChecks, maxHp, negativeLevels, losesDexToAC: lossDex, attackNotes, warnings,
    speed, armorCheckPenalty, arcaneSpellFailure, proficiencies, weaponAttack,
  };
}
