## ADDED Requirements

### Requirement: Built-in dataset is loaded lazily at app startup
The app SHALL include the full Pathfinder 1e spells and feats database as lazy-loaded built-in data. The dataset SHALL be loaded once during app bootstrap via dynamic import (Vite chunk). While loading, the app SHALL display a loading indicator and SHALL NOT render components that depend on spell/feat data.

#### Scenario: First app load — data loads and becomes available
- **WHEN** the app bootstraps
- **THEN** the built-in JSON chunks are fetched once
- **THEN** `useMergedSpells()` and `useMergedFeats()` return the full dataset merged with any user patches/extras/hidden

#### Scenario: Loading indicator during data fetch
- **WHEN** the built-in data has not yet finished loading
- **THEN** a loading state is visible (spinner or placeholder) and spell/feat-dependent panels are not rendered

#### Scenario: User patches apply on top of built-in data
- **WHEN** a user has previously patched or hidden a built-in spell/feat
- **THEN** `useMergedSpells()` / `useMergedFeats()` returns the patched version respecting `featPatches`, `hiddenFeatIds`, `spellPatches`, `hiddenSpellIds` from Firestore

### Requirement: No manual JSON import required for standard dataset
The app SHALL NOT require users to upload any JSON file to access the standard Pathfinder 1e spell and feat lists. The import-from-file buttons for the built-in dataset SHALL be removed from the AdminPanel.

#### Scenario: AdminPanel import buttons are removed
- **WHEN** an admin opens the AdminPanel
- **THEN** the "Importa Dati", "+ Importa Talenti", and "+ Importa Incantesimi" buttons are NOT present

#### Scenario: Spell browse works without manual import
- **WHEN** a user with a caster class opens the Incantesimi tab
- **THEN** the full list of spells for that class is available in the "Sfoglia" tab without any prior import action
