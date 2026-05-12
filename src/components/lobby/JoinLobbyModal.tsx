import { useState } from 'react';

interface Props {
  onConfirm: (code: string) => Promise<void>;
  onCancel: () => void;
}

export function JoinLobbyModal({ onConfirm, onCancel }: Props) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 6) { setError('Il codice deve essere di 6 caratteri.'); return; }
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
          Unisciti a una lobby
        </h3>
        <form onSubmit={submit}>
          <label className="block text-sm mb-1" style={{ color: 'var(--theme-text-muted)' }}>
            Codice lobby (6 caratteri)
          </label>
          <input
            className="w-full pf-input mb-4 text-center tracking-widest uppercase font-mono text-lg"
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
            placeholder="ABCD12"
            maxLength={6}
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
              {loading ? 'Connessione…' : 'Entra'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
