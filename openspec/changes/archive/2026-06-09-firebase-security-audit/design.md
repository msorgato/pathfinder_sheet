## Context

L'app usa Firebase Auth (Google Sign-In) + Firestore come unico backend. Non ci sono Cloud Functions attualmente. Il layer di sicurezza è composto solo da `firestore.rules` (lato server) e da check nel codice React (lato client). Due problemi critici emergono:

1. **Admin check solo frontend** — `src/config/admins.ts` contiene una lista di email hardcoded. La rule `match /library/{document=**}` consente write a qualsiasi utente autenticato; il blocco avviene solo via React Router, bypassabile con Firestore SDK direttamente.
2. **Zero GDPR tooling** — Nessun meccanismo per esportare o cancellare dati personali (email, displayName, messaggi).

Vincoli rilevanti:
- L'app non ha un backend custom (no Node/Express): Cloud Functions è l'unica via per logica server-side
- Firestore non supporta nativamente TTL su documenti (solo TTL policy in preview)
- Firebase Auth non propaga automaticamente la cancellazione account ai documenti Firestore

## Goals / Non-Goals

**Goals:**
- Bloccare write non autorizzati alla library a livello di Firestore Rules (non solo frontend)
- Memorizzare il ruolo admin in Firestore in modo che sia verificabile server-side
- Fornire all'utente una pagina per esportare i propri dati e cancellare l'account
- Aggiungere rate limiting sui messaggi chat per prevenire spam
- Loggare operazioni critiche (publish library, delete account) in una collection audit
- Validare `displayName` e `hidden` flag nei messaggi anche nelle Rules

