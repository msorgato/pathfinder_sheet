import { useState } from 'react';
import type {
  AbilityKey, ArmorProficiency, CustomClassDefinition, CustomClassFeature, CustomClassFeatureType, SpellcastingSchool,
  SpellcastingType, SpellProgression, WeaponProficiencies,
} from '../../types';
import { CLASSES } from '../../data/classes';
import { PROGRESSION_LABELS, PROGRESSION_TABLES, progressionAllows } from '../../data/spellProgressions';
import { defaultCustomSpellLevel } from '../../utils/spellcasting';
import { BAB_PRESETS, SAVES_PRESETS, EMPTY_20 } from '../../data/classPresets';
import { SKILLS } from '../../data/skills';
import { useDataStore, useMergedSpells } from '../../store/dataStore';
import { ARMOR_PROFICIENCIES, ARMOR_PROFICIENCY_LABELS, classProficiencies } from '../../utils/proficiencies';

interface Props {
  cls: CustomClassDefinition;
  onSave: (updated: CustomClassDefinition) => void;
  onDelete: () => void;
  onPublish: () => void;
  onWithdraw: () => void;
}

const HIT_DICE = [4, 6, 8, 10, 12] as const;
const CASTING_ABILITIES: { value: AbilityKey; label: string }[] = [
  { value: 'int', label: 'Intelligenza' }, { value: 'wis', label: 'Saggezza' }, { value: 'cha', label: 'Carisma' },
];
const PROGRESSIONS = Object.keys(PROGRESSION_LABELS) as SpellProgression[];
const FEATURE_TYPES: CustomClassFeatureType[] = ['Ex', 'Su', 'Sp', 'special'];
const SPELL_SOURCE_LISTS = [
  { value: '', label: 'Nessuna' },
  { value: 'wizard', label: 'Mago' },
  { value: 'sorcerer', label: 'Stregone' },
  { value: 'cleric', label: 'Chierico' },
  { value: 'druid', label: 'Druido' },
  { value: 'bard', label: 'Bardo' },
  { value: 'paladin', label: 'Paladino' },
  { value: 'ranger', label: 'Ranger' },
];

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ── Numeric 20-cell grid ──────────────────────────────────────────────────────

interface NumGrid20Props {
  label: string;
  values: number[];
  onChange: (values: number[]) => void;
  presets?: { label: string; values: readonly number[] }[];
  error?: boolean;
}

