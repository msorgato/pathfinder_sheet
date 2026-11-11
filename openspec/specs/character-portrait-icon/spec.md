# character-portrait-icon Specification

## Purpose

Icona ritratto del personaggio: catalogo, scelta, persistenza e ordine di fallback (icona scelta, icona della classe, iniziale).

## Requirements

### Requirement: Portrait icon catalogue
The system SHALL offer a fixed catalogue of portrait icons, one for each class icon available in the site's class icon set (40 icons), each with a human-readable Italian name.

#### Scenario: Catalogue is complete
- **WHEN** the user opens the portrait icon selection
- **THEN** every available class icon is offered, each with its name as tooltip or label

### Requirement: Character portrait icon field
A character SHALL have an optional portrait icon identifier. When absent, the portrait falls back automatically. An identifier not present in the catalogue SHALL be treated as absent.

#### Scenario: Chosen icon persists on reload
- **WHEN** a user chooses a portrait icon and reloads the page
- **THEN** the same icon is shown in the portrait

#### Scenario: Unknown identifier
- **WHEN** a character's stored portrait icon is not in the catalogue
- **THEN** the portrait behaves as if no icon had been chosen

### Requirement: Portrait fallback chain
The portrait SHALL display, in order of precedence: the chosen portrait icon; otherwise the icon matching the character's primary class (the first class entry), when one exists; otherwise the first letter of the character's name, or "?" when the name is empty.

#### Scenario: Chosen icon wins
- **WHEN** a Fighter character has chosen the "Mago" icon
- **THEN** the portrait shows the "Mago" icon

#### Scenario: Class icon default
- **WHEN** a Fighter character has no chosen icon
- **THEN** the portrait shows the "Guerriero" icon

#### Scenario: Initial as last fallback
- **WHEN** a character with no chosen icon has a primary class without a matching icon (for example a custom class)
- **THEN** the portrait shows the first letter of the character's name

### Requirement: Icon selection in character customization
The character customization panel SHALL let the user pick a portrait icon from the catalogue, highlight the active choice, and offer an "Automatico" option that clears the choice. Selecting an icon SHALL update the portrait immediately and persist it.

#### Scenario: Pick an icon
- **WHEN** the user selects an icon in the customization panel
- **THEN** the portrait updates immediately and the selection is saved

#### Scenario: Return to automatic
- **WHEN** the user selects "Automatico"
- **THEN** the chosen icon is cleared and the portrait follows the fallback chain

### Requirement: Icon follows character accent colour
The portrait icon in the character sheet SHALL be rendered in the character's accent colour (default gold when none is set). Outside the character sheet the icon SHALL use the default gold, consistent with the accent colour being scoped to the sheet.

#### Scenario: Accent colour tints icon
- **WHEN** a character with a red accent colour shows a portrait icon
- **THEN** the icon is drawn in that red

### Requirement: Portrait shown consistently
The same portrait (icon or initial) SHALL be shown in the character sheet header and on the character's card in the home page.

#### Scenario: Home card matches sheet
- **WHEN** a character shows the "Ladro" icon in its sheet
- **THEN** its card in the home page also shows the "Ladro" icon
