import { useState } from 'react';
import { SKILLS } from '../../data/skills';
import { getClass } from '../../data/classes';
import type { Character, AbilityKey } from '../../types';
import { effectiveAbilityScores, abilityMod, skillTotal } from '../../utils/calculations';
import { useCharacterStore } from '../../store/characterStore';

const AB_LABELS: Record<AbilityKey, string> = {
  str: 'FOR', dex: 'DES', con: 'COS', int: 'INT', wis: 'SAG', cha: 'CAR',
};

interface Props { char: Character }

export function SkillsPanel({ char }: Props) {
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
        <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#c8a443' }}>Abilità</h3>
        <span className="text-xs" style={{ color: '#8b8b6b' }}>
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
            background: onlyTrained ? '#c8a443' : '#2a1f0e',
            color: onlyTrained ? '#1a1209' : '#f5edd6',
            border: '1px solid #6b4226',
          }}
          onClick={() => setOnlyTrained(t => !t)}
        >
          Solo addestrati
        </button>
      </div>

      <div className="space-y-1">
        {/* Header */}
        <div className="grid text-xs px-2 mb-1" style={{ gridTemplateColumns: '1fr 20px 40px 40px 40px 50px', color: '#6b6b5b' }}>
          <span>Abilità</span>
          <span></span>
          <span className="text-center">Car</span>
          <span className="text-center">Grad</span>
          <span className="text-center">Misc</span>
          <span className="text-center">Tot</span>
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
                <span className="text-sm" style={{ color: ranks > 0 ? '#f5edd6' : '#9ca3af' }}>
                  {skill.name}
                </span>
                {skill.trainedOnly && <span className="ml-1 text-xs" style={{ color: '#6b4226' }}>*</span>}
              </div>
              <div className="text-xs text-center" style={{ color: '#4ade80' }}>
                {isClass ? '✓' : ''}
              </div>
              <div className="text-xs text-center" style={{ color: '#8b5e3c' }}>
                {AB_LABELS[skill.ability]}
              </div>
              <div className="text-center">
                <input
                  type="number"
                  className="w-8 text-center text-xs rounded border"
                  style={{ background: '#1a1209', borderColor: '#4b3620', color: '#f5edd6', padding: '1px 2px' }}
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
                  style={{ background: '#1a1209', borderColor: '#4b3620', color: '#f5edd6', padding: '1px 2px' }}
                  value={misc}
                  onChange={e => setSkillMisc(char.id, skill.id, Number(e.target.value))}
                />
              </div>
              <div
                className="text-center text-sm font-bold"
                style={{ color: total >= 10 ? '#c8a443' : total >= 5 ? '#d1c5a8' : '#9ca3af' }}
              >
                {total >= 0 ? '+' : ''}{total}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
