# Spec Delta

## Purpose

Effetti numerici degli oggetti indossati (modificatori preimpostati o personalizzati) e regole di capienza degli slot corporei.

## ADDED Requirements

### Requirement: Item modifiers
Any inventory item SHALL be able to carry typed modifiers, edited with the same editor used for effects (value, bonus type, target). The modifiers of an item SHALL apply only while it is equipped and active, SHALL be named after the item in every breakdown and SHALL follow the existing stacking rules.

#### Scenario: Equipped cloak
- **WHEN** a character equips a "Mantello della Resistenza +2"
- **THEN** every saving throw gets +2 resistance named "Mantello della Resistenza +2"

#### Scenario: Carried item has no effect
- **WHEN** the same cloak is only carried
- **THEN** saving throws are unchanged

#### Scenario: Stacking with a spell
- **WHEN** a character wears the +2 cloak and is under Resistenza (+1 resistance)
- **THEN** saves get +2 and Resistenza is shown as not stacked

### Requirement: Preset item effects
When added from the catalogue, the following items SHALL come with their modifiers already set, for every variant: Mantello della Resistenza (resistance to saves), Anello di Protezione (deflection to AC), Amuleto dell'Armatura Naturale (natural armor to AC), Bracciali dell'Armatura (armor to AC), belts and headbands of ability scores (enhancement to the listed abilities), and a few items with fixed skill bonuses. The owner SHALL be able to edit or remove the preset modifiers.

#### Scenario: Belt of giant strength
- **WHEN** a character with Strength 14 equips a "Cintura della Forza del Gigante +4"
- **THEN** Strength becomes 18 and melee attack and damage increase by 2

#### Scenario: Belt and Forza del toro
- **WHEN** the same character is also under Forza del toro (+4 enhancement)
- **THEN** Strength stays 18 and the spell is shown as not stacked

#### Scenario: Bracers and worn armor
- **WHEN** a character wears "Bracciali dell'Armatura +2" and a chain shirt (+4)
- **THEN** only the +4 armor bonus applies

#### Scenario: Item without preset
- **WHEN** the owner adds a catalogue magic item that has no preset
- **THEN** it has no modifiers and the owner can add them manually

### Requirement: Slot capacity
Each body slot SHALL hold at most one active item, except rings (two). Items equipped beyond the capacity of a slot, counted in inventory order, SHALL be inactive: they stay equipped but their modifiers do not apply. Items with no slot SHALL apply their modifiers when equipped.

#### Scenario: Two rings of protection
- **WHEN** a character equips "Anello di Protezione +1" and "Anello di Protezione +2"
- **THEN** both rings are active and AC gets +2 deflection (the +1 is not stacked)

#### Scenario: Third ring
- **WHEN** a third ring is equipped
- **THEN** it is marked inactive and its modifiers do not apply
