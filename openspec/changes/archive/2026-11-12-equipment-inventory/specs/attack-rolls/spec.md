# Spec Delta

## MODIFIED Requirements

### Requirement: Weapon attack definition
The system SHALL allow the user to define named weapon attacks on a character. Each weapon attack SHALL store: unique id, name, damage dice (count + die type), ability modifier key used for to-hit and damage, attack type (melee or ranged), critical threat range and multiplier (default 20/×2), whether it is wielded two-handed, an optional link to an inventory weapon, and optional free-text notes. An attack linked to an inventory weapon SHALL take name, damage dice, critical, attack type and handedness from the weapon.

#### Scenario: Add weapon attack
- **WHEN** the user submits the "add weapon" form with valid name and damage dice
- **THEN** the weapon is appended to `character.weaponAttacks` and persisted to Firestore

#### Scenario: Add attack from inventory weapon
- **WHEN** the user creates an attack from the inventory weapon "Spadone"
- **THEN** the attack has damage 2d6, critical 19–20/×2, melee, two-handed, and is linked to that item

#### Scenario: Linked weapon edited
- **WHEN** the owner edits the damage of a linked inventory weapon
- **THEN** the attack shows the updated damage

#### Scenario: Remove weapon attack
- **WHEN** the user removes a weapon attack
- **THEN** it is deleted from `character.weaponAttacks` and the change is persisted

#### Scenario: Weapon list empty
- **WHEN** `character.weaponAttacks` is empty
- **THEN** the panel shows an empty-state prompt inviting the user to add a weapon

---

### Requirement: Attack roll display
The system SHALL display, for each weapon attack, the full to-hit bonus for every iterative attack in the chain. The to-hit bonus for each iteration SHALL be: `iterationBonus + effective ability modifier + active attack modifiers`, where the effective ability modifier accounts for ability damage, drain and ability modifiers, and active attack modifiers are those targeting all attacks or the weapon's attack type (melee or ranged), from conditions, effects, negative levels, non-proficiency with the weapon (−4) and with worn armor (armor check penalty), after stacking rules. Each attack SHALL show its critical range and multiplier. Each to-hit badge SHALL include a type icon (⚔ for melee, 🏹 for ranged) and SHALL have a visible hover state (cursor pointer, brightness/opacity change) to communicate interactivity.

#### Scenario: Melee weapon display
- **WHEN** a melee weapon with STR-based attack is displayed and no modifiers are active
- **THEN** each iteration shows `attackChain[i] + strMod` as the to-hit value (e.g. "+9/+4") with a ⚔ prefix icon

#### Scenario: Ranged weapon display
- **WHEN** a ranged weapon with DEX-based attack is displayed and no modifiers are active
- **THEN** each iteration shows `attackChain[i] + dexMod` as the to-hit value with a 🏹 prefix icon

#### Scenario: Active modifiers included
- **WHEN** a character is Scosso and under Benedizione
- **THEN** each to-hit value is `attackChain[i] + abilityMod − 2 + 1`

#### Scenario: Melee-only modifier
- **WHEN** a character is Prono
- **THEN** melee to-hit values are reduced by 4 and ranged to-hit values are unchanged

#### Scenario: Non-proficient weapon
- **WHEN** the character is not proficient with the attack's weapon
- **THEN** each to-hit value of that attack is reduced by 4 and other attacks are unchanged

#### Scenario: Critical shown
- **WHEN** an attack with critical 19–20/×2 is displayed
- **THEN** "19–20/×2" is visible next to its damage

#### Scenario: Hover state on attack badge
- **WHEN** the user hovers over a to-hit badge
- **THEN** the badge visually changes (brightness or opacity) to indicate it is clickable

#### Scenario: Global melee chain display
- **WHEN** the global Mischia chain is displayed in the AttacksPanel header section
- **THEN** each badge includes ⚔ and has a visible hover state

#### Scenario: Global ranged chain display
- **WHEN** the global Distanza chain is displayed in the AttacksPanel header section
- **THEN** each badge includes 🏹 and has a visible hover state

---

### Requirement: Quick damage roll
The system SHALL allow the user to roll damage for a weapon attack by clicking the damage badge. The damage roll SHALL use the weapon's damage dice count and die type, plus the ability modifier as flat modifier. For a Strength-based attack wielded two-handed, a positive Strength modifier SHALL be multiplied by 1.5 (rounded down); penalties SHALL NOT be multiplied.

#### Scenario: Roll damage
- **WHEN** the user clicks the damage badge of a weapon
- **THEN** a roll with `numDice × dieType + abilityMod` is forwarded to the DiceRoller

#### Scenario: Two-handed damage
- **WHEN** a character with Strength modifier +3 rolls damage with a two-handed greatsword
- **THEN** the roll is 2d6 + 4

#### Scenario: Damage modifier sign
- **WHEN** the ability modifier is negative
- **THEN** the damage roll modifier is the negative value (minimum 1 final result is not enforced at this layer)
