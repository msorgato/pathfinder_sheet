const { useState: useStateApp, useEffect: useEffectApp } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "sigil",
  "showStars": true,
  "screen": "list"
}/*EDITMODE-END*/;

const App = () => {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [screen, setScreen] = useStateApp(tweaks.screen === "sheet" ? "sheet" : tweaks.screen === "levelup" ? "sheet" : "list");
  const [activeId, setActiveId] = useStateApp(CHARACTERS[0].id);
  const [showLevelUp, setShowLevelUp] = useStateApp(false);
  const [showRoll, setShowRoll] = useStateApp(false);
  const [rollResult, setRollResult] = useStateApp(null);

  // sync from tweaks
  useEffectApp(() => {
    if (tweaks.screen === "list") setScreen("list");
    if (tweaks.screen === "sheet") { setScreen("sheet"); setShowLevelUp(false); }
    if (tweaks.screen === "levelup") { setScreen("sheet"); setShowLevelUp(true); }
  }, [tweaks.screen]);

  const themeClass = tweaks.theme === "astral" ? "theme-astral" : tweaks.theme === "blood" ? "theme-blood" : "";
  const active = CHARACTERS.find(c => c.id === activeId);

  const openCharacter = (id) => {
    setActiveId(id);
    setScreen("sheet");
    setTweak("screen", "sheet");
  };
  const backToList = () => {
    setScreen("list");
    setTweak("screen", "list");
  };
  const openLevelUp = () => {
    setShowLevelUp(true);
    setTweak("screen", "levelup");
  };
  const closeLevelUp = () => {
    setShowLevelUp(false);
    setTweak("screen", "sheet");
  };

  const rollDie = () => {
    const result = Math.floor(Math.random() * 20) + 1;
    setRollResult(result);
    setShowRoll(true);
  };

  return (
    <div className={`app ${themeClass}`}>
      {tweaks.showStars && <div className="backdrop"></div>}

      <header className="topbar">
        <div className="brand">
          <div className="brand-mark" style={{ color: "var(--gold)" }}>
            <Sigil size={36} variant="ouroboros" />
          </div>
          <div>
            <div className="brand-name">Pathfinder</div>
            <div className="brand-sub">— scriptorium di compagnia</div>
          </div>
        </div>
        <div className="topbar-nav">
          <div className="topbar-tag">Sessione · Lunedì 18 Maggio</div>
          <button className="btn btn-ghost">
            <Icon name="chat" size={14} />
            <span style={{ marginLeft: 8 }}>Tavolo</span>
          </button>
        </div>
      </header>

      {screen === "list" && (
        <CharacterList characters={CHARACTERS} onOpen={openCharacter} onCreate={() => alert("Forgia personaggio (mock)")} />
      )}
      {screen === "sheet" && (
        <CharacterSheet character={active} onBack={backToList} onLevelUp={openLevelUp} />
      )}

      {showLevelUp && (
        <LevelUpFlow character={active} onClose={closeLevelUp} onConfirm={closeLevelUp} />
      )}

      <FloatingDie onClick={rollDie} />
      {showRoll && <DiceRollPopup result={rollResult} onClose={() => setShowRoll(false)} onReroll={rollDie} />}

      <TweaksPanel title="Tweaks" initialPos={{ right: 24, top: 96 }}>
        <TweakSection title="Stile visivo">
          <TweakRadio
            label="Tema"
            value={tweaks.theme}
            options={[
              { value: "sigil", label: "Sigillo" },
              { value: "astral", label: "Astrale" },
              { value: "blood", label: "Sangue" },
            ]}
            onChange={v => setTweak("theme", v)}
          />
          <TweakToggle label="Sfondo stellato" value={tweaks.showStars} onChange={v => setTweak("showStars", v)} />
        </TweakSection>
        <TweakSection title="Schermata">
          <TweakRadio
            label="Vista"
            value={tweaks.screen}
            options={[
              { value: "list", label: "Lista" },
              { value: "sheet", label: "Scheda" },
              { value: "levelup", label: "Level-up" },
            ]}
            onChange={v => setTweak("screen", v)}
          />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
};

/* =============== Floating dice =============== */
const FloatingDie = ({ onClick }) => (
  <button className="dice-fab" onClick={onClick} aria-label="Tira d20">
    <svg viewBox="0 0 64 64" width="34" height="34" fill="none" stroke="rgba(15,10,5,0.85)" strokeWidth="2" strokeLinejoin="round">
      <polygon points="32,6 58,22 58,46 32,62 6,46 6,22" fill="rgba(15,10,5,0.15)" />
      <polygon points="32,6 58,22 32,38 6,22" fill="rgba(15,10,5,0.08)" />
      <line x1="32" y1="38" x2="32" y2="62" />
      <line x1="32" y1="38" x2="6" y2="22" opacity="0.6" />
      <line x1="32" y1="38" x2="58" y2="22" opacity="0.6" />
      <text x="32" y="34" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontSize="16" fill="rgba(15,10,5,0.9)" stroke="none">20</text>
    </svg>
  </button>
);

const DiceRollPopup = ({ result, onClose, onReroll }) => {
  const isNat = result === 20;
  const isFumble = result === 1;
  return (
    <div className="dice-popup frame-corners-4">
      <span className="corner tl"></span><span className="corner tr"></span><span className="corner bl"></span><span className="corner br"></span>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span className="label-rune">d20</span>
        <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--ink-mute)", cursor: "pointer", fontSize: 16 }}>✕</button>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ color: isNat ? "var(--gold-bright)" : isFumble ? "var(--blood)" : "var(--gold)", filter: `drop-shadow(0 0 16px ${isNat ? 'var(--gold)' : isFumble ? 'var(--blood)' : 'var(--gold-deep)'})` }}>
          <D20Big result={result} />
        </div>
        <div>
          <div className="label-rune-soft">Risultato</div>
          <div className="numeral" style={{ fontFamily: "var(--font-display)", fontSize: 56, lineHeight: 1, color: isNat ? "var(--gold-bright)" : isFumble ? "#fca5a5" : "var(--ink)" }}>
            {result}
          </div>
          {isNat && <div style={{ color: "var(--gold-bright)", fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 13 }}>Critico naturale!</div>}
          {isFumble && <div style={{ color: "var(--blood)", fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 13 }}>Fallimento critico…</div>}
        </div>
      </div>
      <button className="btn btn-ghost" onClick={onReroll} style={{ width: "100%", marginTop: 14, justifyContent: "center", display: "flex" }}>Ritira</button>
    </div>
  );
};

const D20Big = ({ result }) => (
  <svg viewBox="0 0 100 110" width="80" height="88" fill="none" stroke="currentColor" strokeWidth="1.5">
    <polygon points="50,8 90,30 90,80 50,102 10,80 10,30" fill="rgba(212,165,116,0.15)" />
    <polygon points="50,8 90,30 50,52 10,30" fill="rgba(212,165,116,0.22)" />
    <line x1="50" y1="52" x2="10" y2="80" />
    <line x1="50" y1="52" x2="90" y2="80" />
    <line x1="50" y1="52" x2="50" y2="102" />
    <text x="50" y="40" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontSize="22" fill="currentColor" stroke="none">{result}</text>
  </svg>
);

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
