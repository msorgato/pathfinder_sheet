import { describe, it, expect } from 'vitest';
import type { ActiveEffect, Character, Modifier } from '../types';
import { deriveStats, stack } from '../utils/derivedStats';
import {
  abilityMod, effectiveAbilityScores, maxHP, skillTotal, totalBAB, totalSave,
} from '../utils/calculations';
import { getEffectPreset } from '../data/effectPresets';

/** 5th-level human fighter, STR 16 DEX 14 CON 14 INT 10 WIS 12 CHA 8. */
function fighter(overrides: Partial<Character> = {}): Character {
  return {
    id: 'c1',
    name: 'Valeros',
    race: 'human',
    racialAbilityBonus: { str: 2 },
    alignment: 'NG',
    baseAbilityScores: { str: 14, dex: 14, con: 14, int: 10, wis: 12, cha: 8 },
    abilityIncreases: [],
    classes: [{ classId: 'fighter', level: 5, favoredClassBonus: [] }],
    totalLevel: 5,
    hitPointsRolled: [10, 6, 7, 5, 8],
    currentHp: 48,
    tempHp: 0,
    nonLethalDamage: 0,
    skills: [{ skillId: 'climb', ranks: 3, misc: 1 }, { skillId: 'perception', ranks: 2, misc: 0 }],
    feats: [],
    traits: [],
    knownSpells: [],
    preparedSpells: [],
    spellSlots: [],
    weaponAttacks: [],
    equipment: [],
    copper: 0, silver: 0, gold: 0, platinum: 0,
    experience: 0,
    notes: '',
    ...overrides,
  } as Character;
}

const effect = (name: string, modifiers: Modifier[], extra: Partial<ActiveEffect> = {}): ActiveEffect =>
  ({ id: name, name, modifiers, ...extra });
const presetEffect = (id: string): ActiveEffect => {
  const p = getEffectPreset(id)!;
  return effect(p.name, p.modifiers, { presetId: id });
};
const cond = (conditionId: string) => ({ id: conditionId, conditionId });

describe('deriveStats — no modifiers matches the existing calculations', () => {
  const char = fighter();
  const d = deriveStats(char);
  const scores = effectiveAbilityScores(char);
  const bab = totalBAB(char.classes);
  const m = (k: keyof typeof scores) => abilityMod(scores[k]);

  it('ability scores and modifiers', () => {
    expect(d.scores).toEqual(scores);
    expect(d.mods.str).toBe(m('str'));
  });

  it('saves, attacks, CMB, CMD, initiative, AC', () => {
    expect(d.saves.fort.total).toBe(totalSave('fort', char.classes) + m('con'));
    expect(d.saves.ref.total).toBe(totalSave('ref', char.classes) + m('dex'));
    expect(d.saves.will.total).toBe(totalSave('will', char.classes) + m('wis'));
    expect(d.attack.melee.total).toBe(bab + m('str'));
    expect(d.attack.ranged.total).toBe(bab + m('dex'));
    expect(d.cmb.total).toBe(bab + m('str'));
    expect(d.cmd.total).toBe(10 + bab + m('str') + m('dex'));
    expect(d.initiative.total).toBe(m('dex'));
    expect(d.ac.total).toBe(10 + m('dex'));
    expect(d.touch.total).toBe(10 + m('dex'));
    expect(d.flatFooted.total).toBe(10);
  });

  it('skills and max HP', () => {
    expect(d.skills.climb.total).toBe(skillTotal('climb', 'str', scores.str, 3, true, 1));
    expect(d.skills.perception.total).toBe(skillTotal('perception', 'wis', scores.wis, 2, false, 0));
    expect(d.maxHp.total).toBe(maxHP(char, scores.con));
  });

  it('every value is equal to its base and has no entries', () => {
    for (const s of [d.saves.will, d.attack.melee, d.ac, d.cmd, d.maxHp, d.skills.climb]) {
      expect(s.total).toBe(s.base);
      expect(s.applied).toEqual([]);
    }
    expect(d.warnings).toEqual([]);
  });
});

