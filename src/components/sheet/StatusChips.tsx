import { useState } from 'react';
import type { Character } from '../../types';
import { getCondition } from '../../data/conditions';
import { modifierLabel } from '../../data/modifierLabels';
import { useCharacterStore } from '../../store/characterStore';
import { SheetModal } from '../ui/SheetModal';

type Selected = { kind: 'condition' | 'effect'; id: string } | null;

/** Header chips for active conditions and enabled effects. */
export function StatusChips({ char }: { char: Character }) {
  const { removeCondition, removeEffect } = useCharacterStore();
  const [selected, setSelected] = useState<Selected>(null);

  const conditions = (char.conditions ?? []).filter(c => getCondition(c.conditionId));
  const effects = (char.effects ?? []).filter(e => !e.disabled);
  if (conditions.length === 0 && effects.length === 0) return null;

  const selCondition = selected?.kind === 'condition' ? conditions.find(c => c.id === selected.id) : undefined;
  const selEffect = selected?.kind === 'effect' ? effects.find(e => e.id === selected.id) : undefined;
  const def = selCondition ? getCondition(selCondition.conditionId) : undefined;

  return (
    <>
      <div className="status-chips" aria-label="Condizioni ed effetti attivi">
        {conditions.map(c => (
          <button key={c.id} type="button" className="status-chip is-condition"
            title={getCondition(c.conditionId)?.summary}
            onClick={() => setSelected({ kind: 'condition', id: c.id })}>
            {getCondition(c.conditionId)?.name}
          </button>
        ))}
        {effects.map(e => (
          <button key={e.id} type="button" className="status-chip is-effect"
            onClick={() => setSelected({ kind: 'effect', id: e.id })}>
            {e.name}
          </button>
        ))}
      </div>

      {selCondition && def && (
        <SheetModal title={def.name} onClose={() => setSelected(null)}>
          <p style={{ color: 'var(--ink-soft)', marginTop: 0 }}>{def.summary}</p>
          {selCondition.note && <p style={{ color: 'var(--ink-mute)', fontStyle: 'italic' }}>{selCondition.note}</p>}
          <button className="pf-btn pf-btn-red" style={{ marginTop: 8 }}
            onClick={() => { removeCondition(char.id, selCondition.id); setSelected(null); }}>
            Rimuovi condizione
          </button>
        </SheetModal>
      )}

      {selEffect && (
        <SheetModal title={selEffect.name} onClose={() => setSelected(null)}>
          <ul style={{ margin: '0 0 10px', paddingLeft: 18, color: 'var(--ink-soft)' }}>
            {selEffect.modifiers.map((m, i) => <li key={i}>{modifierLabel(m)}</li>)}
            {selEffect.modifiers.length === 0 && <li>Nessun modificatore automatico</li>}
          </ul>
          {selEffect.note && <p style={{ color: 'var(--ink-mute)', fontStyle: 'italic' }}>{selEffect.note}</p>}
          <button className="pf-btn pf-btn-red" style={{ marginTop: 8 }}
            onClick={() => { removeEffect(char.id, selEffect.id); setSelected(null); }}>
            Rimuovi effetto
          </button>
        </SheetModal>
      )}
    </>
  );
}
