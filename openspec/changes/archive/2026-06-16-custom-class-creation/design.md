## Context

Le classi di Pathfinder sono attualmente hardcoded in `src/data/classes/*.ts`. Il character sheet le legge tramite `getClass(id)` e `CLASSES[]`. L'`AdminPanel` gestisce già feats e spells custom con un pattern draft/publish su Firestore; l'obiettivo è replicare lo stesso pattern per le classi.

L'admin è identificato da `users/{uid}/settings/profile.role === 'admin'`, verificato sia lato client (`authStore.isAdmin`) che nelle Firestore rules.

## Goals / Non-Goals

**Goals:**
- Admin può creare, modificare ed eliminare classi custom come bozze private
- Admin può pubblicare una classe sulla collezione condivisa; la pubblicazione è immediata per gli utenti
- Le classi pubblicate appaiono nel character sheet accanto alle classi built-in
- BAB e tiri salvezza sono inseriti manualmente valore per valore per tutti e 20 i livelli
- Capacità speciali con struttura ricca: nome, descrizione, livello, tipo (Ex/Su/Sp), modificatori opzionali
- Incantesimi: flag abilitato + riferimento a lista esistente (es. `wizard`) e/o lista incantesimi custom

**Non-Goals:**
- Modifica delle classi built-in (restano file TypeScript statici)
- Importazione di classi da file o URL esterni
- Migrazione automatica di personaggi al cambio di una classe pubblicata
- Supporto multi-admin (un solo admin per ora, coerente con il sistema esistente)

## Decisions

### 1. Firestore: due collezioni separate per draft e pubblicate

- **Draft** (visibili solo admin): `users/{adminUid}/customClasses/{classId}`
- **Published** (visibili a tutti gli autenticati): `library/classes/entries/{classId}`

**Rationale**: coerente con il pattern già usato per feats/spells custom (`settings/dataStore` → `library/feats/entries`). Separa nettamente il lavoro in corso dalla produzione.

**Alternativa scartata**: singola collezione `library/classes` con campo `status: draft|published` — richiede Firestore rules più complesse e il draft sarebbe leggibile da chiunque avesse il documento ID.

### 2. Tipo `CustomClassDefinition` compatibile con `ClassDefinition`

```typescript
interface CustomClassDefinition {
  id: string
  name: string
  description: string
  hitDie: number
  status: 'draft' | 'published'
  armorProficiencies: string[]
  weaponProficiencies: string
  skillsPerLevel: number
  classSkills: string[]
  bab: number[]           // lunghezza 20, indice 0 = livello 1
  saves: {
    fort: number[]        // lunghezza 20
    ref: number[]         // lunghezza 20
    will: number[]        // lunghezza 20
  }
  features: CustomClassFeature[]
  spellcasting?: {
    enabled: boolean
    sourceList?: string   // 'wizard' | 'cleric' | ecc.
    customSpells?: string[]
  }
  createdAt: Timestamp
  updatedAt: Timestamp
  publishedAt?: Timestamp
}

interface CustomClassFeature {
  id: string              // uuid generato lato client
  name: string
  description: string
  level: number           // 1–20
  type: 'Ex' | 'Su' | 'Sp' | 'special'
  modifiers?: string
}
```

Il character sheet legge `bab[charLevel - 1]` e `saves.fort[charLevel - 1]` direttamente, senza bisogno di una funzione di progressione.

**Alternativa scartata**: enum `BabProgression` (full/3/4) con calcolo automatico — l'utente ha esplicitamente richiesto valori manuali.

### 3. Store: estendere `dataStore` con le custom classes

`dataStore` già gestisce `extraFeats`, `extraSpells`, `hiddenFeatIds`, ecc. Aggiungere `customClasses: CustomClassDefinition[]` e le azioni CRUD mantiene un unico punto di verità per i dati custom dell'admin.

**Alternativa scartata**: nuovo `classStore` separato — overhead non giustificato per la quantità di logica.

### 4. Integration nel character sheet: merge `CLASSES` + `customClasses` pubblicati

Il lookup classi passa da un array statico a una funzione `getAllClasses()` che unisce `CLASSES` (built-in) con le classi custom pubblicate caricate da Firestore. Il character sheet non sa distinguere tra le due sorgenti.

### 5. UI: nuovo tab "Classi" nell'AdminPanel

Segue lo stesso pattern visivo dei tab "Talenti" e "Incantesimi". L'editor di una classe è un form multi-sezione in-place (accordion o stepper), dato che il numero di campi è elevato (metadata + 20×4 valori numerici + n features).

## Risks / Trade-offs

- **Editor BAB/Saves: UX densa** → 80 campi numerici su schermo. Mitigazione: input compatti in griglia 10+10 per riga; validazione immediata (range 0-20 per BAB, 0-12 per saves).
- **Sincronizzazione draft → published**: se l'admin modifica un draft dopo la pubblicazione, la versione in `library/classes/entries` non si aggiorna automaticamente. → L'admin deve ri-pubblicare; un badge "Modifiche non pubblicate" avvisa dello stato.
- **Personaggi con classe custom eliminata**: se una classe pubblicata viene ritirata, i personaggi che la usano mostrano ancora i valori salvati ma non trovano la definizione. → Il character sheet deve gestire gracefully il caso `class not found`, mostrando un avviso invece di crashare.
- **Firestore rules**: le regole per `users/{uid}/customClasses` devono permettere solo all'admin di leggere/scrivere la propria sottocollezione. → Aggiungere la regola di admin check coerente con il pattern esistente.

## Migration Plan

1. Aggiungere le regole Firestore per le nuove collezioni (non breaking)
2. Aggiungere i tipi TypeScript (non breaking)
3. Estendere `dataStore` con le nuove azioni (non breaking)
4. Aggiungere le operazioni Firestore in `firestoreSync.ts`
5. Aggiungere il tab "Classi" all'AdminPanel
6. Aggiornare `getAllClasses()` per includere le custom pubblicate
7. Aggiornare il character sheet per il graceful handling di classi mancanti

**Rollback**: le collezioni Firestore sono additive; rimuovere i componenti UI e le regole è sufficiente per tornare allo stato precedente senza perdita di dati.

## Open Questions

- Le classi custom pubblicate devono supportare i **talenti bonus** come il Guerriero (lista separata di bonus feat per livello)? Per ora non incluso; si può aggiungere in seguito.
- La lista incantesimi custom deve attingere alla collezione `library/spells/entries` o a un campo dedicato nella classe? Decision deferred: usare `string[]` di spell ID dalla libreria condivisa.
