import { useState } from 'react';
import { getClass } from '../../data/classes';
import { useMergedFeats } from '../../store/dataStore';
import type { Character } from '../../types';

interface Props { char: Character }

export function FeaturesPanel({ char }: Props) {
  const [tab, setTab] = useState<'features' | 'feats'>('features');
  const mergedFeats = useMergedFeats();

  const allFeatures = char.classes.flatMap(e => {
    const cls = getClass(e.classId);
    if (!cls) return [];
    return cls.features
      .filter(f => f.level <= e.level)
      .map(f => ({ ...f, className: cls.name }));
  });

  const byLevel = allFeatures.reduce<Record<number, typeof allFeatures>>((acc, f) => {
    (acc[f.level] ??= []).push(f);
    return acc;
  }, {});

  const sortedLevels = Object.keys(byLevel).map(Number).sort((a, b) => a - b);

  return (
    <div className="space-y-3">
      <div className="flex gap-3 border-b" style={{ borderColor: 'var(--theme-ghost-border)' }}>
        <button
          onClick={() => setTab('features')}
          className="px-4 py-2 text-sm font-semibold border-b-2 transition-all"
          style={{
            borderColor: tab === 'features' ? 'var(--theme-accent)' : 'transparent',
            color: tab === 'features' ? 'var(--theme-accent)' : 'var(--theme-text-neutral)',
            background: 'transparent',
          }}
        >
          Capacità di Classe
        </button>
        <button
          onClick={() => setTab('feats')}
          className="px-4 py-2 text-sm font-semibold border-b-2 transition-all"
          style={{
            borderColor: tab === 'feats' ? 'var(--theme-accent)' : 'transparent',
            color: tab === 'feats' ? 'var(--theme-accent)' : 'var(--theme-text-neutral)',
            background: 'transparent',
          }}
        >
          Talenti ({char.feats.length})
        </button>
      </div>

      {tab === 'features' && (
        <div className="space-y-4">
          {sortedLevels.map(level => (
            <div key={level}>
              <div
                className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded mb-2"
                style={{ background: 'var(--theme-bg-panel)', color: 'var(--theme-border-strong)', borderLeft: '2px solid var(--theme-accent)' }}
              >
                Livello {level}
              </div>
              <div className="space-y-2 pl-2">
                {byLevel[level].map((f, i) => (
                  <div key={`${f.className}-${f.name}-${i}`} className="pf-panel p-3">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm" style={{ color: 'var(--theme-accent)' }}>{f.name}</span>
                          {f.type && (
                            <span
                              className="text-xs px-1 rounded"
                              style={{ background: 'var(--theme-bg-panel)', color: 'var(--theme-text-neutral)' }}
                            >
                              {f.type}
                            </span>
                          )}
                          <span className="text-xs" style={{ color: 'var(--theme-border)' }}>{f.className}</span>
                        </div>
                        <p className="text-xs mt-1" style={{ color: 'var(--theme-text-muted)' }}>{f.description}</p>
                        {f.choices && (
                          <div className="mt-1 text-xs" style={{ color: '#9b7fd4' }}>
                            Scelte: {f.choices.slice(0, 6).join(', ')}{f.choices.length > 6 ? '...' : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {sortedLevels.length === 0 && (
            <p className="text-sm text-center py-4" style={{ color: 'var(--theme-text-faint)' }}>
              Nessuna capacità di classe.
            </p>
          )}
        </div>
      )}

      {tab === 'feats' && (
        <div className="space-y-2">
          {char.feats.length === 0 && (
            <p className="text-sm text-center py-4" style={{ color: 'var(--theme-text-faint)' }}>Nessun talento.</p>
          )}
          {char.feats.map(featId => {
            const feat = mergedFeats.find(f => f.id === featId);
            return (
              <div key={featId} className="pf-panel p-3">
                <div className="flex items-start gap-2">
                  <div>
                    <div className="font-semibold text-sm" style={{ color: 'var(--theme-accent)' }}>
                      {feat?.name ?? featId}
                    </div>
                    {feat?.prerequisites && (
                      <div className="text-xs" style={{ color: 'var(--theme-border-strong)' }}>
                        Prerequisiti: {feat.prerequisites}
                      </div>
                    )}
                    <div className="text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                      {feat?.benefit ?? '—'}
                    </div>
                  </div>
                  <span
                    className="ml-auto text-xs px-1 rounded shrink-0"
                    style={{ background: 'var(--theme-bg-panel)', color: 'var(--theme-border-strong)' }}
                  >
                    {feat?.type ?? 'Generale'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
