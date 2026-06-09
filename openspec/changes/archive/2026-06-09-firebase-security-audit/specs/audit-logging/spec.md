## ADDED Requirements

### Requirement: Log delle operazioni critiche in collection audit_log
Il sistema SHALL scrivere un documento in `audit_log/{docId}` per le seguenti operazioni critiche:
- Pubblicazione di un talento o incantesimo nella library
- Cancellazione di un account utente

Ogni documento di audit SHALL contenere: `action`, `actorUid`, `targetUid` (se applicabile), `targetId` (ID risorsa coinvolta), `timestamp`, `metadata` (dati contestuali aggiuntivi).

#### Scenario: Log generato alla pubblicazione di un talento
- **WHEN** un admin pubblica un talento nella library
- **THEN** viene creato un documento in `audit_log` con `action: 'library.publish'`, `actorUid: {adminUid}`, `targetId: {featId}`, `timestamp`

#### Scenario: Log generato alla cancellazione account
- **WHEN** un utente cancella il proprio account tramite la Cloud Function `deleteUserAccount`
- **THEN** viene creato un documento in `audit_log` con `action: 'account.delete'`, `actorUid: {uid}`, `timestamp`

---

### Requirement: audit_log accessibile solo all'admin
La Firestore Rule per `match /audit_log/{document=**}` SHALL consentire read solo agli utenti con `role: 'admin'`. Nessun utente (inclusi gli admin) può scrivere direttamente su `audit_log` tramite SDK client — le write avvengono solo tramite Cloud Functions con Admin SDK.

#### Scenario: Read negata a utente non admin
- **WHEN** un utente senza `role: 'admin'` tenta di leggere `audit_log`
- **THEN** Firestore restituisce `PERMISSION_DENIED`

#### Scenario: Read consentita all'admin
- **WHEN** un utente con `role: 'admin'` fa una query su `audit_log`
- **THEN** i documenti vengono restituiti correttamente

#### Scenario: Write diretta negata a tutti i client
- **WHEN** qualsiasi client (anche admin) tenta una write diretta su `audit_log/**` tramite SDK
- **THEN** Firestore restituisce `PERMISSION_DENIED`
