interface Props {
  step: number;
  totalSteps: number;
  title: string;
  children: React.ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
}

const STEPS = ['Razza', 'Classe', 'Caratteristiche', 'Abilità', 'Talenti', 'Incantesimi', 'Dettagli'];

export function WizardLayout({
  step, totalSteps, title, children, onBack, onNext,
  nextLabel = 'Avanti', nextDisabled = false,
}: Props) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--theme-bg)' }}>
      {/* Header */}
      <div className="pf-header px-6 py-4">
        <h1 className="font-bold" style={{ fontSize: 26, color: 'var(--theme-text)', fontFamily: 'Georgia, serif' }}>
          ⚔️ Creazione Personaggio
        </h1>
        <p style={{ fontSize: 15, marginTop: 4, color: 'var(--theme-accent)' }}>{title}</p>
      </div>

      {/* Progress bar */}
      <div className="px-6 py-3" style={{ background: 'var(--theme-bg-panel)', borderBottom: '1px solid var(--theme-border)' }}>
        <div className="flex gap-1 mb-2">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className="flex-1 h-1.5 rounded-full transition-all"
              style={{
                background: i < step ? 'var(--theme-accent)' : i === step - 1 ? 'var(--theme-border-strong)' : 'var(--theme-ghost-border)',
              }}
            />
          ))}
        </div>
        <div className="flex gap-4 overflow-x-auto">
          {STEPS.map((s, i) => (
            <span
              key={s}
              className="whitespace-nowrap"
              style={{
                fontSize: 13,
                color: i === step - 1 ? 'var(--theme-accent)' : i < step ? 'var(--theme-text-faint)' : 'var(--ink-mute)',
                fontWeight: i === step - 1 ? 700 : 400,
              }}
            >
              {i + 1}. {s}
            </span>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-3xl mx-auto w-full">
        {children}
      </div>

      {/* Footer buttons */}
      <div
        className="px-6 py-4 flex justify-between gap-4"
        style={{ background: 'var(--theme-bg-panel)', borderTop: '1px solid var(--theme-border)' }}
      >
        <button className="pf-btn pf-btn-ghost" onClick={onBack} disabled={!onBack}>
          ← Indietro
        </button>
        <button
          className="pf-btn pf-btn-gold"
          onClick={onNext}
          disabled={nextDisabled || !onNext}
        >
          {nextLabel} →
        </button>
      </div>
    </div>
  );
}
