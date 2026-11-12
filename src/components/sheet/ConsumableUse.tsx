import type { EquipmentItem } from '../../types';
import { remaining } from '../../utils/spellConsumables';

export function UseButton({ item, onUse }: { item: EquipmentItem; onUse: (item: EquipmentItem) => void }) {
  const empty = remaining(item) <= 0;
  return (
    <button type="button" className="pf-btn pf-btn-outline use-btn" disabled={empty}
      aria-label={`Usa ${item.name}`} onClick={() => onUse(item)}>Usa</button>
  );
}
