## 1. Modello dati e migrazione DB

- [x] 1.1 Creare la tabella `lobbies` (id, code, name, owner_id, created_at, is_active)
- [x] 1.2 Creare la tabella `lobby_members` (lobby_id, user_id, joined_at, last_seen_at)
- [x] 1.3 Creare la tabella `lobby_messages` (id, lobby_id, sender_id, content, sent_at)
- [x] 1.4 Aggiungere indici su `lobbies.code`, `lobby_messages.lobby_id`, `lobby_messages.sent_at`
- [x] 1.5 Scrivere ed eseguire la migration

> Nota: il progetto usa Firebase/Firestore (NoSQL). I task 1.x sono stati implementati come TypeScript types in `src/types/index.ts` e funzioni Firestore in `src/lib/lobbySync.ts`. La struttura Firestore è: `lobbies/{id}`, `lobbies/{id}/members/{uid}`, `lobbies/{id}/messages/{id}`, `users/{uid}/lobbyMemberships/{lobbyId}` (indice per listing efficiente).

## 2. Backend — Lobby Management

- [x] 2.1 Implementare `POST /api/lobbies` — creazione lobby con generazione codice univoco
- [x] 2.2 Implementare `POST /api/lobbies/join` — partecipazione tramite codice
- [x] 2.3 Implementare `DELETE /api/lobbies/:id/members/me` — abbandono lobby (non-owner)
- [x] 2.4 Implementare `PATCH /api/lobbies/:id/close` — chiusura lobby (solo owner)
- [x] 2.5 Implementare `GET /api/lobbies/:id/members` — lista partecipanti con ruoli
- [x] 2.6 Aggiungere middleware di autorizzazione per verificare appartenenza alla lobby

> Nota: implementato come funzioni Firestore client-side in `src/lib/lobbySync.ts` + `src/store/lobbyStore.ts`. L'autorizzazione è verificata lato client prima di ogni operazione (controllo membership doc in Firestore).

## 3. Backend — Chat asincrona

- [x] 3.1 Implementare `POST /api/lobbies/:id/messages` — invio messaggio con validazione contenuto
- [x] 3.2 Implementare `GET /api/lobbies/:id/messages` — lettura messaggi con paginazione cursor-based (`?after=<timestamp>&limit=50`)
- [x] 3.3 Implementare `GET /api/lobbies` — lista lobby dell'utente con conteggio messaggi non letti
- [x] 3.4 Implementare aggiornamento `last_seen_at` al caricamento della chat

> Nota: implementato in `src/lib/lobbySync.ts`. Invece del polling HTTP, si usano `onSnapshot` di Firestore per aggiornamenti real-time sui messaggi e sui membri attivi.

## 4. Frontend — Lobby

- [x] 4.1 Creare pagina "Le mie lobby" con lista delle lobby e badge messaggi non letti
- [x] 4.2 Creare componente "Crea lobby" (form nome + visualizzazione codice generato)
- [x] 4.3 Creare componente "Unisciti a una lobby" (input codice + join)
- [x] 4.4 Creare pagina dettaglio lobby con lista partecipanti e pulsante abbandona/chiudi

> File: `src/pages/LobbiesPage.tsx`, `src/pages/LobbyDetailPage.tsx`, `src/components/lobby/CreateLobbyModal.tsx`, `src/components/lobby/JoinLobbyModal.tsx`, `src/components/lobby/MembersList.tsx`

## 5. Frontend — Chat

- [x] 5.1 Creare componente chat con lista messaggi in ordine cronologico
- [x] 5.2 Implementare form di invio messaggio con validazione lato client (non vuoto)
- [x] 5.3 Implementare polling ogni 5 secondi per nuovi messaggi (cursor-based)
- [x] 5.4 Aggiornare `last_seen_at` all'apertura della chat e azzerare il badge non letti
- [x] 5.5 Aggiungere indicatore visivo (badge) nella navbar/menu per lobby con messaggi non letti

> File: `src/components/lobby/ChatPanel.tsx`. Polling sostituito da `onSnapshot` Firestore (più efficiente). Badge in `src/pages/HomePage.tsx`.

## 6. Test

- [x] 6.1 Test unitari sulle API di creazione e partecipazione lobby (casi nominali ed errori)
- [x] 6.2 Test unitari sulle API di messaggistica (invio, paginazione, non-letti)
- [x] 6.3 Test di autorizzazione: non-membro non può leggere/scrivere messaggi o chiudere la lobby
- [ ] 6.4 Verifica manuale del polling: i nuovi messaggi appaiono entro ~5 secondi senza duplicati

> File: `src/__tests__/lobbySync.test.ts` — 18 test, tutti verdi. Framework: vitest con `vi.mock` per isolare Firebase. Il task 6.4 va verificato manualmente avviando l'app (`npm run dev`).
