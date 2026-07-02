import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCharacterStore } from '../store/characterStore';
import { UserPreferencesPanel } from '../components/ui/UserPreferencesPanel';
import { CHARACTER_PALETTES } from '../themes';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { FrameCorners } from '../components/ui/FrameCorners';
import { getClass } from '../data/classes';
import { getRace } from '../data/races';
import { effectiveAbilityScores, abilityMod, maxHP } from '../utils/calculations';
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
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showColorPicker) return;
    const handler = (e: MouseEvent) => {
      if (colorPickerRef.current?.contains(e.target as Node)) return;
      setShowColorPicker(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showColorPicker]);

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

            {/* Character accent colour picker */}
            <div ref={colorPickerRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowColorPicker(p => !p)}
                title="Colore personaggio"
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: char.accentColor ?? 'var(--gold)',
                  border: showColorPicker ? '2px solid white' : '2px solid var(--line-mid)',
                  cursor: 'pointer',
                  padding: 0,
                  flexShrink: 0,
                  transition: 'border-color 0.15s, transform 0.15s',
                  transform: showColorPicker ? 'scale(1.15)' : 'scale(1)',
                }}
              />
              {showColorPicker && (
                <div
                  className="pf-panel"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    right: 0,
                    padding: '12px 14px',
                    zIndex: 9999,
                    boxShadow: '0 4px 24px rgba(0,0,0,0.55)',
                    minWidth: 190,
                  }}
                >
                  <div className="label-rune-soft" style={{ marginBottom: 10 }}>Colore Personaggio</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {CHARACTER_PALETTES.map(p => (
                      <button
                        key={p.id}
                        title={p.name}
                        onClick={() => { updateCharacter(char.id, { accentColor: p.hex }); setShowColorPicker(false); }}
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: p.hex,
                          border: char.accentColor === p.hex ? '2px solid white' : '2px solid transparent',
                          cursor: 'pointer',
                          padding: 0,
                          outline: 'none',
                          flexShrink: 0,
                          boxShadow: char.accentColor === p.hex ? `0 0 0 1px rgba(255,255,255,0.5), 0 0 6px ${p.hex}` : 'none',
                          transition: 'transform 0.1s',
                        }}
                      />
                    ))}
                  </div>
                  {char.accentColor && (
                    <div style={{ marginTop: 10, borderTop: '1px solid var(--line-soft)', paddingTop: 8 }}>
                      <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginBottom: 4 }}>
                        {CHARACTER_PALETTES.find(p => p.hex === char.accentColor)?.name ?? ''}
                      </div>
                      <button
                        className="pf-btn pf-btn-ghost"
                        style={{ fontSize: 10, padding: '3px 8px' }}
                        onClick={() => { updateCharacter(char.id, { accentColor: undefined }); setShowColorPicker(false); }}
                      >
                        Ripristina oro
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

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

            {/* Character initial — above sigil layers */}
            <div className="char-portrait-initial" style={{
              position: 'relative',
              zIndex: 1,
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              color: 'var(--char-accent, var(--gold))',
              opacity: 0.6,
              userSelect: 'none',
            }}>
              {char.name?.[0] ?? '?'}
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
