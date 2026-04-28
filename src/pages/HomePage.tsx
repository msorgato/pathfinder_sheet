import { useNavigate } from 'react-router-dom';
import { useCharacterStore } from '../store/characterStore';
import { getClass } from '../data/classes';
import { getRace } from '../data/races';
import { effectiveAbilityScores, maxHP } from '../utils/calculations';

export function HomePage() {
  const navigate = useNavigate();
  const { characters, deleteCharacter, setActive } = useCharacterStore();

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
          className="pf-btn pf-btn-gold w-full py-4 text-lg mb-8"
          onClick={() => navigate('/create')}
        >
          ✨ Crea Nuovo Personaggio
        </button>

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
          Pathfinder 1° Edizione · I dati dei personaggi sono salvati localmente nel browser
        </div>
      </div>
    </div>
  );
}
