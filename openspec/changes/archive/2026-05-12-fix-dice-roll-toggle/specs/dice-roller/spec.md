## ADDED Requirements

### Requirement: Dice panel close mechanism
The DiceRoller panel SHALL close only via explicit user controls: the ✕ button inside the panel header, or the floating 🎲 toggle button. The panel SHALL NOT close when the user clicks outside of it.

#### Scenario: Close via header button
- **WHEN** the user clicks the ✕ button in the DiceRoller header
- **THEN** the panel closes

#### Scenario: Close via floating button
- **WHEN** the DiceRoller is open and the user clicks the floating 🎲 button
- **THEN** the panel closes (toggle behavior)

#### Scenario: Click on roll button while panel is open
- **WHEN** the DiceRoller panel is open and the user clicks any roll-triggering button (attack badge, skill check, etc.)
- **THEN** the roll is executed immediately and the panel remains open

#### Scenario: Click outside panel does not close
- **WHEN** the DiceRoller panel is open and the user clicks anywhere on the page outside the panel
- **THEN** the panel remains open and the clicked element receives the click event normally
