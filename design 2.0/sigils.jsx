/* SVG sigil + glyph primitives — used throughout the app for decorative + functional iconography */

const Sigil = ({ size = 80, variant = "ouroboros", className = "" }) => {
  const variants = {
    // central ritual sigil — concentric circles + 6-point star
    ouroboros: (
      <g>
        <circle cx="50" cy="50" r="46" fill="none" />
        <circle cx="50" cy="50" r="38" fill="none" strokeDasharray="2 3" />
        <circle cx="50" cy="50" r="28" fill="none" />
        <polygon points="50,16 79,33 79,67 50,84 21,67 21,33" fill="none" />
        <polygon points="50,22 73,36 73,64 50,78 27,64 27,36" fill="none" opacity="0.5" />
        <circle cx="50" cy="50" r="3" fill="currentColor" />
        {[0,60,120,180,240,300].map(a => (
          <circle key={a} cx={50 + 38*Math.cos(a*Math.PI/180)} cy={50 + 38*Math.sin(a*Math.PI/180)} r="2" fill="currentColor" />
        ))}
      </g>
    ),
    pentacle: (
      <g>
        <circle cx="50" cy="50" r="46" fill="none" />
        <circle cx="50" cy="50" r="40" fill="none" strokeDasharray="1 2"/>
        <polygon points="50,12 60.5,42 92,42 66.5,61 76.5,91 50,72 23.5,91 33.5,61 8,42 39.5,42" fill="none" />
      </g>
    ),
    hexagram: (
      <g>
        <circle cx="50" cy="50" r="46" fill="none" />
        <polygon points="50,14 81,68 19,68" fill="none" />
        <polygon points="50,86 19,32 81,32" fill="none" />
      </g>
    ),
    eyeOfWatcher: (
      <g>
        <circle cx="50" cy="50" r="46" fill="none" />
        <path d="M 14,50 Q 50,18 86,50 Q 50,82 14,50 Z" fill="none" />
        <circle cx="50" cy="50" r="14" fill="none" />
        <circle cx="50" cy="50" r="6" fill="currentColor" />
        <line x1="50" y1="4" x2="50" y2="20" />
        <line x1="50" y1="80" x2="50" y2="96" />
      </g>
    ),
    runeCompass: (
      <g>
        <circle cx="50" cy="50" r="46" fill="none" />
        <line x1="50" y1="6" x2="50" y2="94" />
        <line x1="6" y1="50" x2="94" y2="50" />
        <line x1="18" y1="18" x2="82" y2="82" opacity="0.5" />
        <line x1="82" y1="18" x2="18" y2="82" opacity="0.5" />
        <polygon points="50,20 56,50 50,80 44,50" fill="currentColor" opacity="0.4" />
      </g>
    ),
    serpentine: (
      <g>
        <circle cx="50" cy="50" r="46" fill="none" />
        <path d="M 20,30 Q 50,10 80,30 Q 100,50 80,70 Q 50,90 20,70 Q 0,50 20,30" fill="none" />
        <path d="M 28,40 Q 50,28 72,40 Q 84,50 72,60 Q 50,72 28,60 Q 16,50 28,40" fill="none" opacity="0.6" />
      </g>
    ),
  };
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="0.8">
      {variants[variant] || variants.ouroboros}
    </svg>
  );
};

