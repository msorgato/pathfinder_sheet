import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCharacterStore } from '../store/characterStore';
import { UserPreferencesPanel } from '../components/ui/UserPreferencesPanel';
import { CharacterCustomizationPanel } from '../components/sheet/CharacterCustomizationPanel';
import { CharacterPortraitGlyph } from '../components/sheet/CharacterPortraitGlyph';
import { defaultPortraitIcon } from '../data/portraitIcons';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { FrameCorners } from '../components/ui/FrameCorners';
import { getClass } from '../data/classes';
import { getRace } from '../data/races';
import { deriveStats } from '../utils/derivedStats';
import { AbilityPanel } from '../components/sheet/AbilityPanel';
import { CombatStats, HitPointsPanel } from '../components/sheet/CombatStats';
import { SkillsPanel } from '../components/sheet/SkillsPanel';
import { SpellsPanel } from '../components/sheet/SpellsPanel';
import { FeaturesPanel } from '../components/sheet/FeaturesPanel';
import { AttacksPanel } from '../components/sheet/AttacksPanel';
import { StatusChips } from '../components/sheet/StatusChips';
import { StatusPanel } from '../components/sheet/StatusPanel';
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
  const [showCustomize, setShowCustomize] = useState(false);

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

  const derived = deriveStats(char);
  const race = getRace(char.race);
  const classes = char.classes.map(e => ({ entry: e, cls: getClass(e.classId) }));
  const maxHp = derived.maxHp.total;
  const hpPct = Math.max(0, Math.min(100, (char.currentHp / maxHp) * 100));

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview',  label: 'Combattimento' },
    { id: 'skills',    label: 'Abilità' },
    { id: 'spells',    label: 'Incantesimi' },
    { id: 'features',  label: 'Capacità' },
    { id: 'notes',     label: 'Note' },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-deep)', '--char-accent': char.accentColor ?? 'var(--gold)' } as React.CSSProperties}>
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
        <div className="char-header-actions">
          <button
            className="btn btn-ghost char-back-btn"
            aria-label="Torna alla compagnia"
            title="Torna alla compagnia"
            onClick={() => navigate('/')}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
            <span className="label">Compagnia</span>
          </button>
          <div className="char-header-actions-group">
            {char.totalLevel < 20 && (
              <button
                className="btn btn-primary btn-icon"
                aria-label="Level Up"
                title="Level Up"
                onClick={() => setShowLevelUp(true)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 20V5" />
                  <path d="M5 12l7-7 7 7" />
                </svg>
              </button>
            )}
            <button
              className="btn btn-icon"
              aria-label="Personalizzazione personaggio"
              title="Personalizzazione personaggio"
              onClick={() => setShowCustomize(true)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h0a1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
              </svg>
            </button>
            <UserPreferencesPanel />
          </div>
        </div>


        {/* Character identity */}
        <div style={{ padding: '16px 24px 20px', display: 'flex', alignItems: 'flex-start', gap: 20 }}>
          {/* Portrait with multi-ring ouroboros sigil */}
          <div className="char-portrait" style={{
            background: 'var(--bg-elev)',
            border: '1px solid var(--line-soft)',
            flexShrink: 0,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}>
            {/* Ouroboros sigil layer (clockwise) */}
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              color: 'var(--char-accent, var(--gold))',
              opacity: 0.15,
              animation: 'ringSpin 60s linear infinite',
            }}>
              <svg viewBox="0 0 64 64" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="0.6">
                <circle cx="32" cy="32" r="30" />
                <circle cx="32" cy="32" r="22" />
                <circle cx="32" cy="32" r="14" />
                <circle cx="32" cy="32" r="26" strokeDasharray="2 4" />
                {[0, 60, 120, 180, 240, 300].map(a => {
                  const rad = a * Math.PI / 180;
                  const cx = 32 + 22 * Math.cos(rad);
                  const cy = 32 + 22 * Math.sin(rad);
                  return <circle key={a} cx={cx} cy={cy} r="1.5" fill="currentColor" stroke="none" />;
                })}
              </svg>
            </div>

            {/* Hexagon counter-rotating layer */}
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              color: 'var(--char-accent, var(--gold))',
              opacity: 0.12,
              animation: 'ringSpinReverse 90s linear infinite',
            }}>
              <svg viewBox="0 0 64 64" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="0.5">
                <polygon points="60,32 46,56.25 18,56.25 4,32 18,7.75 46,7.75" />
              </svg>
            </div>

            {/* Portrait icon or initial — above sigil layers */}
            <CharacterPortraitGlyph
              char={char}
              iconClassName="char-portrait-icon"
              initialClassName="char-portrait-initial"
              initialStyle={{
                position: 'relative',
                zIndex: 1,
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                color: 'var(--char-accent, var(--gold))',
                opacity: 0.6,
                userSelect: 'none',
              }}
            />
          </div>

          {/* Name + meta + bars */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 28,
              fontWeight: 700,
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
              fontSize: 12,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--ink-mute)',
              marginBottom: 12,
            }}>
              <span>{race?.name ?? char.race}</span>
              <span style={{ color: 'var(--line-mid)' }}>·</span>
              <span>
                {classes.map(({ entry, cls }) =>
                  cls
                    ? `${cls.name} ${entry.level}`
                    : `[${entry.classId}?] ${entry.level}`,
                ).join(' / ')}
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
            <div className="vital-row" style={{ maxWidth: 480, marginBottom: 8 }}>
              <div className="vital-label">
                <span className="name">Punti Ferita</span>
                <span className="val">{char.currentHp}<em>/{maxHp}</em></span>
              </div>
              <div className="vital-bar">
                <div className="vital-bar-fill" style={{ width: `${hpPct}%`, background: 'var(--char-accent, var(--gold))' }} />
              </div>
            </div>

            <StatusChips char={char} />

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
              fontSize: 12,
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
            <HitPointsPanel char={char} />
            <StatusPanel char={char} />
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

      {showCustomize && (
        <CharacterCustomizationPanel
          accentColor={char.accentColor}
          onChangeColor={hex => updateCharacter(char.id, { accentColor: hex })}
          portraitIcon={char.portraitIcon}
          autoIcon={defaultPortraitIcon(char)}
          onChangeIcon={id => updateCharacter(char.id, { portraitIcon: id })}
          onDelete={() => { setShowCustomize(false); setShowDeleteConfirm(true); }}
          onClose={() => setShowCustomize(false)}
        />
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
        className="dice-fab"
        onClick={() => setDiceOpen(o => !o)}
        title="Lancia i dadi"
      >
        <svg width="32" height="32" viewBox="0 0 240 240" fill="none" stroke="currentColor" strokeLinejoin="round" strokeLinecap="round">
          {/* Outer hexagonal silhouette */}
          <polygon points="120,20 207,70 207,170 120,220 33,170 33,70" strokeWidth="8"/>
          {/* Front center triangle */}
          <polygon points="120,58 173,151 67,151" strokeWidth="7"/>
          {/* Edges from lower-left inner vertex */}
          <line x1="67" y1="151" x2="120" y2="220" strokeWidth="5"/>
          <line x1="67" y1="151" x2="33" y2="70" strokeWidth="5"/>
          <line x1="67" y1="151" x2="33" y2="170" strokeWidth="5"/>
          {/* Edges from top inner vertex */}
          <line x1="120" y1="58" x2="120" y2="20" strokeWidth="5"/>
          <line x1="120" y1="58" x2="33" y2="70" strokeWidth="5"/>
          <line x1="120" y1="58" x2="207" y2="70" strokeWidth="5"/>
          {/* Edges from lower-right inner vertex */}
          <line x1="173" y1="151" x2="120" y2="220" strokeWidth="5"/>
          <line x1="173" y1="151" x2="207" y2="170" strokeWidth="5"/>
          <line x1="173" y1="151" x2="207" y2="70" strokeWidth="5"/>
          {/* Vertex accent dots */}
          <circle cx="120" cy="20" r="7" fill="currentColor" stroke="none"/>
          <circle cx="207" cy="70" r="7" fill="currentColor" stroke="none"/>
          <circle cx="207" cy="170" r="7" fill="currentColor" stroke="none"/>
          <circle cx="120" cy="220" r="7" fill="currentColor" stroke="none"/>
          <circle cx="33" cy="170" r="7" fill="currentColor" stroke="none"/>
          <circle cx="33" cy="70" r="7" fill="currentColor" stroke="none"/>
          <circle cx="120" cy="58" r="5.5" fill="currentColor" stroke="none"/>
          <circle cx="67" cy="151" r="5.5" fill="currentColor" stroke="none"/>
          <circle cx="173" cy="151" r="5.5" fill="currentColor" stroke="none"/>
        </svg>
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
