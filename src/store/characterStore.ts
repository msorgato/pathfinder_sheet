import { create } from 'zustand';
import { getClass } from '../data/classes';
import { getRace } from '../data/races';
import { auth } from '../lib/firebase';
import { saveCharacter, deleteCharacterDoc, loadCharacters } from '../lib/firestoreSync';
import { getAgeCategory, AGE_MODIFIERS } from '../data/ageModifiers';
import * as status from '../utils/characterStatus';
import * as inv from '../utils/inventory';
import * as consumables from '../utils/spellConsumables';
import type { ConsumableUndo } from '../utils/spellConsumables';
import { deriveStats } from '../utils/derivedStats';
import type {
  NegativeLevels,
  Character, CharacterClassEntry, SkillRank,
  KnownSpell, PreparedSpell, AbilityKey, ExtraProficiencies, Alignment, WeaponAttack, ClassFeatureChoice,
} from '../types';

function newId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function effectiveConMod(c: Pick<Character, 'baseAbilityScores' | 'racialAbilityBonus' | 'abilityIncreases' | 'age' | 'race'>): number {
  const base = c.baseAbilityScores.con;
  const fixedRacial = getRace(c.race)?.abilityModifiers.con ?? 0;
  const selectableRacial = c.racialAbilityBonus?.con ?? 0;
  const increases = c.abilityIncreases.reduce((sum, inc) => sum + (inc.con ?? 0), 0);
  let ageMod = 0;
  if (c.age) {
    const cat = getAgeCategory(c.race, c.age);
    if (cat) ageMod = AGE_MODIFIERS[cat].con ?? 0;
  }
  return Math.floor((base + fixedRacial + selectableRacial + increases + ageMod - 10) / 2);
}

function calcMaxHp(c: Pick<Character, 'hitPointsRolled' | 'classes' | 'baseAbilityScores' | 'racialAbilityBonus' | 'abilityIncreases' | 'age' | 'race'>): number {
  const totalLevel = c.classes.reduce((s, e) => s + e.level, 0);
  const base = c.hitPointsRolled.reduce((s, r) => s + r, 0);
  return base + effectiveConMod(c) * totalLevel;
}

export function emptyCharacter(id?: string): Character {
  return {
    id: id ?? newId(),
    name: '',
    race: '',
    alignment: 'TN',
    baseAbilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    abilityIncreases: [],
    classes: [],
    totalLevel: 0,
    hitPointsRolled: [],
    currentHp: 0,
    tempHp: 0,
    nonLethalDamage: 0,
    skills: [],
    feats: [],
    traits: [],
    knownSpells: [],
    preparedSpells: [],
    spellSlots: [],
    weaponAttacks: [],
    equipment: [],
    copper: 0,
    silver: 0,
    gold: 0,
    platinum: 0,
    experience: 0,
    notes: '',
  };
}

function uid(): string | null {
  return auth.currentUser?.uid ?? null;
}

const sizeOf = (c: Character): inv.CreatureSize => getRace(c.race)?.size ?? 'Medium';

function syncChar(char: Character): void {
  const u = uid();
  if (u) saveCharacter(u, char).catch(err => console.error('[Firestore] saveCharacter failed:', err));
}

interface CharacterState {
  characters: Character[];
  activeId: string | null;

  loadFromFirestore: (uid: string) => Promise<void>;
  clearStore: () => void;

  createCharacter: () => string;
  deleteCharacter: (id: string) => void;
  setActive: (id: string | null) => void;
  getActive: () => Character | undefined;

  updateCharacter: (id: string, patch: Partial<Character>) => void;
  setAbilityScore: (id: string, key: AbilityKey, value: number) => void;
  setRacialBonus: (id: string, bonus: Partial<Record<AbilityKey, number>>) => void;

  addClass: (id: string, classId: string) => void;
  setClasses: (id: string, classes: CharacterClassEntry[]) => void;

  levelUp: (charId: string, classId: string, hpRoll: number, skillRanks: Record<string, number>, newFeat?: string, abilityIncrease?: AbilityKey, newSpells?: KnownSpell[], classFeatureChoices?: ClassFeatureChoice[], bonusFeats?: string[]) => void;

  setSkillRanks: (id: string, skillId: string, ranks: number) => void;
  setSkillMisc: (id: string, skillId: string, misc: number) => void;

  addFeat: (id: string, featId: string) => void;
  removeFeat: (id: string, featId: string) => void;

