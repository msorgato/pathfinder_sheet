## MODIFIED Requirements

### Requirement: Wizard step indicator readability
Inactive (future) step labels in the character creation wizard and level-up wizard SHALL use a colour with minimum ~40% opacity white (e.g. `var(--ink-mute)`) rather than the near-invisible ghost border token. The active step label SHALL use `var(--gold)` or `var(--ink)`. Completed step labels SHALL use a mid-brightness muted tone.

#### Scenario: Future step labels are legible
- **WHEN** the user is on step 2 of the creation wizard
- **THEN** the labels for steps 3–7 are visibly readable (not near-invisible)

#### Scenario: Active step label is clearly highlighted
- **WHEN** the user is on step 3
- **THEN** the step 3 label is brighter/accented relative to all other labels

### Requirement: Wizard body text minimum size
Text in wizard option cards (titles and descriptions), step labels, and body copy SHALL be at minimum 12px for labels and 13px for descriptions/body. Option card titles SHALL be at minimum 15px.

#### Scenario: Option card titles are readable
- **WHEN** the user views the race or class selection step
- **THEN** card titles render at ≥15px and descriptions at ≥13px
