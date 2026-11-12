# character-modifiers Specification

## Purpose

Modificatori tipizzati con regole di cumulo PF1, calcolo unico dei valori derivati della scheda e dettaglio delle fonti.

## Requirements

### Requirement: Typed modifiers
A modifier SHALL have a target, a bonus type and a signed integer value. Supported targets SHALL be: each ability score; attack rolls (all, melee, ranged); weapon damage (all, melee, ranged); Armor Class; saving throws (all, Fortitude, Reflex, Will); skill checks (all, or a single skill); ability checks; initiative; CMB; CMD. Supported bonus types SHALL be the Pathfinder 1E types: alchemical, armor, circumstance, competence, deflection, dodge, enhancement, inherent, insight, luck, morale, natural armor, profane, racial, resistance, sacred, shield, size, trait, untyped.

#### Scenario: Modifier with type and target
- **WHEN** an effect grants "+2 morale to attack rolls"
- **THEN** the system records a modifier with target attack (all), type morale and value +2

### Requirement: Stacking rules
For each target, positive modifiers of the same bonus type SHALL NOT stack: only the highest applies. Dodge, circumstance and untyped bonuses SHALL stack with each other and with themselves. Penalties (negative values) SHALL always stack. Bonuses of different types SHALL stack.

#### Scenario: Same-type bonuses do not stack
- **WHEN** a character has +1 morale (Benedizione) and +2 morale (Eroismo) to attack
- **THEN** the attack modifier from these effects is +2

#### Scenario: Different types stack
- **WHEN** a character has +1 morale and +1 luck to attack
- **THEN** the attack modifier from these effects is +2

#### Scenario: Dodge bonuses stack
- **WHEN** a character has two +1 dodge bonuses to AC
- **THEN** AC increases by 2

#### Scenario: Penalties stack
- **WHEN** a character is Shaken (−2 attack) and under Anatema (−1 attack)
- **THEN** the attack modifier from these sources is −3

### Requirement: Broader targets apply to narrower ones
A modifier to "all attacks" SHALL apply to melee and ranged attacks; "all saves" SHALL apply to each save; "all skills" SHALL apply to every skill; "all damage" SHALL apply to melee and ranged damage. Stacking rules SHALL be evaluated over the combined set of modifiers that apply to the final value.

#### Scenario: All-saves and Will bonus of the same type
- **WHEN** a character has +1 resistance to all saves and +2 resistance to Will
- **THEN** Will gets +2 and Fortitude and Reflex get +1

### Requirement: Ability score modifiers propagate
Modifiers targeting an ability score SHALL change the effective score, and every value derived from that ability (its modifier, saves, attacks, damage, AC, CMB, CMD, initiative, skills, maximum HP, spell DCs and bonus spells) SHALL use the effective score.

#### Scenario: Strength enhancement raises attack
- **WHEN** a character with Strength 14 gains +4 enhancement to Strength
- **THEN** effective Strength is 18 and melee attack and CMB increase by 2

### Requirement: Derived values are computed in one place
All values shown or rolled in the character sheet, the home page summary and the lobby sheet panel SHALL come from the same computation, so that the same character shows the same numbers everywhere.

#### Scenario: Lobby shows modified values
- **WHEN** a character under Benedizione is shown in the lobby sheet panel
- **THEN** its attack bonuses include the +1 morale bonus, as in the character sheet

### Requirement: Armor Class variants and Dexterity loss
The system SHALL compute Armor Class, touch AC and flat-footed AC. Touch AC SHALL exclude armor, shield and natural armor bonuses. Flat-footed AC SHALL exclude a positive Dexterity modifier and dodge bonuses. When an active condition makes the character lose its Dexterity bonus to AC, normal AC and CMD SHALL also exclude a positive Dexterity modifier and dodge bonuses. Penalties to AC SHALL also apply to CMD.

#### Scenario: Flat-footed condition
- **WHEN** a character with Dexterity modifier +3 becomes flat-footed
- **THEN** AC and CMD no longer include the +3

### Requirement: Source breakdown
For every derived value affected by modifiers, the user SHALL be able to see the list of contributing sources with their type and value, including which bonuses are suppressed by stacking. Values changed by active modifiers SHALL be visually distinguished (raised or lowered) from their base.

#### Scenario: Inspect a modified save
- **WHEN** the user opens the detail of a modified Will save
- **THEN** the base value and each contributing source (name, type, value) are listed, and suppressed bonuses are marked as not applied
