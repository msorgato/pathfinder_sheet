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

  const classSkillSet = new Set(
    char.classes.flatMap(e => getClass(e.classId)?.classSkills ?? []),
  );

  const filtered = SKILLS
    .filter(s => {
      if (onlyTrained && !char.skills.find(sk => sk.skillId === s.id && sk.ranks > 0)) return false;
      return s.name.toLowerCase().includes(search.toLowerCase());
    })
    .sort((a, b) => a.name.localeCompare(b.name));

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
        <div className="label-rune">Abilità</div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)' }}>
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
          className="pf-btn"
          style={{
            fontSize: 10,
            padding: '6px 12px',
            background: onlyTrained ? 'var(--gold)' : 'var(--surface-1)',
            color: onlyTrained ? 'var(--bg-deep)' : 'var(--ink-mute)',
            border: `1px solid ${onlyTrained ? 'var(--gold)' : 'var(--line-mid)'}`,
          }}
          onClick={() => setOnlyTrained(t => !t)}
        >
          Solo addestrati
        </button>
      </div>

      <div className="space-y-0.5">
        {/* Header */}
        <div
          className="grid px-2 mb-2"
          style={{
            gridTemplateColumns: '1fr 20px 40px 40px 40px 50px',
            color: 'var(--ink-faint)',
            fontFamily: 'var(--font-rune)',
            fontSize: 9,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
          }}
        >
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
              className="grid items-center px-2 py-1.5"
              style={{
                gridTemplateColumns: '1fr 20px 40px 40px 40px 50px',
                borderBottom: '1px solid var(--line-soft)',
                background: ranks > 0 ? 'rgba(212,165,116,0.04)' : 'transparent',
              }}
            >
              <div>
                <span
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 14,
                    color: ranks > 0 ? 'var(--ink)' : 'var(--ink-mute)',
                  }}
                >
                  {skill.name}
                </span>
                {skill.trainedOnly && (
                  <span style={{ marginLeft: 4, fontSize: 10, color: 'var(--ink-faint)' }}>*</span>
                )}
              </div>
              <div style={{ fontSize: 10, textAlign: 'center', color: 'var(--vital)' }}>
                {isClass ? '✓' : ''}
              </div>
              <div className="label-rune-soft" style={{ textAlign: 'center', fontSize: 9 }}>
                {AB_LABELS[skill.ability]}
              </div>
              <div className="text-center">
                <input
                  type="number"
                  className="w-8 text-center text-xs rounded border"
                  style={{
                    background: 'var(--bg-base)',
                    borderColor: 'var(--line-soft)',
                    color: 'var(--ink)',
                    padding: '1px 2px',
                    fontFamily: 'var(--font-mono)',
                  }}
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
                  style={{
                    background: 'var(--bg-base)',
                    borderColor: 'var(--line-soft)',
                    color: 'var(--ink)',
                    padding: '1px 2px',
                    fontFamily: 'var(--font-mono)',
                  }}
                  value={misc}
                  onChange={e => setSkillMisc(char.id, skill.id, Number(e.target.value))}
                />
              </div>
              <div className="text-center">
                <button
                  className="numeral"
                  style={{
                    fontSize: 14,
                    padding: '1px 4px',
                    color: total >= 10 ? 'var(--gold)' : total >= 5 ? 'var(--ink-soft)' : 'var(--ink-mute)',
                    cursor: onQuickRoll ? 'pointer' : 'default',
                    background: 'transparent',
                    border: 'none',
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
