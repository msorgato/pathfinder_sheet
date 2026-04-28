import { useState, useEffect } from 'react';

export interface RollRequest {
  label: string;
  numDice: number;
  dieType: number;
  modifier: number;
}

interface RollResult {
  id: string;
  label: string;
  dice: number[];
  dieType: number;
  modifier: number;
  total: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  pendingRoll?: RollRequest;
  onPendingHandled: () => void;
}

const DICE = [4, 6, 8, 10, 12, 20, 100];

function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

function isCrit(dice: number[], dieType: number): boolean {
  return dieType === 20 && dice.length === 1 && dice[0] === 20;
}

function isFumble(dice: number[], dieType: number): boolean {
  return dieType === 20 && dice.length === 1 && dice[0] === 1;
}

export function DiceRoller({ open, onClose, pendingRoll, onPendingHandled }: Props) {
  const [numDice, setNumDice] = useState(1);
  const [dieType, setDieType] = useState(20);
  const [modifier, setModifier] = useState(0);
  const [results, setResults] = useState<RollResult[]>([]);
  const [animKey, setAnimKey] = useState(0);

  const performRoll = (label: string, n: number, d: number, mod: number) => {
    const dice = Array.from({ length: n }, () => rollDie(d));
    const total = dice.reduce((a, b) => a + b, 0) + mod;
    const id = Date.now().toString();
    setResults(prev => [{ id, label, dice, dieType: d, modifier: mod, total }, ...prev].slice(0, 30));
    setAnimKey(k => k + 1);
  };

  useEffect(() => {
    if (!pendingRoll) return;
    const { label, numDice: n, dieType: d, modifier: mod } = pendingRoll;
    setNumDice(n);
    setDieType(d);
    setModifier(mod);
    performRoll(label, n, d, mod);
    onPendingHandled();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingRoll]);

  if (!open) return null;

  const latest = results[0];
  const crit = latest && isCrit(latest.dice, latest.dieType);
  const fumble = latest && isFumble(latest.dice, latest.dieType);
  const modStr = (v: number) => v === 0 ? '' : v > 0 ? `+${v}` : `${v}`;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Panel */}
      <div
        className="fixed bottom-20 right-4 z-50 w-72 rounded-xl flex flex-col shadow-2xl"
        style={{ background: '#1e1508', border: '1px solid #6b4226', maxHeight: 'calc(100vh - 100px)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b shrink-0" style={{ borderColor: '#4b3620' }}>
          <h2 className="font-bold text-sm" style={{ color: '#c8a443', fontFamily: 'Georgia' }}>
            🎲 Lancia i Dadi
          </h2>
          <button onClick={onClose} className="text-sm px-1" style={{ color: '#8b8b6b' }}>✕</button>
        </div>

        {/* Controls */}
        <div className="p-3 space-y-3 shrink-0">
          {/* Die type */}
          <div className="flex flex-wrap gap-1.5">
            {DICE.map(d => (
              <button
                key={d}
                onClick={() => setDieType(d)}
                className="px-2.5 py-1 rounded text-xs font-bold transition-all"
                style={{
                  background: dieType === d ? '#c8a443' : '#2a1f0e',
                  color: dieType === d ? '#1a1209' : '#d1c5a8',
                  border: `1px solid ${dieType === d ? '#c8a443' : '#4b3620'}`,
                }}
              >
                d{d}
              </button>
            ))}
          </div>

          {/* Num dice & modifier */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setNumDice(n => Math.max(1, n - 1))}
                className="w-6 h-6 rounded text-sm font-bold flex items-center justify-center"
                style={{ background: '#2a1f0e', color: '#d1c5a8', border: '1px solid #4b3620' }}
              >−</button>
              <span className="w-7 text-center text-sm font-bold" style={{ color: '#f5edd6' }}>{numDice}</span>
              <button
                onClick={() => setNumDice(n => Math.min(20, n + 1))}
                className="w-6 h-6 rounded text-sm font-bold flex items-center justify-center"
                style={{ background: '#2a1f0e', color: '#d1c5a8', border: '1px solid #4b3620' }}
              >+</button>
              <span className="text-xs ml-1" style={{ color: '#8b5e3c' }}>×d{dieType}</span>
            </div>
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-xs" style={{ color: '#8b5e3c' }}>mod</span>
              <input
                type="number"
                className="pf-input text-center text-sm"
                style={{ width: '56px', padding: '2px 4px' }}
                value={modifier}
                onChange={e => setModifier(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Formula label */}
          <div className="text-center text-xs" style={{ color: '#6b6b5b' }}>
            {numDice}d{dieType}{modStr(modifier)}
          </div>

          {/* Roll button */}
          <button
            className="w-full py-2 rounded font-bold text-base transition-transform active:scale-95"
            style={{ background: '#c8a443', color: '#1a1209' }}
            onClick={() => performRoll(`${numDice}d${dieType}`, numDice, dieType, modifier)}
          >
            🎲 Lancia!
          </button>

          {/* Latest result */}
          {latest && (
            <div
              key={animKey}
              className="rounded-lg p-3 text-center dice-result"
              style={{
                background: crit ? 'rgba(74,222,128,0.1)' : fumble ? 'rgba(239,68,68,0.1)' : '#2a1f0e',
                border: `1px solid ${crit ? '#4ade80' : fumble ? '#ef4444' : '#4b3620'}`,
              }}
            >
              {latest.label !== `${latest.dice.length}d${latest.dieType}` && (
                <div className="text-xs mb-1" style={{ color: '#8b8b6b' }}>{latest.label}</div>
              )}
              <div
                className="text-4xl font-bold"
                style={{
                  color: crit ? '#4ade80' : fumble ? '#ef4444' : '#c8a443',
                  fontFamily: 'Georgia',
                }}
              >
                {latest.total}
              </div>
              {crit && <div className="text-xs font-bold mt-0.5" style={{ color: '#4ade80' }}>CRITICO!</div>}
              {fumble && <div className="text-xs font-bold mt-0.5" style={{ color: '#ef4444' }}>FUMBLE!</div>}
              <div className="text-xs mt-1" style={{ color: '#6b6b5b' }}>
                [{latest.dice.join(', ')}]{modStr(latest.modifier) ? ` ${modStr(latest.modifier)}` : ''}
              </div>
            </div>
          )}
        </div>

        {/* Roll history */}
        {results.length > 1 && (
          <div className="overflow-y-auto border-t" style={{ borderColor: '#4b3620' }}>
            <div className="px-3 py-1.5 text-xs font-bold uppercase" style={{ color: '#6b6b5b' }}>Storico</div>
            {results.slice(1).map(r => {
              const rc = isCrit(r.dice, r.dieType);
              const rf = isFumble(r.dice, r.dieType);
              return (
                <div
                  key={r.id}
                  className="flex items-center justify-between px-3 py-1 text-xs border-b"
                  style={{ borderColor: '#2a1f0e' }}
                >
                  <span style={{ color: '#8b8b6b' }}>{r.label}</span>
                  <span style={{ color: rc ? '#4ade80' : rf ? '#ef4444' : '#d1c5a8', fontWeight: rc || rf ? 'bold' : 'normal' }}>
                    {r.total}
                    {rc ? ' ✦' : rf ? ' ✕' : ''}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
