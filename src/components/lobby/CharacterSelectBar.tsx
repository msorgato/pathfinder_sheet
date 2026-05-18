import { useState } from 'react';
import type { Character } from '../../types';

interface Props {
  characters: Character[];
  activeCharacterId: string | null;
  onSelect: (charId: string | null) => void;
}

export function CharacterSelectBar({ characters, activeCharacterId, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const active = characters.find(c => c.id === activeCharacterId);

  return (
    <div className="relative">
      <button
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm w-full"
        style={{
          background: 'var(--theme-bg-panel)',
          border: '1px solid var(--theme-ghost-border)',
          color: active ? 'var(--theme-text)' : 'var(--theme-text-faint)',
        }}
        onClick={() => setOpen(o => !o)}
      >
        <span className="text-base leading-none" style={{ color: 'var(--theme-accent)' }}>⚔</span>
        <span className="flex-1 text-left truncate">
          {active ? active.name : 'Scegli personaggio…'}
        </span>
        <span style={{ color: 'var(--theme-text-faint)', fontSize: 10 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 top-full mt-1 rounded-lg shadow-xl z-20 overflow-hidden"
          style={{ background: 'var(--theme-bg-panel-2)', border: '1px solid var(--theme-border)' }}
        >
          {characters.length === 0 && (
            <div className="px-3 py-2 text-xs" style={{ color: 'var(--theme-text-faint)' }}>
              Nessun personaggio disponibile.
            </div>
          )}
          {characters.map(c => (
            <button
              key={c.id}
              className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:opacity-80 transition-opacity"
              style={{
                background: c.id === activeCharacterId ? 'rgba(200,164,67,0.12)' : 'transparent',
                color: c.id === activeCharacterId ? 'var(--theme-accent)' : 'var(--theme-text)',
                borderBottom: '1px solid var(--theme-bg)',
              }}
              onClick={() => { onSelect(c.id); setOpen(false); }}
            >
              <span className="flex-1 truncate font-medium">{c.name || '(senza nome)'}</span>
              {c.id === activeCharacterId && (
                <span className="text-xs" style={{ color: 'var(--theme-accent)' }}>✓</span>
              )}
            </button>
          ))}
          {activeCharacterId && (
            <button
              className="w-full text-left px-3 py-2 text-xs"
              style={{ color: 'var(--theme-text-faint)', borderTop: '1px solid var(--theme-ghost-border)' }}
              onClick={() => { onSelect(null); setOpen(false); }}
            >
              Rimuovi personaggio
            </button>
          )}
        </div>
      )}
    </div>
  );
}
