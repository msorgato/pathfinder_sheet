## Context

L'app carica attualmente `FEATS` e `SPELLS` da file TypeScript statici con ~16 voci ciascuno (`src/data/feats.ts`, `src/data/spells.ts`). Il `dataStore` Zustand sovrappone patch/extra/hidden su questo baseline. Gli utenti che vogliono il dataset completo di Pathfinder 1e devono importare manualmente i file JSON dalla cartella `database/` (44k righe per gli incantesimi, 10k per i talenti).

Il `dataStore` persiste su Firestore il solo **delta** rispetto al baseline (patch, extra, hidden) — questo schema è già corretto e non va cambiato.

## Goals / Non-Goals

**Goals:**
- I file `database/*.json` diventano il baseline built-in caricato dinamicamente (lazy chunk Vite).
- Il caricamento avviene una volta sola al mount dell'app; durante il caricamento viene mostrato uno spinner minimo.
- Il sistema patch/extra/hidden esistente continua a funzionare invariato.
- I pulsanti di import JSON nell'AdminPanel vengono rimossi.
- Nuova funzionalità "Libreria Condivisa": gli admin possono pubblicare voci custom su Firestore globale; tutti gli utenti possono sfogliare e importare queste voci nelle proprie collezioni.

**Non-Goals:**
- Ricerca full-text avanzata o indicizzazione lato server.
- Paginazione lato Firestore (le voci custom condivise sono un dataset piccolo).
- Autenticazione separata per la libreria condivisa (usa l'auth già esistente).
- Modifica del formato dei tipi `FeatDefinition` / `SpellDefinition`.

## Decisions

### D1 — Lazy JSON import via Vite dynamic import

**Scelta**: Importare i JSON con `import('../../database/incantesimi_import.json')` — Vite li tratta come chunk separati emessi a build time, serviti come asset statici.

**Alternative considerate**:
- *Static import inline*: carica tutto nel bundle principale (~2 MB extra). Non accettabile per performance di first load.
- *fetch da `public/`*: richiede copiare i file in `public/`, dipende da un URL runtime e non funziona in ambienti offline/embedded. Più complesso.
- *Vite dynamic import* ✓: zero dipendenze aggiuntive, tree-shaking automatico, il chunk è cacheable dal browser, funziona in tutti gli ambienti già supportati dall'app.

### D2 — Punto di caricamento: `App.tsx` / `AuthProvider`

**Scelta**: Il caricamento avviene in `dataStore.ts` con una nuova action `loadBuiltinData()` chiamata una volta al bootstrap dell'app (in `App.tsx` o nel provider che già chiama `loadFromFirestore`). Il dataStore espone `builtinLoaded: boolean`. I componenti che usano `useMergedSpells` / `useMergedFeats` ricevono dati aggiornati automaticamente via Zustand.

**Alternative considerate**:
- *Caricamento al primo accesso a SpellsPanel*: ritardo percepibile all'apertura della scheda incantesimi; stato di loading sparso nei componenti.
- *Bootstrap in `App.tsx`* ✓: caricamento trasparente durante l'auth loading già presente; nessun delay percepibile.

### D3 — Struttura dei file JSON importati

I file `database/incantesimi_import.json` (formato `{ version, exportedAt, spells: SpellDefinition[] }`) e `database/talenti_import_v2.json` (formato `{ version, exportedAt, feats: FeatDefinition[] }`) vengono importati as-is. I file correnti `src/data/spells.ts` e `src/data/feats.ts` vengono svuotati a `export const SPELLS: SpellDefinition[] = []` e `export const FEATS: FeatDefinition[] = []` come placeholder (mantengono la compatibilità con le import esistenti).

Il `dataStore` sovrascrive il baseline con i dati caricati via `loadBuiltinData()`.

### D4 — Libreria Condivisa: struttura Firestore

```
library/
  spells/
    {id}: SpellDefinition
  feats/
    {id}: FeatDefinition
```

Ogni documento ha anche i campi extra `publishedBy: string` (uid) e `publishedAt: Timestamp`.

- Lettura: pubblica (tutti gli utenti autenticati possono leggere).
- Scrittura: solo gli admin (regola Firestore basata su `admins.ts`), ma il controllo lato client nell'AdminPanel è sufficiente per ora.

**Alternativa**: singolo documento con array embedded — scartata perché supererebbe i 1MB limit di Firestore per collezioni grandi.

### D5 — Import dalla libreria condivisa

Quando un utente importa dalla libreria condivisa, la voce viene aggiunta a `extraFeats` / `extraSpells` nel suo `dataStore` (stesso meccanismo delle voci custom). Non c'è link persistente alla libreria condivisa — è una copia locale.

## Risks / Trade-offs

- **Bundle size**: i JSON (~2 MB combined non minificati) vengono emessi come chunk separati. Dopo gzip sono ~300–400 KB — accettabile per un'app già su Vite + Firebase.
  → *Mitigazione*: il chunk viene scaricato una volta e cachato; lo spinner durante il primo caricamento è l'unico impatto percepibile.

- **Regole Firestore per `library/`**: senza security rules aggiornate, chiunque potrebbe scrivere nella libreria condivisa.
  → *Mitigazione*: il controllo lato client nell'AdminPanel è sufficiente per MVP (solo gli admin vedono i pulsanti di pubblicazione). Aggiornare le Firestore rules in un secondo momento.

- **ID collisioni**: se un ID nel database built-in coincide con un ID in `extraFeats`/`extraSpells` Firestore, la voce extra sovrascrive quella built-in nel merged output.
  → *Mitigazione*: il comportamento attuale di `importData` già gestisce questo caso (extra sovrascrive base). È il comportamento corretto e intenzionale.

## Migration Plan

1. Copiare `database/incantesimi_import.json` → `src/data/incantesimi_import.json` e `database/talenti_import_v2.json` → `src/data/talenti_import_v2.json` (percorso più vicino ai consumer).
2. Aggiornare `dataStore.ts` con `loadBuiltinData()` e `builtinLoaded` state.
3. Svuotare `src/data/spells.ts` e `src/data/feats.ts` a array vuoti.
4. Chiamare `loadBuiltinData()` nel bootstrap dell'app.
5. Aggiornare `useMergedFeats` / `useMergedSpells` per includere il built-in dataset.
6. Rimuovere i pulsanti import dall'AdminPanel.
7. Aggiungere funzioni Firestore per `library/` in `firestoreSync.ts`.
8. Aggiungere sezione "Libreria Condivisa" nell'AdminPanel.

**Rollback**: ripristinare i file `src/data/spells.ts` e `src/data/feats.ts` alle versioni precedenti e riesumare i pulsanti di import. Nessun dato utente viene perso (Firestore inalterato).

## Open Questions

- I file JSON devono rimanere in `database/` (root) o essere spostati in `src/data/`? → Decisione: spostati in `src/data/` per chiarezza e per restare sotto la root di Vite senza configurazione aggiuntiva.
- Le Firestore security rules per `library/` saranno aggiornate in questo PR o in un follow-up? → Follow-up (non bloccante per MVP).
