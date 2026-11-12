import { useState } from 'react';
import type { BonusType, Modifier } from '../../types';
import type { EffectInput } from '../../utils/characterStatus';
import { BONUS_TYPES, BONUS_TYPE_LABELS, TARGET_OPTIONS, targetKey } from '../../data/modifierLabels';
import { SKILLS } from '../../data/skills';
import { SheetModal } from '../ui/SheetModal';

interface Props {
  title: string;
  initial: EffectInput;
  onSave: (effect: EffectInput) => void;
  onClose: () => void;
}

const SKILL_OPTIONS = [...SKILLS].sort((a, b) => a.name.localeCompare(b.name));

function targetFromKey(key: string): Modifier['target'] {
  if (key.startsWith('skill:')) return { kind: 'skill', skillId: key.slice(6) };
  return TARGET_OPTIONS.find(o => o.key === key)?.target ?? { kind: 'attack', scope: 'all' };
}

/** Form for a preset copy or a custom effect: name, note, duration and modifier rows. */
export function EffectEditor({ title, initial, onSave, onClose }: Props) {
  const [name, setName] = useState(initial.name);
  const [note, setNote] = useState(initial.note ?? '');
  const [mods, setMods] = useState<Modifier[]>(initial.modifiers.length
    ? initial.modifiers
    : [{ target: { kind: 'attack', scope: 'all' }, type: 'untyped', value: 1 }]);

  const setMod = (i: number, patch: Partial<Modifier>) =>
    setMods(list => list.map((m, j) => (j === i ? { ...m, ...patch } : m)));

  const save = () => {
    onSave({ ...initial, name, note, modifiers: mods });
    onClose();
  };

  return (
    <SheetModal title={title} onClose={onClose} maxWidth={520}>
      <div className="effect-form">
        <label>
          <span className="label-rune-soft">Nome</span>
          <input className="pf-input w-full" value={name} onChange={e => setName(e.target.value)} autoFocus />
        </label>

        <div className="label-rune-soft" style={{ marginTop: 6 }}>Modificatori</div>
        {mods.map((m, i) => (
          <div key={i} className="modifier-row">
            <input
              className="pf-input text-center"
              type="number"
              aria-label="Valore"
              value={Number.isFinite(m.value) ? m.value : ''}
              onChange={e => setMod(i, { value: Number(e.target.value) })}
            />
            <select className="pf-input" aria-label="Tipo di bonus" value={m.type}
              onChange={e => setMod(i, { type: e.target.value as BonusType })}>
              {BONUS_TYPES.map(t => <option key={t} value={t}>{BONUS_TYPE_LABELS[t]}</option>)}
            </select>
            <select className="pf-input" aria-label="Bersaglio" value={targetKey(m.target)}
              onChange={e => setMod(i, { target: targetFromKey(e.target.value) })}>
              {TARGET_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
              <optgroup label="Singola abilità">
                {SKILL_OPTIONS.map(s => <option key={s.id} value={`skill:${s.id}`}>{s.name}</option>)}
              </optgroup>
            </select>
            <button type="button" className="btn btn-ghost btn-icon" aria-label="Rimuovi modificatore"
              onClick={() => setMods(list => list.filter((_, j) => j !== i))}>✕</button>
          </div>
        ))}
        <button type="button" className="pf-btn pf-btn-outline" style={{ alignSelf: 'flex-start', fontSize: 12 }}
          onClick={() => setMods(list => [...list, { target: { kind: 'attack', scope: 'all' }, type: 'untyped', value: 1 }])}>
          + Modificatore
        </button>

        <div className="effect-form-row">
          <label>
            <span className="label-rune-soft">Nota</span>
            <input className="pf-input w-full" placeholder="Es. lanciato dal chierico" value={note} onChange={e => setNote(e.target.value)} />
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
          <button type="button" className="pf-btn pf-btn-ghost" onClick={onClose}>Annulla</button>
          <button type="button" className="pf-btn pf-btn-gold" onClick={save}>Salva</button>
        </div>
      </div>
    </SheetModal>
  );
}
