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
    <div className="min-h-screen flex flex-col" style={{ background: '#1a1209' }}>
      {/* Header */}
      <div className="pf-header px-6 py-4">
        <h1 className="text-2xl font-bold" style={{ color: '#f5edd6', fontFamily: 'Georgia, serif' }}>
          ⚔️ Creazione Personaggio
        </h1>
        <p className="text-sm mt-1" style={{ color: '#c8a443' }}>{title}</p>
      </div>

      {/* Progress bar */}
      <div className="px-6 py-3" style={{ background: '#2a1f0e', borderBottom: '1px solid #6b4226' }}>
        <div className="flex gap-1 mb-2">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className="flex-1 h-1.5 rounded-full transition-all"
              style={{
                background: i < step ? '#c8a443' : i === step - 1 ? '#8b5e3c' : '#4b3620',
              }}
            />
          ))}
        </div>
        <div className="flex gap-4 overflow-x-auto">
          {STEPS.map((s, i) => (
            <span
              key={s}
              className="text-xs whitespace-nowrap"
              style={{
                color: i === step - 1 ? '#c8a443' : i < step ? '#8b8b6b' : '#4b3620',
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
        style={{ background: '#2a1f0e', borderTop: '1px solid #6b4226' }}
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
