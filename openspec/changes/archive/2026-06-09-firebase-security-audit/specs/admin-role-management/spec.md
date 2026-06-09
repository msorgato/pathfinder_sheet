## ADDED Requirements

### Requirement: Admin role stored in Firestore
Il sistema SHALL memorizzare il ruolo utente nel documento Firestore `users/{uid}/profile` con campo `role: 'admin' | 'player'`. Il valore di default per i nuovi utenti è `'player'`.

#### Scenario: Nuovo utente non ha ruolo admin
- **WHEN** un utente si autentica per la prima volta
- **THEN** il documento `users/{uid}/profile` non contiene `role: 'admin'`

#### Scenario: Admin promuove un utente
- **WHEN** un utente con `role: 'admin'` apre la UI admin e promuove un altro utente tramite UID
- **THEN** il documento `users/{targetUid}/profile` viene aggiornato con `role: 'admin'`

#### Scenario: Admin revoca il ruolo
- **WHEN** un utente con `role: 'admin'` revoca il ruolo a un altro admin tramite UID
- **THEN** il documento `users/{targetUid}/profile` viene aggiornato con `role: 'player'`

---

### Requirement: Admin role caricato nello store all'autenticazione
Il sistema SHALL leggere `users/{uid}/profile.role` da Firestore al momento del login e renderlo disponibile nello store globale (`authStore`).

#### Scenario: Login con ruolo admin
- **WHEN** un utente con `role: 'admin'` completa il login Google
- **THEN** `authStore.isAdmin` è `true`

#### Scenario: Login con ruolo player
- **WHEN** un utente senza ruolo admin completa il login Google
- **THEN** `authStore.isAdmin` è `false`

---

### Requirement: AdminPanel protetto da ruolo Firestore
Il sistema SHALL mostrare l'AdminPanel solo se `authStore.isAdmin === true`. Il file `src/config/admins.ts` SHALL essere eliminato.

#### Scenario: Accesso admin legittimo
- **WHEN** un utente con `isAdmin: true` naviga a `/admin`
- **THEN** vede il pannello di amministrazione completo

#### Scenario: Accesso negato a utente non admin
- **WHEN** un utente con `isAdmin: false` tenta di navigare a `/admin`
- **THEN** viene reindirizzato alla home page

---

### Requirement: Solo admin può scrivere nella library tramite UI
Il sistema SHALL disabilitare il pulsante "Pubblica" nel pannello admin se `authStore.isAdmin` è `false`, e SHALL mostrare un errore se la chiamata Firestore viene comunque tentata senza autorizzazione.

#### Scenario: Publish bloccato a livello UI
- **WHEN** un utente non admin accede direttamente alla route admin (es. bypass URL)
- **THEN** il pulsante di pubblicazione non è presente nel DOM

#### Scenario: Publish bloccato a livello Firestore
- **WHEN** un utente non admin tenta una write diretta via SDK a `library/**`
- **THEN** Firestore restituisce un errore `PERMISSION_DENIED`
