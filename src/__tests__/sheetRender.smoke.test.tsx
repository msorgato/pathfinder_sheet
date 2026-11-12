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
import { ModifierRows } from '../components/sheet/ModifierRows';
import { ItemEditor } from '../components/sheet/ItemEditor';
import { EquipmentPanel } from '../components/sheet/EquipmentPanel';
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

describe('equipment renders', () => {
  const sword = {
    id: 'it1', name: 'Spadone', quantity: 1, notes: '', equipped: false, catalogId: 'spadone', kind: 'weapon', priceGp: 50, weightKg: 4,
    weapon: { group: 'martial', handedness: 'two-handed', damage: { small: { count: 1, die: 10 }, medium: { count: 2, die: 6 } },
      critRange: 19, critMult: 2, damageTypes: ['T'], special: [] },
  };
  const mail = {
    id: 'it2', name: 'Cotta di Maglia', quantity: 1, notes: '', equipped: true, catalogId: 'cotta-di-maglia', kind: 'armor', slot: 'armor',
    priceGp: 150, weightKg: 20, armor: { category: 'medium', bonus: 6, maxDex: 2, checkPenalty: -5, arcaneFailure: 30, metal: true },
  };
  const equipped = {
    ...char, gold: 12, equipment: [sword, mail],
    weaponAttacks: [{ id: 'a1', name: 'old', damageDiceCount: 1, damageDieType: 4, abilityKey: 'str', attackType: 'melee', itemId: 'it1' }],
  } as unknown as Character;
  const legacy = { ...char, equipment: [{ id: 'l', name: 'Corda', type: 'gear', weight: 5, value: 1, quantity: 1, notes: '', equipped: false }] } as unknown as Character;
  const empty = { ...char, equipment: undefined } as unknown as Character;

  it.each([
    ['empty inventory', () => <EquipmentPanel char={empty} />, 'Libero'],
    ['slot labels', () => <EquipmentPanel char={equipped} />, 'Anello 2'],
    ['legacy item', () => <EquipmentPanel char={legacy} />, 'Corda'],
    ['worn armor', () => <EquipmentPanel char={equipped} />, 'Cotta di Maglia'],
    ['speed reduced', () => <CombatStats char={equipped} />, '6<span style="font-size:14px"> m'],
    ['read-only', () => <EquipmentPanel char={equipped} readOnly />, 'Monete'],
    ['linked attack (For 18 with Ingrandire persona: +4 × 1,5)', () => <AttacksPanel char={equipped} />, '2d6+6'],
    ['critical shown', () => <AttacksPanel char={equipped} />, '19–20/×2'],
  ])('%s', (_name, render, expected) => {
    const html = renderToString(render()).replace(/<!-- -->/g, '');
    expect(html).toContain(expected);
  });

  it('marks items beyond the slot capacity', () => {
    const amulet = (id: string, name: string) => ({ id, name, quantity: 1, notes: '', equipped: true, kind: 'gear', slot: 'neck' });
    const c = { ...char, equipment: [amulet('n1', 'Amuleto A'), amulet('n2', 'Amuleto B')] } as unknown as Character;
    const html = renderToString(<EquipmentPanel char={c} />).replace(/<!-- -->/g, '');
    expect(html).toContain('Amuleto A');
    expect(html).toContain('non attivo');
  });

  it('shows enhancement in the name, effects, and the third ring as inactive', () => {
    const ring = (id: string, n: number) => ({
      id, name: 'Anello ' + id, quantity: 1, notes: '', equipped: true, kind: 'magic', slot: 'ring',
      modifiers: [{ target: { kind: 'ac' }, type: 'deflection', value: n }],
    });
    const blade = {
      id: 'b', name: 'Spada Lunga', quantity: 1, notes: '', equipped: false, kind: 'weapon', slot: 'none', weightKg: 2,
      enhancement: 1, abilities: ['infuocata', 'affilata'],
      weapon: { group: 'martial', handedness: 'one-handed', damage: { small: { count: 1, die: 6 }, medium: { count: 1, die: 8 } },
        critRange: 19, critMult: 2, damageTypes: ['T'], special: [] },
    };
    const c = { ...char, equipment: [ring('a', 1), ring('b', 2), ring('c', 3), blade] } as unknown as Character;
    const html = renderToString(<EquipmentPanel char={c} />).replace(/<!-- -->/g, '');
    expect(html).toContain('Spada Lunga +1 Infuocata Affilata');
    expect(html).toContain('17–20/×2');
    expect(html).toContain('+2 deviazione');
    expect(html).not.toContain('+3 deviazione'); // the third ring is inactive: its effects are not listed
    expect(html).toContain('non attivo');
  });

  it('read-only hides editing controls', () => {
    const html = renderToString(<EquipmentPanel char={equipped} readOnly />);
    expect(html).not.toContain('Dal catalogo');
    expect(html).not.toContain('aria-label="Rimuovi');
  });
});

