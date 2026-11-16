# Spec Delta

## ADDED Requirements

### Requirement: Stable roll history
The roll history of the dice panel SHALL have a fixed height and scroll inside it, so that the number of rolls made SHALL NOT move the roll button or change the size of the panel.

#### Scenario: Many rolls
- **WHEN** the user makes many rolls from the panel
- **THEN** the history scrolls inside its area and the roll button stays where it was

#### Scenario: First roll
- **WHEN** the user makes the first roll
- **THEN** the roll button does not move
