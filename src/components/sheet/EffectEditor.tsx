import { useState } from 'react';
import type { Modifier } from '../../types';
import type { EffectInput } from '../../utils/characterStatus';
import { SheetModal } from '../ui/SheetModal';
import { ModifierRows } from './ModifierRows';

interface Props {
  title: string;
  initial: EffectInput;
  onSave: (effect: EffectInput) => void;
  onClose: () => void;
}

/** Form for a preset copy or a custom effect: name, note and modifier rows. */
export function EffectEditor({ title, initial, onSave, onClose }: Props) {
  const [name, setName] = useState(initial.name);
  const [note, setNote] = useState(initial.note ?? '');
  const [mods, setMods] = useState<Modifier[]>(initial.modifiers.length
    ? initial.modifiers
    : [{ target: { kind: 'attack', scope: 'all' }, type: 'untyped', value: 1 }]);

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
        <ModifierRows value={mods} onChange={setMods} />

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
