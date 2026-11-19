# design-system-2-0 Specification

## Purpose

Design system dell'app: token dei temi, migrazione dei temi legacy, tipografia e decorazioni.

## Requirements

### Requirement: Theme token set (sigil/astral/blood)
The system SHALL declare three theme variants — `sigil` (default), `astral`, and `blood` — as CSS custom properties on `[data-theme]` selectors in `src/index.css`. Each theme MUST define: `--bg-deep`, `--bg-base`, `--bg-elev`, `--bg-glass`, `--surface-1`, `--surface-2`, `--line-soft`, `--line-mid`, `--line-strong`, `--gold`, `--gold-bright`, `--gold-deep`, `--amethyst`, `--amethyst-bright`, `--amethyst-deep`, `--ember`, `--blood`, `--blood-deep`, `--vital`, `--vital-deep`, `--ink`, `--ink-soft`, `--ink-mute`, `--ink-faint`, `--rune-glow`, `--card-shadow`, `--inner-shadow`. Font stack variables `--font-display`, `--font-rune`, `--font-body`, `--font-mono` SHALL be declared on `:root` (theme-invariant). Old `--theme-*` tokens SHALL be removed.

#### Scenario: Default theme applied on first load
- **WHEN** a user visits the app with no persisted theme preference
- **THEN** the `sigil` theme tokens are active and the background renders as `#0a0814`

#### Scenario: Theme switching updates all tokens
- **WHEN** the user selects the `astral` theme
- **THEN** `--bg-deep` resolves to `#06051a` and accent colors shift to violet/pink palette

#### Scenario: Blood theme applies crimson palette
- **WHEN** the user selects the `blood` theme
- **THEN** `--bg-deep` resolves to `#0c0606` and `--amethyst` resolves to `#ef4444`

---

### Requirement: Legacy theme migration
The system SHALL migrate any persisted legacy `ThemeId` value (`fantasy`, `eva01`, `cyberpunk`, `persona5`) to `sigil` on store hydration, so returning users are not left with a broken theme.

#### Scenario: Legacy theme key migrated on load
- **WHEN** localStorage contains `pathfinder-theme` with value `"fantasy"` (or other legacy key)
- **THEN** `themeStore` hydrates with `sigil` and overwrites the stored value

---

### Requirement: Frame corner decoration
The system SHALL provide a `.frame-corners-4` CSS class that, when applied to a container with four `.corner.tl/.tr/.bl/.br` child spans, renders 14×14px gold corner brackets at each corner. A `<FrameCorners />` React component at `src/components/ui/FrameCorners.tsx` SHALL render these four spans as a convenience wrapper.

#### Scenario: Character card renders corner brackets
- **WHEN** a character card renders with `.frame-corners-4` and `<FrameCorners />`
- **THEN** four gold corner brackets appear at the card corners with `opacity: 0.7`

---

### Requirement: Vital bar component style
The system SHALL provide `.vital-row`, `.vital-label`, `.vital-bar`, and `.vital-bar-fill` CSS classes matching the design 2.0 prototype. The `.vital-bar.xp` modifier SHALL color the fill with the `--amethyst` token instead of `--vital`.

#### Scenario: HP bar fill reflects current health percentage
- **WHEN** a character has 60 HP out of 100 max
- **THEN** `.vital-bar-fill` width is 60% and colored with `--vital`

#### Scenario: XP bar uses amethyst color
- **WHEN** `.vital-bar.xp` is rendered
- **THEN** the fill uses `--amethyst` color token

---

### Requirement: Button style system
The system SHALL provide `.btn`, `.btn-primary`, and `.btn-ghost` CSS classes matching the design 2.0 prototype (glassmorphism base, gold gradient primary, transparent ghost). Existing Tailwind button utilities in components MAY coexist but MUST be migrated for primary action buttons.

#### Scenario: Primary button renders with gold gradient
- **WHEN** a button has `className="btn btn-primary"`
- **THEN** it renders with a gold gradient background and dark text

---

### Requirement: ThemeId type updated
`src/themes.ts` SHALL define `ThemeId = 'sigil' | 'astral' | 'blood'` and `THEMES` SHALL contain entries for these three themes with appropriate swatch colors.

#### Scenario: ThemeSwitcher renders three swatches
- **WHEN** `ThemeSwitcher` renders
- **THEN** exactly three swatch buttons appear (sigil, astral, blood)

