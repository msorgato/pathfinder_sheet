import { useState } from 'react';
import { RACES } from '../../data/races';
import type { RaceDefinition } from '../../types';
import type { AbilityKey } from '../../types';
import { WizardLayout } from './WizardLayout';

const ABILITY_LABELS: Record<AbilityKey, string> = {
  str: 'FOR', dex: 'DES', con: 'COS', int: 'INT', wis: 'SAG', cha: 'CAR',
};

interface Props {
  selectedRaceId: string;
  selectableBonus: Partial<Record<AbilityKey, number>>;
  onSelect: (raceId: string, bonus: Partial<Record<AbilityKey, number>>) => void;
  onNext: () => void;
}

export function Step1_Race({ selectedRaceId, selectableBonus, onSelect, onNext }: Props) {
  const [raceId, setRaceId] = useState(selectedRaceId);
  const [bonus, setBonus] = useState<Partial<Record<AbilityKey, number>>>(selectableBonus);

  const race = RACES.find(r => r.id === raceId);
  const abilities: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

  const handleSelect = (r: RaceDefinition) => {
    setRaceId(r.id);
    setBonus({});
  };

  const handleCommit = () => {
    onSelect(raceId, bonus);
    onNext();
  };

  const canProceed = !!raceId && (!race?.selectableBonus || Object.values(bonus).reduce((s, v) => s + (v ?? 0), 0) === (race.selectableBonus.count * race.selectableBonus.amount));

  return (
    <WizardLayout
      step={1}
      totalSteps={7}
      title="Scegli la tua Razza"
      onNext={handleCommit}
      nextDisabled={!canProceed}
    >
      <div className="grid grid-cols-2 gap-3 mb-6">
        {RACES.map(r => (
          <button
            key={r.id}
            onClick={() => handleSelect(r)}
            className="pf-panel p-4 text-left transition-all hover:border-yellow-600"
            style={{
              borderColor: raceId === r.id ? 'var(--theme-accent)' : 'var(--theme-border)',
              boxShadow: raceId === r.id ? '0 0 10px rgba(200,164,67,0.3)' : 'none',
            }}
          >
            <div className="font-bold mb-1" style={{ fontSize: 15, color: 'var(--theme-accent)' }}>{r.name}</div>
            <div className="mb-2" style={{ fontSize: 13, color: 'var(--theme-text-neutral)' }}>{r.size} · {r.speed} m</div>
            <div className="space-y-0.5" style={{ fontSize: 13, color: 'var(--theme-text)' }}>
              {Object.entries(r.abilityModifiers).map(([k, v]) => (
                <span key={k} className="mr-2">
                  {ABILITY_LABELS[k as AbilityKey]} {(v ?? 0) >= 0 ? '+' : ''}{v}
                </span>
              ))}
              {r.selectableBonus && (
                <span style={{ color: 'var(--theme-accent)' }}>+{r.selectableBonus.amount} a scelta</span>
              )}
            </div>
          </button>
        ))}
      </div>

      {race && (
        <div className="pf-panel p-5">
          <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--theme-accent)' }}>{race.name}</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--theme-text-muted)' }}>{race.description}</p>

          {race.selectableBonus && (
            <div className="mb-4 p-3 rounded" style={{ background: 'var(--theme-bg)', border: '1px solid var(--theme-border-strong)' }}>
              <p className="text-sm font-semibold mb-2" style={{ color: 'var(--theme-accent)' }}>
                Scegli +{race.selectableBonus.amount} a una caratteristica:
              </p>
              <div className="flex flex-wrap gap-2">
                {abilities.map(ab => {
                  const current = bonus[ab] ?? 0;
                  const total = Object.values(bonus).reduce((s, v) => s + (v ?? 0), 0);
                  const maxAllowed = race.selectableBonus!.count * race.selectableBonus!.amount;
                  return (
                    <button
                      key={ab}
                      onClick={() => {
                        if (current > 0) {
                          setBonus(b => ({ ...b, [ab]: 0 }));
                        } else if (total < maxAllowed) {
                          setBonus(b => ({ ...b, [ab]: race.selectableBonus!.amount }));
                        }
                      }}
                      className="pf-btn text-sm px-3 py-1"
                      style={{
                        background: current > 0 ? 'var(--theme-accent)' : 'var(--theme-bg-panel)',
                        color: current > 0 ? 'var(--theme-bg)' : 'var(--theme-text)',
                        border: `1px solid ${current > 0 ? 'var(--theme-accent)' : 'var(--theme-border)'}`,
                      }}
                    >
                      {ABILITY_LABELS[ab]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--theme-border-strong)' }}>
              Tratti Razziali
            </h3>
            {race.traits.map(t => (
              <div key={t.name} className="text-sm">
                <span className="font-semibold" style={{ color: 'var(--theme-accent)' }}>{t.name}: </span>
                <span style={{ color: 'var(--theme-text-muted)' }}>{t.description}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 text-xs" style={{ color: 'var(--theme-text-faint)' }}>
            <strong>Lingue:</strong> {race.languages.join(', ')}
            {race.bonusLanguages.length > 0 && (
              <> · <strong>Bonus:</strong> {race.bonusLanguages.join(', ')}</>
            )}
          </div>
        </div>
      )}
    </WizardLayout>
  );
}
