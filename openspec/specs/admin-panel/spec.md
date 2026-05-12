### Requirement: AdminPanel import actions
The AdminPanel SHALL NOT include file-based import buttons for the built-in dataset (previously "Importa Dati", "+ Importa Talenti", "+ Importa Incantesimi"). The "Esporta Dati" button SHALL be retained. Custom entry creation (+ Aggiungi) and editing SHALL remain available.

#### Scenario: Import buttons are absent
- **WHEN** an admin opens the AdminPanel
- **THEN** the header contains only "Esporta Dati" and navigation, not file-import buttons

#### Scenario: Custom entry creation still works
- **WHEN** an admin clicks "+ Aggiungi" in the Talenti or Incantesimi tab
- **THEN** a new empty entry is created and expanded for editing, as before

### Requirement: AdminPanel has a "Libreria Condivisa" tab
The AdminPanel SHALL include a third tab "Libreria Condivisa" showing all entries published to the global shared library.

#### Scenario: Tab is present and loadable
- **WHEN** a user opens the AdminPanel
- **THEN** a "Libreria Condivisa" tab is visible alongside "Talenti" and "Incantesimi"
- **WHEN** the user clicks the tab
- **THEN** shared library entries are fetched from Firestore and displayed

#### Scenario: Empty library state
- **WHEN** no entries have been published to the shared library
- **THEN** the tab shows an empty-state message ("Nessuna voce condivisa")

### Requirement: Custom entries show a "Pubblica" action for admins
In the Talenti and Incantesimi tabs, custom (non-built-in) entries SHALL show a "Pubblica" button visible only to admin users.

#### Scenario: Publish action visible on custom entry
- **WHEN** an admin expands a custom feat or spell in the AdminPanel
- **THEN** a "Pubblica" button is shown in addition to "Salva" / "Elimina"

#### Scenario: Publish action not visible to non-admin users
- **WHEN** a non-admin user opens the AdminPanel (if accessible)
- **THEN** no "Pubblica" button is shown
