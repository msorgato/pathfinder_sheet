import { useState } from 'react';
import { CLASSES } from '../../data/classes';
import type { ClassDefinition } from '../../types';
import { WizardLayout } from './WizardLayout';

interface Props {
  selectedClassId: string;
  onSelect: (classId: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step2_Class({ selectedClassId, onSelect, onNext, onBack }: Props) {
  const [classId, setClassId] = useState(selectedClassId);
  const cls = CLASSES.find(c => c.id === classId);

  const BAB_LABEL: Record<string, string> = {
    full: 'Pieno', 'three-quarters': '¾', half: '½',
  };
  const SAVE_ICON = (s: string) => s === 'good' ? '✓' : '–';

  const handleCommit = () => {
    onSelect(classId);
    onNext();
  };

  return (
    <WizardLayout
      step={2} totalSteps={7}
      title="Scegli la tua Classe"
      onBack={onBack} onNext={handleCommit}
      nextDisabled={!classId}
    >
      <div className="grid grid-cols-2 gap-2 mb-5">
        {CLASSES.map(c => (
          <button
            key={c.id}
            onClick={() => setClassId(c.id)}
            className="pf-panel p-3 text-left transition-all"
            style={{
              borderColor: classId === c.id ? '#c8a443' : '#6b4226',
              boxShadow: classId === c.id ? '0 0 8px rgba(200,164,67,0.25)' : 'none',
            }}
          >
            <div className="font-bold text-sm" style={{ color: '#c8a443' }}>{c.name}</div>
            <div className="text-xs mt-1 flex gap-2" style={{ color: '#9ca3af' }}>
              <span>d{c.hitDie}</span>
              <span>BAB {BAB_LABEL[c.bab]}</span>
              {c.spellcasting && <span style={{ color: '#9b7fd4' }}>✨</span>}
            </div>
          </button>
        ))}
      </div>

      {cls && (
        <div className="pf-panel p-5 space-y-4">
          <div>
            <h2 className="text-lg font-bold" style={{ color: '#c8a443' }}>{cls.name}</h2>
            <p className="text-sm mt-1" style={{ color: '#d1c5a8' }}>{cls.description}</p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            {[
              ['Dado Vita', `d${cls.hitDie}`],
              ['BAB', BAB_LABEL[cls.bab]],
              ['Abilità/LV', String(cls.skillsPerLevel)],
            ].map(([label, val]) => (
              <div key={label} className="stat-box py-2">
                <div className="text-xs uppercase tracking-wider" style={{ color: '#8b5e3c' }}>{label}</div>
                <div className="font-bold" style={{ color: '#f5edd6' }}>{val}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            {(['fort', 'ref', 'will'] as const).map(save => (
              <div key={save} className="stat-box py-2">
                <div className="text-xs uppercase" style={{ color: '#8b5e3c' }}>
                  {save === 'fort' ? 'Tempra' : save === 'ref' ? 'Riflessi' : 'Volontà'}
                </div>
                <div
                  className="font-bold"
                  style={{ color: cls.saves[save] === 'good' ? '#4ade80' : '#9ca3af' }}
                >
                  {cls.saves[save] === 'good' ? 'Alta' : 'Bassa'}
                </div>
              </div>
            ))}
          </div>

          {cls.spellcasting && (
            <div className="p-3 rounded text-sm" style={{ background: '#1a1209', border: '1px solid #4b3080' }}>
              <div className="font-semibold mb-1" style={{ color: '#9b7fd4' }}>✨ Incantatore</div>
              <div style={{ color: '#d1c5a8' }}>
                {cls.spellcasting.type === 'prepared' ? 'Preparato' : 'Spontaneo'} ·{' '}
                {cls.spellcasting.school === 'arcane' ? 'Arcano' : 'Divino'} ·{' '}
                Caratteristica:{' '}
                {cls.spellcasting.ability.toUpperCase()} ·{' '}
                Max livello {cls.spellcasting.maxSpellLevel}°
              </div>
            </div>
          )}

          <div>
            <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#8b5e3c' }}>
              Capacità al 1° livello
            </div>
            <div className="space-y-1">
              {cls.features.filter(f => f.level === 1).map(f => (
                <div key={f.name} className="text-sm">
                  <span className="font-semibold" style={{ color: '#c8a443' }}>{f.name}</span>
                  {f.type && <span className="ml-1 text-xs px-1 rounded" style={{ background: '#3a2a1a', color: '#9ca3af' }}>{f.type}</span>}
                  <span style={{ color: '#d1c5a8' }}>: {f.description}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs" style={{ color: '#8b8b6b' }}>
            <strong>Competenze armature:</strong> {cls.armorProficiencies.join(', ')} ·{' '}
            <strong>Armi:</strong> {cls.weaponProficiencies}
          </div>
        </div>
      )}
    </WizardLayout>
  );
}