  addKnownSpell: (id: string, spell: KnownSpell) => void;
  removeKnownSpell: (id: string, spellId: string, classId: string) => void;
  prepareSpell: (id: string, spell: PreparedSpell) => void;
  unprepareSpell: (id: string, slot: number, classId: string, spellLevel: number) => void;
  markPreparedSpellUsed: (id: string, slot: number, classId: string, spellLevel: number) => void;
  useSpellSlot: (id: string, classId: string, spellLevel: number) => void;
  recoverSpellSlot: (id: string, classId: string, spellLevel: number) => void;
  recoverAllSpellSlots: (id: string) => void;
  clearPreparedSpells: (id: string, classId: string) => void;

  takeDamage: (id: string, amount: number) => void;
  heal: (id: string, amount: number) => void;
  setTempHp: (id: string, amount: number) => void;
  fullRest: (id: string) => void;

  addCondition: (id: string, conditionId: string, note?: string) => void;
  removeCondition: (id: string, activeId: string) => void;
  addEffect: (id: string, effect: status.EffectInput) => void;
  updateEffect: (id: string, effectId: string, effect: status.EffectInput) => void;
  toggleEffect: (id: string, effectId: string) => void;
  removeEffect: (id: string, effectId: string) => void;
  setAbilityDamage: (id: string, ability: AbilityKey, value: number) => void;
  setAbilityDrain: (id: string, ability: AbilityKey, value: number) => void;
  setNegativeLevels: (id: string, value: NegativeLevels) => void;

  addWeaponAttack: (charId: string, weapon: WeaponAttack) => void;
  removeWeaponAttack: (charId: string, weaponId: string) => void;

  addEquipment: (id: string, item: inv.ItemInput) => void;
  /** Adds the item and pays `paidCp` copper pieces (throws if the coins are not enough). */
  purchaseEquipment: (id: string, item: inv.ItemInput, paidCp: number) => void;
  /** Uses one dose/charge of a consumable; returns the undo, or null when nothing is left. */
  useConsumable: (id: string, itemId: string) => ConsumableUndo | null;
  undoConsumable: (id: string, undo: ConsumableUndo) => void;
  updateEquipment: (id: string, itemId: string, item: inv.ItemInput) => void;
  removeEquipment: (id: string, itemId: string) => void;
  setEquipmentQuantity: (id: string, itemId: string, quantity: number) => void;
  toggleEquipped: (id: string, itemId: string) => void;
  /** Creates an attack linked to an inventory weapon. */
  addAttackFromItem: (id: string, itemId: string) => void;

  setFeatChoice: (id: string, featId: string, index: number, choice: string | null) => void;
  setExtraProficiencies: (id: string, extra: ExtraProficiencies) => void;
  setDeityWeapon: (id: string, weaponId: string | null) => void;

  importCharacters: (incoming: Character[]) => void;

  wizardDraft: Partial<Character> | null;
  setWizardDraft: (draft: Partial<Character> | null) => void;
  updateWizardDraft: (patch: Partial<Character>) => void;
  commitWizardDraft: () => string | null;
}