/* Stat glyphs — one per attribute, used in stat tile backgrounds */
const StatGlyph = ({ stat }) => {
  const glyphs = {
    FOR: ( // sword
      <g><path d="M 50 10 L 50 65 M 40 60 L 60 60 M 45 85 L 55 85 M 50 65 L 50 90" />
        <path d="M 50 10 L 46 14 M 50 10 L 54 14" /></g>
    ),
    DES: ( // bow
      <g><path d="M 20 50 Q 50 20 80 50" fill="none" />
        <path d="M 20 50 Q 50 80 80 50" fill="none" />
        <line x1="15" y1="50" x2="85" y2="50" strokeDasharray="1 2"/>
        <path d="M 50 50 L 85 50 M 80 46 L 88 50 L 80 54" /></g>
    ),
    COS: ( // shield-heart
      <g><path d="M 30 25 L 70 25 L 68 60 Q 50 80 50 80 Q 50 80 32 60 Z" fill="none"/>
        <path d="M 40 45 Q 40 35 50 40 Q 60 35 60 45 Q 60 55 50 65 Q 40 55 40 45 Z" /></g>
    ),
    INT: ( // open book
      <g><path d="M 16 30 L 50 36 L 50 80 L 16 74 Z" fill="none"/>
        <path d="M 84 30 L 50 36 L 50 80 L 84 74 Z" fill="none"/>
        <line x1="22" y1="42" x2="44" y2="46" />
        <line x1="22" y1="52" x2="44" y2="56" />
        <line x1="56" y1="46" x2="78" y2="42" />
        <line x1="56" y1="56" x2="78" y2="52" /></g>
    ),
    SAG: ( // all-seeing eye
      <g><path d="M 14 50 Q 50 22 86 50 Q 50 78 14 50 Z" fill="none"/>
        <circle cx="50" cy="50" r="12" />
        <circle cx="50" cy="50" r="4" fill="currentColor"/></g>
    ),
    CAR: ( // crown / mask
      <g><path d="M 22 70 L 22 40 L 32 50 L 42 30 L 50 50 L 58 30 L 68 50 L 78 40 L 78 70 Z" fill="none"/>
        <circle cx="32" cy="58" r="2" fill="currentColor"/>
        <circle cx="50" cy="60" r="2" fill="currentColor"/>
        <circle cx="68" cy="58" r="2" fill="currentColor"/></g>
    ),
  };
  return (
    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      {glyphs[stat]}
    </svg>
  );
};

/* Generic ornamental icons */
const Icon = ({ name, size = 16 }) => {
  const icons = {
    sword: <g><path d="M 12 2 L 12 16 M 9 14 L 15 14 M 11 20 L 13 20 M 12 16 L 12 22" /></g>,
    sparkle: <g><path d="M 12 2 L 13 10 L 21 11 L 13 12 L 12 20 L 11 12 L 3 11 L 11 10 Z" /></g>,
    book: <g><rect x="4" y="3" width="16" height="18" rx="1" /><line x1="4" y1="7" x2="20" y2="7"/><line x1="12" y1="3" x2="12" y2="21"/></g>,
    scroll: <g><path d="M 5 4 L 19 4 L 19 18 Q 19 21 16 21 L 8 21 Q 5 21 5 18 Z" /><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/></g>,
    crossed: <g><path d="M 4 4 L 20 20 M 4 20 L 20 4" /></g>,
    star: <g><polygon points="12,2 14.5,9 22,9 16,13.5 18.5,21 12,16.5 5.5,21 8,13.5 2,9 9.5,9" /></g>,
    arrow: <g><path d="M 19 12 L 5 12 M 10 7 L 5 12 L 10 17" /></g>,
    arrowRight: <g><path d="M 5 12 L 19 12 M 14 7 L 19 12 L 14 17" /></g>,
    plus: <g><path d="M 12 5 L 12 19 M 5 12 L 19 12" /></g>,
    bin: <g><path d="M 5 7 L 19 7 M 9 7 L 9 4 L 15 4 L 15 7 M 7 7 L 8 20 L 16 20 L 17 7" /></g>,
    flame: <g><path d="M 12 21 Q 5 18 6 12 Q 7 7 12 3 Q 12 8 16 9 Q 19 12 18 16 Q 17 20 12 21 Z" fill="none"/></g>,
    skull: <g><path d="M 12 3 Q 5 4 5 12 L 5 16 L 8 18 L 8 21 L 16 21 L 16 18 L 19 16 L 19 12 Q 19 4 12 3 Z" /><circle cx="9" cy="12" r="1.5" fill="currentColor"/><circle cx="15" cy="12" r="1.5" fill="currentColor"/></g>,
    shield: <g><path d="M 12 3 L 19 6 L 19 12 Q 19 19 12 21 Q 5 19 5 12 L 5 6 Z" /></g>,
    chevronUp: <g><path d="M 5 14 L 12 8 L 19 14" /></g>,
    crown: <g><path d="M 4 18 L 4 8 L 8 12 L 12 6 L 16 12 L 20 8 L 20 18 Z" /></g>,
    dice: (
      <g>
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <circle cx="9" cy="9" r="1.2" fill="currentColor"/>
        <circle cx="15" cy="9" r="1.2" fill="currentColor"/>
        <circle cx="9" cy="15" r="1.2" fill="currentColor"/>
        <circle cx="15" cy="15" r="1.2" fill="currentColor"/>
        <circle cx="12" cy="12" r="1.2" fill="currentColor"/>
      </g>
    ),
    chat: <g><path d="M 4 5 L 20 5 L 20 16 L 13 16 L 9 20 L 9 16 L 4 16 Z" /></g>,
  };
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </svg>
  );
};

