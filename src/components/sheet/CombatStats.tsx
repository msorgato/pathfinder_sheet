import { useState } from 'react';
import type { ReactNode } from 'react';
import type { Character } from '../../types';
import { modStr } from '../../utils/calculations';
import type { Stat } from '../../utils/derivedStats';
import { StatBreakdown } from './StatBreakdown';
import { statTone, useDerivedStats } from './statHelpers';
import { useCharacterStore } from '../../store/characterStore';
import type { RollRequest } from './DiceRoller';

interface Props {
  char: Character;
  onQuickRoll?: (req: RollRequest) => void;
}

/** Hit points: current/max, damage, healing, temporary HP and full rest. */
export function HitPointsPanel({ char }: { char: Character }) {
  const { takeDamage, heal, setTempHp, fullRest } = useCharacterStore();
  const d = useDerivedStats(char);
  const maxHp = d.maxHp.total;
  const hpPct = Math.max(0, Math.min(100, (char.currentHp / maxHp) * 100));

  return (
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
            / <span className={statTone(d.maxHp)}>{maxHp}</span>
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
  );
}

/** Armor Class, BAB, initiative, saving throws and combat maneuvers. */
export function CombatStats({ char, onQuickRoll }: Props) {
  const d = useDerivedStats(char);
  const { bab } = d;

  return (
    <div className="space-y-4 combat-stats">
      {/* Armor Class: three tiles on desktop, one box with three rows on mobile */}
      <div className="ac-group">
        {([
          { label: 'CA',             stat: d.ac,         detail: `DES ${modStr(d.mods.dex)}` },
          { label: 'Contatto',       stat: d.touch,      detail: 'Senza armatura' },
          { label: 'Colto di sorpresa', stat: d.flatFooted, detail: 'Senza DES' },
        ] as { label: string; stat: Stat; detail: string }[]).map(({ label, stat, detail }) => (
          <div key={label} className="stat-tile ac-item">
            <div className="label-rune-soft ac-label">{label}</div>
            <div className={`numeral ac-value ${statTone(stat)}`}>{stat.total}</div>
            <div className="ac-detail">{detail}</div>
            <StatBreakdown label={label} stat={stat} format={String} />
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
            <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
              {modStr(bab)}/{modStr(bab - 5)}
              {bab >= 11 ? `/${modStr(bab - 10)}` : ''}
              {bab >= 16 ? `/${modStr(bab - 15)}` : ''}
            </div>
          ) : undefined}
        />
        <RollableStat
          label="Iniziativa"
          stat={d.initiative}
          onRoll={onQuickRoll ? () => onQuickRoll({ label: 'Iniziativa', numDice: 1, dieType: 20, modifier: d.initiative.total }) : undefined}
        />
      </div>

      {/* Saves */}
      <div className="grid grid-cols-3 gap-3">
        {([
          { label: 'Tempra',   stat: d.saves.fort, detail: `base + COS ${modStr(d.mods.con)}` },
          { label: 'Riflessi', stat: d.saves.ref,  detail: `base + DES ${modStr(d.mods.dex)}` },
          { label: 'Volontà',  stat: d.saves.will, detail: `base + SAG ${modStr(d.mods.wis)}` },
        ] as { label: string; stat: Stat; detail: string }[]).map(({ label, stat, detail }) => (
          <RollableStat
            key={label}
            label={label}
            stat={stat}
            detail={detail}
            valueColor={stat.total >= 0 ? 'var(--vital)' : 'var(--blood)'}
            onRoll={onQuickRoll ? () => onQuickRoll({ label, numDice: 1, dieType: 20, modifier: stat.total }) : undefined}
          />
        ))}
      </div>

      {/* CMB / CMD */}
      <div className="grid grid-cols-2 gap-3">
        <RollableStat
          label="CMB"
          stat={d.cmb}
          onRoll={onQuickRoll ? () => onQuickRoll({ label: 'CMB', numDice: 1, dieType: 20, modifier: d.cmb.total }) : undefined}
        />
        <div className="stat-tile py-3">
          <div className="label-rune-soft" style={{ marginBottom: 4 }}>CMD</div>
          <div className={`numeral ${statTone(d.cmd)}`} style={{ fontSize: 24, color: 'var(--ink)', lineHeight: 1 }}>{d.cmd.total}</div>
          <StatBreakdown label="CMD" stat={d.cmd} format={String} />
        </div>
      </div>
    </div>
  );
}

function RollableStat({
  label, value, stat, detail, valueColor, onRoll, extra,
}: {
  label: string;
  /** Explicit display value; when `stat` is given, its total is shown with modifier highlighting. */
  value?: string;
  stat?: Stat;
  detail?: string;
  valueColor?: string;
  onRoll?: () => void;
  extra?: ReactNode;
}) {
  const shown = value ?? (stat ? modStr(stat.total) : '');
  return (
    <div
      className="stat-tile py-3"
      style={{ cursor: onRoll ? 'pointer' : 'default' }}
      onClick={onRoll}
      title={onRoll ? `Tira 1d20 ${shown} (${label})` : undefined}
    >
      <div className="label-rune-soft" style={{ marginBottom: 4 }}>{label}</div>
      <div className={`numeral ${stat ? statTone(stat) : ''}`} style={{ fontSize: 24, color: valueColor ?? 'var(--gold)', lineHeight: 1 }}>{shown}</div>
      {stat && <StatBreakdown label={label} stat={stat} />}
      {detail && (
        <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 3, fontFamily: 'var(--font-rune)', letterSpacing: '0.1em' }}>
          {detail}
        </div>
      )}
      {extra}
      {onRoll && (
        <div style={{ fontSize: 12, marginTop: 3, opacity: 0.5, color: 'var(--gold)' }}>🎲</div>
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
        style={{ background: color + '22', border: `1px solid ${color}55`, color, fontSize: 12, padding: '6px 8px' }}
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
      <button className="pf-btn" style={{ background: color + '33', color, fontSize: 13, padding: '4px 8px' }} onClick={submit}>✓</button>
      <button className="pf-btn pf-btn-ghost" style={{ fontSize: 13, padding: '4px 8px' }} onClick={() => setOpen(false)}>✕</button>
    </div>
  );
}
