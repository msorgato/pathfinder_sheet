import { useState } from 'react';
import { CLASSES } from '../../data/classes';
import { SKILLS } from '../../data/skills';
import { useMergedFeats, useMergedSpells } from '../../store/dataStore';
import { getClass } from '../../data/classes';
import { getRace } from '../../data/races';
import {
  effectiveAbilityScores, abilityMod, featLevels, abilityIncreaseLevels, computeSpellSlots,
} from '../../utils/calculations';
import { useCharacterStore } from '../../store/characterStore';
import type { Character, AbilityKey, KnownSpell } from '../../types';

const ABILITY_LABELS: Record<AbilityKey, string> = {
  str: 'FOR', dex: 'DES', con: 'COS', int: 'INT', wis: 'SAG', cha: 'CAR',
};

const SCHOOL_COLORS: Record<string, string> = {
  Evocation: 'var(--theme-hp-low)', Conjuration: '#3b82f6', Abjuration: '#6366f1',
  Divination: '#a855f7', Enchantment: '#ec4899', Illusion: '#14b8a6',
  Necromancy: '#22c55e', Transmutation: '#f59e0b', Universal: 'var(--theme-text-neutral)',
};

interface Props {
  char: Character;
  onClose: () => void;
}

export function LevelUpWizard({ char, onClose }: Props) {
  const { levelUp } = useCharacterStore();
  const FEATS = useMergedFeats();
  const mergedSpells = useMergedSpells();
  const nextLevel = char.totalLevel + 1;
  const scores = effectiveAbilityScores(char);

  const [step, setStep] = useState<'class' | 'hp' | 'skills' | 'feat' | 'ability' | 'spells' | 'confirm'>('class');
  const [selectedClassId, setSelectedClassId] = useState(char.classes[0]?.classId ?? '');
  const [hpRoll, setHpRoll] = useState<number | null>(null);
  const [useMax, setUseMax] = useState(false);
  const [skillRanksDelta, setSkillRanksDelta] = useState<Record<string, number>>({});
  const [selectedFeat, setSelectedFeat] = useState('');
  const [abilityIncrease, setAbilityIncrease] = useState<AbilityKey | null>(null);
  const [featSearch, setFeatSearch] = useState('');
  const [newSpellIds, setNewSpellIds] = useState<string[]>([]);
  const [spellSearch, setSpellSearch] = useState('');
  const [spellFilterLevel, setSpellFilterLevel] = useState<number | 'all'>('all');

  const needsFeat = featLevels().includes(nextLevel);
  const needsAbility = abilityIncreaseLevels().includes(nextLevel);

  const selectedCls = getClass(selectedClassId);
  const maxHpRoll = selectedCls?.hitDie ?? 6;
  const isSpellbookCaster = !!selectedCls?.spellcasting?.usesSpellbook;

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

  // Spells available to learn at this level-up
  const newClassLevel = (char.classes.find(e => e.classId === selectedClassId)?.level ?? 0) + 1;
  const spellcasting = selectedCls?.spellcasting;
  const abilityScore = spellcasting ? scores[spellcasting.ability] : 10;
  const accessibleLevels = isSpellbookCaster
    ? computeSpellSlots(selectedClassId, newClassLevel, abilityScore).map(s => s.level)
    : [];
  const accessibleSet = new Set(accessibleLevels);
  const alreadyKnownIds = new Set(
    char.knownSpells.filter(ks => ks.classId === selectedClassId).map(ks => ks.spellId),
  );
  const learnableSpells = isSpellbookCaster
    ? mergedSpells.filter(s =>
        selectedClassId in s.levels &&
        accessibleSet.has(s.levels[selectedClassId]) &&
        !alreadyKnownIds.has(s.id),
      )
    : [];
  const SPELLS_PER_LEVELUP = 2;
  const maxToLearn = Math.min(SPELLS_PER_LEVELUP, learnableSpells.length);

  const filteredLearnableSpells = learnableSpells
    .filter(s => {
      if (spellFilterLevel !== 'all' && s.levels[selectedClassId] !== spellFilterLevel) return false;
      const q = spellSearch.toLowerCase();
      return !q || s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const steps = [
    'class', 'hp', 'skills',
    needsFeat ? 'feat' : null,
    needsAbility ? 'ability' : null,
    isSpellbookCaster ? 'spells' : null,
    'confirm',
  ].filter(Boolean) as string[];
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
    if (step === 'spells') return newSpellIds.length === maxToLearn;
    return true;
  };

  const commit = () => {
    if (!selectedCls) return;
    const hpValue = useMax ? maxHpRoll : (hpRoll ?? 1);
    const finalRanks: Record<string, number> = {};
    Object.entries(skillRanksDelta).forEach(([skillId, delta]) => {
      finalRanks[skillId] = (existingSkillRanks[skillId] ?? 0) + delta;
    });
    const spellsToAdd: KnownSpell[] = newSpellIds.map(spellId => ({
      spellId,
      classId: selectedClassId,
      spellLevel: mergedSpells.find(s => s.id === spellId)?.levels[selectedClassId] ?? 0,
    }));
    levelUp(
      char.id,
      selectedClassId,
      hpValue,
      finalRanks,
      selectedFeat || undefined,
      abilityIncrease ?? undefined,
      spellsToAdd.length > 0 ? spellsToAdd : undefined,
    );
    onClose();
  };

  const toggleNewSpell = (spellId: string) => {
    setNewSpellIds(prev => {
      if (prev.includes(spellId)) return prev.filter(id => id !== spellId);
      if (prev.length >= maxToLearn) return prev;
      return [...prev, spellId];
    });
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}
    >
      <div
        className="w-full max-w-lg rounded-xl shadow-2xl flex flex-col"
        style={{ background: 'var(--theme-bg-panel-2)', border: '2px solid var(--theme-accent)', maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="pf-header px-6 py-4 rounded-t-xl flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--theme-text)' }}>
              ⬆ Level Up → {nextLevel}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--theme-accent)' }}>
              Passo {stepIdx + 1} di {steps.length}
            </p>
          </div>
          <button onClick={onClose} className="text-2xl" style={{ color: 'var(--theme-accent)' }}>✕</button>
        </div>

        {/* Progress */}
        <div className="px-6 pt-3 pb-1">
          <div className="flex gap-1">
            {steps.map((s, i) => (
              <div
                key={s}
                className="flex-1 h-1 rounded-full"
                style={{ background: i <= stepIdx ? 'var(--theme-accent)' : 'var(--line-mid)' }}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

          {/* STEP: CLASS */}
          {step === 'class' && (
            <div>
              <h3 className="font-bold mb-3" style={{ fontSize: 17, color: 'var(--theme-accent)' }}>
                Scegli la classe da aumentare
              </h3>
              <div className="space-y-2">
                {char.classes.map(e => {
                  const cls = getClass(e.classId);
                  return (
                    <button
                      key={e.classId}
                      onClick={() => setSelectedClassId(e.classId)}
                      className="w-full pf-panel p-3 text-left"
                      style={{ borderColor: selectedClassId === e.classId ? 'var(--theme-accent)' : 'var(--theme-border)' }}
                    >
                      <span className="font-semibold" style={{ color: 'var(--theme-accent)' }}>{cls?.name}</span>
                      <span className="ml-2 text-sm" style={{ color: 'var(--theme-text-neutral)' }}>LV {e.level} → {e.level + 1}</span>
                      <span className="ml-2 text-xs" style={{ color: 'var(--theme-border)' }}>(multiclasse)</span>
                    </button>
                  );
                })}
                <div className="mt-2">
                  <p className="text-xs mb-2" style={{ color: 'var(--theme-border-strong)' }}>Oppure aggiungi una nuova classe (multiclasse):</p>
                  <div className="grid grid-cols-2 gap-2">
                    {CLASSES.filter(c => !char.classes.find(e => e.classId === c.id)).map(c => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedClassId(c.id)}
                        className="pf-panel p-2 text-left text-sm"
                        style={{ borderColor: selectedClassId === c.id ? 'var(--theme-accent)' : 'var(--theme-ghost-border)' }}
                      >
                        <span style={{ color: 'var(--theme-text-muted)' }}>{c.name}</span>
                        <span className="ml-1 text-xs" style={{ color: 'var(--theme-border)' }}>d{c.hitDie}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {newFeatures.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--theme-border-strong)' }}>
                    Nuove capacità:
                  </p>
                  {newFeatures.map(f => (
                    <div key={f.name} className="text-xs pf-panel p-2 mb-1">
                      <span className="font-semibold" style={{ color: 'var(--theme-accent)' }}>{f.name}: </span>
                      <span style={{ color: 'var(--theme-text-muted)' }}>{f.description}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP: HP */}
          {step === 'hp' && selectedCls && (
            <div>
              <h3 className="font-bold mb-3" style={{ fontSize: 17, color: 'var(--theme-accent)' }}>
                Tira i Punti Ferita (d{maxHpRoll})
              </h3>
              <div className="flex gap-3 mb-4">
                <button
                  onClick={() => { setUseMax(false); setHpRoll(null); }}
                  className="pf-btn flex-1"
                  style={{ background: !useMax ? 'var(--theme-bg-panel)' : 'var(--theme-bg)', border: `1px solid ${!useMax ? 'var(--theme-accent)' : 'var(--theme-ghost-border)'}`, color: !useMax ? 'var(--theme-accent)' : 'var(--theme-text-neutral)' }}
                >Tiro Dado</button>
                <button
                  onClick={() => { setUseMax(true); setHpRoll(maxHpRoll); }}
                  className="pf-btn flex-1"
                  style={{ background: useMax ? 'var(--theme-bg-panel)' : 'var(--theme-bg)', border: `1px solid ${useMax ? 'var(--theme-accent)' : 'var(--theme-ghost-border)'}`, color: useMax ? 'var(--theme-accent)' : 'var(--theme-text-neutral)' }}
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
                  <span className="text-3xl font-bold" style={{ color: hpRoll ? 'var(--theme-accent)' : 'var(--theme-text-faint)' }}>
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
                <p className="text-sm" style={{ color: 'var(--theme-hp-high)' }}>✓ Massimo: +{maxHpRoll} PF</p>
              )}
              <p className="text-xs mt-3" style={{ color: 'var(--theme-text-faint)' }}>
                Il modificatore di Costituzione ({abilityMod(scores.con) >= 0 ? '+' : ''}{abilityMod(scores.con)}) viene aggiunto automaticamente.
              </p>
            </div>
          )}

          {/* STEP: SKILLS */}
          {step === 'skills' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold" style={{ fontSize: 17, color: 'var(--theme-accent)' }}>Gradi di Abilità</h3>
                <span
                  className="text-xl font-bold"
                  style={{ color: deltaLeft === 0 ? 'var(--theme-hp-high)' : deltaLeft < 0 ? 'var(--theme-hp-low)' : 'var(--theme-accent)' }}
                >
                  {deltaLeft} rimasti
                </span>
              </div>
              <p className="text-xs mb-3" style={{ color: 'var(--theme-text-faint)' }}>
                {skillPointsThisLevel} punti ({selectedCls?.skillsPerLevel ?? 2} classe + INT {abilityMod(scores.int) >= 0 ? '+' : ''}{abilityMod(scores.int)})
                {bonusFromRace > 0 ? ` +${bonusFromRace} razza` : ''}
              </p>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {[...SKILLS].sort((a, b) => a.name.localeCompare(b.name)).map(sk => {
                  const currentRank = existingSkillRanks[sk.id] ?? 0;
                  const delta = skillRanksDelta[sk.id] ?? 0;
                  const finalRank = currentRank + delta;
                  const isClass = classSkillSet.has(sk.id);
                  return (
                    <div key={sk.id} className="flex items-center gap-2 px-2 py-1 rounded"
                      style={{ background: delta > 0 ? 'rgba(200,164,67,0.06)' : 'transparent' }}
                    >
                      <span className="w-4 text-xs" style={{ color: 'var(--theme-hp-high)' }}>{isClass ? '✓' : ''}</span>
                      <span className="flex-1 text-sm" style={{ color: delta > 0 ? 'var(--theme-text)' : 'var(--theme-text-neutral)' }}>
                        {sk.name}
                      </span>
                      <span className="text-xs w-12 text-right" style={{ color: 'var(--theme-text-faint)' }}>
                        gradi: {finalRank}/{nextLevel}
                      </span>
                      <div className="flex gap-1">
                        <button
                          className="w-6 h-6 rounded flex items-center justify-center text-sm"
                          style={{ background: 'var(--theme-bg)', border: '1px solid var(--theme-ghost-border)', color: 'var(--theme-accent)' }}
                          onClick={() => {
                            if (delta > 0) setSkillRanksDelta(d => ({ ...d, [sk.id]: delta - 1 }));
                          }}
                          disabled={delta === 0}
                        >−</button>
                        <button
                          className="w-6 h-6 rounded flex items-center justify-center text-sm"
                          style={{ background: 'var(--theme-bg)', border: '1px solid var(--theme-ghost-border)', color: 'var(--theme-accent)' }}
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
              <h3 className="font-bold mb-3" style={{ fontSize: 17, color: 'var(--theme-accent)' }}>
                Scegli un Talento (livello {nextLevel})
              </h3>
              <input
                className="pf-input mb-3"
                placeholder="Cerca talento..."
                value={featSearch}
                onChange={e => setFeatSearch(e.target.value)}
              />
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {FEATS.filter(f =>
                  f.name.toLowerCase().includes(featSearch.toLowerCase()) &&
                  (!char.feats.includes(f.id) || f.repeatable)
                ).sort((a, b) => a.name.localeCompare(b.name)).map(f => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFeat(f.id)}
                    className="w-full text-left pf-panel p-3 transition-all"
                    style={{ borderColor: selectedFeat === f.id ? 'var(--theme-accent)' : 'var(--theme-border)' }}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold" style={{ fontSize: 15, color: selectedFeat === f.id ? 'var(--theme-accent)' : 'var(--theme-text)' }}>
                        {f.name}
                      </span>
                      {f.repeatable && (
                        <span className="px-1 rounded" style={{ fontSize: 11, background: 'var(--theme-bg)', color: 'var(--theme-text-faint)' }}>
                          ripetibile
                        </span>
                      )}
                    </div>
                    {f.prerequisites && (
                      <div style={{ fontSize: 13, color: 'var(--theme-border-strong)' }}>Prerequisiti: {f.prerequisites}</div>
                    )}
                    <div style={{ fontSize: 13, marginTop: 2, color: 'var(--theme-text-muted)' }}>{f.benefit}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP: ABILITY */}
          {step === 'ability' && needsAbility && (
            <div>
              <h3 className="font-bold mb-3" style={{ fontSize: 17, color: 'var(--theme-accent)' }}>
                Aumento Caratteristica (livello {nextLevel})
              </h3>
              <p className="text-sm mb-4" style={{ color: 'var(--theme-text-muted)' }}>
                Ai livelli 4, 8, 12, 16, 20 puoi aumentare una caratteristica di +1.
              </p>
              <div className="grid grid-cols-3 gap-3">
                {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as AbilityKey[]).map(key => (
                  <button
                    key={key}
                    onClick={() => setAbilityIncrease(key)}
                    className="stat-box py-3 transition-all cursor-pointer"
                    style={{ borderColor: abilityIncrease === key ? 'var(--theme-accent)' : 'var(--theme-ghost-border)' }}
                  >
                    <div className="text-xs font-bold uppercase" style={{ color: 'var(--theme-border-strong)' }}>
                      {ABILITY_LABELS[key]}
                    </div>
                    <div className="text-xl font-bold" style={{ color: 'var(--theme-text)' }}>{scores[key]}</div>
                    {abilityIncrease === key && (
                      <div className="text-xs" style={{ color: 'var(--theme-hp-high)' }}>→ {scores[key] + 1}</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP: SPELLS (spellbook casters only) */}
          {step === 'spells' && isSpellbookCaster && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold" style={{ fontSize: 17, color: 'var(--theme-accent)' }}>
                  Nuovi Incantesimi nel Libro
                </h3>
                <span
                  className="text-sm font-bold"
                  style={{ color: newSpellIds.length === maxToLearn ? 'var(--theme-hp-high)' : 'var(--theme-accent)' }}
                >
                  {newSpellIds.length} / {maxToLearn}
                </span>
              </div>
              <p className="text-xs mb-3" style={{ color: 'var(--theme-text-faint)' }}>
                Scegli {maxToLearn} incantesimo{maxToLearn !== 1 ? 'i' : ''} da aggiungere al libro di magie.
                Puoi prepararli dalla scheda personaggio.
              </p>

              {/* Level filter */}
              <div className="flex gap-1 flex-wrap mb-2">
                <button
                  onClick={() => setSpellFilterLevel('all')}
                  className="px-3 py-1 rounded text-xs font-semibold"
                  style={{ background: spellFilterLevel === 'all' ? 'var(--theme-accent)' : 'var(--theme-bg-panel)', color: spellFilterLevel === 'all' ? 'var(--theme-bg)' : 'var(--theme-text)', border: '1px solid var(--theme-border)' }}
                >
                  Tutti
                </button>
                {accessibleLevels.map(lv => (
                  <button
                    key={lv}
                    onClick={() => setSpellFilterLevel(lv)}
                    className="px-3 py-1 rounded text-xs font-semibold"
                    style={{ background: spellFilterLevel === lv ? 'var(--theme-accent)' : 'var(--theme-bg-panel)', color: spellFilterLevel === lv ? 'var(--theme-bg)' : 'var(--theme-text)', border: '1px solid var(--theme-border)' }}
                  >
                    {lv === 0 ? 'Trucch.' : `${lv}°`}
                  </button>
                ))}
              </div>

              <input
                className="pf-input mb-2"
                placeholder="Cerca incantesimo..."
                value={spellSearch}
                onChange={e => setSpellSearch(e.target.value)}
              />

              {learnableSpells.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: 'var(--theme-text-faint)' }}>
                  Hai già imparato tutti gli incantesimi accessibili.
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {filteredLearnableSpells.map(spell => {
                    const spellLevel = spell.levels[selectedClassId] ?? 0;
                    const isSelected = newSpellIds.includes(spell.id);
                    const isDisabled = !isSelected && newSpellIds.length >= maxToLearn;
                    return (
                      <button
                        key={spell.id}
                        onClick={() => toggleNewSpell(spell.id)}
                        disabled={isDisabled}
                        className="w-full text-left pf-panel p-3 transition-all"
                        style={{
                          borderColor: isSelected ? 'var(--theme-accent)' : 'var(--theme-border)',
                          opacity: isDisabled ? 0.4 : 1,
                          boxShadow: isSelected ? '0 0 6px rgba(200,164,67,0.2)' : 'none',
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="text-xs px-1 rounded font-bold shrink-0"
                            style={{ background: (SCHOOL_COLORS[spell.school] ?? '#9ca3af') + '33', color: SCHOOL_COLORS[spell.school] ?? '#9ca3af' }}
                          >
                            {spellLevel === 0 ? 'Trucch.' : `${spellLevel}°`}
                          </span>
                          <span className="font-semibold" style={{ fontSize: 15, color: isSelected ? 'var(--theme-accent)' : 'var(--theme-text)' }}>
                            {spell.name}
                          </span>
                          {isSelected && <span className="ml-auto" style={{ fontSize: 12, color: 'var(--theme-hp-high)' }}>✓ selezionato</span>}
                        </div>
                        <div style={{ fontSize: 13, marginTop: 2, color: 'var(--theme-text-neutral)' }}>{spell.description}</div>
                      </button>
                    );
                  })}
                  {filteredLearnableSpells.length === 0 && learnableSpells.length > 0 && (
                    <p className="text-sm text-center py-2" style={{ color: 'var(--theme-text-faint)' }}>Nessun risultato.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP: CONFIRM */}
          {step === 'confirm' && (
            <div className="space-y-3">
              <h3 className="font-bold" style={{ fontSize: 17, color: 'var(--theme-accent)' }}>Conferma Level Up</h3>
              <div className="pf-panel p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--theme-text-muted)' }}>Classe:</span>
                  <span style={{ color: 'var(--theme-accent)' }}>{getClass(selectedClassId)?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--theme-text-muted)' }}>Livello totale:</span>
                  <span style={{ color: 'var(--theme-accent)' }}>{char.totalLevel} → {nextLevel}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--theme-text-muted)' }}>PF guadagnati:</span>
                  <span style={{ color: 'var(--theme-hp-high)' }}>
                    +{(useMax ? maxHpRoll : hpRoll) ?? 0} (+{abilityMod(scores.con)} COS)
                    = +{((useMax ? maxHpRoll : hpRoll) ?? 0) + abilityMod(scores.con)}
                  </span>
                </div>
                {selectedFeat && (
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--theme-text-muted)' }}>Talento:</span>
                    <span style={{ color: '#9b7fd4' }}>{FEATS.find(f => f.id === selectedFeat)?.name}</span>
                  </div>
                )}
                {abilityIncrease && (
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--theme-text-muted)' }}>Caratteristica:</span>
                    <span style={{ color: 'var(--theme-accent)' }}>
                      {ABILITY_LABELS[abilityIncrease]} {scores[abilityIncrease]} → {scores[abilityIncrease] + 1}
                    </span>
                  </div>
                )}
                {newSpellIds.length > 0 && (
                  <div>
                    <span style={{ color: 'var(--theme-text-muted)' }}>Nuovi incantesimi:</span>
                    {newSpellIds.map(id => {
                      const spell = mergedSpells.find(s => s.id === id);
                      return (
                        <div key={id} className="ml-2 text-xs" style={{ color: '#9b7fd4' }}>
                          + {spell?.name ?? id}
                        </div>
                      );
                    })}
                  </div>
                )}
                {Object.entries(skillRanksDelta).filter(([, v]) => v > 0).map(([id, v]) => {
                  const sk = SKILLS.find(s => s.id === id);
                  return (
                    <div key={id} className="flex justify-between">
                      <span style={{ color: 'var(--theme-text-muted)' }}>+{v} {sk?.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex justify-between gap-3" style={{ borderTop: '1px solid var(--theme-ghost-border)' }}>
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
