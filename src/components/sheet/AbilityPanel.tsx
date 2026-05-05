import type { Character, AbilityKey } from '../../types';
import { effectiveAbilityScores, abilityMod, modStr } from '../../utils/calculations';
import { getRace } from '../../data/races';
import type { RollRequest } from './DiceRoller';

const ABILITY_LABELS: Record<AbilityKey, string> = {
  str: 'FOR', dex: 'DES', con: 'COS', int: 'INT', wis: 'SAG', cha: 'CAR',
};

const ABILITY_FULL: Record<AbilityKey, string> = {
  str: 'Forza', dex: 'Destrezza', con: 'Costituzione',
  int: 'Intelligenza', wis: 'Saggezza', cha: 'Carisma',
};

interface Props {
  char: Character;
  onQuickRoll?: (req: RollRequest) => void;
}

export function AbilityPanel({ char, onQuickRoll }: Props) {
  const scores = effectiveAbilityScores(char);
  const abilities: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
  const raceModifiers = getRace(char.race)?.abilityModifiers ?? {};

  return (
    <div className="pf-panel p-4">
      <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--theme-accent)' }}>
        Caratteristiche
      </h3>
      <div className="grid grid-cols-3 gap-3">
        {abilities.map(key => {
          const score = scores[key];
          const base = char.baseAbilityScores[key];
          const fixedRacial = raceModifiers[key] ?? 0;
          const selectableRacial = char.racialAbilityBonus?.[key] ?? 0;
          const racial = fixedRacial + selectableRacial;
          const increases = char.abilityIncreases.reduce((s, inc) => s + (inc[key] ?? 0), 0);
          const mod = abilityMod(score);

          return (
            <div key={key} className="stat-box p-3">
              <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--theme-accent)' }}>
                {ABILITY_LABELS[key]}
              </div>
              <div className="text-3xl font-bold mb-1" style={{ color: 'var(--theme-text)' }}>{score}</div>
              <button
                className="text-sm font-bold py-0.5 px-2 rounded-full inline-block mb-1 transition-opacity"
                style={{
                  background: mod >= 0 ? 'rgba(200,164,67,0.15)' : 'rgba(239,68,68,0.15)',
                  color: mod >= 0 ? 'var(--theme-accent)' : 'var(--theme-hp-low)',
                  border: `1px solid ${mod >= 0 ? 'var(--theme-border)' : 'var(--theme-danger)'}`,
                  cursor: onQuickRoll ? 'pointer' : 'default',
                }}
                title={onQuickRoll ? `Tira 1d20${modStr(mod)}` : undefined}
                onClick={() => onQuickRoll?.({ label: ABILITY_LABELS[key], numDice: 1, dieType: 20, modifier: mod })}
              >
                {modStr(mod)}
              </button>
              <div className="text-xs" style={{ color: 'var(--theme-text-faint)' }}>
                {base}{racial !== 0 ? ` ${racial >= 0 ? '+' : ''}${racial}R` : ''}
                {increases !== 0 ? ` +${increases}↑` : ''}
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--theme-text-faint)' }}>
                {ABILITY_FULL[key]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
