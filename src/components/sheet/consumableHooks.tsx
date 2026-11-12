import { useEffect, useMemo, useState } from 'react';
import type { Character, EquipmentItem } from '../../types';
import { useCharacterStore } from '../../store/characterStore';
import { useDataStore } from '../../store/dataStore';
import type { ConsumableUndo } from '../../utils/spellConsumables';
import { remaining, spellItemDc, usability, usabilityLabel } from '../../utils/spellConsumables';

const NOTICE_MS = 6000;

/** "×3" for potions and scrolls, "37/50" for wands. */
export function amountLabel(item: EquipmentItem): string {
  const si = item.spellItem;
  if (si?.form === 'wand') return `${si.charges ?? 0}/${si.maxCharges ?? 50}`;
  return `×${item.quantity}`;
}

/** Detail parts shared by the inventory row and the combat section. */
export function useConsumableDetail(char: Character) {
  const published = useDataStore(s => s.publishedCustomClasses);
  const drafts = useDataStore(s => s.customClasses);
  const customClasses = useMemo(() => [...drafts, ...published], [drafts, published]);
  return (item: EquipmentItem): string[] => {
    const si = item.spellItem;
    if (!si) return [];
    const check = usabilityLabel(usability(char, item, customClasses));
    return [
      remaining(item) <= 0 && si.form === 'wand' ? 'scarica' : '',
      si.spellLevel === 0 ? 'trucchetto' : `${si.spellLevel}° livello`,
      check ?? '',
      si.form === 'potion' ? '' : `CD oggetto ${spellItemDc(si.spellLevel)}`,
    ].filter(Boolean);
  };
}

/** Uses a consumable and keeps the last use around for a few seconds, so it can be undone. */
export function useConsumableUse(char: Character) {
  const consume = useCharacterStore(s => s.useConsumable);
  const undoUse = useCharacterStore(s => s.undoConsumable);
  const [notice, setNotice] = useState<{ text: string; undo: ConsumableUndo } | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), NOTICE_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  const run = (item: EquipmentItem) => {
    const undo = consume(char.id, item.id);
    if (!undo) return;
    setNotice({ text: `${item.name} usata${undo.effectId ? ': effetto applicato' : ''}.`, undo });
  };

  const noticeEl = notice && (
    <div className="status-row use-notice" role="status">
      <span className="status-row-name">{notice.text}</span>
      <button type="button" className="pf-btn pf-btn-ghost"
        onClick={() => { undoUse(char.id, notice.undo); setNotice(null); }}>Annulla</button>
    </div>
  );
  return { run, noticeEl };
}
