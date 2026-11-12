import type { Character } from '../../types';
import { inventoryOf } from '../../utils/inventory';
import { UseButton } from './ConsumableUse';
import { amountLabel, useConsumableDetail, useConsumableUse } from './consumableHooks';

/** Compact list of potions, scrolls and wands with a quick "Usa" action. Hidden without consumables. */
export function ConsumablesSection({ char, readOnly = false }: { char: Character; readOnly?: boolean }) {
  const detail = useConsumableDetail(char);
  const { run, noticeEl } = useConsumableUse(char);
  const items = inventoryOf(char).filter(i => i.spellItem);
  if (items.length === 0) return null;

  return (
    <div className="pf-panel p-4 space-y-2 consumables-section">
      <div className="status-section-title"><span className="label-rune-soft">Consumabili</span></div>
      {noticeEl}
      {items.map(item => (
        <div key={item.id} className="status-row equip-row">
          <div style={{ minWidth: 0 }}>
            <div className="status-row-name">
              {item.name} <span className="status-tag">{amountLabel(item)}</span>
            </div>
            <div className="status-row-detail">{detail(item).join(' · ')}</div>
          </div>
          {!readOnly && <div className="status-row-actions"><UseButton item={item} onUse={run} /></div>}
        </div>
      ))}
    </div>
  );
}
