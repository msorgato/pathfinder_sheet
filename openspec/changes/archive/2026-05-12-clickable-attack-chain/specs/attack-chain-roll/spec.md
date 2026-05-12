## ADDED Requirements

### Requirement: Clickable global attack chain
The system SHALL render each iteration of the global attack chain (Mischia and Distanza) as a separate clickable badge. Clicking a badge SHALL forward a `RollRequest` of `1d20 + bonus` to the `onQuickRoll` callback, where `bonus` is the iteration's BAB value plus the relevant ability modifier (STR for Mischia, DEX for Distanza).

#### Scenario: Click first Mischia iteration
- **WHEN** the user clicks the first Mischia badge (BAB + STR mod)
- **THEN** a `RollRequest { numDice: 1, dieType: 20, modifier: bab + strMod }` is forwarded to `onQuickRoll`

#### Scenario: Click iterative Mischia attack
- **WHEN** the user clicks the second (or later) Mischia badge
- **THEN** a `RollRequest` with `modifier: chainIteration + strMod` is forwarded to `onQuickRoll`

#### Scenario: Click first Distanza iteration
- **WHEN** the user clicks the first Distanza badge (BAB + DEX mod)
- **THEN** a `RollRequest { numDice: 1, dieType: 20, modifier: bab + dexMod }` is forwarded to `onQuickRoll`

#### Scenario: No onQuickRoll provided
- **WHEN** `onQuickRoll` is not provided to `AttacksPanel`
- **THEN** the badges are rendered without pointer cursor and clicking has no effect

#### Scenario: Single attack (BAB 1–5)
- **WHEN** the character's BAB yields a single-element chain
- **THEN** Mischia and Distanza each show one badge only
