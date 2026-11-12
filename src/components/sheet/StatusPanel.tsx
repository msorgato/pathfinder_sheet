import { useState } from 'react';
import type { AbilityKey, ActiveEffect, Character } from '../../types';
import { CONDITIONS, getCondition } from '../../data/conditions';
import type { ConditionDefinition } from '../../data/conditions';
import { EFFECT_PRESETS } from '../../data/effectPresets';
import { ABILITY_SHORT, modifierLabel } from '../../data/modifierLabels';
import type { EffectInput } from '../../utils/characterStatus';
import { useCharacterStore } from '../../store/characterStore';
import { SheetModal } from '../ui/SheetModal';
import { EffectEditor } from './EffectEditor';
import { useDerivedStats } from './statHelpers';

const ABILITIES: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

type EditorState = { title: string; initial: EffectInput; effectId?: string } | null;

const OPEN_KEY = 'pf-status-panel-open';

function readOpen(): boolean {
  try { return localStorage.getItem(OPEN_KEY) === '1'; } catch { return false; }
}

/**
 * Collapsible "Condizioni ed effetti" section (closed by default): conditions,
 * effects, ability damage/drain and negative levels. Critical warnings stay
 * visible when closed.
 */
export function StatusPanel({ char }: { char: Character }) {
  const store = useCharacterStore();
  const d = useDerivedStats(char);
  const [open, setOpen] = useState(readOpen);
  const [pickCondition, setPickCondition] = useState(false);
  const [pickPreset, setPickPreset] = useState(false);
  const [editor, setEditor] = useState<EditorState>(null);

  const toggle = () => {
    setOpen(o => {
      try { localStorage.setItem(OPEN_KEY, o ? '0' : '1'); } catch { /* storage unavailable */ }
      return !o;
    });
  };

  const conditions = char.conditions ?? [];
  const effects = char.effects ?? [];
  const neg = char.negativeLevels ?? { temporary: 0, permanent: 0 };
  const damaged = Object.values(d.abilityDamage).some(v => v > 0) || Object.values(d.abilityDrain).some(v => v > 0);
  const activeCount = conditions.length + effects.filter(e => !e.disabled).length
    + (damaged ? 1 : 0) + (d.negativeLevels > 0 ? 1 : 0);

  const openEffect = (effect: ActiveEffect) => {
    const { id, ...initial } = effect;
    setEditor({ title: 'Modifica effetto', initial, effectId: id });
  };

  return (
    <div className={`status-panel${open ? ' is-open' : ''}`}>
      <button type="button" className="status-toggle" aria-expanded={open} onClick={toggle}>
        <span className="label-rune-soft">Condizioni ed effetti</span>
        {activeCount > 0 && <span className="status-count">{activeCount}</span>}
        <span className="status-chevron" aria-hidden="true">{open ? '▾' : '▸'}</span>
      </button>

      {d.warnings.map(w => (
        <div key={w} className="status-warning" role="alert">⚠ {w}</div>
      ))}

      {open && (
      <div className="status-body">

      {/* Conditions */}
      <div className="status-section-title">
        <span className="label-rune-soft">Condizioni</span>
        <button type="button" className="pf-btn pf-btn-ghost status-add" onClick={() => setPickCondition(true)}>+ Condizione</button>
      </div>
      {conditions.length === 0 && <p className="status-empty">Nessuna condizione.</p>}
      {conditions.map(c => {
        const def = getCondition(c.conditionId);
        if (!def) return null;
        return (
          <div key={c.id} className="status-row">
            <div style={{ minWidth: 0 }}>
              <div className="status-row-name">{def.name}</div>
              <div className="status-row-detail">{c.note ? `${c.note} — ` : ''}{def.summary}</div>
            </div>
            <button type="button" className="btn btn-ghost btn-icon" aria-label={`Rimuovi ${def.name}`}
              onClick={() => store.removeCondition(char.id, c.id)}>✕</button>
          </div>
        );
      })}

      {/* Effects */}
      <div className="status-section-title">
        <span className="label-rune-soft">Effetti</span>
        <button type="button" className="pf-btn pf-btn-ghost status-add" onClick={() => setPickPreset(true)}>+ Effetto</button>
      </div>
      {effects.length === 0 && <p className="status-empty">Nessun effetto.</p>}
      {effects.map(e => (
        <div key={e.id} className={`status-row${e.disabled ? ' is-disabled' : ''}`}>
          <div style={{ minWidth: 0 }}>
            <div className="status-row-name">
              {e.name}
              {e.disabled && <span className="status-tag"> · disattivato</span>}
            </div>
            <div className="status-row-detail">
              {e.modifiers.map(modifierLabel).join(', ') || 'Nessun modificatore automatico'}
              {e.note ? ` — ${e.note}` : ''}
            </div>
          </div>
          <div className="status-row-actions">
            <button type="button" className="btn btn-ghost btn-icon" aria-label={e.disabled ? `Attiva ${e.name}` : `Disattiva ${e.name}`}
              title={e.disabled ? 'Attiva' : 'Disattiva'} onClick={() => store.toggleEffect(char.id, e.id)}>
              {e.disabled ? '▶' : '⏸'}
            </button>
            <button type="button" className="btn btn-ghost btn-icon" aria-label={`Modifica ${e.name}`} title="Modifica"
              onClick={() => openEffect(e)}>✎</button>
            <button type="button" className="btn btn-ghost btn-icon" aria-label={`Rimuovi ${e.name}`} title="Rimuovi"
              onClick={() => store.removeEffect(char.id, e.id)}>✕</button>
          </div>
        </div>
      ))}

      {/* Ability damage and drain */}
      <div className="status-section-title">
        <span className="label-rune-soft">Danno e risucchio di caratteristica</span>
      </div>
      <div className="ability-damage-grid">
        {ABILITIES.map(a => (
          <div key={a} className="ability-damage-cell">
            <div className="label-rune-soft">{ABILITY_SHORT[a]}</div>
            <Stepper label={`Danno ${ABILITY_SHORT[a]}`} caption="Danno" value={d.abilityDamage[a]}
              onChange={v => store.setAbilityDamage(char.id, a, v)} />
            <Stepper label={`Risucchio ${ABILITY_SHORT[a]}`} caption="Risucchio" value={d.abilityDrain[a]}
              onChange={v => store.setAbilityDrain(char.id, a, v)} />
          </div>
        ))}
      </div>
      <p className="status-empty" style={{ marginTop: 6 }}>
        Il danno dà −1 al modificatore ogni 2 punti e guarisce di 1 punto con il Riposo completo. Il risucchio riduce il punteggio.
      </p>

      {/* Negative levels */}
      <div className="status-section-title">
        <span className="label-rune-soft">Livelli negativi</span>
      </div>
      <div className="negative-levels-row">
        <Stepper label="Livelli negativi temporanei" caption="Temporanei" value={neg.temporary}
          onChange={v => store.setNegativeLevels(char.id, { ...neg, temporary: v })} />
        <Stepper label="Livelli negativi permanenti" caption="Permanenti" value={neg.permanent}
          onChange={v => store.setNegativeLevels(char.id, { ...neg, permanent: v })} />
      </div>
      {d.negativeLevels > 0 && (
        <p className="status-empty" style={{ marginTop: 6 }}>
          −{d.negativeLevels} a tiri per colpire, TS, abilità, prove, CMB e CMD; −{5 * d.negativeLevels} PF massimi.
          Le capacità che dipendono dal livello (livello dell'incantatore incluso) contano {d.negativeLevels} livell{d.negativeLevels === 1 ? 'o' : 'i'} in meno.
        </p>
      )}

      </div>
      )}

      {pickCondition && (
        <ConditionPicker
          active={conditions.map(c => c.conditionId)}
          onApply={(id, note) => store.addCondition(char.id, id, note)}
          onClose={() => setPickCondition(false)}
        />
      )}

      {pickPreset && (
        <PresetPicker
          onPick={initial => { setPickPreset(false); setEditor({ title: initial.name ? `Aggiungi ${initial.name}` : 'Effetto personalizzato', initial }); }}
          onClose={() => setPickPreset(false)}
        />
      )}

      {editor && (
        <EffectEditor
          title={editor.title}
          initial={editor.initial}
          onSave={effect => (editor.effectId
            ? store.updateEffect(char.id, editor.effectId, effect)
            : store.addEffect(char.id, effect))}
          onClose={() => setEditor(null)}
        />
      )}
    </div>
  );
}

function Stepper({ label, caption, value, onChange }: { label: string; caption: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="stepper" aria-label={label}>
      <span className="stepper-caption">{caption}</span>
      <button type="button" aria-label={`${label}: meno`} disabled={value <= 0} onClick={() => onChange(value - 1)}>−</button>
      <span className={`stepper-value${value > 0 ? ' is-debuffed' : ''}`}>{value}</span>
      <button type="button" aria-label={`${label}: più`} onClick={() => onChange(value + 1)}>+</button>
    </div>
  );
}

function ConditionPicker({ active, onApply, onClose }: {
  active: string[];
  onApply: (id: string, note?: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [chosen, setChosen] = useState<ConditionDefinition | null>(null);
  const [note, setNote] = useState('');
  const list = CONDITIONS.filter(c => c.name.toLowerCase().includes(query.trim().toLowerCase()));

  if (chosen) {
    return (
      <SheetModal title={chosen.name} onClose={onClose}>
        <p style={{ color: 'var(--ink-soft)', marginTop: 0 }}>{chosen.summary}</p>
        {active.includes(chosen.id) && <p className="status-empty">Già attiva: verrà aggiornata la nota.</p>}
        <div className="effect-form-row">
          <label>
            <span className="label-rune-soft">Nota</span>
            <input className="pf-input w-full" placeholder="Es. Intimidire" value={note} onChange={e => setNote(e.target.value)} />
          </label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
          <button type="button" className="pf-btn pf-btn-ghost" onClick={() => setChosen(null)}>Indietro</button>
          <button type="button" className="pf-btn pf-btn-gold"
            onClick={() => { onApply(chosen.id, note); onClose(); }}>
            Applica
          </button>
        </div>
      </SheetModal>
    );
  }

  return (
    <SheetModal title="Aggiungi condizione" onClose={onClose}>
      <input className="pf-input w-full" placeholder="Cerca condizione…" value={query} onChange={e => setQuery(e.target.value)} autoFocus />
      <div className="picker-list">
        {list.map(c => (
          <button key={c.id} type="button" className="picker-item" onClick={() => setChosen(c)}>
            <span className="picker-item-name">{c.name}{active.includes(c.id) ? ' ✓' : ''}</span>
            <span className="picker-item-detail">{c.summary}</span>
          </button>
        ))}
        {list.length === 0 && <p className="status-empty">Nessuna condizione trovata.</p>}
      </div>
    </SheetModal>
  );
}

function PresetPicker({ onPick, onClose }: { onPick: (initial: EffectInput) => void; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const list = EFFECT_PRESETS.filter(p => p.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <SheetModal title="Aggiungi effetto" onClose={onClose}>
      <button type="button" className="pf-btn pf-btn-outline w-full" style={{ marginBottom: 10 }}
        onClick={() => onPick({ name: '', modifiers: [] })}>
        + Effetto personalizzato
      </button>
      <input className="pf-input w-full" placeholder="Cerca incantesimo o effetto…" value={query} onChange={e => setQuery(e.target.value)} autoFocus />
      <div className="picker-list">
        {list.map(p => (
          <button key={p.id} type="button" className="picker-item"
            onClick={() => onPick({ name: p.name, presetId: p.id, note: '', modifiers: p.modifiers.map(m => ({ ...m, target: { ...m.target } })) })}>
            <span className="picker-item-name">{p.name}</span>
            <span className="picker-item-detail">{p.summary}</span>
          </button>
        ))}
        {list.length === 0 && <p className="status-empty">Nessun preset trovato.</p>}
      </div>
    </SheetModal>
  );
}
