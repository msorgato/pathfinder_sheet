import { useCallback, useEffect, useRef, useState } from 'react';
import type { RevealData } from '../../utils/rollReveal';
import { SPIN_3D_MS, SPIN_MS, bonusEntries, buildTimeline, rollOutcome, shouldUse3D } from '../../utils/rollReveal';
import { dice3DReady } from '../dice3d/loader';
import { Dice3DStage } from '../dice3d/Dice3DStage';
import { playLand, playOutcome, playRoll } from '../../lib/diceSounds';
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
export function RollReveal({ data, onClose, reducedMotion, sound = false, accent }: {
  data: RevealData;
  onClose: () => void;
  /** Overrides the system preference (tests). */
  reducedMotion?: boolean;
  /** Play the dice sounds (the character's setting). */
  sound?: boolean;
  /** The character's accent colour; sets the colour of the dice and of the result wherever the reveal is shown. */
  accent?: string;
}) {
  const [reduced] = useState(() => reducedMotion ?? prefersReducedMotion());
  // 3D or 2D dice: decided once, when the reveal appears (the 2D ones are also the fallback if the 3D scene fails)
  const [use3D, setUse3D] = useState(() => shouldUse3D(reduced, data.dice.length, dice3DReady()));
  const steps = buildTimeline(data, { spinMs: use3D ? SPIN_3D_MS : SPIN_MS });
  const last = steps.length - 1;
  const [index, setIndex] = useState(() => (reduced ? last : 0));
  const done = index >= last;

  // Each step lasts its own time; the last one is the pause before closing.
  useEffect(() => {
    const timer = setTimeout(() => (done ? onClose() : setIndex(i => i + 1)), steps[Math.min(index, last)].ms);
    return () => clearTimeout(timer);
  // steps is derived from data, which is fixed for the lifetime of the overlay (new rolls remount it)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, done, onClose]);

  // Sounds follow the steps: clatter while spinning, a thud when the dice land, a flourish for a critical or fumble.
  // A skip jumps over steps, so each sound is tracked and played at most once.
  const stopRoll = useRef<(() => void) | null>(null);
  const played = useRef({ roll: false, land: false, outcome: false });
  const stepKind = steps[Math.min(index, last)].kind;
  useEffect(() => {
    if (!sound) return;
    const p = played.current;
    if (stepKind === 'spin') {
      if (!p.roll) { p.roll = true; stopRoll.current = playRoll(steps[0].ms); }
      return;
    }
    stopRoll.current?.();
    stopRoll.current = null;
    if (!p.land) { p.land = true; playLand(); }
    if (stepKind === 'total' && !p.outcome) {
      p.outcome = true;
      const o = rollOutcome(data.dice, data.dieType, data.critRange);
      if (o === 'crit' || o === 'fumble') playOutcome(o);
    }
  // steps and data are fixed for the lifetime of the overlay
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepKind, sound]);
  useEffect(() => () => { stopRoll.current?.(); }, []);

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
    <div className="roll-reveal" role="status" aria-live="polite" onClick={advance}
      style={accent ? ({ '--char-accent': accent } as React.CSSProperties) : undefined}>
      <div className={`roll-reveal-card${outcome ? ` is-${outcome}` : ''}`}>
        {outcome === 'crit' && (
          <div className="reveal-sparks" aria-hidden="true">
            {Array.from({ length: 8 }, (_, i) => <span key={i} style={{ '--a': `${i * 45}deg` } as React.CSSProperties} />)}
          </div>
        )}
        <div className="roll-reveal-label">{data.label}</div>
        {use3D
          ? <Dice3DStage dice={data.dice} dieType={data.dieType} spinning={spinning} spinMs={SPIN_3D_MS}
              outcome={landed ? rollOutcome(data.dice, data.dieType, data.critRange) : null} onFail={() => setUse3D(false)} />
          : <DiceStage dice={data.dice} dieType={data.dieType} spinning={spinning} outcome={landed ? rollOutcome(data.dice, data.dieType, data.critRange) : null} />}
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
