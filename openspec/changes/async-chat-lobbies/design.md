## Context

La scheda di Pathfinder è attualmente un'applicazione single-user (o multi-tab) senza funzionalità collaborative in-app. Gli utenti sono autenticati e ogni utente ha una propria scheda personaggio. Aggiungere lobby e chat asincrona è il primo componente multiplayer del sistema.

Il progetto utilizza una struttura frontend + backend separati. Il backend espone API REST; il frontend consuma queste API.

## Goals / Non-Goals

**Goals:**
- Permettere agli utenti di creare una lobby identificata da un codice univoco.
- Permettere ad altri utenti autenticati di unirsi a una lobby tramite codice.
- Offrire una chat persistente per ogni lobby (messaggi testuali).
- Mostrare i partecipanti attivi della lobby.
- Notificare (in-app) la presenza di nuovi messaggi.

**Non-Goals:**
- Chat in tempo reale via WebSocket (prima iterazione: polling).
- Condivisione delle schede personaggio in-lobby (futuro).
- Messaggi vocali, immagini o file allegati.
- Lobby pubbliche o discovery di lobby (solo accesso tramite codice).
- Moderazione automatica dei messaggi.

## Decisions

### 1. Comunicazione: polling vs WebSocket

**Scelta: polling HTTP a intervallo fisso (es. ogni 5s).**

Rationale: Aggiunge complessità infrastrutturale minima. Per una chat asincrona (non real-time) il polling è sufficiente nella prima iterazione. WebSocket può essere introdotto successivamente senza cambiare le API REST sottostanti.

Alternativa scartata: WebSocket — richiede gestione delle connessioni persistenti lato server e maggiore complessità di deploy nella fase iniziale.

### 2. Modello dati

**Lobby:**
```
id, code (unique, 6 char), name, owner_id, created_at, is_active
```

**LobbyMember:**
```
lobby_id, user_id, joined_at, last_seen_at
```

**Message:**
```
id, lobby_id, sender_id, content (text), sent_at
```

**Rationale:** Struttura semplice, normalizzata. `last_seen_at` in LobbyMember consente di calcolare messaggi non letti senza tabelle aggiuntive.

### 3. Accesso e autorizzazione

Solo utenti autenticati possono creare o unirsi a lobby. L'owner ha il diritto esclusivo di chiudere (disattivare) la lobby. I membri possono abbandonare la lobby autonomamente.

### 4. Generazione codice lobby

Codice alfanumerico di 6 caratteri generato server-side con retry in caso di collisione. Probabilità di collisione trascurabile per volumi di lobby attese.

### 5. Paginazione messaggi

I messaggi vengono caricati in ordine cronologico con paginazione cursor-based (by `sent_at`). Il client carica gli ultimi N messaggi all'apertura e richiede i nuovi via polling usando il timestamp dell'ultimo messaggio ricevuto.

## Risks / Trade-offs

- **Scalabilità del polling** → Il polling frequente su molte lobby può aumentare il carico sul backend. Mitigazione: rate limiting per client; considerare WebSocket a lungo termine.
- **Collisione codici lobby** → Raro ma gestito con retry server-side; limite configurabile di lobby attive per utente.
- **Messaggi persi tra poll** → Usando cursor-based polling (dall'ultimo `sent_at`) non si perdono messaggi; possibile duplicato solo in caso di race condition, gestibile con deduplication lato client per `id`.
- **Pulizia lobby inattive** → Lobby vecchie o abbandonate occupano storage. Mitigazione: job periodico di archiviazione per lobby inattive oltre N giorni.
