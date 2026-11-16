import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';

vi.mock('../lib/firebase', () => ({ auth: { currentUser: null }, db: {} }));
// Server rendering reads the initial store state, so the merged spells are provided here.
const { mockSpells } = vi.hoisted(() => ({ mockSpells: [] as unknown[] }));
vi.mock('../store/dataStore', async importActual => ({
  ...(await importActual<typeof import('../store/dataStore')>()),
  useMergedSpells: () => mockSpells,
}));
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
import { ConsumablesSection } from '../components/sheet/ConsumablesSection';
import { createSpellItem, refreshSpellItem } from '../utils/spellConsumables';
import { SpellsPanel } from '../components/sheet/SpellsPanel';
import { Step6_Spells } from '../components/wizard/Step6_Spells';
import { useDataStore } from '../store/dataStore';
import { CustomClassEditor } from '../components/admin/CustomClassEditor';
import { RollReveal } from '../components/sheet/RollReveal';
import { DiceRoller } from '../components/sheet/DiceRoller';
import { CharacterCustomizationPanel } from '../components/sheet/CharacterCustomizationPanel';
import type { RevealData } from '../utils/rollReveal';

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

describe('spell consumables render', () => {
  const potion = createSpellItem({ id: 'scudo_della_fede', name: 'Scudo della Fede' }, 'potion', 'cleric', 1, 6, 2);
  const wand = createSpellItem({ id: 'cura_ferite_leggere', name: 'Cura Ferite Leggere' }, 'wand', 'cleric', 1, 1, 37);
  const spent = refreshSpellItem(wand, { charges: 0 });
  const withItems = (...inputs: Array<ReturnType<typeof createSpellItem>>) => ({
    ...char, equipment: inputs.map((i, n) => ({ ...i, id: `c${n}` })),
  }) as unknown as Character;
  const html = (el: React.ReactElement) => renderToString(el).replace(/<!-- -->/g, '');

  it('shows charges, usability and the item DC in the inventory', () => {
    const out = html(<EquipmentPanel char={withItems(wand)} />);
    expect(out).toContain('37/50');
    expect(out).toContain('Utilizzare Congegni Magici CD 20');
    expect(out).toContain('CD oggetto 11');
    expect(out).toContain('+ Pozione / pergamena / bacchetta');
  });

  it('marks an empty wand as scarica with a disabled Usa', () => {
    const out = html(<ConsumablesSection char={withItems(spent)} />);
    expect(out).toContain('scarica');
    expect(out).toMatch(/<button[^>]*disabled[^>]*>Usa<\/button>/);
  });

  it('the combat section lists consumables with a Usa button, and is hidden without them', () => {
    const out = html(<ConsumablesSection char={withItems(potion)} />);
    expect(out).toContain('Pozione di Scudo della Fede (LI 6)');
    expect(out).toContain('×2');
    expect(out).toContain('>Usa</button>');
    expect(html(<ConsumablesSection char={withItems()} />)).toBe('');
  });

  it('read-only views list consumables without Usa', () => {
    expect(html(<ConsumablesSection char={withItems(potion)} readOnly />)).not.toContain('>Usa<');
    expect(html(<EquipmentPanel char={withItems(potion)} readOnly />)).not.toContain('>Usa<');
  });

  it('the editor of a consumable is the reduced one', () => {
    const out = html(<ItemEditor title="Modifica" initial={wand} onSave={() => {}} onClose={() => {}} />);
    expect(out).toContain('Livello incantatore');
    expect(out).toContain('Cariche');
    expect(out).not.toContain('Slot');
  });
});

