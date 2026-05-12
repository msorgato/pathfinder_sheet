## 1. Preparazione dati

- [x] 1.1 Creare la cartella `public/data/` e spostare `database/incantesimi_import.json` → `public/data/spells.json`
- [x] 1.2 Spostare `database/talenti_import_v2.json` → `public/data/feats.json` ed eliminare la cartella `database/`
- [x] 1.3 Svuotare `src/data/spells.ts` a `export const SPELLS: SpellDefinition[] = []`
- [x] 1.4 Svuotare `src/data/feats.ts` a `export const FEATS: FeatDefinition[] = []`

## 2. dataStore — lazy loading built-in data

- [x] 2.1 Aggiungere lo stato `builtinLoaded: boolean` al `DataState` interface in `dataStore.ts`
- [x] 2.2 Implementare la action `loadBuiltinData()` che usa `fetch('/data/spells.json')` e `fetch('/data/feats.json')` per popolare le liste built-in interne al store
- [x] 2.3 Aggiornare `useMergedFeats()` e `useMergedSpells()` in `dataStore.ts` per usare il dataset built-in caricato invece degli array vuoti di `FEATS`/`SPELLS`
- [x] 2.4 Chiamare `loadBuiltinData()` nel bootstrap dell'app (`App.tsx` o nel provider auth esistente)
- [x] 2.5 Aggiungere uno stato di loading nell'app che mostra uno spinner mentre `builtinLoaded === false`

## 3. AdminPanel — rimozione import buttons

- [x] 3.1 Rimuovere i tre bottoni "Importa Dati", "+ Importa Talenti", "+ Importa Incantesimi" dall'header di `AdminPanel.tsx`
- [x] 3.2 Rimuovere le ref `fileInputRef`, `mergeFeatsRef`, `mergeSpellsRef` e i relativi `<input type="file">` nascosti
- [x] 3.3 Rimuovere i handler `handleImport`, `handleMergeFeats`, `handleMergeSpells` da `AdminPanel.tsx`

## 4. Firestore — libreria condivisa

- [x] 4.1 Aggiungere in `firestoreSync.ts` la funzione `publishToLibrary(type: 'feat'|'spell', entry: FeatDefinition|SpellDefinition, publishedBy: string)` che scrive su `library/{type}s/{id}`
- [x] 4.2 Aggiungere in `firestoreSync.ts` la funzione `loadLibrary()` che legge tutti i documenti da `library/spells` e `library/feats` e restituisce `{ spells: SpellDefinition[], feats: FeatDefinition[] }`

## 5. AdminPanel — bottone "Pubblica" per voci custom

- [x] 5.1 Aggiungere il prop `onPublish?: () => void` al componente `FeatEditor` e mostrare il bottone "Pubblica" solo se il prop è presente
- [x] 5.2 Aggiungere il prop `onPublish?: () => void` al componente `SpellEditor` e mostrare il bottone "Pubblica" solo se il prop è presente
- [x] 5.3 In `AdminPanel.tsx`, passare `onPublish` solo alle voci custom (non base) e solo se l'utente è admin; il callback chiama `publishToLibrary`

## 6. AdminPanel — tab "Libreria Condivisa"

- [x] 6.1 Aggiungere il tipo tab `'library'` al tipo `Tab` in `AdminPanel.tsx`
- [x] 6.2 Aggiungere il tab "Libreria Condivisa" alla tab bar
- [x] 6.3 Implementare il componente/sezione `SharedLibrary` che al mount chiama `loadLibrary()` e mostra le voci in due sotto-sezioni (Talenti / Incantesimi)
- [x] 6.4 Aggiungere il bottone "Importa" su ciascuna voce della libreria condivisa che chiama `store.addFeat()`/`store.addSpell()` e mostra "✓ Importato" se già presente in `extraFeats`/`extraSpells`
- [x] 6.5 Gestire lo stato di loading (spinner) e lo stato vuoto ("Nessuna voce condivisa") nella sezione Libreria Condivisa
