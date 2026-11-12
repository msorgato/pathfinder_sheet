import type { BonusType, Modifier } from '../../types';
import { BONUS_TYPES, BONUS_TYPE_LABELS, TARGET_OPTIONS, targetKey } from '../../data/modifierLabels';
import { SKILLS } from '../../data/skills';

const SKILL_OPTIONS = [...SKILLS].sort((a, b) => a.name.localeCompare(b.name));

function targetFromKey(key: string): Modifier['target'] {
  if (key.startsWith('skill:')) return { kind: 'skill', skillId: key.slice(6) };
  return TARGET_OPTIONS.find(o => o.key === key)?.target ?? { kind: 'attack', scope: 'all' };
}

const newModifier = (): Modifier => ({ target: { kind: 'attack', scope: 'all' }, type: 'untyped', value: 1 });

/** Editable list of typed modifiers (value, bonus type, target), shared by effects and items. */
export function ModifierRows({ value, onChange }: { value: Modifier[]; onChange: (mods: Modifier[]) => void }) {
  const setMod = (i: number, patch: Partial<Modifier>) =>
    onChange(value.map((m, j) => (j === i ? { ...m, ...patch } : m)));

  return (
    <>
      {value.map((m, i) => (
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
            onClick={() => onChange(value.filter((_, j) => j !== i))}>✕</button>
        </div>
      ))}
      <button type="button" className="pf-btn pf-btn-outline" style={{ alignSelf: 'flex-start', fontSize: 12 }}
        onClick={() => onChange([...value, newModifier()])}>
        + Modificatore
      </button>
    </>
  );
}
