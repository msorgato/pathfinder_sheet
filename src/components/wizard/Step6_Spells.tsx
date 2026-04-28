import { useState } from 'react';
import { getClass } from '../../data/classes';
import { getSpellsForClassAndLevel, getSpellsForClass } from '../../data/spells';
import { computeSpellSlots, spellsKnownAtLevel } from '../../utils/calculations';
import type { AbilityScores, KnownSpell } from '../../types';
import { WizardLayout } from './WizardLayout';

const SCHOOL_COLORS: Record<string, string> = {
  Evocation: '#ef4444', Conjuration: '#3b82f6', Abjuration: '#6366f1',
  Divination: '#a855f7', Enchantment: '#ec4899', Illusion: '#14b8a6',
  Necromancy: '#22c55e', Transmutation: '#f59e0b', Universal: '#9ca3af',
};

interface Props {
  classId: string;
  abilityScores: AbilityScores;
  knownSpells: KnownSpell[];
  onChange: (spells: KnownSpell[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step6_Spells({ classId, abilityScores, knownSpells, onChange, onNext, onBack }: Props) {
  const [selectedLevel, setSelectedLevel] = useState(0);

  const cls = getClass(classId);

  if (!cls?.spellcasting) {
    return (
      <WizardLayout
        step={6} totalSteps={7}
        title="Incantesimi"
        onBack={onBack} onNext={onNext}
      >
        <div className="pf-panel p-8 text-center">
          <div className="text-4xl mb-4">⚔️</div>
          <h2 className="text-xl font-bold mb-2" style={{ color: '#c8a443' }}>
            Classe non incantatore
          </h2>
          <p style={{ color: '#d1c5a8' }}>
            Il {cls?.name ?? 'personaggio'} non usa incantesimi. Procedi al passo successivo.
          </p>
        </div>
      </WizardLayout>
    );
  }

  const spellcasting = cls.spellcasting;
  const abilityScore = abilityScores[spellcasting.ability];
  const slots = computeSpellSlots(classId, 1, abilityScore);
  const accessibleLevels = slots.map(s => s.level);

  const knownAtLevel = spellsKnownAtLevel(classId, 1);
  const isSpontaneous = spellcasting.type === 'spontaneous';

  // For prepared casters (not sorcerer/bard), they know all spells from the list
  // For spontaneous casters, they choose a limited number
  const maxKnown = isSpontaneous ? (knownAtLevel[selectedLevel] ?? 0) : Infinity;
  const spellsAtLevel = getSpellsForClassAndLevel(classId, selectedLevel);
  const selectedAtLevel = knownSpells.filter(ks => ks.spellLevel === selectedLevel && ks.classId === classId);

  const toggle = (spellId: string) => {
    const exists = knownSpells.find(ks => ks.spellId === spellId && ks.classId === classId);
    if (exists) {
      onChange(knownSpells.filter(ks => !(ks.spellId === spellId && ks.classId === classId)));
    } else {
      if (isSpontaneous && selectedAtLevel.length >= maxKnown) return;
      onChange([...knownSpells, { spellId, classId, spellLevel: selectedLevel }]);
    }
  };

  const ABIL_LABEL: Record<string, string> = {
    int: 'INT', wis: 'SAG', cha: 'CAR',
  };

  return (
    <WizardLayout
      step={6} totalSteps={7}
      title={isSpontaneous ? 'Scegli gli Incantesimi Conosciuti' : 'Lista Incantesimi'}
      onBack={onBack} onNext={onNext}
    >
      <div className="pf-panel p-3 mb-4 text-sm" style={{ color: '#d1c5a8' }}>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span>✨ {cls.name}</span>
          <span>Caratteristica: <strong style={{ color: '#c8a443' }}>{ABIL_LABEL[spellcasting.ability]}</strong> ({abilityScore})</span>
          <span>Tipo: <strong style={{ color: '#c8a443' }}>{isSpontaneous ? 'Spontaneo' : 'Preparato'}</strong></span>
          {!isSpontaneous && (
            <span style={{ color: '#9ca3af' }}>I maghi/chierici preparano dalla lista ogni giorno. Qui gestisci la scheda.</span>
          )}
        </div>
      </div>

      {/* Slot table */}
      <div className="pf-panel p-3 mb-4">
        <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#8b5e3c' }}>
          Slot al 1° livello
        </div>
        <div className="flex flex-wrap gap-2">
          {slots.map(s => (
            <div key={s.level} className="stat-box px-3 py-1 text-xs">
              <div style={{ color: '#8b5e3c' }}>{s.level === 0 ? 'Trucch.' : `${s.level}°`}</div>
              <div className="font-bold" style={{ color: '#c8a443' }}>
                {s.base}{s.bonus > 0 ? <span style={{ color: '#9b7fd4' }}>+{s.bonus}</span> : ''}
              </div>
            </div>
          ))}
        </div>
      </div>

      {isSpontaneous && (
        <>
          {/* Level selector */}
          <div className="flex gap-1 mb-4 flex-wrap">
            {accessibleLevels.map(lv => {
              const known = knownSpells.filter(ks => ks.spellLevel === lv && ks.classId === classId).length;
              const max = knownAtLevel[lv] ?? 0;
              return (
                <button
                  key={lv}
                  onClick={() => setSelectedLevel(lv)}
                  className="px-3 py-1 rounded text-sm font-semibold"
                  style={{
                    background: selectedLevel === lv ? '#c8a443' : '#2a1f0e',
                    color: selectedLevel === lv ? '#1a1209' : '#f5edd6',
                    border: `1px solid ${known === max ? '#4ade80' : '#6b4226'}`,
                  }}
                >
                  {lv === 0 ? 'Trucch.' : `${lv}°`}
                  <span className="ml-1 text-xs">({known}/{max})</span>
                </button>
              );
            })}
          </div>

          <div className="space-y-2">
            {spellsAtLevel.length === 0 && (
              <div className="text-center py-4" style={{ color: '#8b8b6b' }}>
                Nessun incantesimo disponibile per questa classe a questo livello.
              </div>
            )}
            {spellsAtLevel.map(spell => {
              const isKnown = !!knownSpells.find(ks => ks.spellId === spell.id && ks.classId === classId);
              const atMax = !isKnown && selectedAtLevel.length >= maxKnown;
              return (
                <button
                  key={spell.id}
                  onClick={() => toggle(spell.id)}
                  disabled={atMax}
                  className="w-full text-left pf-panel p-3 transition-all"
                  style={{
                    borderColor: isKnown ? '#c8a443' : '#6b4226',
                    opacity: atMax ? 0.4 : 1,
                    boxShadow: isKnown ? '0 0 6px rgba(200,164,67,0.2)' : 'none',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs px-1 rounded font-bold"
                      style={{ background: SCHOOL_COLORS[spell.school] + '33', color: SCHOOL_COLORS[spell.school] }}
                    >
                      {spell.school.slice(0, 3).toUpperCase()}
                    </span>
                    <span className="font-semibold text-sm" style={{ color: isKnown ? '#c8a443' : '#f5edd6' }}>
                      {spell.name}
                    </span>
                    {isKnown && <span className="ml-auto text-xs" style={{ color: '#4ade80' }}>✓ conosciuto</span>}
                  </div>
                  <div className="text-xs mt-1" style={{ color: '#9ca3af' }}>{spell.description}</div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {!isSpontaneous && (
        <div className="space-y-2">
          <p className="text-sm mb-3" style={{ color: '#d1c5a8' }}>
            Tutti gli incantesimi disponibili per la tua classe. Potrai selezionare quali preparare ogni giorno dalla scheda personaggio.
          </p>
          {getSpellsForClass(classId).slice(0, 20).map(spell => (
            <div key={spell.id} className="pf-panel p-3">
              <div className="flex items-center gap-2">
                <span
                  className="text-xs px-1 rounded font-bold"
                  style={{ background: SCHOOL_COLORS[spell.school] + '33', color: SCHOOL_COLORS[spell.school] }}
                >
                  {spell.school.slice(0, 3).toUpperCase()}
                </span>
                <span className="font-semibold text-sm" style={{ color: '#f5edd6' }}>{spell.name}</span>
                <span className="text-xs" style={{ color: '#8b5e3c' }}>
                  {spell.levels[classId]}° livello
                </span>
              </div>
              <div className="text-xs mt-1" style={{ color: '#9ca3af' }}>{spell.description}</div>
            </div>
          ))}
        </div>
      )}
    </WizardLayout>
  );
}
