## MODIFIED Requirements

### Requirement: Inline colour picker in character sheet header
A row of 10 circular colour swatches SHALL be available in the character customization panel opened from the character sheet header (not permanently shown in the header itself). Clicking a swatch calls `updateCharacter` with the new `accentColor`. The active swatch has a visible ring indicator. The panel SHALL also offer a way to restore the default gold accent.

#### Scenario: User changes accent colour
- **WHEN** the user opens the customization panel and clicks a colour swatch
- **THEN** the sheet immediately updates to that accent colour and persists it

#### Scenario: Restore default accent
- **WHEN** a character has a custom accent colour and the user chooses to restore the default in the customization panel
- **THEN** the character's accent colour is cleared and the sheet renders with the default gold token

#### Scenario: Picker is not shown in the header
- **WHEN** the customization panel is closed
- **THEN** no colour picker or swatch appears in the header
