# Spec Delta

## Purpose

Pozioni, pergamene e bacchette create dagli incantesimi del database: parametri, valori calcolati, usabilità, uso con consumo e applicazione dell'effetto.

## ADDED Requirements

### Requirement: Create a consumable from a spell
The owner SHALL be able to create a potion, a scroll or a wand from a spell of the database by choosing the form, the class list (which sets the spell level), the caster level, and the quantity (potions, scrolls) or charges (wands). The item SHALL be added to the inventory, or purchased with the existing purchase flow.

#### Scenario: Potion of cure light wounds
- **WHEN** the owner creates a potion of Cura Ferite Leggere from the cleric list with caster level 1 and quantity 3
- **THEN** the inventory contains "Pozione di Cura Ferite Leggere (LI 1)" ×3, spell level 1

#### Scenario: Wand charges
- **WHEN** the owner creates a wand of Armatura Magica with 50 charges
- **THEN** the wand shows 50/50 charges

### Requirement: Form limits
Potions SHALL only be created from spells of level 3 or lower, wands from spells of level 4 or lower, scrolls from any level. A wand SHALL hold at most 50 charges. Class lists where the spell exceeds the form's limit SHALL not be selectable.

#### Scenario: Potion of a 4th-level spell
- **WHEN** the owner chooses the potion form for a spell that is 4th level on every list
- **THEN** creation is not possible and a message explains the limit

### Requirement: Default caster level
The caster level SHALL default to the minimum for the spell level (1 for level 0 and 1, then 2 × level − 1) and SHALL be editable, never below that minimum.

#### Scenario: Default for a 3rd-level spell
- **WHEN** the owner creates a scroll of a 3rd-level spell
- **THEN** the caster level proposed is 5

### Requirement: Computed price and DC
The list price SHALL be base × spell level × caster level, with base 50 mo for potions, 25 mo for scrolls and 750 mo for wands, and spell level 0 counted as ½. The saving throw DC of the item SHALL be 10 + spell level + ⌊spell level / 2⌋. Both SHALL be shown on the item.

#### Scenario: Prices
- **WHEN** the owner creates a potion of a 1st-level spell at caster level 1, a scroll of a 3rd-level spell at caster level 5 and a wand of a 1st-level spell at caster level 1
- **THEN** their prices are 50 mo, 375 mo and 750 mo

#### Scenario: Item DC
- **WHEN** a scroll holds a 3rd-level spell
- **THEN** its DC is 14, whatever the character's ability scores

### Requirement: Usability
Potions SHALL be usable by anyone. Scrolls and wands SHALL be usable without checks when the spell is on the list of one of the character's classes; otherwise the item SHALL show the Utilizzare Congegni Magici check required: DC 20 for wands, DC 20 + caster level for scrolls. For a scroll on the character's list whose caster level is higher than the character's, the item SHALL show the caster level check required (DC caster level + 1).

#### Scenario: Wizard reads a wizard scroll
- **WHEN** a 5th-level wizard holds a scroll of Armatura Magica (wizard list, caster level 1)
- **THEN** the scroll is marked usable

#### Scenario: Fighter and a wand
- **WHEN** a fighter holds a wand of Cura Ferite Leggere
- **THEN** the wand shows "Utilizzare Congegni Magici CD 20"

#### Scenario: Scroll above the caster level
- **WHEN** a 1st-level wizard holds a scroll of a 1st-level spell at caster level 5
- **THEN** the scroll shows "prova di livello dell'incantatore CD 6"

### Requirement: Use a consumable
Using a potion or scroll SHALL remove one from its quantity; using a wand SHALL remove one charge. Using an item with no charges or quantity SHALL not be possible.

#### Scenario: Drink a potion
- **WHEN** the owner uses one of three potions
- **THEN** two remain

#### Scenario: Empty wand
- **WHEN** a wand has 0 charges
- **THEN** the Usa action is disabled and the wand is marked "scarica"

### Requirement: Exhaustion
Potions and scrolls whose quantity reaches 0 SHALL be removed from the inventory. Wands with 0 charges SHALL stay in the inventory, marked "scarica", until the owner removes them.

#### Scenario: Last potion
- **WHEN** the owner uses the last potion
- **THEN** the potion is no longer in the inventory

#### Scenario: Last charge
- **WHEN** the owner uses the last charge of a wand
- **THEN** the wand stays in the inventory with 0/50 charges, marked "scarica"

### Requirement: Apply the spell effect
When the spell of the used item is linked to an effect preset, using it SHALL also add that effect to the character, computed at the item's caster level and named after the item. A confirmation SHALL offer an "Annulla" action that restores the consumed dose or charge and removes the added effect.

#### Scenario: Potion of shield of faith
- **WHEN** the owner drinks a potion of Scudo della Fede at caster level 6
- **THEN** the character gains an effect "Scudo della Fede (LI 6)" with +3 deflection to AC

#### Scenario: Undo
- **WHEN** the owner presses Annulla after using that potion
- **THEN** the potion count is restored and the effect is removed

#### Scenario: Spell without a preset
- **WHEN** the owner uses a potion of Cura Ferite Leggere
- **THEN** only the quantity changes and no effect is added

### Requirement: Consumables in the combat tab
The combat tab SHALL show a compact "Consumabili" section listing the character's potions, scrolls and wands with their remaining quantity or charges, usability and a Usa action. The section SHALL be hidden when the character has no consumables.

#### Scenario: Quick use in combat
- **WHEN** the character has 2 potions of Cura Ferite Leggere
- **THEN** the combat tab lists them with "×2" and a Usa button

### Requirement: Read-only views
Where the inventory is shown read-only (lobby), consumables SHALL be listed with their quantity or charges but SHALL NOT offer the Usa action.

#### Scenario: Lobby view
- **WHEN** a lobby member views the character's equipment
- **THEN** consumables are listed without a Usa button
