## MODIFIED Requirements

### Requirement: Attack roll display
The system SHALL display, for each weapon attack, the full to-hit bonus for every iterative attack in the chain. The to-hit bonus for each iteration SHALL be: `iterationBonus + effective ability modifier + active attack modifiers`, where the effective ability modifier accounts for ability damage, drain and ability modifiers, and active attack modifiers are those targeting all attacks or the weapon's attack type (melee or ranged), from conditions, effects and negative levels, after stacking rules. Each to-hit badge SHALL include a type icon (⚔ for melee, 🏹 for ranged) and SHALL have a visible hover state (cursor pointer, brightness/opacity change) to communicate interactivity.

#### Scenario: Melee weapon display
- **WHEN** a melee weapon with STR-based attack is displayed and no modifiers are active
- **THEN** each iteration shows `attackChain[i] + strMod` as the to-hit value (e.g. "+9/+4") with a ⚔ prefix icon

#### Scenario: Ranged weapon display
- **WHEN** a ranged weapon with DEX-based attack is displayed and no modifiers are active
- **THEN** each iteration shows `attackChain[i] + dexMod` as the to-hit value with a 🏹 prefix icon

#### Scenario: Active modifiers included
- **WHEN** a character is Scosso and under Benedizione
- **THEN** each to-hit value is `attackChain[i] + abilityMod − 2 + 1`

#### Scenario: Melee-only modifier
- **WHEN** a character is Prono
- **THEN** melee to-hit values are reduced by 4 and ranged to-hit values are unchanged

#### Scenario: Hover state on attack badge
- **WHEN** the user hovers over a to-hit badge
- **THEN** the badge visually changes (brightness or opacity) to indicate it is clickable

#### Scenario: Global melee chain display
- **WHEN** the global Mischia chain is displayed in the AttacksPanel header section
- **THEN** each badge includes ⚔ and has a visible hover state

#### Scenario: Global ranged chain display
- **WHEN** the global Distanza chain is displayed in the AttacksPanel header section
- **THEN** each badge includes 🏹 and has a visible hover state