---

### Requirement: Wizard step indicator readability
Inactive (future) step labels in the character creation wizard and level-up wizard SHALL use a colour with minimum ~40% opacity white (e.g. `var(--ink-mute)`) rather than the near-invisible ghost border token. The active step label SHALL use `var(--gold)` or `var(--ink)`. Completed step labels SHALL use a mid-brightness muted tone.

#### Scenario: Future step labels are legible
- **WHEN** the user is on step 2 of the creation wizard
- **THEN** the labels for steps 3–7 are visibly readable (not near-invisible)

#### Scenario: Active step label is clearly highlighted
- **WHEN** the user is on step 3
- **THEN** the step 3 label is brighter/accented relative to all other labels

---

### Requirement: Wizard body text minimum size
Text in wizard option cards (titles and descriptions), step labels, and body copy SHALL be at minimum 12px for labels and 13px for descriptions/body. Option card titles SHALL be at minimum 15px.

#### Scenario: Option card titles are readable
- **WHEN** the user views the race or class selection step
- **THEN** card titles render at ≥15px and descriptions at ≥13px

### Requirement: Typography classes
The system SHALL expose the global classes `.display-xl`, `.display-l` and `.display-m` (titles in Cinzel, upright), `.label-rune` (13px uppercase Cinzel, gold, about 0.14em tracking), `.label-rune-soft` (12px uppercase Cinzel, ink-mute colour, about 0.12em tracking) and `.numeral` (Literata with lining tabular figures). They SHALL be defined in `src/index.css` and available to all components without import.

#### Scenario: Display heading renders in Cinzel
- **WHEN** a component uses `className="display-xl"`
- **THEN** the text renders in Cinzel (or a fallback serif), upright

#### Scenario: Rune label renders in Cinzel with tracking
- **WHEN** a component uses `className="label-rune"`
- **THEN** the text is uppercase Cinzel at 13px, gold-coloured, with about 0.14em letter-spacing

### Requirement: Self-hosted fonts
The application SHALL serve its fonts (Literata and Cinzel) from its own build, and SHALL NOT load fonts from third-party servers. The font files SHALL be part of the offline cache, and text SHALL be shown with a fallback serif while they load.

#### Scenario: Offline first start
- **WHEN** the installed app starts with no network
- **THEN** the text renders in Literata and the titles in Cinzel

#### Scenario: No third-party request
- **WHEN** the app loads
- **THEN** no request is made to fonts.googleapis.com or fonts.gstatic.com

### Requirement: Readable text sizes
Body text SHALL use Literata at 16px. Running and secondary text SHALL NOT be smaller than 13px, and uppercase labels SHALL NOT be smaller than 12px. The small text sizes of the utility framework SHALL follow this scale, so existing components grow with it.

#### Scenario: Smallest secondary text
- **WHEN** a component uses the smallest text utility for secondary text
- **THEN** it renders at 13px or more

#### Scenario: No tiny text
- **WHEN** any style or component sets a font size
- **THEN** it is 12px or more

### Requirement: Readable text contrast
Every text colour of the design (primary, soft, muted and faint ink, negative values in red, and the colours of spell school tags) SHALL have a contrast ratio of at least 4.5:1 against the backgrounds and surfaces it is drawn on, in each of the three themes. Decorative borders and disabled controls are excluded.

#### Scenario: Faint text
- **WHEN** secondary text uses the faintest ink colour on a card surface
- **THEN** its contrast ratio against that surface is at least 4.5:1 in every theme

#### Scenario: Negative values
- **WHEN** a negative modifier is shown in red on a card
- **THEN** its contrast ratio is at least 4.5:1

#### Scenario: Hierarchy kept
- **WHEN** primary, soft, muted and faint ink are compared
- **THEN** each is dimmer than the previous one, so the hierarchy stays visible

### Requirement: Lining tabular numerals
Numbers in statistics, modifiers, totals and dice SHALL use Literata with lining, tabular figures, so that digits share the same height and width.

#### Scenario: Ability score
- **WHEN** the abilities panel shows 18, 14 and 16
- **THEN** all digits have the same height and the numbers line up

#### Scenario: Dice faces
- **WHEN** a 3D or 2D die shows its value
- **THEN** the value is printed in Literata
