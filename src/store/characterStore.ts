import { create } from 'zustand';
import { getClass } from '../data/classes';
import { auth } from '../lib/firebase';
import { saveCharacter, deleteCharacterDoc, loadCharacters } from '../lib/firestoreSync';
import type {
  Character, CharacterClassEntry, SkillRank,
  KnownSpell, PreparedSpell, EquipmentItem, AbilityKey, Alignment,
} from '../types';

function newId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function effectiveConMod(c: Pick<Character, 'baseAbilityScores' | 'racialAbilityBonus' | 'abilityIncreases'>): number {
  const base = c.baseAbilityScores.con;
  const racial = c.racialAbilityBonus?.con ?? 0;
  const increases = c.abilityIncreases.reduce((sum, inc) => sum + (inc.con ?? 0), 0);
  return Math.floor((base + racial + increases - 10) / 2);
}

function calcMaxHp(c: Pick<Character, 'hitPointsRolled' | 'classes' | 'baseAbilityScores' | 'racialAbilityBonus' | 'abilityIncreases'>): number {
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

  levelUp: (charId: string, classId: string, hpRoll: number, skillRanks: Record<string, number>, newFeat?: string, abilityIncrease?: AbilityKey) => void;

  setSkillRanks: (id: string, skillId: string, ranks: number) => void;
  setSkillMisc: (id: string, skillId: string, misc: number) => void;

  addFeat: (id: string, featId: string) => void;
  removeFeat: (id: string, featId: string) => void;

  addKnownSpell: (id: string, spell: KnownSpell) => void;
  removeKnownSpell: (id: string, spellId: string, classId: string) => void;
  prepareSpell: (id: string, spell: PreparedSpell) => void;
  unprepareSpell: (id: string, slot: number, classId: string, spellLevel: number) => void;
  useSpellSlot: (id: string, classId: string, spellLevel: number) => void;
  recoverAllSpellSlots: (id: string) => void;
  clearPreparedSpells: (id: string, classId: string) => void;

  takeDamage: (id: string, amount: number) => void;
  heal: (id: string, amount: number) => void;
  setTempHp: (id: string, amount: number) => void;
  fullRest: (id: string) => void;

  addEquipment: (id: string, item: EquipmentItem) => void;
  removeEquipment: (id: string, itemId: string) => void;
  updateEquipment: (id: string, itemId: string, patch: Partial<EquipmentItem>) => void;

  importCharacters: (incoming: Character[]) => void;

  wizardDraft: Partial<Character> | null;
  setWizardDraft: (draft: Partial<Character> | null) => void;
  updateWizardDraft: (patch: Partial<Character>) => void;
  commitWizardDraft: () => string | null;
}

export const useCharacterStore = create<CharacterState>()((set, get) => ({
  characters: [],
  activeId: null,
  wizardDraft: null,

  loadFromFirestore: async (uid) => {
    const chars = await loadCharacters(uid);
    set({ characters: chars, activeId: null });
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

  levelUp: (charId, classId, hpRoll, skillRanks, newFeat, abilityIncrease) => {
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
        const feats = newFeat ? [...c.feats, newFeat] : c.feats;
        return { ...c, classes, totalLevel, hitPointsRolled: [...c.hitPointsRolled, hpRoll], skills, feats, abilityIncreases };
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

  useSpellSlot: (id, classId, spellLevel) => {
    set(s => ({
      characters: s.characters.map(c => {
        if (c.id !== id) return c;
        return {
          ...c,
          preparedSpells: c.preparedSpells.map(sp =>
            sp.classId === classId && sp.spellLevel === spellLevel && !sp.used ? { ...sp, used: true } : sp,
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
        c.id === id ? { ...c, preparedSpells: c.preparedSpells.map(sp => ({ ...sp, used: false })) } : c,
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
        return {
          ...c,
          currentHp: calcMaxHp(c),
          tempHp: 0,
          nonLethalDamage: 0,
          preparedSpells: c.preparedSpells.map(sp => ({ ...sp, used: false })),
        };
      }),
    }));
    const updated = get().characters.find(c => c.id === id);
    if (updated) syncChar(updated);
  },

  addEquipment: (id, item) => {
    set(s => ({ characters: s.characters.map(c => c.id === id ? { ...c, equipment: [...c.equipment, item] } : c) }));
    const updated = get().characters.find(c => c.id === id);
    if (updated) syncChar(updated);
  },

  removeEquipment: (id, itemId) => {
    set(s => ({
      characters: s.characters.map(c =>
        c.id === id ? { ...c, equipment: c.equipment.filter(i => i.id !== itemId) } : c,
      ),
    }));
    const updated = get().characters.find(c => c.id === id);
    if (updated) syncChar(updated);
  },

  updateEquipment: (id, itemId, patch) => {
    set(s => ({
      characters: s.characters.map(c =>
        c.id === id
          ? { ...c, equipment: c.equipment.map(i => i.id === itemId ? { ...i, ...patch } : i) }
          : c,
      ),
    }));
    const updated = get().characters.find(c => c.id === id);
    if (updated) syncChar(updated);
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
}));