/* Class portrait — abstract sigil-based avatars (placeholders for real art) */
const ClassPortrait = ({ klass = "Guerriero", race = "Nano", seed = 0 }) => {
  // Colors per class
  const classPalettes = {
    Guerriero: { a: "#c89455", b: "#7a3a2a", c: "#3d1a1a" },
    Mago: { a: "#a78bfa", b: "#5b21b6", c: "#1e1b4b" },
    Ladro: { a: "#10b981", b: "#064e3b", c: "#0a1a13" },
    Chierico: { a: "#fde68a", b: "#a16207", c: "#3b2a0a" },
    Bardo: { a: "#f9a8d4", b: "#9d174d", c: "#3b0a25" },
    Druido: { a: "#65a30d", b: "#3f6212", c: "#1a2a0a" },
  };
  const p = classPalettes[klass] || classPalettes.Guerriero;
  const id = `portrait-${klass}-${seed}`;
  return (
    <svg viewBox="0 0 320 320" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id={`${id}-bg`} cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor={p.a} stopOpacity="0.6"/>
          <stop offset="40%" stopColor={p.b} stopOpacity="0.5"/>
          <stop offset="100%" stopColor={p.c} stopOpacity="1"/>
        </radialGradient>
        <radialGradient id={`${id}-glow`} cx="50%" cy="45%" r="40%">
          <stop offset="0%" stopColor={p.a} stopOpacity="0.5"/>
          <stop offset="100%" stopColor={p.a} stopOpacity="0"/>
        </radialGradient>
      </defs>
      <rect width="320" height="320" fill={`url(#${id}-bg)`} />
      {/* atmospheric rays */}
      <g opacity="0.25">
        {[...Array(12)].map((_, i) => {
          const a = (i * 30 + seed * 7) * Math.PI / 180;
          return <line key={i} x1="160" y1="160" x2={160 + 200*Math.cos(a)} y2={160 + 200*Math.sin(a)} stroke={p.a} strokeWidth="0.4"/>;
        })}
      </g>
      {/* sigil ring */}
      <g transform="translate(160 160)" opacity="0.4" stroke={p.a} fill="none" strokeWidth="0.7">
        <circle r="120" />
        <circle r="100" strokeDasharray="2 4" />
        <circle r="80" />
      </g>
      {/* central silhouette — abstract shape suggesting figure */}
      <g transform="translate(160 165)">
        {klass === "Guerriero" && (
          <g>
            {/* warrior silhouette w/ helmet + shoulder pads */}
            <ellipse cx="0" cy="60" rx="62" ry="46" fill={p.c} opacity="0.85"/>
            <ellipse cx="0" cy="-2" rx="32" ry="38" fill={p.c} opacity="0.95"/>
            <path d="M -40 36 L -52 6 L -40 -4 L -36 16 Z" fill={p.c} opacity="0.9"/>
            <path d="M 40 36 L 52 6 L 40 -4 L 36 16 Z" fill={p.c} opacity="0.9"/>
            {/* helmet horns */}
            <path d="M -20 -32 Q -36 -50 -42 -36 Q -36 -28 -22 -22 Z" fill={p.c}/>
            <path d="M 20 -32 Q 36 -50 42 -36 Q 36 -28 22 -22 Z" fill={p.c}/>
            {/* eye glow */}
            <ellipse cx="0" cy="0" rx="22" ry="8" fill={p.a} opacity="0.2"/>
            <circle cx="-8" cy="-2" r="2" fill={p.a}/>
            <circle cx="8" cy="-2" r="2" fill={p.a}/>
          </g>
        )}
        {klass === "Mago" && (
          <g>
            <path d="M -50 70 L -20 -10 L 0 -50 L 20 -10 L 50 70 Z" fill={p.c} opacity="0.9"/>
            <circle cx="0" cy="-2" r="22" fill={p.c}/>
            <path d="M -8 -4 L 8 -4 L 0 16 Z" fill={p.a} opacity="0.6"/>
            <circle cx="0" cy="-50" r="6" fill={p.a}/>
            <circle cx="0" cy="-50" r="14" fill="none" stroke={p.a} strokeWidth="0.6"/>
          </g>
        )}
        {klass === "Ladro" && (
          <g>
            <ellipse cx="0" cy="60" rx="50" ry="40" fill={p.c}/>
            <ellipse cx="0" cy="0" rx="28" ry="32" fill={p.c}/>
            <rect x="-30" y="-4" width="60" height="10" fill={p.a} opacity="0.3"/>
            <circle cx="-10" cy="0" r="3" fill={p.a}/>
            <circle cx="10" cy="0" r="3" fill={p.a}/>
          </g>
        )}
        {klass === "Chierico" && (
          <g>
            <path d="M -50 70 L -30 0 L 0 -30 L 30 0 L 50 70 Z" fill={p.c} opacity="0.9"/>
            <circle cx="0" cy="-2" r="26" fill={p.c}/>
            <rect x="-3" y="-50" width="6" height="20" fill={p.a}/>
            <rect x="-10" y="-43" width="20" height="6" fill={p.a}/>
          </g>
        )}
        {klass === "Bardo" && (
          <g>
            <path d="M -40 70 L -22 -10 L 0 -34 L 22 -10 L 40 70 Z" fill={p.c} opacity="0.9"/>
            <circle cx="0" cy="-2" r="22" fill={p.c}/>
            <path d="M 28 24 Q 44 36 36 56 Q 22 64 18 48 Z" fill={p.c}/>
          </g>
        )}
        {klass === "Druido" && (
          <g>
            <ellipse cx="0" cy="60" rx="55" ry="40" fill={p.c}/>
            <ellipse cx="0" cy="0" rx="30" ry="34" fill={p.c}/>
            <path d="M -30 -22 Q -10 -50 0 -34 Q 10 -50 30 -22 Q 20 -8 0 -8 Q -20 -8 -30 -22 Z" fill={p.a} opacity="0.4"/>
          </g>
        )}
      </g>
      {/* central glow */}
      <circle cx="160" cy="160" r="160" fill={`url(#${id}-glow)`}/>
      {/* corner runes */}
      <g fill={p.a} opacity="0.5" fontFamily="Cinzel, serif" fontSize="10" letterSpacing="2">
        <text x="14" y="22">⚝</text>
        <text x="290" y="22">⚝</text>
        <text x="14" y="308">⚝</text>
        <text x="290" y="308">⚝</text>
      </g>
    </svg>
  );
};

Object.assign(window, { Sigil, StatGlyph, Icon, ClassPortrait });
