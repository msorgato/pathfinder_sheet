# Spec Delta

## ADDED Requirements

### Requirement: Magic item entries
The catalogue SHALL also contain the magic and wondrous items of the source wiki's magic item database: specific armors, shields and weapons, rings, rods, staves, wondrous items by slot and slotless items. Each entry SHALL have a stable id, name, kind "magic", body slot (or none), tier (minor, medium, major and lesser/greater), price, weight, source book and link. Descriptions SHALL NOT be copied.

#### Scenario: Ring of protection
- **WHEN** the catalogue entry "Anello di Protezione +1" is read
- **THEN** it is a magic item for the ring slot, minor lesser tier, price 2,000 mo, with a link to its wiki page

#### Scenario: Filter magic items by slot
- **WHEN** the user filters the catalogue by magic items for the neck slot
- **THEN** only magic items for the neck slot are listed

#### Scenario: Regenerate with magic items
- **WHEN** a developer re-runs the import script
- **THEN** magic item ids are preserved for unchanged entries and no description text is stored
