# feat-prerequisites Specification

## Purpose

Regole con cui si verificano i prerequisiti dei talenti, in particolare quali punteggi di caratteristica contano.

## Requirements

### Requirement: Base ability scores for prerequisites
Ability score prerequisites of feats SHALL be checked against the base scores only: the starting score plus racial modifiers, level increases and age modifiers. Bonuses from items, effects and conditions, ability damage and ability drain SHALL NOT count.

#### Scenario: Magic belt
- **WHEN** a character with Forza 12 wears a Cintura della Forza del Gigante +2 and checks a feat requiring Forza 13
- **THEN** the prerequisite is not met

#### Scenario: Level increase
- **WHEN** a character with Forza 12 takes +1 Forza at 4th level and checks a feat requiring Forza 13
- **THEN** the prerequisite is met

#### Scenario: Ability damage
- **WHEN** a character with Destrezza 15 has 4 points of Destrezza damage and checks a feat requiring Destrezza 15
- **THEN** the prerequisite is met
