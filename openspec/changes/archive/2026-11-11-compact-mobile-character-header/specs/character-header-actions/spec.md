## ADDED Requirements

### Requirement: Level Up action is icon-only
The character sheet header SHALL present the Level Up action as an icon-only button showing an upward arrow, without a visible text label. The button SHALL expose an accessible name and tooltip "Level Up". It SHALL NOT be shown when the character's total level is 20 or higher.

#### Scenario: Level Up button is compact
- **WHEN** a character below level 20 is displayed
- **THEN** the header shows a button with an upward-arrow icon and no visible text, and activating it opens the level-up flow

#### Scenario: Level Up hidden at max level
- **WHEN** a character at level 20 is displayed
- **THEN** no Level Up button is shown

### Requirement: Header action buttons are uniform and ordered
The header action row SHALL show, on the right, a group of equally sized icon buttons in this order: user preferences, Level Up (when available), character customization. The back-to-party control SHALL be on the left. All buttons SHALL have a touch target of at least 40×40 CSS pixels.

#### Scenario: Action row fits narrow screens
- **WHEN** the sheet is viewed at a viewport width of 360px
- **THEN** all header actions are visible on a single row without horizontal scrolling, overlap or truncation

### Requirement: Character customization panel
The header SHALL provide a customization button (settings icon) that opens a "Personalizzazione personaggio" panel. The panel SHALL contain the accent colour selection and the character deletion action, and SHALL be dismissible without making changes.

#### Scenario: Open customization panel
- **WHEN** the user activates the customization button
- **THEN** the panel opens showing the accent colour palette and a delete action

#### Scenario: Close customization panel
- **WHEN** the user dismisses the panel (close control, outside tap or Escape key)
- **THEN** the panel closes and no character data is changed

### Requirement: Accent colour picker not permanently visible
The accent colour swatch or picker SHALL NOT be rendered in the header action row while the customization panel is closed.

#### Scenario: Header without picker
- **WHEN** the character sheet is displayed and the customization panel is closed
- **THEN** no colour swatch or colour picker is visible in the header

### Requirement: Deletion remains confirmed
Deleting a character from the customization panel SHALL still require the existing explicit confirmation before the character is removed.

#### Scenario: Delete requires confirmation
- **WHEN** the user activates the delete action in the customization panel
- **THEN** a confirmation dialog appears and the character is deleted only if the user confirms
