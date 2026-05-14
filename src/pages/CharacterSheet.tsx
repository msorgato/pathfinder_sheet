import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCharacterStore } from '../store/characterStore';
import { UserPreferencesPanel } from '../components/ui/UserPreferencesPanel';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { FrameCorners } from '../components/ui/FrameCorners';
import { getClass } from '../data/classes';
import { getRace } from '../data/races';
import { effectiveAbilityScores, totalBAB, totalSave, abilityMod, modStr, maxHP } from '../utils/calculations';
import { AbilityPanel } from '../components/sheet/AbilityPanel';
import { CombatStats } from '../components/sheet/CombatStats';
import { SkillsPanel } from '../components/sheet/SkillsPanel';
import { SpellsPanel } from '../components/sheet/SpellsPanel';
import { FeaturesPanel } from '../components/sheet/FeaturesPanel';
import { AttacksPanel } from '../components/sheet/AttacksPanel';
import { LevelUpWizard } from '../components/levelup/LevelUpWizard';
import { DiceRoller } from '../components/sheet/DiceRoller';
import type { RollRequest } from '../components/sheet/DiceRoller';

type Tab = 'overview' | 'skills' | 'spells' | 'features' | 'notes';

export function CharacterSheet() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { characters, deleteCharacter, updateCharacter } = useCharacterStore();
  const [tab, setTab] = useState<Tab>('overview');
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [diceOpen, setDiceOpen] = useState(false);
  const [pendingRoll, setPendingRoll] = useState<RollRequest | undefined>();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleQuickRoll = (req: RollRequest) => {
    setDiceOpen(true);
    setPendingRoll(req);
  };

  const char = characters.find(c => c.id === id);
  if (!char) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-deep)' }}>
        <div className="text-center">
          <p className="text-xl mb-4" style={{ color: 'var(--ink-mute)' }}>Personaggio non trovato.</p>
          <button className="btn btn-ghost" onClick={() => navigate('/')}>← Home</button>
        </div>
      </div>
    );
  }

  const scores = effectiveAbilityScores(char);
  const race = getRace(char.race);
  const classes = char.classes.map(e => ({ entry: e, cls: getClass(e.classId) }));
  const maxHp = maxHP(char, scores.con);
  const hpPct = Math.max(0, Math.min(100, (char.currentHp / maxHp) * 100));
  const bab = totalBAB(char.classes);
  const fort = totalSave('fort', char.classes) + abilityMod(scores.con);
  const ref  = totalSave('ref',  char.classes) + abilityMod(scores.dex);
  const will = totalSave('will', char.classes) + abilityMod(scores.wis);

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview',  label: 'Combattimento' },
    { id: 'skills',    label: 'Abilità' },
    { id: 'spells',    label: 'Incantesimi' },
    { id: 'features',  label: 'Capacità' },
    { id: 'notes',     label: 'Note' },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-deep)' }}>
      {/* Identity header */}
      <div
        className="frame-corners-4"
        style={{
          background: 'linear-gradient(180deg, var(--surface-2), var(--bg-base))',
          borderBottom: '1px solid var(--line-soft)',
          position: 'relative',
        }}
      >
        <FrameCorners />

        {/* Top action row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 24px 0',
        }}>
          <button
            className="btn btn-ghost"
            style={{ fontSize: 11, padding: '6px 14px' }}
            onClick={() => navigate('/')}
          >
            ← Compagnia
          </button>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <UserPreferencesPanel />
            {char.totalLevel < 20 && (
              <button
                className="btn btn-primary"
                style={{ fontSize: 11, padding: '6px 16px' }}
                onClick={() => setShowLevelUp(true)}
              >
                ↑ Level Up
              </button>
            )}
            <button
              className="btn btn-ghost"
              style={{ fontSize: 11, padding: '6px 10px' }}
              onClick={() => setShowDeleteConfirm(true)}
            >
              🗑
            </button>
          </div>
        </div>

        {/* Character identity */}
        <div style={{ padding: '16px 24px 20px', display: 'flex', alignItems: 'flex-start', gap: 20 }}>
          {/* Portrait with spinning sigil */}
          <div style={{
            width: 72,
            height: 72,
            background: 'var(--bg-elev)',
            border: '1px solid var(--line-soft)',
            flexShrink: 0,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 36,
              fontStyle: 'italic',
              color: 'var(--gold)',
              opacity: 0.6,
              userSelect: 'none',
            }}>
              {char.name?.[0] ?? '?'}
            </div>
            {/* Rotating sigil overlay */}
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              color: 'var(--gold)',
              opacity: 0.15,
              animation: 'ringSpin 60s linear infinite',
            }}>
              <svg viewBox="0 0 64 64" width="64" height="64" fill="none" stroke="currentColor" strokeWidth="0.6">
                <circle cx="32" cy="32" r="30" />
                <circle cx="32" cy="32" r="22" />
                {[0, 60, 120, 180, 240, 300].map(a => {
                  const r1 = 22, r2 = 30;
                  const x1 = 32 + r1 * Math.cos(a * Math.PI / 180);
                  const y1 = 32 + r1 * Math.sin(a * Math.PI / 180);
                  const x2 = 32 + r2 * Math.cos(a * Math.PI / 180);
                  const y2 = 32 + r2 * Math.sin(a * Math.PI / 180);
                  return <line key={a} x1={x1} y1={y1} x2={x2} y2={y2} />;
                })}
              </svg>
            </div>
          </div>

          {/* Name + meta + bars */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 28,
              fontWeight: 500,
              color: 'var(--ink)',
              margin: '0 0 4px',
              lineHeight: 1.1,
            }}>
              {char.name}
            </h1>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '3px 10px',
              fontFamily: 'var(--font-rune)',
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--ink-mute)',
              marginBottom: 12,
            }}>
              <span>{race?.name ?? char.race}</span>
              <span style={{ color: 'var(--line-mid)' }}>·</span>
              <span>
                {classes.map(({ entry, cls }) => `${cls?.name ?? entry.classId} ${entry.level}`).join(' / ')}
              </span>
              <span style={{ color: 'var(--line-mid)' }}>·</span>
              <span style={{ color: 'var(--gold-bright)' }}>LV {char.totalLevel}</span>
              {char.alignment && (
                <>
                  <span style={{ color: 'var(--line-mid)' }}>·</span>
                  <span>{char.alignment}</span>
                </>
              )}
            </div>

            {/* HP vital bar */}
            <div className="vital-row" style={{ maxWidth: 340, marginBottom: 6 }}>
              <div className="vital-label">
                <span className="name">Punti Ferita</span>
                <span className="val">{char.currentHp}<em>/{maxHp}</em></span>
              </div>
              <div className="vital-bar">
                <div className="vital-bar-fill" style={{ width: `${hpPct}%` }} />
              </div>
            </div>
          </div>

          {/* Quick combat stats */}
          <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap', maxWidth: 200 }}>
            {[
              { label: 'CA',   value: String(10 + abilityMod(scores.dex)) },
              { label: 'BAB',  value: modStr(bab) },
              { label: 'INIT', value: modStr(abilityMod(scores.dex)) },
              { label: 'TEM',  value: modStr(fort) },
              { label: 'RIF',  value: modStr(ref) },
              { label: 'VOL',  value: modStr(will) },
            ].map(({ label, value }) => (
              <div key={label} style={{
                textAlign: 'center',
                background: 'var(--bg-base)',
                border: '1px solid var(--line-soft)',
                padding: '5px 8px',
                minWidth: 44,
              }}>
                <div className="numeral" style={{ fontSize: 15, color: 'var(--ink)', lineHeight: 1 }}>{value}</div>
                <div className="label-rune-soft" style={{ fontSize: 8, marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--line-soft)',
        background: 'var(--bg-elev)',
        overflowX: 'auto',
      }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              fontFamily: 'var(--font-rune)',
              fontSize: 10,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              padding: '12px 20px',
              border: 'none',
              borderBottom: `2px solid ${tab === t.id ? 'var(--gold)' : 'transparent'}`,
              background: 'transparent',
              color: tab === t.id ? 'var(--gold)' : 'var(--ink-mute)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'color 0.15s, border-color 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full">
        {tab === 'overview' && (
          <div className="space-y-4">
            <AbilityPanel char={char} onQuickRoll={handleQuickRoll} />
            <CombatStats char={char} onQuickRoll={handleQuickRoll} />
            <AttacksPanel char={char} onQuickRoll={handleQuickRoll} />
          </div>
        )}
        {tab === 'skills' && <SkillsPanel char={char} onQuickRoll={handleQuickRoll} />}
        {tab === 'spells' && <SpellsPanel char={char} />}
        {tab === 'features' && <FeaturesPanel char={char} />}
        {tab === 'notes' && (
          <div className="space-y-4">
            <div className="pf-panel p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="label-rune">Note</div>
                <button
                  className="pf-btn pf-btn-outline text-xs px-3 py-1"
                  onClick={() => setEditingNotes(e => !e)}
                >
                  {editingNotes ? 'Salva' : 'Modifica'}
                </button>
              </div>
              {editingNotes ? (
                <textarea
                  className="pf-input resize-none w-full"
                  rows={8}
                  value={char.notes}
                  onChange={e => updateCharacter(char.id, { notes: e.target.value })}
                />
              ) : (
                <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--ink-soft)' }}>
                  {char.notes || 'Nessuna nota.'}
                </p>
              )}
            </div>

            {/* Character details */}
            <div className="pf-panel p-4 grid grid-cols-2 gap-3 text-sm">
              {[
                ['Razza', race?.name ?? char.race],
                ['Allineamento', char.alignment],
                ['Divinità', char.deity ?? '—'],
                ['Giocatore', char.playerName ?? '—'],
                ['Genere', char.gender ?? '—'],
                ['Età', char.age ? String(char.age) : '—'],
                ['Altezza', char.height ?? '—'],
                ['Peso', char.weight ?? '—'],
                ['Capelli', char.hair ?? '—'],
                ['Occhi', char.eyes ?? '—'],
              ].map(([label, value]) => (
                <div key={label}>
                  <span className="label-rune-soft" style={{ display: 'inline', marginRight: 6 }}>{label}</span>
                  <span style={{ color: 'var(--ink-soft)' }}>{value}</span>
                </div>
              ))}
            </div>

            {char.background && (
              <div className="pf-panel p-4">
                <div className="label-rune" style={{ marginBottom: 8 }}>Background</div>
                <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--ink-soft)' }}>{char.background}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showLevelUp && (
        <LevelUpWizard char={char} onClose={() => setShowLevelUp(false)} />
      )}

      {showDeleteConfirm && (
        <ConfirmModal
          title="Elimina personaggio"
          message={`Vuoi eliminare "${char.name}"? L'azione non può essere annullata.`}
          confirmLabel="Elimina"
          danger
          onConfirm={() => { deleteCharacter(char.id); navigate('/'); }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {/* Floating dice button */}
      <button
        onClick={() => setDiceOpen(o => !o)}
        className="fixed bottom-4 right-4 z-30 w-12 h-12 text-xl font-bold shadow-lg transition-transform active:scale-90"
        style={{
          background: diceOpen ? 'var(--gold)' : 'var(--surface-1)',
          color: diceOpen ? 'var(--bg-deep)' : 'var(--gold)',
          border: '1px solid var(--line-mid)',
          borderRadius: 0,
        }}
        title="Lancia i dadi"
      >
        🎲
      </button>

      <DiceRoller
        open={diceOpen}
        onClose={() => setDiceOpen(false)}
        pendingRoll={pendingRoll}
        onPendingHandled={() => setPendingRoll(undefined)}
      />
    </div>
  );
}