function NumGrid20({ label, values, onChange, presets, error }: NumGrid20Props) {
  const setVal = (i: number, raw: string) => {
    const n = Math.max(0, parseInt(raw, 10) || 0);
    const next = [...values];
    next[i] = n;
    onChange(next);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span
          className="font-semibold uppercase tracking-wider"
          style={{ color: 'var(--theme-text-muted)', minWidth: 60, fontSize: 15 }}
        >
          {label}
        </span>
        {presets?.map(p => (
          <button
            key={p.label}
            type="button"
            className="pf-btn px-2 py-0.5"
            style={{ fontSize: 13 }}
            onClick={() => onChange([...p.values])}
          >
            {p.label}
          </button>
        ))}
      </div>
      {[0, 10].map(offset => (
        <div key={offset} className="grid grid-cols-10 gap-0.5 mb-0.5">
          {values.slice(offset, offset + 10).map((val, i) => (
            <div key={offset + i} className="flex flex-col items-center">
              <div style={{ fontSize: 13, color: 'var(--theme-text-faint)', lineHeight: 1 }}>{offset + i + 1}</div>
              <input
                type="number"
                min={0}
                value={val}
                onChange={e => setVal(offset + i, e.target.value)}
                className="pf-input text-center"
                style={{
                  padding: '2px 0',
                  fontSize: 15,
                  width: '100%',
                  borderColor: error && val < 0 ? 'var(--theme-hp-low)' : undefined,
                }}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Single feature row ────────────────────────────────────────────────────────

interface FeatureRowProps {
  feature: CustomClassFeature;
  onChange: (f: CustomClassFeature) => void;
  onDelete: () => void;
}

function FeatureRow({ feature, onChange, onDelete }: FeatureRowProps) {
  const set = <K extends keyof CustomClassFeature>(k: K, v: CustomClassFeature[K]) =>
    onChange({ ...feature, [k]: v });

  return (
    <div className="pf-panel p-3 space-y-2">
      <div className="flex gap-2 items-start">
        <div style={{ width: 52 }}>
          <div className="mb-0.5" style={{ color: 'var(--theme-text-muted)', fontSize: 15 }}>Lv</div>
          <input
            type="number"
            min={1}
            max={20}
            value={feature.level}
            onChange={e => set('level', Math.min(20, Math.max(1, parseInt(e.target.value, 10) || 1)))}
            className="pf-input text-center"
            style={{ padding: '4px 0', fontSize: 15, width: '100%' }}
          />
        </div>
        <div className="flex-1">
          <div className="mb-0.5" style={{ color: 'var(--theme-text-muted)', fontSize: 15 }}>Nome *</div>
          <input
            className="pf-input"
            value={feature.name}
            onChange={e => set('name', e.target.value)}
            placeholder="Nome capacità"
            style={{ borderColor: !feature.name.trim() ? 'var(--theme-hp-low)' : undefined }}
          />
        </div>
        <div style={{ width: 80 }}>
          <div className="mb-0.5" style={{ color: 'var(--theme-text-muted)', fontSize: 15 }}>Tipo</div>
          <select
            className="pf-input"
            value={feature.type}
            onChange={e => set('type', e.target.value as CustomClassFeatureType)}
          >
            {FEATURE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <button
          type="button"
          className="pf-btn pf-btn-red text-xs px-2 py-1 mt-5"
          onClick={onDelete}
        >
          ×
        </button>
      </div>
      <div>
        <div className="mb-0.5" style={{ color: 'var(--theme-text-muted)', fontSize: 15 }}>Descrizione</div>
        <textarea
          className="pf-input"
          rows={2}
          value={feature.description}
          onChange={e => set('description', e.target.value)}
          placeholder="Descrizione della capacità..."
          style={{ resize: 'vertical', minHeight: '3rem' }}
        />
      </div>
      <div>
        <div className="mb-0.5" style={{ color: 'var(--theme-text-muted)', fontSize: 15 }}>Modificatori meccanici (opzionale)</div>
        <input
          className="pf-input"
          value={feature.modifiers ?? ''}
          onChange={e => set('modifiers', e.target.value || undefined)}
          placeholder="Es: +2 ai tiri attacco, …"
        />
      </div>
    </div>
  );
}

// ── Main editor ───────────────────────────────────────────────────────────────

export function CustomClassEditor({ cls, onSave, onDelete, onPublish, onWithdraw }: Props) {
  const catalogue = useDataStore(s => s.builtinItems);
  const catalogueWeapons = catalogue.filter(i => i.kind === 'weapon');
  // Legacy free-text proficiencies are converted on open; the original text is kept in the note.
  const [initial] = useState<CustomClassDefinition>(() => {
    const copy: CustomClassDefinition = JSON.parse(JSON.stringify(cls));
    const { armor, weapons } = classProficiencies(copy, new Set(catalogueWeapons.map(w => w.id)));
    return { ...copy, armorProficiencies: armor, weaponProficiencies: weapons };
  });
  const [draft, setDraft] = useState<CustomClassDefinition>(initial);
  const [weaponToAdd, setWeaponToAdd] = useState('');
  const mergedSpells = useMergedSpells();

  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  const wp: WeaponProficiencies = typeof draft.weaponProficiencies === 'string'
    ? { groups: [], weapons: [], note: draft.weaponProficiencies }
    : draft.weaponProficiencies;
  const setWp = (patch: Partial<WeaponProficiencies>) => update('weaponProficiencies', { ...wp, ...patch });
  const toggleArmor = (a: ArmorProficiency, on: boolean) => update('armorProficiencies',
    ARMOR_PROFICIENCIES.filter(x => (x === a ? on : draft.armorProficiencies.includes(x))));

  function update<K extends keyof CustomClassDefinition>(key: K, value: CustomClassDefinition[K]) {
    setDraft(d => ({ ...d, [key]: value }));
  }

  // ── Validation ────────────────────────────────────────────────────────────
  const nameError = !draft.name.trim();
  const babError = draft.bab.some(v => v < 0);
  const savesError = (
    draft.saves.fort.some(v => v < 0) ||
    draft.saves.ref.some(v => v < 0) ||
    draft.saves.will.some(v => v < 0)
  );
  const featuresError = draft.features.some(f =>
    !f.name.trim() || f.level < 1 || f.level > 20,
  );
  const valid = !nameError && !babError && !savesError && !featuresError;

  // ── Feature helpers ───────────────────────────────────────────────────────
  const sortedFeatures = [...draft.features].sort((a, b) => a.level - b.level);

  function addFeature() {
    const f: CustomClassFeature = {
      id: genId(),
      name: '',
      description: '',
      level: 1,
      type: 'Ex',
    };
    update('features', [...draft.features, f]);
  }

  function updateFeature(id: string, updated: CustomClassFeature) {
    update('features', draft.features.map(f => f.id === id ? updated : f));
  }

  function deleteFeature(id: string) {
    update('features', draft.features.filter(f => f.id !== id));
  }

  // ── Spellcasting helpers ─────────────────────────────────────────────────
  const spellEnabled = draft.spellcasting?.enabled ?? false;

  function toggleSpell(enabled: boolean) {
    update('spellcasting', enabled ? { enabled: true } : undefined);
  }

  function updateSpellField<K extends keyof NonNullable<CustomClassDefinition['spellcasting']>>(
    k: K, v: NonNullable<CustomClassDefinition['spellcasting']>[K],
  ) {
    update('spellcasting', { ...draft.spellcasting, enabled: spellEnabled, [k]: v });
  }

  /** Setting a source list fills ability, type, tradition and progression from that class (still editable). */
  function changeSourceList(value: string) {
    const b = CLASSES.find(c => c.id === value)?.spellcasting;
    update('spellcasting', {
      ...draft.spellcasting, enabled: true, sourceList: value || undefined,
      ...(b ? { ability: b.ability, type: b.type, school: b.school, progression: b.progression, usesSpellbook: !!b.usesSpellbook } : {}),
    });
  }

  function changeProgression(progression: SpellProgression) {
    // Reduced casters are always prepared.
    const type = progressionAllows(progression, spellType ?? 'prepared') ? spellType : 'prepared';
    update('spellcasting', { ...draft.spellcasting, enabled: true, progression, ...(type ? { type } : {}) });
  }

  /** Additional spells carry their own level, proposed as the lowest among the spell's lists. */
  function toggleCustomSpell(id: string) {
    const sc = draft.spellcasting ?? { enabled: true };
    const current = sc.customSpells ?? [];
    const levels = { ...(sc.customSpellLevels ?? {}) };
    let next: string[];
    if (current.includes(id)) {
      next = current.filter(x => x !== id);
      delete levels[id];
    } else {
      next = [...current, id];
      const spell = mergedSpells.find(x => x.id === id);
      levels[id] = spell ? defaultCustomSpellLevel(spell) : 1;
    }
    update('spellcasting', {
      ...sc, enabled: true,
      customSpells: next.length ? next : undefined,
      customSpellLevels: Object.keys(levels).length ? levels : undefined,
    });
  }

  function setCustomSpellLevel(id: string, level: number) {
    const sc = draft.spellcasting ?? { enabled: true };
    update('spellcasting', {
      ...sc, enabled: true,
      customSpellLevels: { ...(sc.customSpellLevels ?? {}), [id]: Math.max(0, Math.min(maxSpellLevel, Math.floor(level) || 0)) },
    });
  }

  const selectedSpells = new Set(draft.spellcasting?.customSpells ?? []);
  // Effective values: the class's own, or inherited from the source list's built-in class
  const baseCasting = CLASSES.find(c => c.id === draft.spellcasting?.sourceList)?.spellcasting;
  const spellAbility: AbilityKey | undefined = draft.spellcasting?.ability ?? baseCasting?.ability;
  const spellType: SpellcastingType | undefined = draft.spellcasting?.type ?? baseCasting?.type;
  const spellSchool: SpellcastingSchool | undefined = draft.spellcasting?.school ?? baseCasting?.school;
  const spellProgression: SpellProgression | undefined = draft.spellcasting?.progression ?? baseCasting?.progression;
  const spellbook = draft.spellcasting?.usesSpellbook ?? baseCasting?.usesSpellbook ?? false;
  const maxSpellLevel = (spellProgression && spellType ? PROGRESSION_TABLES[spellProgression][spellType]?.maxSpellLevel : undefined) ?? 9;
  const missingSpellFields = [
    !spellAbility && 'caratteristica', !spellType && 'tipo', !spellProgression && 'progressione',
  ].filter(Boolean) as string[];

  // ── Skills helpers ────────────────────────────────────────────────────────
  function toggleSkill(skillId: string) {
    const current = draft.classSkills;
    const next = current.includes(skillId)
      ? current.filter(s => s !== skillId)
      : [...current, skillId];
    update('classSkills', next);
  }

  return (
    <div className="space-y-5">

      {/* ── Metadati ───────────────────────────────────────────────────── */}
      <div>
        <h3 className="text-base font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--theme-border-strong)' }}>
          Metadati
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <div className="mb-1" style={{ color: 'var(--theme-text-muted)', fontSize: 15 }}>Nome *</div>
            <input
              className="pf-input"
              value={draft.name}
              onChange={e => update('name', e.target.value)}
              placeholder="Nome della classe"
              style={{ borderColor: nameError ? 'var(--theme-hp-low)' : undefined }}
            />
            {nameError && <div className="mt-1" style={{ color: 'var(--theme-hp-low)', fontSize: 15 }}>Il nome è obbligatorio</div>}
          </div>

          <div className="col-span-2">
            <div className="mb-1" style={{ color: 'var(--theme-text-muted)', fontSize: 15 }}>Descrizione</div>
            <textarea
              className="pf-input"
              rows={2}
              value={draft.description}
              onChange={e => update('description', e.target.value)}
              placeholder="Descrizione della classe..."
              style={{ resize: 'vertical' }}
            />
          </div>

          <div>
            <div className="mb-1" style={{ color: 'var(--theme-text-muted)', fontSize: 15 }}>Dado Vita</div>
            <select className="pf-input" value={draft.hitDie} onChange={e => update('hitDie', Number(e.target.value))}>
              {HIT_DICE.map(d => <option key={d} value={d}>d{d}</option>)}
            </select>
          </div>

          <div>
            <div className="mb-1" style={{ color: 'var(--theme-text-muted)', fontSize: 15 }}>Abilità per livello</div>
            <input
              type="number"
              min={1}
              max={8}
              className="pf-input"
              value={draft.skillsPerLevel}
              onChange={e => update('skillsPerLevel', Math.max(1, parseInt(e.target.value, 10) || 2))}
            />
          </div>

          <div>
            <div className="mb-1" style={{ color: 'var(--theme-text-muted)', fontSize: 15 }}>Competenze Armature</div>
            <div className="flex flex-wrap gap-3" role="group" aria-label="Competenze armature">
              {ARMOR_PROFICIENCIES.map(a => (
                <label key={a} className="checkbox-inline">
                  <input type="checkbox" checked={draft.armorProficiencies.includes(a)} onChange={e => toggleArmor(a, e.target.checked)} />
                  {ARMOR_PROFICIENCY_LABELS[a]}
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1" style={{ color: 'var(--theme-text-muted)', fontSize: 15 }}>Competenze Armi</div>
            <div className="flex flex-wrap gap-3" role="group" aria-label="Gruppi di armi">
              {(['simple', 'martial'] as const).map(g => (
                <label key={g} className="checkbox-inline">
                  <input type="checkbox" checked={wp.groups.includes(g)}
                    onChange={e => setWp({ groups: (['simple', 'martial'] as const).filter(x => (x === g ? e.target.checked : wp.groups.includes(x))) })} />
                  {g === 'simple' ? 'Semplici' : 'Da guerra'}
                </label>
              ))}
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {wp.weapons.map(id => (
                <span key={id} className="status-chip is-effect">
                  {catalogue.find(i => i.id === id)?.name ?? id}
                  <button type="button" aria-label="Rimuovi" style={{ marginLeft: 6, background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
                    onClick={() => setWp({ weapons: wp.weapons.filter(w => w !== id) })}>✕</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <select className="pf-input" style={{ flex: 1, minWidth: 0 }} value={weaponToAdd} onChange={e => setWeaponToAdd(e.target.value)}
                aria-label="Arma specifica">
                <option value="">Aggiungi un'arma specifica…</option>
                {catalogueWeapons.filter(w => !wp.weapons.includes(w.id)).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
              <button type="button" className="pf-btn pf-btn-outline" disabled={!weaponToAdd}
                onClick={() => { setWp({ weapons: [...wp.weapons, weaponToAdd] }); setWeaponToAdd(''); }}>+</button>
            </div>
            <input
              className="pf-input mt-2"
              value={wp.note ?? ''}
              onChange={e => setWp({ note: e.target.value || undefined })}
              placeholder="Nota (es. testo originale, eccezioni)"
            />
          </div>
        </div>

        <div className="mt-3">
          <div className="mb-2" style={{ color: 'var(--theme-text-muted)', fontSize: 15 }}>Abilità di Classe</div>
          <div className="grid grid-cols-3 gap-1">
            {SKILLS.map(sk => (
              <label key={sk.id} className="flex items-center gap-1.5 cursor-pointer text-base" style={{ color: 'var(--theme-text-neutral)' }}>
                <input
                  type="checkbox"
                  checked={draft.classSkills.includes(sk.id)}
                  onChange={() => toggleSkill(sk.id)}
                  className="accent-[var(--theme-accent)]"
                />
                {sk.name}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* ── BAB ────────────────────────────────────────────────────────── */}
      <div>
        <h3 className="text-base font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--theme-border-strong)' }}>
          Base Attack Bonus
        </h3>
        <NumGrid20
          label="BAB"
          values={draft.bab}
          onChange={v => update('bab', v)}
          error={babError}
          presets={[
            { label: 'Full', values: BAB_PRESETS.full },
            { label: '3/4', values: BAB_PRESETS.threeQuarters },
            { label: '1/2', values: BAB_PRESETS.half },
            { label: 'Azzera', values: EMPTY_20 },
          ]}
        />
        {babError && <div className="mt-1" style={{ color: 'var(--theme-hp-low)', fontSize: 15 }}>I valori BAB non possono essere negativi</div>}
      </div>

      {/* ── Saving Throws ─────────────────────────────────────────────── */}
      <div>
        <h3 className="text-base font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--theme-border-strong)' }}>
          Tiri Salvezza
        </h3>
        <div className="space-y-3">
          {(['fort', 'ref', 'will'] as const).map(save => (
            <NumGrid20
              key={save}
              label={save === 'fort' ? 'Tempra' : save === 'ref' ? 'Riflessi' : 'Volontà'}
              values={draft.saves[save]}
              onChange={v => update('saves', { ...draft.saves, [save]: v })}
              error={savesError}
              presets={[
                { label: 'Buono', values: SAVES_PRESETS.good },
                { label: 'Scarso', values: SAVES_PRESETS.poor },
                { label: 'Azzera', values: EMPTY_20 },
              ]}
            />
          ))}
        </div>
        {savesError && <div className="mt-1" style={{ color: 'var(--theme-hp-low)', fontSize: 15 }}>I valori dei tiri salvezza non possono essere negativi</div>}
      </div>

      {/* ── Capacità Speciali ──────────────────────────────────────────── */}
      <div>
        <h3 className="text-base font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--theme-border-strong)' }}>
          Capacità Speciali
        </h3>
        <div className="space-y-2">
          {sortedFeatures.map(f => (
            <FeatureRow
              key={f.id}
              feature={f}
              onChange={updated => updateFeature(f.id, updated)}
              onDelete={() => deleteFeature(f.id)}
            />
          ))}
        </div>
        <button
          type="button"
          className="pf-btn mt-2 text-base px-3 py-1.5"
          style={{ background: 'rgba(200,164,67,0.1)', color: 'var(--theme-accent)', border: '1px dashed var(--theme-accent)' }}
          onClick={addFeature}
        >
          + Aggiungi Capacità
        </button>
        {featuresError && <div className="mt-1" style={{ color: 'var(--theme-hp-low)', fontSize: 15 }}>Controlla nome (obbligatorio) e livello (1–20) di ogni capacità</div>}
      </div>

      {/* ── Incantesimi ────────────────────────────────────────────────── */}
      <div>
        <h3 className="text-base font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--theme-border-strong)' }}>
          Incantesimi
        </h3>
        <label className="flex items-center gap-2 cursor-pointer mb-3">
          <input
            type="checkbox"
            checked={spellEnabled}
            onChange={e => toggleSpell(e.target.checked)}
            className="accent-[var(--theme-accent)]"
          />
          <span className="text-base" style={{ color: 'var(--theme-text-neutral)' }}>Abilita incantesimi per questa classe</span>
        </label>

        {spellEnabled && (
          <div className="space-y-3 pl-5">
            <div>
              <div className="mb-1" style={{ color: 'var(--theme-text-muted)', fontSize: 15 }}>Lista incantesimi sorgente</div>
              <select
                className="pf-input"
                style={{ maxWidth: 200 }}
                value={draft.spellcasting?.sourceList ?? ''}
                onChange={e => changeSourceList(e.target.value)}
              >
                {SPELL_SOURCE_LISTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3" style={{ maxWidth: 460 }}>
              <label>
                <div className="mb-1" style={{ color: 'var(--theme-text-muted)', fontSize: 15 }}>Caratteristica</div>
                <select className="pf-input w-full" value={spellAbility ?? ''} aria-label="Caratteristica di lancio"
                  onChange={e => updateSpellField('ability', (e.target.value || undefined) as AbilityKey | undefined)}>
                  <option value="">—</option>
                  {CASTING_ABILITIES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </label>
              <label>
                <div className="mb-1" style={{ color: 'var(--theme-text-muted)', fontSize: 15 }}>Tradizione</div>
                <select className="pf-input w-full" value={spellSchool ?? ''} aria-label="Tradizione"
                  onChange={e => updateSpellField('school', (e.target.value || undefined) as SpellcastingSchool | undefined)}>
                  <option value="">—</option>
                  <option value="arcane">Arcana</option>
                  <option value="divine">Divina</option>
                </select>
              </label>
              <label>
                <div className="mb-1" style={{ color: 'var(--theme-text-muted)', fontSize: 15 }}>Progressione</div>
                <select className="pf-input w-full" value={spellProgression ?? ''} aria-label="Progressione"
                  onChange={e => e.target.value && changeProgression(e.target.value as SpellProgression)}>
                  <option value="">—</option>
                  {PROGRESSIONS.map(p => <option key={p} value={p}>{PROGRESSION_LABELS[p]}</option>)}
                </select>
              </label>
              <div>
                <div className="mb-1" style={{ color: 'var(--theme-text-muted)', fontSize: 15 }}>Tipo</div>
                <div className="flex gap-3 items-center" style={{ minHeight: 38 }}>
                  {(['prepared', 'spontaneous'] as SpellcastingType[]).map(t => {
                    const disabled = !!spellProgression && !progressionAllows(spellProgression, t);
                    return (
                      <label key={t} className="flex items-center gap-1" style={{ opacity: disabled ? 0.45 : 1 }}
                        title={disabled ? 'Non disponibile con la progressione ridotta' : undefined}>
                        <input type="radio" name="spell-type" checked={spellType === t} disabled={disabled}
                          onChange={() => updateSpellField('type', t)} className="accent-[var(--theme-accent)]" />
                        {t === 'prepared' ? 'Preparati' : 'Spontanei'}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
            {spellType === 'prepared' && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={spellbook} onChange={e => updateSpellField('usesSpellbook', e.target.checked)}
                  className="accent-[var(--theme-accent)]" />
                <span style={{ color: 'var(--theme-text-neutral)' }}>Usa un libro degli incantesimi</span>
              </label>
            )}
            {missingSpellFields.length > 0 && (
              <div className="status-warning" role="alert" style={{ margin: 0 }}>
                ⚠ Manca: {missingSpellFields.join(', ')}. Finché non è completa, la classe non lancia incantesimi.
              </div>
            )}

            <div>
              <div className="mb-2" style={{ color: 'var(--theme-text-muted)', fontSize: 15 }}>
                Incantesimi custom dalla libreria ({selectedSpells.size} selezionati)
              </div>
              <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid var(--theme-border)', borderRadius: 6, padding: 8 }}>
                {mergedSpells.length === 0 && (
                  <div style={{ color: 'var(--theme-text-faint)', fontSize: 15 }}>Nessun incantesimo in libreria</div>
                )}
                {mergedSpells.map(sp => (
                  <label key={sp.id} className="flex items-center gap-2 py-0.5 cursor-pointer text-base" style={{ color: 'var(--theme-text-neutral)' }}>
                    <input
                      type="checkbox"
                      checked={selectedSpells.has(sp.id)}
                      onChange={() => toggleCustomSpell(sp.id)}
                      className="accent-[var(--theme-accent)]"
                    />
                    <span>{sp.name}</span>
                    <span style={{ color: 'var(--theme-text-faint)' }}>{sp.school}</span>
                    {selectedSpells.has(sp.id) && (
                      <span className="ml-auto flex items-center gap-1" onClick={e => e.preventDefault()}>
                        <span style={{ color: 'var(--theme-text-faint)' }}>Livello</span>
                        <input
                          type="number" min={0} max={maxSpellLevel} className="pf-input" style={{ width: 56, padding: '2px 6px' }}
                          aria-label={`Livello di ${sp.name}`}
                          value={draft.spellcasting?.customSpellLevels?.[sp.id] ?? defaultCustomSpellLevel(sp)}
                          onChange={e => setCustomSpellLevel(sp.id, Number(e.target.value))}
                        />
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Azioni ─────────────────────────────────────────────────────── */}
      <div className="flex gap-2 pt-3" style={{ borderTop: '1px solid var(--theme-ghost-border)' }}>
        <button
          type="button"
          className="pf-btn pf-btn-primary text-base px-4 py-2"
          disabled={!valid || !dirty}
          style={{ opacity: (!valid || !dirty) ? 0.5 : 1, cursor: (!valid || !dirty) ? 'not-allowed' : 'pointer' }}
          onClick={() => onSave({ ...draft, updatedAt: Date.now() })}
        >
          Salva
        </button>

        {cls.status === 'draft' && (
          <button
            type="button"
            className="pf-btn text-base px-4 py-2"
            disabled={dirty}
            style={{
              background: 'rgba(99,102,241,0.15)',
              color: dirty ? 'var(--theme-text-faint)' : '#a5b4fc',
              border: '1px solid rgba(99,102,241,0.4)',
              cursor: dirty ? 'not-allowed' : 'pointer',
            }}
            title={dirty ? 'Salva prima di pubblicare' : undefined}
            onClick={onPublish}
          >
            ↑ Pubblica
          </button>
        )}

        {cls.status === 'published' && (
          <button
            type="button"
            className="pf-btn text-base px-4 py-2"
            style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.4)' }}
            onClick={onWithdraw}
          >
            ↓ Ritira
          </button>
        )}

        <button
          type="button"
          className="pf-btn pf-btn-red text-base px-4 py-2 ml-auto"
          disabled={cls.status === 'published'}
          style={{ opacity: cls.status === 'published' ? 0.4 : 1, cursor: cls.status === 'published' ? 'not-allowed' : 'pointer' }}
          title={cls.status === 'published' ? 'Ritira la classe dalla libreria prima di eliminarla' : undefined}
          onClick={onDelete}
        >
          Elimina
        </button>
      </div>

      {cls.status === 'published' && (
        <div style={{ color: 'var(--theme-text-faint)', fontSize: 15 }}>
          Per eliminare questa classe devi prima ritirarla dalla libreria.
        </div>
      )}
    </div>
  );
}