describe('roll reveal renders', () => {
  const html = (el: React.ReactElement) => renderToString(el).replace(/<!-- -->/g, '');
  const data = (over: Partial<RevealData> = {}): RevealData => ({
    id: 'r', label: 'Tempra', dice: [14], dieType: 20, modifier: 5, total: 19,
    parts: [{ label: 'Base', value: 4 }, { label: 'Mantello della Resistenza +1', value: 1 }], ...over,
  });

  it('starts spinning, with a d20 shape and no total yet', () => {
    const out = html(<RollReveal data={data()} onClose={() => {}} reducedMotion={false} />);
    expect(out).toContain('is-spinning');
    expect(out).toContain('50,4 92,27 92,73 50,96 8,73 8,27');
    expect(out).not.toContain('roll-reveal-total is-shown');
    expect(out).not.toContain('class="reveal-bonus');
  });

  it('with reduced motion it shows the final state at once', () => {
    const out = html(<RollReveal data={data()} onClose={() => {}} reducedMotion />);
    expect(out).toContain('roll-reveal-total is-shown');
    expect(out).toContain('+4');
    expect(out).toContain('Mantello della Resistenza +1');
    expect(out).toContain('Tempra: 19');
    expect(out).not.toContain('is-spinning');
  });

  it('shows critical, threat and fumble', () => {
    expect(html(<RollReveal data={data({ dice: [20], total: 25 })} onClose={() => {}} reducedMotion />)).toContain('CRITICO!');
    expect(html(<RollReveal data={data({ dice: [19], total: 24, critRange: 19 })} onClose={() => {}} reducedMotion />)).toContain('Minaccia');
    expect(html(<RollReveal data={data({ dice: [1], total: 6 })} onClose={() => {}} reducedMotion />)).toContain('FUMBLE!');
    expect(html(<RollReveal data={data({ dice: [19], total: 24 })} onClose={() => {}} reducedMotion />)).not.toContain('Minaccia');
  });

  it('draws no dice above five, only the values', () => {
    const out = html(<RollReveal data={data({ dice: [1, 2, 3, 4, 5, 6, 3, 2, 1, 6], dieType: 6, parts: undefined, modifier: 0, total: 33 })} onClose={() => {}} reducedMotion={false} />);
    expect(out).not.toContain('<svg');
    expect(out).toContain('dice-value-chip');
  });

  it('inconsistent parts show a single unnamed modifier', () => {
    const out = html(<RollReveal data={data({ parts: [{ label: 'Base', value: 1 }] })} onClose={() => {}} reducedMotion />);
    expect(out).toContain('+5');
    expect(out).not.toContain('Base');
  });

  it('the dice panel shows no overlay before a roll', () => {
    expect(html(<DiceRoller open onClose={() => {}} onPendingHandled={() => {}} />)).not.toContain('roll-reveal');
  });
});

describe('dice animations setting', () => {
  const html = (el: React.ReactElement) => renderToString(el).replace(/<!-- -->/g, '');
  const props = { onChangeColor: () => {}, onChangeIcon: () => {}, onChangeDiceAnimations: () => {}, onDelete: () => {}, onClose: () => {} };
  it('is checked by default and unchecked when disabled', () => {
    expect(html(<CharacterCustomizationPanel {...props} />)).toMatch(/<input type="checkbox" checked=""[^>]*\/>\s*Animazioni dei dadi/);
    expect(html(<CharacterCustomizationPanel {...props} diceAnimations={false} />)).not.toMatch(/checked=""[^>]*\/>\s*Animazioni dei dadi/);
  });
});

