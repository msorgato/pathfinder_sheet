import type { ItemInput } from '../../utils/inventory';
import type { MaterialId } from '../../types';
import { abilitiesFor } from '../../data/itemAbilities';
import { MATERIALS, materialsFor } from '../../data/materials';
import {
  MAX_ENHANCEMENT, MAX_TOTAL_BONUS, abilityTargetOf, canAddAbility, enhancementOf, isMasterwork, materialTargetOf, setMaterial, totalBonus,
} from '../../utils/itemEnhancements';
import { gpLabel } from '../../data/itemLabels';

/**
 * Masterwork, enhancement, special material and special abilities of a weapon, armor or shield.
 * Changes are reported as a patch: the editor recomputes price and weight from it.
 */
export function MagicSection({ item, onChange }: { item: ItemInput; onChange: (patch: Partial<ItemInput>) => void }) {
  const target = materialTargetOf(item);
  const abilityTarget = abilityTargetOf(item);
  if (!target || !abilityTarget) return null;

  const enhancement = enhancementOf(item);
  const mat = item.material ? MATERIALS[item.material] : undefined;
  const forced = enhancement > 0 || !!mat?.masterwork;
  const abilities = abilitiesFor(abilityTarget);
  const selected = new Set(item.abilities ?? []);
  const hasMagic = isMasterwork(item) || !!item.material || selected.size > 0;

  const setEnhancement = (n: number) =>
    onChange({ enhancement: n > 0 ? n : undefined, ...(n === 0 ? { abilities: undefined } : {}) });

  const changeMaterial = (id: string) => {
    const next = setMaterial(item, (id || undefined) as MaterialId | undefined);
    onChange({ material: next.material, weightKg: next.weightKg });
  };

  const toggleAbility = (id: string, on: boolean) => {
    const list = on ? [...(item.abilities ?? []), id] : (item.abilities ?? []).filter(a => a !== id);
    onChange({ abilities: list.length ? list : undefined });
  };

  return (
    <details className="magic-section" open={hasMagic}>
      <summary>Magia e materiali</summary>

      <div className="effect-form-row">
        <label>
          <span className="label-rune-soft">Potenziamento</span>
          <select className="pf-input w-full" value={enhancement} onChange={e => setEnhancement(Number(e.target.value))}>
            {Array.from({ length: MAX_ENHANCEMENT + 1 }, (_, n) => <option key={n} value={n}>{n === 0 ? 'Nessuno' : `+${n}`}</option>)}
          </select>
        </label>
        <label>
          <span className="label-rune-soft">Materiale</span>
          <select className="pf-input w-full" value={item.material ?? ''} onChange={e => changeMaterial(e.target.value)}>
            <option value="">Comune</option>
            {materialsFor(target).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </label>
      </div>

      <label className="checkbox-inline">
        <input type="checkbox" checked={forced || !!item.masterwork} disabled={forced}
          onChange={e => onChange({ masterwork: e.target.checked || undefined })} />
        Qualità perfetta{forced ? ' (inclusa)' : ''}
      </label>

      <div className="label-rune-soft" style={{ marginTop: 8 }}>
        Capacità speciali · bonus totale +{totalBonus(item)} / +{MAX_TOTAL_BONUS}
      </div>
      {enhancement === 0 && <p className="status-empty">Servono un bonus di potenziamento di almeno +1.</p>}
      <div className="ability-list" role="group" aria-label="Capacità speciali">
        {abilities.map(a => {
          const on = selected.has(a.id);
          const enabled = on || canAddAbility(item, a);
          return (
            <label key={a.id} className={`checkbox-inline${enabled ? '' : ' is-disabled'}`}>
              <input type="checkbox" checked={on} disabled={!enabled} onChange={e => toggleAbility(a.id, e.target.checked)} />
              {a.name} <span className="status-tag">{a.bonus !== undefined ? `+${a.bonus}` : gpLabel(a.costGp ?? 0)}</span>
            </label>
          );
        })}
      </div>
    </details>
  );
}
