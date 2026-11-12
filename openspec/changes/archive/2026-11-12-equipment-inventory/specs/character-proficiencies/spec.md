# Spec Delta

## Purpose

Calcolo delle competenze del personaggio in armi, armature e scudi a partire da classi, razza, talenti, divinità e aggiunte manuali, con le penalità per la mancata competenza.

## ADDED Requirements

### Requirement: Structured class proficiencies
Every built-in class SHALL declare its armor proficiencies as a set of categories (light, medium, heavy, shields, tower shield) and its weapon proficiencies as weapon groups (simple, martial) plus a list of specific catalogue weapons, with an optional free-text note.

#### Scenario: Rogue proficiencies
- **WHEN** the Ladro class is read
- **THEN** it is proficient with light armor, simple weapons and hand crossbow, rapier, sap, shortbow and short sword

### Requirement: Proficiencies from multiple sources
The character's proficiencies SHALL be the union of: all its classes, racial weapon familiarity, proficiency feats with their chosen weapon, the deity's favored weapon (when a class grants it) and proficiencies added manually by the owner. The equipment tab SHALL list them with their source.

#### Scenario: Multiclass union
- **WHEN** a Mago 1 / Guerriero 1 is evaluated
- **THEN** it is proficient with all armor, shields, tower shield, simple and martial weapons

#### Scenario: Elf weapon familiarity
- **WHEN** an elf wizard is evaluated
- **THEN** it is proficient with longsword, rapier, longbow and shortbow

### Requirement: Proficiency feats
The feats Competenza nelle Armature Leggere/Medie/Pesanti, Competenza negli Scudi, Competenza negli Scudi Torre and Competenza nelle Armi Semplici SHALL grant the corresponding category. Competenza nelle Armi da Guerra and Competenza nelle Armi Esotiche SHALL grant a single weapon chosen by the owner; each instance of the feat SHALL hold its own choice.

#### Scenario: Exotic weapon choice
- **WHEN** a character has Competenza nelle Armi Esotiche with the choice "Catena chiodata"
- **THEN** it is proficient with the spiked chain and with no other exotic weapon

#### Scenario: Feat without a choice
- **WHEN** a character has Competenza nelle Armi da Guerra without a chosen weapon
- **THEN** the equipment tab prompts the owner to choose the weapon

### Requirement: Non-proficient weapon penalty
Attacks with a weapon the character is not proficient with SHALL take a −4 penalty on attack rolls, shown in the breakdown as "Non competente".

#### Scenario: Wizard with a longsword
- **WHEN** a human wizard attacks with a longsword
- **THEN** the to-hit values include −4 "Non competente"

### Requirement: Non-proficient armor penalty
When the character wears armor or a shield it is not proficient with, the item's armor check penalty SHALL also apply to attack rolls and to all Strength- and Dexterity-based skill checks.

#### Scenario: Wizard in chainmail
- **WHEN** a wizard wears "Cotta di maglia" (−5)
- **THEN** attack rolls and all Strength- and Dexterity-based skills get −5

### Requirement: Class restriction warnings
The sheet SHALL show a warning, without blocking, when a Druido equips metal armor or a metal shield, and when a character's only shield proficiency excludes the tower shield and it equips one.

#### Scenario: Druid in metal armor
- **WHEN** a druid equips "Cotta di maglia"
- **THEN** a warning states that the druid loses spellcasting and supernatural abilities while wearing it

### Requirement: Manual proficiencies
The owner SHALL be able to add and remove armor categories and specific weapons as manual proficiencies, to cover traits, archetypes and house rules.

#### Scenario: Trait grants a weapon
- **WHEN** the owner adds "Spada bastarda" as a manual proficiency
- **THEN** attacks with a bastard sword no longer take the −4 penalty
