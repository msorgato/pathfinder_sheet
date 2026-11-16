import { useCallback, useEffect, useState } from 'react';
import type { RevealData } from '../../utils/rollReveal';
import { bonusEntries, buildTimeline, rollOutcome } from '../../utils/rollReveal';
import { DiceStage } from './DiceStage';

const OUTCOME_TEXT = { crit: 'CRITICO!', threat: 'Minaccia', fumble: 'FUMBLE!' } as const;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const signed = (v: number) => (v > 0 ? `+${v}` : `−${Math.abs(v)}`);

/**
 * Temporary overlay at the center of the screen that presents an already decided roll:
 * dice spinning and landing, named bonuses one by one, then the total.
 * A tap skips to the end; a tap at the end (or Esc) closes it, which also happens by itself.
 */
export function RollReveal({ data, onClose, reducedMotion }: {
  data: RevealData;
  onClose: () => void;
  /** Overrides the system preference (tests). */
  reducedMotion?: boolean;
}) {
  const steps = buildTimeline(data);
  const last = steps.length - 1;
  const [index, setIndex] = useState(() => ((reducedMotion ?? prefersReducedMotion()) ? last : 0));
  const done = index >= last;

  // Each step lasts its own time; the last one is the pause before closing.
  useEffect(() => {
    const timer = setTimeout(() => (done ? onClose() : setIndex(i => i + 1)), steps[Math.min(index, last)].ms);
    return () => clearTimeout(timer);
  // steps is derived from data, which is fixed for the lifetime of the overlay (new rolls remount it)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, done, onClose]);

  const advance = useCallback(() => (done ? onClose() : setIndex(last)), [done, last, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const bonuses = bonusEntries(data);
  const kind = steps[Math.min(index, last)].kind;
  const spinning = kind === 'spin';
  const landed = !spinning;
  // Bonuses shown so far: those whose step has been reached.
  const bonusStart = steps.findIndex(s => s.kind === 'bonus');
  const shown = bonusStart < 0 ? 0 : Math.max(0, Math.min(bonuses.length, index - bonusStart + 1));
  const outcome = done ? rollOutcome(data.dice, data.dieType, data.critRange) : null;

  return (
    <div className="roll-reveal" role="status" aria-live="polite" onClick={advance}>
      <div className={`roll-reveal-card${outcome ? ` is-${outcome}` : ''}`}>
        {outcome === 'crit' && (
          <div className="reveal-sparks" aria-hidden="true">
            {Array.from({ length: 8 }, (_, i) => <span key={i} style={{ '--a': `${i * 45}deg` } as React.CSSProperties} />)}
          </div>
        )}
        <div className="roll-reveal-label">{data.label}</div>
        <DiceStage dice={data.dice} dieType={data.dieType} spinning={spinning} outcome={landed ? rollOutcome(data.dice, data.dieType, data.critRange) : null} />
        <div className="roll-reveal-bonuses">
          {bonuses.slice(0, shown).map((b, i) => (
            <span key={i} className={`reveal-bonus${b.value < 0 ? ' is-negative' : ''}`}>
              {signed(b.value)}{b.label ? <small> {b.label}</small> : null}
            </span>
          ))}
        </div>
        <div className={`roll-reveal-total${done ? ' is-shown' : ''}`}>{data.total}</div>
        <div className="roll-reveal-outcome">{outcome ? OUTCOME_TEXT[outcome] : ' '}</div>
        {done && <span className="sr-only">{data.label}: {data.total}{outcome ? `, ${OUTCOME_TEXT[outcome]}` : ''}</span>}
      </div>
    </div>
  );
}
