import { useState } from 'react';
import { CLASSES, isBuiltinClass } from '../../data/classes';
import { useDataStore } from '../../store/dataStore';
import { WizardLayout } from './WizardLayout';

interface Props {
  selectedClassId: string;
  onSelect: (classId: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const BAB_LABEL: Record<string, string> = {
  full: 'Pieno', 'three-quarters': '¾', half: '½',
};

function babLabel(bab: unknown): string {
  if (Array.isArray(bab)) return 'Pers.';
  return BAB_LABEL[bab as string] ?? '?';
}

export function Step2_Class({ selectedClassId, onSelect, onNext, onBack }: Props) {
  const [classId, setClassId] = useState(selectedClassId);
  const publishedCustomClasses = useDataStore(s => s.publishedCustomClasses);
  const allClasses = [...CLASSES, ...publishedCustomClasses];
  const cls = allClasses.find(c => c.id === classId);

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
        {allClasses.map(c => (
          <button
            key={c.id}
            onClick={() => setClassId(c.id)}
            className="pf-panel p-3 text-left transition-all"
            style={{
              borderColor: classId === c.id ? 'var(--theme-accent)' : 'var(--theme-border)',
              boxShadow: classId === c.id ? '0 0 8px rgba(200,164,67,0.25)' : 'none',
            }}
          >
            <div className="font-bold" style={{ fontSize: 15, color: 'var(--theme-accent)' }}>{c.name}</div>
            <div className="mt-1 flex gap-2" style={{ fontSize: 13, color: 'var(--theme-text-neutral)' }}>
              <span>d{c.hitDie}</span>
              <span>BAB {babLabel(c.bab)}</span>
              {isBuiltinClass(c)
                ? c.spellcasting && <span style={{ color: '#9b7fd4' }}>✨</span>
                : c.spellcasting?.enabled && <span style={{ color: '#9b7fd4' }}>✨</span>}
            </div>
          </button>
        ))}
      </div>

      {cls && (
        <div className="pf-panel p-5 space-y-4">
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--theme-accent)' }}>{cls.name}</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--theme-text-muted)' }}>{cls.description}</p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            {[
              ['Dado Vita', `d${cls.hitDie}`],
              ['BAB', babLabel(cls.bab)],
              ['Abilità/LV', String(cls.skillsPerLevel)],
            ].map(([label, val]) => (
              <div key={label} className="stat-box py-2">
                <div className="text-xs uppercase tracking-wider" style={{ color: 'var(--theme-border-strong)' }}>{label}</div>
                <div className="font-bold" style={{ color: 'var(--theme-text)' }}>{val}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            {(['fort', 'ref', 'will'] as const).map(save => {
              const prog = cls.saves[save];
              const isArr = Array.isArray(prog);
              const isGood = !isArr && prog === 'good';
              return (
                <div key={save} className="stat-box py-2">
                  <div className="text-xs uppercase" style={{ color: 'var(--theme-border-strong)' }}>
                    {save === 'fort' ? 'Tempra' : save === 'ref' ? 'Riflessi' : 'Volontà'}
                  </div>
                  <div className="font-bold" style={{ color: isGood ? 'var(--theme-hp-high)' : 'var(--theme-text-neutral)' }}>
                    {isArr ? 'Pers.' : (isGood ? 'Alta' : 'Bassa')}
                  </div>
                </div>
              );
            })}
          </div>

          {isBuiltinClass(cls) && cls.spellcasting && (
            <div className="p-3 rounded text-sm" style={{ background: 'var(--theme-bg)', border: '1px solid #4b3080' }}>
              <div className="font-semibold mb-1" style={{ color: '#9b7fd4' }}>✨ Incantatore</div>
              <div style={{ color: 'var(--theme-text-muted)' }}>
                {cls.spellcasting.type === 'prepared' ? 'Preparato' : 'Spontaneo'} ·{' '}
                {cls.spellcasting.school === 'arcane' ? 'Arcano' : 'Divino'} ·{' '}
                Caratteristica:{' '}
                {cls.spellcasting.ability.toUpperCase()} ·{' '}
                Max livello {cls.spellcasting.maxSpellLevel}°
              </div>
            </div>
          )}
          {!isBuiltinClass(cls) && cls.spellcasting?.enabled && (
            <div className="p-3 rounded text-sm" style={{ background: 'var(--theme-bg)', border: '1px solid #4b3080' }}>
              <div className="font-semibold" style={{ color: '#9b7fd4' }}>✨ Incantatore</div>
              {cls.spellcasting.sourceList && (
                <div style={{ color: 'var(--theme-text-muted)' }}>Lista: {cls.spellcasting.sourceList}</div>
              )}
            </div>
          )}

          <div>
            <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--theme-border-strong)' }}>
              Capacità al 1° livello
            </div>
            <div className="space-y-1">
              {cls.features.filter(f => f.level === 1).map((f, i) => (
                <div key={f.name + i} className="text-sm">
                  <span className="font-semibold" style={{ color: 'var(--theme-accent)' }}>{f.name}</span>
                  {f.type && <span className="ml-1 text-xs px-1 rounded" style={{ background: 'var(--theme-bg-panel)', color: 'var(--theme-text-neutral)' }}>{f.type}</span>}
                  <span style={{ color: 'var(--theme-text-muted)' }}>: {f.description}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs" style={{ color: 'var(--theme-text-faint)' }}>
            <strong>Competenze armature:</strong> {cls.armorProficiencies.join(', ')} ·{' '}
            <strong>Armi:</strong> {cls.weaponProficiencies}
          </div>
        </div>
      )}
    </WizardLayout>
  );
}
