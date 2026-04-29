import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCharacterStore } from '../store/characterStore';
import { useThemeStore } from '../store/themeStore';
import { getClass } from '../data/classes';
import { getRace } from '../data/races';
import { effectiveAbilityScores, maxHP } from '../utils/calculations';
import { ThemeSwitcher } from '../components/ui/ThemeSwitcher';
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
  const theme = useThemeStore(s => s.theme);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const isEva = theme === 'eva01';
  const isCyber = theme === 'cyberpunk';
  const isP5 = theme === 'persona5';

  return (
    <div
      className="min-h-screen theme-root"
      style={{ background: 'var(--theme-bg)' }}
    >
      {/* Hero header */}
      <div className="pf-header px-6 py-8 text-center">
        {/* Theme switcher top-right */}
        <div className="absolute top-3 right-4 z-10">
          <ThemeSwitcher />
        </div>

        {/* Decorative spinning rune */}
        <div
          className="anim-spin mx-auto mb-3 select-none"
          style={{
            width: 48,
            height: 48,
            fontSize: 36,
            color: 'var(--theme-accent)',
            filter: 'drop-shadow(0 0 8px var(--theme-accent-glow))',
          }}
        >
          {isEva ? '⬡' : isCyber ? '◈' : isP5 ? '♠' : '✦'}
        </div>

        <h1
          className={`text-4xl font-bold mb-2 anim-enter ${isEva ? 'eva-title' : ''} ${isCyber ? 'cyber-title' : ''} ${isP5 ? 'p5-title' : ''}`}
          style={{ color: 'var(--theme-text)', fontFamily: 'var(--theme-font)', letterSpacing: isCyber || isP5 ? '0.08em' : undefined }}
        >
          {isEva ? '[ NERV ] PATHFINDER' : isCyber ? '// PATHFINDER.EXE' : isP5 ? '// PERSONA PATHFINDER //' : '⚔️ Pathfinder'}
        </h1>
        <h2
          className={`text-xl anim-enter d1 ${isCyber || isP5 ? 'neon-text' : ''}`}
          style={{ color: 'var(--theme-accent)' }}
        >
          {isEva ? 'GESTIONE SCHEDE — SISTEMA ATTIVO' : isCyber ? 'CHARACTER MANAGEMENT SYSTEM v1.0' : isP5 ? 'STEAL YOUR DESTINY · PHANTOM THIEVES' : 'Gestione Schede Personaggio'}
        </h2>
        <p
          className="text-sm mt-2 anim-enter d2"
          style={{ color: 'var(--theme-text-muted)', letterSpacing: isCyber || isP5 ? '0.05em' : undefined }}
        >
          {isEva
            ? 'PF1e · MULTICLASSE · LEVEL UP LV.20 · SINCRONIZZAZIONE 100%'
            : isCyber
            ? 'PF1e · MULTICLASS · LEVEL CAP 20 · UPLINK ACTIVE'
            : isP5
            ? 'PF1e · MULTICLASSE · LEVEL CAP 20 · RISVEGLIO IN CORSO'
            : 'Crea e gestisci i tuoi personaggi PF1e · Multiclasse · Level up fino al 20°'}
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Create button */}
        <button
          className="pf-btn pf-btn-gold w-full py-4 text-lg mb-3 anim-enter d3"
          onClick={() => navigate('/create')}
          style={{ letterSpacing: isEva || isCyber || isP5 ? '0.12em' : undefined }}
        >
          {isEva ? '[ + NUOVO PILOTA ]' : isCyber ? '> NEW_CHARACTER.INIT' : isP5 ? '♠ RISVEGLIA UN PHANTOM THIEF' : '✨ Crea Nuovo Personaggio'}
        </button>

        {/* Save / Load */}
        <div className="flex gap-2 mb-8 anim-enter d4">
          <button
            className="pf-btn pf-btn-outline flex-1 py-2 text-sm"
            onClick={exportAll}
            disabled={characters.length === 0}
            title="Esporta tutti i personaggi in un file JSON"
          >
            💾 Esporta tutto
          </button>
          <button
            className="pf-btn pf-btn-outline flex-1 py-2 text-sm"
            onClick={() => fileInputRef.current?.click()}
            title="Importa personaggi da un file JSON"
          >
            📂 Importa
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleImportFile}
          />
        </div>

        {/* Character list */}
        {characters.length === 0 ? (
          <div className="pf-panel p-10 text-center anim-scale-in d5">
            <div className="text-5xl mb-4 anim-float">
              {isEva ? '🤖' : isCyber ? '💀' : isP5 ? '🃏' : '🧙'}
            </div>
            <p className="text-lg mb-2" style={{ color: 'var(--theme-text-muted)' }}>
              {isEva ? 'Nessun pilota registrato.' : isCyber ? 'NO_DATA_FOUND.' : isP5 ? 'NESSUN PHANTOM THIEF.' : 'Nessun personaggio.'}
            </p>
            <p className="text-sm" style={{ color: 'var(--theme-text-faint)' }}>
              {isEva
                ? 'Crea un nuovo pilota per iniziare la missione.'
                : isCyber
                ? 'Run NEW_CHARACTER.INIT to bootstrap a new agent.'
                : isP5
                ? 'Risveglia il tuo Persona e unisciti ai Phantom Thieves.'
                : 'Clicca su "Crea Nuovo Personaggio" per iniziare la tua avventura.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <h3
              className="text-sm font-bold uppercase tracking-wider mb-3 anim-enter d5"
              style={{ color: 'var(--theme-border-strong)' }}
            >
              {isEva ? '// PILOTI REGISTRATI' : isCyber ? '> AGENTS_ONLINE' : isP5 ? '♠ PHANTOM THIEVES' : 'I tuoi personaggi'}
            </h3>
            {characters.map((char, i) => {
              const race = getRace(char.race);
              const scores = effectiveAbilityScores(char);
              const hp = maxHP(char, scores.con);
              const hpPct = Math.max(0, Math.min(100, (char.currentHp / hp) * 100));
              const hpColor = hpPct > 50
                ? 'var(--theme-hp-high)'
                : hpPct > 25
                ? 'var(--theme-hp-mid)'
                : 'var(--theme-hp-low)';

              // delay class by index (capped at d8)
              const delayClass = `d${Math.min(i + 1, 8)}`;

              return (
                <div
                  key={char.id}
                  className={`pf-panel p-4 cursor-pointer anim-enter ${delayClass}`}
                  style={{ transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.15s' }}
                  onClick={() => openChar(char.id)}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--theme-accent)';
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateX(3px)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = '';
                    (e.currentTarget as HTMLDivElement).style.transform = '';
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3
                        className="text-lg font-bold truncate"
                        style={{ color: 'var(--theme-accent)' }}
                      >
                        {char.name || 'Senza nome'}
                      </h3>
                      <div
                        className="flex flex-wrap gap-x-3 text-sm mt-0.5"
                        style={{ color: 'var(--theme-text-muted)' }}
                      >
                        <span>{race?.name ?? char.race}</span>
                        <span>
                          {char.classes.map(e => {
                            const cls = getClass(e.classId);
                            return `${cls?.name ?? e.classId} ${e.level}`;
                          }).join(' / ')}
                        </span>
                        <span style={{ color: 'var(--theme-accent)', fontWeight: 700 }}>
                          LV {char.totalLevel}
                        </span>
                      </div>
                      {/* HP bar */}
                      <div className="flex items-center gap-2 mt-2">
                        <div
                          className="flex-1 h-1.5 rounded-full overflow-hidden"
                          style={{
                            background: 'var(--theme-bg)',
                            border: '1px solid var(--theme-ghost-border)',
                          }}
                        >
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${hpPct}%`, background: hpColor }}
                          />
                        </div>
                        <span
                          className="text-xs shrink-0"
                          style={{ color: 'var(--theme-text-faint)' }}
                        >
                          {char.currentHp}/{hp} PF
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        className="pf-btn pf-btn-outline text-xs px-3 py-1"
                        onClick={e => { e.stopPropagation(); openChar(char.id); }}
                      >
                        Apri
                      </button>
                      <button
                        className="pf-btn pf-btn-ghost text-xs px-3 py-1"
                        onClick={e => exportChar(char, e)}
                        title="Esporta personaggio"
                      >
                        💾
                      </button>
                      <button
                        className="pf-btn pf-btn-ghost text-xs px-3 py-1"
                        onClick={e => {
                          e.stopPropagation();
                          if (confirm(`Eliminare ${char.name}?`)) deleteCharacter(char.id);
                        }}
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div
          className="mt-8 text-center text-xs anim-fade-in"
          style={{ color: 'var(--theme-ghost-border)', animationDelay: '0.6s' }}
        >
          {isEva
            ? '[ NERV HQ · SISTEMA PATHFINDER 1e · TUTTI I DATI CLASSIFICATI ]'
            : isP5
            ? '[ METAVERSO ATTIVO · PATHFINDER 1e · CUORI RUBATI CON STILE ]'
            : 'Pathfinder 1° Edizione · Dati salvati nel browser · Esporta/Importa per backup su file'}
        </div>
      </div>
    </div>
  );
}
