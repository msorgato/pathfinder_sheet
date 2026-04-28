import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCharacterStore } from '../store/characterStore';
import { getClass } from '../data/classes';
import { getRace } from '../data/races';
import { effectiveAbilityScores, maxHP } from '../utils/calculations';
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

  return (
    <div className="min-h-screen" style={{ background: '#1a1209' }}>
      {/* Hero header */}
      <div className="pf-header px-6 py-8 text-center">
        <h1 className="text-4xl font-bold mb-2" style={{ color: '#f5edd6', fontFamily: 'Georgia, serif' }}>
          ⚔️ Pathfinder
        </h1>
        <h2 className="text-xl" style={{ color: '#c8a443' }}>Gestione Schede Personaggio</h2>
        <p className="text-sm mt-2" style={{ color: '#d1c5a8' }}>
          Crea e gestisci i tuoi personaggi PF1e · Multiclasse · Level up fino al 20°
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Create button */}
        <button
          className="pf-btn pf-btn-gold w-full py-4 text-lg mb-3"
          onClick={() => navigate('/create')}
        >
          ✨ Crea Nuovo Personaggio
        </button>

        {/* Save / Load buttons */}
        <div className="flex gap-2 mb-8">
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
          <div className="pf-panel p-10 text-center">
            <div className="text-5xl mb-4">🧙</div>
            <p className="text-lg mb-2" style={{ color: '#d1c5a8' }}>Nessun personaggio.</p>
            <p className="text-sm" style={{ color: '#8b8b6b' }}>
              Clicca su "Crea Nuovo Personaggio" per iniziare la tua avventura.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: '#8b5e3c' }}>
              I tuoi personaggi
            </h3>
            {characters.map(char => {
              const race = getRace(char.race);
              const scores = effectiveAbilityScores(char);
              const hp = maxHP(char, scores.con);
              const hpPct = Math.max(0, Math.min(100, (char.currentHp / hp) * 100));

              return (
                <div
                  key={char.id}
                  className="pf-panel p-4 cursor-pointer hover:border-yellow-700 transition-all"
                  onClick={() => openChar(char.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold truncate" style={{ color: '#c8a443' }}>
                        {char.name || 'Senza nome'}
                      </h3>
                      <div className="flex flex-wrap gap-x-3 text-sm mt-0.5" style={{ color: '#d1c5a8' }}>
                        <span>{race?.name ?? char.race}</span>
                        <span>
                          {char.classes.map(e => {
                            const cls = getClass(e.classId);
                            return `${cls?.name ?? e.classId} ${e.level}`;
                          }).join(' / ')}
                        </span>
                        <span style={{ color: '#c8a443', fontWeight: 700 }}>LV {char.totalLevel}</span>
                      </div>
                      {/* HP bar */}
                      <div className="flex items-center gap-2 mt-2">
                        <div
                          className="flex-1 h-1.5 rounded-full overflow-hidden"
                          style={{ background: '#1a1209', border: '1px solid #4b3620' }}
                        >
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${hpPct}%`,
                              background: hpPct > 50 ? '#4ade80' : hpPct > 25 ? '#fbbf24' : '#ef4444',
                            }}
                          />
                        </div>
                        <span className="text-xs shrink-0" style={{ color: '#8b8b6b' }}>
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

        {/* Footer info */}
        <div className="mt-8 text-center text-xs" style={{ color: '#4b3620' }}>
          Pathfinder 1° Edizione · Dati salvati nel browser · Esporta/Importa per backup su file
        </div>
      </div>
    </div>
  );
}
