import { useState } from 'react';
import { getClass } from '../../data/classes';
import { getFeat } from '../../data/feats';
import type { Character } from '../../types';

interface Props { char: Character }

export function FeaturesPanel({ char }: Props) {
  const [tab, setTab] = useState<'features' | 'feats'>('features');

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
      <div className="flex gap-3 border-b" style={{ borderColor: '#4b3620' }}>
        <button
          onClick={() => setTab('features')}
          className="px-4 py-2 text-sm font-semibold border-b-2 transition-all"
          style={{
            borderColor: tab === 'features' ? '#c8a443' : 'transparent',
            color: tab === 'features' ? '#c8a443' : '#9ca3af',
            background: 'transparent',
          }}
        >
          Capacità di Classe
        </button>
        <button
          onClick={() => setTab('feats')}
          className="px-4 py-2 text-sm font-semibold border-b-2 transition-all"
          style={{
            borderColor: tab === 'feats' ? '#c8a443' : 'transparent',
            color: tab === 'feats' ? '#c8a443' : '#9ca3af',
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
                style={{ background: '#2a1f0e', color: '#8b5e3c', borderLeft: '2px solid #c8a443' }}
              >
                Livello {level}
              </div>
              <div className="space-y-2 pl-2">
                {byLevel[level].map((f, i) => (
                  <div key={`${f.className}-${f.name}-${i}`} className="pf-panel p-3">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm" style={{ color: '#c8a443' }}>{f.name}</span>
                          {f.type && (
                            <span
                              className="text-xs px-1 rounded"
                              style={{ background: '#3a2a1a', color: '#9ca3af' }}
                            >
                              {f.type}
                            </span>
                          )}
                          <span className="text-xs" style={{ color: '#6b4226' }}>{f.className}</span>
                        </div>
                        <p className="text-xs mt-1" style={{ color: '#d1c5a8' }}>{f.description}</p>
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
            <p className="text-sm text-center py-4" style={{ color: '#8b8b6b' }}>
              Nessuna capacità di classe.
            </p>
          )}
        </div>
      )}

      {tab === 'feats' && (
        <div className="space-y-2">
          {char.feats.length === 0 && (
            <p className="text-sm text-center py-4" style={{ color: '#8b8b6b' }}>Nessun talento.</p>
          )}
          {char.feats.map(featId => {
            const feat = getFeat(featId);
            return (
              <div key={featId} className="pf-panel p-3">
                <div className="flex items-start gap-2">
                  <div>
                    <div className="font-semibold text-sm" style={{ color: '#c8a443' }}>
                      {feat?.name ?? featId}
                    </div>
                    {feat?.prerequisites && (
                      <div className="text-xs" style={{ color: '#8b5e3c' }}>
                        Prerequisiti: {feat.prerequisites}
                      </div>
                    )}
                    <div className="text-xs mt-0.5" style={{ color: '#d1c5a8' }}>
                      {feat?.benefit ?? '—'}
                    </div>
                  </div>
                  <span
                    className="ml-auto text-xs px-1 rounded shrink-0"
                    style={{ background: '#3a2a1a', color: '#8b5e3c' }}
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
