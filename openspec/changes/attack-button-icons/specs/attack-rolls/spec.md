## MODIFIED Requirements

### Requirement: Attack roll display
The system SHALL display, for each weapon attack, the full to-hit bonus for every iterative attack in the chain. The to-hit bonus for each iteration SHALL be: `iterationBonus + abilityMod(abilityScore)`. Each to-hit badge SHALL include a type icon (⚔ for melee, 🏹 for ranged) and SHALL have a visible hover state (cursor pointer, brightness/opacity change) to communicate interactivity.

#### Scenario: Melee weapon display
- **WHEN** a melee weapon with STR-based attack is displayed
- **THEN** each iteration shows `attackChain[i] + strMod` as the to-hit value (e.g. "+9/+4") with a ⚔ prefix icon

#### Scenario: Ranged weapon display
- **WHEN** a ranged weapon with DEX-based attack is displayed
- **THEN** each iteration shows `attackChain[i] + dexMod` as the to-hit value with a 🏹 prefix icon

#### Scenario: Hover state on attack badge
- **WHEN** the user hovers over a to-hit badge
- **THEN** the badge visually changes (brightness or opacity) to indicate it is clickable

#### Scenario: Global melee chain display
- **WHEN** the global Mischia chain is displayed in the AttacksPanel header section
- **THEN** each badge includes ⚔ and has a visible hover state

#### Scenario: Global ranged chain display
- **WHEN** the global Distanza chain is displayed in the AttacksPanel header section
- **THEN** each badge includes 🏹 and has a visible hover state
