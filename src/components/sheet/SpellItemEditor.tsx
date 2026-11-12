import { useState } from 'react';
import type { ItemInput } from '../../utils/inventory';
import { SheetModal } from '../ui/SheetModal';
import { useMergedSpells } from '../../store/dataStore';
import {
  availableLists, listLabel, MAX_WAND_CHARGES, minCasterLevel, refreshSpellItem, spellItemDc,
} from '../../utils/spellConsumables';

const num = (v: string, fallback = 0) => (v.trim() === '' || !Number.isFinite(Number(v.replace(',', '.'))) ? fallback : Number(v.replace(',', '.')));

/** Reduced editor for potions, scrolls and wands: caster level, list, quantity or charges, price and notes. */
export function SpellItemEditor({ title, initial, onSave, onClose }: {
  title: string;
  initial: ItemInput;
  onSave: (item: ItemInput) => void;
  onClose: () => void;
}) {
  const spells = useMergedSpells();
  const [item, setItem] = useState<ItemInput>(() => structuredClone(initial));
  const [priceText, setPriceText] = useState(() => String(initial.priceGp ?? 0).replace('.', ','));
  const si = item.spellItem!;
  const spell = spells.find(s => s.id === si.spellId);
  const lists = spell ? availableLists(spell, si.form) : [];
  // Keep the current list selectable even if the spell data changed.
  if (!lists.some(l => l.classId === si.classId)) lists.unshift({ classId: si.classId, level: si.spellLevel });
  const minCl = minCasterLevel(si.spellLevel);

  /** Changes a spell parameter and recomputes name and price. */
  const change = (changes: Partial<typeof si>) => {
    const next = refreshSpellItem(item, changes);
    setItem(next);
    setPriceText(String(next.priceGp ?? 0).replace('.', ','));
  };
  const changeList = (classId: string) => {
    const level = lists.find(l => l.classId === classId)?.level ?? si.spellLevel;
    change({ classId, spellLevel: level });
  };

  return (
    <SheetModal title={title} onClose={onClose} maxWidth={600}>
      <div className="effect-form">
        <div className="status-row-name">{item.name}</div>
        <label>
          <span className="label-rune-soft">Lista di classe</span>
          <select className="pf-input w-full" value={si.classId} onChange={e => changeList(e.target.value)}>
            {lists.map(l => <option key={l.classId} value={l.classId}>{listLabel(l.classId)} · {l.level === 0 ? 'trucchetto' : `${l.level}° livello`}</option>)}
          </select>
        </label>
        <div className="effect-form-row">
          <label>
            <span className="label-rune-soft">Livello incantatore</span>
            <input className="pf-input w-full" type="number" min={minCl} title={`Minimo ${minCl}`} value={si.casterLevel}
              onChange={e => change({ casterLevel: Math.floor(Number(e.target.value) || minCl) })} />
          </label>
          {si.form === 'wand' ? (
            <label>
              <span className="label-rune-soft">Cariche (max {MAX_WAND_CHARGES})</span>
              <input className="pf-input w-full" type="number" min={0} max={MAX_WAND_CHARGES} value={si.charges ?? 0}
                onChange={e => change({ charges: Math.floor(Number(e.target.value) || 0) })} />
            </label>
          ) : (
            <label>
              <span className="label-rune-soft">Quantità</span>
              <input className="pf-input w-full" type="number" min={0} value={item.quantity}
                onChange={e => setItem(i => ({ ...i, quantity: Math.max(0, Math.floor(Number(e.target.value) || 0)) }))} />
            </label>
          )}
          <label>
            <span className="label-rune-soft">Prezzo (mo)</span>
            <input className="pf-input w-full" inputMode="decimal" value={priceText}
              onChange={e => { setPriceText(e.target.value); setItem(i => ({ ...i, priceGp: Math.max(0, num(e.target.value)) })); }} />
          </label>
        </div>
        {si.form !== 'potion' && <p className="status-empty">CD oggetto {spellItemDc(si.spellLevel)}</p>}
        <label>
          <span className="label-rune-soft">Note</span>
          <input className="pf-input w-full" value={item.notes} onChange={e => setItem(i => ({ ...i, notes: e.target.value }))} />
        </label>
      </div>
      <div className="purchase-actions">
        <button type="button" className="pf-btn pf-btn-ghost" onClick={onClose}>Annulla</button>
        <button type="button" className="pf-btn pf-btn-gold" onClick={() => { onSave(item); onClose(); }}>Salva</button>
      </div>
    </SheetModal>
  );
}
