import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';

vi.mock('../lib/firebase', () => ({ auth: { currentUser: null }, db: {} }));
vi.mock('../lib/firestoreSync', () => ({ saveCharacter: vi.fn(), deleteCharacterDoc: vi.fn(), loadCharacters: vi.fn() }));

import type { Character } from '../types';
import { StatusPanel } from '../components/sheet/StatusPanel';
import { StatusChips } from '../components/sheet/StatusChips';
import { CombatStats, HitPointsPanel } from '../components/sheet/CombatStats';
import { AttacksPanel } from '../components/sheet/AttacksPanel';
import { AbilityPanel } from '../components/sheet/AbilityPanel';
import { SkillsPanel } from '../components/sheet/SkillsPanel';
import { getEffectPreset } from '../data/effectPresets';

const p = getEffectPreset('ingrandire-persona')!;
const char = {
  id: 'c1', name: 'Valeros', race: 'human', racialAbilityBonus: { str: 2 }, alignment: 'NG',
  baseAbilityScores: { str: 14, dex: 14, con: 14, int: 10, wis: 12, cha: 8 }, abilityIncreases: [],
  classes: [{ classId: 'fighter', level: 5, favoredClassBonus: [] }], totalLevel: 5,
  hitPointsRolled: [10, 6, 7, 5, 8], currentHp: 40, tempHp: 0, nonLethalDamage: 0,
  skills: [{ skillId: 'climb', ranks: 3, misc: 0 }], feats: [], traits: [],
  knownSpells: [], preparedSpells: [], spellSlots: [],
  weaponAttacks: [{ id: 'w', name: 'Spada lunga', damageDiceCount: 1, damageDieType: 8, abilityKey: 'str', attackType: 'melee' }],
  equipment: [], copper: 0, silver: 0, gold: 0, platinum: 0, experience: 0, notes: '',
  conditions: [{ id: 'k', conditionId: 'scosso' }],
  effects: [{ id: 'e', name: p.name, modifiers: p.modifiers }],
  abilityDamage: { con: 3 }, abilityDrain: { wis: 2 }, negativeLevels: { temporary: 1, permanent: 0 },
} as unknown as Character;

describe('sheet panels render with active status', () => {
  it.each([
    ['StatusPanel', () => <StatusPanel char={char} />, 'Condizioni ed effetti'],
    ['StatusChips', () => <StatusChips char={char} />, 'Scosso'],
    ['HitPointsPanel', () => <HitPointsPanel char={char} />, 'Riposo Completo'],
    ['CombatStats', () => <CombatStats char={char} />, 'Colto di sorpresa'],
    ['AttacksPanel', () => <AttacksPanel char={char} />, 'Spada lunga'],
    ['AbilityPanel', () => <AbilityPanel char={char} />, '−3 dan.'],
    ['SkillsPanel', () => <SkillsPanel char={char} />, 'is-debuffed'],
  ])('%s', (_name, render, expected) => {
    const html = renderToString(render()).replace(/<!-- -->/g, '');
    expect(html).toContain(expected);
  });
});
