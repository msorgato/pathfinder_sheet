import type { AbilityKey, BonusType, Character, Modifier, SaveKey } from '../types';
import { getCondition } from '../data/conditions';
import { SKILLS } from '../data/skills';
import { getClass } from '../data/classes';
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

export function totalNegativeLevels(char: Pick<Character, 'negativeLevels'>): number {
  const nl = char.negativeLevels;
  return Math.max(0, (nl?.temporary ?? 0) + (nl?.permanent ?? 0));
}

/** All active modifiers with their source name (conditions, enabled effects, negative levels). */
export function collectModifiers(char: Character): SourcedModifier[] {
  const out: SourcedModifier[] = [];
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
  const all = collectModifiers(char);
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
  const acBase = 10 + rawMod('dex');
  const ac = makeStat(acBase, [abilityDelta('dex'), ...(lossDex ? [dexLoss] : [])], lossDex ? withoutTypes(acMods, ['dodge']) : acMods);
  const touch = makeStat(acBase, [abilityDelta('dex'), ...(lossDex ? [dexLoss] : [])],
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
    [abilityDelta('str'), abilityDelta('dex'), ...(lossDex ? [dexLoss] : []), specialSize],
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
  };
}
