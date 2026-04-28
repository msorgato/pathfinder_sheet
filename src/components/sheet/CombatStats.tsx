import { useState } from 'react';
import type { ReactNode } from 'react';
import type { Character } from '../../types';
import {
  effectiveAbilityScores, totalBAB, totalSave,
  abilityMod, modStr, maxHP,
} from '../../utils/calculations';
import { useCharacterStore } from '../../store/characterStore';
import type { RollRequest } from './DiceRoller';

interface Props {
  char: Character;
  onQuickRoll?: (req: RollRequest) => void;
}

export function CombatStats({ char, onQuickRoll }: Props) {
  const { takeDamage, heal, setTempHp, fullRest } = useCharacterStore();
  const scores = effectiveAbilityScores(char);
  const bab = totalBAB(char.classes);
  const fort = totalSave('fort', char.classes) + abilityMod(scores.con);
  const ref  = totalSave('ref',  char.classes) + abilityMod(scores.dex);
  const will = totalSave('will', char.classes) + abilityMod(scores.wis);
  const maxHp = maxHP(char, scores.con);
  const ac = 10 + abilityMod(scores.dex);
  const cmb = bab + abilityMod(scores.str);
  const cmd = 10 + bab + abilityMod(scores.str) + abilityMod(scores.dex);
  const init = abilityMod(scores.dex);
  const hpPct = Math.max(0, Math.min(100, (char.currentHp / maxHp) * 100));
  const hpColor = hpPct > 50 ? '#4ade80' : hpPct > 25 ? '#fbbf24' : '#ef4444';

  return (
    <div className="space-y-4">
      {/* HP */}
      <div className="pf-panel p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#c8a443' }}>Punti Ferita</h3>
          <button
            className="pf-btn pf-btn-outline text-xs px-3 py-1"
            onClick={() => fullRest(char.id)}
          >Riposo Completo</button>
        </div>
        {/* HP bar */}
        <div className="h-4 rounded-full mb-3 overflow-hidden" style={{ background: '#1a1209', border: '1px solid #4b3620' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${hpPct}%`, background: hpColor }}
          />
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span style={{ color: '#d1c5a8' }}>Attuali:</span>
          <span className="text-2xl font-bold" style={{ color: hpColor }}>{char.currentHp}</span>
          <span style={{ color: '#8b8b6b' }}>/ {maxHp}</span>
          {char.tempHp > 0 && (
            <span className="text-sm" style={{ color: '#60a5fa' }}>+{char.tempHp} temp</span>
          )}
        </div>
        <div className="flex gap-2 mt-3">
          <HpButton label="Danno" color="#ef4444" onSubmit={v => takeDamage(char.id, v)} />
          <HpButton label="Cura" color="#4ade80" onSubmit={v => heal(char.id, v)} />
          <HpButton label="Temp HP" color="#60a5fa" onSubmit={v => setTempHp(char.id, v)} />
        </div>
        {char.nonLethalDamage > 0 && (
          <div className="mt-2 text-xs" style={{ color: '#fbbf24' }}>
            Danno non letale: {char.nonLethalDamage}
          </div>
        )}
      </div>

      {/* Core combat grid */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'CA', value: modStr(ac - 10 + 10), detail: `DES ${modStr(abilityMod(scores.dex))}` },
          { label: 'Contatto', value: String(10 + abilityMod(scores.dex)), detail: 'Senza armatura' },
          { label: 'Preso Sorpresa', value: String(10), detail: 'Senza DES' },
        ].map(({ label, value, detail }) => (
          <div key={label} className="stat-box py-3">
            <div className="text-xs uppercase tracking-wider" style={{ color: '#8b5e3c' }}>{label}</div>
            <div className="text-2xl font-bold" style={{ color: '#f5edd6' }}>{value}</div>
            <div className="text-xs" style={{ color: '#6b6b5b' }}>{detail}</div>
          </div>
        ))}
      </div>

      {/* BAB + Init */}
      <div className="grid grid-cols-2 gap-3">
        <RollableStat
          label="BAB"
          value={modStr(bab)}
          onRoll={onQuickRoll ? () => onQuickRoll({ label: 'BAB', numDice: 1, dieType: 20, modifier: bab }) : undefined}
          extra={bab >= 6 ? (
            <div className="text-xs" style={{ color: '#9ca3af' }}>
              {modStr(bab)}/{modStr(bab - 5)}
              {bab >= 11 ? `/${modStr(bab - 10)}` : ''}
              {bab >= 16 ? `/${modStr(bab - 15)}` : ''}
            </div>
          ) : undefined}
        />
        <RollableStat
          label="Iniziativa"
          value={modStr(init)}
          onRoll={onQuickRoll ? () => onQuickRoll({ label: 'Iniziativa', numDice: 1, dieType: 20, modifier: init }) : undefined}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Tempra', value: fort, detail: `base + COS ${modStr(abilityMod(scores.con))}` },
          { label: 'Riflessi', value: ref,  detail: `base + DES ${modStr(abilityMod(scores.dex))}` },
          { label: 'Volontà', value: will, detail: `base + SAG ${modStr(abilityMod(scores.wis))}` },
        ].map(({ label, value, detail }) => (
          <RollableStat
            key={label}
            label={label}
            value={modStr(value)}
            detail={detail}
            valueColor={value >= 0 ? '#4ade80' : '#ef4444'}
            onRoll={onQuickRoll ? () => onQuickRoll({ label, numDice: 1, dieType: 20, modifier: value }) : undefined}
          />
        ))}
      </div>

      {/* CMB / CMD */}
      <div className="grid grid-cols-2 gap-3">
        <RollableStat
          label="CMB"
          value={modStr(cmb)}
          onRoll={onQuickRoll ? () => onQuickRoll({ label: 'CMB', numDice: 1, dieType: 20, modifier: cmb }) : undefined}
        />
        <div className="stat-box py-3">
          <div className="text-xs uppercase tracking-wider" style={{ color: '#8b5e3c' }}>CMD</div>
          <div className="text-2xl font-bold" style={{ color: '#f5edd6' }}>{cmd}</div>
        </div>
      </div>
    </div>
  );
}

function RollableStat({
  label, value, detail, valueColor, onRoll, extra,
}: {
  label: string;
  value: string;
  detail?: string;
  valueColor?: string;
  onRoll?: () => void;
  extra?: ReactNode;
}) {
  return (
    <div
      className="stat-box py-3 transition-colors"
      style={{ cursor: onRoll ? 'pointer' : 'default' }}
      onClick={onRoll}
      title={onRoll ? `Tira 1d20 ${value} (${label})` : undefined}
    >
      <div className="text-xs uppercase tracking-wider" style={{ color: '#8b5e3c' }}>{label}</div>
      <div className="text-2xl font-bold" style={{ color: valueColor ?? '#c8a443' }}>{value}</div>
      {detail && <div className="text-xs" style={{ color: '#6b6b5b' }}>{detail}</div>}
      {extra}
      {onRoll && (
        <div className="text-xs mt-0.5 opacity-50" style={{ color: '#c8a443' }}>🎲</div>
      )}
    </div>
  );
}

function HpButton({ label, color, onSubmit }: { label: string; color: string; onSubmit: (v: number) => void }) {
  const [val, setVal] = useState('');
  const [open, setOpen] = useState(false);

  const submit = () => {
    const n = Number(val);
    if (n > 0) { onSubmit(n); setVal(''); setOpen(false); }
  };

  if (!open) {
    return (
      <button
        className="pf-btn text-xs flex-1"
        style={{ background: color + '22', border: `1px solid ${color}`, color }}
        onClick={() => setOpen(true)}
      >
        {label}
      </button>
    );
  }

  return (
    <div className="flex gap-1 flex-1">
      <input
        className="pf-input text-center text-sm"
        type="number"
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && submit()}
        autoFocus
        style={{ maxWidth: '60px' }}
      />
      <button className="pf-btn text-xs px-2" style={{ background: color + '33', color }} onClick={submit}>✓</button>
      <button className="pf-btn pf-btn-ghost text-xs px-2" onClick={() => setOpen(false)}>✕</button>
    </div>
  );
}

