## ADDED Requirements

### Requirement: Attack chain calculation
The system SHALL compute the iterative attack bonus array from the character's total BAB following PF1e rules: one additional attack for every 5 points of BAB above 1 (at BAB−5, BAB−10, BAB−15). A character with BAB 0 SHALL receive a single attack at +0.

#### Scenario: Single attack (BAB 1–5)
- **WHEN** total BAB is between 1 and 5
- **THEN** `attackChain` returns a single-element array equal to `[bab]`

#### Scenario: Two attacks (BAB 6–10)
- **WHEN** total BAB is between 6 and 10
- **THEN** `attackChain` returns `[bab, bab - 5]`

#### Scenario: Three attacks (BAB 11–15)
- **WHEN** total BAB is between 11 and 15
- **THEN** `attackChain` returns `[bab, bab - 5, bab - 10]`

#### Scenario: Four attacks (BAB 16–20)
- **WHEN** total BAB is 16 or higher
- **THEN** `attackChain` returns `[bab, bab - 5, bab - 10, bab - 15]`

#### Scenario: BAB zero
- **WHEN** total BAB is 0
- **THEN** `attackChain` returns `[0]`

---

### Requirement: Weapon attack definition
The system SHALL allow the user to define named weapon attacks on a character. Each weapon attack SHALL store: unique id, name, damage dice (count + die type), ability modifier key used for to-hit and damage, attack type (melee or ranged), and optional free-text notes.

#### Scenario: Add weapon attack
- **WHEN** the user submits the "add weapon" form with valid name and damage dice
- **THEN** the weapon is appended to `character.weaponAttacks` and persisted to Firestore

#### Scenario: Remove weapon attack
- **WHEN** the user removes a weapon attack
- **THEN** it is deleted from `character.weaponAttacks` and the change is persisted

#### Scenario: Weapon list empty
- **WHEN** `character.weaponAttacks` is empty
- **THEN** the panel shows an empty-state prompt inviting the user to add a weapon

---

### Requirement: Attack roll display
The system SHALL display, for each weapon attack, the full to-hit bonus for every iterative attack in the chain. The to-hit bonus for each iteration SHALL be: `iterationBonus + abilityMod(abilityScore)`.

#### Scenario: Melee weapon display
- **WHEN** a melee weapon with STR-based attack is displayed
- **THEN** each iteration shows `attackChain[i] + strMod` as the to-hit value (e.g. "+9/+4")

#### Scenario: Ranged weapon display
- **WHEN** a ranged weapon with DEX-based attack is displayed
- **THEN** each iteration shows `attackChain[i] + dexMod` as the to-hit value

---

### Requirement: Quick attack roll
The system SHALL allow the user to roll a d20 + to-hit bonus for any weapon attack by clicking on it. The roll SHALL be forwarded to the DiceRoller component using the existing `onQuickRoll` callback pattern.

#### Scenario: Roll to-hit for first attack
- **WHEN** the user clicks the to-hit badge of the first attack of a weapon
- **THEN** a d20 roll with the corresponding bonus is forwarded to the DiceRoller

#### Scenario: Roll to-hit for iterative attack
- **WHEN** the user clicks the to-hit badge of an iterative attack (e.g. the −5 attack)
- **THEN** a d20 roll with the reduced bonus is forwarded to the DiceRoller

---

### Requirement: Quick damage roll
The system SHALL allow the user to roll damage for a weapon attack by clicking the damage badge. The damage roll SHALL use the weapon's damage dice count and die type, plus `abilityMod(abilityScore)` as flat modifier.

#### Scenario: Roll damage
- **WHEN** the user clicks the damage badge of a weapon
- **THEN** a roll with `numDice × dieType + abilityMod` is forwarded to the DiceRoller

#### Scenario: Damage modifier sign
- **WHEN** the ability modifier is negative
- **THEN** the damage roll modifier is the negative value (minimum 1 final result is not enforced at this layer)

---

### Requirement: Backward compatibility for existing characters
Existing characters loaded from Firestore that do not have a `weaponAttacks` field SHALL be treated as having an empty weapon list without errors.

#### Scenario: Missing weaponAttacks field
- **WHEN** a character loaded from Firestore has no `weaponAttacks` property
- **THEN** the app defaults to `weaponAttacks: []` and no error is thrown
