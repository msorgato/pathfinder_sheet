## 1. Admin Role — Firestore & Config

- [x] 1.1 **[PATH CORRETTA]** Aggiungere il documento `users/{uid}/settings/profile` con `role: 'admin'` per l'utente admin (percorso corretto: 4 segmenti validi). Path precedente `users/{uid}/profile` era errata (3 segmenti = collection reference)
- [x] 1.2 Aggiungere la funzione helper `isAdmin()` in `firestore.rules` che legge `users/{uid}/settings/profile.role`
- [x] 1.3 Eliminare `src/config/admins.ts`
- [x] 1.4 Aggiornare `src/store/authStore.ts`: al login, leggere `users/{uid}/profile` e popolare `isAdmin: boolean` nello store
- [x] 1.5 Aggiornare `src/pages/App.tsx` (o routing): sostituire `isAdminEmail(user.email)` con `authStore.isAdmin`
- [x] 1.6 Aggiornare `src/pages/AdminPanel.tsx`: rimuovere qualsiasi riferimento a `isAdminEmail`

## 2. Firestore Security Rules — Hardening

- [x] 2.1 Aggiornare `match /library/{document=**}`: `allow write: if isAdmin()` (usa la helper del task 1.2)
- [x] 2.2 Restringere `match /lobbies/{lobbyId}` read: `allow get: if isLobbyMember`; `allow list: if isAuthenticated()` (query per codice join)
- [x] 2.3 Aggiungere validazione `displayName` nei members: `request.resource.data.displayName.size() <= 40` su create e update
- [x] 2.4 Aggiungere validazione messaggi: `content.size() > 0 && content.size() <= 2000` e presenza dei campi `senderId`, `content`, `sentAt` su create
- [x] 2.5 Aggiungere `match /audit_log/{document=**}`: `allow read: if isAdmin(); allow write: if false;`
- [x] 2.6 Coperto da `match /users/{uid}/{document=**}` (già include rateLimits — regola più specifica non necessaria)
- [x] 2.7 Deploy delle rules aggiornate: `firebase deploy --only firestore:rules` — **⚠ Re-deploy necessario** dopo fix path `isAdmin()` (ora punta a `settings/profile`)

## 3. displayName Validation — Frontend

- [x] 3.1 In `src/lib/lobbySync.ts` (funzioni `createLobby`, `joinLobbyByCode`): aggiungere trim e truncate a 40 caratteri del `displayName` prima della scrittura Firestore
- [x] 3.2 In `src/components/lobby/ChatPanel.tsx`: contatore visivo caratteri rimanenti su 2000

## 4. Cloud Functions — Inizializzazione

- [x] 4.1 Creata struttura `functions/` manualmente (package.json, tsconfig.json, src/)
- [x] 4.2 `firebase.json` aggiornato con config per le functions
- [x] 4.3 `functions/package.json` include `firebase-admin` e `firebase-functions`

## 5. Cloud Function — Rate Limiting Messaggi

- [x] 5.1 Creato `functions/src/throttleMessages.ts`: Cloud Function `onDocumentCreated` su `lobbies/{lobbyId}/messages/{msgId}`
- [x] 5.2 Logica rate limit implementata: legge/aggiorna `users/{uid}/rateLimits/messages`, se `count >= 10` entro 60s elimina il messaggio
- [x] 5.3 In `src/components/lobby/ChatPanel.tsx`: stato `isRateLimited` con cooldown UI (disabilita input + messaggio)
- [~] 5.4 Deploy: **skipped** — piano Spark non supporta Cloud Functions; upgrading a Blaze quando l'app crescerà. Rate limiting attivo solo lato client (task 5.3)

## 6. Cloud Function — Audit Logging

- [x] 6.1 Creato `functions/src/auditLog.ts`: Cloud Function `onDocumentWritten` su `library/{type}/entries/{id}` che scrive in `audit_log`; esporta anche helper `writeAuditLog()` per uso in task 7
- [x] 6.2 In `functions/src/deleteUserAccount.ts`: `writeAuditLog` importato e chiamato prima di `deleteUser(uid)`
- [~] 6.3 Deploy: **skipped** — piano Spark; da deployare con `firebase deploy --only functions:auditLog` dopo upgrade a Blaze

## 7. Cloud Function — Delete Account

- [x] 7.1 Creato `functions/src/deleteUserAccount.ts`: Cloud Function HTTP callable (requires auth)
- [x] 7.2 Implementato: chunk-batch delete `users/{uid}/characters`, `lobbyMemberships`, `rateLimits`; delete `settings/dataStore` e `profile`; delete `lobbies/{lobbyId}/members/{uid}` per ogni lobby; scrittura audit log; `getAuth().deleteUser(uid)`
- [~] 7.3 Deploy: **skipped** — piano Spark; da deployare con `firebase deploy --only functions:deleteUserAccount` dopo upgrade a Blaze

## 8. GDPR — Pagina Account Settings

- [x] 8.1 Creato `src/pages/AccountSettings.tsx` con sezioni: "Esporta i miei dati" e "Elimina account"
- [x] 8.2 Implementato `exportUserData()` in `src/lib/firestoreSync.ts`: legge profile, characters, dataStore, lobbyMemberships; restituisce JSON
- [x] 8.3 Pulsante "Scarica i miei dati": chiama `exportUserData()` e usa `URL.createObjectURL` per il download
- [x] 8.4 Pulsante "Elimina account": dialog di conferma → chiama CF `deleteUserAccount` (con fallback client-side `deleteUser()` se CF non deployata) → onAuthStateChanged reindirizza a /login
- [x] 8.5 Aggiunta rotta `/settings/account` in `App.tsx` (solo per utenti autenticati)
- [x] 8.6 Aggiunto link "Impostazioni account" in `UserPreferencesPanel.tsx` sopra "Esci"

## 9. Verifica & Testing

- [x] 9.1 Scritto `tests/firestore.rules.test.ts` con Vitest + `@firebase/rules-unit-testing`: verifica PERMISSION_DENIED su write library per non-admin; verifica che admin possa scrivere. Eseguire con: `firebase emulators:start --only firestore` poi `npm run test:rules`
- [x] 9.2 Stesso file di test: verifica che `getDocs(lobbies)` funzioni per utenti autenticati non-membri (join by code); verifica che `getDoc` su lobby specifica fallisca per non-membri
- [ ] 9.3 **Manuale** — Avviare l'app, entrare in una lobby, inviare 11 messaggi in rapida successione; verificare che l'input si disabiliti con messaggio di cooldown dopo il 10° (lato client). Il blocco server-side richiede il deploy della CF su Blaze
- [ ] 9.4 **Manuale** — Andare su `/settings/account`, cliccare "Scarica i miei dati"; verificare che il JSON scaricato contenga `profile`, `characters`, `dataStore`, `lobbyMemberships`
- [ ] 9.5 **Manuale** — Cliccare "Elimina account" → confermare; verificare che si venga reindirizzati al login e che i dati siano stati eliminati in Firebase Console (Firestore + Authentication)
- [ ] 9.6 **Manuale** — Publishare un'entry nella library da AdminPanel; verificare che in Firestore → `audit_log` appaia un documento con `action: "library.created"` (richiede deploy CF `auditLog` su Blaze)
