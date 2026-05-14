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

  return (
    <div className="space-y-4">
      {/* HP */}
      <div className="pf-panel p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="label-rune">Punti Ferita</div>
          <button
            className="pf-btn pf-btn-outline text-xs px-3 py-1"
            onClick={() => fullRest(char.id)}
          >
            Riposo Completo
          </button>
        </div>

        <div className="vital-row" style={{ marginBottom: 12 }}>
          <div className="vital-label" style={{ marginBottom: 4 }}>
            <span className="val" style={{ fontSize: 28 }}>{char.currentHp}</span>
            <span style={{ fontFamily: 'var(--font-display)', color: 'var(--ink-mute)', fontSize: 14 }}>
              / {maxHp}
              {char.tempHp > 0 && <span style={{ color: 'var(--amethyst-bright)', marginLeft: 8 }}>+{char.tempHp} temp</span>}
            </span>
          </div>
          <div className="vital-bar" style={{ height: 8 }}>
            <div className="vital-bar-fill" style={{ width: `${hpPct}%` }} />
          </div>
        </div>

        <div className="flex gap-2">
          <HpButton label="Danno" color="var(--blood)" onSubmit={v => takeDamage(char.id, v)} />
          <HpButton label="Cura" color="var(--vital)" onSubmit={v => heal(char.id, v)} />
          <HpButton label="Temp HP" color="var(--amethyst-bright)" onSubmit={v => setTempHp(char.id, v)} />
        </div>
        {char.nonLethalDamage > 0 && (
          <div className="mt-2 text-xs" style={{ color: 'var(--ember)' }}>
            Danno non letale: {char.nonLethalDamage}
          </div>
        )}
      </div>

      {/* Core combat grid */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'CA',             value: modStr(ac - 10 + 10), detail: `DES ${modStr(abilityMod(scores.dex))}` },
          { label: 'Contatto',       value: String(10 + abilityMod(scores.dex)), detail: 'Senza armatura' },
          { label: 'Preso Sorpresa', value: String(10), detail: 'Senza DES' },
        ].map(({ label, value, detail }) => (
          <div key={label} className="stat-tile py-3">
            <div className="label-rune-soft" style={{ marginBottom: 4 }}>{label}</div>
            <div className="numeral" style={{ fontSize: 24, color: 'var(--ink)', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 10, color: 'var(--ink-faint)', marginTop: 3, fontFamily: 'var(--font-rune)', letterSpacing: '0.1em' }}>{detail}</div>
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
            <div style={{ fontSize: 10, color: 'var(--ink-faint)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
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

      {/* Saves */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Tempra',   value: fort, detail: `base + COS ${modStr(abilityMod(scores.con))}` },
          { label: 'Riflessi', value: ref,  detail: `base + DES ${modStr(abilityMod(scores.dex))}` },
          { label: 'Volontà',  value: will, detail: `base + SAG ${modStr(abilityMod(scores.wis))}` },
        ].map(({ label, value, detail }) => (
          <RollableStat
            key={label}
            label={label}
            value={modStr(value)}
            detail={detail}
            valueColor={value >= 0 ? 'var(--vital)' : 'var(--blood)'}
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
        <div className="stat-tile py-3">
          <div className="label-rune-soft" style={{ marginBottom: 4 }}>CMD</div>
          <div className="numeral" style={{ fontSize: 24, color: 'var(--ink)', lineHeight: 1 }}>{cmd}</div>
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
      className="stat-tile py-3"
      style={{ cursor: onRoll ? 'pointer' : 'default' }}
      onClick={onRoll}
      title={onRoll ? `Tira 1d20 ${value} (${label})` : undefined}
    >
      <div className="label-rune-soft" style={{ marginBottom: 4 }}>{label}</div>
      <div className="numeral" style={{ fontSize: 24, color: valueColor ?? 'var(--gold)', lineHeight: 1 }}>{value}</div>
      {detail && (
        <div style={{ fontSize: 10, color: 'var(--ink-faint)', marginTop: 3, fontFamily: 'var(--font-rune)', letterSpacing: '0.1em' }}>
          {detail}
        </div>
      )}
      {extra}
      {onRoll && (
        <div style={{ fontSize: 10, marginTop: 3, opacity: 0.5, color: 'var(--gold)' }}>🎲</div>
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
        className="pf-btn flex-1"
        style={{ background: color + '22', border: `1px solid ${color}55`, color, fontSize: 10, padding: '6px 8px' }}
        onClick={() => setOpen(true)}
      >
        {label}
      </button>
    );
  }

  return (
    <div className="flex gap-1 flex-1">
      <input
        className="pf-input text-center"
        type="number"
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && submit()}
        autoFocus
        style={{ maxWidth: '60px', fontSize: 13 }}
      />
      <button className="pf-btn" style={{ background: color + '33', color, fontSize: 11, padding: '4px 8px' }} onClick={submit}>✓</button>
      <button className="pf-btn pf-btn-ghost" style={{ fontSize: 11, padding: '4px 8px' }} onClick={() => setOpen(false)}>✕</button>
    </div>
  );
}
