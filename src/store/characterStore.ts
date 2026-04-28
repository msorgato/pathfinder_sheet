import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getClass } from '../data/classes';
import type {
  Character, CharacterClassEntry, SkillRank,
  KnownSpell, PreparedSpell, EquipmentItem, AbilityKey, Alignment,
} from '../types';

function newId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
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

interface CharacterState {
  characters: Character[];
  activeId: string | null;

  // Character list operations
  createCharacter: () => string;
  deleteCharacter: (id: string) => void;
  setActive: (id: string | null) => void;
  getActive: () => Character | undefined;

  // Core character updates
  updateCharacter: (id: string, patch: Partial<Character>) => void;
  setAbilityScore: (id: string, key: AbilityKey, value: number) => void;
  setRacialBonus: (id: string, bonus: Partial<Record<AbilityKey, number>>) => void;

  // Class management
  addClass: (id: string, classId: string) => void;
  setClasses: (id: string, classes: CharacterClassEntry[]) => void;

  // Level up
  levelUp: (charId: string, classId: string, hpRoll: number, skillRanks: Record<string, number>, newFeat?: string, abilityIncrease?: AbilityKey) => void;

  // Skills
  setSkillRanks: (id: string, skillId: string, ranks: number) => void;
  setSkillMisc: (id: string, skillId: string, misc: number) => void;

  // Feats
  addFeat: (id: string, featId: string) => void;
  removeFeat: (id: string, featId: string) => void;

  // Spells
  addKnownSpell: (id: string, spell: KnownSpell) => void;
  removeKnownSpell: (id: string, spellId: string, classId: string) => void;
  prepareSpell: (id: string, spell: PreparedSpell) => void;
  unprepareSpell: (id: string, slot: number, classId: string, spellLevel: number) => void;
  useSpellSlot: (id: string, classId: string, spellLevel: number) => void;
  recoverAllSpellSlots: (id: string) => void;

  // HP management
  takeDamage: (id: string, amount: number) => void;
  heal: (id: string, amount: number) => void;
  setTempHp: (id: string, amount: number) => void;
  fullRest: (id: string) => void;

  // Equipment
  addEquipment: (id: string, item: EquipmentItem) => void;
  removeEquipment: (id: string, itemId: string) => void;
  updateEquipment: (id: string, itemId: string, patch: Partial<EquipmentItem>) => void;

  // Wizard flow state
  wizardDraft: Partial<Character> | null;
  setWizardDraft: (draft: Partial<Character> | null) => void;
  updateWizardDraft: (patch: Partial<Character>) => void;
  commitWizardDraft: () => string | null;
}

