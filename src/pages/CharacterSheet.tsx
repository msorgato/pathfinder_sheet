import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCharacterStore } from '../store/characterStore';
import { UserPreferencesPanel } from '../components/ui/UserPreferencesPanel';
import { ConfirmModal } from '../components/ui/ConfirmModal';
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

const ALIGNMENT_COLORS: Record<string, string> = {
  LG: 'var(--theme-hp-high)', NG: '#86efac', CG: '#6ee7b7',
  LN: '#93c5fd', TN: '#d1d5db', CN: '#c4b5fd',
  LE: '#fca5a5', NE: '#f87171', CE: 'var(--theme-hp-low)',
};

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
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--theme-bg)' }}>
        <div className="text-center">
          <p className="text-xl mb-4" style={{ color: 'var(--theme-text-muted)' }}>Personaggio non trovato.</p>
          <button className="pf-btn pf-btn-gold" onClick={() => navigate('/')}>← Home</button>
        </div>
      </div>
    );
  }

  const scores = effectiveAbilityScores(char);
  const race = getRace(char.race);
  const classes = char.classes.map(e => ({ entry: e, cls: getClass(e.classId) }));
  const maxHp = maxHP(char, scores.con);

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview', label: '⚔ Combattimento' },
    { id: 'skills', label: '🎯 Abilità' },
    { id: 'spells', label: '✨ Incantesimi' },
    { id: 'features', label: '📖 Capacità' },
    { id: 'notes', label: '📝 Note' },
  ];

  const hpPct = Math.max(0, Math.min(100, (char.currentHp / maxHp) * 100));

  return (
    <div className="min-h-screen flex flex-col theme-root" style={{ background: 'var(--theme-bg)' }}>
      {/* Top header */}
      <div className="pf-header px-4 py-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate('/')}
            className="mt-1 text-sm px-2 py-1 rounded"
            style={{ background: 'rgba(0,0,0,0.3)', color: 'var(--theme-accent)' }}
          >
            ←
          </button>
          <div>
            <h1 className="text-xl font-bold leading-tight" style={{ color: 'var(--theme-text)', fontFamily: 'var(--theme-font)' }}>
              {char.name}
            </h1>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs mt-1" style={{ color: 'var(--theme-accent)' }}>
              <span>{race?.name ?? char.race}</span>
              <span>
                {classes.map(({ entry, cls }) =>
                  `${cls?.name ?? entry.classId} ${entry.level}`
                ).join(' / ')}
              </span>
              <span>LV {char.totalLevel}</span>
              <span style={{ color: ALIGNMENT_COLORS[char.alignment] ?? 'var(--theme-text-muted)' }}>
                {char.alignment}
              </span>
              {char.deity && <span>{char.deity}</span>}
            </div>
            {/* Mini HP bar */}
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-28 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--theme-bg)' }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${hpPct}%`,
                    background: hpPct > 50 ? 'var(--theme-hp-high)' : hpPct > 25 ? 'var(--theme-hp-mid)' : 'var(--theme-hp-low)',
                  }}
                />
              </div>
              <span className="text-xs" style={{ color: 'var(--theme-text-faint)' }}>
                {char.currentHp}/{maxHp} PF
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1 items-end">
          <UserPreferencesPanel />
          {char.totalLevel < 20 && (
            <button
              className="pf-btn pf-btn-gold text-xs px-3 py-1.5 whitespace-nowrap"
              onClick={() => setShowLevelUp(true)}
            >
              ⬆ Level Up
            </button>
          )}
          <button
            className="pf-btn pf-btn-ghost text-xs px-3 py-1"
            onClick={() => setShowDeleteConfirm(true)}
          >
            🗑 Elimina
          </button>
        </div>
      </div>

      {/* Quick stats strip */}
      <div
        className="flex overflow-x-auto gap-3 px-4 py-2"
        style={{ background: 'var(--theme-bg-panel)', borderBottom: '1px solid var(--theme-ghost-border)' }}
      >
        {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map(k => {
          const labels: Record<string, string> = { str: 'FOR', dex: 'DES', con: 'COS', int: 'INT', wis: 'SAG', cha: 'CAR' };
          const mod = abilityMod(scores[k]);
          return (
            <div key={k} className="text-center shrink-0">
              <div className="text-xs" style={{ color: 'var(--theme-border-strong)' }}>{labels[k]}</div>
              <div className="text-sm font-bold" style={{ color: 'var(--theme-text)' }}>{scores[k]}</div>
              <div className="text-xs" style={{ color: mod >= 0 ? 'var(--theme-accent)' : 'var(--theme-hp-low)' }}>{modStr(mod)}</div>
            </div>
          );
        })}
        <div className="w-px shrink-0" style={{ background: 'var(--theme-ghost-border)' }} />
        <div className="text-center shrink-0">
          <div className="text-xs" style={{ color: 'var(--theme-border-strong)' }}>CA</div>
          <div className="text-sm font-bold" style={{ color: 'var(--theme-text)' }}>{10 + abilityMod(scores.dex)}</div>
        </div>
        <div className="text-center shrink-0">
          <div className="text-xs" style={{ color: 'var(--theme-border-strong)' }}>BAB</div>
          <div className="text-sm font-bold" style={{ color: 'var(--theme-text)' }}>{modStr(totalBAB(char.classes))}</div>
        </div>
        <div className="text-center shrink-0">
          <div className="text-xs" style={{ color: 'var(--theme-border-strong)' }}>INIT</div>
          <div className="text-sm font-bold" style={{ color: 'var(--theme-text)' }}>{modStr(abilityMod(scores.dex))}</div>
        </div>
      </div>

      {/* Tab bar */}
      <div
        className="flex border-b overflow-x-auto"
        style={{ background: 'var(--theme-bg-panel-2)', borderColor: 'var(--theme-ghost-border)' }}
      >
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-all"
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
                <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--theme-accent)' }}>Note</h3>
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
                <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--theme-text-muted)' }}>
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
                  <span className="font-semibold" style={{ color: 'var(--theme-border-strong)' }}>{label}: </span>
                  <span style={{ color: 'var(--theme-text-muted)' }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Background */}
            {char.background && (
              <div className="pf-panel p-4">
                <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--theme-accent)' }}>Background</h3>
                <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--theme-text-muted)' }}>{char.background}</p>
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
        className="fixed bottom-4 right-4 z-30 w-12 h-12 rounded-full text-xl font-bold shadow-lg transition-transform active:scale-90"
        style={{
          background: diceOpen ? 'var(--theme-accent)' : 'var(--theme-bg-panel)',
          color: diceOpen ? 'var(--theme-bg)' : 'var(--theme-accent)',
          border: '2px solid var(--theme-accent)',
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
