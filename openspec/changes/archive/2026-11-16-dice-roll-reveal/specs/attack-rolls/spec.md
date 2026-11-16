# Spec Delta

## MODIFIED Requirements

### Requirement: Quick attack roll
The system SHALL allow the user to roll a d20 + to-hit bonus for any weapon attack by clicking on it. The roll SHALL be forwarded to the DiceRoller component using the existing `onQuickRoll` callback pattern, together with the weapon's threat range and the breakdown of the to-hit bonus as named entries whose sum equals the bonus.

#### Scenario: Roll to-hit for first attack
- **WHEN** the user clicks the to-hit badge of the first attack of a weapon
- **THEN** a d20 roll with the corresponding bonus is forwarded to the DiceRoller

#### Scenario: Roll to-hit for iterative attack
- **WHEN** the user clicks the to-hit badge of an iterative attack (e.g. the −5 attack)
- **THEN** a d20 roll with the reduced bonus is forwarded to the DiceRoller

#### Scenario: Threat range and breakdown
- **WHEN** the user clicks the to-hit badge of a keen longsword +1 (threat 17–20)
- **THEN** the roll carries threat range 17 and named entries including the enhancement bonus, summing to the to-hit bonus
