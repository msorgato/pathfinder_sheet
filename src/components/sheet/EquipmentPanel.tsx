import { useState } from 'react';
import type { Character, EquipmentItem } from '../../types';
import { useCharacterStore } from '../../store/characterStore';
import { getRace } from '../../data/races';
import { emptyItemInput, formatCopper, inventoryOf, totalCopper, totalWeight } from '../../utils/inventory';
import type { ItemInput } from '../../utils/inventory';
import { gpLabel, itemEffectsLabel, itemStatsLabel, kgLabel } from '../../data/itemLabels';
import { displayName, isMasterwork, enhancementOf } from '../../utils/itemEnhancements';
import { inactiveItemIds } from '../../utils/activeItems';
import { EquipmentSlots } from './EquipmentSlots';
import { SheetModal } from '../ui/SheetModal';
import { ItemPicker } from './ItemPicker';
import { ItemEditor } from './ItemEditor';
import { ProficienciesSection } from './ProficienciesSection';
import { SpellItemCreator } from './SpellItemCreator';
import { UseButton } from './ConsumableUse';
import { amountLabel, useConsumableDetail, useConsumableUse } from './consumableHooks';
import { useDerivedStats } from './statHelpers';

type Editor = { title: string; initial: ItemInput; itemId?: string } | null;

const COINS = [
  { key: 'platinum', label: 'mp' }, { key: 'gold', label: 'mo' }, { key: 'silver', label: 'ma' }, { key: 'copper', label: 'mr' },
] as const;

