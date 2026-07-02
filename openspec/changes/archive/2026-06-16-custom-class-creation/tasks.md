## 1. Tipi TypeScript e modello dati

- [x] 1.1 Aggiungere `CustomClassFeature` e `CustomClassDefinition` a `src/types/index.ts`
- [x] 1.2 Aggiungere helper `babPresets` e `savesPresets` (full/3/4/1/2 BAB, good/poor saves) in `src/data/classPresets.ts`

## 2. Firestore rules

- [x] 2.1 Aggiungere regola lettura/scrittura per `users/{uid}/customClasses/{classId}` (solo il proprietario admin)
- [x] 2.2 Aggiungere regola scrittura admin per `library/classes/entries/{classId}`
- [x] 2.3 Aggiungere regola lettura per tutti gli autenticati su `library/classes/entries`

## 3. Store e sincronizzazione Firestore

- [x] 3.1 Estendere `dataStore` con `customClasses: CustomClassDefinition[]` e le azioni `setCustomClasses`, `upsertCustomClass`, `removeCustomClass`
- [x] 3.2 Aggiungere `loadCustomClasses()` in `src/lib/firestoreSync.ts` (legge `users/{adminUid}/customClasses`)
- [x] 3.3 Aggiungere `saveCustomClass(cls)` in `firestoreSync.ts` (scrive bozza)
- [x] 3.4 Aggiungere `deleteCustomClass(classId)` in `firestoreSync.ts`
- [x] 3.5 Aggiungere `publishCustomClass(cls)` in `firestoreSync.ts` (copia su `library/classes/entries`, aggiorna status)
- [x] 3.6 Aggiungere `withdrawCustomClass(classId)` in `firestoreSync.ts` (rimuove da `library/classes/entries`, status → draft)
- [x] 3.7 Aggiungere `subscribePublishedClasses()` in `firestoreSync.ts` (onSnapshot su `library/classes/entries` per gli utenti)

## 4. Integrazione classi nel character sheet

- [x] 4.1 Creare funzione `getAllClasses()` in `src/data/classes/index.ts` che unisce `CLASSES` built-in con le custom pubblicate dallo store
- [x] 4.2 Sostituire ogni uso di `CLASSES` array diretto nel character sheet con `getAllClasses()`
- [x] 4.3 Gestire il caso `class not found` nel character sheet: se `getAllClasses().find(id)` restituisce `undefined`, mostrare avviso senza crash
- [x] 4.4 Verificare che i calcoli BAB e saves leggano correttamente `bab[level-1]` e `saves.fort[level-1]` per le custom class

## 5. Componente editor classe custom

- [x] 5.1 Creare `src/components/admin/CustomClassEditor.tsx` con sezioni: Metadata, BAB, Tiri Salvezza, Capacità Speciali, Incantesimi
- [x] 5.2 Implementare la griglia numerica (10+10) per i 20 valori BAB con pulsanti preset (Full/3/4/1/2)
- [x] 5.3 Implementare le tre griglie numeriche per Tempra/Riflessi/Volontà con pulsanti preset (Buono/Scarso)
- [x] 5.4 Implementare la lista features con add/edit/remove: campi nome, descrizione, livello (1-20), tipo (Ex/Su/Sp/Speciale), modificatori
- [x] 5.5 Implementare la sezione incantesimi: toggle abilitato, select lista sorgente, multi-select incantesimi custom dalla libreria condivisa
- [x] 5.6 Implementare validazione form: nome obbligatorio, valori numerici BAB/saves ≥ 0, livello feature 1-20

## 6. Tab Classi nell'AdminPanel

- [x] 6.1 Aggiungere il tab "Classi" alla barra di navigazione in `src/pages/AdminPanel.tsx`
- [x] 6.2 Creare `src/components/admin/CustomClassList.tsx`: lista classi con badge stato (Bozza / Pubblicata / Modifiche non pubblicate), pulsante "+ Aggiungi Classe"
- [x] 6.3 Collegare i pulsanti "Salva", "Pubblica", "Ritira", "Elimina" alle azioni Firestore dello store
- [x] 6.4 Bloccare "Elimina" sulle classi pubblicate con messaggio esplicativo
- [x] 6.5 Caricare le bozze admin al montaggio del tab (`loadCustomClasses()`)

## 7. Sottoscrizione classi pubblicate per gli utenti

- [x] 7.1 Avviare `subscribePublishedClasses()` al login dell'utente (in `authStore` o nel componente root)
- [x] 7.2 Smettere l'unsubscribe al logout
