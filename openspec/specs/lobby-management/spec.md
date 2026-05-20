### Requirement: Creazione lobby
Un utente autenticato SHALL poter creare una nuova lobby specificando un nome. Il sistema genera automaticamente un codice univoco di 6 caratteri alfanumerici. L'utente diventa owner della lobby e viene automaticamente assegnato come GM (`gmUid = creatorUid`).

#### Scenario: Creazione avvenuta con successo
- **WHEN** un utente autenticato invia una richiesta di creazione lobby con un nome valido
- **THEN** il sistema crea la lobby, genera un codice univoco, associa l'utente come owner, imposta `gmUid = creatorUid` e restituisce i dati della lobby incluso il codice

#### Scenario: Nome lobby assente
- **WHEN** un utente tenta di creare una lobby senza specificare il nome
- **THEN** il sistema restituisce un errore di validazione e non crea la lobby

### Requirement: Partecipazione a una lobby tramite codice
Un utente autenticato SHALL poter unirsi a una lobby esistente e attiva tramite il suo codice univoco.

#### Scenario: Partecipazione avvenuta con successo
- **WHEN** un utente autenticato inserisce un codice valido di una lobby attiva a cui non appartiene già
- **THEN** il sistema aggiunge l'utente come membro della lobby e restituisce i dati della lobby

#### Scenario: Codice non valido o lobby non trovata
- **WHEN** un utente inserisce un codice che non corrisponde ad alcuna lobby attiva
- **THEN** il sistema restituisce un errore "lobby non trovata"

#### Scenario: Utente già membro
- **WHEN** un utente tenta di unirsi a una lobby di cui è già membro
- **THEN** il sistema restituisce un errore "già membro di questa lobby"

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

### Requirement: Chiusura lobby
L'owner di una lobby SHALL poter disattivarla. Una lobby disattivata non accetta nuovi messaggi né nuovi membri.

#### Scenario: Chiusura avvenuta con successo
- **WHEN** l'owner di una lobby attiva invia una richiesta di chiusura
- **THEN** il sistema imposta la lobby come inattiva e ne notifica i membri in-app

#### Scenario: Tentativo di chiusura da non-owner
- **WHEN** un membro non-owner tenta di chiudere una lobby
- **THEN** il sistema restituisce un errore di autorizzazione

### Requirement: Visualizzazione partecipanti
Un membro di una lobby SHALL poter visualizzare la lista dei partecipanti attuali, il loro ruolo (`gm` o `player`), e il personaggio attivo associato (se presente). Il ruolo è derivato confrontando `userId` con `gmUid` della lobby.

#### Scenario: Lista partecipanti restituita
- **WHEN** un membro della lobby richiede la lista dei partecipanti
- **THEN** il sistema restituisce la lista degli utenti con il loro ruolo (`gm` per chi corrisponde a `gmUid`, `player` per tutti gli altri) e, se disponibile, il `characterId` del personaggio attivo

#### Scenario: Accesso da non-membro
- **WHEN** un utente non membro richiede la lista dei partecipanti di una lobby
- **THEN** il sistema restituisce un errore di autorizzazione

### Requirement: Associazione personaggio attivo al membro
Un membro SHALL poter associare un proprio personaggio alla sessione di lobby scrivendo `characterId` nel proprio documento `LobbyMember` su Firestore. Il campo è opzionale; i flussi senza personaggio attivo SHALL continuare a funzionare normalmente.

#### Scenario: Scrittura characterId su Firestore
- **WHEN** un membro seleziona un personaggio tramite `setActiveCharacter(charId)` su `lobbyStore`
- **THEN** il sistema aggiorna il campo `characterId` nel documento `lobbies/{id}/members/{uid}` e aggiorna `lobbyStore.activeCharacterId`

#### Scenario: Rimozione associazione personaggio
- **WHEN** un membro deseleziona il personaggio attivo (es. passando `null`)
- **THEN** il sistema rimuove o azzera `characterId` nel documento `LobbyMember` e `lobbyStore.activeCharacterId` diventa `null`

#### Scenario: Lobby senza personaggio associato
- **WHEN** un membro partecipa a una lobby senza selezionare alcun personaggio
- **THEN** `characterId` non è presente nel documento `LobbyMember` e tutte le funzionalità di chat testuale funzionano normalmente senza degradi

### Requirement: Modello dati lobby con gmUid
Il documento `lobbies/{id}` su Firestore SHALL includere il campo `gmUid: string` che identifica l'uid del GM corrente. Il campo SHALL essere impostato al momento della creazione e aggiornabile solo dall'utente il cui uid corrisponde al `gmUid` corrente.

#### Scenario: Campo gmUid presente alla creazione
- **WHEN** una nuova lobby viene creata
- **THEN** il documento Firestore contiene `gmUid` valorizzato con l'uid del creatore

#### Scenario: Firestore rule blocca modifica gmUid da non-GM
- **WHEN** un utente il cui uid non corrisponde a `gmUid` tenta di aggiornare il campo `gmUid`
- **THEN** la security rule nega l'operazione con errore di autorizzazione
