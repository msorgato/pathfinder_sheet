import type { LobbyMessage } from '../../types';

interface Props {
  msg: LobbyMessage;
  isMine: boolean;
}

function formatTime(ms: number): string {
  if (!ms) return '';
  return new Date(ms).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

export function RollMessage({ msg, isMine }: Props) {
  const roll = msg.rollData!;
  const crit   = roll.isCrit   === true;
  const fumble = roll.isFumble === true;

  const borderColor = crit ? 'var(--theme-hp-high)' : fumble ? 'var(--theme-hp-low)' : 'var(--theme-accent)';
  const totalColor  = crit ? 'var(--theme-hp-high)' : fumble ? 'var(--theme-hp-low)' : 'var(--theme-accent)';
  const bg          = crit ? 'rgba(74,222,128,0.08)' : fumble ? 'rgba(239,68,68,0.08)' : 'rgba(200,164,67,0.06)';

  const modStr = (v: number) => v === 0 ? '' : v > 0 ? `+${v}` : `${v}`;

  return (
    <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
      <div
        className="max-w-[80%] rounded-lg px-3 py-2"
        style={{ background: bg, border: `1px solid ${borderColor}` }}
      >
        {!isMine && (
          <p className="text-xs font-semibold mb-1" style={{ color: 'var(--theme-accent)' }}>
            {msg.senderName}
          </p>
        )}
        {/* Character + label row */}
        <div className="flex items-baseline gap-1.5 mb-1">
          <span className="text-xs font-bold" style={{ color: 'var(--theme-text-muted)' }}>
            {roll.characterName}
          </span>
          <span className="text-xs" style={{ color: 'var(--theme-text-faint)' }}>·</span>
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: totalColor }}>
            {roll.label}
          </span>
        </div>
        {/* Formula + total */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono" style={{ color: 'var(--theme-text-faint)' }}>
            {roll.formula}
          </span>
          <span className="text-xs" style={{ color: 'var(--theme-text-faint)' }}>=</span>
          <span className="text-2xl font-bold leading-none" style={{ color: totalColor, fontFamily: 'Georgia' }}>
            {roll.total}
          </span>
        </div>
        {/* Dice breakdown */}
        <div className="text-xs mt-0.5" style={{ color: 'var(--theme-text-faint)' }}>
          [{roll.rolls.join(', ')}]{modStr(roll.modifier) ? ` ${modStr(roll.modifier)}` : ''}
        </div>
        {crit   && <div className="text-xs font-bold mt-1" style={{ color: 'var(--theme-hp-high)' }}>CRITICO!</div>}
        {fumble && <div className="text-xs font-bold mt-1" style={{ color: 'var(--theme-hp-low)' }}>FUMBLE!</div>}
      </div>
      <span className="text-xs mt-0.5 px-1" style={{ color: 'var(--theme-text-faint)' }}>
        {formatTime(msg.sentAt)}
      </span>
    </div>
  );
}
