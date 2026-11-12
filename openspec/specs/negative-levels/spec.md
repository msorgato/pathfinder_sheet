# negative-levels Specification

## Purpose

Livelli negativi temporanei e permanenti, loro penalità e soglia di morte.

## Requirements

### Requirement: Track negative levels
The owner SHALL be able to record temporary and permanent negative levels separately as non-negative integers, and to add or remove them.

#### Scenario: Gain a negative level
- **WHEN** an energy drain attack bestows one negative level
- **THEN** the character shows 1 temporary negative level, saved with the character

### Requirement: Negative level penalties
Each negative level, temporary or permanent, SHALL apply: −1 to attack rolls, CMB, CMD, saving throws, skill checks and ability checks; −5 to maximum hit points. The penalties SHALL stack with each other and appear in the source breakdown as "Livelli negativi".

#### Scenario: Two negative levels
- **WHEN** a character has 2 negative levels
- **THEN** attack rolls, saves, skills, CMB and CMD are reduced by 2 and maximum HP by 10

### Requirement: Effective level reminder
When the character has negative levels, the sheet SHALL remind that level-dependent abilities (caster level, class features) are treated as lower by the number of negative levels; this reminder SHALL NOT change spell slots or class features automatically.

#### Scenario: Caster reminder
- **WHEN** a spellcaster has 1 negative level
- **THEN** the spells section shows that the effective caster level is reduced by 1

### Requirement: Death threshold
When total negative levels are equal to or greater than the character's total Hit Dice, the sheet SHALL show a prominent warning that the character dies.

#### Scenario: Negative levels reach level
- **WHEN** a 3rd-level character reaches 3 negative levels
- **THEN** the sheet warns that the character is dead
