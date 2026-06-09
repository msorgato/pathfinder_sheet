## Why

L'app è esposta a Internet con dati utente reali: qualsiasi account Google autenticato può oggi scrivere nella libreria di talenti/incantesimi senza alcuna validazione server-side, l'accesso admin è protetto solo lato client, e non esistono meccanismi GDPR (diritto all'oblio, export). Serve un piano sistematico di hardening prima che l'app acquisisca utenti reali.

## What Changes

- **Admin role** spostato da lista email hardcoded nel frontend a documento Firestore (`users/{uid}/profile.role`), con validazione nelle Security Rules
- **Firestore Security Rules** aggiornate: write alla library richiede `role == 'admin'` server-side; lobby read ristretto ai soli member o utenti con codice valido; validazione dei campi obbligatori sui messaggi
- **Rate limiting** sui messaggi in chat: max 10 messaggi/minuto per utente tramite Cloud Function o regola Firestore con counter
- **GDPR — eliminazione account**: flusso per cancellare tutti i dati personali (character, membership, messaggi di testo) e account Firebase Auth
- **GDPR — export dati**: pagina che scarica un JSON con tutti i character e i messaggi inviati dall'utente
- **displayName validation**: lunghezza massima 40 caratteri, nessun tag HTML, lato client + regola Firestore
- **Audit log**: Cloud Function che logga operazioni critiche (publish library, delete account) su collection `audit_log` accessibile solo all'admin

## Capabilities

### New Capabilities

- `admin-role-management`: Ruolo admin memorizzato in Firestore e verificato nelle Security Rules; UI admin per promuovere/revocare utenti
- `firestore-rules-hardening`: Revisione completa di `firestore.rules` — library write admin-only, lobby read ristretto, message field validation, displayName length check
- `gdpr-user-rights`: Flusso account settings con "Esporta dati" (JSON download) e "Elimina account" (hard delete di tutti i documenti + Firebase Auth account)
- `rate-limiting-messages`: Throttle messaggi chat a 10/minuto per utente (regola Firestore o Cloud Function)
- `audit-logging`: Cloud Function triggered on write per library e delete-account, salva in `audit_log/{docId}`

### Modified Capabilities

_(nessuna capability esistente con spec cambierà requisiti funzionali — si tratta solo di hardening infrastrutturale)_

## Impact

- `firestore.rules` — riscrittura completa
- `src/config/admins.ts` — eliminato (admin list migrata a Firestore)
- `src/lib/firestoreSync.ts` — `publishToLibrary` condizionato a ruolo admin; aggiunta `deleteUserAccount`, `exportUserData`
- `src/store/authStore.ts` — gestione ruolo admin da Firestore; logout + cleanup
- `src/pages/AdminPanel.tsx` — carica ruolo da Firestore invece di `isAdminEmail()`
- `src/pages/AccountSettings.tsx` _(nuovo)_ — export data, delete account
- `functions/` _(nuovo)_ — Cloud Functions TypeScript: `onLibraryWrite`, `onDeleteAccount`, `throttleMessages`
- Firebase Console: abilitare Cloud Functions, configurare regole di billing alert
