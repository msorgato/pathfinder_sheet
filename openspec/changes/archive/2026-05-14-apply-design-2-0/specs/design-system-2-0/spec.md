## ADDED Requirements

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

### Requirement: Legacy theme migration
The system SHALL migrate any persisted legacy `ThemeId` value (`fantasy`, `eva01`, `cyberpunk`, `persona5`) to `sigil` on store hydration, so returning users are not left with a broken theme.

#### Scenario: Legacy theme key migrated on load
- **WHEN** localStorage contains `pathfinder-theme` with value `"fantasy"` (or other legacy key)
- **THEN** `themeStore` hydrates with `sigil` and overwrites the stored value

### Requirement: Typography utility classes
The system SHALL expose the following global CSS classes: `.display-xl` (56px italic serif), `.display-l` (40px italic serif), `.display-m` (28px serif), `.label-rune` (11px uppercase Cinzel, gold color, 0.28em tracking), `.label-rune-soft` (10px uppercase Cinzel, ink-mute color), `.numeral` (display font, tabular nums). These SHALL be defined in `src/index.css` and available to all components without import.

#### Scenario: Display heading renders in Cormorant Garamond
- **WHEN** a component uses `className="display-xl"`
- **THEN** the text renders in `Cormorant Garamond` (or fallback serif) at 56px italic

#### Scenario: Rune label renders in Cinzel with tracking
- **WHEN** a component uses `className="label-rune"`
- **THEN** the text is uppercase, 11px, gold-colored with 0.28em letter-spacing

### Requirement: Frame corner decoration
The system SHALL provide a `.frame-corners-4` CSS class that, when applied to a container with four `.corner.tl/.tr/.bl/.br` child spans, renders 14×14px gold corner brackets at each corner. A `<FrameCorners />` React component at `src/components/ui/FrameCorners.tsx` SHALL render these four spans as a convenience wrapper.

#### Scenario: Character card renders corner brackets
- **WHEN** a character card renders with `.frame-corners-4` and `<FrameCorners />`
- **THEN** four gold corner brackets appear at the card corners with `opacity: 0.7`

### Requirement: Vital bar component style
The system SHALL provide `.vital-row`, `.vital-label`, `.vital-bar`, and `.vital-bar-fill` CSS classes matching the design 2.0 prototype. The `.vital-bar.xp` modifier SHALL color the fill with the `--amethyst` token instead of `--vital`.

#### Scenario: HP bar fill reflects current health percentage
- **WHEN** a character has 60 HP out of 100 max
- **THEN** `.vital-bar-fill` width is 60% and colored with `--vital`

#### Scenario: XP bar uses amethyst color
- **WHEN** `.vital-bar.xp` is rendered
- **THEN** the fill uses `--amethyst` color token

### Requirement: Button style system
The system SHALL provide `.btn`, `.btn-primary`, and `.btn-ghost` CSS classes matching the design 2.0 prototype (glassmorphism base, gold gradient primary, transparent ghost). Existing Tailwind button utilities in components MAY coexist but MUST be migrated for primary action buttons.

#### Scenario: Primary button renders with gold gradient
- **WHEN** a button has `className="btn btn-primary"`
- **THEN** it renders with a gold gradient background and dark text

### Requirement: Google Fonts loaded in HTML head
The system SHALL add `<link rel="preconnect">` and Google Fonts stylesheet `<link>` tags for `Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500`, `Cinzel:wght@400;500;600`, and `EB+Garamond:ital,wght@0,400;1,400` to `index.html`. The fonts SHALL use `font-display: swap` (via Google Fonts `&display=swap` parameter).

#### Scenario: Fonts load without blocking render
- **WHEN** the page loads on a slow connection
- **THEN** system serif fallbacks display immediately and Cormorant Garamond swaps in once loaded

### Requirement: ThemeId type updated
`src/themes.ts` SHALL define `ThemeId = 'sigil' | 'astral' | 'blood'` and `THEMES` SHALL contain entries for these three themes with appropriate swatch colors.

#### Scenario: ThemeSwitcher renders three swatches
- **WHEN** `ThemeSwitcher` renders
- **THEN** exactly three swatch buttons appear (sigil, astral, blood)