**Non-Goals:**
- Sostituire Google Sign-In con altri provider
- Aggiungere un ruolo "moderatore" (solo admin + player per ora)
- Validazione server-side degli attribute del Character (fuori scope, dati privati per UID)
- GDPR notice / cookie banner (solo il diritto funzionale all'oblio/export)
- Audit log di tutte le operazioni (solo operazioni critiche: library write, account delete)

## Decisions

### D1 — Admin role in Firestore, non in custom claims

**Scelta:** Salvare `role: 'admin'` nel documento `users/{uid}/profile` in Firestore.

**Alternativa:** Firebase Custom Claims (token JWT) — richiede Admin SDK (Cloud Function) per essere impostata, ma la lettura sarebbe gratuita nelle Rules (`request.auth.token.role == 'admin'`).

**Rationale:** Custom Claims richiedono comunque una Cloud Function per lo *write* iniziale del claim, e l'utente deve fare logout/login per ricevere il token aggiornato. Con Firestore si evita questo delay e si mantiene la stessa logica di `get()` già usata per `isLobbyGM`. La soluzione Firestore è più semplice dato il numero ridotto di admin.

**Trade-off:** Ogni write alla library farà un `get()` extra su `users/{uid}/profile` (costo Firestore lettura). Accettabile con pochi admin e publish occasionali.

---

### D2 — Rate limiting con Firestore Rules (counter su documento) vs Cloud Function

**Scelta:** Cloud Function `onMessageCreate` che verifica il rate (10 msg/min) tramite counter su `users/{uid}/rateLimits/messages`.

**Alternativa:** Regola Firestore con `query().size()` — Firebase Rules non supportano query arbitrarie su subcollection per contare documenti recenti in modo affidabile.

**Rationale:** Le Rules non permettono `count()` nel modo necessario. Una Cloud Function triggered da `onCreate` può fare il check e, se violato, cancellare il messaggio e segnalare. Costo: una Cloud Function invocation per ogni messaggio — accettabile per un'app hobbyistica.

---

### D3 — Eliminazione account: hard delete sincrono vs Cloud Function async

**Scelta:** Cloud Function HTTP callable `deleteUserAccount` che esegue batch delete di tutti i documenti dell'utente e poi cancella l'account Firebase Auth.

**Alternativa:** Fare delete dal frontend direttamente su Firestore (i documenti `users/{uid}/**` sono scrivibili dall'utente) e poi chiamare `user.delete()` da Firebase Auth SDK.

**Rationale:** Il frontend non può accedere a `lobbies/{id}/members/{uid}` di tutte le lobby perché richiederebbe una query `collectionGroup` con filtro `uid` — possibile ma richiede un indice custom. La Cloud Function usa Admin SDK che bypassa le Rules e può fare la query completa. Inoltre, la cancellazione di Firebase Auth account richiede Admin SDK se si vuole garantire atomicità.

---

### D4 — Export dati: client-side vs Cloud Function

**Scelta:** Export generato direttamente nel frontend leggendo le collection a cui l'utente ha già accesso.

**Alternativa:** Cloud Function HTTP callable che aggrega i dati server-side.

**Rationale:** L'utente può già leggere `users/{uid}/**` e i messaggi nelle sue lobby (come membro). Un export client-side non espone più dati di quanto già visibile. Evita una Cloud Function aggiuntiva. La struttura JSON risultante è sufficiente per un export GDPR di un'app hobbyistica.

---

### D5 — displayName validation: solo frontend vs Rules

**Scelta:** Validazione in entrambi i punti: sanitizzazione nel frontend + regola `request.resource.data.displayName.size() <= 40` nelle Rules sui members create/update.

**Rationale:** Defense in depth — il frontend previene una UX brutta, le Rules prevengono bypass via SDK diretto.

## Risks / Trade-offs

- **Cloud Functions cold start** → I primi invii di messaggi dopo un periodo di inattività potrebbero subire un delay di 1-3s prima che la Cloud Function sia pronta. Mitigation: usare Cloud Functions gen2 (warm instances) o accettare il delay.
- **get() admin check su library write** → Aggiunge una lettura Firestore ad ogni `publishToLibrary`. Mitigation: accettabile (operazione rara).
- **Account delete parziale** → Se la Cloud Function fallisce a metà, alcuni documenti potrebbero essere eliminati e altri no. Mitigation: idempotenza del processo (re-try safe, usare batch.delete).
- **Messaggi irrecuperabili post-delete** → Una volta cancellato l'account, i messaggi inviati restano in Firestore ma con `senderId` orfano. Mitigation: documentato come comportamento accettabile (messaggi non personalizzabili, è un log).

## Migration Plan

1. **Fase 1 — Firestore Rules hardening** (nessun downtime, deploy rules con `firebase deploy --only firestore:rules`)
   - Aggiornare `firestore.rules` con `isAdmin()` helper e write library condizionato
   - Aggiungere campo `role: 'admin'` a `users/{uid}/profile` per l'utente admin esistente tramite console Firebase
2. **Fase 2 — Frontend admin role** (deploy standard)
   - Rimuovere `src/config/admins.ts`, caricare ruolo da Firestore in `authStore`
   - Aggiornare `AdminPanel` per usare il ruolo da store
3. **Fase 3 — Cloud Functions**
   - Init Cloud Functions TypeScript nel progetto (`firebase init functions`)
   - Deploy `deleteUserAccount` e `onMessageCreate` (rate limiter)
4. **Fase 4 — AccountSettings page** (deploy standard)
   - Aggiungere rotta `/settings/account` con export data e delete account

**Rollback:** Le Firestore Rules hanno versioning in Firebase Console — rollback immediato in 30 secondi. Le Cloud Functions si rollbackano via `firebase functions:delete`. Il frontend è ricostruito dal branch precedente.

## Open Questions

- **Retention messaggi:** Vogliamo un TTL automatico sui messaggi (es. 90 giorni)? Firebase supporta TTL policy in anteprima. Non incluso in questa change ma da valutare.
- **Ruolo GM nelle Rules:** Attualmente `isLobbyGM` fa un `get()` sulla lobby. Con più get() per admin check, si avvicina al limite di 10 get() per Rules evaluation. Monitorare.
- **Audit log access:** Solo l'admin deve leggere `audit_log`? O l'utente può vedere il proprio audit trail? Assunto: solo admin.
