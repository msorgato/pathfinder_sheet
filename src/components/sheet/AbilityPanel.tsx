import type { Character, AbilityKey } from '../../types';
import { effectiveAbilityScores, abilityMod, modStr } from '../../utils/calculations';
import { StatBox } from '../ui/StatBox';

const ABILITY_LABELS: Record<AbilityKey, string> = {
  str: 'FOR', dex: 'DES', con: 'COS', int: 'INT', wis: 'SAG', cha: 'CAR',
};

const ABILITY_FULL: Record<AbilityKey, string> = {
  str: 'Forza', dex: 'Destrezza', con: 'Costituzione',
  int: 'Intelligenza', wis: 'Saggezza', cha: 'Carisma',
};

interface Props { char: Character }

export function AbilityPanel({ char }: Props) {
  const scores = effectiveAbilityScores(char);
  const abilities: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

  return (
    <div className="pf-panel p-4">
      <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: '#c8a443' }}>
        Caratteristiche
      </h3>
      <div className="grid grid-cols-3 gap-3">
        {abilities.map(key => {
          const score = scores[key];
          const base = char.baseAbilityScores[key];
          const racial = char.racialAbilityBonus?.[key] ?? 0;
          const increases = char.abilityIncreases.reduce((s, inc) => s + (inc[key] ?? 0), 0);
          const mod = abilityMod(score);

          return (
            <div key={key} className="stat-box p-3">
              <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#c8a443' }}>
                {ABILITY_LABELS[key]}
              </div>
              <div className="text-3xl font-bold mb-1" style={{ color: '#f5edd6' }}>{score}</div>
              <div
                className="text-sm font-bold py-0.5 px-2 rounded-full inline-block mb-1"
                style={{
                  background: mod >= 0 ? 'rgba(200,164,67,0.15)' : 'rgba(239,68,68,0.15)',
                  color: mod >= 0 ? '#c8a443' : '#ef4444',
                  border: `1px solid ${mod >= 0 ? '#6b4226' : '#8b1a1a'}`,
                }}
              >
                {modStr(mod)}
              </div>
              <div className="text-xs" style={{ color: '#6b6b5b' }}>
                {base}{racial !== 0 ? ` ${racial >= 0 ? '+' : ''}${racial}R` : ''}
                {increases !== 0 ? ` +${increases}↑` : ''}
              </div>
              <div className="text-xs mt-0.5" style={{ color: '#8b8b6b' }}>
                {ABILITY_FULL[key]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
