import { create } from 'zustand';
import { FEATS } from '../data/feats';
import { SPELLS } from '../data/spells';
import { auth } from '../lib/firebase';
import { saveDataStore, loadDataStore } from '../lib/firestoreSync';
import type { FeatDefinition, SpellDefinition } from '../types';

interface DataState {
  builtinFeats: FeatDefinition[];
  builtinSpells: SpellDefinition[];
  builtinLoaded: boolean;

  featPatches: Record<string, Partial<Omit<FeatDefinition, 'id'>>>;
  extraFeats: FeatDefinition[];
  hiddenFeatIds: string[];

  spellPatches: Record<string, Partial<Omit<SpellDefinition, 'id'>>>;
  extraSpells: SpellDefinition[];
  hiddenSpellIds: string[];

  loadBuiltinData: () => Promise<void>;
  loadFromFirestore: (uid: string) => Promise<void>;
  clearStore: () => void;

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
  mergeExtraFeats: (feats: FeatDefinition[]) => void;
  mergeExtraSpells: (spells: SpellDefinition[]) => void;
}

const empty = {
  featPatches:   {} as Record<string, Partial<Omit<FeatDefinition, 'id'>>>,
  extraFeats:    [] as FeatDefinition[],
  hiddenFeatIds: [] as string[],
  spellPatches:  {} as Record<string, Partial<Omit<SpellDefinition, 'id'>>>,
  extraSpells:   [] as SpellDefinition[],
  hiddenSpellIds:[] as string[],
};

function snapshot(s: typeof empty) {
  const { featPatches, extraFeats, hiddenFeatIds, spellPatches, extraSpells, hiddenSpellIds } = s;
  return { featPatches, extraFeats, hiddenFeatIds, spellPatches, extraSpells, hiddenSpellIds };
}

function sync(s: typeof empty) {
  const u = auth.currentUser?.uid;
  if (u) saveDataStore(u, snapshot(s)).catch(err => console.error('[Firestore] saveDataStore failed:', err));
}

