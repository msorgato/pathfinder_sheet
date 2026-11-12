## ADDED Requirements

### Requirement: Effect presets
The system SHALL provide a library of common effect presets, each with an Italian name, a short description and a list of typed modifiers. The library SHALL include at least: Benedizione, Anatema, Velocità, Lentezza, Ingrandire persona, Ridurre persona, Forza del toro, Grazia del gatto, Resistenza dell'orso, Astuzia della volpe, Saggezza del gufo, Splendore dell'aquila, Armatura magica, Scudo, Scudo della fede, Pelle coriacea, Resistenza, Eroismo, Preghiera (alleati), Preghiera (nemici), Ispirare coraggio, Ira.

#### Scenario: Preset content
- **WHEN** the user selects the preset Ingrandire persona
- **THEN** it proposes +2 size Strength, −2 size Dexterity, −1 size attack rolls and −1 size AC

### Requirement: Presets become editable copies
Adding a preset SHALL create an effect on the character that copies the preset's name and modifiers. The user SHALL be able to edit the copy (name, modifier values, add or remove modifiers) without changing the preset, for example to scale a bonus with caster level.

#### Scenario: Scale a preset
- **WHEN** the user adds Pelle coriacea and changes its natural armor bonus from +2 to +3
- **THEN** the character's effect grants +3 natural armor and the preset still proposes +2

### Requirement: Custom effects
The owner SHALL be able to create a custom effect with a name, an optional note and one or more modifiers, each chosen by target, bonus type and value.

#### Scenario: Create custom debuff
- **WHEN** the user creates "Maledizione della strega" with −2 untyped to Will saves
- **THEN** the Will save shown in the sheet is reduced by 2 while the effect is active

### Requirement: Effect management
Active effects SHALL be listed with name, summary of modifiers and note. Effects have no duration: they stay active until the owner disables or removes them. The owner SHALL be able to edit, temporarily disable (keeping it in the list) and remove an effect. Disabled effects SHALL NOT contribute modifiers. Active effects SHALL also appear as chips in the character sheet header.

#### Scenario: Disable an effect
- **WHEN** the user disables Ira
- **THEN** its modifiers stop applying and the effect remains listed as disabled
