## MODIFIED Requirements

### Requirement: Creazione lobby
Un utente autenticato SHALL poter creare una nuova lobby specificando un nome. Il sistema genera automaticamente un codice univoco di 6 caratteri alfanumerici. L'utente diventa owner della lobby e viene automaticamente assegnato come GM (`gmUid = creatorUid`).

#### Scenario: Creazione avvenuta con successo
- **WHEN** un utente autenticato invia una richiesta di creazione lobby con un nome valido
- **THEN** il sistema crea la lobby, genera un codice univoco, associa l'utente come owner, imposta `gmUid = creatorUid` e restituisce i dati della lobby incluso il codice

#### Scenario: Nome lobby assente
- **WHEN** un utente tenta di creare una lobby senza specificare il nome
- **THEN** il sistema restituisce un errore di validazione e non crea la lobby

---

### Requirement: Visualizzazione partecipanti
Un membro di una lobby SHALL poter visualizzare la lista dei partecipanti attuali, il loro ruolo (`gm` o `player`), e il personaggio attivo associato (se presente). Il ruolo è derivato confrontando `userId` con `gmUid` della lobby.

#### Scenario: Lista partecipanti restituita
- **WHEN** un membro della lobby richiede la lista dei partecipanti
- **THEN** il sistema restituisce la lista degli utenti con il loro ruolo (`gm` per chi corrisponde a `gmUid`, `player` per tutti gli altri) e, se disponibile, il `characterId` del personaggio attivo

#### Scenario: Accesso da non-membro
- **WHEN** un utente non membro richiede la lista dei partecipanti di una lobby
- **THEN** il sistema restituisce un errore di autorizzazione

---

### Requirement: Abbandono lobby
Un membro non-GM SHALL poter abbandonare una lobby in qualsiasi momento. Il GM non può abbandonare la lobby finché non trasferisce il proprio ruolo GM a un altro membro.

#### Scenario: Membro player lascia la lobby
- **WHEN** un membro con ruolo `player` invia una richiesta di abbandono
- **THEN** il sistema rimuove l'utente dalla lista dei membri della lobby

#### Scenario: GM tenta di abbandonare senza trasferire il ruolo
- **WHEN** il GM di una lobby tenta di abbandonarla senza aver prima trasferito il ruolo GM
- **THEN** il sistema restituisce un errore che indica che deve prima trasferire il ruolo GM a un altro membro

#### Scenario: Owner non-GM tenta di abbandonare senza chiudere
- **WHEN** l'owner di una lobby (che non è più GM) tenta di abbandonarla senza averla prima chiusa
- **THEN** il sistema restituisce un errore che indica che deve prima chiudere la lobby

## ADDED Requirements

### Requirement: Modello dati lobby con gmUid
Il documento `lobbies/{id}` su Firestore SHALL includere il campo `gmUid: string` che identifica l'uid del GM corrente. Il campo SHALL essere impostato al momento della creazione e aggiornabile solo dall'utente il cui uid corrisponde al `gmUid` corrente.

#### Scenario: Campo gmUid presente alla creazione
- **WHEN** una nuova lobby viene creata
- **THEN** il documento Firestore contiene `gmUid` valorizzato con l'uid del creatore

#### Scenario: Firestore rule blocca modifica gmUid da non-GM
- **WHEN** un utente il cui uid non corrisponde a `gmUid` tenta di aggiornare il campo `gmUid`
- **THEN** la security rule nega l'operazione con errore di autorizzazione
