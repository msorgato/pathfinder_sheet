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
      <div className="label-rune" style={{ marginBottom: 16 }}>Caratteristiche</div>
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
            <div key={key} className="stat-tile p-3">
              <div className="label-rune-soft" style={{ marginBottom: 4 }}>{ABILITY_LABELS[key]}</div>
              <div className="numeral" style={{ fontSize: 30, color: 'var(--ink)', lineHeight: 1, marginBottom: 4 }}>{score}</div>

              {/* Modifier badge — clickable for roll */}
              <button
                className="numeral"
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  padding: '2px 8px',
                  background: mod >= 0 ? 'rgba(212,165,116,0.12)' : 'rgba(220,38,38,0.12)',
                  color: mod >= 0 ? 'var(--gold)' : 'var(--blood)',
                  border: `1px solid ${mod >= 0 ? 'var(--line-mid)' : 'rgba(220,38,38,0.4)'}`,
                  cursor: onQuickRoll ? 'pointer' : 'default',
                  display: 'inline-block',
                  marginBottom: 4,
                  transition: 'box-shadow 0.15s',
                }}
                title={onQuickRoll ? `Tira 1d20${modStr(mod)}` : undefined}
                onClick={() => onQuickRoll?.({ label: ABILITY_LABELS[key], numDice: 1, dieType: 20, modifier: mod })}
              >
                {modStr(mod)}
              </button>

              <div style={{ fontSize: 10, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
                {base}{racial !== 0 ? ` ${racial >= 0 ? '+' : ''}${racial}R` : ''}
                {increases !== 0 ? ` +${increases}↑` : ''}
              </div>
              <div style={{ fontSize: 10, color: 'var(--ink-faint)', fontFamily: 'var(--font-rune)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>
                {ABILITY_FULL[key]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
