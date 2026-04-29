import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataStore, useMergedFeats, useMergedSpells } from '../store/dataStore';
import { FEATS } from '../data/feats';
import { SPELLS } from '../data/spells';
import type { FeatDefinition, SpellDefinition, SpellSchool } from '../types';

// ── helpers ──────────────────────────────────────────────────────────────────

function triggerJsonDownload(data: object, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const FEAT_TYPES = ['Combat', 'General', 'Metamagic', 'Item Creation', 'Teamwork'] as const;
const SPELL_SCHOOLS: SpellSchool[] = [
  'Abjuration', 'Conjuration', 'Divination', 'Enchantment',
  'Evocation', 'Illusion', 'Necromancy', 'Transmutation', 'Universal',
];

const emptyFeat = (): FeatDefinition => ({
  id: `feat_${Date.now()}`,
  name: '',
  description: '',
  benefit: '',
  type: 'General',
});

const emptySpell = (): SpellDefinition => ({
  id: `spell_${Date.now()}`,
  name: '',
  school: 'Evocation',
  levels: {},
  castingTime: '1 azione standard',
  components: 'V, S',
  range: '',
  duration: 'Istantanea',
  savingThrow: 'Nessuno',
  spellResistance: 'No',
  description: '',
});

// ── sub-components ────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--theme-text-muted)' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      className="pf-input"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

function Textarea({ value, onChange, rows = 3 }: { value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <textarea
      className="pf-input"
      style={{ resize: 'vertical', minHeight: `${rows * 1.6}rem` }}
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  );
}

function Select<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: readonly T[] }) {
  return (
    <select
      className="pf-input"
      value={value}
      onChange={e => onChange(e.target.value as T)}
    >
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

// ── Feat editor ───────────────────────────────────────────────────────────────

function FeatEditor({ feat, isBase, onSave, onDelete, onReset }: {
  feat: FeatDefinition;
  isBase: boolean;
  onSave: (f: FeatDefinition) => void;
  onDelete: () => void;
  onReset?: () => void;
}) {
  const [draft, setDraft] = useState<FeatDefinition>({ ...feat });
  const set = (k: keyof FeatDefinition, v: unknown) => setDraft(d => ({ ...d, [k]: v }));
  const dirty = JSON.stringify(draft) !== JSON.stringify(feat);

  return (
    <div className="pf-panel p-4">
      <Field label="ID (immutabile)">
        <Input value={draft.id} onChange={v => !isBase && set('id', v)} />
      </Field>
      <Field label="Nome">
        <Input value={draft.name} onChange={v => set('name', v)} />
      </Field>
      <Field label="Tipo">
        <Select value={draft.type} onChange={v => set('type', v)} options={FEAT_TYPES} />
      </Field>
      <Field label="Prerequisiti">
        <Input value={draft.prerequisites ?? ''} onChange={v => set('prerequisites', v || undefined)} placeholder="es. FOR 13, BAB +1" />
      </Field>
      <Field label="Beneficio">
        <Textarea value={draft.benefit} onChange={v => set('benefit', v)} />
      </Field>
      <Field label="Descrizione">
        <Textarea value={draft.description} onChange={v => set('description', v)} />
      </Field>
      <div className="flex items-center gap-2 mt-1">
        <label className="flex items-center gap-1 text-xs cursor-pointer" style={{ color: 'var(--theme-text-muted)' }}>
          <input type="checkbox" checked={!!draft.repeatable} onChange={e => set('repeatable', e.target.checked || undefined)} />
          Ripetibile
        </label>
      </div>
      <div className="flex gap-2 mt-4">
        {dirty && (
          <button
            className="pf-btn pf-btn-gold text-xs px-4 py-1.5"
            onClick={() => onSave(draft)}
          >
            Salva
          </button>
        )}
        {isBase && onReset && (
          <button
            className="pf-btn pf-btn-ghost text-xs px-3 py-1.5"
            onClick={onReset}
          >
            Ripristina
          </button>
        )}
        <button
          className="pf-btn pf-btn-red text-xs px-3 py-1.5 ml-auto"
          onClick={onDelete}
        >
          {isBase ? 'Nascondi' : 'Elimina'}
        </button>
      </div>
    </div>
  );
}

// ── Spell editor ──────────────────────────────────────────────────────────────

function SpellEditor({ spell, isBase, onSave, onDelete, onReset }: {
  spell: SpellDefinition;
  isBase: boolean;
  onSave: (s: SpellDefinition) => void;
  onDelete: () => void;
  onReset?: () => void;
}) {
  const [draft, setDraft] = useState<SpellDefinition>({ ...spell, levels: { ...spell.levels } });
  const set = (k: keyof SpellDefinition, v: unknown) => setDraft(d => ({ ...d, [k]: v }));
  const dirty = JSON.stringify(draft) !== JSON.stringify(spell);

  const levelsStr = Object.entries(draft.levels).map(([cls, lv]) => `${cls}:${lv}`).join(', ');
  const parseLevels = (s: string): Record<string, number> => {
    const result: Record<string, number> = {};
    s.split(',').forEach(part => {
      const [cls, lv] = part.trim().split(':');
      const n = parseInt(lv, 10);
      if (cls && !isNaN(n)) result[cls.trim()] = n;
    });
    return result;
  };

  return (
    <div className="pf-panel p-4">
      <div className="grid grid-cols-2 gap-x-3">
        <Field label="ID (immutabile)">
          <Input value={draft.id} onChange={v => !isBase && set('id', v)} />
        </Field>
        <Field label="Nome">
          <Input value={draft.name} onChange={v => set('name', v)} />
        </Field>
        <Field label="Scuola">
          <Select value={draft.school} onChange={v => set('school', v)} options={SPELL_SCHOOLS} />
        </Field>
        <Field label="Sottoscuola">
          <Input value={draft.subSchool ?? ''} onChange={v => set('subSchool', v || undefined)} />
        </Field>
        <Field label="Descrittore">
          <Input value={draft.descriptor ?? ''} onChange={v => set('descriptor', v || undefined)} />
        </Field>
        <Field label="Tempo di lancio">
          <Input value={draft.castingTime} onChange={v => set('castingTime', v)} />
        </Field>
        <Field label="Componenti">
          <Input value={draft.components} onChange={v => set('components', v)} />
        </Field>
        <Field label="Gittata">
          <Input value={draft.range} onChange={v => set('range', v)} />
        </Field>
        <Field label="Durata">
          <Input value={draft.duration} onChange={v => set('duration', v)} />
        </Field>
        <Field label="Tiro Salvezza">
          <Input value={draft.savingThrow} onChange={v => set('savingThrow', v)} />
        </Field>
        <Field label="Resistenza Magica">
          <Input value={draft.spellResistance} onChange={v => set('spellResistance', v)} />
        </Field>
      </div>
      <Field label="Livelli per classe (es. wizard:3, cleric:4)">
        <Input
          value={levelsStr}
          onChange={v => set('levels', parseLevels(v))}
          placeholder="wizard:3, cleric:4"
        />
      </Field>
      <Field label="Descrizione">
        <Textarea value={draft.description} onChange={v => set('description', v)} rows={4} />
      </Field>
      <div className="flex gap-2 mt-4">
        {dirty && (
          <button
            className="pf-btn pf-btn-gold text-xs px-4 py-1.5"
            onClick={() => onSave(draft)}
          >
            Salva
          </button>
        )}
        {isBase && onReset && (
          <button
            className="pf-btn pf-btn-ghost text-xs px-3 py-1.5"
            onClick={onReset}
          >
            Ripristina
          </button>
        )}
        <button
          className="pf-btn pf-btn-red text-xs px-3 py-1.5 ml-auto"
          onClick={onDelete}
        >
          {isBase ? 'Nascondi' : 'Elimina'}
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type Tab = 'feats' | 'spells';

export function AdminPanel() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('feats');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const store = useDataStore();
  const mergedFeats = useMergedFeats();
  const mergedSpells = useMergedSpells();

  const baseFeatIds = new Set(FEATS.map(f => f.id));
  const baseSpellIds = new Set(SPELLS.map(s => s.id));

  // useMergedFeats/useMergedSpells already excludes hidden base items
  const visibleFeats = mergedFeats;
  const visibleSpells = mergedSpells;

  const q = search.toLowerCase();
  const filteredFeats = visibleFeats.filter(f =>
    f.name.toLowerCase().includes(q) || f.type.toLowerCase().includes(q) || f.benefit.toLowerCase().includes(q)
  );
  const filteredSpells = visibleSpells.filter(s =>
    s.name.toLowerCase().includes(q) || s.school.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
  );

  // ── data import/export ───────────────────────────────────────────────────

  const handleExport = () => {
    triggerJsonDownload(store.exportData(), `pathfinder-data-${new Date().toISOString().slice(0, 10)}.json`);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        store.importData(parsed);
      } catch {
        alert('File non valido');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // ── feat actions ─────────────────────────────────────────────────────────

  const saveFeat = (feat: FeatDefinition) => {
    if (baseFeatIds.has(feat.id)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, ...patch } = feat;
      store.patchFeat(feat.id, patch);
    } else {
      store.addFeat(feat);
    }
  };

  const deleteFeat = (id: string) => {
    if (baseFeatIds.has(id)) {
      store.hideFeat(id);
    } else {
      store.deleteFeat(id);
    }
    if (expanded === id) setExpanded(null);
  };

  const addNewFeat = () => {
    const f = emptyFeat();
    store.addFeat(f);
    setExpanded(f.id);
  };

  // ── spell actions ─────────────────────────────────────────────────────────

  const saveSpell = (spell: SpellDefinition) => {
    if (baseSpellIds.has(spell.id)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, ...patch } = spell;
      store.patchSpell(spell.id, patch);
    } else {
      store.addSpell(spell);
    }
  };

  const deleteSpell = (id: string) => {
    if (baseSpellIds.has(id)) {
      store.hideSpell(id);
    } else {
      store.deleteSpell(id);
    }
    if (expanded === id) setExpanded(null);
  };

  const addNewSpell = () => {
    const s = emptySpell();
    store.addSpell(s);
    setExpanded(s.id);
  };

  // ── render ────────────────────────────────────────────────────────────────

  const items = tab === 'feats' ? filteredFeats : filteredSpells;

  return (
    <div className="theme-root min-h-screen" style={{ background: 'var(--theme-bg)' }}>
      {/* Header */}
      <div className="pf-header px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--theme-accent)', fontFamily: 'var(--theme-font)' }}>
            Pannello Amministrativo
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
            Gestisci Talenti e Incantesimi
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="pf-btn pf-btn-outline text-xs px-3 py-1.5">
            Esporta Dati
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="pf-btn pf-btn-ghost text-xs px-3 py-1.5">
            Importa Dati
          </button>
          <button onClick={() => navigate('/')} className="pf-btn pf-btn-ghost text-xs px-3 py-1.5">
            ← Home
          </button>
          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-4 p-1 rounded-lg" style={{ background: 'var(--theme-bg-panel)' }}>
          {(['feats', 'spells'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setExpanded(null); setSearch(''); }}
              className="flex-1 py-2 rounded text-sm font-semibold transition-all"
              style={{
                background: tab === t ? 'var(--theme-accent)' : 'transparent',
                color: tab === t ? 'var(--theme-bg)' : 'var(--theme-text-muted)',
              }}
            >
              {t === 'feats' ? `Talenti (${visibleFeats.length})` : `Incantesimi (${visibleSpells.length})`}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex gap-2 mb-4">
          <input
            className="pf-input flex-1"
            placeholder={`Cerca ${tab === 'feats' ? 'talento' : 'incantesimo'}...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button
            className="pf-btn pf-btn-gold text-sm px-4"
            onClick={tab === 'feats' ? addNewFeat : addNewSpell}
          >
            + Aggiungi
          </button>
        </div>

        {/* List */}
        <div className="space-y-2">
          {items.length === 0 && (
            <div className="text-center py-12" style={{ color: 'var(--theme-text-faint)' }}>
              Nessun risultato
            </div>
          )}
          {tab === 'feats' && filteredFeats.map(feat => {
            const isBase = baseFeatIds.has(feat.id);
            const isModified = !!store.featPatches[feat.id];
            return (
              <div key={feat.id}>
                {/* Row header */}
                <button
                  className="w-full text-left pf-panel px-4 py-2.5 flex items-center justify-between transition-all"
                  style={{ borderColor: expanded === feat.id ? 'var(--theme-accent)' : undefined }}
                  onClick={() => setExpanded(expanded === feat.id ? null : feat.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-sm" style={{ color: 'var(--theme-accent)' }}>{feat.name || <em style={{ color: 'var(--theme-text-faint)' }}>senza nome</em>}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--theme-bg)', color: 'var(--theme-text-muted)' }}>{feat.type}</span>
                    {!isBase && <span className="text-xs px-1.5 rounded" style={{ background: 'rgba(200,164,67,0.15)', color: 'var(--theme-accent)' }}>custom</span>}
                    {isModified && <span className="text-xs px-1.5 rounded" style={{ background: 'rgba(96,165,250,0.15)', color: 'var(--theme-info)' }}>modificato</span>}
                  </div>
                  <span style={{ color: 'var(--theme-text-faint)' }}>{expanded === feat.id ? '▲' : '▼'}</span>
                </button>

                {expanded === feat.id && (
                  <div className="mt-1">
                    <FeatEditor
                      feat={feat}
                      isBase={isBase}
                      onSave={saveFeat}
                      onDelete={() => deleteFeat(feat.id)}
                      onReset={isBase ? () => store.resetFeat(feat.id) : undefined}
                    />
                  </div>
                )}
              </div>
            );
          })}

          {tab === 'spells' && filteredSpells.map(spell => {
            const isBase = baseSpellIds.has(spell.id);
            const isModified = !!store.spellPatches[spell.id];
            return (
              <div key={spell.id}>
                <button
                  className="w-full text-left pf-panel px-4 py-2.5 flex items-center justify-between transition-all"
                  style={{ borderColor: expanded === spell.id ? 'var(--theme-accent)' : undefined }}
                  onClick={() => setExpanded(expanded === spell.id ? null : spell.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-sm" style={{ color: 'var(--theme-accent)' }}>{spell.name || <em style={{ color: 'var(--theme-text-faint)' }}>senza nome</em>}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--theme-bg)', color: 'var(--theme-text-muted)' }}>{spell.school}</span>
                    {Object.entries(spell.levels).slice(0, 3).map(([cls, lv]) => (
                      <span key={cls} className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--theme-bg-panel-2)', color: 'var(--theme-text-muted)' }}>
                        {cls} {lv}
                      </span>
                    ))}
                    {!isBase && <span className="text-xs px-1.5 rounded" style={{ background: 'rgba(200,164,67,0.15)', color: 'var(--theme-accent)' }}>custom</span>}
                    {isModified && <span className="text-xs px-1.5 rounded" style={{ background: 'rgba(96,165,250,0.15)', color: 'var(--theme-info)' }}>modificato</span>}
                  </div>
                  <span style={{ color: 'var(--theme-text-faint)' }}>{expanded === spell.id ? '▲' : '▼'}</span>
                </button>

                {expanded === spell.id && (
                  <div className="mt-1">
                    <SpellEditor
                      spell={spell}
                      isBase={isBase}
                      onSave={saveSpell}
                      onDelete={() => deleteSpell(spell.id)}
                      onReset={isBase ? () => store.resetSpell(spell.id) : undefined}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
