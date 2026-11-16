import { useEffect, useState } from 'react';
import type { RollOutcome } from '../../utils/rollReveal';
import { showDice } from '../../utils/rollReveal';

/** Outline of each die on a 100×100 canvas. */
const SHAPES: Record<number, string> = {
  4: '50,8 94,86 6,86',
  8: '50,4 94,50 50,96 6,50',
  10: '50,4 92,40 50,96 8,40',
  100: '50,4 92,40 50,96 8,40',
  12: '50,6 94,38 77,90 23,90 6,38',
  20: '50,4 92,27 92,73 50,96 8,73 8,27',
};

function Die({ value, dieType, spinning, outcome }: { value: number; dieType: number; spinning: boolean; outcome: RollOutcome }) {
  const outline = SHAPES[dieType];
  return (
    <svg viewBox="0 0 100 100" className={`die${spinning ? ' is-spinning' : ' is-landed'}${outcome ? ` is-${outcome}` : ''}`} aria-hidden="true">
      {outline
        ? <polygon points={outline} className="die-body" strokeLinejoin="round" />
        : <rect x="8" y="8" width="84" height="84" rx="16" className="die-body" />}
      {dieType === 20 && <polygon points="50,24 78,70 22,70" className="die-facet" fill="none" />}
      {!spinning && outcome === 'fumble' && <polyline points="58,6 46,40 60,52 44,94" className="die-crack" fill="none" />}
      <text x="50" y="58" textAnchor="middle" className="die-value">{value}</text>
    </svg>
  );
}

/**
 * The dice of a roll. While `spinning` the faces cycle through random numbers (visual only);
 * once landed they show the real values. Above five dice no shapes are drawn, only the values.
 * This is the part to swap for 3D dice.
 */
export function DiceStage({ dice, dieType, spinning, outcome }: {
  dice: number[];
  dieType: number;
  spinning: boolean;
  outcome: RollOutcome;
}) {
  const [fake, setFake] = useState(() => dice.map(() => 1));
  useEffect(() => {
    if (!spinning) return;
    const timer = setInterval(() => setFake(dice.map(() => Math.floor(Math.random() * dieType) + 1)), 60);
    return () => clearInterval(timer);
  }, [spinning, dice, dieType]);

  if (!showDice(dice.length)) {
    return (
      <div className="dice-values" aria-hidden="true">
        {dice.map((v, i) => <span key={i} className="dice-value-chip">{v}</span>)}
      </div>
    );
  }
  return (
    <div className="dice-stage" aria-hidden="true">
      {dice.map((v, i) => (
        <Die key={i} value={spinning ? (fake[i] ?? 1) : v} dieType={dieType} spinning={spinning} outcome={outcome} />
      ))}
    </div>
  );
}
