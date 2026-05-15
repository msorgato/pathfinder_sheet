## ADDED Requirements

### Requirement: Character accent colour field
The `Character` type SHALL include an optional `accentColor` field (string, hex value). When absent, the character sheet renders with the default gold token.

#### Scenario: Default rendering without accentColor
- **WHEN** a character has no `accentColor` set
- **THEN** the sheet renders with `var(--gold)` as the accent colour, unchanged from current behaviour

#### Scenario: Accent colour persists on reload
- **WHEN** a character's `accentColor` is set and the page is reloaded
- **THEN** the same colour is applied to the sheet

### Requirement: Fixed palette of 10 named colours
The system SHALL provide exactly 10 accent colour options with evocative Italian names. The palette SHALL include:
1. Oro Antico — #d4a574 (warm gold, default-equivalent)
2. Ametista — #c4b5fd (amethyst violet)
3. Sangue Antico — #e8534a (deep crimson)
4. Verde Foresta — #4ade80 (forest green)
5. Bianco Mithral — #e2e8f0 (mithral silver-white)
6. Azzurro Celeste — #60a5fa (sky blue)
7. Ambra Solare — #fbbf24 (solar amber)
8. Rosa del Tramonto — #f472b6 (sunset rose)
9. Ruggine del Ferro — #f97316 (iron rust orange)
10. Ombra Viola — #7c3aed (deep shadow purple)

#### Scenario: Palette is presented to user
- **WHEN** the colour picker is open in the character sheet header
- **THEN** all 10 colour swatches are visible with their evocative names as tooltips

### Requirement: Accent colour scoped to character sheet
The chosen hex value SHALL be injected as `--char-accent` CSS variable on the character sheet root element only. All elements using `var(--gold)` for character-specific accents SHALL be updated to `var(--char-accent, var(--gold))`.

#### Scenario: Accent colour applies to HP bar fill
- **WHEN** a character has `accentColor` set to a red hex
- **THEN** the HP bar fill in the character sheet header reflects that red

#### Scenario: Accent colour does not affect other pages
- **WHEN** a character has `accentColor` set
- **THEN** the homepage and other routes show no colour change

### Requirement: Inline colour picker in character sheet header
A row of 10 circular colour swatches SHALL appear in the character sheet header below the HP bar. Clicking a swatch calls `updateCharacter` with the new `accentColor`. The active swatch has a visible ring indicator.

#### Scenario: User changes accent colour
- **WHEN** the user clicks a colour swatch in the character sheet header
- **THEN** the sheet immediately updates to that accent colour and persists it
