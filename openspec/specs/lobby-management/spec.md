### Requirement: Creazione lobby
Un utente autenticato SHALL poter creare una nuova lobby specificando un nome. Il sistema genera automaticamente un codice univoco di 6 caratteri alfanumerici. L'utente diventa owner della lobby.

#### Scenario: Creazione avvenuta con successo
- **WHEN** un utente autenticato invia una richiesta di creazione lobby con un nome valido
- **THEN** il sistema crea la lobby, genera un codice univoco, associa l'utente come owner e restituisce i dati della lobby incluso il codice

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
Un membro non-owner SHALL poter abbandonare una lobby in qualsiasi momento. L'owner non può abbandonare la lobby finché non la chiude o trasferisce la proprietà.

#### Scenario: Membro lascia la lobby
- **WHEN** un membro non-owner invia una richiesta di abbandono
- **THEN** il sistema rimuove l'utente dalla lista dei membri della lobby

#### Scenario: Owner tenta di abbandonare senza chiudere
- **WHEN** l'owner di una lobby tenta di abbandonarla senza averla prima chiusa
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
Un membro di una lobby SHALL poter visualizzare la lista dei partecipanti attuali e il loro stato (owner / membro).

#### Scenario: Lista partecipanti restituita
- **WHEN** un membro della lobby richiede la lista dei partecipanti
- **THEN** il sistema restituisce la lista degli utenti con il loro ruolo (owner o membro)

#### Scenario: Accesso da non-membro
- **WHEN** un utente non membro richiede la lista dei partecipanti di una lobby
- **THEN** il sistema restituisce un errore di autorizzazione
