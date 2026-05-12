## ADDED Requirements

### Requirement: Admin can publish a custom entry to the shared library
An admin user SHALL be able to publish any custom (non-built-in) spell or feat from their collection to a global Firestore-backed shared library. The published entry SHALL include the `publishedBy` (uid) and `publishedAt` (timestamp) metadata.

#### Scenario: Publish a custom feat
- **WHEN** an admin clicks "Pubblica" on a custom feat in the AdminPanel
- **THEN** the feat is written to `library/feats/{id}` in Firestore with `publishedBy` and `publishedAt` fields
- **THEN** the feat appears in the "Libreria Condivisa" section for all users

#### Scenario: Publish a custom spell
- **WHEN** an admin clicks "Pubblica" on a custom spell in the AdminPanel
- **THEN** the spell is written to `library/spells/{id}` in Firestore with `publishedBy` and `publishedAt` fields
- **THEN** the spell appears in the "Libreria Condivisa" section for all users

#### Scenario: Publish button only visible for custom entries
- **WHEN** an admin views a built-in (base) entry in the AdminPanel
- **THEN** the "Pubblica" button is NOT shown (only custom entries can be published)

### Requirement: Any authenticated user can browse and import from the shared library
All authenticated users SHALL be able to view entries in the shared library and import them into their own custom collection. Importing copies the entry into `extraFeats` / `extraSpells` in the user's Firestore dataStore.

#### Scenario: Browse shared feats
- **WHEN** a user opens the "Libreria Condivisa" section in the AdminPanel
- **THEN** all entries published to `library/feats` are listed with name, type, and publisher info

#### Scenario: Browse shared spells
- **WHEN** a user opens the "Libreria Condivisa" section in the AdminPanel
- **THEN** all entries published to `library/spells` are listed with name, school, and publisher info

#### Scenario: Import a shared entry
- **WHEN** a user clicks "Importa" on a shared library entry
- **THEN** the entry is added to the user's `extraFeats` / `extraSpells` collection (same as manually created custom entries)
- **THEN** the imported entry is immediately available in the user's merged feat/spell lists

#### Scenario: Already imported entry shows as imported
- **WHEN** a user views a shared library entry they have already imported
- **THEN** the "Importa" button is replaced with a "✓ Importato" indicator (not a duplicate add)
