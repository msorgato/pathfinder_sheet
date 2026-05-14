import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCharacterStore } from '../store/characterStore';
import { useAuthStore } from '../store/authStore';
import { useLobbyStore } from '../store/lobbyStore';
import { getClass } from '../data/classes';
import { getRace } from '../data/races';
import { effectiveAbilityScores, maxHP, abilityMod, totalBAB, modStr } from '../utils/calculations';
import { UserPreferencesPanel } from '../components/ui/UserPreferencesPanel';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { FrameCorners } from '../components/ui/FrameCorners';
import type { Character } from '../types';

function triggerJsonDownload(data: object, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function HomePage() {
  const navigate = useNavigate();
  const { characters, deleteCharacter, setActive, importCharacters } = useCharacterStore();
  const { user } = useAuthStore();
  const { lobbies, loadUserLobbies } = useLobbyStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingDelete, setPendingDelete] = useState<Character | null>(null);

  const uid = user?.uid ?? '';

  useEffect(() => {
    if (uid) loadUserLobbies(uid);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const totalUnread = lobbies.reduce((s, l) => s + l.unreadCount, 0);

  const exportAll = () => {
    if (characters.length === 0) return;
    triggerJsonDownload(
      { version: 1, exportedAt: new Date().toISOString(), characters },
      `pathfinder-backup-${new Date().toISOString().slice(0, 10)}.json`,
    );
  };

  const exportChar = (char: Character, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerJsonDownload(
      { version: 1, exportedAt: new Date().toISOString(), characters: [char] },
      `${(char.name || 'personaggio').replace(/\s+/g, '-').toLowerCase()}.json`,
    );
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        const incoming: Character[] = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed.characters)
          ? parsed.characters
          : [];
        if (incoming.length === 0) {
          alert('File non valido o nessun personaggio trovato.');
          return;
        }
        importCharacters(incoming);
        alert(`${incoming.length} personaggio${incoming.length > 1 ? 'i' : ''} importato${incoming.length > 1 ? '/i' : ''} con successo.`);
      } catch {
        alert('Errore nella lettura del file. Assicurati che sia un file JSON valido.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const openChar = (id: string) => {
    setActive(id);
    navigate(`/character/${id}`);
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-deep)' }}>
      {/* Top bar */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 40px',
        borderBottom: '1px solid var(--line-soft)',
        position: 'relative',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ color: 'var(--gold)', fontSize: 28, lineHeight: 1 }}>✦</div>
          <div>
            <div style={{ fontFamily: 'var(--font-rune)', fontSize: 16, letterSpacing: '0.15em', color: 'var(--ink)' }}>
              Pathfinder
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-mute)' }}>
              scriptorium di compagnia
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            className="btn btn-ghost"
            onClick={() => navigate('/lobbies')}
            style={{ position: 'relative' }}
          >
            Tavolo
            {totalUnread > 0 && (
              <span style={{
                position: 'absolute', top: -6, right: -6,
                background: 'var(--blood)', color: 'var(--ink)',
                borderRadius: '50%', width: 18, height: 18,
                fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-mono)',
              }}>
                {totalUnread}
              </span>
            )}
          </button>
          <UserPreferencesPanel />
        </div>
      </header>

      {/* Hero */}
      <div style={{ padding: '48px 40px 32px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40 }}>
          <div>
            <div className="label-rune-soft" style={{ marginBottom: 8 }}>Cronache di una Compagnia</div>
            <h1 className="display-xl" style={{ margin: 0, color: 'var(--ink)' }}>I tuoi personaggi</h1>
            <p style={{
              color: 'var(--ink-mute)',
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontSize: 17,
              marginTop: 8,
              marginBottom: 0,
            }}>
              Quale anima guiderai stanotte?
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
            <button className="btn btn-ghost" onClick={exportAll} disabled={characters.length === 0} title="Esporta tutto">
              Esporta
            </button>
            <button className="btn btn-ghost" onClick={() => fileInputRef.current?.click()} title="Importa">
              Importa
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/create')}>
              Forgia personaggio
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleImportFile}
            />
          </div>
        </div>

        {/* Character grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 24,
        }}>
          {characters.map((char, i) => (
            <CharacterCard
              key={char.id}
              char={char}
              onOpen={() => openChar(char.id)}
              onExport={e => exportChar(char, e)}
              onDelete={e => { e.stopPropagation(); setPendingDelete(char); }}
              delay={i}
            />
          ))}

          {/* New character slot */}
          <div
            className="frame-corners-4 anim-scale-in"
            onClick={() => navigate('/create')}
            style={{
              background: 'var(--surface-1)',
              border: '1px dashed var(--line-mid)',
              padding: 32,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 14,
              minHeight: 220,
              transition: 'border-color 0.2s, background 0.2s',
              color: 'var(--ink-mute)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--line-strong)';
              (e.currentTarget as HTMLDivElement).style.background = 'var(--surface-2)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--line-mid)';
              (e.currentTarget as HTMLDivElement).style.background = 'var(--surface-1)';
            }}
          >
            <FrameCorners />
            <div style={{ color: 'var(--gold)', fontSize: 48, lineHeight: 1, opacity: 0.6 }}>✦</div>
            <div className="label-rune">Nuovo personaggio</div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontSize: 14,
              maxWidth: 200,
              textAlign: 'center',
              color: 'var(--ink-faint)',
            }}>
              Traccia un nuovo nome nel libro della compagnia.
            </div>
          </div>
        </div>

        {characters.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: 40, color: 'var(--ink-mute)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 18 }}>
              Nessun personaggio. Forgia il tuo primo eroe.
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{
          marginTop: 48,
          textAlign: 'center',
          fontFamily: 'var(--font-rune)',
          fontSize: 10,
          letterSpacing: '0.2em',
          color: 'var(--ink-faint)',
          textTransform: 'uppercase',
        }}>
          Pathfinder 1° Edizione · Cloud Sync · Esporta/Importa per backup
        </div>
      </div>

      {pendingDelete && (
        <ConfirmModal
          title="Elimina personaggio"
          message={`Vuoi eliminare "${pendingDelete.name}"? L'azione non può essere annullata.`}
          confirmLabel="Elimina"
          danger
          onConfirm={() => { deleteCharacter(pendingDelete.id); setPendingDelete(null); }}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}

function CharacterCard({ char, onOpen, onExport, onDelete, delay }: {
  char: Character;
  onOpen: () => void;
  onExport: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  delay: number;
}) {
  const race = getRace(char.race);
  const scores = effectiveAbilityScores(char);
  const hp = maxHP(char, scores.con);
  const hpPct = Math.max(0, Math.min(100, (char.currentHp / hp) * 100));
  const bab = totalBAB(char.classes);
  const ac = 10 + abilityMod(scores.dex);
  const init = abilityMod(scores.dex);
  const delayClass = `d${Math.min(delay + 1, 8)}`;

  const classLabel = char.classes.map(e => {
    const cls = getClass(e.classId);
    return `${cls?.name ?? e.classId} ${e.level}`;
  }).join(' / ');

  return (
    <div
      className={`frame-corners-4 anim-enter ${delayClass}`}
      onClick={onOpen}
      style={{
        background: 'linear-gradient(160deg, var(--surface-1), var(--bg-elev))',
        border: '1px solid var(--line-soft)',
        cursor: 'pointer',
        transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.15s',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--line-mid)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--card-shadow)';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--line-soft)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
        (e.currentTarget as HTMLDivElement).style.transform = 'none';
      }}
    >
      <FrameCorners />

      {/* Portrait area */}
      <div style={{
        height: 100,
        background: `linear-gradient(180deg, var(--surface-2), var(--bg-base))`,
        borderBottom: '1px solid var(--line-soft)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 52,
          fontStyle: 'italic',
          color: 'var(--gold)',
          opacity: 0.25,
          lineHeight: 1,
          userSelect: 'none',
        }}>
          {char.name?.[0] ?? '?'}
        </div>
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          color: 'var(--gold)',
          opacity: 0.08,
        }}>
          <svg viewBox="0 0 100 100" width="90" height="90" fill="none" stroke="currentColor" strokeWidth="0.8">
            <circle cx="50" cy="50" r="48" />
            <circle cx="50" cy="50" r="35" />
            {[0, 60, 120, 180, 240, 300].map(a => {
              const r1 = 35, r2 = 48;
              const x1 = 50 + r1 * Math.cos(a * Math.PI / 180);
              const y1 = 50 + r1 * Math.sin(a * Math.PI / 180);
              const x2 = 50 + r2 * Math.cos(a * Math.PI / 180);
              const y2 = 50 + r2 * Math.sin(a * Math.PI / 180);
              return <line key={a} x1={x1} y1={y1} x2={x2} y2={y2} />;
            })}
          </svg>
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: '16px 18px 18px' }}>
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 22,
          fontWeight: 500,
          color: 'var(--ink)',
          margin: '0 0 6px',
          lineHeight: 1.1,
        }}>
          {char.name || 'Senza nome'}
        </h3>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px 10px',
          marginBottom: 12,
          fontFamily: 'var(--font-rune)',
          fontSize: 10,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'var(--ink-mute)',
        }}>
          <span>{race?.name ?? char.race}</span>
          <span style={{ color: 'var(--line-mid)' }}>·</span>
          <span>{classLabel}</span>
          <span style={{ color: 'var(--line-mid)' }}>·</span>
          <span style={{ color: 'var(--gold)' }}>LV {char.totalLevel}</span>
        </div>

        {/* HP bar */}
        <div className="vital-row" style={{ marginBottom: 8 }}>
          <div className="vital-label">
            <span className="name">Punti Ferita</span>
            <span className="val">{char.currentHp}<em>/{hp}</em></span>
          </div>
          <div className="vital-bar">
            <div className="vital-bar-fill" style={{ width: `${hpPct}%` }} />
          </div>
        </div>

        {/* Stat chips */}
        <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
          {[
            { label: 'CA', value: String(ac) },
            { label: 'BAB', value: modStr(bab) },
            { label: 'INIT', value: modStr(init) },
          ].map(({ label, value }) => (
            <div key={label} style={{
              flex: 1,
              textAlign: 'center',
              background: 'var(--bg-base)',
              border: '1px solid var(--line-soft)',
              padding: '5px 4px',
            }}>
              <div className="numeral" style={{ fontSize: 16, color: 'var(--ink)', lineHeight: 1 }}>{value}</div>
              <div className="label-rune-soft" style={{ fontSize: 9, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Action row */}
        <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
          <button
            className="pf-btn pf-btn-ghost"
            style={{ flex: 1, fontSize: 10, padding: '4px 6px' }}
            onClick={e => { e.stopPropagation(); onOpen(); }}
          >
            Apri
          </button>
          <button
            className="pf-btn pf-btn-ghost"
            style={{ fontSize: 10, padding: '4px 8px' }}
            onClick={onExport}
            title="Esporta"
          >
            💾
          </button>
          <button
            className="pf-btn pf-btn-ghost"
            style={{ fontSize: 10, padding: '4px 8px' }}
            onClick={onDelete}
            title="Elimina"
          >
            🗑
          </button>
        </div>
      </div>
    </div>
  );
}
