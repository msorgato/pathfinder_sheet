import { useState } from 'react';
import { SKILLS } from '../../data/skills';
import { getClass } from '../../data/classes';
import { getRace } from '../../data/races';
import type { AbilityScores, AbilityKey } from '../../types';
import { abilityMod } from '../../utils/calculations';
import { WizardLayout } from './WizardLayout';

const AB_LABELS: Record<AbilityKey, string> = {
  str: 'FOR', dex: 'DES', con: 'COS', int: 'INT', wis: 'SAG', cha: 'CAR',
};

interface Props {
  classId: string;
  raceId: string;
  abilityScores: AbilityScores;
  skillRanks: Record<string, number>;
  onChange: (ranks: Record<string, number>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step4_Skills({
  classId, raceId, abilityScores, skillRanks, onChange, onNext, onBack,
}: Props) {
  const cls = getClass(classId);
  const race = getRace(raceId);

  const intMod = abilityMod(abilityScores.int);
  const bonusFromRace = race?.bonusSkillRanks ?? 0;
  const skillsPerLevel = Math.max(1, (cls?.skillsPerLevel ?? 2) + intMod + bonusFromRace);
  const spent = Object.values(skillRanks).reduce((s, v) => s + v, 0);
  const remaining = skillsPerLevel - spent;

  const classSkills = new Set(cls?.classSkills ?? []);

  const setRank = (skillId: string, val: number) => {
    const newRanks = { ...skillRanks, [skillId]: Math.max(0, Math.min(1, val)) };
    onChange(newRanks);
  };

  return (
    <WizardLayout
      step={4} totalSteps={7}
      title="Distribuisci i Gradi di Abilità"
      onBack={onBack} onNext={onNext}
      nextDisabled={remaining < 0}
    >
      <div
        className="pf-panel p-3 mb-4 flex items-center justify-between"
      >
        <span className="text-sm" style={{ color: '#d1c5a8' }}>
          Gradi disponibili al 1° livello ({cls?.skillsPerLevel ?? 2} + INT{intMod >= 0 ? '+' : ''}{intMod}{bonusFromRace > 0 ? ` +${bonusFromRace} (razza)` : ''}):
        </span>
        <span
          className="text-xl font-bold"
          style={{ color: remaining === 0 ? '#4ade80' : remaining < 0 ? '#ef4444' : '#c8a443' }}
        >
          {remaining}
        </span>
      </div>

      <div className="text-xs mb-3 px-1" style={{ color: '#8b8b6b' }}>
        Le abilità di classe ✓ ricevono +3 se hai almeno 1 grado. Solo addestramento = min 1 grado per usare.
      </div>

      <div className="space-y-1">
        {SKILLS.map(skill => {
          const isClass = classSkills.has(skill.id);
          const rank = skillRanks[skill.id] ?? 0;
          const mod = abilityMod(abilityScores[skill.ability]);
          const csBonus = isClass && rank > 0 ? 3 : 0;
          const total = mod + rank + csBonus;

          return (
            <div
              key={skill.id}
              className="flex items-center gap-2 px-3 py-2 rounded"
              style={{
                background: rank > 0 ? 'rgba(200,164,67,0.08)' : 'rgba(42,31,14,0.5)',
                border: `1px solid ${rank > 0 ? '#6b4226' : 'transparent'}`,
              }}
            >
              {/* Class skill indicator */}
              <span className="w-4 text-xs" style={{ color: '#4ade80' }}>
                {isClass ? '✓' : ''}
              </span>

              {/* Rank toggle */}
              <button
                className="w-6 h-6 rounded flex items-center justify-center text-sm font-bold"
                style={{
                  background: rank > 0 ? '#c8a443' : '#1a1209',
                  color: rank > 0 ? '#1a1209' : '#6b4226',
                  border: `1px solid ${rank > 0 ? '#c8a443' : '#4b3620'}`,
                }}
                onClick={() => setRank(skill.id, rank > 0 ? 0 : 1)}
                disabled={!skill.trainedOnly && rank === 0 && remaining === 0}
              >
                {rank > 0 ? '●' : '○'}
              </button>

              {/* Name */}
              <span className="flex-1 text-sm" style={{ color: rank > 0 ? '#f5edd6' : '#9ca3af' }}>
                {skill.name}
                {skill.trainedOnly && (
                  <span className="ml-1 text-xs" style={{ color: '#8b5e3c' }}>(solo addestrati)</span>
                )}
              </span>

              {/* Ability */}
              <span className="text-xs w-8 text-right" style={{ color: '#8b5e3c' }}>
                {AB_LABELS[skill.ability]}
              </span>

              {/* Mod */}
              <span className="text-xs w-6 text-right" style={{ color: '#9ca3af' }}>
                {mod >= 0 ? '+' : ''}{mod}
              </span>

              {/* Total */}
              <span
                className="w-8 text-center text-sm font-bold"
                style={{ color: total >= 5 ? '#c8a443' : '#d1c5a8' }}
              >
                {total >= 0 ? '+' : ''}{total}
              </span>
            </div>
          );
        })}
      </div>
    </WizardLayout>
  );
}