/** "Equipaggiamento" tab: worn and carried items, coins, weight, speed and proficiencies. */
export function EquipmentPanel({ char, readOnly = false }: { char: Character; readOnly?: boolean }) {
  const store = useCharacterStore();
  const d = useDerivedStats(char);
  const [picker, setPicker] = useState(false);
  const [creator, setCreator] = useState(false);
  const detail = useConsumableDetail(char);
  const { run: useItem, noticeEl } = useConsumableUse(char);
  const [editor, setEditor] = useState<Editor>(null);
  const [confirmRemove, setConfirmRemove] = useState<EquipmentItem | null>(null);

  const size = getRace(char.race)?.size ?? 'Medium';
  const items = inventoryOf(char);
  const inactive = inactiveItemIds(char);
  const carried = items.filter(i => !i.equipped);
  const weight = totalWeight(char);
  const warnings = d.warnings.filter(w => /armatura|scud|metallo|incantesimi arcani/i.test(w));

  const openEdit = (item: EquipmentItem) => {
    const { id, ...initial } = item;
    setEditor({ title: `Modifica ${item.name}`, initial, itemId: id });
  };

  const row = (item: ReturnType<typeof inventoryOf>[number]) => (
    <div key={item.id} className="status-row equip-row">
      <div style={{ minWidth: 0 }}>
        <div className="status-row-name">
          {displayName(item)}
          {item.spellItem ? <span className="status-tag"> {amountLabel(item)}</span>
            : item.quantity !== 1 ? <span className="status-tag"> ×{item.quantity}</span> : null}
          {inactive.has(item.id) && <span className="status-tag"> · non attivo</span>}
        </div>
        <div className="status-row-detail">
          {[...detail(item), itemStatsLabel(item, size), isMasterwork(item) && !enhancementOf(item) ? 'perfetto' : '', itemEffectsLabel(item),
            item.weightKg ? kgLabel(item.weightKg * item.quantity) : '', item.notes].filter(Boolean).join(' · ')}
        </div>
      </div>
      {!readOnly && (
        <div className="status-row-actions">
          {item.spellItem && <UseButton item={item} onUse={useItem} />}
          {!item.spellItem && <button type="button" className={`btn btn-ghost btn-icon${item.equipped ? ' is-on' : ''}`}
            aria-pressed={item.equipped} aria-label={item.equipped ? `Togli ${item.name}` : `Indossa ${item.name}`}
            title={item.equipped ? 'Togli' : 'Indossa / impugna'} onClick={() => store.toggleEquipped(char.id, item.id)}>
            {item.equipped ? '◉' : '○'}
          </button>}
          <button type="button" className="btn btn-ghost btn-icon" aria-label={`Modifica ${item.name}`} title="Modifica"
            onClick={() => openEdit(item)}>✎</button>
          <button type="button" className="btn btn-ghost btn-icon" aria-label={`Rimuovi ${item.name}`} title="Rimuovi"
            onClick={() => setConfirmRemove(item)}>✕</button>
        </div>
      )}
    </div>
  );

  return (
    <div className="pf-panel p-4 space-y-2 equipment-panel">
      <div className="equip-summary">
        <div className="stat-tile equip-tile">
          <div className="label-rune-soft">Peso</div>
          <div className="numeral">{kgLabel(weight.total)}</div>
          <div className="equip-tile-detail">monete {kgLabel(weight.coins)}</div>
        </div>
        <div className="stat-tile equip-tile">
          <div className="label-rune-soft">Pen. armatura</div>
          <div className={`numeral${d.armorCheckPenalty < 0 ? ' is-debuffed' : ''}`}>{d.armorCheckPenalty}</div>
          <div className="equip-tile-detail">{d.arcaneSpellFailure ? `fall. arcano ${d.arcaneSpellFailure}%` : ' '}</div>
        </div>
      </div>

      {noticeEl}
      {warnings.map(w => <div key={w} className="status-warning equip-warning" role="alert">⚠ {w}</div>)}

      {!readOnly && (
        <div className="equip-actions">
          <button type="button" className="pf-btn pf-btn-outline" onClick={() => setPicker(true)}>+ Dal catalogo</button>
          <button type="button" className="pf-btn pf-btn-ghost"
            onClick={() => setEditor({ title: 'Oggetto personalizzato', initial: emptyItemInput() })}>+ Personalizzato</button>
          <button type="button" className="pf-btn pf-btn-ghost" onClick={() => setCreator(true)}>+ Pozione / pergamena / bacchetta</button>
        </div>
      )}

      <div className="status-section-title"><span className="label-rune-soft">Equipaggiamento indossato</span></div>
      <EquipmentSlots char={char} readOnly={readOnly} onOpenCatalog={() => setPicker(true)} />

      <div className="status-section-title"><span className="label-rune-soft">Trasportati</span></div>
      {carried.length === 0 && <p className="status-empty">Nessun oggetto trasportato.</p>}
      {carried.map(row)}

      <div className="status-section-title">
        <span className="label-rune-soft">Monete</span>
        <span className="status-tag">totale {formatCopper(totalCopper(char))}</span>
      </div>
      <div className="coin-grid">
        {COINS.map(({ key, label }) => (
          <label key={key} className="coin-cell">
            <span className="label-rune-soft">{label}</span>
            {readOnly
              ? <span className="numeral">{char[key] ?? 0}</span>
              : <input className="pf-input w-full" type="number" min={0} value={char[key] ?? 0}
                  onChange={e => store.updateCharacter(char.id, { [key]: Math.max(0, Math.floor(Number(e.target.value) || 0)) })} />}
          </label>
        ))}
      </div>

      <ProficienciesSection char={char} readOnly={readOnly} />

      {creator && <SpellItemCreator char={char} onClose={() => setCreator(false)} />}
      {picker && <ItemPicker char={char} onClose={() => setPicker(false)} />}

      {editor && (
        <ItemEditor
          title={editor.title}
          initial={editor.initial}
          onSave={item => (editor.itemId ? store.updateEquipment(char.id, editor.itemId, item) : store.addEquipment(char.id, item))}
          onClose={() => setEditor(null)}
        />
      )}

      {confirmRemove && (
        <SheetModal title={`Rimuovere ${confirmRemove.name}?`} onClose={() => setConfirmRemove(null)}>
          <p className="status-empty">
            {char.weaponAttacks?.some(a => a.itemId === confirmRemove.id)
              ? 'L\'attacco collegato resta, con le ultime statistiche dell\'arma.'
              : `Valore di listino ${gpLabel(confirmRemove.priceGp ?? 0)}: la rimozione non restituisce monete.`}
          </p>
          <div className="purchase-actions">
            <button type="button" className="pf-btn pf-btn-ghost" onClick={() => setConfirmRemove(null)}>Annulla</button>
            <button type="button" className="pf-btn pf-btn-gold"
              onClick={() => { store.removeEquipment(char.id, confirmRemove.id); setConfirmRemove(null); }}>Rimuovi</button>
          </div>
        </SheetModal>
      )}
    </div>
  );
}
