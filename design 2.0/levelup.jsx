const { useState: useStateLU } = React;

const LEVEL_UP_STEPS = [
  { id: "hp", label: "Punti Ferita" },
  { id: "ability", label: "Caratteristica" },
  { id: "feat", label: "Talento" },
  { id: "abilities", label: "Abilità" },
  { id: "celebrate", label: "Suggella" },
];

const FEATS = [
  { id: "cleave", name: "Affondo", bonus: "Talento di combattimento", desc: "Dopo aver mancato un avversario in mischia, esegui un attacco gratuito contro un altro nemico adiacente." },
  { id: "weaponfocus", name: "Arma Focalizzata", bonus: "+1 colpire", desc: "+1 ai tiri per colpire con un'arma scelta. Scegli un'arma specifica per beneficiare di questo talento." },
  { id: "powerattack", name: "Attacco Poderoso", bonus: "+2 danno / -1 colpire", desc: "Sacrifichi precisione per potenza: -1 ai tiri per colpire ma +2 ai danni in mischia." },
  { id: "dodge", name: "Schivare", bonus: "+1 CA", desc: "+1 schivare alla Classe Armatura. Si perde quando vieni colto alla sprovvista." },
];

const ABILITY_CHOICES = ["FOR", "DES", "COS", "INT", "SAG", "CAR"];

