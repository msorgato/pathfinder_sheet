import { useState } from 'react';
import type {
  ArmorCategory, ArmorStats, BodySlot, DamageType, Dice, ItemKind, WeaponGroup, WeaponHandedness, WeaponStats,
} from '../../types';
import type { ItemInput } from '../../utils/inventory';
import { defaultSlot } from '../../utils/inventory';
import { SheetModal } from '../ui/SheetModal';
import {
  ARMOR_CATEGORY_LABELS, HANDEDNESS_LABELS, KIND_LABELS, SLOT_LABELS, SLOT_ORDER, WEAPON_GROUP_LABELS,
} from '../../data/itemLabels';

const DEFAULT_WEAPON: WeaponStats = {
  group: 'simple', handedness: 'one-handed', damage: { small: { count: 1, die: 4 }, medium: { count: 1, die: 6 } },
  critRange: 20, critMult: 2, damageTypes: ['T'], special: [],
};
const DEFAULT_ARMOR: ArmorStats = { category: 'light', bonus: 1, maxDex: null, checkPenalty: 0, arcaneFailure: 0, metal: false };
const DEFAULT_SHIELD: ArmorStats = { ...DEFAULT_ARMOR, category: 'shield' };

const num = (v: string, fallback = 0) => (v.trim() === '' || !Number.isFinite(Number(v.replace(',', '.'))) ? fallback : Number(v.replace(',', '.')));

