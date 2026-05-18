const { useState } = React;

const CharacterList = ({ characters, onOpen, onCreate }) => {
  return (
    <div className="list-page">
      <div className="list-hero">
        <div className="list-hero-title">
          <div className="label-rune-soft">Cronache di una Compagnia</div>
          <h1 className="display-xl" style={{ margin: 0 }}>I tuoi personaggi</h1>
          <div style={{ color: "var(--ink-mute)", fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 17, marginTop: 4 }}>
            Tre anime errano nei piani. Quale guiderai stanotte?
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button className="btn">
            <Icon name="chat" size={14} /> <span style={{ marginLeft: 8 }}>Tavolo aperto</span>
          </button>
          <button className="btn btn-primary" onClick={onCreate}>
            <span>Forgia personaggio</span>
          </button>
        </div>
      </div>

      <div className="list-grid">
        {characters.map((c, i) => (
          <CharacterCard key={c.id} character={c} onOpen={() => onOpen(c.id)} seed={i} />
        ))}
        <div className="char-card-new" onClick={onCreate}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, color: "var(--ink-mute)" }}>
            <div style={{ color: "var(--gold)" }}>
              <Sigil size={64} variant="hexagram" />
            </div>
            <div className="label-rune">Nuovo personaggio</div>
            <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 14, maxWidth: 200, textAlign: "center" }}>
              Tira i dadi, scegli il destino, traccia un nuovo nome nel libro della compagnia.
            </div>
          </div>
        </div>
      </div>

      <div className="chat-preview">
        <div className="divider-rune">
          <Sigil size={20} variant="hexagram" />
          <span className="label-rune">Embed nel tavolo · anteprima</span>
          <Sigil size={20} variant="hexagram" />
        </div>
        <div style={{ display: "flex", gap: 28, alignItems: "flex-start", marginTop: 20 }}>
          <div style={{ flex: 1, maxWidth: 460 }}>
            <h3 className="display-m" style={{ margin: "0 0 10px" }}>Una carta, dentro la chat</h3>
            <p style={{ color: "var(--ink-mute)", fontFamily: "var(--font-display)", fontSize: 16, lineHeight: 1.6 }}>
              Quando giochi al tavolo, ogni personaggio appare come una carta compatta accanto al messaggio del giocatore — caratteristiche e PF a colpo d'occhio. Un click apre la scheda completa, senza lasciare la conversazione.
            </p>
          </div>
          <ChatMiniCard character={characters[1]} />
        </div>
      </div>
    </div>
  );
};

const CharacterCard = ({ character, onOpen, seed }) => {
  const hpPct = Math.round((character.hp.current / character.hp.max) * 100);
  const xpPct = Math.round((character.xp.current / character.xp.max) * 100);
  return (
    <div className="char-card frame-corners-4" onClick={onOpen}>
      <span className="corner tl"></span>
      <span className="corner tr"></span>
      <span className="corner bl"></span>
      <span className="corner br"></span>
      <div className="char-card-portrait">
        <ClassPortrait klass={character.klass} race={character.race} seed={seed} />
      </div>
      <div className="char-card-body">
        <h3 className="char-card-name">{character.name}</h3>
        <div className="char-card-meta">
          <span>{character.race}</span>
          <span>{character.klass}</span>
          <span className="lv">LV {character.level}</span>
          <span>{character.alignment}</span>
        </div>
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          <CardBar label="PF" current={character.hp.current} max={character.hp.max} pct={hpPct} variant="vital" />
          <CardBar label="PE" current={character.xp.current} max={character.xp.max} pct={xpPct} variant="xp" />
        </div>
        <div className="char-card-stats">
          <Stat tile label="CA" value={character.ca} />
          <Stat tile label="BAB" value={`+${character.bab}`} />
          <Stat tile label="INIT" value={`+${character.init}`} />
        </div>
      </div>
    </div>
  );
};

const CardBar = ({ label, current, max, pct, variant }) => (
  <div className="vital-row" style={{ gap: 4 }}>
    <div className="vital-label">
      <span className="name">{label}</span>
      <span className="val" style={{ fontSize: 14 }}>{current}<em>/{max}</em></span>
    </div>
    <div className={`vital-bar ${variant}`}>
      <div className="vital-bar-fill" style={{ width: `${pct}%` }} />
    </div>
  </div>
);

const Stat = ({ label, value }) => (
  <div className="char-card-stat">
    <span className="v">{value}</span>
    <span className="l">{label}</span>
  </div>
);

const ChatMiniCard = ({ character }) => {
  if (!character) return null;
  return (
    <div className="chat-mini-card frame-corners-4">
      <span className="corner tl"></span>
      <span className="corner tr"></span>
      <span className="corner bl"></span>
      <span className="corner br"></span>
      <div style={{ height: 100, background: "linear-gradient(180deg, var(--surface-2), var(--bg-base))", overflow: "hidden", borderBottom: "1px solid var(--line-soft)" }}>
        <ClassPortrait klass={character.klass} race={character.race} seed={3} />
      </div>
      <div style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div>
            <div className="chat-mini-name">{character.name}</div>
            <div className="chat-mini-sub">{character.race} · {character.klass} · LV {character.level}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--ink)" }}>
              {character.hp.current}<span style={{ color: "var(--ink-mute)", fontSize: 14 }}>/{character.hp.max}</span>
            </div>
            <div className="chat-mini-sub" style={{ marginTop: 2 }}>PF</div>
          </div>
        </div>
      </div>
      <div className="chat-mini-body">
        {Object.entries(character.stats).slice(0, 6).map(([k, v]) => (
          <div key={k} className="chat-mini-stat">
            <span className="v">{v}</span>
            <span className="l">{k}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

Object.assign(window, { CharacterList });