describe('shared modifier rows', () => {
  it('renders value, type and target for each modifier', () => {
    const html = renderToString(
      <ModifierRows
        value={[{ target: { kind: 'save', save: 'all' }, type: 'resistance', value: 2 }]}
        onChange={() => undefined}
      />,
    ).replace(/<!-- -->/g, '');
    expect(html).toContain('aria-label="Valore"');
    expect(html).toContain('resistenza');
    expect(html).toContain('Tutti i tiri salvezza');
    expect(html).toContain('+ Modificatore');
  });
});

describe('item editor magic section', () => {
  const longsword = {
    name: 'Spada Lunga', quantity: 1, notes: '', equipped: false, kind: 'weapon', slot: 'none', priceGp: 2315, basePriceGp: 15, weightKg: 2,
    enhancement: 1, abilities: ['infuocata'],
    weapon: { group: 'martial', handedness: 'one-handed', damage: { small: { count: 1, die: 6 }, medium: { count: 1, die: 8 } },
      critRange: 19, critMult: 2, damageTypes: ['T'], special: [] },
  } as unknown as Parameters<typeof ItemEditor>[0]['initial'];
  const rope = { name: 'Corda', quantity: 1, notes: '', equipped: false, kind: 'gear', slot: 'none', priceGp: 1, weightKg: 5 };

  it('shows enhancement, material, abilities and the computed price for a weapon', () => {
    const html = renderToString(<ItemEditor title="Modifica" initial={longsword} onSave={() => undefined} onClose={() => undefined} />)
      .replace(/<!-- -->/g, '');
    expect(html).toContain('Magia e materiali');
    expect(html).toContain('Potenziamento');
    expect(html).toContain('Infuocata');
    expect(html).toContain('bonus totale +2 / +10');
    expect(html).toContain('value="2315"');
    expect(html).toContain('Effetti quando indossato');
  });

  it('has no magic section for plain gear, but still allows effects', () => {
    const html = renderToString(<ItemEditor title="Modifica" initial={rope as never} onSave={() => undefined} onClose={() => undefined} />);
    expect(html).not.toContain('Magia e materiali');
    expect(html).toContain('Effetti quando indossato');
  });
});

describe('magic weapon in the attacks panel', () => {
  const flaming = {
    id: 'f1', name: 'Spada Lunga', quantity: 1, notes: '', equipped: true, kind: 'weapon', slot: 'none', weightKg: 2,
    enhancement: 1, abilities: ['infuocata'], material: 'cold-iron',
    weapon: { group: 'martial', handedness: 'one-handed', damage: { small: { count: 1, die: 6 }, medium: { count: 1, die: 8 } },
      critRange: 19, critMult: 2, damageTypes: ['T'], special: [] },
  };
  const c = {
    ...char, equipment: [flaming],
    weaponAttacks: [{ id: 'a1', name: 'old', damageDiceCount: 1, damageDieType: 4, abilityKey: 'str', attackType: 'melee', itemId: 'f1' }],
  } as unknown as Character;

  it('shows the extra dice as a separate badge, the notes and the enhanced damage', () => {
    const html = renderToString(<AttacksPanel char={c} onQuickRoll={() => undefined} />).replace(/<!-- -->/g, '');
    expect(html).toContain('+1d6 fuoco');
    expect(html).toContain('Ferro freddo: supera la RD/ferro freddo');
    expect(html).toContain('Spada Lunga +1 Infuocata in Ferro freddo');
    expect(html).toContain('1d8+5'); // Str 18 (+4) with Ingrandire persona, +1 enhancement
  });
});
