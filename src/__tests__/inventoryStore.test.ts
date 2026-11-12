import { describe, it, expect, vi, beforeEach } from 'vitest';

const { saveCharacter } = vi.hoisted(() => ({ saveCharacter: vi.fn(async (_uid: string, char: unknown) => char) }));
vi.mock('../lib/firebase', () => ({ auth: { currentUser: { uid: 'u1' } }, db: {} }));
vi.mock('../lib/firestoreSync', () => ({ saveCharacter, deleteCharacterDoc: vi.fn(), loadCharacters: vi.fn() }));

import type { Character, ItemDefinition } from '../types';
import { useCharacterStore } from '../store/characterStore';
import { itemFromCatalog } from '../utils/inventory';

const SWORD: ItemDefinition = {
  id: 'spada-lunga', name: 'Spada Lunga', kind: 'weapon', category: 'x', priceGp: 15, weightKg: 2, url: 'u',
  weapon: { group: 'martial', handedness: 'one-handed', damage: { small: { count: 1, die: 6 }, medium: { count: 1, die: 8 } },
    critRange: 19, critMult: 2, damageTypes: ['T'], special: [] },
};

/** Fails on any `undefined` value, which Firestore rejects. */
function assertNoUndefined(value: unknown, path = 'char'): void {
  if (value === undefined) throw new Error(`undefined at ${path}`);
  if (value && typeof value === 'object') Object.entries(value).forEach(([k, v]) => assertNoUndefined(v, `${path}.${k}`));
}

describe('inventory store actions', () => {
  let id: string;
  beforeEach(() => {
    saveCharacter.mockClear();
    useCharacterStore.setState({ characters: [] });
    id = useCharacterStore.getState().createCharacter();
    useCharacterStore.setState(s => ({ characters: s.characters.map(c => ({ ...c, gold: 20 })) }));
  });
  const char = () => useCharacterStore.getState().characters.find(c => c.id === id) as Character;

  it('purchases, equips, links an attack and syncs a clean document', () => {
    const { purchaseEquipment, addAttackFromItem, removeEquipment, setDeityWeapon } = useCharacterStore.getState();
    purchaseEquipment(id, itemFromCatalog(SWORD), 1000);
    expect(char().gold).toBe(10);
    const itemId = char().equipment[0].id;
    addAttackFromItem(id, itemId);
    removeEquipment(id, itemId);
    setDeityWeapon(id, null);
    expect(char().weaponAttacks[0].itemId).toBeUndefined();
    expect(saveCharacter).toHaveBeenCalled();
    // the document actually sent must contain no undefined values once cleaned of absent keys
    const sent = JSON.parse(JSON.stringify(saveCharacter.mock.calls.at(-1)![1]));
    assertNoUndefined(sent);
    expect(sent.weaponAttacks[0]).not.toHaveProperty('itemId');
  });

  it('refuses a purchase above the available coins without changes', () => {
    const before = char();
    expect(() => useCharacterStore.getState().purchaseEquipment(id, itemFromCatalog(SWORD), 2500)).toThrow();
    expect(char()).toBe(before);
  });

  it('stores feat choices per instance', () => {
    const { setFeatChoice } = useCharacterStore.getState();
    setFeatChoice(id, 'competenza_nelle_armi_esotiche', 0, 'catena-chiodata');
    setFeatChoice(id, 'competenza_nelle_armi_esotiche', 1, 'frusta');
    setFeatChoice(id, 'competenza_nelle_armi_esotiche', 0, null);
    expect(char().featChoices).toEqual([{ featId: 'competenza_nelle_armi_esotiche', index: 1, choice: 'frusta' }]);
  });
});
