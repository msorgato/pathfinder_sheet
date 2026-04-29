import { useState } from 'react';
import { getClass } from '../../data/classes';
import { useMergedSpells } from '../../store/dataStore';
import { computeSpellSlots } from '../../utils/calculations';
import { effectiveAbilityScores } from '../../utils/calculations';
import type { Character, PreparedSpell } from '../../types';
import { useCharacterStore } from '../../store/characterStore';

const SCHOOL_COLORS: Record<string, string> = {
  Evocation: 'var(--theme-hp-low)', Conjuration: '#3b82f6', Abjuration: '#6366f1',
  Divination: '#a855f7', Enchantment: '#ec4899', Illusion: '#14b8a6',
  Necromancy: '#22c55e', Transmutation: '#f59e0b', Universal: 'var(--theme-text-neutral)',
};

interface Props { char: Character }

export function SpellsPanel({ char }: Props) {
  const { addKnownSpell, removeKnownSpell, prepareSpell, unprepareSpell, useSpellSlot, recoverAllSpellSlots } = useCharacterStore();
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  const [activeLevel, setActiveLevel] = useState(0);
  const [tab, setTab] = useState<'slots' | 'known' | 'browse'>('slots');
  const [listSearch, setListSearch] = useState('');
  const [listLevel, setListLevel] = useState<number | 'all'>('all');
  const mergedSpells = useMergedSpells();
  const getSpell = (id: string) => mergedSpells.find(s => s.id === id);
  const getSpellsForClass = (classId: string) => mergedSpells.filter(s => classId in s.levels);

  const scores = effectiveAbilityScores(char);

  const casterClasses = char.classes.filter(e => !!getClass(e.classId)?.spellcasting);
  if (casterClasses.length === 0) {
    return (
      <div className="pf-panel p-8 text-center">
        <div className="text-4xl mb-3">⚔️</div>
        <p style={{ color: 'var(--theme-text-muted)' }}>Nessuna classe incantatore.</p>
      </div>
    );
  }

  const currentClassId = activeClassId ?? casterClasses[0].classId;
  const currentClassEntry = char.classes.find(e => e.classId === currentClassId)!;
  const currentCls = getClass(currentClassId)!;
  const spellcasting = currentCls.spellcasting!;
  const abilityScore = scores[spellcasting.ability];
  const slots = computeSpellSlots(currentClassId, currentClassEntry.level, abilityScore);
  const isSpontaneous = spellcasting.type === 'spontaneous';

  const preparedForClass = char.preparedSpells.filter(ps => ps.classId === currentClassId);
  const usedAtLevel = (lv: number) => preparedForClass.filter(ps => ps.spellLevel === lv && ps.used).length;
  const totalSlotsAtLevel = (lv: number) => slots.find(s => s.level === lv)?.total ?? 0;

  const knownForClass = char.knownSpells.filter(ks => ks.classId === currentClassId);

  const ABIL_LABEL: Record<string, string> = { int: 'INT', wis: 'SAG', cha: 'CAR' };

  return (
    <div className="space-y-4">
      {/* Class selector */}
      {casterClasses.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {casterClasses.map(e => (
            <button
              key={e.classId}
              onClick={() => setActiveClassId(e.classId)}
              className="pf-btn text-sm px-4 py-1"
              style={{
                background: currentClassId === e.classId ? 'var(--theme-border)' : 'var(--theme-bg-panel)',
                color: currentClassId === e.classId ? 'var(--theme-accent)' : 'var(--theme-text-neutral)',
                border: `1px solid ${currentClassId === e.classId ? 'var(--theme-accent)' : 'var(--theme-ghost-border)'}`,
              }}
            >
              {getClass(e.classId)?.name} (LV {e.level})
            </button>
          ))}
        </div>
      )}

      {/* Info bar */}
      <div className="pf-panel p-3 flex flex-wrap gap-4 text-sm" style={{ color: 'var(--theme-text-muted)' }}>
        <span>✨ {currentCls.name} LV {currentClassEntry.level}</span>
        <span>{isSpontaneous ? 'Spontaneo' : 'Preparato'}</span>
        <span>Car: <strong style={{ color: 'var(--theme-accent)' }}>{ABIL_LABEL[spellcasting.ability]}</strong> {abilityScore}</span>
        <span>Max: {spellcasting.maxSpellLevel}° livello</span>
        <button
          className="pf-btn pf-btn-outline text-xs px-3 py-0.5 ml-auto"
          onClick={() => recoverAllSpellSlots(char.id)}
        >
          ♻ Recupera slot
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: 'var(--theme-ghost-border)' }}>
        {[
          { id: 'slots', label: 'Slot & Preparati' },
          { id: 'known', label: isSpontaneous ? 'Conosciuti' : 'Lista' },
          { id: 'browse', label: 'Sfoglia' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className="px-4 py-2 text-sm font-semibold border-b-2 transition-all"
            style={{
              borderColor: tab === t.id ? 'var(--theme-accent)' : 'transparent',
              color: tab === t.id ? 'var(--theme-accent)' : 'var(--theme-text-neutral)',
              background: 'transparent',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* SLOTS TAB */}
      {tab === 'slots' && (
        <div className="space-y-3">
          {slots.map(s => {
            const used = usedAtLevel(s.level);
            const total = s.total;
            return (
              <div key={s.level} className="pf-panel p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm" style={{ color: 'var(--theme-accent)' }}>
                    {s.level === 0 ? 'Trucchetti (0°)' : `${s.level}° Livello`}
                  </span>
                  <div className="flex items-center gap-2 text-sm">
                    <span style={{ color: 'var(--theme-text-muted)' }}>{total - used} / {total}</span>
                    {s.bonus > 0 && (
                      <span className="text-xs" style={{ color: '#9b7fd4' }}>+{s.bonus} bonus</span>
                    )}
                  </div>
                </div>
                {/* Slot pips */}
                <div className="flex gap-1 flex-wrap">
                  {Array.from({ length: total }).map((_, i) => {
                    const isUsed = i < used;
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          if (!isUsed) useSpellSlot(char.id, currentClassId, s.level);
                          else {
                            // Un-use: mark first used prepared as unused
                            const ps = preparedForClass.find(p => p.spellLevel === s.level && p.used);
                            if (ps) unprepareSpell(char.id, ps.slot, currentClassId, s.level);
                          }
                        }}
                        className="w-6 h-6 rounded-full border-2 transition-all"
                        style={{
                          background: isUsed ? 'var(--theme-ghost-border)' : 'var(--theme-accent)',
                          borderColor: isUsed ? 'var(--theme-border)' : '#e0b84d',
                        }}
                      />
                    );
                  })}
                </div>
                {/* Prepared spells at this level */}
                {preparedForClass.filter(ps => ps.spellLevel === s.level).map(ps => {
                  const spell = getSpell(ps.spellId);
                  return (
                    <div
                      key={`${ps.slot}-${ps.spellId}`}
                      className="mt-1 flex items-center gap-2 text-xs rounded px-2 py-1"
                      style={{ background: ps.used ? 'var(--theme-bg)' : 'rgba(200,164,67,0.08)', opacity: ps.used ? 0.5 : 1 }}
                    >
                      <span style={{ color: ps.used ? 'var(--theme-text-faint)' : 'var(--theme-text)' }}>{spell?.name ?? ps.spellId}</span>
                      {ps.used && <span style={{ color: 'var(--theme-text-faint)' }}>(usato)</span>}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* KNOWN / LIST TAB */}
      {tab === 'known' && (
        <div className="space-y-2">
          {/* Search + level filter for prepared casters */}
          {!isSpontaneous && (() => {
            const accessibleLevels = slots.map(s => s.level);
            const accessibleSet = new Set(accessibleLevels);
            const lq = listSearch.toLowerCase();
            const listSpells = getSpellsForClass(currentClassId)
              .filter(s => accessibleSet.has(s.levels[currentClassId]))
              .filter(s => listLevel === 'all' || s.levels[currentClassId] === listLevel)
              .filter(s => !lq || s.name.toLowerCase().includes(lq) || s.description.toLowerCase().includes(lq));
            return (
              <>
                <input
                  className="pf-input w-full"
                  placeholder="Cerca incantesimo..."
                  value={listSearch}
                  onChange={e => setListSearch(e.target.value)}
                />
                <div className="flex gap-1 flex-wrap">
                  <button
                    onClick={() => setListLevel('all')}
                    className="px-3 py-1 rounded text-xs font-semibold"
                    style={{ background: listLevel === 'all' ? 'var(--theme-accent)' : 'var(--theme-bg-panel)', color: listLevel === 'all' ? 'var(--theme-bg)' : 'var(--theme-text)', border: '1px solid var(--theme-border)' }}
                  >
                    Tutti
                  </button>
                  {accessibleLevels.map(lv => (
                    <button
                      key={lv}
                      onClick={() => setListLevel(lv)}
                      className="px-3 py-1 rounded text-xs font-semibold"
                      style={{ background: listLevel === lv ? 'var(--theme-accent)' : 'var(--theme-bg-panel)', color: listLevel === lv ? 'var(--theme-bg)' : 'var(--theme-text)', border: '1px solid var(--theme-border)' }}
                    >
                      {lv}°
                    </button>
                  ))}
                  <span className="ml-auto text-xs self-center" style={{ color: 'var(--theme-text-faint)' }}>
                    {listSpells.length} incantesim{listSpells.length === 1 ? 'o' : 'i'}
                  </span>
                </div>
                {listSpells.map(spell => (
                  <div key={spell.id} className="pf-panel p-3 flex items-start gap-2">
                    <span
                      className="text-xs px-1 rounded font-bold shrink-0"
                      style={{ background: (SCHOOL_COLORS[spell.school] ?? '#9ca3af') + '33', color: SCHOOL_COLORS[spell.school] ?? '#9ca3af' }}
                    >
                      {spell.levels[currentClassId]}°
                    </span>
                    <div>
                      <div className="font-semibold text-sm" style={{ color: 'var(--theme-accent)' }}>{spell.name}</div>
                      <div className="text-xs" style={{ color: 'var(--theme-text-neutral)' }}>{spell.castingTime} · {spell.range}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>{spell.description}</div>
                    </div>
                    <button
                      className="ml-auto text-xs pf-btn pf-btn-ghost px-2 py-0.5 shrink-0"
                      onClick={() => prepareSpell(char.id, { spellId: spell.id, classId: currentClassId, spellLevel: spell.levels[currentClassId], slot: Date.now(), used: false })}
                    >
                      Prepara
                    </button>
                  </div>
                ))}
                {listSpells.length === 0 && (
                  <p className="text-sm text-center py-4" style={{ color: 'var(--theme-text-faint)' }}>Nessun incantesimo trovato.</p>
                )}
              </>
            );
          })()}

          {/* Spontaneous: show known spells */}
          {isSpontaneous && knownForClass.length === 0 && (
            <p className="text-sm" style={{ color: 'var(--theme-text-faint)' }}>Nessun incantesimo conosciuto.</p>
          )}
          {isSpontaneous && knownForClass.map(ks => {
            const spell = getSpell(ks.spellId);
            if (!spell) return null;
            return (
              <div key={ks.spellId} className="pf-panel p-3 flex items-start gap-2">
                <span
                  className="text-xs px-1 rounded font-bold shrink-0"
                  style={{ background: (SCHOOL_COLORS[spell.school] ?? '#9ca3af') + '33', color: SCHOOL_COLORS[spell.school] ?? '#9ca3af' }}
                >
                  {ks.spellLevel}°
                </span>
                <div>
                  <div className="font-semibold text-sm" style={{ color: 'var(--theme-accent)' }}>{spell.name}</div>
                  <div className="text-xs" style={{ color: 'var(--theme-text-neutral)' }}>{spell.castingTime} · {spell.range}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>{spell.description}</div>
                </div>
                <button
                  className="ml-auto text-xs pf-btn pf-btn-ghost px-2 py-0.5 shrink-0"
                  onClick={() => removeKnownSpell(char.id, ks.spellId, currentClassId)}
                >✕</button>
              </div>
            );
          })}
        </div>
      )}

      {/* BROWSE TAB */}
      {tab === 'browse' && (
        <BrowseSpells
          classId={currentClassId}
          char={char}
          slots={slots}
          isSpontaneous={isSpontaneous}
          knownForClass={knownForClass}
          onAddKnown={spellId => addKnownSpell(char.id, { spellId, classId: currentClassId, spellLevel: getSpell(spellId)?.levels[currentClassId] ?? 0 })}
          onPrepare={(spellId, lv) => {
            const used = usedAtLevel(lv);
            const total = totalSlotsAtLevel(lv);
            if (used < total) {
              prepareSpell(char.id, {
                spellId,
                classId: currentClassId,
                spellLevel: lv,
                slot: Date.now(),
                used: false,
              });
            }
          }}
        />
      )}
    </div>
  );
}

function BrowseSpells({ classId, char, slots, isSpontaneous, knownForClass, onAddKnown, onPrepare }: {
  classId: string;
  char: Character;
  slots: { level: number; total: number }[];
  isSpontaneous: boolean;
  knownForClass: { spellId: string; spellLevel: number }[];
  onAddKnown: (spellId: string) => void;
  onPrepare: (spellId: string, level: number) => void;
}) {
  const [filterLevel, setFilterLevel] = useState<number | 'all'>('all');
  const [search, setSearch] = useState('');
  const mergedSpells = useMergedSpells();

  // Only show spells for this class, capped to accessible levels
  const accessibleLevels = slots.map(s => s.level);
  const accessibleSet = new Set(accessibleLevels);
  const classSpells = mergedSpells
    .filter(s => classId in s.levels && accessibleSet.has(s.levels[classId]));

  const q = search.toLowerCase();
  const filtered = classSpells.filter(s => {
    if (filterLevel !== 'all' && s.levels[classId] !== filterLevel) return false;
    if (q && !s.name.toLowerCase().includes(q) && !s.description.toLowerCase().includes(q)) return false;
    return true;
  });

  return (
    <div>
      {/* Search */}
      <input
        className="pf-input w-full mb-2"
        placeholder="Cerca incantesimo..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      {/* Level filter */}
      <div className="flex gap-1 flex-wrap mb-3">
        <button
          onClick={() => setFilterLevel('all')}
          className="px-3 py-1 rounded text-xs font-semibold"
          style={{ background: filterLevel === 'all' ? 'var(--theme-accent)' : 'var(--theme-bg-panel)', color: filterLevel === 'all' ? 'var(--theme-bg)' : 'var(--theme-text)', border: '1px solid var(--theme-border)' }}
        >
          Tutti
        </button>
        {accessibleLevels.map(lv => (
          <button
            key={lv}
            onClick={() => setFilterLevel(lv)}
            className="px-3 py-1 rounded text-xs font-semibold"
            style={{ background: filterLevel === lv ? 'var(--theme-accent)' : 'var(--theme-bg-panel)', color: filterLevel === lv ? 'var(--theme-bg)' : 'var(--theme-text)', border: '1px solid var(--theme-border)' }}
          >
            {lv}°
          </button>
        ))}
        <span className="ml-auto text-xs self-center" style={{ color: 'var(--theme-text-faint)' }}>
          {filtered.length} risultat{filtered.length === 1 ? 'o' : 'i'}
        </span>
      </div>
      <div className="space-y-2">
        {filtered.map(spell => {
          const spellLevel = spell.levels[classId] ?? 0;
          const isKnown = !!knownForClass.find(ks => ks.spellId === spell.id);
          return (
            <div key={spell.id} className="pf-panel p-3">
              <div className="flex items-start gap-2">
                <span
                  className="text-xs px-1 rounded font-bold shrink-0"
                  style={{ background: (SCHOOL_COLORS[spell.school] ?? '#9ca3af') + '33', color: SCHOOL_COLORS[spell.school] ?? '#9ca3af' }}
                >
                  {spellLevel}°
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm" style={{ color: 'var(--theme-accent)' }}>{spell.name}</div>
                  <div className="text-xs" style={{ color: 'var(--theme-text-neutral)' }}>
                    {spell.castingTime} · {spell.range} · {spell.savingThrow}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>{spell.description}</div>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  {isSpontaneous && !isKnown && (
                    <button
                      className="pf-btn text-xs px-2 py-0.5"
                      style={{ background: 'rgba(155,127,212,0.2)', color: '#9b7fd4', border: '1px solid #9b7fd4' }}
                      onClick={() => onAddKnown(spell.id)}
                    >
                      + Conosci
                    </button>
                  )}
                  {isSpontaneous && isKnown && (
                    <span className="text-xs" style={{ color: 'var(--theme-hp-high)' }}>✓</span>
                  )}
                  {!isSpontaneous && (
                    <button
                      className="pf-btn text-xs px-2 py-0.5"
                      style={{ background: 'rgba(200,164,67,0.15)', color: 'var(--theme-accent)', border: '1px solid var(--theme-border)' }}
                      onClick={() => onPrepare(spell.id, spellLevel)}
                    >
                      Prepara
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-sm text-center py-4" style={{ color: 'var(--theme-text-faint)' }}>
            Nessun incantesimo trovato.
          </p>
        )}
      </div>
    </div>
  );
}
