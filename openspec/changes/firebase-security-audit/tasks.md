## 1. Admin Role — Firestore & Config

- [ ] 1.1 Aggiungere il documento `users/{uid}/profile` con `role: 'admin'` per l'utente admin esistente tramite Firebase Console (operazione manuale one-time)
- [ ] 1.2 Aggiungere la funzione helper `isAdmin()` in `firestore.rules` che legge `users/{uid}/profile.role`
- [ ] 1.3 Eliminare `src/config/admins.ts`
- [ ] 1.4 Aggiornare `src/store/authStore.ts`: al login, leggere `users/{uid}/profile` e popolare `isAdmin: boolean` nello store
- [ ] 1.5 Aggiornare `src/pages/App.tsx` (o routing): sostituire `isAdminEmail(user.email)` con `authStore.isAdmin`
- [ ] 1.6 Aggiornare `src/pages/AdminPanel.tsx`: rimuovere qualsiasi riferimento a `isAdminEmail`

## 2. Firestore Security Rules — Hardening

- [ ] 2.1 Aggiornare `match /library/{document=**}`: `allow write: if isAdmin()` (usa la helper del task 1.2)
- [ ] 2.2 Restringere `match /lobbies/{lobbyId}` read: consentire solo a `isLobbyMember(lobbyId)` oppure a query con `joinCode` (usare `resource.data.joinCode` per permettere la query di join senza esporre tutte le lobby)
- [ ] 2.3 Aggiungere validazione `displayName` nei members: `request.resource.data.displayName.size() <= 40` su create e update
- [ ] 2.4 Aggiungere validazione messaggi: `content.size() > 0 && content.size() <= 2000` e presenza dei campi `senderId`, `content`, `sentAt` su create
- [ ] 2.5 Aggiungere `match /audit_log/{document=**}`: `allow read: if isAdmin(); allow write: if false;`
- [ ] 2.6 Aggiungere `match /users/{uid}/rateLimits/{document=**}`: leggibile e scrivibile dall'owner (serve per il counter rate limit)
- [ ] 2.7 Deploy delle rules aggiornate: `firebase deploy --only firestore:rules`

## 3. displayName Validation — Frontend

- [ ] 3.1 In `src/lib/lobbySync.ts` (funzioni `createLobby`, `joinLobbyByCode`): aggiungere trim e truncate a 40 caratteri del `displayName` prima della scrittura Firestore
- [ ] 3.2 In `src/components/chat/ChatPanel.tsx` o nel componente di input della chat: limitare l'input a 2000 caratteri con contatore visivo

## 4. Cloud Functions — Inizializzazione

- [ ] 4.1 Eseguire `firebase init functions` nella root del progetto, scegliere TypeScript
- [ ] 4.2 Verificare che `firebase.json` includa la config per le functions
- [ ] 4.3 Aggiungere le dipendenze necessarie in `functions/package.json` (`firebase-admin`, `firebase-functions`)

## 5. Cloud Function — Rate Limiting Messaggi

- [ ] 5.1 Creare `functions/src/throttleMessages.ts`: Cloud Function `onDocumentCreated` su `lobbies/{lobbyId}/messages/{msgId}`
- [ ] 5.2 Implementare logica rate limit: legge e aggiorna `users/{uid}/rateLimits/messages` (campo `count` + `windowStart`), se `count > 10` entro 60s elimina il documento messaggio
- [ ] 5.3 In `src/components/chat/ChatInput.tsx` (o equivalente): aggiungere stato `isRateLimited` con cooldown UI visivo (disabilita input + mostra messaggio)
- [ ] 5.4 Deploy: `firebase deploy --only functions:throttleMessages`

## 6. Cloud Function — Audit Logging

- [ ] 6.1 Creare `functions/src/auditLog.ts`: Cloud Function `onDocumentWritten` su `library/{type}/entries/{id}` che scrive in `audit_log`
- [ ] 6.2 In `functions/src/deleteUserAccount.ts` (task 7): aggiungere scrittura audit log prima del delete
- [ ] 6.3 Deploy: `firebase deploy --only functions:auditLog`

## 7. Cloud Function — Delete Account

- [ ] 7.1 Creare `functions/src/deleteUserAccount.ts`: Cloud Function HTTP callable (requires auth)
- [ ] 7.2 Implementare: batch delete `users/{uid}/**`, query `collectionGroup('members').where('uid', '==', uid)` e delete dei documenti trovati, scrittura audit log, `admin.auth().deleteUser(uid)`
- [ ] 7.3 Deploy: `firebase deploy --only functions:deleteUserAccount`

## 8. GDPR — Pagina Account Settings

- [ ] 8.1 Creare `src/pages/AccountSettings.tsx` con sezioni: "Esporta i miei dati" e "Elimina account"
- [ ] 8.2 Implementare `exportUserData()` in `src/lib/firestoreSync.ts`: legge `users/{uid}/**`, membership, messaggi inviati; restituisce JSON; il componente lo scarica come file
- [ ] 8.3 Implementare il pulsante "Esporta i miei dati": chiama `exportUserData()` e triggera `URL.createObjectURL` per il download
- [ ] 8.4 Implementare il pulsante "Elimina account": mostra dialog di conferma, poi chiama la Cloud Function `deleteUserAccount`, poi logout
- [ ] 8.5 Aggiungere la rotta `/settings/account` in `App.tsx` (solo per utenti autenticati)
- [ ] 8.6 Aggiungere link "Impostazioni account" nel menu utente (componente header/navbar)

## 9. Verifica & Testing

- [ ] 9.1 Testare le Rules con Firebase Emulator: verificare che un utente non-admin riceva `PERMISSION_DENIED` su write library
- [ ] 9.2 Testare che il join lobby via codice funzioni ancora dopo la restrizione della read rule (task 2.2)
- [ ] 9.3 Testare il rate limiter: inviare 11 messaggi in sequenza rapida e verificare il blocco
- [ ] 9.4 Testare l'export dati: verificare che il JSON scaricato contenga tutti i dati attesi
- [ ] 9.5 Testare il delete account: verificare l'eliminazione di characters, membership e account Auth
- [ ] 9.6 Verificare che l'audit_log venga popolato dopo publish library e delete account