const LevelUpFlow = ({ character, onClose, onConfirm }) => {
  const [stepIdx, setStepIdx] = useStateLU(0);
  const [hpRoll, setHpRoll] = useStateLU(null);
  const [abilityChoice, setAbilityChoice] = useStateLU(null);
  const [featChoice, setFeatChoice] = useStateLU(null);

  const step = LEVEL_UP_STEPS[stepIdx];
  const next = () => setStepIdx(i => Math.min(i + 1, LEVEL_UP_STEPS.length - 1));
  const prev = () => setStepIdx(i => Math.max(i - 1, 0));

  const canAdvance = (() => {
    if (step.id === "hp") return hpRoll !== null;
    if (step.id === "ability") return abilityChoice !== null;
    if (step.id === "feat") return featChoice !== null;
    return true;
  })();

  const rollHp = () => {
    const r = Math.floor(Math.random() * 10) + 1; // d10 for fighter
    setHpRoll(r);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal frame-corners-4" onClick={e => e.stopPropagation()}>
        <span className="corner tl"></span><span className="corner tr"></span><span className="corner bl"></span><span className="corner br"></span>

        <div className="modal-head">
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ color: "var(--gold)" }}>
              <Sigil size={28} variant="ouroboros" />
            </div>
            <div>
              <div className="label-rune-soft">Rituale di ascensione</div>
              <h2 className="display-m" style={{ margin: 0 }}>{character.name} sale di livello</h2>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* steps */}
          <div className="steps">
            {LEVEL_UP_STEPS.map((s, i) => (
              <React.Fragment key={s.id}>
                <div className={`step ${i === stepIdx ? "active" : ""} ${i < stepIdx ? "done" : ""}`}>
                  <div className="step-node">
                    <div className="inner">{i < stepIdx ? "✓" : i + 1}</div>
                  </div>
                  <div className="step-label">{s.label}</div>
                </div>
                {i < LEVEL_UP_STEPS.length - 1 && <div className="step-line" />}
              </React.Fragment>
            ))}
          </div>

          {step.id === "hp" && (
            <HpStep character={character} hpRoll={hpRoll} onRoll={rollHp} />
          )}
          {step.id === "ability" && (
            <AbilityStep character={character} choice={abilityChoice} setChoice={setAbilityChoice} />
          )}
          {step.id === "feat" && (
            <FeatStep character={character} choice={featChoice} setChoice={setFeatChoice} />
          )}
          {step.id === "abilities" && (
            <AbilitiesStep character={character} />
          )}
          {step.id === "celebrate" && (
            <CelebrateStep character={character} hpRoll={hpRoll} abilityChoice={abilityChoice} featChoice={FEATS.find(f => f.id === featChoice)} />
          )}
        </div>

        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={stepIdx === 0 ? onClose : prev}>
            {stepIdx === 0 ? "Annulla" : "Indietro"}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontFamily: "var(--font-rune)", fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", color: "var(--ink-mute)" }}>
              Passo {stepIdx + 1} di {LEVEL_UP_STEPS.length}
            </span>
            {stepIdx < LEVEL_UP_STEPS.length - 1 ? (
              <button className="btn btn-primary" onClick={next} disabled={!canAdvance} style={{ opacity: canAdvance ? 1 : 0.4 }}>
                <span>Continua</span>
                <Icon name="arrowRight" size={14} />
              </button>
            ) : (
              <button className="btn btn-primary" onClick={onConfirm}>
                <span>Suggella il rituale</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const HpStep = ({ character, hpRoll, onRoll }) => {
  const conMod = Math.floor((character.stats.COS - 10) / 2);
  return (
    <div>
      <div className="label-rune" style={{ marginBottom: 8 }}>Passo I · Vitalità</div>
      <h3 className="display-l" style={{ margin: "0 0 16px" }}>Tira il dado della vita</h3>
      <p style={{ color: "var(--ink-soft)", fontFamily: "var(--font-display)", fontSize: 16, lineHeight: 1.6, maxWidth: 600 }}>
        Il tuo dado della vita per la classe Guerriero è un <span style={{ color: "var(--gold)" }}>d10</span>. Aggiungi il modificatore di Costituzione ({fmt(conMod)}) al risultato.
      </p>

      <div style={{ display: "flex", gap: 32, alignItems: "center", marginTop: 32, padding: "32px 24px", background: "linear-gradient(180deg, var(--bg-base), var(--bg-deep))", border: "1px solid var(--line-soft)" }}>
        <div onClick={onRoll} style={{ cursor: "pointer", color: "var(--gold)", filter: hpRoll ? "drop-shadow(0 0 16px var(--gold))" : "none", transition: "transform 200ms ease, filter 400ms ease", transform: hpRoll ? "rotate(360deg)" : "rotate(0)" }}>
          <D10 result={hpRoll} />
        </div>
        <div style={{ flex: 1 }}>
          {hpRoll === null ? (
            <>
              <div className="display-m" style={{ marginBottom: 6 }}>Tocca il dado per tirare</div>
              <div style={{ color: "var(--ink-mute)", fontFamily: "var(--font-display)", fontStyle: "italic" }}>Il fato attende il tuo gesto.</div>
            </>
          ) : (
            <>
              <div className="label-rune-soft" style={{ marginBottom: 4 }}>Risultato</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
                <span className="numeral" style={{ fontFamily: "var(--font-display)", fontSize: 56, color: "var(--gold-bright)", lineHeight: 1 }}>{hpRoll + conMod}</span>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--ink-mute)" }}>= {hpRoll} (d10) {fmt(conMod)} (COS)</span>
              </div>
              <div style={{ color: "var(--ink-mute)", fontSize: 13, marginTop: 8, fontFamily: "var(--font-display)", fontStyle: "italic" }}>
                Nuovo massimo: <strong style={{ color: "var(--ink)" }}>{character.hp.max + hpRoll + conMod} PF</strong>
              </div>
            </>
          )}
          {hpRoll !== null && (
            <button onClick={onRoll} className="btn btn-ghost" style={{ marginTop: 14 }}>Ritira</button>
          )}
        </div>
      </div>
    </div>
  );
};

const D10 = ({ result }) => (
  <svg viewBox="0 0 120 140" width="120" height="140" fill="none" stroke="currentColor" strokeWidth="1.5">
    <polygon points="60,8 110,50 90,118 30,118 10,50" fill="rgba(212,165,116,0.12)" stroke="currentColor" />
    <polygon points="60,8 110,50 60,72 10,50" fill="rgba(212,165,116,0.18)" stroke="currentColor"/>
    <line x1="60" y1="72" x2="30" y2="118" />
    <line x1="60" y1="72" x2="90" y2="118" />
    {result !== null && (
      <text x="60" y="60" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontSize="32" fill="currentColor" textAnchor="middle" stroke="none">{result}</text>
    )}
  </svg>
);

const fmt = (n) => (n >= 0 ? `+${n}` : `${n}`);

const AbilityStep = ({ character, choice, setChoice }) => {
  return (
    <div>
      <div className="label-rune" style={{ marginBottom: 8 }}>Passo II · Caratteristica</div>
      <h3 className="display-l" style={{ margin: "0 0 16px" }}>Quale dono coltivare?</h3>
      <p style={{ color: "var(--ink-soft)", fontFamily: "var(--font-display)", fontSize: 16, lineHeight: 1.6, maxWidth: 700 }}>
        Ogni quattro livelli, una delle tue caratteristiche cresce di un punto. Sei al livello {character.level + 1}: nessun incremento questo livello, ma puoi pianificare il prossimo.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 24 }}>
        {ABILITY_CHOICES.map(s => {
          const cur = character.stats[s];
          const next = cur + 1;
          const newMod = Math.floor((next - 10) / 2);
          return (
            <div key={s} className={`choice-card ${choice === s ? "selected" : ""}`} onClick={() => setChoice(s)}>
              <div className="choice-card-head">
                <div className="choice-name">{character.statBreakdown[s].label}</div>
                <div className="choice-bonus">+1</div>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, color: "var(--ink-mute)", fontFamily: "var(--font-mono)", fontSize: 13 }}>
                <span>{cur}</span>
                <Icon name="arrowRight" size={12} />
                <span style={{ color: "var(--gold-bright)", fontFamily: "var(--font-display)", fontSize: 22 }}>{next}</span>
                <span style={{ marginLeft: 6 }}>mod {fmt(newMod)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const FeatStep = ({ character, choice, setChoice }) => {
  return (
    <div>
      <div className="label-rune" style={{ marginBottom: 8 }}>Passo III · Talento</div>
      <h3 className="display-l" style={{ margin: "0 0 16px" }}>Forgia una nuova abilità</h3>
      <p style={{ color: "var(--ink-soft)", fontFamily: "var(--font-display)", fontSize: 16, lineHeight: 1.6, maxWidth: 700 }}>
        Il guerriero al 2° livello ottiene un <span style={{ color: "var(--gold)" }}>talento bonus</span>. Scegli con cura — il sentiero del marziale è tracciato dai talenti.
      </p>
      <div className="choice-grid" style={{ marginTop: 24 }}>
        {FEATS.map(f => (
          <div key={f.id} className={`choice-card ${choice === f.id ? "selected" : ""}`} onClick={() => setChoice(f.id)}>
            <div className="choice-card-head">
              <div className="choice-name">{f.name}</div>
              <div className="choice-bonus">{f.bonus}</div>
            </div>
            <div className="choice-desc">{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AbilitiesStep = ({ character }) => {
  const points = 4; // fighter intelligence skill points
  return (
    <div>
      <div className="label-rune" style={{ marginBottom: 8 }}>Passo IV · Abilità</div>
      <h3 className="display-l" style={{ margin: "0 0 16px" }}>Distribuisci i gradi</h3>
      <p style={{ color: "var(--ink-soft)", fontFamily: "var(--font-display)", fontSize: 16, lineHeight: 1.6, maxWidth: 700 }}>
        Hai <span style={{ color: "var(--gold-bright)", fontFamily: "var(--font-display)", fontSize: 22 }}>{points}</span> gradi di abilità da distribuire. Le abilità di classe (◆) ricevono +3 al primo grado investito.
      </p>
      <div className="ability-list" style={{ marginTop: 24 }}>
        {character.abilities.slice(0, 6).map((a, i) => (
          <div key={i} className="ability-row" style={{ gridTemplateColumns: "1fr 60px 110px 60px 60px" }}>
            <div className="ability-name">
              {a.trained && <span style={{ color: "var(--gold)", marginRight: 8 }}>◆</span>}
              {a.name}
            </div>
            <div className="ability-cell">{a.base}</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <button className="hp-btn" style={{ padding: "2px 8px", fontSize: 11 }}>–</button>
              <span className="numeral" style={{ minWidth: 24, textAlign: "center", color: "var(--ink)" }}>{a.ranks}</span>
              <button className="hp-btn" style={{ padding: "2px 8px", fontSize: 11 }}>+</button>
            </div>
            <div className="ability-cell">{fmt(a.mod)}</div>
            <div className="ability-cell total numeral">{fmt(a.total)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const CelebrateStep = ({ character, hpRoll, abilityChoice, featChoice }) => {
  const newLevel = character.level + 1;
  const conMod = Math.floor((character.stats.COS - 10) / 2);
  const hpGain = (hpRoll || 0) + conMod;
  return (
    <div className="level-up-celebration">
      <div className="level-badge">
        <div style={{ position: "absolute", inset: -20, color: "var(--gold)", animation: "ringSpin 20s linear infinite" }}>
          <Sigil size={180} variant="ouroboros" />
        </div>
        <div style={{ position: "absolute", inset: 0, color: "var(--amethyst)", opacity: 0.5, animation: "ringSpin 30s linear infinite reverse" }}>
          <Sigil size={140} variant="hexagram" />
        </div>
        <div className="lv-num numeral" style={{ position: "relative", zIndex: 1 }}>{newLevel}</div>
      </div>
      <div className="label-rune" style={{ marginBottom: 8 }}>Il rituale è completo</div>
      <h3 className="display-xl" style={{ margin: "0 0 8px", textAlign: "center" }}>{character.name} ha varcato la soglia.</h3>
      <div style={{ color: "var(--ink-mute)", fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 17, maxWidth: 480, textAlign: "center", marginBottom: 32 }}>
        Il sangue è più caldo. La mano più ferma. Le rune si riallineano attorno a una nuova verità.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, width: "100%", maxWidth: 600 }}>
        <div className="key-stat">
          <span className="l">PF guadagnati</span>
          <span className="v numeral" style={{ color: "var(--gold-bright)" }}>+{hpGain}</span>
          <span className="sub">{hpRoll} (d10) {fmt(conMod)} COS</span>
        </div>
        <div className="key-stat">
          <span className="l">Nuovo talento</span>
          <span className="v" style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 22 }}>{featChoice ? featChoice.name : "—"}</span>
          <span className="sub">{featChoice ? featChoice.bonus : ""}</span>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { LevelUpFlow });
