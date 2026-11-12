import { useEffect, useState } from 'react';
import type { Stat } from '../../utils/derivedStats';
import { BONUS_TYPE_LABELS } from '../../data/modifierLabels';

const signed = (v: number) => (v >= 0 ? `+${v}` : `${v}`);

/**
 * Small "±" button shown next to a value affected by modifiers; opens the list
 * of sources (applied and suppressed by stacking). Renders nothing otherwise.
 */
export function StatBreakdown({ label, stat, format = signed, inline = false }: {
  label: string;
  stat: Stat;
  format?: (v: number) => string;
  /** Render in the text flow instead of the top-right corner of the parent tile. */
  inline?: boolean;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  if (stat.applied.length === 0 && stat.suppressed.length === 0) return null;

  return (
    <>
      <button
        type="button"
        className={`stat-breakdown-btn${inline ? ' is-inline' : ''}`}
        aria-label={`Dettaglio ${label}`}
        title="Dettaglio modificatori"
        onClick={e => { e.stopPropagation(); setOpen(true); }}
      >
        ±
      </button>
      {open && (
        <div
          className="customize-overlay"
          onMouseDown={e => { e.stopPropagation(); if (e.target === e.currentTarget) setOpen(false); }}
          onClick={e => e.stopPropagation()}
        >
          <div className="pf-panel" role="dialog" aria-modal="true" aria-label={`Dettaglio ${label}`}
            style={{ width: '100%', maxWidth: 360, padding: 18, boxShadow: '0 8px 40px rgba(0,0,0,0.7)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div className="label-rune">{label}</div>
              <button className="btn btn-ghost btn-icon" aria-label="Chiudi" autoFocus onClick={() => setOpen(false)}>✕</button>
            </div>
            <table className="breakdown-table">
              <tbody>
                <tr><td>Base</td><td>{format(stat.base)}</td></tr>
                {stat.applied.map((e, i) => (
                  <tr key={i} className={e.value >= 0 ? 'is-buffed' : 'is-debuffed'}>
                    <td>{e.source}{e.type && e.type !== 'untyped' ? <em> · {BONUS_TYPE_LABELS[e.type]}</em> : null}</td>
                    <td>{signed(e.value)}</td>
                  </tr>
                ))}
                <tr className="breakdown-total"><td>Totale</td><td>{format(stat.total)}</td></tr>
              </tbody>
            </table>
            {stat.suppressed.length > 0 && (
              <>
                <div className="label-rune-soft" style={{ margin: '14px 0 6px' }}>Non cumulati</div>
                <table className="breakdown-table is-suppressed">
                  <tbody>
                    {stat.suppressed.map((e, i) => (
                      <tr key={i}>
                        <td>{e.source}{e.type ? <em> · {BONUS_TYPE_LABELS[e.type]}</em> : null}</td>
                        <td>{signed(e.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
