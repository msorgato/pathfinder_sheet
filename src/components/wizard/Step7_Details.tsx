import { useState } from 'react';
import type { Alignment } from '../../types';
import { WizardLayout } from './WizardLayout';
import { getAgeCategory, getAgeThresholds, AGE_MODIFIERS, AGE_CATEGORY_LABELS } from '../../data/ageModifiers';

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

const CATEGORY_COLORS = {
  middle:    { bg: 'rgba(250,204,21,0.15)',  border: '#ca8a04', text: '#fbbf24' },
  old:       { bg: 'rgba(249,115,22,0.15)',  border: '#c2410c', text: '#fb923c' },
  venerable: { bg: 'rgba(239,68,68,0.15)',   border: '#b91c1c', text: '#f87171' },
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
  raceId: string;
  details: Partial<Details>;
  onChange: (d: Partial<Details>) => void;
  onFinish: () => void;
  onBack: () => void;
}

export function Step7_Details({ raceId, details, onChange, onFinish, onBack }: Props) {
  const upd = (key: keyof Details, val: string) => onChange({ ...details, [key]: val });

  const canFinish = !!(details.name && details.alignment);

  const ageNum = details.age ? parseInt(details.age, 10) : NaN;
  const ageCategory = !isNaN(ageNum) && ageNum > 0 ? getAgeCategory(raceId, ageNum) : null;
  const ageThresholds = getAgeThresholds(raceId);

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

          {/* Age — standalone row with category feedback */}
          <div className="mb-3">
            <label className="text-xs mb-1 block" style={{ color: 'var(--theme-border-strong)' }}>Età (anni)</label>
            <div className="flex items-center gap-3">
              <input
                className="pf-input"
                style={{ width: 100 }}
                type="number"
                min={1}
                value={details.age ?? ''}
                onChange={e => upd('age', e.target.value)}
                placeholder="Es. 25"
              />
              {ageCategory && (
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded"
                  style={{
                    background: CATEGORY_COLORS[ageCategory].bg,
                    border: `1px solid ${CATEGORY_COLORS[ageCategory].border}`,
                    color: CATEGORY_COLORS[ageCategory].text,
                  }}
                >
                  {AGE_CATEGORY_LABELS[ageCategory]}
                </span>
              )}
            </div>

            {/* Age modifier preview */}
            {ageCategory && (
              <div
                className="mt-2 p-2 rounded text-xs"
                style={{
                  background: CATEGORY_COLORS[ageCategory].bg,
                  border: `1px solid ${CATEGORY_COLORS[ageCategory].border}`,
                }}
              >
                <div className="font-semibold mb-1" style={{ color: CATEGORY_COLORS[ageCategory].text }}>
                  Modificatori età applicati:
                </div>
                <div className="flex gap-3 flex-wrap" style={{ color: 'var(--theme-text-muted)' }}>
                  {(['str', 'dex', 'con'] as const).map(k => (
                    <span key={k}>
                      <span style={{ color: 'var(--theme-text-faint)', textTransform: 'uppercase' }}>{k} </span>
                      <span style={{ color: '#f87171', fontWeight: 700 }}>
                        {AGE_MODIFIERS[ageCategory][k]}
                      </span>
                    </span>
                  ))}
                  {(['int', 'wis', 'cha'] as const).map(k => (
                    <span key={k}>
                      <span style={{ color: 'var(--theme-text-faint)', textTransform: 'uppercase' }}>{k} </span>
                      <span style={{ color: 'var(--theme-hp-high)', fontWeight: 700 }}>
                        +{AGE_MODIFIERS[ageCategory][k]}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Thresholds hint for known races */}
            {ageThresholds && !ageCategory && (
              <div className="mt-1.5 text-xs" style={{ color: 'var(--theme-text-faint)' }}>
                Soglie: mezz'età {ageThresholds.middle} · vecchiaia {ageThresholds.old} · venerabile {ageThresholds.venerable}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {([
              ['Genere', 'gender'],
              ['Altezza', 'height'],
              ['Peso', 'weight'],
              ['Capelli', 'hair'],
              ['Occhi', 'eyes'],
            ] as [string, keyof Details][]).map(([label, key]) => (
              <div key={key}>
                <label className="text-xs mb-1 block" style={{ color: 'var(--theme-border-strong)' }}>{label}</label>
                <input
                  className="pf-input"
                  value={(details[key] as string) ?? ''}
                  onChange={e => upd(key, e.target.value)}
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
