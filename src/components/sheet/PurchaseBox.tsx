import { useState } from 'react';
import type { Character } from '../../types';
import { formatCopper, gpToCopper, totalCopper } from '../../utils/inventory';
import { gpLabel } from '../../data/itemLabels';

/** Parses an Italian decimal ("12,5") into gold pieces; NaN when invalid. */
const parseGp = (s: string) => (s.trim() === '' ? NaN : Number(s.replace(',', '.')));

/**
 * Purchase panel: the proposed price is only a suggestion, editable before paying.
 * Remount it (via `key`) when the proposed price changes, to reset the field.
 */
export function PurchaseBox({ char, proposedGp, onCancel, onPay }: {
  char: Character;
  proposedGp: number;
  onCancel: () => void;
  onPay: (priceCp: number) => void;
}) {
  const [price, setPrice] = useState(String(proposedGp).replace('.', ','));
  const available = totalCopper(char);
  const priceGp = parseGp(price);
  const priceCp = Number.isFinite(priceGp) ? gpToCopper(priceGp) : NaN;
  const invalid = !Number.isFinite(priceCp) || priceCp < 0;
  const missing = invalid ? 0 : Math.max(0, priceCp - available);
  const canBuy = !invalid && missing === 0;

  return (
    <div className="purchase-box">
      <label>
        <span className="label-rune-soft">Prezzo pagato (mo)</span>
        <input className="pf-input w-full" inputMode="decimal" value={price} autoFocus
          onChange={e => setPrice(e.target.value)} aria-invalid={!canBuy} />
      </label>
      <div className="purchase-info">
        Prezzo proposto: {gpLabel(proposedGp)} · Monete disponibili: {formatCopper(available)}
      </div>
      {invalid && <div className="purchase-error" role="alert">Inserisci un prezzo valido (0 o più).</div>}
      {!invalid && missing > 0 && <div className="purchase-error" role="alert">Monete insufficienti: mancano {formatCopper(missing)}.</div>}
      <div className="purchase-actions">
        <button type="button" className="pf-btn pf-btn-ghost" onClick={onCancel}>Annulla</button>
        <button type="button" className="pf-btn pf-btn-gold" disabled={!canBuy} onClick={() => canBuy && onPay(priceCp)}>
          Paga {invalid ? '' : formatCopper(priceCp)}
        </button>
      </div>
    </div>
  );
}
