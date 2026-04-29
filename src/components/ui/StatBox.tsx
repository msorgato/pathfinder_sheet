import { abilityMod, modStr } from '../../utils/calculations';

interface Props {
  label: string;
  score: number;
  onChange?: (v: number) => void;
  size?: 'sm' | 'md' | 'lg';
}

export function StatBox({ label, score, onChange, size = 'md' }: Props) {
  const mod = abilityMod(score);
  const sizeClass = size === 'lg' ? 'w-24' : size === 'sm' ? 'w-16' : 'w-20';

  return (
    <div className={`stat-box ${sizeClass} flex flex-col items-center gap-1`}>
      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--theme-accent)' }}>
        {label}
      </span>
      {onChange ? (
        <input
          type="number"
          className="pf-input text-center text-xl font-bold w-14"
          value={score}
          min={3}
          max={30}
          onChange={e => onChange(Number(e.target.value))}
        />
      ) : (
        <span className="text-xl font-bold" style={{ color: 'var(--theme-text)' }}>{score}</span>
      )}
      <div
        className="modifier-badge text-sm"
        style={{
          color: mod >= 0 ? 'var(--theme-accent)' : '#e57373',
          borderColor: mod >= 0 ? 'var(--theme-border)' : 'var(--theme-danger)',
        }}
      >
        {modStr(mod)}
      </div>
    </div>
  );
}
