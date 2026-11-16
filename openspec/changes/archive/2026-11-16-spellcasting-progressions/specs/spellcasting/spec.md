# Spec Delta

## Purpose

Regole comuni della magia di una classe, base o personalizzata: progressione, slot e incantesimi conosciuti, livello dell'incantatore, livello di un incantesimo per la classe.

## ADDED Requirements

### Requirement: Spellcasting progressions
A spellcasting class SHALL have a progression (full, up to 9th level; medium, up to 6th; reduced, up to 4th) and a type (prepared or spontaneous). Together they SHALL set the spell slots per day, the spells known for spontaneous casters, and the highest spell level, using the existing tables: full prepared as the wizard, full spontaneous as the sorcerer, medium as the bard, reduced prepared as the paladin. Reduced spontaneous SHALL not be available.

#### Scenario: Built-in classes keep their tables
- **WHEN** a 5th-level wizard, sorcerer, bard and paladin are shown
- **THEN** their slots per day are the same as before this change

#### Scenario: Medium prepared
- **WHEN** a class has a medium progression and prepared spells
- **THEN** it uses the bard slots per day, with no spells known, up to 6th level

### Requirement: Caster level
The caster level of a character for a class SHALL be the class level for full and medium progressions, and the class level minus 3 (minimum 0) for the reduced progression. Every place that needs a caster level SHALL use this rule.

#### Scenario: Paladin
- **WHEN** a character is a 7th-level paladin
- **THEN** their paladin caster level is 4

#### Scenario: Wizard
- **WHEN** a character is a 7th-level wizard
- **THEN** their wizard caster level is 7

### Requirement: Spell list and spell level of a class
The spell list of a class SHALL be: for a built-in class, the spells that list the class with a level; for a custom class, the union of the spells of its source list (at the source list's level) and of its additional spells (at the level set for each). When a spell is in both, the additional spell's level SHALL prevail. Spells above the class's highest spell level SHALL not be selectable.

#### Scenario: Union
- **WHEN** a custom class has source list cleric and Palla di Fuoco as an additional spell at 3rd level
- **THEN** its list contains the cleric spells and Palla di Fuoco at 3rd level

#### Scenario: Above the highest level
- **WHEN** a custom class with reduced progression has source list wizard
- **THEN** wizard spells above 4th level are not selectable

### Requirement: Legacy custom spellcasting
A custom class with spellcasting enabled, a source list and no ability, type, tradition or progression SHALL inherit them from the built-in class of its source list. A custom class with spellcasting enabled, no source list and an incomplete configuration SHALL not be shown as a caster.

#### Scenario: Old class with a source list
- **WHEN** a custom class saved before this change has spellcasting enabled and source list sorcerer only
- **THEN** it casts with Charisma, spontaneous, arcane, full progression, like the sorcerer