export const useDataStore = create<DataState>()((set, get) => ({
  builtinFeats: [...FEATS],
  builtinSpells: [...SPELLS],
  builtinLoaded: false,
  ...empty,

  loadBuiltinData: async () => {
    const [spellsRes, featsRes] = await Promise.all([
      fetch('/data/spells.json'),
      fetch('/data/feats.json'),
    ]);
    const [spellsData, featsData] = await Promise.all([
      spellsRes.json() as Promise<{ spells: SpellDefinition[] }>,
      featsRes.json() as Promise<{ feats: FeatDefinition[] }>,
    ]);
    set({
      builtinSpells: spellsData.spells ?? [],
      builtinFeats: featsData.feats ?? [],
      builtinLoaded: true,
    });
  },

  loadFromFirestore: async (uid) => {
    const raw = await loadDataStore(uid);
    if (!raw) return;
    set({
      featPatches:    (raw.featPatches    as typeof empty.featPatches)   ?? {},
      extraFeats:     (raw.extraFeats     as FeatDefinition[])           ?? [],
      hiddenFeatIds:  (raw.hiddenFeatIds  as string[])                   ?? [],
      spellPatches:   (raw.spellPatches   as typeof empty.spellPatches)  ?? {},
      extraSpells:    (raw.extraSpells    as SpellDefinition[])          ?? [],
      hiddenSpellIds: (raw.hiddenSpellIds as string[])                   ?? [],
    });
  },

  clearStore: () => set({ ...empty }),

  patchFeat: (id, patch) => {
    set(s => ({ featPatches: { ...s.featPatches, [id]: { ...s.featPatches[id], ...patch } } }));
    sync(get());
  },

  addFeat: (feat) => {
    set(s => ({ extraFeats: [...s.extraFeats.filter(f => f.id !== feat.id), feat] }));
    sync(get());
  },

  hideFeat: (id) => {
    set(s => ({ hiddenFeatIds: s.hiddenFeatIds.includes(id) ? s.hiddenFeatIds : [...s.hiddenFeatIds, id] }));
    sync(get());
  },

  deleteFeat: (id) => {
    set(s => ({
      extraFeats: s.extraFeats.filter(f => f.id !== id),
      featPatches: Object.fromEntries(Object.entries(s.featPatches).filter(([k]) => k !== id)),
    }));
    sync(get());
  },

  resetFeat: (id) => {
    set(s => ({
      featPatches: Object.fromEntries(Object.entries(s.featPatches).filter(([k]) => k !== id)),
      hiddenFeatIds: s.hiddenFeatIds.filter(h => h !== id),
    }));
    sync(get());
  },

  patchSpell: (id, patch) => {
    set(s => ({ spellPatches: { ...s.spellPatches, [id]: { ...s.spellPatches[id], ...patch } } }));
    sync(get());
  },

  addSpell: (spell) => {
    set(s => ({ extraSpells: [...s.extraSpells.filter(sp => sp.id !== spell.id), spell] }));
    sync(get());
  },

  hideSpell: (id) => {
    set(s => ({ hiddenSpellIds: s.hiddenSpellIds.includes(id) ? s.hiddenSpellIds : [...s.hiddenSpellIds, id] }));
    sync(get());
  },

  deleteSpell: (id) => {
    set(s => ({
      extraSpells: s.extraSpells.filter(sp => sp.id !== id),
      spellPatches: Object.fromEntries(Object.entries(s.spellPatches).filter(([k]) => k !== id)),
    }));
    sync(get());
  },

  resetSpell: (id) => {
    set(s => ({
      spellPatches: Object.fromEntries(Object.entries(s.spellPatches).filter(([k]) => k !== id)),
      hiddenSpellIds: s.hiddenSpellIds.filter(h => h !== id),
    }));
    sync(get());
  },

  exportData: () => {
    const s = get();
    const hiddenF = new Set(s.hiddenFeatIds);
    const hiddenS = new Set(s.hiddenSpellIds);
    const feats = [
      ...s.builtinFeats.filter(f => !hiddenF.has(f.id)).map(f => ({ ...f, ...s.featPatches[f.id] })),
      ...s.extraFeats,
    ];
    const spells = [
      ...s.builtinSpells.filter(sp => !hiddenS.has(sp.id)).map(sp => ({ ...sp, ...s.spellPatches[sp.id] })),
      ...s.extraSpells,
    ];
    return { version: 2, exportedAt: new Date().toISOString(), feats, spells };
  },

  importData: (raw) => {
    if (!raw || typeof raw !== 'object') return;
    const d = raw as Record<string, unknown>;
    const s = get();
    const baseFeatMap  = new Map(s.builtinFeats.map(f => [f.id, f]));
    const baseSpellMap = new Map(s.builtinSpells.map(sp => [sp.id, sp]));
    const incomingFeats  = (d.feats  as FeatDefinition[]  | undefined) ?? [];
    const incomingSpells = (d.spells as SpellDefinition[] | undefined) ?? [];
    const incomingFeatIds  = new Set(incomingFeats.map(f => f.id));
    const incomingSpellIds = new Set(incomingSpells.map(sp => sp.id));
    const hiddenFeatIds  = s.builtinFeats.filter(f  => !incomingFeatIds.has(f.id)).map(f => f.id);
    const hiddenSpellIds = s.builtinSpells.filter(sp => !incomingSpellIds.has(sp.id)).map(sp => sp.id);
    const featPatches: DataState['featPatches'] = {};
    const extraFeats: FeatDefinition[] = [];
    for (const feat of incomingFeats) {
      const base = baseFeatMap.get(feat.id);
      if (base) {
        const patch: Partial<Omit<FeatDefinition, 'id'>> = {};
        (Object.keys(feat) as Array<keyof FeatDefinition>).forEach(k => {
          if (k !== 'id' && JSON.stringify(feat[k]) !== JSON.stringify(base[k]))
            (patch as Record<string, unknown>)[k] = feat[k];
        });
        if (Object.keys(patch).length) featPatches[feat.id] = patch;
      } else { extraFeats.push(feat); }
    }
    const spellPatches: DataState['spellPatches'] = {};
    const extraSpells: SpellDefinition[] = [];
    for (const spell of incomingSpells) {
      const base = baseSpellMap.get(spell.id);
      if (base) {
        const patch: Partial<Omit<SpellDefinition, 'id'>> = {};
        (Object.keys(spell) as Array<keyof SpellDefinition>).forEach(k => {
          if (k !== 'id' && JSON.stringify(spell[k]) !== JSON.stringify(base[k]))
            (patch as Record<string, unknown>)[k] = spell[k];
        });
        if (Object.keys(patch).length) spellPatches[spell.id] = patch;
      } else { extraSpells.push(spell); }
    }
    set({ featPatches, extraFeats, hiddenFeatIds, spellPatches, extraSpells, hiddenSpellIds });
    sync(get());
  },

  mergeExtraFeats: (incoming) => {
    set(s => {
      const existingIds = new Set([...s.builtinFeats.map(f => f.id), ...s.extraFeats.map(f => f.id)]);
      const newFeats = incoming.filter(f => !existingIds.has(f.id));
      if (newFeats.length === 0) return s;
      return { extraFeats: [...s.extraFeats, ...newFeats] };
    });
    sync(get());
  },

  mergeExtraSpells: (incoming) => {
    set(s => {
      const existingIds = new Set([...s.builtinSpells.map(sp => sp.id), ...s.extraSpells.map(sp => sp.id)]);
      const newSpells = incoming.filter(sp => !existingIds.has(sp.id));
      if (newSpells.length === 0) return s;
      return { extraSpells: [...s.extraSpells, ...newSpells] };
    });
    sync(get());
  },
}));

export function useMergedFeats(): FeatDefinition[] {
  const { builtinFeats, featPatches, extraFeats, hiddenFeatIds } = useDataStore();
  const hidden = new Set(hiddenFeatIds);
  return [
    ...builtinFeats.filter(f => !hidden.has(f.id)).map(f => ({ ...f, ...featPatches[f.id] })),
    ...extraFeats,
  ];
}

export function useMergedSpells(): SpellDefinition[] {
  const { builtinSpells, spellPatches, extraSpells, hiddenSpellIds } = useDataStore();
  const hidden = new Set(hiddenSpellIds);
  return [
    ...builtinSpells.filter(s => !hidden.has(s.id)).map(s => ({ ...s, ...spellPatches[s.id] })),
    ...extraSpells,
  ];
}
