import { useState } from 'react';
import type { Character } from '../../types';
import { modStr, attackChain } from '../../utils/calculations';
import type { ResolvedAttack } from '../../utils/derivedStats';
import { inventoryOf } from '../../utils/inventory';
import { critLabel } from '../../data/itemLabels';
import { StatBreakdown } from './StatBreakdown';
import { statTone, useDerivedStats } from './statHelpers';
import { useCharacterStore } from '../../store/characterStore';
import type { RollRequest } from './DiceRoller';

interface Props {
  char: Character;
  onQuickRoll?: (req: RollRequest) => void;
}

type FormState = {
  name: string;
  damageDiceCount: number;
  damageDieType: number;
  attackType: 'melee' | 'ranged';
  abilityKey: 'str' | 'dex';
  notes: string;
};

function newId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function AttacksPanel({ char, onQuickRoll }: Props) {
  const { addWeaponAttack, removeWeaponAttack, addAttackFromItem } = useCharacterStore();
  const d = useDerivedStats(char);
  const bab = d.bab;
  const chain = attackChain(bab);
  /** Appended to quick-roll labels so non-numeric condition effects are not forgotten. */
  const noteSuffix = d.attackNotes.length ? ` · ${d.attackNotes.join(' · ')}` : '';
  const weapons = char.weaponAttacks ?? [];

  const [showForm, setShowForm] = useState(false);
  const [linkItemId, setLinkItemId] = useState('');
  const inventoryWeapons = inventoryOf(char).filter(i => i.kind === 'weapon' && i.weapon);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    name: '',
    damageDiceCount: 1,
    damageDieType: 6,
    attackType: 'melee',
    abilityKey: 'str',
    notes: '',
  });

  function handleAttackTypeChange(attackType: 'melee' | 'ranged') {
    setForm(f => ({ ...f, attackType, abilityKey: attackType === 'melee' ? 'str' : 'dex' }));
  }

  function handleSubmit() {
    if (!form.name.trim()) return;
    addWeaponAttack(char.id, {
      id: newId(),
      name: form.name.trim(),
      damageDiceCount: form.damageDiceCount,
      damageDieType: form.damageDieType,
      attackType: form.attackType,
      abilityKey: form.abilityKey,
      notes: form.notes.trim() || undefined,
    });
    setForm({ name: '', damageDiceCount: 1, damageDieType: 6, attackType: 'melee', abilityKey: 'str', notes: '' });
    setShowForm(false);
  }

  return (
    <div className="pf-panel p-4 space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--theme-accent)' }}>Attacchi</h3>

      {d.attackNotes.length > 0 && (
        <div className="attack-notes" role="note">
          {d.attackNotes.map(n => <div key={n}>⚠ {n}</div>)}
        </div>
      )}

      {/* Global attack chain */}
      <div className="grid grid-cols-2 gap-3">
        {([
          { label: 'Mischia', stat: d.attack.melee, abMod: d.mods.str, abLabel: 'FOR', icon: '⚔' },
          { label: 'Distanza', stat: d.attack.ranged, abMod: d.mods.dex, abLabel: 'DES', icon: '🏹' },
        ] as const).map(({ label, stat, abMod, abLabel, icon }) => {
          const extra = stat.total - bab;
          return (
          <div key={label} className="stat-box py-3" style={{ position: 'relative' }}>
            <div className="text-xs uppercase tracking-wider mb-1.5" style={{ color: 'var(--theme-border-strong)' }}>{label}</div>
            <div className="flex flex-wrap gap-1.5">
              {chain.map((b, i) => {
                const bonus = b + extra;
                return (
                  <button
                    key={i}
                    type="button"
                    className={`attack-roll-button rounded px-2 py-1 text-sm font-bold transition-all hover:brightness-125 active:scale-95 ${statTone(stat)}`}
                    style={{
                      background: 'rgba(200,164,67,0.12)',
                      color: 'var(--theme-accent)',
                      border: '1px solid rgba(200,164,67,0.3)',
                      cursor: onQuickRoll ? 'pointer' : 'default',
                      margin: 'auto',
                    }}
                    title={onQuickRoll ? `Tira d20 ${modStr(bonus)} — ${label} att. ${i + 1}` : undefined}
                    onClick={() => onQuickRoll?.({ label: `${label} att. ${i + 1}${noteSuffix}`, numDice: 1, dieType: 20, modifier: bonus })}
                  >
                    {icon} {modStr(bonus)}{noteSuffix ? ' ⚠' : ''}
                  </button>
                );
              })}
            </div>
            <div className="text-xs mt-1.5" style={{ color: 'var(--theme-text-faint)' }}>
              BAB {modStr(bab)} + {abLabel} {modStr(abMod)}{stat.total !== bab + abMod ? ` ${modStr(stat.total - bab - abMod)}` : ''}
            </div>
            <StatBreakdown label={`Attacco in ${label.toLowerCase()}`} stat={stat} />
          </div>
          );
        })}
      </div>

      {/* Weapon list */}
      {weapons.length === 0 && !showForm && (
        <div className="text-center py-4" style={{ color: 'var(--theme-text-faint)' }}>
          <div className="text-2xl mb-1">⚔</div>
          <div className="text-sm">Nessuna arma configurata. Aggiungi un'arma per gestire i tiri per colpire e i danni.</div>
        </div>
      )}

      {weapons.length > 0 && (
        <div className="space-y-3">
          {weapons.map(weapon => (
            <WeaponRow
              key={weapon.id}
              resolved={d.weaponAttack(weapon)}
              chain={chain}
              bab={bab}
              confirmRemove={confirmRemoveId === weapon.id}
              onConfirmRemove={() => setConfirmRemoveId(weapon.id)}
              onCancelRemove={() => setConfirmRemoveId(null)}
              onRemove={() => { removeWeaponAttack(char.id, weapon.id); setConfirmRemoveId(null); }}
              onQuickRoll={onQuickRoll}
              noteSuffix={noteSuffix}
            />
          ))}
        </div>
      )}

      {/* Add weapon form */}
      {showForm ? (
        <div className="rounded p-3 space-y-2" style={{ background: 'rgba(200,164,67,0.06)', border: '1px solid var(--theme-ghost-border)' }}>
          {inventoryWeapons.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-accent)' }}>Dall'inventario</div>
              <div className="flex gap-2">
                <select className="pf-input text-sm" style={{ flex: 1, minWidth: 0 }} value={linkItemId}
                  onChange={e => setLinkItemId(e.target.value)} aria-label="Arma dell'inventario">
                  <option value="">Scegli un'arma…</option>
                  {inventoryWeapons.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
                <button type="button" className="pf-btn pf-btn-gold text-xs px-3 py-1" disabled={!linkItemId}
                  onClick={() => { addAttackFromItem(char.id, linkItemId); setLinkItemId(''); setShowForm(false); }}>
                  Collega
                </button>
              </div>
            </div>
          )}
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-accent)' }}>
            {inventoryWeapons.length > 0 ? 'Oppure manuale' : 'Nuova arma'}
          </div>
          <input
            className="pf-input w-full text-sm"
            placeholder="Nome arma"
            value={form.name}
            autoFocus
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-1">
              <input
                className="pf-input text-center text-sm"
                type="number"
                min={1}
                max={10}
                value={form.damageDiceCount}
                onChange={e => setForm(f => ({ ...f, damageDiceCount: Math.max(1, Number(e.target.value)) }))}
                style={{ width: '48px' }}
              />
              <span className="text-xs" style={{ color: 'var(--theme-text-faint)' }}>d</span>
              <select
                className="pf-input text-sm"
                value={form.damageDieType}
                onChange={e => setForm(f => ({ ...f, damageDieType: Number(e.target.value) }))}
                style={{ width: '64px' }}
              >
                {[4, 6, 8, 10, 12, 20].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="flex gap-1">
              {(['melee', 'ranged'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  className="pf-btn text-xs px-2 py-1"
                  style={{
                    background: form.attackType === t ? 'rgba(200,164,67,0.25)' : 'rgba(200,164,67,0.06)',
                    color: form.attackType === t ? 'var(--theme-accent)' : 'var(--theme-text-muted)',
                    border: `1px solid ${form.attackType === t ? 'rgba(200,164,67,0.5)' : 'var(--theme-ghost-border)'}`,
                  }}
                  onClick={() => handleAttackTypeChange(t)}
                >
                  {t === 'melee' ? 'Mischia' : 'Distanza'}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs" style={{ color: 'var(--theme-text-faint)' }}>Caratt.:</span>
              {(['str', 'dex'] as const).map(k => (
                <button
                  key={k}
                  type="button"
                  className="pf-btn text-xs px-2 py-1"
                  style={{
                    background: form.abilityKey === k ? 'rgba(200,164,67,0.25)' : 'rgba(200,164,67,0.06)',
                    color: form.abilityKey === k ? 'var(--theme-accent)' : 'var(--theme-text-muted)',
                    border: `1px solid ${form.abilityKey === k ? 'rgba(200,164,67,0.5)' : 'var(--theme-ghost-border)'}`,
                  }}
                  onClick={() => setForm(f => ({ ...f, abilityKey: k }))}
                >
                  {k === 'str' ? 'FOR' : 'DES'}
                </button>
              ))}
            </div>
          </div>
          <input
            className="pf-input w-full text-sm"
            placeholder="Note (opzionale)"
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          />
          <div className="flex gap-2 justify-end">
            <button type="button" className="pf-btn pf-btn-ghost text-xs px-3 py-1" onClick={() => setShowForm(false)}>Annulla</button>
            <button
              type="button"
              className="pf-btn pf-btn-gold text-xs px-3 py-1"
              onClick={handleSubmit}
              disabled={!form.name.trim()}
            >
              Aggiungi
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="pf-btn pf-btn-outline text-xs w-full py-2"
          onClick={() => setShowForm(true)}
        >
          + Aggiungi arma
        </button>
      )}
    </div>
  );
}

function WeaponRow({
  resolved, chain, bab, confirmRemove, onConfirmRemove, onCancelRemove, onRemove, onQuickRoll, noteSuffix,
}: {
  resolved: ResolvedAttack;
  chain: number[];
  bab: number;
  /** Non-numeric condition effects on attacks, appended to roll labels. */
  noteSuffix: string;
  confirmRemove: boolean;
  onConfirmRemove: () => void;
  onCancelRemove: () => void;
  onRemove: () => void;
  onQuickRoll?: (req: RollRequest) => void;
}) {
  const weapon = resolved.attack;
  if (confirmRemove) {
    return (
      <div
        className="rounded px-3 py-2 flex items-center gap-2 text-sm"
        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}
      >
        <span style={{ color: 'var(--theme-hp-low)' }}>Rimuovere &ldquo;{weapon.name}&rdquo;?</span>
        <button
          type="button"
          className="pf-btn text-xs px-2 py-0.5 ml-auto"
          style={{ background: 'rgba(239,68,68,0.2)', color: 'var(--theme-hp-low)', border: '1px solid rgba(239,68,68,0.4)' }}
          onClick={onRemove}
        >
          Sì
        </button>
        <button type="button" className="pf-btn pf-btn-ghost text-xs px-2 py-0.5" onClick={onCancelRemove}>No</button>
      </div>
    );
  }

  const dmgBonus = resolved.damage.total;
  const damageLabel = `${weapon.damageDiceCount}d${weapon.damageDieType}${dmgBonus !== 0 ? (dmgBonus > 0 ? `+${dmgBonus}` : dmgBonus) : ''}`;
  const crit = critLabel(resolved.critRange, resolved.critMult);

  return (
    <div className="rounded p-3" style={{ background: 'rgba(200,164,67,0.06)', border: '1px solid var(--theme-ghost-border)', position: 'relative' }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold" style={{ color: 'var(--theme-text)' }}>{weapon.name}</span>
          {resolved.linked && <span className="attack-link" title="Collegata a un'arma dell'inventario">🔗</span>}
          <span
            className="text-xs px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(200,164,67,0.15)', color: 'var(--theme-accent)' }}
          >
            {weapon.attackType === 'melee' ? 'Mischia' : 'Distanza'}
          </span>
          <span className="text-xs" style={{ color: 'var(--theme-text-faint)' }}>
            {weapon.abilityKey === 'str' ? 'FOR' : 'DES'}{weapon.twoHanded ? ' · due mani' : ''}
          </span>
          <span className="attack-crit">{crit}</span>
          {!resolved.proficient && <span className="text-xs is-debuffed">non competente</span>}
        </div>
        <div className="flex items-center gap-1">
          <StatBreakdown label={`${weapon.name}: tiro per colpire`} stat={resolved.toHit} inline />
          <button
            type="button"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--theme-hp-low)', opacity: 0.5, lineHeight: 1 }}
            className="hover:opacity-100 transition-opacity text-sm"
            title="Rimuovi arma"
            onClick={onConfirmRemove}
          >
            ✕
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {chain.map((b, i) => {
          const toHit = resolved.toHit.total + (b - bab);
          const icon = weapon.attackType === 'melee' ? '⚔' : '🏹';
          return (
            <button
              key={i}
              type="button"
              className={`rounded px-2 py-1 text-xs font-bold transition-all hover:brightness-125 active:scale-95 ${statTone(resolved.toHit)}`}
              style={{
                background: 'rgba(200,164,67,0.12)',
                color: 'var(--theme-accent)',
                border: '1px solid rgba(200,164,67,0.3)',
                cursor: onQuickRoll ? 'pointer' : 'default',
              }}
              title={onQuickRoll ? `Tira d20 ${modStr(toHit)} — ${weapon.name} attacco ${i + 1} (critico ${crit})` : undefined}
              onClick={() => onQuickRoll?.({ label: `${weapon.name} att. ${i + 1} (${crit})${noteSuffix}`, numDice: 1, dieType: 20, modifier: toHit })}
            >
              {icon} {modStr(toHit)}{noteSuffix ? ' ⚠' : ''}
            </button>
          );
        })}
        <button
          type="button"
          className={`rounded px-2 py-1 text-xs font-bold transition-colors ml-auto ${statTone(resolved.damage)}`}
          style={{
            background: 'rgba(99,102,241,0.15)',
            color: '#a5b4fc',
            border: '1px solid rgba(99,102,241,0.3)',
            cursor: onQuickRoll ? 'pointer' : 'default',
          }}
          title={onQuickRoll ? `Tira ${damageLabel} danni` : undefined}
          onClick={() => onQuickRoll?.({ label: `${weapon.name} danni`, numDice: weapon.damageDiceCount, dieType: weapon.damageDieType, modifier: dmgBonus })}
        >
          {damageLabel}
        </button>
      </div>

      {weapon.notes && (
        <div className="mt-1.5 text-xs" style={{ color: 'var(--theme-text-faint)' }}>{weapon.notes}</div>
      )}
    </div>
  );
}