export const useCharacterStore = create<CharacterState>()(
  persist(
    (set, get) => ({
      characters: [],
      activeId: null,
      wizardDraft: null,

      createCharacter: () => {
        const id = newId();
        const c = emptyCharacter(id);
        set(s => ({ characters: [...s.characters, c], activeId: id }));
        return id;
      },

      deleteCharacter: (id) => {
        set(s => ({
          characters: s.characters.filter(c => c.id !== id),
          activeId: s.activeId === id ? null : s.activeId,
        }));
      },

      setActive: (id) => set({ activeId: id }),

      getActive: () => {
        const { characters, activeId } = get();
        return characters.find(c => c.id === activeId);
      },

      updateCharacter: (id, patch) => {
        set(s => ({
          characters: s.characters.map(c => c.id === id ? { ...c, ...patch } : c),
        }));
      },

      setAbilityScore: (id, key, value) => {
        set(s => ({
          characters: s.characters.map(c =>
            c.id === id
              ? { ...c, baseAbilityScores: { ...c.baseAbilityScores, [key]: value } }
              : c,
          ),
        }));
      },

      setRacialBonus: (id, bonus) => {
        set(s => ({
          characters: s.characters.map(c =>
            c.id === id ? { ...c, racialAbilityBonus: bonus } : c,
          ),
        }));
      },

      addClass: (id, classId) => {
        set(s => ({
          characters: s.characters.map(c => {
            if (c.id !== id) return c;
            const existing = c.classes.find(e => e.classId === classId);
            if (existing) return c;
            return {
              ...c,
              classes: [...c.classes, { classId, level: 1, favoredClassBonus: [] }],
              totalLevel: c.totalLevel + 1,
            };
          }),
        }));
      },

      setClasses: (id, classes) => {
        set(s => ({
          characters: s.characters.map(c =>
            c.id === id
              ? { ...c, classes, totalLevel: classes.reduce((sum, e) => sum + e.level, 0) }
              : c,
          ),
        }));
      },

      levelUp: (charId, classId, hpRoll, skillRanks, newFeat, abilityIncrease) => {
        set(s => ({
          characters: s.characters.map(c => {
            if (c.id !== charId) return c;

            // Update class level
            let classes = c.classes.map(e =>
              e.classId === classId ? { ...e, level: e.level + 1 } : e,
            );
            if (!classes.find(e => e.classId === classId)) {
              classes = [...classes, { classId, level: 1, favoredClassBonus: [] }];
            }
            const totalLevel = classes.reduce((sum, e) => sum + e.level, 0);

            // Update skill ranks
            const skills = [...c.skills];
            Object.entries(skillRanks).forEach(([skillId, newRanks]) => {
              const idx = skills.findIndex(sk => sk.skillId === skillId);
              if (idx >= 0) skills[idx] = { ...skills[idx], ranks: newRanks };
              else skills.push({ skillId, ranks: newRanks, misc: 0 });
            });

            // Ability increase
            let abilityIncreases = [...c.abilityIncreases];
            if (abilityIncrease) {
              abilityIncreases = [...abilityIncreases, { [abilityIncrease]: 1 }];
            }

            // Add feat
            const feats = newFeat ? [...c.feats, newFeat] : c.feats;

            return {
              ...c,
              classes,
              totalLevel,
              hitPointsRolled: [...c.hitPointsRolled, hpRoll],
              skills,
              feats,
              abilityIncreases,
            };
          }),
        }));
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
      },

      addFeat: (id, featId) => {
        set(s => ({
          characters: s.characters.map(c =>
            c.id === id ? { ...c, feats: [...c.feats, featId] } : c,
          ),
        }));
      },

      removeFeat: (id, featId) => {
        set(s => ({
          characters: s.characters.map(c =>
            c.id === id ? { ...c, feats: c.feats.filter(f => f !== featId) } : c,
          ),
        }));
      },

      addKnownSpell: (id, spell) => {
        set(s => ({
          characters: s.characters.map(c =>
            c.id === id ? { ...c, knownSpells: [...c.knownSpells, spell] } : c,
          ),
        }));
      },

      removeKnownSpell: (id, spellId, classId) => {
        set(s => ({
          characters: s.characters.map(c =>
            c.id === id
              ? {
                  ...c,
                  knownSpells: c.knownSpells.filter(
                    sp => !(sp.spellId === spellId && sp.classId === classId),
                  ),
                }
              : c,
          ),
        }));
      },

      prepareSpell: (id, spell) => {
        set(s => ({
          characters: s.characters.map(c =>
            c.id === id ? { ...c, preparedSpells: [...c.preparedSpells, spell] } : c,
          ),
        }));
      },

      unprepareSpell: (id, slot, classId, spellLevel) => {
        set(s => ({
          characters: s.characters.map(c =>
            c.id === id
              ? {
                  ...c,
                  preparedSpells: c.preparedSpells.filter(
                    sp => !(sp.slot === slot && sp.classId === classId && sp.spellLevel === spellLevel),
                  ),
                }
              : c,
          ),
        }));
      },

      useSpellSlot: (id, classId, spellLevel) => {
        set(s => ({
          characters: s.characters.map(c => {
            if (c.id !== id) return c;
            const preparedSpells = c.preparedSpells.map(sp => {
              if (sp.classId === classId && sp.spellLevel === spellLevel && !sp.used) {
                return { ...sp, used: true };
              }
              return sp;
            });
            return { ...c, preparedSpells };
          }),
        }));
      },

      recoverAllSpellSlots: (id) => {
        set(s => ({
          characters: s.characters.map(c =>
            c.id === id
              ? { ...c, preparedSpells: c.preparedSpells.map(sp => ({ ...sp, used: false })) }
              : c,
          ),
        }));
      },

      takeDamage: (id, amount) => {
        set(s => ({
          characters: s.characters.map(c => {
            if (c.id !== id) return c;
            let remaining = amount;
            let tempHp = c.tempHp;
            if (tempHp > 0) {
              const absorbed = Math.min(tempHp, remaining);
              tempHp -= absorbed;
              remaining -= absorbed;
            }
            return { ...c, tempHp, currentHp: c.currentHp - remaining };
          }),
        }));
      },

      heal: (id, amount) => {
        set(s => ({
          characters: s.characters.map(c => {
            if (c.id !== id) return c;
            const { characters } = s;
            const char = characters.find(ch => ch.id === id);
            if (!char) return c;
            return { ...c, currentHp: c.currentHp + amount };
          }),
        }));
      },

      setTempHp: (id, amount) => {
        set(s => ({
          characters: s.characters.map(c =>
            c.id === id ? { ...c, tempHp: amount } : c,
          ),
        }));
      },

      fullRest: (id) => {
        set(s => ({
          characters: s.characters.map(c => {
            if (c.id !== id) return c;
            const maxHp = c.hitPointsRolled.reduce((sum, r) => sum + r, 0);
            return {
              ...c,
              currentHp: maxHp,
              tempHp: 0,
              nonLethalDamage: 0,
              preparedSpells: c.preparedSpells.map(sp => ({ ...sp, used: false })),
            };
          }),
        }));
      },

      addEquipment: (id, item) => {
        set(s => ({
          characters: s.characters.map(c =>
            c.id === id ? { ...c, equipment: [...c.equipment, item] } : c,
          ),
        }));
      },

      removeEquipment: (id, itemId) => {
        set(s => ({
          characters: s.characters.map(c =>
            c.id === id
              ? { ...c, equipment: c.equipment.filter(i => i.id !== itemId) }
              : c,
          ),
        }));
      },

      updateEquipment: (id, itemId, patch) => {
        set(s => ({
          characters: s.characters.map(c =>
            c.id === id
              ? {
                  ...c,
                  equipment: c.equipment.map(i => i.id === itemId ? { ...i, ...patch } : i),
                }
              : c,
          ),
        }));
      },

      setWizardDraft: (draft) => set({ wizardDraft: draft }),

      updateWizardDraft: (patch) => {
        set(s => ({
          wizardDraft: s.wizardDraft ? { ...s.wizardDraft, ...patch } : { ...patch },
        }));
      },

      commitWizardDraft: () => {
        const { wizardDraft } = get();
        if (!wizardDraft) return null;
        const id = wizardDraft.id ?? newId();
        const full: Character = { ...emptyCharacter(id), ...wizardDraft, id };
        // Set initial HP
        if (full.hitPointsRolled.length === 0 && full.classes.length > 0) {
          const cls = full.classes[0];
          const classDef = getClass(cls.classId);
          if (classDef) {
            full.hitPointsRolled = [classDef.hitDie];
          }
        }
        full.currentHp = full.hitPointsRolled.reduce((s, r) => s + r, 0);
        full.totalLevel = full.classes.reduce((s, e) => s + e.level, 0);
        set(s => ({
          characters: [...s.characters, full],
          activeId: id,
          wizardDraft: null,
        }));
        return id;
      },
    }),
    {
      name: 'pathfinder-characters',
      version: 1,
    },
  ),
);
