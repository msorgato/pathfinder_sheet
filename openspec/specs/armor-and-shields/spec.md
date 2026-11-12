# armor-and-shields Specification

## Purpose

Effetti di armatura e scudo indossati sulle statistiche: CA, Destrezza massima, penalità di armatura, fallimento arcano e velocità.

## Requirements

### Requirement: Armor and shield bonus to AC
An equipped armor SHALL add its armor bonus and an equipped shield its shield bonus to AC and flat-footed AC, as typed modifiers named after the item. They SHALL follow the existing stacking rules (e.g. Armatura magica and a worn armor do not stack) and SHALL NOT apply to touch AC.

#### Scenario: Chain shirt and heavy shield
- **WHEN** a character with Dexterity +1 equips "Giaco di maglia" (+4) and "Scudo pesante di legno" (+2)
- **THEN** AC is 17, touch AC is 11 and flat-footed AC is 16

#### Scenario: Armor does not stack with Armatura magica
- **WHEN** a character wears a +4 armor and is under Armatura magica (+4 armor)
- **THEN** only one +4 armor bonus applies and the other is shown as not stacked

### Requirement: Maximum Dexterity bonus
The positive Dexterity modifier added to AC and CMD SHALL be capped at the lowest maximum Dexterity bonus among the equipped armor and shield. The cap SHALL NOT affect Reflex saves, attacks, skills or initiative.

#### Scenario: Dexterity capped by armor
- **WHEN** a character with Dexterity +4 equips "Corazza di piastre" (max Dex +3)
- **THEN** AC and CMD include +3 from Dexterity and the breakdown shows the cap

#### Scenario: Reflex unaffected
- **WHEN** the same character rolls a Reflex save
- **THEN** the full Dexterity +4 is used

### Requirement: Armor check penalty
The armor check penalties of the equipped armor and shield SHALL be summed and applied to every skill that is subject to armor check penalty, as a source named after each item.

#### Scenario: Penalty on Acrobatics
- **WHEN** a character equips "Cotta di maglia" (−5) and "Scudo pesante di metallo" (−2)
- **THEN** Acrobazia and Scalare get −7 and Diplomazia is unchanged

### Requirement: Arcane spell failure warning
When the character has arcane spellcasting and equips armor or a shield with arcane spell failure, the sheet SHALL show the total failure chance as a warning near spells and in the equipment tab. It SHALL NOT be applied automatically.

#### Scenario: Wizard in leather
- **WHEN** a wizard equips "Armatura di cuoio" (10%)
- **THEN** a warning "Fallimento incantesimi arcani 10%" is shown

### Requirement: Speed reduction
The system SHALL show the character's speed in meters in the combat tab, next to BAB and initiative. Equipping medium or heavy armor SHALL reduce a base speed of 9 m to 6 m and 6 m to 4.5 m, except for races whose speed is never modified by armor (Nano).

#### Scenario: Human in heavy armor
- **WHEN** a human (9 m) equips heavy armor
- **THEN** the speed shown is 6 m with the armor as reason

#### Scenario: Dwarf in heavy armor
- **WHEN** a dwarf (6 m) equips heavy armor
- **THEN** the speed shown stays 6 m
