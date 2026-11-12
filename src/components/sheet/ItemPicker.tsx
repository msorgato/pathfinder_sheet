import { useMemo, useState } from 'react';
import type { Character, ItemDefinition } from '../../types';
import { useDataStore } from '../../store/dataStore';
import { useCharacterStore } from '../../store/characterStore';
import { SheetModal } from '../ui/SheetModal';
import { formatCopper, gpToCopper, itemFromCatalog, totalCopper } from '../../utils/inventory';
import { gpLabel, itemStatsLabel, kgLabel } from '../../data/itemLabels';

/** Catalogue search and add/purchase dialog. */
export function ItemPicker({ char, onClose }: { char: Character; onClose: () => void }) {
  const items = useDataStore(s => s.builtinItems);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [chosen, setChosen] = useState<ItemDefinition | null>(null);

  const categories = useMemo(() => [...new Set(items.map(i => i.category))].sort((a, b) => a.localeCompare(b, 'it')), [items]);
  const q = query.trim().toLowerCase();
  const list = items
    .filter(i => (!category || i.category === category) && (!q || i.name.toLowerCase().includes(q)))
    .slice(0, 80);

  if (chosen) return <AddItem char={char} def={chosen} onBack={() => setChosen(null)} onDone={onClose} />;

  return (
    <SheetModal title="Aggiungi dal catalogo" onClose={onClose} maxWidth={480}>
      {items.length === 0 ? (
        <p className="status-empty">Catalogo in caricamento…</p>
      ) : (
        <>
          <input className="pf-input w-full" placeholder="Cerca oggetto…" value={query} onChange={e => setQuery(e.target.value)} autoFocus />
          <select className="pf-input w-full" style={{ marginTop: 8 }} value={category} onChange={e => setCategory(e.target.value)}
            aria-label="Categoria">
            <option value="">Tutte le categorie</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="picker-list">
            {list.map(i => (
              <button key={i.id} type="button" className="picker-item" onClick={() => setChosen(i)}>
                <span className="picker-item-name">{i.name}</span>
                <span className="picker-item-detail">
                  {[i.category, itemStatsLabel(i), gpLabel(i.priceGp), i.weightKg ? kgLabel(i.weightKg) : ''].filter(Boolean).join(' · ')}
                </span>
              </button>
            ))}
            {list.length === 0 && <p className="status-empty">Nessun oggetto trovato.</p>}
          </div>
        </>
      )}
    </SheetModal>
  );
}

/** Parses an Italian decimal ("12,5") into gold pieces; NaN when invalid. */
const parseGp = (s: string) => (s.trim() === '' ? NaN : Number(s.replace(',', '.')));

function AddItem({ char, def, onBack, onDone }: { char: Character; def: ItemDefinition; onBack: () => void; onDone: () => void }) {
  const { addEquipment, purchaseEquipment } = useCharacterStore();
  const [quantity, setQuantity] = useState(1);
  const [buying, setBuying] = useState(false);
  const [price, setPrice] = useState(String(def.priceGp).replace('.', ','));

  const available = totalCopper(char);
  const priceGp = parseGp(price);
  const priceCp = Number.isFinite(priceGp) ? gpToCopper(priceGp) : NaN;
  const invalid = !Number.isFinite(priceCp) || priceCp < 0;
  const missing = invalid ? 0 : Math.max(0, priceCp - available);
  const canBuy = !invalid && missing === 0;

  const setQty = (n: number) => {
    const qty = Math.max(1, Math.floor(n || 1));
    setQuantity(qty);
    setPrice(String(Math.round(def.priceGp * qty * 100) / 100).replace('.', ','));
  };

  const add = () => { addEquipment(char.id, itemFromCatalog(def, quantity)); onDone(); };
  const buy = () => {
    if (!canBuy) return;
    purchaseEquipment(char.id, itemFromCatalog(def, quantity), priceCp);
    onDone();
  };

  return (
    <SheetModal title={def.name} onClose={onDone} maxWidth={440}>
      <p className="status-empty" style={{ marginBottom: 8 }}>
        {[def.category, itemStatsLabel(def), `listino ${gpLabel(def.priceGp)}`, def.weightKg ? kgLabel(def.weightKg) : ''].filter(Boolean).join(' · ')}
      </p>
      <a href={def.url} target="_blank" rel="noreferrer" className="item-wiki-link">Scheda sul wiki ↗</a>

      <div className="effect-form-row">
        <label style={{ maxWidth: 120 }}>
          <span className="label-rune-soft">Quantità</span>
          <input className="pf-input w-full" type="number" min={1} value={quantity} onChange={e => setQty(Number(e.target.value))} />
        </label>
      </div>

      {buying ? (
        <div className="purchase-box">
          <label>
            <span className="label-rune-soft">Prezzo pagato (mo)</span>
            <input className="pf-input w-full" inputMode="decimal" value={price} autoFocus
              onChange={e => setPrice(e.target.value)} aria-invalid={!canBuy} />
          </label>
          <div className="purchase-info">
            Prezzo proposto: {gpLabel(Math.round(def.priceGp * quantity * 100) / 100)} · Monete disponibili: {formatCopper(available)}
          </div>
          {invalid && <div className="purchase-error" role="alert">Inserisci un prezzo valido (0 o più).</div>}
          {!invalid && missing > 0 && <div className="purchase-error" role="alert">Monete insufficienti: mancano {formatCopper(missing)}.</div>}
          <div className="purchase-actions">
            <button type="button" className="pf-btn pf-btn-ghost" onClick={() => setBuying(false)}>Annulla</button>
            <button type="button" className="pf-btn pf-btn-gold" disabled={!canBuy} onClick={buy}>
              Paga {invalid ? '' : formatCopper(priceCp)}
            </button>
          </div>
        </div>
      ) : (
        <div className="purchase-actions">
          <button type="button" className="pf-btn pf-btn-ghost" onClick={onBack}>Indietro</button>
          <button type="button" className="pf-btn pf-btn-outline" onClick={() => setBuying(true)}>Acquista…</button>
          <button type="button" className="pf-btn pf-btn-gold" onClick={add}>Aggiungi</button>
        </div>
      )}
    </SheetModal>
  );
}
