import { useState } from 'react';
import type { ArmorProficiency, Character, WeaponGroup } from '../../types';
import { useCharacterStore } from '../../store/characterStore';
import { useDataStore } from '../../store/dataStore';
import { ARMOR_PROFICIENCIES, ARMOR_PROFICIENCY_LABELS, WEAPON_CHOICE_FEATS } from '../../utils/proficiencies';
import { useDerivedStats } from './statHelpers';

const GROUP_LABELS = { simple: 'Armi semplici', martial: 'Armi da guerra' } as const;

/** Proficiencies with their sources, pending feat choices, deity weapon and manual additions. */
export function ProficienciesSection({ char, readOnly = false }: { char: Character; readOnly?: boolean }) {
  const store = useCharacterStore();
  const items = useDataStore(s => s.builtinItems);
  const d = useDerivedStats(char);
  const p = d.proficiencies;
  const [addWeapon, setAddWeapon] = useState('');

  const weapons = items.filter(i => i.kind === 'weapon' && i.weapon);
  const nameOf = (id: string) => items.find(i => i.id === id)?.name ?? id;
  const weaponsOf = (group?: WeaponGroup) => weapons.filter(w => !group || w.weapon?.group === group);
  const extra = char.extraProficiencies ?? {};
  const choiceOf = (featId: string, index: number) =>
    char.featChoices?.find(fc => fc.featId === featId && fc.index === index)?.choice ?? '';

  const featInstances: { featId: string; index: number }[] = [];
  const counts = new Map<string, number>();
  for (const featId of char.feats ?? []) {
    if (!WEAPON_CHOICE_FEATS[featId]) continue;
    const index = counts.get(featId) ?? 0;
    counts.set(featId, index + 1);
    featInstances.push({ featId, index });
  }

  const toggleArmor = (a: ArmorProficiency, on: boolean) => store.setExtraProficiencies(char.id, {
    ...extra, armor: on ? [...(extra.armor ?? []), a] : (extra.armor ?? []).filter(x => x !== a),
  });

  return (
    <div className="equip-section">
      <div className="status-section-title"><span className="label-rune-soft">Competenze</span></div>

      <div className="prof-list">
        {ARMOR_PROFICIENCIES.filter(a => p.armor.has(a)).map(a => (
          <div key={a} className="prof-row"><span>{ARMOR_PROFICIENCY_LABELS[a]}</span><span className="prof-source">{p.armor.get(a)!.join(', ')}</span></div>
        ))}
        {(['simple', 'martial'] as const).filter(g => p.groups.has(g)).map(g => (
          <div key={g} className="prof-row"><span>{GROUP_LABELS[g]}</span><span className="prof-source">{p.groups.get(g)!.join(', ')}</span></div>
        ))}
        {[...p.weapons.entries()].map(([id, sources]) => (
          <div key={id} className="prof-row"><span>{nameOf(id)}</span><span className="prof-source">{sources.join(', ')}</span></div>
        ))}
        {p.armor.size + p.groups.size + p.weapons.size === 0 && <p className="status-empty">Nessuna competenza.</p>}
      </div>

      {!readOnly && featInstances.length > 0 && (
        <div className="prof-choices">
          {featInstances.map(({ featId, index }) => {
            const feat = WEAPON_CHOICE_FEATS[featId];
            const value = choiceOf(featId, index);
            return (
              <label key={`${featId}-${index}`} className={value ? '' : 'is-pending'}>
                <span className="label-rune-soft">{feat.name}{index > 0 ? ` (${index + 1})` : ''}{value ? '' : ' — scegli l\'arma'}</span>
                <select className="pf-input w-full" value={value}
                  onChange={e => store.setFeatChoice(char.id, featId, index, e.target.value || null)}>
                  <option value="">—</option>
                  {weaponsOf(feat.group).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </label>
            );
          })}
        </div>
      )}

      {!readOnly && p.grantsDeityWeapon && (
        <label className="prof-choices">
          <span className="label-rune-soft">Arma preferita della divinità{char.deity ? ` (${char.deity})` : ''}</span>
          <select className="pf-input w-full" value={char.deityWeaponId ?? ''}
            onChange={e => store.setDeityWeapon(char.id, e.target.value || null)}>
            <option value="">—</option>
            {weapons.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </label>
      )}

      {!readOnly && (
        <details className="prof-manual">
          <summary>Aggiunte manuali (tratti, archetipi, regole della casa)</summary>
          <div className="effect-form-row" role="group" aria-label="Armature aggiunte">
            {ARMOR_PROFICIENCIES.map(a => (
              <label key={a} className="checkbox-inline">
                <input type="checkbox" checked={!!extra.armor?.includes(a)} onChange={e => toggleArmor(a, e.target.checked)} />
                {ARMOR_PROFICIENCY_LABELS[a]}
              </label>
            ))}
          </div>
          {(extra.weapons ?? []).map(id => (
            <div key={id} className="status-row">
              <span>{nameOf(id)}</span>
              <button type="button" className="btn btn-ghost btn-icon" aria-label={`Rimuovi ${nameOf(id)}`}
                onClick={() => store.setExtraProficiencies(char.id, { ...extra, weapons: (extra.weapons ?? []).filter(w => w !== id) })}>✕</button>
            </div>
          ))}
          <div className="effect-form-row">
            <select className="pf-input" style={{ flex: 1, minWidth: 0 }} value={addWeapon} onChange={e => setAddWeapon(e.target.value)}
              aria-label="Arma da aggiungere">
              <option value="">Aggiungi un'arma…</option>
              {weapons.filter(w => !extra.weapons?.includes(w.id)).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
            <button type="button" className="pf-btn pf-btn-outline" disabled={!addWeapon}
              onClick={() => { store.setExtraProficiencies(char.id, { ...extra, weapons: [...(extra.weapons ?? []), addWeapon] }); setAddWeapon(''); }}>
              Aggiungi
            </button>
          </div>
        </details>
      )}
    </div>
  );
}
