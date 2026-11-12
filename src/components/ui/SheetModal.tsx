import { useEffect } from 'react';
import type { ReactNode } from 'react';

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: number;
}

/** Centered dialog (bottom sheet on mobile) closed by ✕, outside tap or Escape. */
export function SheetModal({ title, onClose, children, maxWidth = 420 }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="customize-overlay"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="pf-panel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{ width: '100%', maxWidth, maxHeight: '90vh', overflowY: 'auto', padding: 20, boxShadow: '0 8px 40px rgba(0,0,0,0.7)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div className="label-rune">{title}</div>
          <button className="btn btn-ghost btn-icon" aria-label="Chiudi" title="Chiudi" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
