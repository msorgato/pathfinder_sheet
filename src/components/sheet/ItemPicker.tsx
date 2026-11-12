import { useMemo, useState } from 'react';
import type { Character, ItemDefinition } from '../../types';
import { useDataStore } from '../../store/dataStore';
import { useCharacterStore } from '../../store/characterStore';
import { SheetModal } from '../ui/SheetModal';
import { itemFromCatalog } from '../../utils/inventory';
import { PurchaseBox } from './PurchaseBox';
import { gpLabel, itemStatsLabel, kgLabel, magicInfoLabel } from '../../data/itemLabels';

type Scope = 'all' | 'common' | 'magic';
const SCOPES: { id: Scope; label: string }[] = [{ id: 'all', label: 'Tutti' }, { id: 'common', label: 'Comuni' }, { id: 'magic', label: 'Magici' }];
const LIMIT = 80;

/** Catalogue search and add/purchase dialog. */
export function ItemPicker({ char, onClose }: { char: Character; onClose: () => void }) {
  const items = useDataStore(s => s.builtinItems);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [scope, setScope] = useState<Scope>('all');
  const [chosen, setChosen] = useState<ItemDefinition | null>(null);

  const inScope = useMemo(
    () => items.filter(i => scope === 'all' || (scope === 'magic') === (i.kind === 'magic')),
    [items, scope],
  );
  const categories = useMemo(() => [...new Set(inScope.map(i => i.category))].sort((a, b) => a.localeCompare(b, 'it')), [inScope]);
  const q = query.trim().toLowerCase();
  const matching = inScope.filter(i => (!category || i.category === category) && (!q || i.name.toLowerCase().includes(q)));
  const list = matching.slice(0, LIMIT);

  if (chosen) return <AddItem char={char} def={chosen} onBack={() => setChosen(null)} onDone={onClose} />;

  return (
    <SheetModal title="Aggiungi dal catalogo" onClose={onClose} maxWidth={480}>
      {items.length === 0 ? (
        <p className="status-empty">Catalogo in caricamento…</p>
      ) : (
        <>
          <div className="scope-toggle" role="group" aria-label="Tipo di oggetti">
            {SCOPES.map(s => (
              <button key={s.id} type="button" className={`pf-btn ${scope === s.id ? 'pf-btn-gold' : 'pf-btn-ghost'}`} aria-pressed={scope === s.id}
                onClick={() => { setScope(s.id); setCategory(''); }}>{s.label}</button>
            ))}
          </div>
          <input className="pf-input w-full" style={{ marginTop: 8 }} placeholder="Cerca oggetto…" value={query} onChange={e => setQuery(e.target.value)} autoFocus />
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
                  {[i.category, magicInfoLabel(i), itemStatsLabel(i), gpLabel(i.priceGp), i.weightKg ? kgLabel(i.weightKg) : ''].filter(Boolean).join(' · ')}
                </span>
              </button>
            ))}
            {list.length === 0 && <p className="status-empty">Nessun oggetto trovato.</p>}
            {matching.length > LIMIT && <p className="status-empty">Primi {LIMIT} di {matching.length}: affina la ricerca.</p>}
          </div>
        </>
      )}
    </SheetModal>
  );
}

function AddItem({ char, def, onBack, onDone }: { char: Character; def: ItemDefinition; onBack: () => void; onDone: () => void }) {
  const { addEquipment, purchaseEquipment } = useCharacterStore();
  const [quantity, setQuantity] = useState(1);
  const [buying, setBuying] = useState(false);
  const proposedGp = Math.round(def.priceGp * quantity * 100) / 100;

  const setQty = (n: number) => setQuantity(Math.max(1, Math.floor(n || 1)));

  const add = () => { addEquipment(char.id, itemFromCatalog(def, quantity)); onDone(); };
  const buy = (priceCp: number) => {
    purchaseEquipment(char.id, itemFromCatalog(def, quantity), priceCp);
    onDone();
  };

  return (
    <SheetModal title={def.name} onClose={onDone} maxWidth={440}>
      <p className="status-empty" style={{ marginBottom: 8 }}>
        {[def.category, magicInfoLabel(def), itemStatsLabel(def), `listino ${gpLabel(def.priceGp)}`, def.weightKg ? kgLabel(def.weightKg) : ''].filter(Boolean).join(' · ')}
      </p>
      <a href={def.url} target="_blank" rel="noreferrer" className="item-wiki-link">Scheda sul wiki ↗</a>

      <div className="effect-form-row">
        <label style={{ maxWidth: 120 }}>
          <span className="label-rune-soft">Quantità</span>
          <input className="pf-input w-full" type="number" min={1} value={quantity} onChange={e => setQty(Number(e.target.value))} />
        </label>
      </div>

      {buying ? (
        <PurchaseBox key={proposedGp} char={char} proposedGp={proposedGp} onCancel={() => setBuying(false)} onPay={buy} />
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
