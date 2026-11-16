# Spec Delta

## MODIFIED Requirements

### Requirement: Usability
Potions SHALL be usable by anyone. Scrolls and wands SHALL be usable without checks when the spell is on the list of one of the character's classes; otherwise the item SHALL show the Utilizzare Congegni Magici check required: DC 20 for wands, DC 20 + caster level for scrolls. For a scroll on the character's list whose caster level is higher than the character's caster level for that class (as defined by its spellcasting progression), the item SHALL show the caster level check required (DC caster level + 1).

#### Scenario: Wizard reads a wizard scroll
- **WHEN** a 5th-level wizard holds a scroll of Armatura Magica (wizard list, caster level 1)
- **THEN** the scroll is marked usable

#### Scenario: Fighter and a wand
- **WHEN** a fighter holds a wand of Cura Ferite Leggere
- **THEN** the wand shows "Utilizzare Congegni Magici CD 20"

#### Scenario: Scroll above the caster level
- **WHEN** a 1st-level wizard holds a scroll of a 1st-level spell at caster level 5
- **THEN** the scroll shows "prova di livello dell'incantatore CD 6"

#### Scenario: Paladin caster level
- **WHEN** a 5th-level paladin holds a paladin scroll at caster level 4
- **THEN** the scroll shows "prova di livello dell'incantatore CD 5", because the paladin's caster level is 2
