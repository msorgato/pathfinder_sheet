import { useState } from 'react';
import { CLASSES } from '../../data/classes';
import { SKILLS } from '../../data/skills';
import { FEATS } from '../../data/feats';
import { getClass } from '../../data/classes';
import { getRace } from '../../data/races';
import {
  effectiveAbilityScores, abilityMod, featLevels, abilityIncreaseLevels,
} from '../../utils/calculations';
import { useCharacterStore } from '../../store/characterStore';
import type { Character, AbilityKey } from '../../types';

const ABILITY_LABELS: Record<AbilityKey, string> = {
  str: 'FOR', dex: 'DES', con: 'COS', int: 'INT', wis: 'SAG', cha: 'CAR',
};

interface Props {
  char: Character;
  onClose: () => void;
}

export function LevelUpWizard({ char, onClose }: Props) {
  const { levelUp } = useCharacterStore();
  const nextLevel = char.totalLevel + 1;
  const scores = effectiveAbilityScores(char);

  const [step, setStep] = useState<'class' | 'hp' | 'skills' | 'feat' | 'ability' | 'confirm'>('class');
  const [selectedClassId, setSelectedClassId] = useState(char.classes[0]?.classId ?? '');
  const [hpRoll, setHpRoll] = useState<number | null>(null);
  const [useMax, setUseMax] = useState(false);
  const [skillRanksDelta, setSkillRanksDelta] = useState<Record<string, number>>({});
  const [selectedFeat, setSelectedFeat] = useState('');
  const [abilityIncrease, setAbilityIncrease] = useState<AbilityKey | null>(null);
  const [featSearch, setFeatSearch] = useState('');

  const needsFeat = featLevels().includes(nextLevel);
  const needsAbility = abilityIncreaseLevels().includes(nextLevel);

  const selectedCls = getClass(selectedClassId);
  const maxHpRoll = selectedCls?.hitDie ?? 6;

  const race = getRace(char.race);
  const intMod = abilityMod(scores.int);
  const bonusFromRace = race?.bonusSkillRanks ?? 0;
  const skillPointsThisLevel = Math.max(1, (selectedCls?.skillsPerLevel ?? 2) + intMod + bonusFromRace);

  const existingSkillRanks = Object.fromEntries(
    char.skills.map(s => [s.skillId, s.ranks]),
  );
  const newRanks = { ...existingSkillRanks, ...skillRanksDelta };
  const deltaSpent = Object.values(skillRanksDelta).reduce((s, v) => s + v, 0);
  const deltaLeft = skillPointsThisLevel - deltaSpent;

  const classSkillSet = new Set(selectedCls?.classSkills ?? []);

  const newFeatures = selectedCls?.features.filter(f => {
    const entry = char.classes.find(e => e.classId === selectedClassId);
    const newClassLevel = (entry?.level ?? 0) + 1;
    return f.level === newClassLevel;
  }) ?? [];

  const steps = ['class', 'hp', 'skills', needsFeat ? 'feat' : null, needsAbility ? 'ability' : null, 'confirm']
    .filter(Boolean) as string[];
  const stepIdx = steps.indexOf(step);
  const isLast = step === 'confirm';

  const goNext = () => {
    const next = steps[stepIdx + 1];
    if (next) setStep(next as typeof step);
  };
  const goBack = () => {
    const prev = steps[stepIdx - 1];
    if (prev) setStep(prev as typeof step);
  };

  const canProceed = () => {
    if (step === 'class') return !!selectedClassId;
    if (step === 'hp') return hpRoll !== null;
    if (step === 'skills') return deltaLeft === 0;
    if (step === 'feat') return !!selectedFeat;
    if (step === 'ability') return !!abilityIncrease;
    return true;
  };

  const commit = () => {
    if (!selectedCls) return;
    const hpValue = useMax ? maxHpRoll : (hpRoll ?? 1);
    const finalRanks: Record<string, number> = {};
    Object.entries(skillRanksDelta).forEach(([skillId, delta]) => {
      finalRanks[skillId] = (existingSkillRanks[skillId] ?? 0) + delta;
    });
    levelUp(
      char.id,
      selectedClassId,
      hpValue,
      finalRanks,
      selectedFeat || undefined,
      abilityIncrease ?? undefined,
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}
    >
      <div
        className="w-full max-w-lg rounded-xl shadow-2xl flex flex-col"
        style={{ background: '#1e1508', border: '2px solid #c8a443', maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="pf-header px-6 py-4 rounded-t-xl flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold" style={{ color: '#f5edd6' }}>
              ⬆ Level Up → {nextLevel}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: '#c8a443' }}>
              Passo {stepIdx + 1} di {steps.length}
            </p>
          </div>
          <button onClick={onClose} className="text-2xl" style={{ color: '#c8a443' }}>✕</button>
        </div>

        {/* Progress */}
        <div className="px-6 pt-3 pb-1">
          <div className="flex gap-1">
            {steps.map((s, i) => (
              <div
                key={s}
                className="flex-1 h-1 rounded-full"
                style={{ background: i <= stepIdx ? '#c8a443' : '#4b3620' }}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

          {/* STEP: CLASS */}
          {step === 'class' && (
            <div>
              <h3 className="text-base font-bold mb-3" style={{ color: '#c8a443' }}>
                Scegli la classe da aumentare
              </h3>
              <div className="space-y-2">
                {/* Existing classes */}
                {char.classes.map(e => {
                  const cls = getClass(e.classId);
                  return (
                    <button
                      key={e.classId}
                      onClick={() => setSelectedClassId(e.classId)}
                      className="w-full pf-panel p-3 text-left"
                      style={{ borderColor: selectedClassId === e.classId ? '#c8a443' : '#6b4226' }}
                    >
                      <span className="font-semibold" style={{ color: '#c8a443' }}>{cls?.name}</span>
                      <span className="ml-2 text-sm" style={{ color: '#9ca3af' }}>LV {e.level} → {e.level + 1}</span>
                      <span className="ml-2 text-xs" style={{ color: '#6b4226' }}>(multiclasse)</span>
                    </button>
                  );
                })}
                {/* New class option */}
                <div className="mt-2">
                  <p className="text-xs mb-2" style={{ color: '#8b5e3c' }}>Oppure aggiungi una nuova classe (multiclasse):</p>
                  <div className="grid grid-cols-2 gap-2">
                    {CLASSES.filter(c => !char.classes.find(e => e.classId === c.id)).map(c => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedClassId(c.id)}
                        className="pf-panel p-2 text-left text-sm"
                        style={{ borderColor: selectedClassId === c.id ? '#c8a443' : '#4b3620' }}
                      >
                        <span style={{ color: '#d1c5a8' }}>{c.name}</span>
                        <span className="ml-1 text-xs" style={{ color: '#6b4226' }}>d{c.hitDie}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* New features preview */}
              {newFeatures.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#8b5e3c' }}>
                    Nuove capacità:
                  </p>
                  {newFeatures.map(f => (
                    <div key={f.name} className="text-xs pf-panel p-2 mb-1">
                      <span className="font-semibold" style={{ color: '#c8a443' }}>{f.name}: </span>
                      <span style={{ color: '#d1c5a8' }}>{f.description}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP: HP */}
          {step === 'hp' && selectedCls && (
            <div>
              <h3 className="text-base font-bold mb-3" style={{ color: '#c8a443' }}>
                Tira i Punti Ferita (d{maxHpRoll})
              </h3>
              <div className="flex gap-3 mb-4">
                <button
                  onClick={() => { setUseMax(false); setHpRoll(null); }}
                  className="pf-btn flex-1"
                  style={{ background: !useMax ? '#2a1f0e' : '#1a1209', border: `1px solid ${!useMax ? '#c8a443' : '#4b3620'}`, color: !useMax ? '#c8a443' : '#9ca3af' }}
                >Tiro Dado</button>
                <button
                  onClick={() => { setUseMax(true); setHpRoll(maxHpRoll); }}
                  className="pf-btn flex-1"
                  style={{ background: useMax ? '#2a1f0e' : '#1a1209', border: `1px solid ${useMax ? '#c8a443' : '#4b3620'}`, color: useMax ? '#c8a443' : '#9ca3af' }}
                >Massimo ({maxHpRoll})</button>
              </div>
              {!useMax && (
                <div className="flex gap-3 items-center">
                  <button
                    className="pf-btn pf-btn-gold px-5"
                    onClick={() => setHpRoll(Math.ceil(Math.random() * maxHpRoll))}
                  >
                    🎲 Tira d{maxHpRoll}
                  </button>
                  <span className="text-3xl font-bold" style={{ color: hpRoll ? '#c8a443' : '#6b6b5b' }}>
                    {hpRoll ?? '?'}
                  </span>
                  <input
                    type="number"
                    className="pf-input w-20 text-center"
                    value={hpRoll ?? ''}
                    min={1} max={maxHpRoll}
                    onChange={e => setHpRoll(Number(e.target.value))}
                    placeholder="Manuale"
                  />
                </div>
              )}
              {useMax && (
                <p className="text-sm" style={{ color: '#4ade80' }}>✓ Massimo: +{maxHpRoll} PF</p>
              )}
              <p className="text-xs mt-3" style={{ color: '#8b8b6b' }}>
                Il modificatore di Costituzione ({abilityMod(scores.con) >= 0 ? '+' : ''}{abilityMod(scores.con)}) viene aggiunto automaticamente.
              </p>
            </div>
          )}

          {/* STEP: SKILLS */}
          {step === 'skills' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold" style={{ color: '#c8a443' }}>Gradi di Abilità</h3>
                <span
                  className="text-xl font-bold"
                  style={{ color: deltaLeft === 0 ? '#4ade80' : deltaLeft < 0 ? '#ef4444' : '#c8a443' }}
                >
                  {deltaLeft} rimasti
                </span>
              </div>
              <p className="text-xs mb-3" style={{ color: '#8b8b6b' }}>
                {skillPointsThisLevel} punti ({selectedCls?.skillsPerLevel ?? 2} classe + INT {abilityMod(scores.int) >= 0 ? '+' : ''}{abilityMod(scores.int)})
                {bonusFromRace > 0 ? ` +${bonusFromRace} razza` : ''}
              </p>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {SKILLS.map(sk => {
                  const currentRank = existingSkillRanks[sk.id] ?? 0;
                  const delta = skillRanksDelta[sk.id] ?? 0;
                  const finalRank = currentRank + delta;
                  const isClass = classSkillSet.has(sk.id);
                  return (
                    <div key={sk.id} className="flex items-center gap-2 px-2 py-1 rounded"
                      style={{ background: delta > 0 ? 'rgba(200,164,67,0.06)' : 'transparent' }}
                    >
                      <span className="w-4 text-xs" style={{ color: '#4ade80' }}>{isClass ? '✓' : ''}</span>
                      <span className="flex-1 text-sm" style={{ color: delta > 0 ? '#f5edd6' : '#9ca3af' }}>
                        {sk.name}
                      </span>
                      <span className="text-xs w-12 text-right" style={{ color: '#6b6b5b' }}>
                        gradi: {finalRank}/{nextLevel}
                      </span>
                      <div className="flex gap-1">
                        <button
                          className="w-6 h-6 rounded flex items-center justify-center text-sm"
                          style={{ background: '#1a1209', border: '1px solid #4b3620', color: '#c8a443' }}
                          onClick={() => {
                            if (delta > 0) setSkillRanksDelta(d => ({ ...d, [sk.id]: delta - 1 }));
                          }}
                          disabled={delta === 0}
                        >−</button>
                        <button
                          className="w-6 h-6 rounded flex items-center justify-center text-sm"
                          style={{ background: '#1a1209', border: '1px solid #4b3620', color: '#c8a443' }}
                          onClick={() => {
                            if (deltaLeft > 0 && finalRank < nextLevel) {
                              setSkillRanksDelta(d => ({ ...d, [sk.id]: delta + 1 }));
                            }
                          }}
                          disabled={deltaLeft === 0 || finalRank >= nextLevel}
                        >+</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP: FEAT */}
          {step === 'feat' && needsFeat && (
            <div>
              <h3 className="text-base font-bold mb-3" style={{ color: '#c8a443' }}>
                Scegli un Talento (livello {nextLevel})
              </h3>
              <input
                className="pf-input mb-3"
                placeholder="Cerca talento..."
                value={featSearch}
                onChange={e => setFeatSearch(e.target.value)}
              />
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {FEATS.filter(f => f.name.toLowerCase().includes(featSearch.toLowerCase())).map(f => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFeat(f.id)}
                    className="w-full text-left pf-panel p-3 transition-all"
                    style={{ borderColor: selectedFeat === f.id ? '#c8a443' : '#6b4226' }}
                  >
                    <div className="font-semibold text-sm" style={{ color: selectedFeat === f.id ? '#c8a443' : '#f5edd6' }}>
                      {f.name}
                    </div>
                    {f.prerequisites && (
                      <div className="text-xs" style={{ color: '#8b5e3c' }}>Prerequisiti: {f.prerequisites}</div>
                    )}
                    <div className="text-xs mt-0.5" style={{ color: '#d1c5a8' }}>{f.benefit}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP: ABILITY */}
          {step === 'ability' && needsAbility && (
            <div>
              <h3 className="text-base font-bold mb-3" style={{ color: '#c8a443' }}>
                Aumento Caratteristica (livello {nextLevel})
              </h3>
              <p className="text-sm mb-4" style={{ color: '#d1c5a8' }}>
                Ai livelli 4, 8, 12, 16, 20 puoi aumentare una caratteristica di +1.
              </p>
              <div className="grid grid-cols-3 gap-3">
                {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as AbilityKey[]).map(key => (
                  <button
                    key={key}
                    onClick={() => setAbilityIncrease(key)}
                    className="stat-box py-3 transition-all cursor-pointer"
                    style={{ borderColor: abilityIncrease === key ? '#c8a443' : '#4b3620' }}
                  >
                    <div className="text-xs font-bold uppercase" style={{ color: '#8b5e3c' }}>
                      {ABILITY_LABELS[key]}
                    </div>
                    <div className="text-xl font-bold" style={{ color: '#f5edd6' }}>{scores[key]}</div>
                    {abilityIncrease === key && (
                      <div className="text-xs" style={{ color: '#4ade80' }}>→ {scores[key] + 1}</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP: CONFIRM */}
          {step === 'confirm' && (
            <div className="space-y-3">
              <h3 className="text-base font-bold" style={{ color: '#c8a443' }}>Conferma Level Up</h3>
              <div className="pf-panel p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: '#d1c5a8' }}>Classe:</span>
                  <span style={{ color: '#c8a443' }}>{getClass(selectedClassId)?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: '#d1c5a8' }}>Livello totale:</span>
                  <span style={{ color: '#c8a443' }}>{char.totalLevel} → {nextLevel}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: '#d1c5a8' }}>PF guadagnati:</span>
                  <span style={{ color: '#4ade80' }}>
                    +{(useMax ? maxHpRoll : hpRoll) ?? 0} (+{abilityMod(scores.con)} COS)
                    = +{((useMax ? maxHpRoll : hpRoll) ?? 0) + abilityMod(scores.con)}
                  </span>
                </div>
                {selectedFeat && (
                  <div className="flex justify-between">
                    <span style={{ color: '#d1c5a8' }}>Talento:</span>
                    <span style={{ color: '#9b7fd4' }}>{FEATS.find(f => f.id === selectedFeat)?.name}</span>
                  </div>
                )}
                {abilityIncrease && (
                  <div className="flex justify-between">
                    <span style={{ color: '#d1c5a8' }}>Caratteristica:</span>
                    <span style={{ color: '#c8a443' }}>
                      {ABILITY_LABELS[abilityIncrease]} {scores[abilityIncrease]} → {scores[abilityIncrease] + 1}
                    </span>
                  </div>
                )}
                {Object.entries(skillRanksDelta).filter(([, v]) => v > 0).map(([id, v]) => {
                  const sk = SKILLS.find(s => s.id === id);
                  return (
                    <div key={id} className="flex justify-between">
                      <span style={{ color: '#d1c5a8' }}>+{v} {sk?.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex justify-between gap-3" style={{ borderTop: '1px solid #4b3620' }}>
          <button className="pf-btn pf-btn-ghost" onClick={stepIdx > 0 ? goBack : onClose}>
            {stepIdx > 0 ? '← Indietro' : 'Annulla'}
          </button>
          {isLast ? (
            <button className="pf-btn pf-btn-gold" onClick={commit}>
              ✓ Conferma Level Up
            </button>
          ) : (
            <button
              className="pf-btn pf-btn-gold"
              onClick={goNext}
              disabled={!canProceed()}
            >
              Avanti →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
