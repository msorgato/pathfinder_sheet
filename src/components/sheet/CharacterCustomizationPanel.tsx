import { useEffect } from 'react';
import { CHARACTER_PALETTES } from '../../themes';
import { PORTRAIT_ICONS, isPortraitIcon } from '../../data/portraitIcons';
import { PortraitIconMask } from './CharacterPortraitGlyph';

interface Props {
  accentColor?: string;
  onChangeColor: (hex: string | undefined) => void;
  portraitIcon?: string;
  /** Icon shown when no icon is chosen (primary class icon), if any. */
  autoIcon?: string;
  onChangeIcon: (id: string | undefined) => void;
  onDelete: () => void;
  onClose: () => void;
}

export function CharacterCustomizationPanel({ accentColor, onChangeColor, portraitIcon, autoIcon, onChangeIcon, onDelete, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const current = CHARACTER_PALETTES.find(p => p.hex === accentColor);
  const chosenIcon = isPortraitIcon(portraitIcon) ? portraitIcon : undefined;

  return (
    <div
      className="customize-overlay"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="pf-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Personalizzazione personaggio"
        style={{ width: '100%', maxWidth: 420, maxHeight: '90vh', overflowY: 'auto', padding: 20, boxShadow: '0 8px 40px rgba(0,0,0,0.7)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div className="label-rune-soft">Personalizzazione personaggio</div>
          <button className="btn btn-ghost btn-icon" aria-label="Chiudi" title="Chiudi" autoFocus onClick={onClose}>✕</button>
        </div>

        <div className="label-rune-soft" style={{ marginBottom: 10 }}>Icona ritratto</div>
        <div className="portrait-icon-grid" role="radiogroup" aria-label="Icona ritratto">
          <button
            role="radio"
            aria-checked={!chosenIcon}
            title={autoIcon ? 'Automatico (icona della classe)' : 'Automatico (iniziale del nome)'}
            className={`portrait-icon-option${!chosenIcon ? ' is-active' : ''}`}
            onClick={() => onChangeIcon(undefined)}
          >
            <span style={{ fontFamily: 'var(--font-rune)', fontSize: 10, letterSpacing: '0.08em' }}>AUTO</span>
          </button>
          {PORTRAIT_ICONS.map(icon => (
            <button
              key={icon.id}
              role="radio"
              aria-checked={chosenIcon === icon.id}
              aria-label={icon.name}
              title={icon.name}
              className={`portrait-icon-option${chosenIcon === icon.id ? ' is-active' : ''}`}
              onClick={() => onChangeIcon(icon.id)}
            >
              <PortraitIconMask id={icon.id} style={{ width: 30, height: 30 }} />
            </button>
          ))}
        </div>

        <div className="label-rune-soft" style={{ marginTop: 20, marginBottom: 10 }}>Colore Personaggio</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {CHARACTER_PALETTES.map(p => (
            <button
              key={p.id}
              title={p.name}
              aria-label={p.name}
              aria-pressed={accentColor === p.hex}
              onClick={() => onChangeColor(p.hex)}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: p.hex,
                border: accentColor === p.hex ? '2px solid white' : '2px solid transparent',
                cursor: 'pointer',
                padding: 0,
                outline: 'none',
                flexShrink: 0,
                boxShadow: accentColor === p.hex ? `0 0 0 1px rgba(255,255,255,0.5), 0 0 6px ${p.hex}` : 'none',
              }}
            />
          ))}
        </div>
        {accentColor && (
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{current?.name ?? ''}</span>
            <button className="pf-btn pf-btn-ghost" style={{ fontSize: 13, padding: '4px 10px' }} onClick={() => onChangeColor(undefined)}>
              Ripristina oro
            </button>
          </div>
        )}

        <div style={{ marginTop: 20, borderTop: '1px solid var(--line-soft)', paddingTop: 14 }}>
          <div className="label-rune-soft" style={{ marginBottom: 10 }}>Pericolo</div>
          <button
            className="pf-btn"
            style={{
              padding: '8px 14px',
              fontSize: 13,
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid var(--theme-hp-low)',
              color: 'var(--theme-hp-low)',
            }}
            onClick={onDelete}
          >
            🗑 Elimina personaggio
          </button>
        </div>
      </div>
    </div>
  );
}
