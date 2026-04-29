import { useState } from 'react';
import type { Alignment } from '../../types';
import { WizardLayout } from './WizardLayout';

const ALIGNMENTS: { id: Alignment; label: string; desc: string }[] = [
  { id: 'LG', label: 'Legale Buono', desc: 'Onore e virtù' },
  { id: 'NG', label: 'Neutrale Buono', desc: 'Bontà senza leggi' },
  { id: 'CG', label: 'Caotico Buono', desc: 'Libertà e bontà' },
  { id: 'LN', label: 'Legale Neutrale', desc: 'Ordine sopra tutto' },
  { id: 'TN', label: 'Neutrale', desc: 'Equilibrio' },
  { id: 'CN', label: 'Caotico Neutrale', desc: 'Libertà assoluta' },
  { id: 'LE', label: 'Legale Malvagio', desc: 'Potere tramite ordine' },
  { id: 'NE', label: 'Neutrale Malvagio', desc: 'Il male puro' },
  { id: 'CE', label: 'Caotico Malvagio', desc: 'Distruzione e caos' },
];

const AL_COLORS: Record<Alignment, string> = {
  LG: 'var(--theme-hp-high)', NG: '#86efac', CG: '#6ee7b7',
  LN: '#93c5fd', TN: '#d1d5db', CN: '#c4b5fd',
  LE: '#fca5a5', NE: '#f87171', CE: 'var(--theme-hp-low)',
};

interface Details {
  name: string;
  playerName: string;
  alignment: Alignment;
  deity: string;
  gender: string;
  age: string;
  height: string;
  weight: string;
  hair: string;
  eyes: string;
  background: string;
}

interface Props {
  details: Partial<Details>;
  onChange: (d: Partial<Details>) => void;
  onFinish: () => void;
  onBack: () => void;
}

export function Step7_Details({ details, onChange, onFinish, onBack }: Props) {
  const upd = (key: keyof Details, val: string) => onChange({ ...details, [key]: val });

  const canFinish = !!(details.name && details.alignment);

  return (
    <WizardLayout
      step={7} totalSteps={7}
      title="Dettagli del Personaggio"
      onBack={onBack}
      onNext={onFinish}
      nextLabel="Crea Personaggio ✨"
      nextDisabled={!canFinish}
    >
      <div className="space-y-5">
        {/* Identity */}
        <div className="pf-panel p-4">
          <h3 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--theme-accent)' }}>
            Identità
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs mb-1 block" style={{ color: 'var(--theme-border-strong)' }}>
                Nome Personaggio *
              </label>
              <input
                className="pf-input"
                value={details.name ?? ''}
                onChange={e => upd('name', e.target.value)}
                placeholder="Es. Aldric Stormblade"
              />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--theme-border-strong)' }}>Nome Giocatore</label>
              <input className="pf-input" value={details.playerName ?? ''} onChange={e => upd('playerName', e.target.value)} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--theme-border-strong)' }}>Divinità</label>
              <input className="pf-input" value={details.deity ?? ''} onChange={e => upd('deity', e.target.value)} placeholder="Es. Iomedae" />
            </div>
          </div>
        </div>

        {/* Alignment */}
        <div className="pf-panel p-4">
          <h3 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--theme-accent)' }}>
            Allineamento *
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {ALIGNMENTS.map(al => (
              <button
                key={al.id}
                onClick={() => upd('alignment', al.id)}
                className="p-2 rounded text-left transition-all"
                style={{
                  background: details.alignment === al.id ? AL_COLORS[al.id] + '33' : '#1a1209',
                  border: `1px solid ${details.alignment === al.id ? AL_COLORS[al.id] : '#4b3620'}`,
                }}
              >
                <div className="text-xs font-bold" style={{ color: AL_COLORS[al.id] }}>
                  {al.id}
                </div>
                <div className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>{al.label}</div>
                <div className="text-xs" style={{ color: 'var(--theme-text-faint)' }}>{al.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Physical */}
        <div className="pf-panel p-4">
          <h3 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--theme-accent)' }}>
            Aspetto Fisico
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              ['Genere', 'gender'],
              ['Età', 'age'],
              ['Altezza', 'height'],
              ['Peso', 'weight'],
              ['Capelli', 'hair'],
              ['Occhi', 'eyes'],
            ].map(([label, key]) => (
              <div key={key}>
                <label className="text-xs mb-1 block" style={{ color: 'var(--theme-border-strong)' }}>{label}</label>
                <input
                  className="pf-input"
                  value={(details as Record<string, string>)[key] ?? ''}
                  onChange={e => upd(key as keyof Details, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Background */}
        <div className="pf-panel p-4">
          <h3 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--theme-accent)' }}>
            Background / Storia
          </h3>
          <textarea
            className="pf-input resize-none"
            rows={4}
            value={details.background ?? ''}
            onChange={e => upd('background', e.target.value)}
            placeholder="Racconta la storia del tuo personaggio..."
          />
        </div>
      </div>
    </WizardLayout>
  );
}
