import { useState } from 'react';

interface Props {
  onConfirm: (name: string) => Promise<void>;
  onCancel: () => void;
}

export function CreateLobbyModal({ onConfirm, onCancel }: Props) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { setError('Inserisci un nome per la lobby.'); return; }
    setLoading(true);
    setError('');
    try {
      await onConfirm(trimmed);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="pf-panel p-6 w-full max-w-sm" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.7)' }}>
        <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--theme-accent)', fontFamily: 'var(--theme-font)' }}>
          Crea nuova lobby
        </h3>
        <form onSubmit={submit}>
          <label className="block text-sm mb-1" style={{ color: 'var(--theme-text-muted)' }}>
            Nome lobby
          </label>
          <input
            className="w-full pf-input mb-4"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Es. Avventura del Drago"
            maxLength={60}
            autoFocus
          />
          {error && <p className="text-sm mb-3" style={{ color: 'var(--theme-hp-low)' }}>{error}</p>}
          <div className="flex gap-3 justify-end">
            <button type="button" className="pf-btn pf-btn-ghost px-4 py-2 text-sm" onClick={onCancel}>
              Annulla
            </button>
            <button
              type="submit"
              className="pf-btn pf-btn-gold px-4 py-2 text-sm font-semibold"
              disabled={loading}
            >
              {loading ? 'Creazione…' : 'Crea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
