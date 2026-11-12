# character-conditions Specification

## Purpose

Catalogo delle condizioni PF1, loro effetti automatici e non numerici sulla scheda e gestione discreta di condizioni ed effetti.

## Requirements

### Requirement: Condition catalogue
The system SHALL provide a catalogue of the Pathfinder 1E conditions with Italian names and a short rules reminder for each. The catalogue SHALL include at least: Abbagliato, Accecato, Accovacciato, Affascinato, Affaticato, Afferrato, Assordato, Barcollante, Confuso, Esausto, Frastornato, Immobilizzato, Impaurito, Impreparato, In preda al panico, Inabile, Indifeso, Infermo, Intralciato, Invisibile, Morente, Nauseato, Paralizzato, Pietrificato, Privo di sensi, Prono, Scosso, Stabile, Stordito.

#### Scenario: Browse conditions
- **WHEN** the user opens the condition picker
- **THEN** every catalogue condition is listed with its name and rules reminder

### Requirement: Automatic condition effects
Conditions with numeric effects SHALL contribute their modifiers automatically while active, as penalties that always stack. At least the following effects SHALL be automated:
- Abbagliato: −1 attack rolls.
- Accecato: −2 AC; loses Dexterity bonus to AC; −4 on Strength- and Dexterity-based skill checks.
- Accovacciato: −2 AC; loses Dexterity bonus to AC.
- Affaticato: −2 Strength, −2 Dexterity.
- Esausto: −6 Strength, −6 Dexterity.
- Afferrato: −4 Dexterity; −2 attack rolls and CMB.
- Assordato: −4 initiative.
- Immobilizzato: loses Dexterity bonus to AC; −4 AC.
- Impaurito, In preda al panico, Scosso: −2 attack rolls, saving throws, skill checks and ability checks.
- Impreparato: loses Dexterity bonus to AC.
- Infermo: −2 attack rolls, weapon damage, saving throws, skill checks and ability checks.
- Intralciato: −2 attack rolls, −4 Dexterity.
- Prono: −4 melee attack rolls.
- Stordito: −2 AC; loses Dexterity bonus to AC.
Conditions without a numeric effect, or with situational parts (e.g. Prono's AC against melee/ranged, Invisibile's attack bonus against specific targets), SHALL show those rules as a reminder only.

#### Scenario: Shaken applies penalties
- **WHEN** the user applies Scosso to a character
- **THEN** attack rolls, saves, skill checks and ability checks shown in the sheet are reduced by 2

#### Scenario: Narrative condition
- **WHEN** the user applies Nauseato
- **THEN** no numeric value changes and the rules reminder (only a single move action per turn) is visible

### Requirement: Fear conditions do not stack with each other
Scosso, Impaurito and In preda al panico SHALL NOT accumulate their −2 penalties with one another: when more than one is active, the penalty is applied once.

#### Scenario: Shaken and frightened together
- **WHEN** a character is both Scosso and Impaurito
- **THEN** attack rolls are reduced by 2, not by 4

### Requirement: Apply and remove conditions
The owner of a character SHALL be able to apply any catalogue condition, optionally with a free-text note (e.g. the source), and remove it at any time. Conditions have no duration: they stay active until removed. The same condition SHALL NOT be active twice on the same character; reapplying it updates its note.

#### Scenario: Apply with note
- **WHEN** the user applies Scosso with note "Intimidire"
- **THEN** the condition is active, shows the note, and is saved with the character

#### Scenario: Remove condition
- **WHEN** the user removes an active condition
- **THEN** its effects stop applying immediately

### Requirement: Active conditions are visible at a glance
Active conditions SHALL be shown in the character sheet header as compact chips, only when at least one is active. Selecting a chip SHALL show its rules reminder and allow removing it.

#### Scenario: Header chips
- **WHEN** a character has Scosso and Prono active
- **THEN** the header shows chips "Scosso" and "Prono"

#### Scenario: No chips without conditions
- **WHEN** a character has no active condition or effect
- **THEN** the header shows no chip row

### Requirement: Non-numeric attack effects are reported
Conditions whose effect on attacks is not a numeric modifier SHALL be reported in the attack section and on each to-hit badge, and the note SHALL be included in the quick-roll label. Accecato SHALL report a 50% probability to miss (opponents have total concealment) without changing the to-hit values.

#### Scenario: Blinded attacker
- **WHEN** the character is Accecato
- **THEN** the to-hit values are unchanged, the attack section shows "Accecato: 50% di probabilità di mancare", and a quick attack roll carries that note in its label

#### Scenario: Conditions that prevent attacking
- **WHEN** the character is Nauseato or Stordito
- **THEN** the attack section reports that the character cannot attack or act

### Requirement: Unobtrusive status management
Condition, effect, ability damage/drain and negative level management SHALL live in a collapsible "Condizioni ed effetti" section of the combat tab, placed after hit points and before Armor Class and saving throws, closed by default, showing the number of active items when closed. The open/closed state MAY be remembered per device. Critical warnings (death or unconsciousness thresholds) SHALL remain visible when the section is closed.

#### Scenario: Closed by default
- **WHEN** the user opens a character sheet for the first time on a device
- **THEN** the section is closed and shows only its title and the count of active items

#### Scenario: Warning visible when closed
- **WHEN** Constitution damage equals the Constitution score and the section is closed
- **THEN** the death warning is visible
