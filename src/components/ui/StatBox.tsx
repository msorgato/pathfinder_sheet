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
      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#c8a443' }}>
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
        <span className="text-xl font-bold" style={{ color: '#f5edd6' }}>{score}</span>
      )}
      <div
        className="modifier-badge text-sm"
        style={{
          color: mod >= 0 ? '#c8a443' : '#e57373',
          borderColor: mod >= 0 ? '#6b4226' : '#8b1a1a',
        }}
      >
        {modStr(mod)}
      </div>
    </div>
  );
}
