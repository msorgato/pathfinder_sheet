## Why

Le classi di Pathfinder sono attualmente definite come file TypeScript statici nel bundle dell'app: aggiungere o modificare una classe richiede un deployment. Serve un sistema che consenta all'admin di creare classi custom direttamente da pannello, salvarle su Firebase e pubblicarle agli utenti senza toccare il codice.

## What Changes

- Nuovo tab "Classi" nell'`AdminPanel` per creare, modificare e pubblicare classi custom
- Nuova collezione Firestore `library/classes/entries/{classId}` per le classi pubblicate
- Draft privati in `users/{adminUid}/customClasses/{classId}` visibili solo all'admin
- Ogni classe custom supporta:
  - Attributi base: nome, descrizione, dado vita, competenze armatura/armi
  - BAB: valori manuali per ciascuno dei 20 livelli
  - Tiri Salvezza (Tempra, Riflessi, Volontà): valori manuali per ciascuno dei 20 livelli
  - Capacità speciali: struttura ricca con nome, descrizione, livello di sblocco, tipo (Ex/Su/Sp) e modificatori meccanici opzionali
  - Incantesimi: flag booleano + riferimento a lista esistente (Wizard, Cleric, ecc.) **e/o** lista incantesimi custom selezionabili
- Le classi pubblicate sono utilizzabili dagli utenti nel character sheet (accanto alle classi built-in)
- Regole Firestore aggiornate: scrittura riservata ad admin, lettura aperta a utenti autenticati

## Capabilities

### New Capabilities

- `custom-class-admin`: Interfaccia admin per creare, modificare ed eliminare classi custom (draft privati); include editor BAB/Saves a 20 livelli, gestore capacità speciali e configurazione incantesimi
- `custom-class-publishing`: Pubblicazione/ritiro di classi custom sulla collezione condivisa `library/classes/entries`, con aggiornamento in tempo reale per gli utenti
- `custom-class-character-integration`: Integrazione delle classi pubblicate nel character sheet accanto alle classi built-in, con piena compatibilità con i calcoli esistenti (BAB, tiri salvezza, capacità speciali)

### Modified Capabilities

- `admin-panel`: Aggiunta del tab "Classi" alla navigazione esistente e gestione del pattern draft/publish coerente con feats e spells

## Impact

- `src/pages/AdminPanel.tsx` — nuovo tab e sottocomponenti editor
- `src/data/classes/` — il sistema di lookup classi deve includere le custom pubblicate
- `src/types/index.ts` — nuovo tipo `CustomClassDefinition` compatibile con `ClassDefinition`
- `src/lib/firestoreSync.ts` — operazioni CRUD per le custom classes
- `firestore.rules` — nuove regole per `library/classes` e `users/{uid}/customClasses`
- `src/store/` — eventuali aggiornamenti a `dataStore` o nuovo `classStore`
