## ADDED Requirements

### Requirement: Pagina Account Settings accessibile dall'utente autenticato
Il sistema SHALL esporre una pagina `/settings/account` raggiungibile dal menu utente, visibile solo agli utenti autenticati.

#### Scenario: Navigazione alla pagina settings
- **WHEN** un utente autenticato clicca su "Impostazioni account" nel menu
- **THEN** viene portato alla pagina `/settings/account`

#### Scenario: Redirect per utenti non autenticati
- **WHEN** un utente non autenticato naviga a `/settings/account`
- **THEN** viene reindirizzato alla pagina di login

---

### Requirement: Export dati personali in formato JSON
Il sistema SHALL consentire all'utente di scaricare un file JSON contenente tutti i propri dati personali: personaggi, impostazioni, elenco lobby a cui appartiene e messaggi inviati dall'utente.

#### Scenario: Export completato con successo
- **WHEN** l'utente clicca "Esporta i miei dati" nella pagina Account Settings
- **THEN** il browser scarica un file `pathfinder-data-{uid}.json` con struttura `{ characters, settings, lobbies, sentMessages }`

#### Scenario: Export con zero dati
- **WHEN** un nuovo utente senza personaggi né lobby clicca "Esporta i miei dati"
- **THEN** il file JSON viene scaricato con array vuoti per ogni sezione

---

### Requirement: Eliminazione account con hard delete di tutti i dati
Il sistema SHALL consentire all'utente di cancellare permanentemente il proprio account. L'operazione SHALL:
1. Eliminare tutti i documenti in `users/{uid}/**`
2. Eliminare il documento membro in ogni lobby a cui appartiene (`lobbies/*/members/{uid}`)
3. Eliminare l'account Firebase Auth
4. Fare logout dal client

I messaggi inviati dall'utente resteranno in Firestore come testo anonimo (il `senderId` diventerà orfano — comportamento accettabile documentato).

#### Scenario: Conferma prima della cancellazione
- **WHEN** l'utente clicca "Elimina account"
- **THEN** appare una dialog di conferma con testo esplicito sulle conseguenze irreversibili

#### Scenario: Cancellazione completata
- **WHEN** l'utente conferma la cancellazione
- **THEN** tutti i documenti Firestore dell'utente vengono eliminati, l'account Firebase Auth viene cancellato, e l'utente viene reindirizzato alla home page come non autenticato

#### Scenario: Errore durante la cancellazione
- **WHEN** la Cloud Function `deleteUserAccount` fallisce parzialmente
- **THEN** l'utente vede un messaggio di errore e può riprovare; l'operazione è idempotente

---

### Requirement: Nessun dato personale visibile dopo la cancellazione
Il sistema SHALL garantire che dopo la cancellazione dell'account, nessun dato riconducibile all'utente (displayName, email, UID come chiave di documento) sia recuperabile tramite le normali API dell'app.

#### Scenario: Membership rimossa da tutte le lobby
- **WHEN** l'account viene cancellato
- **THEN** nessuna lobby mostra l'utente come membro attivo

#### Scenario: Personaggi non più accessibili
- **WHEN** l'account viene cancellato
- **THEN** i documenti `users/{uid}/characters/**` non esistono più in Firestore
