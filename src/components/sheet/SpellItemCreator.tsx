import { useMemo, useState } from 'react';
import type { Character, ConsumableForm, SpellDefinition } from '../../types';
import { useMergedSpells } from '../../store/dataStore';
import { useCharacterStore } from '../../store/characterStore';
import { SheetModal } from '../ui/SheetModal';
import { PurchaseBox } from './PurchaseBox';
import { gpLabel } from '../../data/itemLabels';
import {
  availableLists, createSpellItem, FORM_LABELS, FORM_LIMITS, listLabel, MAX_WAND_CHARGES, minCasterLevel, spellItemDc,
} from '../../utils/spellConsumables';

const FORMS: ConsumableForm[] = ['potion', 'scroll', 'wand'];
const LIMIT = 40;

/** Creates a potion, scroll or wand from a spell of the database. */
export function SpellItemCreator({ char, onClose }: { char: Character; onClose: () => void }) {
  const spells = useMergedSpells();
  const { addEquipment, purchaseEquipment } = useCharacterStore();
  const [query, setQuery] = useState('');
  const [spell, setSpell] = useState<SpellDefinition | null>(null);
  const [form, setForm] = useState<ConsumableForm>('potion');
  const [classId, setClassId] = useState('');
  const [casterLevel, setCasterLevel] = useState<number | null>(null);
  const [amount, setAmount] = useState(1);
  const [buying, setBuying] = useState(false);

  const q = query.trim().toLowerCase();
  const matches = useMemo(
    () => (q ? spells.filter(s => s.name.toLowerCase().includes(q)) : []),
    [spells, q],
  );

  const lists = spell ? availableLists(spell, form) : [];
  const list = lists.find(l => l.classId === classId) ?? lists[0];
  const spellLevel = list?.level ?? 0;
  const minCl = minCasterLevel(spellLevel);
  const cl = Math.max(minCl, casterLevel ?? minCl);
  const preview = spell && list ? createSpellItem(spell, form, list.classId, list.level, cl, amount) : null;
  const price = preview?.priceGp ?? 0;
  const total = Math.round(price * (form === 'wand' ? 1 : Math.max(1, amount)) * 100) / 100;

  const pickSpell = (s: SpellDefinition) => { setSpell(s); setClassId(''); setCasterLevel(null); setBuying(false); };
  const changeForm = (f: ConsumableForm) => {
    setForm(f); setClassId(''); setCasterLevel(null); setBuying(false);
    setAmount(f === 'wand' ? 50 : 1);
  };

  // The item keeps its unit price; the purchase proposal is the whole stack (a wand is priced as a whole).
  const input = preview;
  const add = () => { if (input) { addEquipment(char.id, input); onClose(); } };
  const buy = (priceCp: number) => { if (input) { purchaseEquipment(char.id, input, priceCp); onClose(); } };

  return (
    <SheetModal title="Pozione, pergamena o bacchetta" onClose={onClose} maxWidth={640}>
      {!spell ? (
        <>
          <input className="pf-input w-full" placeholder="Cerca incantesimo…" value={query} autoFocus onChange={e => setQuery(e.target.value)} />
          <div className="picker-list">
            {matches.slice(0, LIMIT).map(s => (
              <button key={s.id} type="button" className="picker-item" onClick={() => pickSpell(s)}>
                <span className="picker-item-name">{s.name}</span>
                <span className="picker-item-detail">{s.school}</span>
              </button>
            ))}
            {q && matches.length === 0 && <p className="status-empty">Nessun incantesimo trovato.</p>}
            {matches.length > LIMIT && <p className="status-empty">Primi {LIMIT} di {matches.length}: affina la ricerca.</p>}
            {!q && <p className="status-empty">Scrivi il nome dell'incantesimo.</p>}
          </div>
        </>
      ) : (
        <div className="effect-form">
          <div className="status-row-name">{spell.name}</div>
          <div className="scope-toggle" role="group" aria-label="Forma">
            {FORMS.map(f => (
              <button key={f} type="button" className={`pf-btn ${form === f ? 'pf-btn-gold' : 'pf-btn-ghost'}`}
                aria-pressed={form === f} onClick={() => changeForm(f)}>{FORM_LABELS[f]}</button>
            ))}
          </div>

          {lists.length === 0 ? (
            <p className="status-empty" role="alert">
              {FORM_LABELS[form]}: solo incantesimi fino al {FORM_LIMITS[form]}° livello, e «{spell.name}» è più alto in ogni lista.
            </p>
          ) : (
            <>
              <label>
                <span className="label-rune-soft">Lista di classe</span>
                <select className="pf-input w-full" value={list.classId} onChange={e => { setClassId(e.target.value); setCasterLevel(null); }}>
                  {lists.map(l => <option key={l.classId} value={l.classId}>{listLabel(l.classId)} · {l.level === 0 ? 'trucchetto' : `${l.level}° livello`}</option>)}
                </select>
              </label>
              <div className="effect-form-row">
                <label>
                  <span className="label-rune-soft">Livello incantatore</span>
                  <input className="pf-input w-full" type="number" min={minCl} title={`Minimo ${minCl}`} value={cl}
                    onChange={e => setCasterLevel(Math.max(minCl, Math.floor(Number(e.target.value) || minCl)))} />
                </label>
                <label>
                  <span className="label-rune-soft">{form === 'wand' ? `Cariche (max ${MAX_WAND_CHARGES})` : 'Quantità'}</span>
                  <input className="pf-input w-full" type="number" min={1} max={form === 'wand' ? MAX_WAND_CHARGES : undefined} value={amount}
                    onChange={e => setAmount(Math.max(1, Math.min(form === 'wand' ? MAX_WAND_CHARGES : 999, Math.floor(Number(e.target.value) || 1))))} />
                </label>
              </div>
              {preview && (
                <p className="status-empty" data-testid="spell-item-preview">
                  {preview.name} · {preview.spellItem?.spellLevel === 0 ? 'trucchetto' : `${preview.spellItem?.spellLevel}° livello`}
                  {' · '}listino {gpLabel(total)}{form !== 'potion' ? ` · CD oggetto ${spellItemDc(spellLevel)}` : ''}
                </p>
              )}
            </>
          )}

          {buying && input ? (
            <PurchaseBox key={total} char={char} proposedGp={total} onCancel={() => setBuying(false)} onPay={buy} />
          ) : (
            <div className="purchase-actions">
              <button type="button" className="pf-btn pf-btn-ghost" onClick={() => setSpell(null)}>Indietro</button>
              <button type="button" className="pf-btn pf-btn-outline" disabled={!input} onClick={() => setBuying(true)}>Acquista…</button>
              <button type="button" className="pf-btn pf-btn-gold" disabled={!input} onClick={add}>Aggiungi</button>
            </div>
          )}
        </div>
      )}
    </SheetModal>
  );
}
