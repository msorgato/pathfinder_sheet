import { useState } from 'react';
import type { AbilityScores, AbilityKey } from '../../types';
import { abilityMod, modStr } from '../../utils/calculations';
import { WizardLayout } from './WizardLayout';

const ABILITY_META: { key: AbilityKey; label: string; full: string; desc: string }[] = [
  { key: 'str', label: 'FOR', full: 'Forza', desc: 'Tiri d\'attacco melee, danno, scalare, nuotare' },
  { key: 'dex', label: 'DES', full: 'Destrezza', desc: 'Classe d\'armatura, Riflessi, attacchi a distanza, furtività' },
  { key: 'con', label: 'COS', full: 'Costituzione', desc: 'Punti ferita, Tempra, concentrazione' },
  { key: 'int', label: 'INT', full: 'Intelligenza', desc: 'Gradi abilità, Conoscenze, incantesimi Mago' },
  { key: 'wis', label: 'SAG', full: 'Saggezza', desc: 'Percezione, Volontà, incantesimi Chierico/Druido' },
  { key: 'cha', label: 'CAR', full: 'Carisma', desc: 'Diplomazia, Intimidire, incantesimi Bardo/Stregone/Paladino' },
];

const POINT_BUY_COSTS: Record<number, number> = {
  7: -4, 8: -2, 9: -1, 10: 0, 11: 1, 12: 2, 13: 3, 14: 5, 15: 7, 16: 10, 17: 13, 18: 17,
};

type Method = 'pointbuy' | 'standard' | 'manual';

const STANDARD_ARRAYS = {
  standard: [15, 14, 13, 12, 10, 8],
  heroic: [17, 15, 13, 12, 10, 8],
  low: [13, 12, 11, 10, 9, 8],
};

interface Props {
  scores: AbilityScores;
  onChange: (scores: AbilityScores) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step3_Abilities({ scores, onChange, onNext, onBack }: Props) {
  const [method, setMethod] = useState<Method>('pointbuy');
  const [pointBudget] = useState(25);

  const pointsSpent = (Object.keys(scores) as AbilityKey[]).reduce(
    (sum, k) => sum + (POINT_BUY_COSTS[scores[k]] ?? 0), 0,
  );
  const pointsLeft = pointBudget - pointsSpent;

  const setScore = (key: AbilityKey, val: number) => {
    onChange({ ...scores, [key]: Math.max(7, Math.min(18, val)) });
  };

  const applyArray = (arr: number[]) => {
    const keys: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
    const ns = { ...scores };
    arr.forEach((v, i) => { ns[keys[i]] = v; });
    onChange(ns);
  };

  const totalPoints = (Object.values(scores) as number[]).reduce((s, v) => s + v, 0);
  const canProceed = method !== 'pointbuy' || pointsLeft === 0;

  return (
    <WizardLayout
      step={3} totalSteps={7}
      title="Punteggi di Caratteristica"
      onBack={onBack} onNext={onNext}
      nextDisabled={!canProceed}
    >
      {/* Method selector */}
      <div className="flex gap-2 mb-5">
        {(['pointbuy', 'standard', 'manual'] as Method[]).map(m => (
          <button
            key={m}
            onClick={() => setMethod(m)}
            className="pf-btn flex-1 text-sm"
            style={{
              background: method === m ? 'var(--theme-accent)' : 'var(--theme-bg-panel)',
              color: method === m ? 'var(--theme-bg)' : 'var(--theme-text)',
              border: `1px solid ${method === m ? 'var(--theme-accent)' : 'var(--theme-border)'}`,
            }}
          >
            {m === 'pointbuy' ? 'Point Buy' : m === 'standard' ? 'Array Standard' : 'Manuale'}
          </button>
        ))}
      </div>

      {method === 'standard' && (
        <div className="pf-panel p-4 mb-4">
          <p className="text-sm mb-3" style={{ color: 'var(--theme-accent)' }}>Scegli un array predefinito:</p>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(STANDARD_ARRAYS).map(([name, arr]) => (
              <button
                key={name}
                onClick={() => applyArray(arr)}
                className="p-2 rounded text-sm text-left"
                style={{ background: 'var(--theme-bg)', border: '1px solid var(--theme-border)' }}
              >
                <div className="font-bold capitalize mb-1" style={{ color: 'var(--theme-accent)' }}>{name}</div>
                <div style={{ color: 'var(--theme-text-muted)' }}>{arr.join(', ')}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {method === 'pointbuy' && (
        <div className="pf-panel p-3 mb-4 flex items-center justify-between">
          <span className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>Punti disponibili (25):</span>
          <span
            className="text-xl font-bold"
            style={{ color: pointsLeft === 0 ? 'var(--theme-hp-high)' : pointsLeft < 0 ? 'var(--theme-hp-low)' : 'var(--theme-accent)' }}
          >
            {pointsLeft}
          </span>
        </div>
      )}

      {/* Ability score grid */}
      <div className="space-y-2">
        {ABILITY_META.map(({ key, label, full, desc }) => {
          const score = scores[key];
          const mod = abilityMod(score);
          const cost = POINT_BUY_COSTS[score] ?? 0;

          return (
            <div key={key} className="pf-panel p-3 flex items-center gap-3">
              {/* Label */}
              <div className="w-10 text-center">
                <div className="text-xs font-bold uppercase" style={{ color: 'var(--theme-accent)' }}>{label}</div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                {method !== 'manual' ? (
                  <>
                    <button
                      className="w-7 h-7 rounded text-lg font-bold flex items-center justify-center"
                      style={{ background: 'var(--theme-bg)', border: '1px solid var(--theme-border)', color: 'var(--theme-accent)' }}
                      onClick={() => setScore(key, score - 1)}
                    >−</button>
                    <span className="w-10 text-center text-xl font-bold" style={{ color: 'var(--theme-text)' }}>
                      {score}
                    </span>
                    <button
                      className="w-7 h-7 rounded text-lg font-bold flex items-center justify-center"
                      style={{ background: 'var(--theme-bg)', border: '1px solid var(--theme-border)', color: 'var(--theme-accent)' }}
                      onClick={() => setScore(key, score + 1)}
                    >+</button>
                  </>
                ) : (
                  <input
                    type="number"
                    className="pf-input w-16 text-center text-xl font-bold"
                    value={score}
                    min={3} max={30}
                    onChange={e => setScore(key, Number(e.target.value))}
                  />
                )}
              </div>

              {/* Modifier */}
              <div
                className="w-10 text-center font-bold text-sm"
                style={{ color: mod >= 0 ? 'var(--theme-accent)' : 'var(--theme-hp-low)' }}
              >
                {modStr(mod)}
              </div>

              {/* Cost (point buy only) */}
              {method === 'pointbuy' && (
                <div className="w-12 text-center text-xs" style={{ color: 'var(--theme-text-neutral)' }}>
                  Costo: {cost}
                </div>
              )}

              {/* Description */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold" style={{ color: 'var(--theme-text-muted)' }}>{full}</div>
                <div className="text-xs truncate" style={{ color: 'var(--theme-text-faint)' }}>{desc}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pf-panel p-3 text-center text-sm" style={{ color: 'var(--theme-text-faint)' }}>
        Totale punteggi: <strong style={{ color: 'var(--theme-accent)' }}>{totalPoints}</strong>
      </div>
    </WizardLayout>
  );
}
