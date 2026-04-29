import { useState } from 'react';
import { useMergedFeats } from '../../store/dataStore';
import { getRace } from '../../data/races';
import { WizardLayout } from './WizardLayout';

interface Props {
  raceId: string;
  selectedFeats: string[];
  onChange: (feats: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step5_Feats({ raceId, selectedFeats, onChange, onNext, onBack }: Props) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('All');
  const FEATS = useMergedFeats();

  const race = getRace(raceId);
  const bonusFeat = race?.bonusFeat ? 1 : 0;
  const totalFeats = 1 + bonusFeat; // level 1 feat + racial bonus feat

  const filtered = FEATS.filter(f => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.benefit.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || f.type === filter;
    return matchSearch && matchFilter;
  });

  const types = ['All', 'Combat', 'General', 'Metamagic'];

  const toggle = (id: string) => {
    if (selectedFeats.includes(id)) {
      onChange(selectedFeats.filter(f => f !== id));
    } else if (selectedFeats.length < totalFeats) {
      onChange([...selectedFeats, id]);
    }
  };

  return (
    <WizardLayout
      step={5} totalSteps={7}
      title="Scegli i Talenti"
      onBack={onBack} onNext={onNext}
      nextDisabled={selectedFeats.length < 1}
    >
      <div className="pf-panel p-3 mb-4 flex items-center justify-between">
        <span className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
          Talenti da scegliere: {totalFeats}
          {bonusFeat > 0 && <span style={{ color: 'var(--theme-accent)' }}> (incluso 1 bonus razza)</span>}
        </span>
        <span
          className="text-xl font-bold"
          style={{ color: selectedFeats.length === totalFeats ? 'var(--theme-hp-high)' : 'var(--theme-accent)' }}
        >
          {selectedFeats.length}/{totalFeats}
        </span>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-3">
        {types.map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className="pf-btn text-xs px-3 py-1"
            style={{
              background: filter === t ? 'var(--theme-accent)' : 'var(--theme-bg-panel)',
              color: filter === t ? 'var(--theme-bg)' : 'var(--theme-text)',
              border: `1px solid ${filter === t ? 'var(--theme-accent)' : 'var(--theme-border)'}`,
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <input
        className="pf-input mb-4"
        placeholder="Cerca talento..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {/* Selected feats */}
      {selectedFeats.length > 0 && (
        <div className="mb-4">
          <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--theme-hp-high)' }}>
            Selezionati
          </div>
          <div className="space-y-1">
            {selectedFeats.map(fid => {
              const f = FEATS.find(ft => ft.id === fid);
              if (!f) return null;
              return (
                <div
                  key={fid}
                  className="flex items-center gap-2 p-2 rounded cursor-pointer"
                  style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid #2d6b3a' }}
                  onClick={() => toggle(fid)}
                >
                  <span className="text-sm font-semibold" style={{ color: 'var(--theme-hp-high)' }}>{f.name}</span>
                  <span className="text-xs ml-auto" style={{ color: 'var(--theme-border)' }}>✕ rimuovi</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(f => {
          const isSelected = selectedFeats.includes(f.id);
          if (isSelected) return null;
          return (
            <button
              key={f.id}
              onClick={() => toggle(f.id)}
              className="w-full text-left pf-panel p-3 transition-all"
              style={{
                opacity: selectedFeats.length >= totalFeats ? 0.5 : 1,
                cursor: selectedFeats.length >= totalFeats ? 'not-allowed' : 'pointer',
              }}
              disabled={selectedFeats.length >= totalFeats}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-semibold text-sm" style={{ color: 'var(--theme-accent)' }}>{f.name}</span>
                  <span
                    className="ml-2 text-xs px-1 rounded"
                    style={{ background: 'var(--theme-bg-panel)', color: 'var(--theme-border-strong)' }}
                  >
                    {f.type}
                  </span>
                  {f.repeatable && (
                    <span className="ml-1 text-xs px-1 rounded" style={{ background: 'var(--theme-bg-panel)', color: 'var(--theme-text-faint)' }}>
                      ripetibile
                    </span>
                  )}
                </div>
              </div>
              {f.prerequisites && (
                <div className="text-xs mt-0.5" style={{ color: 'var(--theme-border-strong)' }}>
                  Prerequisiti: {f.prerequisites}
                </div>
              )}
              <div className="text-xs mt-1" style={{ color: 'var(--theme-text-muted)' }}>{f.benefit}</div>
            </button>
          );
        })}
      </div>
    </WizardLayout>
  );
}
