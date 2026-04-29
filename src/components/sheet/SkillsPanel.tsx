import { useState } from 'react';
import { SKILLS } from '../../data/skills';
import { getClass } from '../../data/classes';
import type { Character, AbilityKey } from '../../types';
import { effectiveAbilityScores, abilityMod, skillTotal } from '../../utils/calculations';
import { useCharacterStore } from '../../store/characterStore';
import type { RollRequest } from './DiceRoller';

const AB_LABELS: Record<AbilityKey, string> = {
  str: 'FOR', dex: 'DES', con: 'COS', int: 'INT', wis: 'SAG', cha: 'CAR',
};

interface Props {
  char: Character;
  onQuickRoll?: (req: RollRequest) => void;
}

export function SkillsPanel({ char, onQuickRoll }: Props) {
  const { setSkillRanks, setSkillMisc } = useCharacterStore();
  const [search, setSearch] = useState('');
  const [onlyTrained, setOnlyTrained] = useState(false);

  const scores = effectiveAbilityScores(char);

  // Build merged class skill set
  const classSkillSet = new Set(
    char.classes.flatMap(e => getClass(e.classId)?.classSkills ?? []),
  );

  const filtered = SKILLS.filter(s => {
    if (onlyTrained && !char.skills.find(sk => sk.skillId === s.id && sk.ranks > 0)) return false;
    return s.name.toLowerCase().includes(search.toLowerCase());
  });

  const totalSkillPoints = char.totalLevel > 0
    ? char.classes.reduce((sum, entry) => {
        const cls = getClass(entry.classId);
        const intMod = abilityMod(scores.int);
        return sum + (Math.max(1, (cls?.skillsPerLevel ?? 2) + intMod)) * entry.level;
      }, 0)
    : 0;

  const usedPoints = char.skills.reduce((s, sk) => s + sk.ranks, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--theme-accent)' }}>Abilità</h3>
        <span className="text-xs" style={{ color: 'var(--theme-text-faint)' }}>
          Gradi: {usedPoints}/{totalSkillPoints}
        </span>
      </div>

      <div className="flex gap-2">
        <input
          className="pf-input flex-1"
          placeholder="Cerca abilità..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button
          className="pf-btn text-xs px-3"
          style={{
            background: onlyTrained ? 'var(--theme-accent)' : 'var(--theme-bg-panel)',
            color: onlyTrained ? 'var(--theme-bg)' : 'var(--theme-text)',
            border: '1px solid var(--theme-border)',
          }}
          onClick={() => setOnlyTrained(t => !t)}
        >
          Solo addestrati
        </button>
      </div>

      <div className="space-y-1">
        {/* Header */}
        <div className="grid text-xs px-2 mb-1" style={{ gridTemplateColumns: '1fr 20px 40px 40px 40px 50px', color: 'var(--theme-text-faint)' }}>
          <span>Abilità</span>
          <span></span>
          <span className="text-center">Car</span>
          <span className="text-center">Grad</span>
          <span className="text-center">Misc</span>
          <span className="text-center" title={onQuickRoll ? 'Clicca per tirare' : undefined}>Tot</span>
        </div>

        {filtered.map(skill => {
          const skillData = char.skills.find(s => s.skillId === skill.id);
          const ranks = skillData?.ranks ?? 0;
          const misc = skillData?.misc ?? 0;
          const isClass = classSkillSet.has(skill.id);
          const total = skillTotal(skill.id, skill.ability, scores[skill.ability], ranks, isClass, misc);

          return (
            <div
              key={skill.id}
              className="grid items-center px-2 py-1.5 rounded transition-colors"
              style={{
                gridTemplateColumns: '1fr 20px 40px 40px 40px 50px',
                background: ranks > 0 ? 'rgba(200,164,67,0.06)' : 'transparent',
              }}
            >
              <div>
                <span className="text-sm" style={{ color: ranks > 0 ? 'var(--theme-text)' : 'var(--theme-text-neutral)' }}>
                  {skill.name}
                </span>
                {skill.trainedOnly && <span className="ml-1 text-xs" style={{ color: 'var(--theme-border)' }}>*</span>}
              </div>
              <div className="text-xs text-center" style={{ color: 'var(--theme-hp-high)' }}>
                {isClass ? '✓' : ''}
              </div>
              <div className="text-xs text-center" style={{ color: 'var(--theme-border-strong)' }}>
                {AB_LABELS[skill.ability]}
              </div>
              <div className="text-center">
                <input
                  type="number"
                  className="w-8 text-center text-xs rounded border"
                  style={{ background: 'var(--theme-bg)', borderColor: 'var(--theme-ghost-border)', color: 'var(--theme-text)', padding: '1px 2px' }}
                  value={ranks}
                  min={0}
                  max={char.totalLevel}
                  onChange={e => setSkillRanks(char.id, skill.id, Number(e.target.value))}
                />
              </div>
              <div className="text-center">
                <input
                  type="number"
                  className="w-8 text-center text-xs rounded border"
                  style={{ background: 'var(--theme-bg)', borderColor: 'var(--theme-ghost-border)', color: 'var(--theme-text)', padding: '1px 2px' }}
                  value={misc}
                  onChange={e => setSkillMisc(char.id, skill.id, Number(e.target.value))}
                />
              </div>
              <div className="text-center">
                <button
                  className="text-sm font-bold px-1 rounded transition-colors"
                  style={{
                    color: total >= 10 ? 'var(--theme-accent)' : total >= 5 ? 'var(--theme-text-muted)' : 'var(--theme-text-neutral)',
                    cursor: onQuickRoll ? 'pointer' : 'default',
                    background: 'transparent',
                  }}
                  title={onQuickRoll ? `Tira 1d20${total >= 0 ? '+' : ''}${total} (${skill.name})` : undefined}
                  onClick={() => onQuickRoll?.({ label: skill.name, numDice: 1, dieType: 20, modifier: total })}
                >
                  {total >= 0 ? '+' : ''}{total}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