describe('stacking rules', () => {
  const src = (value: number, type: Modifier['type'], source = 'x') =>
    ({ source, value, type, target: { kind: 'attack', scope: 'all' } as const });

  it('same-type bonuses do not stack, highest wins', () => {
    const { applied, suppressed } = stack([src(1, 'morale', 'Benedizione'), src(2, 'morale', 'Eroismo')]);
    expect(applied).toEqual([{ source: 'Eroismo', type: 'morale', value: 2 }]);
    expect(suppressed).toEqual([{ source: 'Benedizione', type: 'morale', value: 1 }]);
  });

  it('dodge, circumstance and untyped bonuses stack', () => {
    const total = stack([src(1, 'dodge'), src(1, 'dodge'), src(2, 'untyped'), src(2, 'untyped')])
      .applied.reduce((s, e) => s + e.value, 0);
    expect(total).toBe(6);
  });

  it('penalties always stack, even of the same type', () => {
    const total = stack([src(-1, 'morale'), src(-2, 'morale'), src(-2, 'untyped')])
      .applied.reduce((s, e) => s + e.value, 0);
    expect(total).toBe(-5);
  });
});

describe('effects on the sheet', () => {
  it('Benedizione and Eroismo give +2, Benedizione and Preghiera give +2', () => {
    const base = deriveStats(fighter()).attack.melee.total;
    expect(deriveStats(fighter({ effects: [presetEffect('benedizione'), presetEffect('eroismo')] })).attack.melee.total).toBe(base + 2);
    expect(deriveStats(fighter({ effects: [presetEffect('benedizione'), presetEffect('preghiera-alleati')] })).attack.melee.total).toBe(base + 2);
  });

  it('broader targets stack with narrower ones by type', () => {
    const d = deriveStats(fighter({
      effects: [
        effect('Resistenza', [{ target: { kind: 'save', save: 'all' }, type: 'resistance', value: 1 }]),
        effect('Mantello', [{ target: { kind: 'save', save: 'will' }, type: 'resistance', value: 2 }]),
      ],
    }));
    expect(d.saves.will.total - d.saves.will.base).toBe(2);
    expect(d.saves.fort.total - d.saves.fort.base).toBe(1);
  });

  it('ability enhancement propagates to attack and CMB', () => {
    const before = deriveStats(fighter());
    const after = deriveStats(fighter({ effects: [presetEffect('forza-del-toro')] }));
    expect(after.scores.str).toBe(before.scores.str + 4);
    expect(after.attack.melee.total).toBe(before.attack.melee.total + 2);
    expect(after.cmb.total).toBe(before.cmb.total + 2);
  });

  it('Ingrandire persona: STR +2, DEX −2, attack −1, AC −1, CMB uses special size', () => {
    const before = deriveStats(fighter());
    const after = deriveStats(fighter({ effects: [presetEffect('ingrandire-persona')] }));
    expect(after.scores.str).toBe(before.scores.str + 2);
    expect(after.scores.dex).toBe(before.scores.dex - 2);
    expect(after.attack.melee.total).toBe(before.attack.melee.total + 1 - 1); // +1 STR mod, −1 size
    expect(after.ac.total).toBe(before.ac.total - 1 - 1); // −1 DEX mod, −1 size
    expect(after.cmb.total).toBe(before.cmb.total + 1 + 1); // +1 STR mod, +1 special size
  });

  it('disabled effects do not apply', () => {
    const base = deriveStats(fighter()).attack.melee.total;
    const d = deriveStats(fighter({ effects: [{ ...presetEffect('benedizione'), disabled: true }] }));
    expect(d.attack.melee.total).toBe(base);
  });
});

