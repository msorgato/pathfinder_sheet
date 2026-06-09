## ADDED Requirements

### Requirement: Library write richiede ruolo admin server-side
La rule Firestore per `match /library/{document=**}` SHALL negare qualsiasi write a utenti che non abbiano `users/{uid}/profile.role == 'admin'`. La lettura resta pubblica (non autenticata).

#### Scenario: Write negato a utente autenticato non-admin
- **WHEN** un utente autenticato senza `role: 'admin'` tenta una write su `library/feats/entries/x`
- **THEN** Firestore restituisce `PERMISSION_DENIED`

#### Scenario: Write consentito ad admin
- **WHEN** un utente con `users/{uid}/profile.role == 'admin'` tenta una write su `library/**`
- **THEN** la write ha successo

#### Scenario: Read pubblica invariata
- **WHEN** qualsiasi client (anche non autenticato) legge `library/feats/entries`
- **THEN** la lettura ha successo

---

### Requirement: displayName nei membri validato nelle Rules
La rule per `match /lobbies/{id}/members/{memberId}` SHALL richiedere che `request.resource.data.displayName.size() <= 40` su create e update.

#### Scenario: displayName troppo lungo bloccato
- **WHEN** un client tenta di creare o aggiornare un membro con `displayName` di 41+ caratteri
- **THEN** Firestore restituisce `PERMISSION_DENIED`

#### Scenario: displayName valido accettato
- **WHEN** un client aggiorna il proprio membro con `displayName` di max 40 caratteri
- **THEN** l'update ha successo

---

### Requirement: Messaggi devono avere i campi obbligatori
La rule per `match /lobbies/{id}/messages/{messageId}` SHALL richiedere che ogni nuovo messaggio contenga `senderId`, `content`, `sentAt` e che `content.size() > 0` e `content.size() <= 2000`.

#### Scenario: Messaggio senza content bloccato
- **WHEN** un client tenta di creare un messaggio con `content: ''`
- **THEN** Firestore restituisce `PERMISSION_DENIED`

#### Scenario: Messaggio troppo lungo bloccato
- **WHEN** un client tenta di creare un messaggio con `content` di 2001+ caratteri
- **THEN** Firestore restituisce `PERMISSION_DENIED`

#### Scenario: Messaggio valido accettato
- **WHEN** un membro invia un messaggio con `content` tra 1 e 2000 caratteri e tutti i campi obbligatori
- **THEN** il messaggio viene creato correttamente

---

### Requirement: Lobby read ristretto a member o verifica-codice
La rule per `match /lobbies/{lobbyId}` SHALL consentire read solo se l'utente è già membro (`isLobbyMember`) OPPURE se la lobby document è necessaria per verificare un codice di ingresso (campo `joinCode`). Le lobby non devono essere listabili liberamente da tutti gli autenticati.

#### Scenario: Utente non membro non può leggere i dettagli di una lobby senza codice
- **WHEN** un utente autenticato non membro fa una getDoc su una lobby specifica senza conoscere il codice
- **THEN** Firestore restituisce `PERMISSION_DENIED`

#### Scenario: Utente membro può leggere la lobby
- **WHEN** un utente già membro della lobby fa una getDoc
- **THEN** la lettura ha successo

#### Scenario: Query per codice lobby consentita
- **WHEN** un utente autenticato fa una query su `lobbies` con `where('joinCode', '==', code)`
- **THEN** la query restituisce al massimo una lobby (il codice è univoco)
