const { useState: useStateSheet, useMemo } = React;

const mod = (score) => Math.floor((score - 10) / 2);
const fmt = (n) => (n >= 0 ? `+${n}` : `${n}`);

const TABS = [
  { id: "combat", label: "Combattimento", icon: "sword" },
  { id: "abilities", label: "Abilità", icon: "scroll" },
  { id: "spells", label: "Incantesimi", icon: "sparkle" },
  { id: "capacities", label: "Capacità", icon: "book" },
  { id: "notes", label: "Note", icon: "scroll" },
];

const CharacterSheet = ({ character, onBack, onLevelUp }) => {
  const [tab, setTab] = useStateSheet("combat");
  const [hp, setHp] = useStateSheet(character.hp.current);
  const [hpDelta, setHpDelta] = useStateSheet("");
  const hpPct = (hp / character.hp.max) * 100;
  const xpPct = (character.xp.current / character.xp.max) * 100;
  const canLevelUp = character.xp.current >= character.xp.max;

  const applyDelta = (sign) => {
    const v = parseInt(hpDelta || "0", 10);
    if (isNaN(v)) return;
    setHp(h => Math.max(0, Math.min(character.hp.max, h + sign * v)));
    setHpDelta("");
  };

  return (
    <div className="sheet-page">
      <div className="sheet-banner-row">
        <button className="sheet-back" onClick={onBack}>
          <Icon name="arrow" size={14} />
          <span>Compagnia</span>
        </button>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost">
            <Icon name="chat" size={14} />
            <span style={{ marginLeft: 8 }}>Invia al tavolo</span>
          </button>
          {canLevelUp && (
            <button className="btn btn-primary" onClick={onLevelUp}>
              <Icon name="chevronUp" size={14} />
              <span style={{ marginLeft: 8 }}>Sali di livello</span>
            </button>
          )}
        </div>
      </div>

      <div className="sheet-grid">
        {/* LEFT: Identity panel */}
        <aside className="identity frame frame-corners-4">
          <span className="corner tl"></span>
          <span className="corner tr"></span>
          <span className="corner bl"></span>
          <span className="corner br"></span>

          <div className="identity-portrait">
            <ClassPortrait klass={character.klass} race={character.race} seed={1} />
            {/* Ritual sigil rotating */}
            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "var(--gold)", opacity: 0.18, animation: "ringSpin 60s linear infinite" }}>
              <Sigil size={260} variant="ouroboros" />
            </div>
            <div className="identity-portrait-overlay">
              <h1 className="identity-name">{character.name}</h1>
              <div className="identity-meta">
                <span>{character.race}</span>
                <span>{character.klass}</span>
                <span style={{ color: "var(--gold-bright)" }}>LV {character.level}</span>
                <span>{character.alignment}</span>
              </div>
            </div>
          </div>

          <div className="identity-body">
            <div className="vital-row">
              <div className="vital-label">
                <span className="name">Punti Ferita</span>
                <span className="val">{hp}<em>/{character.hp.max}</em></span>
              </div>
              <div className="vital-bar">
                <div className="vital-bar-fill" style={{ width: `${hpPct}%` }} />
              </div>
            </div>

            <div className="vital-row">
              <div className="vital-label">
                <span className="name">Punti Esperienza</span>
                <span className="val">{character.xp.current.toLocaleString("it-IT")}<em>/{character.xp.max.toLocaleString("it-IT")}</em></span>
              </div>
              <div className="vital-bar xp">
                <div className="vital-bar-fill" style={{ width: `${xpPct}%` }} />
              </div>
            </div>

            <div className="divider-rune" style={{ margin: "4px 0" }}>
              <Sigil size={16} variant="hexagram" />
            </div>

            <div className="identity-actions">
              <button className="btn">
                <Icon name="flame" size={14} /> <span>Riposo Completo</span>
              </button>
              <button className="btn btn-ghost" style={{ fontSize: 11 }}>
                <Icon name="bin" size={12} /> <span>Elimina personaggio</span>
              </button>
            </div>
          </div>
        </aside>

        {/* RIGHT: Tabs */}
        <div>
          {/* Stats — always visible above tabs */}
          <StatsBlock character={character} />

          {/* Tab nav */}
          <div className="tabs" role="tablist">
            {TABS.map(t => (
              <button key={t.id} role="tab" aria-selected={tab === t.id} className={`tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
                <Icon name={t.icon} size={14} />
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {tab === "combat" && <CombatTab character={character} hp={hp} setHp={setHp} hpDelta={hpDelta} setHpDelta={setHpDelta} applyDelta={applyDelta} />}
          {tab === "abilities" && <AbilitiesTab character={character} />}
          {tab === "spells" && <SpellsTab character={character} />}
          {tab === "capacities" && <CapacitiesTab character={character} />}
          {tab === "notes" && <NotesTab character={character} />}
        </div>
      </div>
    </div>
  );
};

/* =================== Stats Block =================== */
const StatsBlock = ({ character }) => {
  return (
    <section className="frame frame-corners-4 panel" style={{ padding: "26px 28px", marginBottom: 24, position: "relative", overflow: "hidden" }}>
      <span className="corner tl"></span>
      <span className="corner tr"></span>
      <span className="corner bl"></span>
      <span className="corner br"></span>

      {/* huge sigil watermark */}
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", color: "var(--gold)", opacity: 0.04, pointerEvents: "none" }}>
        <Sigil size={420} variant="hexagram" />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, position: "relative" }}>
        <div className="panel-title" style={{ margin: 0 }}>
          <Sigil size={14} variant="hexagram" /> Caratteristiche
        </div>
        <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 14, color: "var(--ink-mute)" }}>
          tocca una caratteristica per vedere la suddivisione
        </div>
      </div>

      <div className="stats-grid">
        {["FOR", "DES", "COS", "INT", "SAG", "CAR"].map(stat => (
          <StatTile key={stat} stat={stat} character={character} />
        ))}
      </div>
    </section>
  );
};

const StatTile = ({ stat, character }) => {
  const b = character.statBreakdown[stat];
  const m = mod(b.total);
  const modClass = m > 0 ? "pos" : m < 0 ? "neg" : "zero";
  return (
    <div className="stat-tile">
      <div className="stat-sigil">
        <StatGlyph stat={stat} />
      </div>
      <div className="stat-label">{stat}</div>
      <div className="stat-value numeral">{b.total}</div>
      <div className={`stat-modifier ${modClass}`}>{fmt(m)}</div>
      <div className="stat-detail">
        <span className="name">{b.label}</span>
        {b.note && <span style={{ fontSize: 11, opacity: 0.7 }}>{b.note}</span>}
      </div>

      <div className="stat-tooltip">
        <div className="stat-tooltip-arrow"></div>
        <div className="row"><span style={{ color: "var(--ink-mute)" }}>Base</span><span className="numeral">{b.base}</span></div>
        {b.race !== 0 && <div className="row"><span style={{ color: "var(--ink-mute)" }}>Razziale</span><span className="numeral">{fmt(b.race)}</span></div>}
        <div className="row total"><span>Totale</span><span className="numeral">{b.total} ({fmt(m)})</span></div>
      </div>
    </div>
  );
};

/* =================== Combat Tab =================== */
const CombatTab = ({ character, hp, setHp, hpDelta, setHpDelta, applyDelta }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Key combat stats + HP panel */}
      <div className="combat-grid" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
        <section className="frame frame-corners-4 panel">
          <span className="corner tl"></span><span className="corner tr"></span><span className="corner bl"></span><span className="corner br"></span>
          <div className="panel-title"><Icon name="shield" size={12} /> Difesa & Iniziativa</div>
          <div className="key-stats">
            <div className="key-stat">
              <span className="l">Classe Armatura</span>
              <span className="v numeral">{character.ca}</span>
              <span className="sub">10 + {character.ca - 10}</span>
            </div>
            <div className="key-stat">
              <span className="l">Attacco Base</span>
              <span className="v numeral">+{character.bab}</span>
              <span className="sub">BAB</span>
            </div>
            <div className="key-stat">
              <span className="l">Iniziativa</span>
              <span className="v numeral">+{character.init}</span>
              <span className="sub">DES {fmt(mod(character.stats.DES))}</span>
            </div>
          </div>
        </section>

        <section className="frame frame-corners-4 hp-panel">
          <span className="corner tl"></span><span className="corner tr"></span><span className="corner bl"></span><span className="corner br"></span>
          <div className="panel-title"><Icon name="flame" size={12} /> Vitalità</div>
          <div className="hp-row">
            <span className="l">Punti Ferita</span>
            <span className="v numeral">{hp}<em>/{character.hp.max}</em></span>
          </div>
          <div className="vital-bar" style={{ marginTop: 4 }}>
            <div className="vital-bar-fill" style={{ width: `${(hp/character.hp.max)*100}%` }} />
          </div>
          <div className="hp-controls">
            <button className="hp-btn damage" onClick={() => applyDelta(-1)}>– Danno</button>
            <input className="hp-input" type="number" value={hpDelta} onChange={e => setHpDelta(e.target.value)} placeholder="0" />
            <button className="hp-btn heal" onClick={() => applyDelta(1)}>+ Cura</button>
          </div>
        </section>
      </div>

      {/* Saves */}
      <section className="frame frame-corners-4 panel">
        <span className="corner tl"></span><span className="corner tr"></span><span className="corner bl"></span><span className="corner br"></span>
        <div className="panel-title"><Icon name="star" size={12} /> Tiri Salvezza</div>
        <div className="saves-list">
          {Object.entries(character.saves).map(([key, s]) => (
            <SaveRow key={key} name={key} save={s} />
          ))}
        </div>
      </section>

      {/* Weapons */}
      <section className="frame frame-corners-4 panel">
        <span className="corner tl"></span><span className="corner tr"></span><span className="corner bl"></span><span className="corner br"></span>
        <div className="panel-title"><Icon name="sword" size={12} /> Armi & Attacchi</div>
        <div className="weapon-head">
          <span>Arma</span><span>Att.</span><span>Danno</span><span>Crit.</span>
        </div>
        <div>
          {character.weapons.map((w, i) => (
            <div key={i} className="weapon-row">
              <div className="weapon-name">
                {w.name}
                <span className="sub">{w.type}</span>
              </div>
              <div className="weapon-val">{w.attack}</div>
              <div className="weapon-val">{w.damage}</div>
              <div className="weapon-val">{w.critical}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const SaveRow = ({ name, save }) => {
  const labels = { tempra: "Tempra", riflessi: "Riflessi", volonta: "Volontà" };
  return (
    <div className="save-row">
      <div className="l">{labels[name]}</div>
      <div className="breakdown">
        base {fmt(save.base)} <span style={{ opacity: 0.5 }}>·</span> car {fmt(save.ability)}
        {save.magic !== 0 && <> <span style={{ opacity: 0.5 }}>·</span> mag {fmt(save.magic)}</>}
        {save.note && <> <span style={{ opacity: 0.5 }}>·</span> {save.note}</>}
      </div>
      <div className="total numeral">{fmt(save.total)}</div>
    </div>
  );
};

/* =================== Abilities Tab =================== */
const AbilitiesTab = ({ character }) => {
  return (
    <section className="frame frame-corners-4 panel">
      <span className="corner tl"></span><span className="corner tr"></span><span className="corner bl"></span><span className="corner br"></span>
      <div className="panel-title"><Icon name="scroll" size={12} /> Abilità apprese</div>
      <div className="ability-head">
        <span>Abilità</span><span>Base</span><span>Gradi</span><span>Mod.</span><span>Totale</span>
      </div>
      <div className="ability-list">
        {character.abilities.map((a, i) => (
          <div key={i} className="ability-row">
            <div className="ability-name">
              {a.trained && <span style={{ color: "var(--gold)", marginRight: 8, fontFamily: "var(--font-rune)", fontSize: 10 }}>◆</span>}
              {a.name}
              {a.note && <span className="sub">{a.note}</span>}
            </div>
            <div className="ability-cell">{a.base}</div>
            <div className="ability-cell">{a.ranks}</div>
            <div className="ability-cell">{fmt(a.mod)}</div>
            <div className="ability-cell total numeral">{fmt(a.total)}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14, fontSize: 13, color: "var(--ink-mute)", fontFamily: "var(--font-display)", fontStyle: "italic" }}>
        <span style={{ color: "var(--gold)" }}>◆</span> indica un'abilità di classe (bonus +3 quando ci sono almeno 1 grado).
      </div>
    </section>
  );
};

/* =================== Spells Tab =================== */
const SpellsTab = ({ character }) => {
  if (!character.spells || character.spells.length === 0) {
    return (
      <section className="frame panel" style={{ textAlign: "center", padding: 60 }}>
        <div style={{ color: "var(--gold)", opacity: 0.4, marginBottom: 16 }}>
          <Sigil size={80} variant="pentacle" />
        </div>
        <div className="display-m" style={{ marginBottom: 8 }}>Nessun incantesimo</div>
        <div style={{ color: "var(--ink-mute)", fontFamily: "var(--font-display)", fontStyle: "italic" }}>
          Questo personaggio non possiede capacità di lancio incantesimi.
        </div>
      </section>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {character.spells.map((lvl, i) => (
        <SpellLevelBlock key={i} level={lvl} />
      ))}
    </div>
  );
};

const SpellLevelBlock = ({ level }) => {
  const [used, setUsed] = useStateSheet(level.used || 0);
  const labels = ["Trucchetti", "1° livello", "2° livello", "3° livello", "4° livello", "5° livello", "6° livello", "7° livello", "8° livello", "9° livello"];
  return (
    <section className="frame frame-corners-4 panel">
      <span className="corner tl"></span><span className="corner tr"></span><span className="corner bl"></span><span className="corner br"></span>
      <div className="spell-level-head">
        <div className="spell-level-name">
          <Sigil size={12} variant="hexagram" /> &nbsp; {labels[level.level]}
        </div>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <span className="label-rune-soft">Slot</span>
          <div className="spell-slots">
            {[...Array(level.slots)].map((_, i) => (
              <div key={i} className={`slot ${i >= used ? "filled" : ""}`} onClick={() => setUsed(i >= used ? i : i + 1)} />
            ))}
          </div>
        </div>
      </div>
      <div className="spell-grid">
        {level.prepared.map((s, i) => (
          <div key={i} className="spell-card">
            <span className="spell-prepared" title="Preparato"></span>
            <div className="spell-card-name">{s.name}</div>
            <div className="spell-card-meta">
              <span>{s.school}</span>
            </div>
            <div className="spell-card-desc">{s.desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

/* =================== Capacities Tab =================== */
const CapacitiesTab = ({ character }) => {
  return (
    <div className="cap-list">
      {character.capacities.map((c, i) => (
        <CapacityCard key={i} cap={c} />
      ))}
    </div>
  );
};

const CapacityCard = ({ cap }) => {
  const [used, setUsed] = useStateSheet(cap.used || 0);
  return (
    <div className="cap-card frame-corners-4" style={{ background: "linear-gradient(180deg, var(--bg-elev), var(--bg-base))" }}>
      <div className="cap-head">
        <div className="cap-name">{cap.name}</div>
        <div className="cap-tag">{cap.type}</div>
      </div>
      <div className="cap-desc">{cap.desc}</div>
      {cap.uses && (
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 12 }}>
          <span className="label-rune-soft">Usi giornalieri ({cap.uses - used}/{cap.uses})</span>
          <div className="cap-uses">
            {[...Array(cap.uses)].map((_, i) => (
              <div key={i} className={`use-pip ${i < used ? "used" : ""}`} onClick={() => setUsed(i < used ? i : i + 1)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* =================== Notes Tab =================== */
const NotesTab = ({ character }) => {
  const [text, setText] = useStateSheet(character.notes || "");
  return (
    <section>
      <div className="panel-title" style={{ marginBottom: 14 }}>
        <Icon name="book" size={12} /> Cronache personali
      </div>
      <textarea className="notes-area" value={text} onChange={e => setText(e.target.value)} />
    </section>
  );
};

Object.assign(window, { CharacterSheet });