describe('conditions', () => {
  it('Scosso: −2 to attack, saves, skills, initiative and CMB', () => {
    const b = deriveStats(fighter());
    const d = deriveStats(fighter({ conditions: [cond('scosso')] }));
    expect(d.attack.melee.total).toBe(b.attack.melee.total - 2);
    expect(d.saves.will.total).toBe(b.saves.will.total - 2);
    expect(d.skills.climb.total).toBe(b.skills.climb.total - 2);
    expect(d.initiative.total).toBe(b.initiative.total - 2);
    expect(d.cmb.total).toBe(b.cmb.total - 2);
  });

  it('fear conditions apply once', () => {
    const b = deriveStats(fighter());
    const d = deriveStats(fighter({ conditions: [cond('scosso'), cond('impaurito')] }));
    expect(d.attack.melee.total).toBe(b.attack.melee.total - 2);
  });

  it('Scosso and Anatema stack to −3', () => {
    const b = deriveStats(fighter());
    const d = deriveStats(fighter({ conditions: [cond('scosso')], effects: [presetEffect('anatema')] }));
    expect(d.attack.melee.total).toBe(b.attack.melee.total - 3);
  });

  it('Impreparato loses DEX and dodge bonuses on AC and CMD', () => {
    const b = deriveStats(fighter({ effects: [presetEffect('velocita')] }));
    const d = deriveStats(fighter({ effects: [presetEffect('velocita')], conditions: [cond('impreparato')] }));
    expect(b.mods.dex).toBe(2);
    expect(d.ac.total).toBe(b.ac.total - 2 - 1);
    expect(d.cmd.total).toBe(b.cmd.total - 2 - 1);
    expect(d.losesDexToAC).toBe(true);
  });

  it('Prono only affects melee attacks', () => {
    const b = deriveStats(fighter());
    const d = deriveStats(fighter({ conditions: [cond('prono')] }));
    expect(d.attack.melee.total).toBe(b.attack.melee.total - 4);
    expect(d.attack.ranged.total).toBe(b.attack.ranged.total);
  });

  it('Accecato reports its miss chance on attacks without changing the bonus', () => {
    const b = deriveStats(fighter());
    const d = deriveStats(fighter({ conditions: [cond('accecato')] }));
    expect(d.attack.melee.total).toBe(b.attack.melee.total);
    expect(d.attackNotes).toEqual(['Accecato: 50% di probabilità di mancare']);
    expect(b.attackNotes).toEqual([]);
  });

  it('Affaticato lowers STR and DEX scores', () => {
    const b = deriveStats(fighter());
    const d = deriveStats(fighter({ conditions: [cond('affaticato')] }));
    expect(d.scores.str).toBe(b.scores.str - 2);
    expect(d.scores.dex).toBe(b.scores.dex - 2);
  });
});

describe('ability damage and drain', () => {
  it('damage lowers the modifier (−1 every 2 points), not the score', () => {
    const b = deriveStats(fighter());
    const d = deriveStats(fighter({ abilityDamage: { str: 3 } }));
    expect(d.scores.str).toBe(b.scores.str);
    expect(d.mods.str).toBe(b.mods.str - 1);
    expect(d.attack.melee.total).toBe(b.attack.melee.total - 1);
  });

  it('CON damage lowers max HP', () => {
    const b = deriveStats(fighter());
    const d = deriveStats(fighter({ abilityDamage: { con: 2 } }));
    expect(d.maxHp.total).toBe(b.maxHp.total - 5);
  });

  it('drain lowers the score', () => {
    const b = deriveStats(fighter());
    const d = deriveStats(fighter({ abilityDrain: { wis: 4 } }));
    expect(d.scores.wis).toBe(b.scores.wis - 4);
    expect(d.saves.will.total).toBe(b.saves.will.total - 2);
  });

  it('warns when CON damage reaches the score', () => {
    const d = deriveStats(fighter({ abilityDamage: { con: 14 } }));
    expect(d.warnings.some(w => w.includes('morto'))).toBe(true);
  });
});

describe('negative levels', () => {
  it('−1 per level to attack, saves, skills, CMB, CMD and −5 max HP', () => {
    const b = deriveStats(fighter());
    const d = deriveStats(fighter({ negativeLevels: { temporary: 1, permanent: 1 } }));
    expect(d.attack.melee.total).toBe(b.attack.melee.total - 2);
    expect(d.saves.fort.total).toBe(b.saves.fort.total - 2);
    expect(d.skills.perception.total).toBe(b.skills.perception.total - 2);
    expect(d.cmb.total).toBe(b.cmb.total - 2);
    expect(d.cmd.total).toBe(b.cmd.total - 2);
    expect(d.maxHp.total).toBe(b.maxHp.total - 10);
  });

  it('warns when negative levels reach the character level', () => {
    expect(deriveStats(fighter({ negativeLevels: { temporary: 5, permanent: 0 } })).warnings)
      .toContain('Livelli negativi pari o superiori ai Dadi Vita: il personaggio è morto.');
  });
});