export const useCharacterStore = create<CharacterState>()((set, get) => {
  /** Applies a computed patch to one character and syncs it. */
  const patchChar = (id: string, fn: (c: Character) => Partial<Character>) => {
    set(s => ({ characters: s.characters.map(c => (c.id === id ? { ...c, ...fn(c) } : c)) }));
    const updated = get().characters.find(c => c.id === id);
    if (updated) syncChar(updated);
  };

  return {
  characters: [],
  activeId: null,
  wizardDraft: null,

  loadFromFirestore: async (uid) => {
    const chars = await loadCharacters(uid);
    const merged = chars.map(c => ({ ...emptyCharacter(c.id), ...c }));
    set({ characters: merged, activeId: null });
  },

  clearStore: () => set({ characters: [], activeId: null, wizardDraft: null }),

  createCharacter: () => {
    const id = newId();
    const c = emptyCharacter(id);
    set(s => ({ characters: [...s.characters, c], activeId: id }));
    syncChar(c);
    return id;
  },

  deleteCharacter: (id) => {
    set(s => ({
      characters: s.characters.filter(c => c.id !== id),
      activeId: s.activeId === id ? null : s.activeId,
    }));
    const u = uid();
    if (u) deleteCharacterDoc(u, id).catch(console.error);
  },

  setActive: (id) => set({ activeId: id }),

  getActive: () => {
    const { characters, activeId } = get();
    return characters.find(c => c.id === activeId);
  },

  updateCharacter: (id, patch) => {
    set(s => ({ characters: s.characters.map(c => c.id === id ? { ...c, ...patch } : c) }));
    const updated = get().characters.find(c => c.id === id);
    if (updated) syncChar(updated);
  },

  setAbilityScore: (id, key, value) => {
    set(s => ({
      characters: s.characters.map(c =>
        c.id === id ? { ...c, baseAbilityScores: { ...c.baseAbilityScores, [key]: value } } : c,
      ),
    }));
    const updated = get().characters.find(c => c.id === id);
    if (updated) syncChar(updated);
  },

  setRacialBonus: (id, bonus) => {
    set(s => ({
      characters: s.characters.map(c => c.id === id ? { ...c, racialAbilityBonus: bonus } : c),
    }));
    const updated = get().characters.find(c => c.id === id);
    if (updated) syncChar(updated);
  },

  addClass: (id, classId) => {
    set(s => ({
      characters: s.characters.map(c => {
        if (c.id !== id) return c;
        if (c.classes.find(e => e.classId === classId)) return c;
        return { ...c, classes: [...c.classes, { classId, level: 1, favoredClassBonus: [] }], totalLevel: c.totalLevel + 1 };
      }),
    }));
    const updated = get().characters.find(c => c.id === id);
    if (updated) syncChar(updated);
  },

  setClasses: (id, classes) => {
    set(s => ({
      characters: s.characters.map(c =>
        c.id === id ? { ...c, classes, totalLevel: classes.reduce((sum, e) => sum + e.level, 0) } : c,
      ),
    }));
    const updated = get().characters.find(c => c.id === id);
    if (updated) syncChar(updated);
  },

  levelUp: (charId, classId, hpRoll, skillRanks, newFeat, abilityIncrease, newSpells, classFeatureChoices, bonusFeats) => {
    set(s => ({
      characters: s.characters.map(c => {
        if (c.id !== charId) return c;
        let classes = c.classes.map(e => e.classId === classId ? { ...e, level: e.level + 1 } : e);
        if (!classes.find(e => e.classId === classId)) {
          classes = [...classes, { classId, level: 1, favoredClassBonus: [] }];
        }
        const totalLevel = classes.reduce((sum, e) => sum + e.level, 0);
        const skills = [...c.skills];
        Object.entries(skillRanks).forEach(([skillId, newRanks]) => {
          const idx = skills.findIndex(sk => sk.skillId === skillId);
          if (idx >= 0) skills[idx] = { ...skills[idx], ranks: newRanks };
          else skills.push({ skillId, ranks: newRanks, misc: 0 });
        });
        const abilityIncreases = abilityIncrease
          ? [...c.abilityIncreases, { [abilityIncrease]: 1 }]
          : c.abilityIncreases;
        const feats = [
          ...c.feats,
          ...(newFeat ? [newFeat] : []),
          ...(bonusFeats ?? []),
        ];
        const knownSpells = newSpells ? [...c.knownSpells, ...newSpells] : c.knownSpells;
        const allClassFeatureChoices = classFeatureChoices
          ? [...(c.classFeatureChoices ?? []), ...classFeatureChoices]
          : c.classFeatureChoices;
        return { ...c, classes, totalLevel, hitPointsRolled: [...c.hitPointsRolled, hpRoll], skills, feats, abilityIncreases, knownSpells, classFeatureChoices: allClassFeatureChoices };
      }),
    }));
    const updated = get().characters.find(c => c.id === charId);
    if (updated) syncChar(updated);
  },

  setSkillRanks: (id, skillId, ranks) => {
    set(s => ({
      characters: s.characters.map(c => {
        if (c.id !== id) return c;
        const skills = [...c.skills];
        const idx = skills.findIndex(sk => sk.skillId === skillId);
        if (idx >= 0) skills[idx] = { ...skills[idx], ranks };
        else skills.push({ skillId, ranks, misc: 0 });
        return { ...c, skills };
      }),
    }));
    const updated = get().characters.find(c => c.id === id);
    if (updated) syncChar(updated);
  },

  setSkillMisc: (id, skillId, misc) => {
    set(s => ({
      characters: s.characters.map(c => {
        if (c.id !== id) return c;
        const skills = [...c.skills];
        const idx = skills.findIndex(sk => sk.skillId === skillId);
        if (idx >= 0) skills[idx] = { ...skills[idx], misc };
        else skills.push({ skillId, ranks: 0, misc });
        return { ...c, skills };
      }),
    }));
    const updated = get().characters.find(c => c.id === id);
    if (updated) syncChar(updated);
  },

  addFeat: (id, featId) => {
    set(s => ({ characters: s.characters.map(c => c.id === id ? { ...c, feats: [...c.feats, featId] } : c) }));
    const updated = get().characters.find(c => c.id === id);
    if (updated) syncChar(updated);
  },

  removeFeat: (id, featId) => {
    set(s => ({ characters: s.characters.map(c => c.id === id ? { ...c, feats: c.feats.filter(f => f !== featId) } : c) }));
    const updated = get().characters.find(c => c.id === id);
    if (updated) syncChar(updated);
  },

  addKnownSpell: (id, spell) => {
    set(s => ({ characters: s.characters.map(c => c.id === id ? { ...c, knownSpells: [...c.knownSpells, spell] } : c) }));
    const updated = get().characters.find(c => c.id === id);
    if (updated) syncChar(updated);
  },

  removeKnownSpell: (id, spellId, classId) => {
    set(s => ({
      characters: s.characters.map(c =>
        c.id === id
          ? { ...c, knownSpells: c.knownSpells.filter(sp => !(sp.spellId === spellId && sp.classId === classId)) }
          : c,
      ),
    }));
    const updated = get().characters.find(c => c.id === id);
    if (updated) syncChar(updated);
  },

  prepareSpell: (id, spell) => {
    set(s => ({ characters: s.characters.map(c => c.id === id ? { ...c, preparedSpells: [...c.preparedSpells, spell] } : c) }));
    const updated = get().characters.find(c => c.id === id);
    if (updated) syncChar(updated);
  },

  unprepareSpell: (id, slot, classId, spellLevel) => {
    set(s => ({
      characters: s.characters.map(c =>
        c.id === id
          ? { ...c, preparedSpells: c.preparedSpells.filter(sp => !(sp.slot === slot && sp.classId === classId && sp.spellLevel === spellLevel)) }
          : c,
      ),
    }));
    const updated = get().characters.find(c => c.id === id);
    if (updated) syncChar(updated);
  },

  markPreparedSpellUsed: (id, slot, classId, spellLevel) => {
    set(s => ({
      characters: s.characters.map(c => {
        if (c.id !== id) return c;
        const ps = c.preparedSpells.find(p => p.slot === slot && p.classId === classId && p.spellLevel === spellLevel);
        if (!ps) return c;
        const nowUsed = !ps.used;
        const preparedSpells = c.preparedSpells.map(p =>
          p.slot === slot && p.classId === classId && p.spellLevel === spellLevel
            ? { ...p, used: nowUsed }
            : p,
        );
        const existingSlots = c.spellSlots ?? [];
        const hasSlotEntry = existingSlots.some(ss => ss.classId === classId && ss.spellLevel === spellLevel);
        const spellSlots = nowUsed
          ? hasSlotEntry
            ? existingSlots.map(ss => ss.classId === classId && ss.spellLevel === spellLevel
                ? { ...ss, used: ss.used + 1 }
                : ss)
            : [...existingSlots, { classId, spellLevel, total: 0, used: 1 }]
          : existingSlots.map(ss => ss.classId === classId && ss.spellLevel === spellLevel
              ? { ...ss, used: Math.max(0, ss.used - 1) }
              : ss);
        return { ...c, preparedSpells, spellSlots };
      }),
    }));
    const updated = get().characters.find(c => c.id === id);
    if (updated) syncChar(updated);
  },

  useSpellSlot: (id, classId, spellLevel) => {
    set(s => ({
      characters: s.characters.map(c => {
        if (c.id !== id) return c;
        const slots = c.spellSlots ?? [];
        const existing = slots.find(ss => ss.classId === classId && ss.spellLevel === spellLevel);
        const spellSlots = existing
          ? slots.map(ss =>
              ss.classId === classId && ss.spellLevel === spellLevel
                ? { ...ss, used: ss.used + 1 }
                : ss,
            )
          : [...slots, { classId, spellLevel, total: 0, used: 1 }];
        return { ...c, spellSlots };
      }),
    }));
    const updated = get().characters.find(c => c.id === id);
    if (updated) syncChar(updated);
  },

  recoverSpellSlot: (id, classId, spellLevel) => {
    set(s => ({
      characters: s.characters.map(c => {
        if (c.id !== id) return c;
        return {
          ...c,
          spellSlots: (c.spellSlots ?? []).map(ss =>
            ss.classId === classId && ss.spellLevel === spellLevel
              ? { ...ss, used: Math.max(0, ss.used - 1) }
              : ss,
          ),
        };
      }),
    }));
    const updated = get().characters.find(c => c.id === id);
    if (updated) syncChar(updated);
  },

  recoverAllSpellSlots: (id) => {
    set(s => ({
      characters: s.characters.map(c =>
        c.id === id
          ? {
              ...c,
              spellSlots: (c.spellSlots ?? []).map(ss => ({ ...ss, used: 0 })),
              preparedSpells: c.preparedSpells.map(ps => ({ ...ps, used: false })),
            }
          : c,
      ),
    }));
    const updated = get().characters.find(c => c.id === id);
    if (updated) syncChar(updated);
  },

  clearPreparedSpells: (id, classId) => {
    set(s => ({
      characters: s.characters.map(c =>
        c.id === id
          ? { ...c, preparedSpells: c.preparedSpells.filter(sp => sp.classId !== classId || sp.spellLevel === 0) }
          : c,
      ),
    }));
    const updated = get().characters.find(c => c.id === id);
    if (updated) syncChar(updated);
  },

  takeDamage: (id, amount) => {
    set(s => ({
      characters: s.characters.map(c => {
        if (c.id !== id) return c;
        let remaining = amount;
        let tempHp = c.tempHp;
        if (tempHp > 0) { const absorbed = Math.min(tempHp, remaining); tempHp -= absorbed; remaining -= absorbed; }
        return { ...c, tempHp, currentHp: c.currentHp - remaining };
      }),
    }));
    const updated = get().characters.find(c => c.id === id);
    if (updated) syncChar(updated);
  },

  heal: (id, amount) => {
    set(s => ({ characters: s.characters.map(c => c.id === id ? { ...c, currentHp: c.currentHp + amount } : c) }));
    const updated = get().characters.find(c => c.id === id);
    if (updated) syncChar(updated);
  },

  setTempHp: (id, amount) => {
    set(s => ({ characters: s.characters.map(c => c.id === id ? { ...c, tempHp: amount } : c) }));
    const updated = get().characters.find(c => c.id === id);
    if (updated) syncChar(updated);
  },

  fullRest: (id) => {
    set(s => ({
      characters: s.characters.map(c => {
        if (c.id !== id) return c;
        const rested = { ...c, ...status.restAbilityDamage(c) };
        return {
          ...rested,
          currentHp: deriveStats(rested).maxHp.total,
          tempHp: 0,
          nonLethalDamage: 0,
          preparedSpells: c.preparedSpells.map(sp => ({ ...sp, used: false })),
        };
      }),
    }));
    const updated = get().characters.find(c => c.id === id);
    if (updated) syncChar(updated);
  },

  addCondition: (id, conditionId, note) => {
    patchChar(id, c => status.applyCondition(c, conditionId, note));
  },
  removeCondition: (id, activeId) => {
    patchChar(id, c => status.removeCondition(c, activeId));
  },
  addEffect: (id, effect) => {
    patchChar(id, c => status.addEffect(c, effect));
  },
  updateEffect: (id, effectId, effect) => {
    patchChar(id, c => status.updateEffect(c, effectId, effect));
  },
  toggleEffect: (id, effectId) => {
    patchChar(id, c => status.toggleEffect(c, effectId));
  },
  removeEffect: (id, effectId) => {
    patchChar(id, c => status.removeEffect(c, effectId));
  },
  setAbilityDamage: (id, ability, value) => {
    patchChar(id, c => status.setAbilityDamage(c, ability, value));
  },
  setAbilityDrain: (id, ability, value) => {
    patchChar(id, c => status.setAbilityDrain(c, ability, value));
  },
  setNegativeLevels: (id, value) => {
    patchChar(id, () => status.setNegativeLevels(value));
  },

  addWeaponAttack: (charId, weapon) => {
    set(s => ({
      characters: s.characters.map(c =>
        c.id === charId
          ? { ...c, weaponAttacks: [...(c.weaponAttacks ?? []), weapon] }
          : c,
      ),
    }));
    const updated = get().characters.find(c => c.id === charId);
    if (updated) syncChar(updated);
  },

  removeWeaponAttack: (charId, weaponId) => {
    set(s => ({
      characters: s.characters.map(c =>
        c.id === charId
          ? { ...c, weaponAttacks: (c.weaponAttacks ?? []).filter(w => w.id !== weaponId) }
          : c,
      ),
    }));
    const updated = get().characters.find(c => c.id === charId);
    if (updated) syncChar(updated);
  },

  addEquipment: (id, item) => {
    patchChar(id, c => inv.addItem(c, item));
  },
  purchaseEquipment: (id, item, paidCp) => {
    const char = get().characters.find(c => c.id === id);
    if (!char) return;
    const patch = inv.purchaseItem(char, item, paidCp); // throws before any change
    patchChar(id, () => patch);
  },
  useConsumable: (id, itemId) => {
    const char = get().characters.find(c => c.id === id);
    const result = char ? consumables.useConsumable(char, itemId) : null;
    if (!result) return null;
    patchChar(id, () => result.patch);
    return result.undo;
  },
  undoConsumable: (id, undo) => {
    patchChar(id, c => consumables.undoConsumable(c, undo));
  },
  updateEquipment: (id, itemId, item) => {
    patchChar(id, c => inv.updateItem(c, itemId, item, sizeOf(c)));
  },
  removeEquipment: (id, itemId) => {
    patchChar(id, c => inv.removeItem(c, itemId));
  },
  setEquipmentQuantity: (id, itemId, quantity) => {
    patchChar(id, c => inv.setQuantity(c, itemId, quantity));
  },
  toggleEquipped: (id, itemId) => {
    patchChar(id, c => inv.toggleEquipped(c, itemId));
  },
  addAttackFromItem: (id, itemId) => {
    patchChar(id, c => {
      const item = (c.equipment ?? []).find(i => i.id === itemId);
      return item ? { weaponAttacks: [...(c.weaponAttacks ?? []), inv.attackFromItem(item, sizeOf(c))] } : {};
    });
  },

  setFeatChoice: (id, featId, index, choice) => {
    patchChar(id, c => {
      const rest = (c.featChoices ?? []).filter(fc => !(fc.featId === featId && fc.index === index));
      return { featChoices: choice ? [...rest, { featId, index, choice }] : rest };
    });
  },
  setExtraProficiencies: (id, extra) => {
    patchChar(id, () => ({
      extraProficiencies: { armor: [...new Set(extra.armor ?? [])], weapons: [...new Set(extra.weapons ?? [])] },
    }));
  },
  setDeityWeapon: (id, weaponId) => {
    patchChar(id, () => ({ deityWeaponId: weaponId ?? undefined }));
  },

  importCharacters: (incoming) => {
    set(s => {
      const existingIds = new Set(s.characters.map(c => c.id));
      const toAdd = incoming.filter(c => !existingIds.has(c.id));
      const updated = s.characters.map(c => {
        const match = incoming.find(i => i.id === c.id);
        return match ? { ...emptyCharacter(c.id), ...match } : c;
      });
      return { characters: [...updated, ...toAdd] };
    });
    const u = uid();
    if (u) {
      incoming.forEach(inc => {
        const final = get().characters.find(c => c.id === inc.id);
        if (final) saveCharacter(u, final).catch(console.error);
      });
    }
  },

  setWizardDraft: (draft) => set({ wizardDraft: draft }),

  updateWizardDraft: (patch) => {
    set(s => ({ wizardDraft: s.wizardDraft ? { ...s.wizardDraft, ...patch } : { ...patch } }));
  },

  commitWizardDraft: () => {
    const { wizardDraft } = get();
    if (!wizardDraft) return null;
    const id = wizardDraft.id ?? newId();
    const full: Character = { ...emptyCharacter(id), ...wizardDraft, id };
    if (full.hitPointsRolled.length === 0 && full.classes.length > 0) {
      const cls = full.classes[0];
      const classDef = getClass(cls.classId);
      if (classDef) full.hitPointsRolled = [classDef.hitDie];
    }
    full.currentHp = calcMaxHp(full);
    full.totalLevel = full.classes.reduce((s, e) => s + e.level, 0);
    set(s => ({ characters: [...s.characters, full], activeId: id, wizardDraft: null }));
    syncChar(full);
    return id;
  },
};
});
