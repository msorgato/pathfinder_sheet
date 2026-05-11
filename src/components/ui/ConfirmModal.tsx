interface Props {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ title, message, confirmLabel = 'Conferma', danger = false, onConfirm, onCancel }: Props) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        className="pf-panel p-6 w-full max-w-sm"
        style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.7)' }}
      >
        <h3
          className="text-lg font-bold mb-2"
          style={{ color: danger ? 'var(--theme-hp-low)' : 'var(--theme-accent)', fontFamily: 'var(--theme-font)' }}
        >
          {title}
        </h3>
        <p className="text-sm mb-6" style={{ color: 'var(--theme-text-muted)' }}>
          {message}
        </p>
        <div className="flex gap-3 justify-end">
          <button
            className="pf-btn pf-btn-ghost px-4 py-2 text-sm"
            onClick={onCancel}
          >
            Annulla
          </button>
          <button
            className="pf-btn px-4 py-2 text-sm font-semibold"
            style={{
              background: danger ? 'rgba(239,68,68,0.15)' : 'rgba(200,164,67,0.15)',
              border: `1px solid ${danger ? 'var(--theme-hp-low)' : 'var(--theme-accent)'}`,
              color: danger ? 'var(--theme-hp-low)' : 'var(--theme-accent)',
            }}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
