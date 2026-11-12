import { useState } from 'react';
import type { BodySlot, Character } from '../../types';
import { useCharacterStore } from '../../store/characterStore';
import { inventoryOf } from '../../utils/inventory';
import { itemEffectsLabel, itemStatsLabel, SLOT_CAPACITY, SLOT_LABELS, SLOT_ORDER } from '../../data/itemLabels';
import { displayName } from '../../utils/itemEnhancements';
import { SheetModal } from '../ui/SheetModal';

type Item = ReturnType<typeof inventoryOf>[number];

/** One cell per slot position (rings take two), as on the paper character sheet. */
const CELLS: { slot: BodySlot; index: number }[] = SLOT_ORDER.filter(s => s !== 'none')
  .flatMap(slot => Array.from({ length: SLOT_CAPACITY[slot] ?? 1 }, (_, index) => ({ slot, index })));

/** Fixed overview of the body slots with the equipped items; free slots can be filled from carried items. */
export function EquipmentSlots({ char, readOnly = false, onOpenCatalog }: {
  char: Character;
  readOnly?: boolean;
  onOpenCatalog?: () => void;
}) {
  const store = useCharacterStore();
  const [picking, setPicking] = useState<BodySlot | null>(null);
  const items = inventoryOf(char);
  const worn = items.filter(i => i.equipped);
  const inSlot = (slot: BodySlot) => worn.filter(i => i.slot === slot);
  const slotless = inSlot('none');
  const candidates = picking ? items.filter(i => !i.equipped && i.slot === picking) : [];
  const detail = (i: Item) => [itemStatsLabel(i), itemEffectsLabel(i)].filter(Boolean).join(' · ');

  const cellLabel = (slot: BodySlot, index: number) =>
    (SLOT_CAPACITY[slot] ?? 1) > 1 ? `${SLOT_LABELS[slot]} ${index + 1}` : SLOT_LABELS[slot];

  const unequip = (item: Item) => !readOnly && (
    <button type="button" className="btn btn-ghost btn-icon slot-unequip" aria-label={`Togli ${item.name}`} title="Togli"
      onClick={() => store.toggleEquipped(char.id, item.id)}>✕</button>
  );

  return (
    <div className="slot-overview">
      <div className="slot-grid">
        {CELLS.map(({ slot, index }) => {
          const list = inSlot(slot);
          const capacity = SLOT_CAPACITY[slot] ?? 1;
          const item = list[index];
          // The last cell of a slot also shows items beyond its capacity.
          const extra = index === capacity - 1 ? list.slice(capacity) : [];
          const free = !item;
          return (
            <div key={`${slot}-${index}`} className={`slot-cell${free ? ' is-free' : ''}`}>
              <div className="slot-label">{cellLabel(slot, index)}</div>
              {free ? (
                readOnly
                  ? <div className="slot-empty">Libero</div>
                  : <button type="button" className="slot-empty slot-fill" onClick={() => setPicking(slot)}>
                      Libero <span aria-hidden="true">+</span>
                    </button>
              ) : (
                <div className="slot-item">
                  <div style={{ minWidth: 0 }}>
                    <div className="slot-item-name">{displayName(item)}</div>
                    {detail(item) && <div className="slot-item-detail">{detail(item)}</div>}
                  </div>
                  {unequip(item)}
                </div>
              )}
              {extra.map(x => (
                <div key={x.id} className="slot-item is-extra" title="Lo slot è già occupato: questo oggetto è equipaggiato ma non ha effetto">
                  <div style={{ minWidth: 0 }}>
                    <div className="slot-item-name">{displayName(x)}</div>
                    <div className="slot-item-detail">⚠ non attivo: lo slot è già occupato</div>
                  </div>
                  {unequip(x)}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <div className="slot-label slot-slotless-title">Impugnati e senza slot</div>
      {slotless.length === 0 && <p className="status-empty">Nessuno.</p>}
      {slotless.map(item => (
        <div key={item.id} className="slot-item slot-slotless">
          <div style={{ minWidth: 0 }}>
            <div className="slot-item-name">{displayName(item)}{item.quantity !== 1 ? ` ×${item.quantity}` : ''}</div>
            {detail(item) && <div className="slot-item-detail">{detail(item)}</div>}
          </div>
          {unequip(item)}
        </div>
      ))}

      {picking && (
        <SheetModal title={`Slot: ${SLOT_LABELS[picking]}`} onClose={() => setPicking(null)}>
          {candidates.length === 0 && (
            <p className="status-empty">Nessun oggetto trasportato per questo slot.</p>
          )}
          <div className="picker-list">
            {candidates.map(i => (
              <button key={i.id} type="button" className="picker-item"
                onClick={() => { store.toggleEquipped(char.id, i.id); setPicking(null); }}>
                <span className="picker-item-name">{displayName(i)}</span>
                {detail(i) && <span className="picker-item-detail">{detail(i)}</span>}
              </button>
            ))}
          </div>
          {onOpenCatalog && (
            <button type="button" className="pf-btn pf-btn-outline w-full" style={{ marginTop: 10 }}
              onClick={() => { setPicking(null); onOpenCatalog(); }}>
              + Dal catalogo
            </button>
          )}
        </SheetModal>
      )}
    </div>
  );
}
