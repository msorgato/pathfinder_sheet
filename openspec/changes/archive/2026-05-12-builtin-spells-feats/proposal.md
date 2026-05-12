## Why

Gli utenti devono caricare manualmente un file JSON per ottenere la lista completa di incantesimi e talenti di Pathfinder 1e, rendendo l'onboarding macchinoso e dipendente da un file esterno. La cartella `database/` contiene già dati completi (~44k righe di incantesimi, ~10k di talenti) che possono essere integrati direttamente nell'applicazione come dati predefiniti.

## What Changes

- I file `database/incantesimi_import.json` e `database/talenti_import_v2.json` diventano il dataset predefinito integrato nell'app (caricamento lazy per non appesantire il bundle iniziale).
- I file `src/data/spells.ts` e `src/data/feats.ts` (attualmente con ~16 voci manuali ciascuno) vengono sostituiti dalla sorgente JSON del database.
- I pulsanti "Importa Dati", "+ Importa Talenti", "+ Importa Incantesimi" nell'AdminPanel vengono rimossi (non più necessari per il dataset standard). Il pulsante "Esporta Dati" rimane.
- L'AdminPanel mantiene la funzionalità di aggiungere/modificare/nascondere voci custom, che restano sincronizzate su Firestore per-utente come prima.
- **Nuovo**: gli utenti admin possono pubblicare le proprie voci custom in una libreria condivisa globale su Firestore (`library/spells/{id}`, `library/feats/{id}`), rendendole disponibili a tutti gli utenti dell'app che possono importarle nella propria collezione custom.

## Capabilities

### New Capabilities

- `builtin-database`: Dataset integrato di incantesimi e talenti caricato lazily dai file JSON del database invece che da stub TypeScript minimali.
- `shared-library`: Sezione "Libreria Condivisa" nell'AdminPanel per pubblicare voci custom e sfogliare/importare voci pubblicate da altri utenti.

### Modified Capabilities

- `admin-panel`: Rimozione dei pulsanti di import JSON (dataset ora built-in); aggiunta delle azioni "Pubblica" e sezione "Libreria Condivisa".

## Impact

- **`src/data/spells.ts`** e **`src/data/feats.ts`**: contenuto sostituito; `SPELLS` e `FEATS` diventano funzioni/hook async o vengono rimossi in favore di un caricamento dinamico.
- **`src/store/dataStore.ts`**: aggiunto stato di caricamento (`dataLoaded: boolean`); il merge con `FEATS`/`SPELLS` avviene dopo il caricamento lazy.
- **`src/pages/AdminPanel.tsx`**: rimossi i 3 pulsanti di import, aggiunta sezione "Libreria Condivisa" con azioni Pubblica/Importa.
- **`src/lib/firestoreSync.ts`**: aggiunte funzioni per leggere/scrivere la collezione `library` (condivisa, non per-utente).
- **`database/*.json`**: spostati o copiati in `src/data/` per essere importati da Vite come chunk separati.
- Nessuna modifica alla struttura dei tipi `FeatDefinition` / `SpellDefinition`.
- Nessuna modifica al sistema di patch/extra/hidden già esistente in `dataStore`.
