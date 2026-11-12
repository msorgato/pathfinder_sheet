# ability-damage-drain Specification

## Purpose

Danno e risucchio di caratteristica: effetti sui valori derivati, recupero con il riposo e soglie critiche.

## Requirements

### Requirement: Track ability damage and drain
The owner SHALL be able to record, for each ability, a non-negative amount of ability damage and of ability drain, and to increase, decrease or clear them.

#### Scenario: Record damage
- **WHEN** a poison deals 3 Constitution damage
- **THEN** the character shows 3 Constitution damage and it is saved with the character

### Requirement: Ability damage reduces the modifier
Ability damage SHALL NOT change the ability score. Every 2 points of damage to an ability SHALL apply a −1 penalty to all values that use that ability's modifier (including saves, attacks, damage, AC, CMB, CMD, initiative, skills, maximum HP from Constitution and spell DCs). The ability box SHALL show the score, the damage and the resulting modifier.

#### Scenario: Strength damage
- **WHEN** a character with Strength 16 (+3) has 3 Strength damage
- **THEN** the score remains 16, the effective Strength modifier is +2 and melee attack decreases by 1

### Requirement: Ability drain reduces the score
Ability drain SHALL reduce the effective ability score by its amount, and all derived values SHALL follow the reduced score.

#### Scenario: Wisdom drain
- **WHEN** a character with Wisdom 14 suffers 4 Wisdom drain
- **THEN** effective Wisdom is 10 and the Will save decreases by 2

### Requirement: Recovery on full rest
The "Riposo completo" action SHALL heal 1 point of ability damage for each damaged ability. Ability drain SHALL NOT be healed by resting.

#### Scenario: Rest heals damage only
- **WHEN** a character with 3 Constitution damage and 2 Strength drain takes a full rest
- **THEN** Constitution damage becomes 2 and Strength drain remains 2

### Requirement: Critical thresholds are signalled
When ability damage on an ability is equal to or greater than its score, or ability drain reduces a score to 0, the sheet SHALL show a prominent warning with the consequence: unconscious for damage (dead for Constitution), and helpless/unconscious/dead as appropriate for a score of 0.

#### Scenario: Constitution damage equals score
- **WHEN** Constitution damage reaches the character's Constitution score
- **THEN** the sheet warns that the character is dead
