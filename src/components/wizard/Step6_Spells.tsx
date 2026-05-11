import { useEffect, useState } from 'react';
import { getClass } from '../../data/classes';
import { useMergedSpells } from '../../store/dataStore';
import { computeSpellSlots, spellsKnownAtLevel, abilityMod } from '../../utils/calculations';
import type { AbilityScores, KnownSpell } from '../../types';
import { WizardLayout } from './WizardLayout';

const SCHOOL_COLORS: Record<string, string> = {
  Evocation: 'var(--theme-hp-low)', Conjuration: '#3b82f6', Abjuration: '#6366f1',
  Divination: '#a855f7', Enchantment: '#ec4899', Illusion: '#14b8a6',
  Necromancy: '#22c55e', Transmutation: '#f59e0b', Universal: 'var(--theme-text-neutral)',
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
  const mergedSpells = useMergedSpells();
  const getSpellsForClassAndLevel = (cid: string, lv: number) => mergedSpells.filter(s => s.levels[cid] === lv);
  const getSpellsForClass = (cid: string) => mergedSpells.filter(s => cid in s.levels);

  const cls = getClass(classId);

  // For spellbook casters: auto-add all cantrips on mount
  useEffect(() => {
    if (!cls?.spellcasting?.usesSpellbook) return;
    const cantrips = getSpellsForClassAndLevel(classId, 0);
    const alreadyHasAny = knownSpells.some(ks => ks.classId === classId);
    if (!alreadyHasAny && cantrips.length > 0) {
      onChange([
        ...knownSpells,
        ...cantrips.map(s => ({ spellId: s.id, classId, spellLevel: 0 })),
      ]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  if (!cls?.spellcasting) {
    return (
      <WizardLayout
        step={6} totalSteps={7}
        title="Incantesimi"
        onBack={onBack} onNext={onNext}
      >
        <div className="pf-panel p-8 text-center">
          <div className="text-4xl mb-4">⚔️</div>
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--theme-accent)' }}>
            Classe non incantatore
          </h2>
          <p style={{ color: 'var(--theme-text-muted)' }}>
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
  const isSpellbook = !!spellcasting.usesSpellbook;

  const maxKnown = isSpontaneous ? (knownAtLevel[selectedLevel] ?? 0) : Infinity;
  const spellsAtLevel = getSpellsForClassAndLevel(classId, selectedLevel).sort((a, b) => a.name.localeCompare(b.name));
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

  const ABIL_LABEL: Record<string, string> = { int: 'INT', wis: 'SAG', cha: 'CAR' };

  // Spellbook initial selection: cantrips are auto-added, user picks 1st-level spells
  const intMod = abilityMod(abilityScores.int);
  const firstLevelSlots = 3 + intMod;
  const selected1stLevel = knownSpells.filter(ks => ks.classId === classId && ks.spellLevel === 1);
  const spells1stLevel = getSpellsForClassAndLevel(classId, 1).sort((a, b) => a.name.localeCompare(b.name));
  const canProceedSpellbook = selected1stLevel.length >= firstLevelSlots;

  const spellsCantrips = getSpellsForClassAndLevel(classId, 0).sort((a, b) => a.name.localeCompare(b.name));
  const selectedCantrips = knownSpells.filter(ks => ks.classId === classId && ks.spellLevel === 0);

  const toggle0th = (spellId: string) => {
    const exists = knownSpells.find(ks => ks.spellId === spellId && ks.classId === classId && ks.spellLevel === 0);
    if (exists) {
      onChange(knownSpells.filter(ks => !(ks.spellId === spellId && ks.classId === classId && ks.spellLevel === 0)));
    } else {
      onChange([...knownSpells, { spellId, classId, spellLevel: 0 }]);
    }
  };

  if (isSpellbook) {
    return (
      <WizardLayout
        step={6} totalSteps={7}
        title="Libro di Magie"
        onBack={onBack}
        onNext={onNext}
        nextDisabled={!canProceedSpellbook}
      >
        <div className="pf-panel p-3 mb-4 text-sm" style={{ color: 'var(--theme-text-muted)' }}>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span>📖 {cls.name} — Libro di Magie</span>
            <span>INT: <strong style={{ color: 'var(--theme-accent)' }}>{abilityScore}</strong></span>
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--theme-text-faint)' }}>
            I trucchetti sono tutti pre-selezionati (gratuiti per il Mago). Scegli <strong style={{ color: 'var(--theme-accent)' }}>{firstLevelSlots}</strong> incantesimi di 1° livello (3 + modificatore INT).
          </p>
        </div>

        {/* Slot table */}
        <div className="pf-panel p-3 mb-4">
          <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--theme-border-strong)' }}>Slot al 1° livello</div>
          <div className="flex flex-wrap gap-2">
            {slots.map(s => (
              <div key={s.level} className="stat-box px-3 py-1 text-xs">
                <div style={{ color: 'var(--theme-border-strong)' }}>{s.level === 0 ? 'Trucch.' : `${s.level}°`}</div>
                <div className="font-bold" style={{ color: 'var(--theme-accent)' }}>
                  {s.base}{s.bonus > 0 ? <span style={{ color: '#9b7fd4' }}>+{s.bonus}</span> : ''}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cantrip selector */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold" style={{ color: 'var(--theme-accent)' }}>
            Trucchetti
          </span>
          <span className="text-xs" style={{ color: 'var(--theme-text-faint)' }}>
            {selectedCantrips.length} selezionat{selectedCantrips.length === 1 ? 'o' : 'i'} — nessun limite
          </span>
        </div>
        <div className="space-y-2 mb-4">
          {spellsCantrips.map(spell => {
            const isKnown = !!knownSpells.find(ks => ks.spellId === spell.id && ks.classId === classId && ks.spellLevel === 0);
            return (
              <button
                key={spell.id}
                onClick={() => toggle0th(spell.id)}
                className="w-full text-left pf-panel p-3 transition-all"
                style={{
                  borderColor: isKnown ? 'var(--theme-accent)' : 'var(--theme-border)',
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
                  <span className="font-semibold text-sm" style={{ color: isKnown ? 'var(--theme-accent)' : 'var(--theme-text)' }}>
                    {spell.name}
                  </span>
                  {isKnown && <span className="ml-auto text-xs" style={{ color: 'var(--theme-hp-high)' }}>✓ nel libro</span>}
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--theme-text-neutral)' }}>{spell.description}</div>
              </button>
            );
          })}
          {spellsCantrips.length === 0 && (
            <p className="text-center py-2 text-sm" style={{ color: 'var(--theme-text-faint)' }}>Nessun trucchetto disponibile.</p>
          )}
        </div>

        {/* 1st-level spell picker */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold" style={{ color: 'var(--theme-accent)' }}>
            Incantesimi di 1° livello
          </span>
          <span
            className="text-sm font-bold"
            style={{ color: selected1stLevel.length >= firstLevelSlots ? 'var(--theme-hp-high)' : 'var(--theme-accent)' }}
          >
            {selected1stLevel.length} / {firstLevelSlots}
          </span>
        </div>
        <div className="space-y-2">
          {spells1stLevel.map(spell => {
            const isKnown = !!knownSpells.find(ks => ks.spellId === spell.id && ks.classId === classId && ks.spellLevel === 1);
            const atMax = !isKnown && selected1stLevel.length >= firstLevelSlots;
            const toggle1st = () => {
              if (isKnown) {
                onChange(knownSpells.filter(ks => !(ks.spellId === spell.id && ks.classId === classId && ks.spellLevel === 1)));
              } else {
                if (atMax) return;
                onChange([...knownSpells, { spellId: spell.id, classId, spellLevel: 1 }]);
              }
            };
            return (
              <button
                key={spell.id}
                onClick={toggle1st}
                disabled={atMax}
                className="w-full text-left pf-panel p-3 transition-all"
                style={{
                  borderColor: isKnown ? 'var(--theme-accent)' : 'var(--theme-border)',
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
                  <span className="font-semibold text-sm" style={{ color: isKnown ? 'var(--theme-accent)' : 'var(--theme-text)' }}>
                    {spell.name}
                  </span>
                  {isKnown && <span className="ml-auto text-xs" style={{ color: 'var(--theme-hp-high)' }}>✓ nel libro</span>}
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--theme-text-neutral)' }}>{spell.description}</div>
              </button>
            );
          })}
          {spells1stLevel.length === 0 && (
            <p className="text-center py-4 text-sm" style={{ color: 'var(--theme-text-faint)' }}>
              Nessun incantesimo di 1° livello disponibile.
            </p>
          )}
        </div>
      </WizardLayout>
    );
  }

  // ── Spontaneous casters ────────────────────────────────────────────────────
  // ── Prepared non-spellbook casters (Cleric, Druid, Paladin, Ranger) ────────

  return (
    <WizardLayout
      step={6} totalSteps={7}
      title={isSpontaneous ? 'Scegli gli Incantesimi Conosciuti' : 'Lista Incantesimi'}
      onBack={onBack} onNext={onNext}
    >
      <div className="pf-panel p-3 mb-4 text-sm" style={{ color: 'var(--theme-text-muted)' }}>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span>✨ {cls.name}</span>
          <span>Caratteristica: <strong style={{ color: 'var(--theme-accent)' }}>{ABIL_LABEL[spellcasting.ability]}</strong> ({abilityScore})</span>
          <span>Tipo: <strong style={{ color: 'var(--theme-accent)' }}>{isSpontaneous ? 'Spontaneo' : 'Preparato'}</strong></span>
          {!isSpontaneous && (
            <span style={{ color: 'var(--theme-text-neutral)' }}>I chierici/druidi preparano dalla lista ogni giorno. Qui gestisci la scheda.</span>
          )}
        </div>
      </div>

      {/* Slot table */}
      <div className="pf-panel p-3 mb-4">
        <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--theme-border-strong)' }}>
          Slot al 1° livello
        </div>
        <div className="flex flex-wrap gap-2">
          {slots.map(s => (
            <div key={s.level} className="stat-box px-3 py-1 text-xs">
              <div style={{ color: 'var(--theme-border-strong)' }}>{s.level === 0 ? 'Trucch.' : `${s.level}°`}</div>
              <div className="font-bold" style={{ color: 'var(--theme-accent)' }}>
                {s.base}{s.bonus > 0 ? <span style={{ color: '#9b7fd4' }}>+{s.bonus}</span> : ''}
              </div>
            </div>
          ))}
        </div>
      </div>

      {isSpontaneous && (
        <>
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
                    background: selectedLevel === lv ? 'var(--theme-accent)' : 'var(--theme-bg-panel)',
                    color: selectedLevel === lv ? 'var(--theme-bg)' : 'var(--theme-text)',
                    border: `1px solid ${known === max ? 'var(--theme-hp-high)' : 'var(--theme-border)'}`,
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
              <div className="text-center py-4" style={{ color: 'var(--theme-text-faint)' }}>
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
                    borderColor: isKnown ? 'var(--theme-accent)' : 'var(--theme-border)',
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
                    <span className="font-semibold text-sm" style={{ color: isKnown ? 'var(--theme-accent)' : 'var(--theme-text)' }}>
                      {spell.name}
                    </span>
                    {isKnown && <span className="ml-auto text-xs" style={{ color: 'var(--theme-hp-high)' }}>✓ conosciuto</span>}
                  </div>
                  <div className="text-xs mt-1" style={{ color: 'var(--theme-text-neutral)' }}>{spell.description}</div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {!isSpontaneous && (
        <div className="space-y-2">
          <p className="text-sm mb-3" style={{ color: 'var(--theme-text-muted)' }}>
            Tutti gli incantesimi disponibili per la tua classe. Potrai selezionare quali preparare ogni giorno dalla scheda personaggio.
          </p>
          {getSpellsForClass(classId).sort((a, b) => a.name.localeCompare(b.name)).slice(0, 20).map(spell => (
            <div key={spell.id} className="pf-panel p-3">
              <div className="flex items-center gap-2">
                <span
                  className="text-xs px-1 rounded font-bold"
                  style={{ background: SCHOOL_COLORS[spell.school] + '33', color: SCHOOL_COLORS[spell.school] }}
                >
                  {spell.school.slice(0, 3).toUpperCase()}
                </span>
                <span className="font-semibold text-sm" style={{ color: 'var(--theme-text)' }}>{spell.name}</span>
                <span className="text-xs" style={{ color: 'var(--theme-border-strong)' }}>
                  {spell.levels[classId]}° livello
                </span>
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--theme-text-neutral)' }}>{spell.description}</div>
            </div>
          ))}
        </div>
      )}
    </WizardLayout>
  );
}
