import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FEATS } from '../data/feats';
import { SPELLS } from '../data/spells';
import type { FeatDefinition, SpellDefinition } from '../types';

interface DataState {
  featPatches: Record<string, Partial<Omit<FeatDefinition, 'id'>>>;
  extraFeats: FeatDefinition[];
  hiddenFeatIds: string[];

  spellPatches: Record<string, Partial<Omit<SpellDefinition, 'id'>>>;
  extraSpells: SpellDefinition[];
  hiddenSpellIds: string[];

  patchFeat: (id: string, patch: Partial<Omit<FeatDefinition, 'id'>>) => void;
  addFeat: (feat: FeatDefinition) => void;
  hideFeat: (id: string) => void;
  deleteFeat: (id: string) => void;
  resetFeat: (id: string) => void;

  patchSpell: (id: string, patch: Partial<Omit<SpellDefinition, 'id'>>) => void;
  addSpell: (spell: SpellDefinition) => void;
  hideSpell: (id: string) => void;
  deleteSpell: (id: string) => void;
  resetSpell: (id: string) => void;

  exportData: () => object;
  importData: (raw: unknown) => void;
}

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      featPatches: {},
      extraFeats: [],
      hiddenFeatIds: [],

      spellPatches: {},
      extraSpells: [],
      hiddenSpellIds: [],

      patchFeat: (id, patch) =>
        set(s => ({ featPatches: { ...s.featPatches, [id]: { ...s.featPatches[id], ...patch } } })),

      addFeat: (feat) =>
        set(s => ({ extraFeats: [...s.extraFeats.filter(f => f.id !== feat.id), feat] })),

      hideFeat: (id) =>
        set(s => ({ hiddenFeatIds: s.hiddenFeatIds.includes(id) ? s.hiddenFeatIds : [...s.hiddenFeatIds, id] })),

      deleteFeat: (id) =>
        set(s => ({
          extraFeats: s.extraFeats.filter(f => f.id !== id),
          featPatches: Object.fromEntries(Object.entries(s.featPatches).filter(([k]) => k !== id)),
        })),

      resetFeat: (id) =>
        set(s => ({
          featPatches: Object.fromEntries(Object.entries(s.featPatches).filter(([k]) => k !== id)),
          hiddenFeatIds: s.hiddenFeatIds.filter(h => h !== id),
        })),

      patchSpell: (id, patch) =>
        set(s => ({ spellPatches: { ...s.spellPatches, [id]: { ...s.spellPatches[id], ...patch } } })),

      addSpell: (spell) =>
        set(s => ({ extraSpells: [...s.extraSpells.filter(sp => sp.id !== spell.id), spell] })),

      hideSpell: (id) =>
        set(s => ({ hiddenSpellIds: s.hiddenSpellIds.includes(id) ? s.hiddenSpellIds : [...s.hiddenSpellIds, id] })),

      deleteSpell: (id) =>
        set(s => ({
          extraSpells: s.extraSpells.filter(sp => sp.id !== id),
          spellPatches: Object.fromEntries(Object.entries(s.spellPatches).filter(([k]) => k !== id)),
        })),

      resetSpell: (id) =>
        set(s => ({
          spellPatches: Object.fromEntries(Object.entries(s.spellPatches).filter(([k]) => k !== id)),
          hiddenSpellIds: s.hiddenSpellIds.filter(h => h !== id),
        })),

      exportData: () => {
        const s = get();
        const hiddenF = new Set(s.hiddenFeatIds);
        const hiddenS = new Set(s.hiddenSpellIds);
        const feats = [
          ...FEATS.filter(f => !hiddenF.has(f.id)).map(f => ({ ...f, ...s.featPatches[f.id] })),
          ...s.extraFeats,
        ];
        const spells = [
          ...SPELLS.filter(sp => !hiddenS.has(sp.id)).map(sp => ({ ...sp, ...s.spellPatches[sp.id] })),
          ...s.extraSpells,
        ];
        return { version: 2, exportedAt: new Date().toISOString(), feats, spells };
      },

      importData: (raw) => {
        if (!raw || typeof raw !== 'object') return;
        const d = raw as Record<string, unknown>;

        const baseFeatMap = new Map(FEATS.map(f => [f.id, f]));
        const baseSpellMap = new Map(SPELLS.map(s => [s.id, s]));

        const incomingFeats = (d.feats as FeatDefinition[] | undefined) ?? [];
        const incomingSpells = (d.spells as SpellDefinition[] | undefined) ?? [];

        const incomingFeatIds = new Set(incomingFeats.map(f => f.id));
        const incomingSpellIds = new Set(incomingSpells.map(s => s.id));

        // base items missing from import → hidden
        const hiddenFeatIds = FEATS.filter(f => !incomingFeatIds.has(f.id)).map(f => f.id);
        const hiddenSpellIds = SPELLS.filter(s => !incomingSpellIds.has(s.id)).map(s => s.id);

        const featPatches: DataState['featPatches'] = {};
        const extraFeats: FeatDefinition[] = [];
        for (const feat of incomingFeats) {
          const base = baseFeatMap.get(feat.id);
          if (base) {
            const patch: Partial<Omit<FeatDefinition, 'id'>> = {};
            (Object.keys(feat) as Array<keyof FeatDefinition>).forEach(k => {
              if (k !== 'id' && JSON.stringify(feat[k]) !== JSON.stringify(base[k])) {
                (patch as Record<string, unknown>)[k] = feat[k];
              }
            });
            if (Object.keys(patch).length) featPatches[feat.id] = patch;
          } else {
            extraFeats.push(feat);
          }
        }

        const spellPatches: DataState['spellPatches'] = {};
        const extraSpells: SpellDefinition[] = [];
        for (const spell of incomingSpells) {
          const base = baseSpellMap.get(spell.id);
          if (base) {
            const patch: Partial<Omit<SpellDefinition, 'id'>> = {};
            (Object.keys(spell) as Array<keyof SpellDefinition>).forEach(k => {
              if (k !== 'id' && JSON.stringify(spell[k]) !== JSON.stringify(base[k])) {
                (patch as Record<string, unknown>)[k] = spell[k];
              }
            });
            if (Object.keys(patch).length) spellPatches[spell.id] = patch;
          } else {
            extraSpells.push(spell);
          }
        }

        set({ featPatches, extraFeats, hiddenFeatIds, spellPatches, extraSpells, hiddenSpellIds });
      },
    }),
    { name: 'pathfinder-data' },
  ),
);

export function useMergedFeats(): FeatDefinition[] {
  const { featPatches, extraFeats, hiddenFeatIds } = useDataStore();
  const hidden = new Set(hiddenFeatIds);
  const base = FEATS.filter(f => !hidden.has(f.id)).map(f => ({ ...f, ...featPatches[f.id] }));
  return [...base, ...extraFeats];
}

export function useMergedSpells(): SpellDefinition[] {
  const { spellPatches, extraSpells, hiddenSpellIds } = useDataStore();
  const hidden = new Set(hiddenSpellIds);
  const base = SPELLS.filter(s => !hidden.has(s.id)).map(s => ({ ...s, ...spellPatches[s.id] }));
  return [...base, ...extraSpells];
}