describe('custom spellcasting classes render like built-in ones', () => {
  const html = (el: React.ReactElement) => renderToString(el).replace(/<!-- -->/g, '');
  const spell = (id: string, name: string, levels: Record<string, number>) => ({
    id, name, school: 'Abjuration', levels, castingTime: '1 azione standard', components: 'V, S', range: 'personale',
    duration: '-', savingThrow: '-', spellResistance: '-', description: `Descrizione di ${name}`,
  }) as import('../types').SpellDefinition;
  const mistico = {
    id: 'mistico', name: 'Mistico', description: '', hitDie: 8, status: 'published', armorProficiencies: [], weaponProficiencies: '',
    skillsPerLevel: 2, classSkills: [], bab: [], saves: { fort: [], ref: [], will: [] }, features: [], createdAt: 0, updatedAt: 0,
    spellcasting: { enabled: true, sourceList: 'wizard', customSpells: ['luce_sacra'], customSpellLevels: { luce_sacra: 2 } },
  } as unknown as import('../types').CustomClassDefinition;
  const withClass = (classId: string, level = 3) => ({
    ...char, classes: [{ classId, level, favoredClassBonus: [] }], totalLevel: level, preparedSpells: [], knownSpells: [], spellSlots: [],
  }) as unknown as Character;

  const setup = () => {
    mockSpells.splice(0, mockSpells.length,
      spell('armatura_magica', 'Armatura Magica', { wizard: 1 }),
      spell('palla_di_fuoco', 'Palla di Fuoco', { wizard: 3 }),
      spell('luce_sacra', 'Luce Sacra', { cleric: 5 }));
    useDataStore.setState({ publishedCustomClasses: [mistico] });
  };
  const reset = () => { mockSpells.splice(0); useDataStore.setState({ publishedCustomClasses: [] }); };

  it('the spells section shows a custom caster, and a built-in wizard is unchanged', () => {
    setup();
    try {
      const custom = html(<SpellsPanel char={withClass('mistico')} />);
      expect(custom).not.toContain('Nessuna classe incantatore');
      expect(custom).toContain('Mistico');
      expect(custom).toContain('Max: 9° livello');
      expect(html(<SpellsPanel char={withClass('wizard')} />)).toContain('Max: 9° livello');
      expect(html(<SpellsPanel char={withClass('fighter')} />)).toContain('Nessuna classe incantatore');
    } finally { reset(); }
  });

  it('a custom class without a complete spellcasting configuration is not a caster', () => {
    setup();
    try {
      useDataStore.setState({ publishedCustomClasses: [{ ...mistico, spellcasting: { enabled: true, customSpells: ['luce_sacra'] } }] });
      expect(html(<SpellsPanel char={withClass('mistico')} />)).toContain('Nessuna classe incantatore');
    } finally { reset(); }
  });

  it('the creation step lists the source list and the additional spells at their level', () => {
    setup();
    try {
      const step = () => html(<Step6_Spells classId="mistico" abilityScores={{ str: 10, dex: 10, con: 10, int: 16, wis: 10, cha: 10 }}
        knownSpells={[]} onChange={() => {}} onNext={() => {}} onBack={() => {}} />);
      const out = step();
      expect(out).toContain('Mistico');
      expect(out).toContain('Armatura Magica');
      expect(out).not.toContain('Palla di Fuoco'); // 3rd level: not accessible at 1st level
      expect(out).not.toContain('Luce Sacra');
      expect(out).not.toContain('Classe non incantatore');
    } finally { reset(); }
  });

  const editor = (spellcasting: unknown) => html(<CustomClassEditor
    cls={{ ...mistico, spellcasting } as unknown as import('../types').CustomClassDefinition}
    onSave={() => {}} onDelete={() => {}} onPublish={() => {}} onWithdraw={() => {}} />);

  it('the editor shows the configuration inherited from the source list', () => {
    setup();
    try {
      const out = editor({ enabled: true, sourceList: 'wizard' });
      expect(out).toContain('<option value="int" selected="">Intelligenza');
      expect(out).toContain('<option value="full" selected="">Piena');
      expect(out).toContain('<option value="arcane" selected="">Arcana');
      expect(out).toContain('Usa un libro degli incantesimi');
      expect(out).not.toContain('Manca:');
    } finally { reset(); }
  });

  it('the editor proposes the lowest level for an additional spell, and warns about missing fields', () => {
    setup();
    try {
      const out = editor({ enabled: true, customSpells: ['palla_di_fuoco'] });
      expect(out).toMatch(/aria-label="Livello di Palla di Fuoco"[^>]*value="3"/);
      expect(out).toContain('Manca: caratteristica, tipo, progressione');
    } finally { reset(); }
  });

  it('reduced progression disables spontaneous', () => {
    setup();
    try {
      const out = editor({ enabled: true, ability: 'wis', type: 'prepared', progression: 'reduced' });
      expect(out).toMatch(/<input type="radio"[^>]*disabled=""[^>]*\/>Spontanei/);
      expect(out).not.toMatch(/<input type="radio"[^>]*disabled=""[^>]*\/>Preparati/);
    } finally { reset(); }
  });
});
