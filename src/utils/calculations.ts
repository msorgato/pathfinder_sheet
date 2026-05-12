import type { Character, CharacterClassEntry, AbilityKey } from '../types';
import { getClass } from '../data/classes';
import { getRace } from '../data/races';
import { getBonusSpells } from '../data/spellSlots';
import { getAgeCategory, AGE_MODIFIERS } from '../data/ageModifiers';

// ── Ability modifier ─────────────────────────────────────────────────────────
export function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function modStr(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

// ── Effective ability scores (base + fixed racial + selectable racial + increases + age) ─
export function effectiveAbilityScores(char: Character): Record<AbilityKey, number> {
  const result = { ...char.baseAbilityScores };

  // Fixed racial modifiers (e.g. Elf: DEX+2, INT+2, CON-2)
  const race = getRace(char.race);
  if (race) {
    (Object.keys(race.abilityModifiers) as AbilityKey[]).forEach(k => {
      result[k] += (race.abilityModifiers[k] ?? 0);
    });
  }

  // Selectable racial bonus (e.g. Human: +2 to chosen stat)
  const racialBonus = char.racialAbilityBonus ?? {};
  (Object.keys(racialBonus) as AbilityKey[]).forEach(k => {
    result[k] += racialBonus[k] ?? 0;
  });

  char.abilityIncreases.forEach(inc => {
    (Object.keys(inc) as AbilityKey[]).forEach(k => {
      result[k] += inc[k] ?? 0;
    });
  });
  if (char.age) {
    const cat = getAgeCategory(char.race, char.age);
    if (cat) {
      const mods = AGE_MODIFIERS[cat];
      (Object.keys(mods) as AbilityKey[]).forEach(k => {
        result[k] += mods[k] ?? 0;
      });
    }
  }
  return result;
}

// ── BAB ──────────────────────────────────────────────────────────────────────
export function classBAB(classId: string, classLevel: number): number {
  const cls = getClass(classId);
  if (!cls) return 0;
  if (cls.bab === 'full') return classLevel;
  if (cls.bab === 'three-quarters') return Math.floor((classLevel * 3) / 4);
  return Math.floor(classLevel / 2);
}

export function totalBAB(classes: CharacterClassEntry[]): number {
  return classes.reduce((sum, e) => sum + classBAB(e.classId, e.level), 0);
}

export function attackChain(bab: number): number[] {
  if (bab <= 0) return [0];
  const chain: number[] = [];
  for (let b = bab; b > 0 && chain.length < 4; b -= 5) chain.push(b);
  return chain;
}

// ── Saving throws ────────────────────────────────────────────────────────────
function goodSave(level: number): number { return 2 + Math.floor(level / 2); }
function poorSave(level: number): number { return Math.floor(level / 3); }

export function totalSave(
  save: 'fort' | 'ref' | 'will',
  classes: CharacterClassEntry[],
): number {
  let hasGood = false;
  let total = 0;
  classes.forEach(e => {
    const cls = getClass(e.classId);
    if (!cls) return;
    const prog = cls.saves[save];
    if (prog === 'good') hasGood = true;
    total += prog === 'good' ? goodSave(e.level) : poorSave(e.level);
  });
  // When multiclassing, the +2 bonus for a good save is counted once per base class
  // PF1e: simply sum the individual class saves (which already include the +2 for good saves)
  // but we should NOT double-count the initial +2; the standard approach is each class
  // contributes its own progression independently.
  return total;
}

// ── Hit points ────────────────────────────────────────────────────────────────
export function maxHP(char: Character, conScore: number): number {
  const conMod = abilityMod(conScore);
  const totalLevel = char.classes.reduce((s, e) => s + e.level, 0);
  const base = char.hitPointsRolled.reduce((s, r) => s + r, 0);
  return base + conMod * totalLevel;
}

// ── Initiative ────────────────────────────────────────────────────────────────
export function initiative(dexScore: number): number {
  return abilityMod(dexScore);
}

// ── Skill total ───────────────────────────────────────────────────────────────
export function skillTotal(
  skillId: string,
  ability: AbilityKey,
  abilityScore: number,
  ranks: number,
  isClassSkill: boolean,
  misc: number = 0,
): number {
  const base = abilityMod(abilityScore) + ranks + misc;
  const csBonus = isClassSkill && ranks > 0 ? 3 : 0;
  return base + csBonus;
}

// ── Spell slots ────────────────────────────────────────────────────────────────
export function computeSpellSlots(
  classId: string,
  classLevel: number,
  abilityScore: number,
): { level: number; base: number; bonus: number; total: number }[] {
  const cls = getClass(classId);
  if (!cls?.spellcasting) return [];

  const slotTable = cls.spellcasting.slots[classLevel];
  if (!slotTable) return [];

  const bonusArr = getBonusSpells(abilityScore);
  const results = [];

  for (let sl = 0; sl <= 9; sl++) {
    const base = slotTable[sl] ?? -1;
    if (base < 0) continue;
    const bonus = cls.spellcasting.bonusSpellsFromAbility ? (bonusArr[sl] ?? 0) : 0;
    results.push({ level: sl, base, bonus, total: base + bonus });
  }
  return results;
}

// ── Caster level ─────────────────────────────────────────────────────────────
export function casterLevel(classId: string, classes: CharacterClassEntry[]): number {
  const entry = classes.find(e => e.classId === classId);
  return entry?.level ?? 0;
}

// ── Ability increase levels ───────────────────────────────────────────────────
export function abilityIncreaseLevels(): number[] {
  return [4, 8, 12, 16, 20];
}

export function featLevels(): number[] {
  return [1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
}

// ── Armor class ──────────────────────────────────────────────────────────────
export function armorClass(dexScore: number, armorBonus = 0, shieldBonus = 0, naturalArmor = 0, deflection = 0, misc = 0): number {
  return 10 + abilityMod(dexScore) + armorBonus + shieldBonus + naturalArmor + deflection + misc;
}

// ── Spell DC ─────────────────────────────────────────────────────────────────
export function spellDC(spellLevel: number, abilityScore: number): number {
  return 10 + spellLevel + abilityMod(abilityScore);
}

// ── Spells known for spontaneous casters ─────────────────────────────────────
export function spellsKnownAtLevel(classId: string, classLevel: number): number[] {
  const cls = getClass(classId);
  if (!cls?.spellcasting?.spellsKnown) return [];
  return cls.spellcasting.spellsKnown[classLevel] ?? [];
}
