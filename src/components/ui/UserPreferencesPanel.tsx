import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { THEMES } from '../../themes';

export function UserPreferencesPanel() {
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuthStore();
  const { theme, setTheme } = useThemeStore();

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
    setOpen(o => !o);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        btnRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      ) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const dropdown = open ? (
    <div
      ref={dropdownRef}
      className="pf-panel p-3"
      style={{
        position: 'fixed',
        top: dropdownPos.top,
        right: dropdownPos.right,
        minWidth: 200,
        zIndex: 9999,
        boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
      }}
    >
      {user && (
        <div
          className="flex items-center gap-2 mb-3 pb-2"
          style={{ borderBottom: '1px solid var(--theme-ghost-border)' }}
        >
          {user.photoURL && (
            <img
              src={user.photoURL}
              alt={user.displayName ?? ''}
              className="w-8 h-8 rounded-full shrink-0"
              referrerPolicy="no-referrer"
            />
          )}
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate" style={{ color: 'var(--theme-text)' }}>
              {user.displayName}
            </div>
            <div className="text-xs truncate" style={{ color: 'var(--theme-text-muted)' }}>
              {user.email}
            </div>
          </div>
        </div>
      )}

      <div className="mb-3">
        <div
          className="text-xs font-bold uppercase tracking-wider mb-2"
          style={{ color: 'var(--theme-border-strong)' }}
        >
          Tema
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              title={t.label}
              style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                border: theme === t.id ? '2px solid var(--theme-text)' : '2px solid transparent',
                background: `linear-gradient(135deg, ${t.swatch1} 40%, ${t.swatch2} 100%)`,
                cursor: 'pointer',
                outline: theme === t.id ? '1px solid var(--theme-accent)' : 'none',
                outlineOffset: '1px',
                transition: 'all 0.15s',
                transform: theme === t.id ? 'scale(1.2)' : 'scale(1)',
                flexShrink: 0,
              }}
            />
          ))}
        </div>
        <div className="text-xs mt-1.5" style={{ color: 'var(--theme-text-faint)' }}>
          {THEMES.find(t => t.id === theme)?.label}
        </div>
      </div>

      {user && (
        <button
          className="pf-btn pf-btn-ghost text-xs px-2 py-1 w-full"
          onClick={() => { signOut(); setOpen(false); }}
        >
          Esci
        </button>
      )}
    </div>
  ) : null;

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleToggle}
        className="flex items-center gap-1.5 px-2 py-1 rounded"
        style={{
          background: open ? 'var(--theme-bg-panel)' : 'transparent',
          border: '1px solid ' + (open ? 'var(--theme-border)' : 'transparent'),
          color: 'var(--theme-text)',
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
        title="Preferenze utente"
      >
        {user?.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName ?? ''}
            className="w-6 h-6 rounded-full"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span style={{ fontSize: 16, lineHeight: 1 }}>⚙</span>
        )}
        <span style={{ fontSize: 10, color: 'var(--theme-text-muted)' }}>▾</span>
      </button>

      {createPortal(dropdown, document.body)}
    </>
  );
}
