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
              borderColor: raceId === r.id ? '#c8a443' : '#6b4226',
              boxShadow: raceId === r.id ? '0 0 10px rgba(200,164,67,0.3)' : 'none',
            }}
          >
            <div className="font-bold mb-1" style={{ color: '#c8a443' }}>{r.name}</div>
            <div className="text-xs mb-2" style={{ color: '#9ca3af' }}>{r.size} · {r.speed} m</div>
            <div className="text-xs space-y-0.5" style={{ color: '#f5edd6' }}>
              {Object.entries(r.abilityModifiers).map(([k, v]) => (
                <span key={k} className="mr-2">
                  {ABILITY_LABELS[k as AbilityKey]} {(v ?? 0) >= 0 ? '+' : ''}{v}
                </span>
              ))}
              {r.selectableBonus && (
                <span style={{ color: '#c8a443' }}>+{r.selectableBonus.amount} a scelta</span>
              )}
            </div>
          </button>
        ))}
      </div>

      {race && (
        <div className="pf-panel p-5">
          <h2 className="text-lg font-bold mb-3" style={{ color: '#c8a443' }}>{race.name}</h2>
          <p className="text-sm mb-4" style={{ color: '#d1c5a8' }}>{race.description}</p>

          {race.selectableBonus && (
            <div className="mb-4 p-3 rounded" style={{ background: '#1a1209', border: '1px solid #8b5e3c' }}>
              <p className="text-sm font-semibold mb-2" style={{ color: '#c8a443' }}>
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
                        background: current > 0 ? '#c8a443' : '#2a1f0e',
                        color: current > 0 ? '#1a1209' : '#f5edd6',
                        border: `1px solid ${current > 0 ? '#c8a443' : '#6b4226'}`,
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
            <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#8b5e3c' }}>
              Tratti Razziali
            </h3>
            {race.traits.map(t => (
              <div key={t.name} className="text-sm">
                <span className="font-semibold" style={{ color: '#c8a443' }}>{t.name}: </span>
                <span style={{ color: '#d1c5a8' }}>{t.description}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 text-xs" style={{ color: '#8b8b6b' }}>
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