/** Create or edit an inventory item, with the statistics of its kind. */
export function ItemEditor({ title, initial, onSave, onClose }: {
  title: string;
  initial: ItemInput;
  onSave: (item: ItemInput) => void;
  onClose: () => void;
}) {
  const [item, setItem] = useState<ItemInput>(() => structuredClone(initial));
  const kind: ItemKind = item.kind ?? 'gear';
  const set = (patch: Partial<ItemInput>) => setItem(i => ({ ...i, ...patch }));
  const setWeapon = (patch: Partial<WeaponStats>) => setItem(i => ({ ...i, weapon: { ...(i.weapon ?? DEFAULT_WEAPON), ...patch } }));
  const setArmor = (patch: Partial<ArmorStats>) => setItem(i => ({ ...i, armor: { ...(i.armor ?? DEFAULT_ARMOR), ...patch } }));

  const changeKind = (k: ItemKind) => setItem(i => ({
    ...i,
    kind: k,
    slot: i.slot && i.slot !== defaultSlot(i.kind ?? 'gear') ? i.slot : defaultSlot(k),
    weapon: k === 'weapon' ? (i.weapon ?? DEFAULT_WEAPON) : undefined,
    armor: k === 'armor' ? (i.armor && i.armor.category !== 'shield' && i.armor.category !== 'tower' ? i.armor : DEFAULT_ARMOR)
      : k === 'shield' ? (i.armor && (i.armor.category === 'shield' || i.armor.category === 'tower') ? i.armor : DEFAULT_SHIELD)
      : undefined,
  }));

  const save = () => {
    const out: ItemInput = { ...item };
    if (kind !== 'weapon') delete out.weapon;
    if (kind !== 'armor' && kind !== 'shield') delete out.armor;
    onSave(out);
    onClose();
  };

  const w = item.weapon ?? DEFAULT_WEAPON;
  const a = item.armor ?? (kind === 'shield' ? DEFAULT_SHIELD : DEFAULT_ARMOR);
  const dice = (d: Dice | null) => (d ? `${d.count}d${d.die}` : '');
  const parseDice = (s: string): Dice | null => {
    const m = /^\s*(\d+)\s*d\s*(\d+)\s*$/i.exec(s);
    return m ? { count: Number(m[1]), die: Number(m[2]) } : null;
  };

  return (
    <SheetModal title={title} onClose={onClose} maxWidth={480}>
      <div className="effect-form">
        <label>
          <span className="label-rune-soft">Nome</span>
          <input className="pf-input w-full" value={item.name} autoFocus onChange={e => set({ name: e.target.value })} />
        </label>
        <div className="effect-form-row">
          <label>
            <span className="label-rune-soft">Tipo</span>
            <select className="pf-input w-full" value={kind} onChange={e => changeKind(e.target.value as ItemKind)}>
              {(Object.keys(KIND_LABELS) as ItemKind[]).map(k => <option key={k} value={k}>{KIND_LABELS[k]}</option>)}
            </select>
          </label>
          <label>
            <span className="label-rune-soft">Slot</span>
            <select className="pf-input w-full" value={item.slot ?? 'none'} onChange={e => set({ slot: e.target.value as BodySlot })}>
              {SLOT_ORDER.map(s => <option key={s} value={s}>{SLOT_LABELS[s]}</option>)}
            </select>
          </label>
        </div>
        <div className="effect-form-row">
          <label>
            <span className="label-rune-soft">Quantità</span>
            <input className="pf-input w-full" type="number" min={0} value={item.quantity}
              onChange={e => set({ quantity: Math.max(0, Math.floor(Number(e.target.value) || 0)) })} />
          </label>
          <label>
            <span className="label-rune-soft">Prezzo (mo)</span>
            <input className="pf-input w-full" inputMode="decimal" defaultValue={String(item.priceGp ?? 0).replace('.', ',')}
              onChange={e => set({ priceGp: Math.max(0, num(e.target.value)) })} />
          </label>
          <label>
            <span className="label-rune-soft">Peso (kg)</span>
            <input className="pf-input w-full" inputMode="decimal" defaultValue={String(item.weightKg ?? 0).replace('.', ',')}
              onChange={e => set({ weightKg: Math.max(0, num(e.target.value)) })} />
          </label>
        </div>

        {kind === 'weapon' && (
          <>
            <div className="effect-form-row">
              <label>
                <span className="label-rune-soft">Categoria</span>
                <select className="pf-input w-full" value={w.group} onChange={e => setWeapon({ group: e.target.value as WeaponGroup })}>
                  {(Object.keys(WEAPON_GROUP_LABELS) as WeaponGroup[]).map(g => <option key={g} value={g}>{WEAPON_GROUP_LABELS[g]}</option>)}
                </select>
              </label>
              <label>
                <span className="label-rune-soft">Impugnatura</span>
                <select className="pf-input w-full" value={w.handedness} onChange={e => setWeapon({ handedness: e.target.value as WeaponHandedness })}>
                  {(Object.keys(HANDEDNESS_LABELS) as WeaponHandedness[]).map(h => <option key={h} value={h}>{HANDEDNESS_LABELS[h]}</option>)}
                </select>
              </label>
            </div>
            <div className="effect-form-row">
              <label>
                <span className="label-rune-soft">Danni (M)</span>
                <input className="pf-input w-full" placeholder="1d8" defaultValue={dice(w.damage.medium)}
                  onChange={e => setWeapon({ damage: { ...w.damage, medium: parseDice(e.target.value) ?? w.damage.medium } })} />
              </label>
              <label>
                <span className="label-rune-soft">Danni (P)</span>
                <input className="pf-input w-full" placeholder="1d6" defaultValue={dice(w.damage.small)}
                  onChange={e => setWeapon({ damage: { ...w.damage, small: parseDice(e.target.value) ?? w.damage.small } })} />
              </label>
              <label>
                <span className="label-rune-soft">Minaccia</span>
                <select className="pf-input w-full" value={w.critRange} onChange={e => setWeapon({ critRange: Number(e.target.value) })}>
                  {[20, 19, 18, 17, 16, 15].map(r => <option key={r} value={r}>{r === 20 ? '20' : `${r}–20`}</option>)}
                </select>
              </label>
              <label>
                <span className="label-rune-soft">Critico</span>
                <select className="pf-input w-full" value={w.critMult} onChange={e => setWeapon({ critMult: Number(e.target.value) })}>
                  {[2, 3, 4].map(m => <option key={m} value={m}>×{m}</option>)}
                </select>
              </label>
            </div>
            <div className="effect-form-row" role="group" aria-label="Tipo di danno">
              {(['C', 'P', 'T'] as DamageType[]).map(t => (
                <label key={t} className="checkbox-inline">
                  <input type="checkbox" checked={w.damageTypes.includes(t)}
                    onChange={e => setWeapon({ damageTypes: e.target.checked ? [...w.damageTypes, t] : w.damageTypes.filter(x => x !== t) })} />
                  {t}
                </label>
              ))}
              <label>
                <span className="label-rune-soft">Gittata (m)</span>
                <input className="pf-input w-full" inputMode="decimal" defaultValue={w.rangeM ? String(w.rangeM).replace('.', ',') : ''}
                  onChange={e => setWeapon({ rangeM: num(e.target.value) || undefined })} />
              </label>
            </div>
          </>
        )}

        {(kind === 'armor' || kind === 'shield') && (
          <>
            <div className="effect-form-row">
              <label>
                <span className="label-rune-soft">Categoria</span>
                <select className="pf-input w-full" value={a.category} onChange={e => setArmor({ category: e.target.value as ArmorCategory })}>
                  {(kind === 'shield' ? ['shield', 'tower'] : ['light', 'medium', 'heavy']).map(c => (
                    <option key={c} value={c}>{ARMOR_CATEGORY_LABELS[c as ArmorCategory]}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className="label-rune-soft">Bonus</span>
                <input className="pf-input w-full" type="number" min={0} value={a.bonus} onChange={e => setArmor({ bonus: Math.max(0, Math.floor(Number(e.target.value) || 0)) })} />
              </label>
              <label>
                <span className="label-rune-soft">Des max</span>
                <input className="pf-input w-full" type="number" placeholder="—" value={a.maxDex ?? ''}
                  onChange={e => setArmor({ maxDex: e.target.value === '' ? null : Math.floor(Number(e.target.value)) })} />
              </label>
            </div>
            <div className="effect-form-row">
              <label>
                <span className="label-rune-soft">Penalità</span>
                <input className="pf-input w-full" type="number" max={0} value={a.checkPenalty}
                  onChange={e => setArmor({ checkPenalty: Math.min(0, Math.floor(Number(e.target.value) || 0)) })} />
              </label>
              <label>
                <span className="label-rune-soft">Fallimento arcano %</span>
                <input className="pf-input w-full" type="number" min={0} max={100} value={a.arcaneFailure}
                  onChange={e => setArmor({ arcaneFailure: Math.max(0, Math.min(100, Math.floor(Number(e.target.value) || 0))) })} />
              </label>
              <label className="checkbox-inline">
                <input type="checkbox" checked={a.metal} onChange={e => setArmor({ metal: e.target.checked })} />
                Metallo
              </label>
            </div>
          </>
        )}

        {(kind === 'weapon' || kind === 'armor' || kind === 'shield') && (
          <label className="checkbox-inline">
            <input type="checkbox" checked={!!item.nonProficient} onChange={e => set({ nonProficient: e.target.checked || undefined })} />
            Non competente (forza la penalità)
          </label>
        )}

        <label>
          <span className="label-rune-soft">Note</span>
          <input className="pf-input w-full" value={item.notes} onChange={e => set({ notes: e.target.value })} />
        </label>
      </div>
      <div className="purchase-actions">
        <button type="button" className="pf-btn pf-btn-ghost" onClick={onClose}>Annulla</button>
        <button type="button" className="pf-btn pf-btn-gold" disabled={!item.name.trim()} onClick={save}>Salva</button>
      </div>
    </SheetModal>
  );
}
